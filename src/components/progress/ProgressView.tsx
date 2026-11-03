import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Activity,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Info,
  CheckCircle2,
  Dumbbell,
  Timer,
  Scale,
  Award,
  Flame,
  Heart,
  Gauge,
  MapPin,
  BarChart2,
  Feather,
  Repeat,
  Compass,
  CheckSquare,
  Zap,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import {
  calculateWeightTrend,
  calculateAdaptiveTDEE,
  formatWeight,
  calculateGlobalVolumeHistory,
  calculateRoutineVolumeHistory,
  calculateCardioStats,
  formatPace,
  formatDistance,
  getLocalDateString,
} from '../../utils/engine';
import { getTranslations, resolveInitialLanguage } from '../../utils/i18n';
import { TrendChart } from '../common/TrendChart';

interface ProgressViewProps {
  onOpenWeeklyReview: () => void;
  onOpenWeighInModal: () => void;
}

type ProgressHubTab = 'physical' | 'mind' | 'systems';

export function ProgressView({ onOpenWeeklyReview, onOpenWeighInModal }: ProgressViewProps) {
  const { state } = useFitness();
  const {
    weights,
    loggedFoods,
    profile,
    reviews,
    completedWorkouts,
    cardioSessions,
    templates,
    habits,
    tasks,
    reflections,
    frictionInterventions,
  } = state;

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Main Top-level Hub Tab
  const [hubTab, setHubTab] = useState<ProgressHubTab>('physical');

  // Physical Category Navigation: metabolic | strength | cardio
  const [physicalCategory, setPhysicalCategory] = useState<'metabolic' | 'strength' | 'cardio'>(
    'metabolic'
  );

  // Time range for weight trend
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | 'All'>('1M');

  // Selected routine for routine-specific volume evolution
  const [selectedRoutine, setSelectedRoutine] = useState<string>('all');

  // Trend & Adaptive TDEE calculations
  const weightTrend = useMemo(() => calculateWeightTrend(weights), [weights]);
  const tdeeData = useMemo(
    () => calculateAdaptiveTDEE(weights, loggedFoods, 21),
    [weights, loggedFoods]
  );

  const pendingReview = reviews.find((r) => r.status === 'pending');
  const latestResolvedReview = reviews.find((r) => r.status !== 'pending') || reviews[0];

  // Weight Trend slice
  const filteredPoints = useMemo(() => {
    const days =
      timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 365;
    return weightTrend.slice(-days);
  }, [weightTrend, timeRange]);

  const latestTrend = weightTrend[weightTrend.length - 1];
  const firstFiltered = filteredPoints[0];
  const deltaPeriodKg =
    latestTrend && firstFiltered
      ? Number((latestTrend.trendWeightKg - firstFiltered.trendWeightKg).toFixed(2))
      : 0;

  // Strength Volume Data
  const globalVolumeData = useMemo(
    () => calculateGlobalVolumeHistory(completedWorkouts),
    [completedWorkouts]
  );
  const routineVolumeMap = useMemo(
    () => calculateRoutineVolumeHistory(completedWorkouts),
    [completedWorkouts]
  );

  // Available routines that have data or templates
  const availableRoutineNames = useMemo(() => {
    const fromHistory = Object.keys(routineVolumeMap);
    const fromTemplates = templates.map((t) => t.name);
    return Array.from(new Set([...fromHistory, ...fromTemplates]));
  }, [routineVolumeMap, templates]);

  // Routine-specific data
  const activeRoutineData = useMemo(() => {
    if (selectedRoutine === 'all') return null;
    return routineVolumeMap[selectedRoutine] || [];
  }, [selectedRoutine, routineVolumeMap]);

  // Total volume moved all time
  const totalGlobalVolumeKg = useMemo(
    () => completedWorkouts.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0),
    [completedWorkouts]
  );

  // Cardio Stats
  const cardioStats = useMemo(
    () => calculateCardioStats(cardioSessions, profile.unitSystem),
    [cardioSessions, profile.unitSystem]
  );

  // Mind Analytics
  const mindStats = useMemo(() => {
    const morningCount = reflections.filter((r) => r.type === 'morning').length;
    const eveningCount = reflections.filter((r) => r.type === 'evening').length;
    const freeformCount = reflections.filter((r) => r.type === 'freeform').length;

    // Last 30 days reflection dates
    const uniqueDates = new Set(reflections.map((r) => r.date));
    const now = new Date();
    let daysReflectedPast30 = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = getLocalDateString(d);
      if (uniqueDates.has(ds)) {
        daysReflectedPast30++;
      }
    }

    const consistencyRate = Math.round((daysReflectedPast30 / 30) * 100);

    return {
      total: reflections.length,
      morningCount,
      eveningCount,
      freeformCount,
      daysReflectedPast30,
      consistencyRate,
    };
  }, [reflections]);

  // Systems & Habits Analytics
  const systemsStats = useMemo(() => {
    const totalHabits = habits.length;
    const now = new Date();

    // 7-day completion rate across all habits
    let totalChecksPossible = totalHabits * 7;
    let actualChecks = 0;

    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      last7Days.push(getLocalDateString(d));
    }

    habits.forEach((h) => {
      last7Days.forEach((dateStr) => {
        if (h.completedDates.includes(dateStr)) {
          actualChecks++;
        }
      });
    });

    const weeklyRate =
      totalChecksPossible > 0 ? Math.round((actualChecks / totalChecksPossible) * 100) : 0;

    // Longest current streak
    let bestCurrentStreak = 0;
    habits.forEach((h) => {
      let streak = 0;
      let checkDate = new Date(now);
      while (true) {
        const ds = getLocalDateString(checkDate);
        if (h.completedDates.includes(ds)) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
      if (streak > bestCurrentStreak) bestCurrentStreak = streak;
    });

    // Friction interventions
    const activeFriction = frictionInterventions.filter(
      (f) => f.status === 'active' || f.status === 'experimenting'
    ).length;
    const completedFriction = frictionInterventions.filter((f) => f.status === 'mastered').length;

    // Tasks throughput
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const pendingTasks = tasks.filter((t) => !t.isCompleted).length;

    return {
      weeklyRate,
      bestCurrentStreak,
      activeFriction,
      completedFriction,
      completedTasks,
      pendingTasks,
    };
  }, [habits, frictionInterventions, tasks]);

  const lang = profile.language || resolveInitialLanguage();
  const t = getTranslations(lang);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="px-1 pt-1 pb-0.5">
        <h1 className="stoic-title text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t.progress.title}
        </h1>
      </div>

      {/* Primary Hub Tabs: Physical · Mind · Systems */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <button
          onClick={() => setHubTab('physical')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            hubTab === 'physical'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t.progress.physical}</span>
        </button>

        <button
          onClick={() => setHubTab('mind')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            hubTab === 'mind'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Feather className="w-3.5 h-3.5" />
          <span>{t.progress.contemplative}</span>
        </button>

        <button
          onClick={() => setHubTab('systems')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            hubTab === 'systems'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>{t.progress.systems}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PHYSICAL TRAJECTORY HUB */}
      {/* ========================================================================= */}
      {hubTab === 'physical' && (
        <div className="space-y-4">
          {/* Physical Sub-category Pills */}
          <div className="grid grid-cols-3 bg-[var(--color-surface)] p-1 rounded-2xl border border-[var(--color-border)] shadow-xs">
            <button
              onClick={() => setPhysicalCategory('metabolic')}
              className={`min-h-[38px] py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                physicalCategory === 'metabolic'
                  ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] shadow-xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Weight & TDEE</span>
            </button>

            <button
              onClick={() => setPhysicalCategory('strength')}
              className={`min-h-[38px] py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                physicalCategory === 'strength'
                  ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] shadow-xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Strength</span>
            </button>

            <button
              onClick={() => setPhysicalCategory('cardio')}
              className={`min-h-[38px] py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                physicalCategory === 'cardio'
                  ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] shadow-xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Cardio</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* METABOLIC & WEIGHT TREND */}
          {/* ======================================================== */}
          {physicalCategory === 'metabolic' && (
            <div className="space-y-4">
              {/* Adaptive Expenditure (TDEE) Hero Card */}
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-xs">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Adaptive Expenditure</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-[var(--color-text)]">
                        {tdeeData.estimatedTdee}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                        kcal / day (TDEE)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--color-surface-raised)] text-[var(--color-text)] border border-[var(--color-border)]">
                      <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
                      {Math.round(tdeeData.confidenceScore * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Metabolic Comparison Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] mb-3">
                  <div>
                    <span className="text-[var(--color-text-subtle)] block text-[10px] uppercase font-semibold">
                      Current Intake Target
                    </span>
                    <span className="font-bold text-[var(--color-text)]">
                      {profile.targets.calories} kcal/day
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-subtle)] block text-[10px] uppercase font-semibold">
                      Logged Daily Avg
                    </span>
                    <span className="font-bold text-[var(--color-text)]">
                      {tdeeData.avgDailyIntake} kcal/day
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Calculated via metabolic mass balance using real logged intake vs. smoothed scale
                  trend. Current weekly rate is{' '}
                  <span className="font-semibold text-[var(--color-text)]">
                    {tdeeData.weeklyTrendDeltaKg > 0
                      ? `+${tdeeData.weeklyTrendDeltaKg}`
                      : tdeeData.weeklyTrendDeltaKg}{' '}
                    kg/week
                  </span>
                  .
                </p>

                {/* Open Weekly Review Action */}
                <button
                  onClick={onOpenWeeklyReview}
                  className="min-h-[44px] mt-4 w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
                >
                  <span>
                    {pendingReview ? 'Review Proposed Calorie Target' : 'View Latest Weekly Check-In'}
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </section>

              {/* Weight Trend & Scale Readings Dual Plot */}
              <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                      Body weight & trend
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-black text-[var(--color-text)] tabular-nums">
                        {latestTrend
                          ? formatWeight(latestTrend.trendWeightKg, profile.unitSystem)
                          : '--'}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({deltaPeriodKg > 0 ? `+${deltaPeriodKg}` : deltaPeriodKg} kg in period)
                      </span>
                    </div>
                  </div>

                  {/* Time Range Selector */}
                  <div className="flex bg-[var(--color-surface-sunken)] rounded-xl p-1 border border-[var(--color-border)] text-[10px] font-bold">
                    {(['1M', '3M', '6M', 'All'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`min-h-[28px] px-2.5 py-0.5 rounded-lg transition-all ${
                          timeRange === r
                            ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-xs'
                            : 'text-[var(--color-text-subtle)]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <DualWeightChart points={filteredPoints} />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] inline-block" />
                      EWMA Trend
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-text-muted)] opacity-50 inline-block" />
                      Raw Scale
                    </span>
                  </div>

                  <button
                    onClick={onOpenWeighInModal}
                    className="text-xs text-[var(--color-accent)] font-semibold hover:underline"
                  >
                    + Record Weigh-in
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* STRENGTH VOLUME PROGRESSION */}
          {/* ======================================================== */}
          {physicalCategory === 'strength' && (
            <div className="space-y-4">
              <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Strength Volume Progression
                  </span>
                  <span className="text-xs font-bold text-[var(--color-accent)]">
                    {totalGlobalVolumeKg.toLocaleString()} kg lifted all-time
                  </span>
                </div>

                {availableRoutineNames.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSelectedRoutine('all')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all ${
                        selectedRoutine === 'all'
                          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                      }`}
                    >
                      All Sessions ({completedWorkouts.length})
                    </button>
                    {availableRoutineNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => setSelectedRoutine(name)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all ${
                          selectedRoutine === name
                            ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                            : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}

                <VolumeProgressionChart
                  data={selectedRoutine === 'all' ? globalVolumeData : activeRoutineData || []}
                />
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* CARDIO STATS */}
          {/* ======================================================== */}
          {physicalCategory === 'cardio' && (
            <div className="space-y-4">
              <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Cardio Performance PRs
                  </span>
                  <span className="text-xs font-bold text-[var(--color-accent)]">
                    {cardioStats.totalSessions} sessions logged
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] text-center">
                    <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                      Longest Dist
                    </span>
                    <span className="text-sm font-black text-[var(--color-text)] block">
                      {cardioStats.longestDistanceKm > 0
                        ? formatDistance(cardioStats.longestDistanceKm, profile.unitSystem)
                        : '--'}
                    </span>
                  </div>

                  <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] text-center">
                    <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                      Best Pace
                    </span>
                    <span className="text-sm font-black text-[var(--color-text)] block">
                      {cardioStats.bestPaceMinPerKm !== '--:--'
                        ? `${cardioStats.bestPaceMinPerKm} /km`
                        : '--'}
                    </span>
                  </div>

                  <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] text-center">
                    <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                      Longest Time
                    </span>
                    <span className="text-sm font-black text-[var(--color-text)] block">
                      {cardioStats.longestDurationMinutes > 0
                        ? `${cardioStats.longestDurationMinutes}m`
                        : '--'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Sessions List */}
              <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
                <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  Cardio History
                </span>

                {cardioSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">
                    No cardio sessions logged yet. Log runs, walks, or cycling in the Body tab.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {cardioSessions.map((session) => (
                      <div key={session.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--color-text)] capitalize">
                              {(session.activity || session.type).replace('_', ' ')}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text)] font-semibold border border-[var(--color-border)]">
                              {session.avgPaceMinPerKm ||
                                (session.avgPaceSecPerKm
                                  ? formatPace(session.avgPaceSecPerKm, profile.unitSystem)
                                  : '--:--')}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                            {session.date} • {formatDistance(session.distanceKm || 0, profile.unitSystem)} in{' '}
                            {session.durationMinutes} mins
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-[var(--color-text)]">
                            {session.caloriesBurned} kcal
                          </div>
                          {session.avgHeartRateBpm && (
                            <span className="text-[10px] text-red-500 font-medium">
                              {session.avgHeartRateBpm} bpm
                            </span>
                          )}
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

      {/* ========================================================================= */}
      {/* 2. CONTEMPLATIVE CONSISTENCY HUB */}
      {/* ========================================================================= */}
      {hubTab === 'mind' && (
        <div className="space-y-4">
          {/* Consistency Overview Card */}
          <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <Feather className="w-4 h-4" />
                <span>Contemplative Cadence</span>
              </div>
              <span className="text-xs font-bold text-[var(--color-text)]">
                {mindStats.consistencyRate}% last 30d
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Morning Intentions
                </span>
                <span className="text-lg font-black text-[var(--color-text)] block">
                  {mindStats.morningCount}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">Logged</span>
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Evening Audits
                </span>
                <span className="text-lg font-black text-[var(--color-text)] block">
                  {mindStats.eveningCount}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">Logged</span>
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Active Days
                </span>
                <span className="text-lg font-black text-[var(--color-text)] block">
                  {mindStats.daysReflectedPast30} / 30
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">Days</span>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              In Stoic psychology, consistent evening review without guilt is the single highest leverage
              mechanism for cognitive clarity and self-command.
            </p>
          </section>

          {/* Recent Contemplative Extracts */}
          <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
              Recent Reflection Insights
            </span>

            {reflections.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">
                No reflections logged yet. Visit the Mind tab to begin your first morning reflection.
              </div>
            ) : (
              <div className="space-y-2.5">
                {reflections.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[var(--color-text)] capitalize">
                        {r.type} Reflection
                      </span>
                      <span className="text-[var(--color-text-muted)]">{r.date}</span>
                    </div>
                    {r.freeformContent ? (
                      <p className="text-xs text-[var(--color-text)] line-clamp-2 italic">
                        "{r.freeformContent}"
                      </p>
                    ) : r.promptAnswers ? (
                      <p className="text-xs text-[var(--color-text)] line-clamp-2 italic">
                        "{Object.values(r.promptAnswers)[0] || 'Reflective entry'}"
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SYSTEMS & HABITS CONSISTENCY HUB */}
      {/* ========================================================================= */}
      {hubTab === 'systems' && (
        <div className="space-y-4">
          {/* Habits Consistency Overview Card */}
          <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <Repeat className="w-4 h-4" />
                <span>Habit Systems Execution</span>
              </div>
              <span className="text-xs font-bold text-[var(--color-text)]">
                {systemsStats.weeklyRate}% 7d completion
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Active Habits
                </span>
                <span className="text-lg font-black text-[var(--color-text)] block">
                  {habits.length}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">Configured</span>
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Peak Streak
                </span>
                <span className="text-lg font-black text-[var(--color-text)] block">
                  {systemsStats.bestCurrentStreak}d
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">Unbroken</span>
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Tasks Done
                </span>
                <span className="text-lg font-black text-[var(--color-text)] block">
                  {systemsStats.completedTasks}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">
                  {systemsStats.pendingTasks} pending
                </span>
              </div>
            </div>

            {/* Individual Habit Streaks */}
            <div className="space-y-2 pt-1 border-t border-[var(--color-border)]">
              {habits.map((h) => {
                const isDoneToday = h.completedDates.includes(todayStr);
                return (
                  <div
                    key={h.id}
                    className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--color-text)]">{h.title}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {h.completedDates.length} total completions • {h.area}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isDoneToday
                          ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                          : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {isDoneToday ? 'Done Today' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Friction Engineering Status */}
          <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Behavioral Friction Interventions</span>
              </span>
              <span className="text-xs font-bold text-[var(--color-text)]">
                {systemsStats.activeFriction} Active
              </span>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Environment design is superior to willpower. Reducing friction makes desirable virtues
              inevitable; adding deliberate friction neutralizes reactive impulses.
            </p>

            <div className="space-y-2">
              {frictionInterventions.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--color-text)]">{f.targetBehavior}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] capitalize">
                      {f.actionType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{f.mechanism}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// SVG Volume Progression Line/Bar Chart Component using Tokenized TrendChart
function VolumeProgressionChart({
  data,
}: {
  data: { date: string; volumeKg: number; workoutName?: string }[];
}) {
  const chartData = data.map((d) => ({
    xLabel: d.date.length >= 10 ? d.date.slice(5) : d.date,
    primaryValue: d.volumeKg,
    unit: 'kg',
  }));

  return (
    <TrendChart
      title="Workout Volume Progression"
      data={chartData}
      primaryLabel="Volume"
      emptyMessage="Log at least 2 sessions to see volume progression curves..."
      height={150}
    />
  );
}

// Dual Plot Weight Chart Component (Scatter + Smooth Curve) using Tokenized TrendChart
function DualWeightChart({
  points,
}: {
  points: { actualWeightKg: number; trendWeightKg: number; date: string }[];
}) {
  const chartData = points.map((p) => ({
    xLabel: p.date.length >= 10 ? p.date.slice(5) : p.date,
    primaryValue: p.trendWeightKg,
    secondaryValue: p.actualWeightKg,
    unit: 'kg',
  }));

  return (
    <TrendChart
      title="Scale Weight vs Trend"
      data={chartData}
      primaryLabel="Trend (EWMA)"
      secondaryLabel="Raw Scale"
      emptyMessage="Collecting more weigh-ins for chart..."
      height={150}
    />
  );
}
