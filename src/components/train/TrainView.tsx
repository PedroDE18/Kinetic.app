import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Check,
  Clock,
  Plus,
  Trash2,
  Award,
  Dumbbell,
  AlertCircle,
  X,
  ChevronRight,
  ChevronDown,
  Flame,
  Heart,
  Timer,
  MapPin,
  Gauge,
  Sparkles,
  BookOpen,
  Watch,
  Disc,
  ArrowLeftRight,
  History,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { ActiveWorkoutSession, CompletedWorkout, WorkoutTemplate, ExerciseSet, SetType, ExerciseDefinition } from '../../types';
import {
  computeRestRemainingSeconds,
  extendRestTimer,
  readRestClock,
  startRestTimer,
  activeRestFields,
  clearedRestFields,
  DurableActiveWorkoutSession,
  RestTimerClock,
} from '../../utils/workoutSession';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { ProgramBuilderModal } from './ProgramBuilderModal';
import { CardioLoggerModal } from './CardioLoggerModal';
import { ExerciseAtlasModal } from './ExerciseAtlasModal';
import { HealthSyncModal } from '../sync/HealthSyncModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { playRestTimerCompleteSound, triggerHapticFeedback } from '../../utils/audioHaptics';
import { formatPace, calculateCardioStats, formatDistance, formatDisplayDate, getLocalDateString } from '../../utils/engine';

