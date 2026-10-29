import type { ActiveWorkoutSession } from '../types';

/**
 * Durable session extensions for Kinetic's active workout.
 *
 * `ActiveWorkoutSession` (src/types.ts) already carries `isTimerRunning`,
 * `restTimerSecondsRemaining` and `activeExerciseIndex`, but a bare
 * "seconds remaining" number cannot survive reloads: intervals drift, throttle
 * in background tabs, and vanish on remount. These extension fields store the
 * rest timer as a timestamp pair (started at + total duration) so the remaining
 * time is always *derived* from the wall clock, never accumulated by intervals.
 */
export interface DurableActiveWorkoutSession extends ActiveWorkoutSession {
  /** Epoch ms when the current rest period started. */
  restTimerStartedAtMs?: number;
  /** Total planned rest in seconds for the period started at `restTimerStartedAtMs`. */
  restTimerDurationSeconds?: number;
}

/**
 * A defensive copy of a session loaded from local persistence. Used for the
 * object that is written back to state after sanitization so the TS surface
 * carries the optional extension fields.
 */
export type RestorableActiveWorkout = ActiveWorkoutSession;

export interface RestTimerClock {
  startedAtMs: number;
  durationSeconds: number;
}

/**
 * Compute the remaining rest time in (whole, clamped) seconds purely from a
 * timestamp pair. Interval ticks only refresh the display; they never
 * accumulate state, so the countdown stays correct across reloads/background
 * throttling as long as the wall clock is right.
 */
export function computeRestRemainingSeconds(
  clock: RestTimerClock,
  nowMs: number = Date.now()
): number {
  if (!isFiniteNumber(clock.startedAtMs) || !isFiniteNumber(clock.durationSeconds)) return 0;
  const elapsedMs = nowMs - clock.startedAtMs;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  return Math.max(0, Math.floor(clock.durationSeconds) - elapsedSeconds);
}

/**
 * A rest period is finished once the wall clock passes the planned end.
 * Derived from the timestamp so backgrounded tabs converge on wake.
 */
export function isRestFinished(clock: RestTimerClock, nowMs: number = Date.now()): boolean {
  return computeRestRemainingSeconds(clock, nowMs) <= 0;
}

/**
 * Start a fresh rest period: returns either null (timer off) or the timestamp
 * pair to persist on the session.
 */
export function startRestTimer(durationSeconds: number, nowMs: number = Date.now()): RestTimerClock | null {
  const duration = Math.floor(durationSeconds);
  if (!isFiniteNumber(duration) || duration <= 0) return null;
  return { startedAtMs: nowMs, durationSeconds: duration };
}

/**
 * "+30 s" style extension. Returns a NEW clock whose cleared remaining time is
 * exactly `currentRemainingSeconds + extraSeconds` from `nowMs` — i.e. the
 * started-at timestamp is re-based so the addition is exact and independent of
 * drift accumulated so far.
 */
export function extendRestTimer(
  clock: RestTimerClock,
  extraSeconds: number,
  nowMs: number = Date.now()
): RestTimerClock | null {
  if (!isFiniteNumber(extraSeconds) || extraSeconds <= 0) return clock;
  const currentRemaining = computeRestRemainingSeconds(clock, nowMs);
  const duration = Math.min(3600, Math.floor(currentRemaining + Math.floor(extraSeconds)));
  if (duration <= 0) return null;
  return { startedAtMs: nowMs, durationSeconds: duration };
}

export interface RestTimerSessionFields {
  isTimerRunning: boolean;
  restTimerSecondsRemaining: number;
}

/** Session fields to persist for an active rest period. */
export function activeRestFields(clock: RestTimerClock): RestTimerSessionFields {
  return {
    isTimerRunning: true,
    restTimerSecondsRemaining: clock.durationSeconds,
  };
}

/** Session fields to persist once the rest is over/skipped. */
export function clearedRestFields(): RestTimerSessionFields {
  return { isTimerRunning: false, restTimerSecondsRemaining: 0 };
}

/** Extract the persisted rest clock (if valid) from a session-in-state. */
export function readRestClock(session: ActiveWorkoutSession | null): RestTimerClock | null {
  const durable = session as DurableActiveWorkoutSession | null;
  if (!durable) return null;
  const { restTimerStartedAtMs, restTimerDurationSeconds, isTimerRunning } = durable;
  if (!isTimerRunning) return null;
  if (typeof restTimerStartedAtMs !== 'number' || typeof restTimerDurationSeconds !== 'number') {
    return null;
  }
  if (
    !isFiniteNumber(restTimerStartedAtMs) ||
    !isFiniteNumber(restTimerDurationSeconds) ||
    restTimerDurationSeconds <= 0
  ) {
    return null;
  }
  return { startedAtMs: restTimerStartedAtMs, durationSeconds: restTimerDurationSeconds };
}

/**
 * Parameters for sanitizing an active workout restored from persistence.
 */
export interface SanitizeActiveWorkoutResult {
  /** The cleaned session to use, or null when the record is unusable (phantom). */
  session: ActiveWorkoutSession | null;
  /** True when sanitization altered the record (informative for tests/logs). */
  changed: boolean;
}

const MAX_START_TIME_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Validate an active workout loaded from local persistence.
 *
 * Guards against phantom sessions (e.g. corrupted writes, or stale records
 * where the finish action never landed): malformed exercises/sets are pruned,
 * implausible start times reject the whole session, and an expired rest timer
 * is cleared. The returned object is always a plain re-shaped copy — never the
 * parsed original — so unexpected persisted fields cannot leak into state.
 */
