import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRestRemainingSeconds,
  extendRestTimer,
  startRestTimer,
  isRestFinished,
  readRestClock,
  sanitizeLoadedActiveWorkout,
  activeRestFields,
  clearedRestFields,
} from './workoutSession';

const BASE_MS = 1_700_000_000_000; // fixed "now" for deterministic tests

test('rest remaining derives from timestamps, not interval accumulation', () => {
  const clock = { startedAtMs: BASE_MS, durationSeconds: 90 };
  assert.equal(computeRestRemainingSeconds(clock, BASE_MS), 90);
  assert.equal(computeRestRemainingSeconds(clock, BASE_MS + 30_000), 60);
  // expired clamps at zero (no negative countdown)
  assert.equal(computeRestRemainingSeconds(clock, BASE_MS + 120_000), 0);
  assert.equal(isRestFinished(clock, BASE_MS + 120_000), true);
  assert.equal(isRestFinished(clock, BASE_MS + 10_000), false);
});

test('rest timer math tolerates drift/backgrounding because it recomputes from clock', () => {
  // A tab sleeps for 45 s and wakes: remaining must reflect missed wall time.
  const clock = { startedAtMs: BASE_MS, durationSeconds: 90 };
  assert.equal(computeRestRemainingSeconds(clock, BASE_MS + 45_123), 45); // floor of elapsed
  // Interval-free recomputation after a long sleep converges to expiry.
  assert.equal(computeRestRemainingSeconds(clock, BASE_MS + 500_000), 0);
});

test('startRestTimer rejects dead values, positive durations only', () => {
  assert.equal(startRestTimer(0, BASE_MS), null);
  assert.equal(startRestTimer(-5, BASE_MS), null);
  assert.equal(startRestTimer(NaN, BASE_MS), null);
  assert.equal(startRestTimer(Infinity, BASE_MS), null);
  const valid = startRestTimer(60.9, BASE_MS);
  assert.deepEqual(valid, { startedAtMs: BASE_MS, durationSeconds: 60 }); // floored
});

test('extendRestTimer re-bases the clock so the addition is exact', () => {
  const clock = { startedAtMs: BASE_MS, durationSeconds: 90 };
  // After 30 s elapsed, remaining is 60. +30 s must now show 90 from new base.
  const now = BASE_MS + 30_000;
  const extended = extendRestTimer(clock, 30, now)!;
  assert.deepEqual(extended, { startedAtMs: now, durationSeconds: 90 });
  // +30 with 0 remaining still yields 30 s.
  const drained = extendRestTimer({ startedAtMs: BASE_MS, durationSeconds: 30 }, 30, now)!;
  assert.deepEqual(drained, { startedAtMs: now, durationSeconds: 30 });
  // Non-positive/NaN extra is a no-op (same clock).
  assert.deepEqual(extendRestTimer(clock, 0, now), clock);
  assert.deepEqual(extendRestTimer(clock, NaN, now), clock);
});

test('readRestClock only accepts coherent, running timers', () => {
  assert.equal(readRestClock(null), null);
  const session: any = {
    name: 'W',
    startTime: new Date(BASE_MS - 600_000).toISOString(),
    exercises: [],
    isTimerRunning: true,
    restTimerSecondsRemaining: 90,
    restTimerStartedAtMs: BASE_MS - 20_000,
    restTimerDurationSeconds: 90,
  };
  const clock = readRestClock(session)!;
  assert.equal(clock.startedAtMs, BASE_MS - 20_000);
  // Not running → no clock.
  assert.equal(readRestClock({ ...session, isTimerRunning: false }), null);
  // Missing timestamp pair → no clock.
  const { restTimerStartedAtMs, ...withoutClock } = session;
  assert.equal(readRestClock(withoutClock), null);
  // Corrupt pair → no clock.
  assert.equal(readRestClock({ ...session, restTimerDurationSeconds: NaN }), null);
});

test('sanitize keeps a healthy session and canonicalizes timestamps', () => {
  const now = BASE_MS;
  const raw = {
    templateId: 'tpl-1',
    name: 'Push Day',
    startTime: new Date(now - 1_200_000).toISOString(), // 20 min ago
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Bench Press',
        sets: [
          { id: 's1', setNumber: 1, targetWeightKg: 80, targetReps: 10, actualWeightKg: 80, actualReps: 10, isCompleted: true },
          { id: 's2', setNumber: 2, targetWeightKg: 80, targetReps: 10, actualWeightKg: 0, actualReps: 0, isCompleted: false },
        ],
      },
      { exerciseId: 'ex-2', exerciseName: 'Row', sets: [] },
    ],
    isTimerRunning: false,
    restTimerSecondsRemaining: 0,
    activeExerciseIndex: 0,
  };
  const result = sanitizeLoadedActiveWorkout(raw, now);
  assert.equal(result.session?.exercises.length, 2);
  assert.equal(result.session?.exercises[0].sets[0].isCompleted, true);
  assert.equal(result.session?.exercises[0].sets[1].actualWeightKg, 0);
  assert.equal(result.session?.activeExerciseIndex, 0);
  assert.equal(
    result.session?.startTime,
    new Date(new Date(raw.startTime).getTime()).toISOString()
  );
});