export function TrainView() {
  const {
    state,
    startWorkout,
    updateActiveWorkout,
    finishActiveWorkout,
    cancelActiveWorkout,
    saveWorkoutTemplate,
    removeCardioSession,
  } = useFitness();
  const { activeWorkout, templates, exercises, completedWorkouts, cardioSessions, profile } = state;

  // View mode tab between Strength and Cardio
  const [trainingTab, setTrainingTab] = useState<'strength' | 'cardio'>('strength');

  // Modals
  const [showProgramBuilder, setShowProgramBuilder] = useState(false);
  const [showCardioLogger, setShowCardioLogger] = useState(false);
  const [showAtlas, setShowAtlas] = useState(false);
  const [showHealthSync, setShowHealthSync] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | undefined>(undefined);
  const [showAllStrengthHistory, setShowAllStrengthHistory] = useState(false);
  const [showAllCardioHistory, setShowAllCardioHistory] = useState(false);

  // Live Elapsed Workout Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Rest Timer — the countdown always derives from a persisted timestamp
  // pair (started-at + total duration) instead of accumulating ticks, so a
  // reload or a throttled background tab converges on the correct remaining
  // time and never restarts from a stale count.
  const [isResting, setIsResting] = useState(false);
  const [restClock, setRestClock] = useState<RestTimerClock | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);

  // Anchor refs for exercise cards (position restore + keyboard navigation).
  const exerciseCardRefs = useRef<Record<number, HTMLElement | null>>({});
  // Session identity already handled for timer/position restore.
  const restoredSessionRef = useRef<string | null>(null);

  // Summary modal state after workout finishes
  const [completedSummary, setCompletedSummary] = useState<CompletedWorkout | null>(null);

  // Discard confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Plate Calculator state
  const [plateCalcTarget, setPlateCalcTarget] = useState<{
    exIdx: number;
    setIdx: number;
    weight: number;
  } | null>(null);

  // Exercise Swap state
  const [swappingExerciseIndex, setSwappingExerciseIndex] = useState<number | null>(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState('');

  const handleSwapExercise = (exIdx: number, newDef: ExerciseDefinition) => {
    if (!activeWorkout) return;
    const updated: ActiveWorkoutSession = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex, idx) => {
        if (idx !== exIdx) return ex;
        return {
          ...ex,
          exerciseId: newDef.id,
          exerciseName: newDef.name,
        };
      }),
    };
    persistSession(updated, {});
    setSwappingExerciseIndex(null);
    setSwapSearchQuery('');
    triggerHapticFeedback([40]);
  };

  // Interaction state: expand a routine card, open a past session
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [historyWorkout, setHistoryWorkout] = useState<CompletedWorkout | null>(null);

  // Historical lookup for last completed performance on an exercise
  const getLastPerformance = (
    exerciseId: string,
    setIndex: number
  ): { weightKg: number; reps: number } | null => {
    for (const prevWorkout of completedWorkouts) {
      const matchEx = prevWorkout.exercises.find((e) => e.exerciseId === exerciseId);
      if (matchEx && matchEx.sets.length > 0) {
        const completedSets = matchEx.sets.filter((s) => s.isCompleted);
        if (completedSets.length > 0) {
          const matchSet = completedSets[setIndex] || completedSets[completedSets.length - 1];
          if (matchSet && matchSet.actualWeightKg > 0 && matchSet.actualReps > 0) {
            return { weightKg: matchSet.actualWeightKg, reps: matchSet.actualReps };
          }
        }
      }
    }
    return null;
  };

  const handleCycleSetType = (exIdx: number, setIdx: number) => {
    if (!activeWorkout) return;
    const currentType = activeWorkout.exercises[exIdx].sets[setIdx].setType || 'normal';
    const sequence: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];
    const nextIdx = (sequence.indexOf(currentType) + 1) % sequence.length;
    const nextType = sequence[nextIdx];
    handleUpdateSetValue(exIdx, setIdx, 'setType', nextType);
  };

  // Workout Elapsed Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (activeWorkout) {
      const startTime = new Date(activeWorkout.startTime).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));

      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Rest Timer Countdown Effect — remaining seconds are recomputed from the
  // persisted timestamp pair on every short tick; background tabs catch up on
  // visibilitychange instead of trusting intervals.
  useEffect(() => {
    if (!isResting || !restClock) return;

    const tick = () => {
      const remaining = computeRestRemainingSeconds(restClock);
      setRestRemaining(remaining);
      if (remaining <= 0) {
        setIsResting(false);
        setRestClock(null);
        playRestTimerCompleteSound();
        triggerHapticFeedback([200, 100, 200]);
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    const onVisibilityChange = () => tick();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isResting, restClock]);

  // Restore timers + exercise position once per session identity. Rechecks on
  // remount (tab switching back) and on a new restored session id — but never
  // on ordinary set edits, which only change the session's contents.
  useEffect(() => {
    if (!activeWorkout) return;
    if (restoredSessionRef.current === activeWorkout.startTime) return;
    restoredSessionRef.current = activeWorkout.startTime;

    const clock = readRestClock(activeWorkout);
    if (clock) {
      const remaining = computeRestRemainingSeconds(clock);
      if (remaining > 0) {
        setRestClock(clock);
        setRestRemaining(remaining);
        setIsResting(true);
      } else {
        // The rest timer expired while the app was closed: strip the stale
        // fields from persistence instead of resurrecting a dead banner.
        clearPersistedRest(activeWorkout);
      }
    } else if (activeWorkout.isTimerRunning) {
      clearPersistedRest(activeWorkout);
    }

    // Position restore: scroll to the last exercise the user was working on.
    const savedIdx = activeWorkout.activeExerciseIndex;
    if (
      typeof savedIdx === 'number' &&
      savedIdx >= 0 &&
      savedIdx < activeWorkout.exercises.length &&
      exerciseCardRefs.current[savedIdx]
    ) {
      const node = exerciseCardRefs.current[savedIdx];
      requestAnimationFrame(() => {
        node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeWorkout?.startTime]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /** Rewrite the session without the durable rest-timer extension fields. */
  const clearPersistedRest = (session: ActiveWorkoutSession) => {
    const plain: ActiveWorkoutSession = {
      templateId: session.templateId,
      name: session.name,
      startTime: session.startTime,
      exercises: session.exercises,
      isTimerRunning: false,
      restTimerSecondsRemaining: 0,
      activeExerciseIndex: session.activeExerciseIndex,
    };
    updateActiveWorkout(plain);
  };

  /** Merge session updates into the durably-restorable shape and persist. */
  const persistSession = (base: ActiveWorkoutSession, patch: Partial<DurableActiveWorkoutSession>) => {
    const durable: DurableActiveWorkoutSession = { ...base, ...patch };
    updateActiveWorkout(durable);
  };

  /** Reset the local rest tracking (used on finish/discard so the next
   * session can't inherit the phantom banner). */
  const stopRestTrackingLocally = () => {
    setIsResting(false);
    setRestClock(null);
    setRestRemaining(0);
  };

  const scrollExerciseCard = (idx: number) => {
    const node = exerciseCardRefs.current[idx];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const heading = node.querySelector<HTMLElement>('h4');
    heading?.focus({ preventScroll: true });
  };

  // Toggle set completion and trigger rest timer
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const updated: ActiveWorkoutSession = {
      ...activeWorkout,
      activeExerciseIndex: exIndex,
      exercises: activeWorkout.exercises.map((ex, eIdx) => {
        if (eIdx !== exIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIndex) return s;
            const willComplete = !s.isCompleted;
            return { ...s, isCompleted: willComplete };
          }),
        };
      }),
    };

    const targetSet = updated.exercises[exIndex].sets[setIndex];
    updateActiveWorkout(updated);

    if (targetSet.isCompleted) {
      const exDef = exercises.find((x) => x.id === updated.exercises[exIndex].exerciseId);
      const clock = startRestTimer(exDef?.defaultRestSeconds || 90);
      if (clock) {
        setRestClock(clock);
        setRestRemaining(clock.durationSeconds);
        setIsResting(true);
        // Persist the timestamp pair so reloads restore the countdown.
        persistSession(updated, { ...activeRestFields(clock), ...clock });
      }
    }
  };

  const handleUpdateSetValue = (
    exIndex: number,
    setIndex: number,
    field: 'actualWeightKg' | 'actualReps' | 'setType',
    val: any
  ) => {
    if (!activeWorkout) return;
    const updated: ActiveWorkoutSession = {
      ...activeWorkout,
      activeExerciseIndex: exIndex,
      exercises: activeWorkout.exercises.map((ex, eIdx) => {
        if (eIdx !== exIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIndex) return s;
            return { ...s, [field]: val };
          }),
        };
      }),
    };
    updateActiveWorkout(updated);
  };

  const handleAddSet = (exIndex: number) => {
    if (!activeWorkout) return;
    const ex = activeWorkout.exercises[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${ex.sets.length + 1}`,
      setNumber: ex.sets.length + 1,
      targetWeightKg: lastSet ? lastSet.actualWeightKg : 60,
      targetReps: lastSet ? lastSet.actualReps : 10,
      actualWeightKg: lastSet ? lastSet.actualWeightKg : 60,
      actualReps: lastSet ? lastSet.actualReps : 10,
      isCompleted: false,
    };

    const updated = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((e, idx) =>
        idx === exIndex ? { ...e, sets: [...e.sets, newSet] } : e
      ),
    };
    updateActiveWorkout(updated);
  };

  const handleFinishWorkout = () => {
    // Reset timer state so the completed workout can't leave a phantom banner
    // behind for the next session; the session itself is cleared by the store.
    stopRestTrackingLocally();
    const completed = finishActiveWorkout();
    if (completed) {
      setCompletedSummary(completed);
    }
  };

  // Cardio stats
  const cardioStats = calculateCardioStats(cardioSessions, profile.unitSystem);

  const getActivityIcon = (act: string) => {
    switch (act) {
      case 'running':
        return '🏃';
      case 'walking':
        return '🚶';
      case 'cycling':
        return '🚴';
      case 'stationary_bike':
        return '🚴‍♂️';
      case 'swimming':
        return '🏊';
      case 'rowing':
        return '🚣';
      case 'stairmaster':
        return '🪜';
      case 'elliptical':
        return '⚡';
      default:
        return '🏃';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. ACTIVE LIVE WORKOUT LOGGING INTERFACE */}
      {/* ======================================================== */}
      {activeWorkout ? (
        <div className="space-y-4">
          {/* Unified Sticky Workout Header + Rest Timer */}
          <div className="sticky top-14 z-20 space-y-2">
            <div className="bg-[var(--color-surface-sunken)] backdrop-blur-md border border-[var(--color-border)] rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span>Live</span>
                </div>
                <h3 className="k-display text-base text-[var(--color-text)] leading-tight mt-0.5 truncate">
                  {activeWorkout.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono font-medium tabular-nums">{formatTimer(elapsedSeconds)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDiscardConfirm(true)}
                  className="min-h-[44px] px-3 py-1.5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] text-xs font-semibold rounded-xl border border-[var(--color-border)] transition-all active:scale-95"
                >
                  Discard
                </button>
                <button
                  onClick={handleFinishWorkout}
                  className="min-h-[44px] px-4 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold text-xs rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Finish
                </button>
              </div>
            </div>

            {/* Rest Timer Drawer / Floating Banner */}
            {isResting && (
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/40 rounded-2xl p-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                      Resting
                    </div>
                    <div
                      className="text-sm font-semibold font-mono text-[var(--color-text)] tabular-nums"
                      role="timer"
                      aria-label={`Rest remaining ${formatTimer(restRemaining)}`}
                    >
                      {formatTimer(restRemaining)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (!restClock) return;
                      const extended = extendRestTimer(restClock, 30);
                      if (!extended) return;
                      setRestClock(extended);
                      setRestRemaining(computeRestRemainingSeconds(extended));
                      if (activeWorkout) {
                        persistSession(activeWorkout, { ...activeRestFields(extended), ...extended });
                      }
                    }}
                    className="min-h-[36px] px-2.5 py-1 bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-muted)] rounded-lg active:scale-95 transition-transform"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => {
                      setIsResting(false);
                      setRestClock(null);
                      // Event handler with a fresh closure: safe to clear the
                      // persisted fields with the current session.
                      if (activeWorkout) persistSession(activeWorkout, clearedRestFields());
                    }}
                    className="min-h-[36px] px-2.5 py-1 bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)] rounded-lg active:scale-95 transition-transform"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Exercise Cards */}
          <div className="space-y-4">
            {activeWorkout.exercises.map((exercise, exIdx) => {
              const def = exercises.find((x) => x.id === exercise.exerciseId);
              return (
                <section
                  key={exercise.exerciseId}
                  ref={(el) => {
                    exerciseCardRefs.current[exIdx] = el;
                  }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 shadow-sm space-y-2.5 scroll-mt-36"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        tabIndex={-1}
                        className="text-sm font-semibold text-[var(--color-text)] focus:outline-none"
                      >
                        {exercise.exerciseName}
                      </h4>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {def?.muscleGroup} • {def?.equipment}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold tabular-nums ${
                        exercise.sets.every((st) => st.isCompleted)
                          ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {exercise.sets.filter((st) => st.isCompleted).length}/{exercise.sets.length} sets
                    </span>

                    {def?.personalRecord && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] tabular-nums">
                        <Award className="w-3 h-3 text-[var(--color-accent)]" />
                        <span>
                          PR: {def.personalRecord.weightKg}kg × {def.personalRecord.reps}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setSwappingExerciseIndex(exIdx)}
                      aria-label={`Swap exercise ${exercise.exerciseName}`}
                      className="min-h-[32px] px-2.5 py-1 bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] rounded-full text-[10px] font-medium flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                      title="Substitute with another exercise from same muscle group"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-[var(--color-accent)]" />
                      <span>Swap</span>
                    </button>

                    {/* Keyboard navigation: jump to the next exercise card. */}
                    {(
                      activeWorkout.exercises[exIdx + 1]
                    ) && (
                      <button
                        type="button"
                        onClick={() => scrollExerciseCard(exIdx + 1)}
                        aria-label={`Jump to next exercise: ${
                          activeWorkout.exercises[exIdx + 1].exerciseName
                        }`}
                        className="min-h-[36px] px-2.5 py-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] rounded-full text-[10px] font-semibold shrink-0 active:scale-95 transition-all"
                      >
                        Next ↓
                      </button>
                    )}
                  </div>

                  {/* Muscle Targeting Badges */}
                  {def && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] pt-0.5">
                      <span className="text-[var(--color-text-subtle)] font-medium">Focus</span>
                      {def.primaryMuscles.map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                      {def.secondaryMuscles && def.secondaryMuscles.length > 0 && (
                        <>
                          <span className="text-[var(--color-text-subtle)] font-medium ml-1">Secondary</span>
                          {def.secondaryMuscles.map((m) => (
                            <span key={m} className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
                              {m}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Sets Column Header */}
                  <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider pb-1 pt-1 border-b border-[var(--color-border)]">
                    <div className="col-span-2 text-center">Set</div>
                    <div className="col-span-4 text-center">Weight (kg)</div>
                    <div className="col-span-3 text-center">Reps</div>
                    <div className="col-span-3 text-right pr-2">Done</div>
                  </div>

                  {/* Sets List */}
                  <div className="space-y-2 pt-1">
                    {exercise.sets.map((set, setIdx) => {
                      const lastPerf = getLastPerformance(exercise.exerciseId, setIdx);
                      const setType = set.setType || 'normal';
                      const setTypeBadge =
                        setType === 'warmup'
                          ? { label: 'W', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' }
                          : setType === 'dropset'
                          ? { label: 'D', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' }
                          : setType === 'failure'
                          ? { label: 'F', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' }
                          : {
                              label: String(set.setNumber),
                              color: 'text-[var(--color-text-muted)] bg-[var(--color-surface)] border-[var(--color-border)]',
                            };

                      return (
                        <div
                          key={set.id}
                          className={`space-y-1.5 p-2 rounded-xl transition-colors ${
                            set.isCompleted
                              ? 'bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30'
                              : 'bg-[var(--color-surface-sunken)] border border-[var(--color-border)]'
                          }`}
                        >
                          <div className="grid grid-cols-12 gap-1 items-center">
                            {/* Set type badge (tap to cycle) */}
                            <div className="col-span-2 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleCycleSetType(exIdx, setIdx)}
                                title={`Set type: ${setType}. Tap to cycle (Normal -> Warmup -> Drop -> Failure)`}
                                className={`w-7 h-7 rounded-lg border text-xs font-black flex items-center justify-center active:scale-90 transition-all ${setTypeBadge.color}`}
                              >
                                {setTypeBadge.label}
                              </button>
                            </div>

                            {/* Weight input with Plate Calculator button */}
                            <div className="col-span-4 flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={set.actualWeightKg === 0 ? '' : set.actualWeightKg}
                                placeholder={lastPerf ? `${lastPerf.weightKg}` : '0'}
                                aria-label={`Weight for set ${set.setNumber} of ${exercise.exerciseName}, kilograms`}
                                onChange={(e) =>
                                  handleUpdateSetValue(
                                    exIdx,
                                    setIdx,
                                    'actualWeightKg',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-14 tabular-nums bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1.5 text-center text-sm font-semibold text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]/70 focus:outline-none focus:border-[var(--color-accent)]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setPlateCalcTarget({
                                    exIdx,
                                    setIdx,
                                    weight: set.actualWeightKg || (lastPerf ? lastPerf.weightKg : 60),
                                  })
                                }
                                title="Open Barbell Plate Calculator"
                                className="p-1 rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors"
                              >
                                <Disc className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Reps input */}
                            <div className="col-span-3 flex justify-center">
                              <input
                                type="number"
                                value={set.actualReps === 0 ? '' : set.actualReps}
                                placeholder={lastPerf ? `${lastPerf.reps}` : '0'}
                                aria-label={`Reps for set ${set.setNumber} of ${exercise.exerciseName}`}
                                onChange={(e) =>
                                  handleUpdateSetValue(
                                    exIdx,
                                    setIdx,
                                    'actualReps',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-12 tabular-nums bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1.5 text-center text-sm font-semibold text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]/70 focus:outline-none focus:border-[var(--color-accent)]"
                              />
                            </div>

                            {/* Complete Checkbox Button */}
                            <div className="col-span-3 flex justify-end pr-1">
                              <button
                                onClick={() => handleToggleSet(exIdx, setIdx)}
                                aria-label={`Toggle set ${set.setNumber}`}
                                className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-all ${
                                  set.isCompleted
                                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm font-semibold'
                                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)]'
                                }`}
                              >
                                <Check className="w-5 h-5 stroke-[3]" />
                              </button>
                            </div>
                          </div>

                          {/* Historical Last Performance Ghost Badge */}
                          {lastPerf && !set.isCompleted && (
                            <div className="flex items-center justify-between px-2 text-[10px] text-[var(--color-text-subtle)] border-t border-[var(--color-border)]/50 pt-1">
                              <span>
                                Prior session: <strong className="text-[var(--color-text)]">{lastPerf.weightKg} kg × {lastPerf.reps}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateSetValue(exIdx, setIdx, 'actualWeightKg', lastPerf.weightKg);
                                  handleUpdateSetValue(exIdx, setIdx, 'actualReps', lastPerf.reps);
                                }}
                                className="text-[var(--color-accent)] hover:underline font-bold"
                              >
                                Match Last
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add set button */}
                  <button
                    onClick={() => handleAddSet(exIdx)}
                    className="min-h-[40px] w-full mt-2 py-1.5 bg-transparent hover:bg-[var(--color-surface-sunken)] border border-dashed border-[var(--color-border)] hover:border-[var(--color-text-subtle)] rounded-xl text-xs font-semibold text-[var(--color-text-subtle)] hover:text-[var(--color-text)] flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. REGULAR TRAINING VIEW: TABS & TEMPLATES / CARDIO */
        /* ======================================================== */
        <div className="space-y-4">
          {/* Top Segment Control & Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            {/* Segment Tab */}
            <div className="grid grid-cols-2 bg-[var(--color-surface)] p-1 rounded-2xl border border-[var(--color-border)]">
              <button
                onClick={() => setTrainingTab('strength')}
                className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  trainingTab === 'strength'
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Strength ({templates.length})</span>
              </button>
              <button
                onClick={() => setTrainingTab('cardio')}
                className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  trainingTab === 'cardio'
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Cardio ({cardioSessions.length})</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowHealthSync(true)}
                title="Sync Apple Health & Garmin"
                aria-label="Sync Wearables & Health"
                className="min-h-[40px] min-w-[40px] px-2.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0"
              >
                <Watch className="w-4 h-4 text-[var(--color-accent)]" />
              </button>

              <button
                onClick={() => setShowAtlas(true)}
                className="min-h-[40px] flex-1 sm:flex-none px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Atlas</span>
              </button>

              {trainingTab === 'strength' ? (
                <button
                  onClick={() => {
                    setEditingTemplate(undefined);
                    setShowProgramBuilder(true);
                  }}
                  className="min-h-[40px] flex-1 sm:flex-none px-3 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Routine</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowCardioLogger(true)}
                  className="min-h-[40px] flex-1 sm:flex-none px-3 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Log Cardio</span>
                </button>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2A. STRENGTH WORKOUT ROUTINES LIST */}
          {/* ======================================================== */}
          {trainingTab === 'strength' ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {templates.map((tmpl) => {
                  // Compute primary muscles targeted in this entire routine
                  const routinePrimaryMuscles = Array.from(
                    new Set(
                      tmpl.exercises.flatMap((item) => {
                        const ex = exercises.find((e) => e.id === item.exerciseId);
                        return ex ? ex.primaryMuscles : [];
                      })
                    )
                  );

                  const isExpanded = expandedTemplateId === tmpl.id;
                  const previewNames = tmpl.exercises
                    .map((item) => {
                      const exDef = exercises.find((x) => x.id === item.exerciseId);
                      return exDef?.name || 'Exercise';
                    });
                  const collapsedPreview =
                    previewNames.slice(0, 3).join(', ') +
                    (previewNames.length > 3 ? ` +${previewNames.length - 3} more` : '');

                  return (
                    <section
                      key={tmpl.id}
                      className="k-card p-4 transition-all hover:border-[var(--color-accent)]/40 space-y-3"
                    >
                      {/* Tappable header — expands the full plan */}
                      <button
                        type="button"
                        onClick={() => setExpandedTemplateId(isExpanded ? null : tmpl.id)}
                        aria-expanded={isExpanded}
                        className="w-full text-left space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="k-section-title">
                            {tmpl.targetSplit} · {tmpl.exercises.length} exercises
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--color-text-subtle)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                        <h4 className="k-display text-lg text-[var(--color-text)]">{tmpl.name}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] leading-snug">
                          {tmpl.description}
                        </p>
                      </button>

                      {/* Collapsed preview — compact text line */}
                      <p className="text-[11px] text-[var(--color-text-subtle)] truncate">
                        {collapsedPreview}
                      </p>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setEditingTemplate(tmpl);
                            setShowProgramBuilder(true);
                          }}
                          className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-semibold rounded-xl border border-[var(--color-border)] active:scale-95 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => startWorkout(tmpl.id)}
                          className="min-h-[44px] py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start</span>
                        </button>
                      </div>

                      {/* Expanded detail — full plan */}
                      {isExpanded && (
                        <div className="border-t border-[var(--color-border)] pt-2.5 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {routinePrimaryMuscles.slice(0, 3).map((muscle) => (
                              <span
                                key={muscle}
                                className="px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-[10px] font-semibold"
                              >
                                {muscle}
                              </span>
                            ))}
                            {routinePrimaryMuscles.length > 3 && (
                              <span className="text-[10px] text-[var(--color-text-subtle)]">
                                +{routinePrimaryMuscles.length - 3}
                              </span>
                            )}
                          </div>

                          <div className="divide-y divide-[var(--color-border)]">
                            {tmpl.exercises.map((item) => {
                              const exDef = exercises.find((x) => x.id === item.exerciseId);
                              return (
                                <div
                                  key={item.exerciseId}
                                  className="py-1.5 flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="font-medium text-[var(--color-text)] truncate">
                                    {exDef?.name || 'Exercise'}
                                  </span>
                                  <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums shrink-0">
                                    {item.defaultSets} sets × {item.defaultReps}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Completed Workouts History */}
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="k-section-title">
                    Strength history ({completedWorkouts.length})
                  </span>
                  <span className="text-[10px] text-[var(--color-text-subtle)]">Auto-saved</span>
                </div>

                {completedWorkouts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--color-text-subtle)]">
                    No completed workouts yet.
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-[var(--color-border)]">
                      {completedWorkouts.slice(0, 4).map((wo) => (
                        <button
                          key={wo.id}
                          type="button"
                          onClick={() => setHistoryWorkout(wo)}
                          className="w-full py-3 flex items-center justify-between gap-2 text-left rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors focus-visible:outline-[var(--color-accent)]"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--color-text)] truncate">{wo.name}</div>
                            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                              {formatDisplayDate(getLocalDateString(new Date(wo.startTime)))} • {' '}
                              {Math.round(wo.durationSeconds / 60)} min • {wo.exercises.length} moves
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-xs font-semibold text-[var(--color-accent)] tabular-nums">
                                {wo.totalVolumeKg.toLocaleString()} kg
                              </div>
                              <span className="text-[10px] text-[var(--color-text-subtle)]">volume</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--color-text-subtle)] shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {completedWorkouts.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllStrengthHistory(true)}
                        className="w-full min-h-[40px] mt-2 py-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-accent)] flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-[var(--color-surface-sunken)]"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>View All Strength History ({completedWorkouts.length} Workouts)</span>
                      </button>
                    )}
                  </>
                )}
              </section>
            </div>
          ) : (
            /* ======================================================== */
            /* 2B. CARDIO TRAINING MODULE */
            /* ======================================================== */
            <div className="space-y-4">
              {/* Cardio Personal Records & Highlights */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Longest Distance PR */}
                <div className="rounded-2xl border border-[var(--color-border)] p-3.5 space-y-1" style={{background:"var(--color-surface)"}}>
                  <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-[10px] font-semibold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Longest Distance</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--color-text)] tabular-nums">
                    {cardioStats.longestDistanceKm > 0
                      ? formatDistance(cardioStats.longestDistanceKm, profile.unitSystem)
                      : '--'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-subtle)]">
                    {cardioStats.longestDistanceActivity
                      ? `Record in ${cardioStats.longestDistanceActivity}`
                      : 'No sessions logged'}
                  </div>
                </div>

                {/* Best Pace PR */}
                <div className="k-card-raised rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--color-text-subtle)] text-[10px] font-semibold uppercase tracking-wider">
                    <Gauge className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Best Pace</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--color-text)] tabular-nums">
                    {cardioStats.bestPaceMinPerKm !== '--:--'
                      ? `${cardioStats.bestPaceMinPerKm} /km`
                      : '--'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-subtle)]">
                    {cardioStats.bestPaceActivity
                      ? `Fastest in ${cardioStats.bestPaceActivity}`
                      : 'No sessions logged'}
                  </div>
                </div>

                {/* Longest Duration */}
                <div className="k-card-raised rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--color-text-subtle)] text-[10px] font-semibold uppercase tracking-wider">
                    <Timer className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Longest Duration</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--color-text)] tabular-nums">
                    {cardioStats.longestDurationMinutes > 0
                      ? `${cardioStats.longestDurationMinutes} mins`
                      : '--'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-subtle)]">Endurance personal best</div>
                </div>

                {/* Total Cardio Distance */}
                <div className="k-card-raised rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--color-text-subtle)] text-[10px] font-semibold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                    <span>Total Distance</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--color-text)] tabular-nums">
                    {formatDistance(cardioStats.totalDistanceKm, profile.unitSystem)}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-subtle)]">
                    {cardioStats.totalSessions} completed sessions
                  </div>
                </div>
              </div>

              {/* Cardio Logged Sessions List */}
              <section className="k-card p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="k-section-title">
                    Recent cardio sessions
                  </span>
                  <button
                    onClick={() => setShowCardioLogger(true)}
                    className="min-h-[36px] text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    Log new
                  </button>
                </div>

                {cardioSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-subtle)] border border-dashed border-[var(--color-border)] rounded-2xl">
                    No cardio sessions logged yet. Tap &quot;Log Cardio&quot; above to add running,
                    cycling, swimming, etc.
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-[var(--color-border)]">
                      {[...cardioSessions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 4)
                        .map((session) => (
                        <div
                          key={session.id}
                          className="py-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center text-xl shrink-0">
                              {getActivityIcon(session.activity || session.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--color-text)] capitalize">
                                  {(session.activity || session.type).replace('_', ' ')}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30">
                                  {session.avgPaceMinPerKm || (session.avgPaceSecPerKm ? formatPace(session.avgPaceSecPerKm, profile.unitSystem) : '--:--')}
                                </span>
                              </div>

                              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span>{session.date}</span>
                                <span>•</span>
                                <span>
                                  {formatDistance(session.distanceKm || 0, profile.unitSystem)} in{' '}
                                  {session.durationMinutes} mins
                                </span>
                                {session.avgHeartRateBpm && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5 text-[var(--color-danger)]">
                                      <Heart className="w-3 h-3 inline" />
                                      {session.avgHeartRateBpm} bpm
                                    </span>
                                  </>
                                )}
                              </div>

                              {session.notes && (
                                <div className="text-[10px] text-[var(--color-text-subtle)] italic mt-0.5">
                                  &quot;{session.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-xs font-bold text-[var(--color-text)]">
                                {session.caloriesBurned} kcal
                              </div>
                              <span className="text-[10px] text-[var(--color-text-subtle)]">burned</span>
                            </div>
                            <button
                              onClick={() => removeCardioSession(session.id)}
                              aria-label="Delete cardio session"
                              className="min-h-[44px] min-w-[36px] flex items-center justify-center text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {cardioSessions.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCardioHistory(true)}
                        className="w-full min-h-[40px] mt-2 py-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-accent)] flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-[var(--color-surface-sunken)]"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>View All Cardio History ({cardioSessions.length} Sessions)</span>
                      </button>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-[var(--color-text)] text-sm">Discard Active Workout?</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Are you sure you want to cancel? Current session progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] rounded-xl text-xs font-semibold text-[var(--color-text-muted)]"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  stopRestTrackingLocally();
                  cancelActiveWorkout();
                  setShowDiscardConfirm(false);
                }}
                className="min-h-[44px] py-2 bg-[var(--color-danger)] hover:bg-[var(--color-danger)] text-[var(--color-text)] font-bold rounded-xl text-xs"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Builder Modal */}
      {showProgramBuilder && (
        <ProgramBuilderModal
          initialTemplate={editingTemplate}
          onClose={() => {
            setShowProgramBuilder(false);
            setEditingTemplate(undefined);
          }}
        />
      )}

      {/* Cardio Logger Modal */}
      {showCardioLogger && <CardioLoggerModal onClose={() => setShowCardioLogger(false)} />}

      {/* Strength History Modal */}
      {showAllStrengthHistory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] block">
                  Workout Archive
                </span>
                <h3 className="text-base font-bold text-[var(--color-text)] mt-0.5">
                  Strength History ({completedWorkouts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllStrengthHistory(false)}
                className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {completedWorkouts.map((wo) => (
                <button
                  key={wo.id}
                  type="button"
                  onClick={() => {
                    setShowAllStrengthHistory(false);
                    setHistoryWorkout(wo);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] transition-all flex items-center justify-between text-left group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                      {wo.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                      {formatDisplayDate(getLocalDateString(new Date(wo.startTime)))} • {Math.round(wo.durationSeconds / 60)} min • {wo.exercises.length} moves
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[var(--color-accent)] tabular-nums">
                        {wo.totalVolumeKg.toLocaleString()} kg
                      </div>
                      <span className="text-[10px] text-[var(--color-text-subtle)]">volume</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-subtle)] group-hover:text-[var(--color-accent)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cardio History Modal */}
      {showAllCardioHistory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] block">
                  Endurance Archive
                </span>
                <h3 className="text-base font-bold text-[var(--color-text)] mt-0.5">
                  Cardio History ({cardioSessions.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCardioHistory(false)}
                className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {[...cardioSessions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-xl shrink-0">
                        {getActivityIcon(session.activity || session.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-text)] capitalize">
                            {(session.activity || session.type).replace('_', ' ')}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30">
                            {session.avgPaceMinPerKm || (session.avgPaceSecPerKm ? formatPace(session.avgPaceSecPerKm, profile.unitSystem) : '--:--')}
                          </span>
                        </div>

                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span>{session.date}</span>
                          <span>•</span>
                          <span>
                            {formatDistance(session.distanceKm || 0, profile.unitSystem)} in {session.durationMinutes} mins
                          </span>
                          {session.avgHeartRateBpm && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-[var(--color-danger)]">
                                <Heart className="w-3 h-3 inline" />
                                {session.avgHeartRateBpm} bpm
                              </span>
                            </>
                          )}
                        </div>
                        {session.notes && (
                          <div className="text-[10px] text-[var(--color-text-subtle)] italic mt-0.5">
                            &quot;{session.notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-[var(--color-text)]">
                          {session.caloriesBurned} kcal
                        </div>
                        <span className="text-[10px] text-[var(--color-text-subtle)]">burned</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCardioSession(session.id)}
                        aria-label="Delete cardio session"
                        className="min-h-[44px] min-w-[36px] flex items-center justify-center text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Targeted Muscle Atlas Modal */}
      {showAtlas && <ExerciseAtlasModal onClose={() => setShowAtlas(false)} />}

      {/* Finished Workout Summary / Past Session Detail Modal */}
      {(completedSummary || historyWorkout) && (
        <WorkoutSummaryModal
          workout={(completedSummary || historyWorkout)!}
          onClose={() => {
            setCompletedSummary(null);
            setHistoryWorkout(null);
          }}
        />
      )}

      {/* Health & Wearable Sync Modal */}
      {showHealthSync && (
        <HealthSyncModal
          isOpen={showHealthSync}
          onClose={() => setShowHealthSync(false)}
        />
      )}

      {/* Plate Calculator Modal */}
      {plateCalcTarget && (
        <PlateCalculatorModal
          initialWeightKg={plateCalcTarget.weight}
          unit={profile.unitSystem === 'imperial' ? 'lbs' : 'kg'}
          onClose={() => setPlateCalcTarget(null)}
          onApplyWeight={(newWt) => {
            handleUpdateSetValue(
              plateCalcTarget.exIdx,
              plateCalcTarget.setIdx,
              'actualWeightKg',
              newWt
            );
            setPlateCalcTarget(null);
          }}
        />
      )}

      {/* Exercise Swap Modal */}
      {swappingExerciseIndex !== null && activeWorkout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] block">
                  Substitute Exercise
                </span>
                <h3 className="text-sm font-bold text-[var(--color-text)] mt-0.5">
                  Replacing: {activeWorkout.exercises[swappingExerciseIndex]?.exerciseName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSwappingExerciseIndex(null);
                  setSwapSearchQuery('');
                }}
                className="p-1 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search replacement exercise..."
                value={swapSearchQuery}
                onChange={(e) => setSwapSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {(() => {
                const currentEx = activeWorkout.exercises[swappingExerciseIndex];
                const currentDef = exercises.find((x) => x.id === currentEx?.exerciseId);
                const candidates = exercises
                  .filter((ex) => ex.id !== currentEx?.exerciseId)
                  .filter((ex) => {
                    if (!swapSearchQuery.trim()) return true;
                    const q = swapSearchQuery.toLowerCase();
                    return (
                      ex.name.toLowerCase().includes(q) ||
                      ex.muscleGroup.toLowerCase().includes(q) ||
                      ex.equipment.toLowerCase().includes(q)
                    );
                  })
                  .sort((a, b) => {
                    const aMatches = currentDef && a.muscleGroup === currentDef.muscleGroup ? 1 : 0;
                    const bMatches = currentDef && b.muscleGroup === currentDef.muscleGroup ? 1 : 0;
                    return bMatches - aMatches;
                  });

                return candidates.map((cand) => {
                  const isSameGroup = currentDef && cand.muscleGroup === currentDef.muscleGroup;
                  return (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => handleSwapExercise(swappingExerciseIndex, cand)}
                      className="w-full text-left p-3 rounded-2xl bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] transition-all flex items-center justify-between group active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                            {cand.name}
                          </span>
                          {isSameGroup && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-bold">
                              Same Muscle
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                          {cand.muscleGroup} • {cand.equipment}
                        </span>
                      </div>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
