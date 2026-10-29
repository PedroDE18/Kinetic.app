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
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { ActiveWorkoutSession, CompletedWorkout, WorkoutTemplate, ExerciseSet } from '../../types';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { ProgramBuilderModal } from './ProgramBuilderModal';
import { CardioLoggerModal } from './CardioLoggerModal';
import { ExerciseAtlasModal } from './ExerciseAtlasModal';
import { formatPace, calculateCardioStats, formatDistance } from '../../utils/engine';

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
            <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-3xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  <span>Live Workout</span>
                </div>
                <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                  {activeWorkout.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono font-medium">{formatTimer(elapsedSeconds)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDiscardConfirm(true)}
                  className="min-h-[44px] px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs font-semibold rounded-xl border border-zinc-800 transition-all active:scale-95"
                >
                  Discard
                </button>
                <button
                  onClick={handleFinishWorkout}
                  className="min-h-[44px] px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Finish
                </button>
              </div>
            </div>

            {/* Rest Timer Drawer / Floating Banner */}
            {isResting && (
              <div className="bg-zinc-950 border border-teal-500/60 rounded-2xl p-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                      Rest Interval
                    </div>
                    <div className="text-sm font-black font-mono text-white">
                      {formatTimer(restSeconds)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRestSeconds((s) => s + 30)}
                    className="min-h-[36px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => setIsResting(false)}
                    className="min-h-[36px] px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-xs font-bold text-teal-300 rounded-lg"
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
                  className="bg-zinc-900/95 border border-zinc-800/90 rounded-3xl p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{exercise.exerciseName}</h4>
                      <span className="text-[11px] text-zinc-400">
                        {def?.muscleGroup} • {def?.equipment}
                      </span>
                    </div>

                    {def?.personalRecord && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400">
                        <Award className="w-3 h-3 text-teal-400" />
                        <span>
                          PR: {def.personalRecord.weightKg}kg × {def.personalRecord.reps}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Muscle Targeting Badges */}
                  {def && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] pt-0.5">
                      <span className="text-zinc-500 font-semibold">Primary:</span>
                      {def.primaryMuscles.map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.2 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold"
                        >
                          {m}
                        </span>
                      ))}
                      {def.secondaryMuscles && def.secondaryMuscles.length > 0 && (
                        <>
                          <span className="text-zinc-500 font-semibold ml-1">Secondary:</span>
                          {def.secondaryMuscles.map((m) => (
                            <span key={m} className="px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400">
                              {m}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Sets Column Header */}
                  <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider pb-1 pt-1 border-b border-zinc-800">
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
                            ? 'bg-teal-950/30 border border-teal-500/20'
                            : 'bg-zinc-950/60 border border-zinc-850'
                        }`}
                      >
                        <div className="col-span-2 text-center text-xs font-extrabold text-zinc-400">
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
                            className="w-18 bg-zinc-900 border border-zinc-700 rounded-lg py-1 text-center text-xs font-bold text-white focus:outline-none focus:border-teal-500"
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
                            className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg py-1 text-center text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        {/* Complete Checkbox Button */}
                        <div className="col-span-3 flex justify-end pr-1">
                          <button
                            onClick={() => handleToggleSet(exIdx, setIdx)}
                            aria-label={`Toggle set ${set.setNumber}`}
                            className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-all ${
                              set.isCompleted
                                ? 'bg-teal-400 text-zinc-950 shadow-sm scale-105 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
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
                    className="min-h-[38px] w-full mt-2 py-1.5 bg-zinc-950/80 hover:bg-zinc-800 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1 transition-all"
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
            <div className="grid grid-cols-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setTrainingTab('strength')}
                className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  trainingTab === 'strength'
                    ? 'bg-zinc-800 text-teal-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Strength ({templates.length})</span>
              </button>
              <button
                onClick={() => setTrainingTab('cardio')}
                className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  trainingTab === 'cardio'
                    ? 'bg-zinc-800 text-teal-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Cardio ({cardioSessions.length})</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAtlas(true)}
                className="min-h-[40px] flex-1 sm:flex-none px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Muscle Atlas</span>
              </button>

              {trainingTab === 'strength' ? (
                <button
                  onClick={() => {
                    setEditingTemplate(undefined);
                    setShowProgramBuilder(true);
                  }}
                  className="min-h-[40px] flex-1 sm:flex-none px-3 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Routine</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowCardioLogger(true)}
                  className="min-h-[40px] flex-1 sm:flex-none px-3 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
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
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm transition-all hover:border-zinc-700 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                              {tmpl.targetSplit}
                            </span>
                            <span className="text-zinc-600 text-xs">•</span>
                            <span className="text-[11px] text-zinc-400">
                              {tmpl.exercises.length} exercises
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5">{tmpl.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTemplate(tmpl);
                              setShowProgramBuilder(true);
                            }}
                            className="min-h-[44px] px-2.5 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => startWorkout(tmpl.id)}
                            className="min-h-[44px] px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Start</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400">{tmpl.description}</p>

                      {/* Targeted Muscles Breakdown */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
                          Muscles:
                        </span>
                        {routinePrimaryMuscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-bold"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>

                      {/* Exercises Preview Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/80">
                        {tmpl.exercises.map((item) => {
                          const exDef = exercises.find((x) => x.id === item.exerciseId);
                          return (
                            <span
                              key={item.exerciseId}
                              className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 font-medium"
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
              <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Strength History ({completedWorkouts.length})
                  </h4>
                  <span className="text-[10px] text-zinc-500">Auto-saved</span>
                </div>

                {completedWorkouts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No completed workouts yet.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {completedWorkouts.map((wo) => (
                      <div key={wo.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-zinc-200">{wo.name}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {new Date(wo.startTime).toLocaleDateString()} •{' '}
                            {Math.round(wo.durationSeconds / 60)} mins • {wo.exercises.length}{' '}
                            movements
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-teal-400">
                            {wo.totalVolumeKg.toLocaleString()} kg
                          </div>
                          <span className="text-[10px] text-zinc-500">total volume</span>
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>Longest Distance</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {cardioStats.longestDistanceKm > 0
                      ? formatDistance(cardioStats.longestDistanceKm, profile.unitSystem)
                      : '--'}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {cardioStats.longestDistanceActivity
                      ? `Record in ${cardioStats.longestDistanceActivity}`
                      : 'No sessions logged'}
                  </div>
                </div>

                {/* Best Pace PR */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    <Gauge className="w-3.5 h-3.5 text-teal-400" />
                    <span>Best Pace</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {cardioStats.bestPaceMinPerKm !== '--:--'
                      ? `${cardioStats.bestPaceMinPerKm} /km`
                      : '--'}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {cardioStats.bestPaceActivity
                      ? `Fastest in ${cardioStats.bestPaceActivity}`
                      : 'No sessions logged'}
                  </div>
                </div>

                {/* Longest Duration */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    <Timer className="w-3.5 h-3.5 text-teal-400" />
                    <span>Longest Duration</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {cardioStats.longestDurationMinutes > 0
                      ? `${cardioStats.longestDurationMinutes} mins`
                      : '--'}
                  </div>
                  <div className="text-[10px] text-zinc-500">Endurance personal best</div>
                </div>

                {/* Total Cardio Distance */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total Distance</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {formatDistance(cardioStats.totalDistanceKm, profile.unitSystem)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {cardioStats.totalSessions} completed sessions
                  </div>
                </div>
              </div>

              {/* Cardio Logged Sessions List */}
              <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Recent Cardio Sessions
                  </h4>
                  <button
                    onClick={() => setShowCardioLogger(true)}
                    className="text-xs font-bold text-teal-400 hover:text-teal-300"
                  >
                    + Log New
                  </button>
                </div>

                {cardioSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                    No cardio sessions logged yet. Tap &quot;Log Cardio&quot; above to add running,
                    cycling, swimming, etc.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {cardioSessions.map((session) => (
                      <div
                        key={session.id}
                        className="py-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                            {getActivityIcon(session.activity || session.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white capitalize">
                                {(session.activity || session.type).replace('_', ' ')}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30">
                                {session.avgPaceMinPerKm || (session.avgPaceSecPerKm ? formatPace(session.avgPaceSecPerKm, profile.unitSystem) : '--:--')}
                              </span>
                            </div>

                            <div className="text-[11px] text-zinc-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>{session.date}</span>
                              <span>•</span>
                              <span>
                                {formatDistance(session.distanceKm || 0, profile.unitSystem)} in{' '}
                                {session.durationMinutes} mins
                              </span>
                              {session.avgHeartRateBpm && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-rose-400">
                                    <Heart className="w-3 h-3 inline" />
                                    {session.avgHeartRateBpm} bpm
                                  </span>
                                </>
                              )}
                            </div>

                            {session.notes && (
                              <div className="text-[10px] text-zinc-500 italic mt-0.5">
                                &quot;{session.notes}&quot;
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-xs font-bold text-zinc-200">
                              {session.caloriesBurned} kcal
                            </div>
                            <span className="text-[10px] text-zinc-500">burned</span>
                          </div>
                          <button
                            onClick={() => removeCardioSession(session.id)}
                            aria-label="Delete cardio session"
                            className="min-h-[44px] min-w-[36px] flex items-center justify-center text-zinc-600 hover:text-rose-400 transition-colors"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Discard Active Workout?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to cancel? Current session progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="min-h-[44px] py-2 bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  cancelActiveWorkout();
                  setShowDiscardConfirm(false);
                }}
                className="min-h-[44px] py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
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
    </div>
  );
}