test('sanitize rejects phantom sessions: malformed, empty, breach-of-reality', () => {
  const now = BASE_MS;
  // null / non-object
  assert.equal(sanitizeLoadedActiveWorkout(null, now).session, null);
  assert.equal(sanitizeLoadedActiveWorkout('garbage', now).session, null);
  // No start time
  assert.equal(sanitizeLoadedActiveWorkout({ name: 'W', exercises: [] }, now).session, null);
  // Unparseable start time
  assert.equal(
    sanitizeLoadedActiveWorkout(
      { name: 'W', startTime: 'not-a-date', exercises: [{ exerciseId: 'a', sets: [] }] },
      now
    ).session,
    null
  );
  // Start time absurdly in the future (corrupt record / clock skew)
  const phantom = {
    name: 'W',
    startTime: new Date(now + 30 * 60_000).toISOString(), // 30 min ahead
    exercises: [{ exerciseId: 'a', exerciseName: 'X', sets: [] }],
  };
  assert.equal(sanitizeLoadedActiveWorkout(phantom, now).session, null);
  // Zero exercises after pruning → phantom
  assert.equal(
    sanitizeLoadedActiveWorkout(
      { name: 'W', startTime: new Date(now - 1000).toISOString(), exercises: [{ sets: [] }] },
      now
    ).session,
    null
  );
});

test('sanitize prunes garbage exercise rows without dropping the session', () => {
  const now = BASE_MS;
  const raw = {
    name: 'W',
    startTime: new Date(now - 600_000).toISOString(),
    exercises: [
      { exerciseId: 'ok-1', exerciseName: 'Press', sets: [{ setNumber: 1, actualWeightKg: 50, actualReps: 5, isCompleted: true }] },
      null, // garbage row
      { exerciseId: 'ok-2', sets: [{}, { bogus: true }, null] }, // exercises without ids are dropped; set rows without ids are pruned unless numeric
      'not-an-object',
    ],
    isTimerRunning: false,
    restTimerSecondsRemaining: 0,
  };
  const result = sanitizeLoadedActiveWorkout(raw, now);
  assert.equal(result.session?.exercises.length, 2);
  assert.equal(result.session?.exercises[0].sets.length, 1);
  // Sets missing ids get synthetic ids so React keys and toggles still work
  const prunedSecond = result.session!.exercises[1];
  assert.ok(prunedSecond.sets.every((s) => typeof s.id === 'string' && s.id.length > 0));
  assert.equal(result.changed, true);
});

test('sanitize clamps incoherent set numbers and numeric fields', () => {
  const now = BASE_MS;
  const raw = {
    name: 'W',
    startTime: new Date(now - 600_000).toISOString(),
    exercises: [
      {
        exerciseId: 'amp',
        exerciseName: 'Clamp',
        sets: [
          { setNumber: -3, actualWeightKg: NaN, actualReps: Infinity, isCompleted: false, targetWeightKg: 50, targetReps: 5 },
          { setNumber: 2, actualWeightKg: 9e9, actualReps: 1e9, isCompleted: false }, // absurd magnitudes clamp
        ],
      },
    ],
    isTimerRunning: false,
    restTimerSecondsRemaining: 0,
  };
  const session = sanitizeLoadedActiveWorkout(raw, now).session!;
  const sets = session.exercises[0].sets;
  assert.equal(sets[0].setNumber, 1);
  assert.equal(sets[0].actualWeightKg, 0);
  assert.equal(sets[0].actualReps, 0);
  assert.equal(sets[0].targetReps, 5);
  assert.equal(sets[1].actualWeightKg, 1000); // clamped ceiling
  assert.equal(sets[1].actualReps, 10000);
});

test('sanitize clears an expired rest timer persisted pre-reload', () => {
  const now = BASE_MS;
  const raw = {
    name: 'W',
    startTime: new Date(now - 3_600_000).toISOString(),
    exercises: [{ exerciseId: 'a', exerciseName: 'Squat', sets: [] }],
    isTimerRunning: true,
    restTimerSecondsRemaining: 90,
    restTimerStartedAtMs: now - 300_000, // started 5 min ago, 90 s duration → long expired
    restTimerDurationSeconds: 90,
    activeExerciseIndex: 7, // out of range for single-exercise session
  };
  const result = sanitizeLoadedActiveWorkout(raw, now);
  const session = result.session!;
  assert.equal(session.isTimerRunning, true); // coherence kept at load; TrainView clears on restore-tick
  const clock = readRestClock(session)!;
  assert.equal(computeRestRemainingSeconds(clock, now), 0); // expired at restore time
  // Out-of-range saved position clamps into the valid range (first exercise).
  assert.equal(session.activeExerciseIndex, 0);
});

test('sanitize rejects an incoherent rest clock (started before the workout)', () => {
  const now = BASE_MS;
  const startMs = now - 60_000;
  const raw = {
    name: 'W',
    startTime: new Date(startMs).toISOString(),
    exercises: [{ exerciseId: 'a', exerciseName: 'Press', sets: [] }],
    isTimerRunning: true,
    restTimerSecondsRemaining: 90,
    restTimerStartedAtMs: startMs - 500_000, // before the workout existed
    restTimerDurationSeconds: 90,
  };
  const result = sanitizeLoadedActiveWorkout(raw, now);
  assert.equal(result.changed, true);
  assert.equal(readRestClock(result.session), null);
  assert.equal(result.session?.isTimerRunning, false);
});

test('activeRestFields / clearedRestFields round-trip through readRestClock', () => {
  const clock = { startedAtMs: BASE_MS, durationSeconds: 75 };
  const active = {
    isTimerRunning: true,
    restTimerSecondsRemaining: 75,
    restTimerStartedAtMs: clock.startedAtMs,
    restTimerDurationSeconds: clock.durationSeconds,
  };
  assert.deepEqual(readRestClock(active as never), clock);
  const cleared = clearedRestFields();
  assert.deepEqual(readRestClock({ ...cleared } as never), null);
});