export function sanitizeLoadedActiveWorkout(
  raw: unknown,
  nowMs: number = Date.now()
): SanitizeActiveWorkoutResult {
  let changed = false;
  if (!raw || typeof raw !== 'object') return { session: null, changed: true };

  const source = raw as ActiveWorkoutSession & Record<string, unknown>;

  // ---- startTime ----
  const startTime = typeof source.startTime === 'string' ? source.startTime : '';
  const startMs = new Date(startTime).getTime();
  if (!startTime || !isFiniteNumber(startMs)) {
    return { session: null, changed: true };
  }
  if (startMs - nowMs > MAX_START_TIME_TOLERANCE_MS) {
    // A start time in the future beyond tolerance is a corrupted/clock-skewed
    // record: treat as phantom rather than showing a nonsensical timer.
    return { session: null, changed: true };
  }

  // ---- exercises ----
  const rawExercises = Array.isArray(source.exercises) ? source.exercises : [];
  const exercises = rawExercises
    .map((rawEx) => {
      if (!rawEx || typeof rawEx !== 'object') return null;
      const ex = rawEx as ActiveWorkoutSession['exercises'][number] & Record<string, unknown>;
      if (typeof ex.exerciseId !== 'string' || !ex.exerciseId) return null;
      const rawSets = Array.isArray(ex.sets) ? ex.sets : [];
      const sets = rawSets
        .map((rawSet) => {
          if (!rawSet || typeof rawSet !== 'object') return null;
          const s = rawSet as ActiveWorkoutSession['exercises'][number]['sets'][number] &
            Record<string, unknown>;
          const weight = toClampedNumber(s.actualWeightKg, 0, 1000);
          const reps = toClampedNumber(s.actualReps, 0, 10000);
          const targetWeight = toClampedNumber(s.targetWeightKg, 0, 1000);
          const targetReps = toClampedNumber(s.targetReps, 0, 10000);
          return {
            id: typeof s.id === 'string' && s.id ? s.id : `set-restored-${Math.random().toString(36).slice(2, 10)}`,
            setNumber: toClampedNumber(s.setNumber, 1, 1000),
            targetWeightKg: targetWeight,
            targetReps: targetReps,
            actualWeightKg: weight,
            actualReps: reps,
            isCompleted: s.isCompleted === true,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const exerciseName =
        typeof ex.exerciseName === 'string' && ex.exerciseName.trim() ? ex.exerciseName : 'Exercise';
      if (rawSets.length !== sets.length || exerciseName !== ex.exerciseName) changed = true;
      return { exerciseId: ex.exerciseId, exerciseName, sets };
    })
    .filter((ex): ex is NonNullable<typeof ex> => ex !== null);

  if (rawExercises.length !== exercises.length) changed = true;
  if (exercises.length === 0) {
    // A session without exercises cannot be meaningfully resumed.
    return { session: null, changed: true };
  }

  // ---- rest timer persisted fields ----
  let isTimerRunning = source.isTimerRunning === true;
  let restTimerSecondsRemaining = toClampedNumber(source.restTimerSecondsRemaining, 0, 3600);
  if (restTimerSecondsRemaining === 0 && isTimerRunning !== false) {
    isTimerRunning = false;
    changed = true;
  }

  // Extension fields carried through only when coherent.
  const rawStartedAtMs = source.restTimerStartedAtMs;
  const rawDurationSeconds = source.restTimerDurationSeconds;
  let restTimerStartedAtMs: number | undefined;
  let restTimerDurationSeconds: number | undefined;
  if (rawStartedAtMs !== undefined || rawDurationSeconds !== undefined) {
    const coherent =
      isFiniteNumber(rawStartedAtMs) &&
      isFiniteNumber(rawDurationSeconds) &&
      rawDurationSeconds > 0 &&
      rawStartedAtMs >= startMs;
    if (coherent) {
      restTimerStartedAtMs = rawStartedAtMs;
      restTimerDurationSeconds = rawDurationSeconds;
    } else {
      isTimerRunning = false;
      changed = true;
    }
  }

  const session: DurableActiveWorkoutSession = {
    templateId: typeof source.templateId === 'string' ? source.templateId : undefined,
    name:
      typeof source.name === 'string' && source.name.trim() ? source.name : 'Restored Workout',
    startTime: new Date(startMs).toISOString(), // canonicalize the persisted timestamp
    exercises,
    isTimerRunning,
    restTimerSecondsRemaining,
  };
  if (restTimerStartedAtMs !== undefined) session.restTimerStartedAtMs = restTimerStartedAtMs;
  if (restTimerDurationSeconds !== undefined) session.restTimerDurationSeconds = restTimerDurationSeconds;

  const activeIdx = toClampedNumber(source.activeExerciseIndex, 0, Math.max(0, exercises.length - 1));
  if (typeof source.activeExerciseIndex === 'number' && isFiniteNumber(source.activeExerciseIndex)) {
    if (activeIdx !== source.activeExerciseIndex || activeIdx > exercises.length - 1) changed = true;
    if (activeIdx <= exercises.length - 1) session.activeExerciseIndex = activeIdx;
  } else if (source.activeExerciseIndex !== undefined) {
    changed = true;
  }

  if (
    session.name !== source.name ||
    session.startTime !== source.startTime ||
    session.isTimerRunning !== source.isTimerRunning ||
    session.restTimerSecondsRemaining !== source.restTimerSecondsRemaining
  ) {
    changed = true;
  }

  return { session, changed };
}

/** Snapshot of the data a finished workout summarizes, for pure reuse/tests. */
export function hasMeaningfulContent(session: ActiveWorkoutSession): boolean {
  return session.exercises.some((ex) => ex.sets.some((s) => s.isCompleted));
}

function toClampedNumber(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!isFiniteNumber(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
