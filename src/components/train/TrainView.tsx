import React, { useState, useEffect } from 'react';
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
  Flame,
  Heart,
  Timer,
  MapPin,
  Gauge,
  Sparkles,
  BookOpen,
  Watch,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { ActiveWorkoutSession, CompletedWorkout, WorkoutTemplate, ExerciseSet } from '../../types';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { ProgramBuilderModal } from './ProgramBuilderModal';
import { CardioLoggerModal } from './CardioLoggerModal';
import { ExerciseAtlasModal } from './ExerciseAtlasModal';
import { HealthSyncModal } from '../sync/HealthSyncModal';
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

  // Live Elapsed Workout Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Rest Timer
  const [restSeconds, setRestSeconds] = useState(90);
  const [isResting, setIsResting] = useState(false);

  // Summary modal state after workout finishes
  const [completedSummary, setCompletedSummary] = useState<CompletedWorkout | null>(null);

  // Discard confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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

  // Rest Timer Countdown Effect
  useEffect(() => {
    let restInterval: any = null;
    if (isResting && restSeconds > 0) {
      restInterval = setInterval(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restSeconds <= 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(restInterval);
  }, [isResting, restSeconds]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle set completion and trigger rest timer
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const updated: ActiveWorkoutSession = {
      ...activeWorkout,
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
      setRestSeconds(exDef?.defaultRestSeconds || 90);
      setIsResting(true);
    }
  };

  const handleUpdateSetValue = (
    exIndex: number,
    setIndex: number,
    field: 'actualWeightKg' | 'actualReps',
    val: number
  ) => {
    if (!activeWorkout) return;
    const updated: ActiveWorkoutSession = {
      ...activeWorkout,
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
                    <div className="text-sm font-semibold font-mono text-[var(--color-text)] tabular-nums">
                      {formatTimer(restSeconds)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRestSeconds((s) => s + 30)}
                    className="min-h-[36px] px-2.5 py-1 bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-muted)] rounded-lg active:scale-95 transition-transform"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => setIsResting(false)}
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
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--color-text)]">{exercise.exerciseName}</h4>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {def?.muscleGroup} • {def?.equipment}
                      </span>
                    </div>

                    {def?.personalRecord && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] tabular-nums">
                        <Award className="w-3 h-3 text-[var(--color-accent)]" />
                        <span>
                          PR: {def.personalRecord.weightKg}kg × {def.personalRecord.reps}
                        </span>
                      </div>
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
                    {exercise.sets.map((set, setIdx) => (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded-xl transition-colors ${
                          set.isCompleted
                            ? 'bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30'
                            : 'bg-[var(--color-surface-sunken)] border border-[var(--color-border)]'
                        }`}
                      >
                        <div className="col-span-2 text-center text-xs font-extrabold text-[var(--color-text-muted)]">
                          {set.setNumber}
                        </div>

                        {/* Weight input */}
                        <div className="col-span-4 flex justify-center">
                          <input
                            type="number"
                            step="0.5"
                            value={set.actualWeightKg}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                exIdx,
                                setIdx,
                                'actualWeightKg',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 tabular-nums bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1.5 text-center text-sm font-semibold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                          />
                        </div>

                        {/* Reps input */}
                        <div className="col-span-3 flex justify-center">
                          <input
                            type="number"
                            value={set.actualReps}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                exIdx,
                                setIdx,
                                'actualReps',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-12 tabular-nums bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1.5 text-center text-sm font-semibold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
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
                    ))}
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowHealthSync(true)}
                title="Sync Apple Health & Garmin"
                className="min-h-[40px] px-2.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Watch className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span className="hidden sm:inline">Sync Watch</span>
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

                  return (
                    <section
                      key={tmpl.id}
                      className="k-card transition-all hover:border-[var(--color-accent)]/40 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                              {tmpl.targetSplit}
                            </span>
                            <span className="text-[var(--color-text-subtle)] text-xs">•</span>
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {tmpl.exercises.length} exercises
                            </span>
                          </div>
                          <h4 className="k-display text-lg text-[var(--color-text)]">{tmpl.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTemplate(tmpl);
                              setShowProgramBuilder(true);
                            }}
                            className="min-h-[44px] px-3 py-2 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs font-semibold rounded-xl border border-[var(--color-border)] active:scale-95 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => startWorkout(tmpl.id)}
                            className="min-h-[44px] px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Start</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-text-muted)]">{tmpl.description}</p>

                      {/* Targeted Muscles Breakdown */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mr-1">
                          Muscles:
                        </span>
                        {routinePrimaryMuscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="px-2 py-1 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-[10px] font-semibold"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>

                      {/* Exercises Preview Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--color-border)]">
                        {tmpl.exercises.map((item) => {
                          const exDef = exercises.find((x) => x.id === item.exerciseId);
                          return (
                            <span
                              key={item.exerciseId}
                              className="px-2 py-1 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] font-medium"
                            >
                              {exDef?.name || 'Exercise'} ({item.defaultSets}×{item.defaultReps})
                            </span>
                          );
                        })}
                      </div>
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
                  <div className="divide-y divide-[var(--color-border)]">
                    {completedWorkouts.map((wo) => (
                      <div key={wo.id} className="py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text)] truncate">{wo.name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                            {formatDisplayDate(getLocalDateString(new Date(wo.startTime)))} • {' '}
                            {Math.round(wo.durationSeconds / 60)} min • {wo.exercises.length} moves
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-[var(--color-accent)] tabular-nums">
                            {wo.totalVolumeKg.toLocaleString()} kg
                          </div>
                          <span className="text-[10px] text-[var(--color-text-subtle)]">volume</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="divide-y divide-[var(--color-border)]">
                    {cardioSessions.map((session) => (
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

      {/* Targeted Muscle Atlas Modal */}
      {showAtlas && <ExerciseAtlasModal onClose={() => setShowAtlas(false)} />}

      {/* Finished Workout Summary Modal */}
      {completedSummary && (
        <WorkoutSummaryModal
          workout={completedSummary}
          onClose={() => setCompletedSummary(null)}
        />
      )}

      {/* Health & Wearable Sync Modal */}
      {showHealthSync && (
        <HealthSyncModal
          isOpen={showHealthSync}
          onClose={() => setShowHealthSync(false)}
        />
      )}
    </div>
  );
}
