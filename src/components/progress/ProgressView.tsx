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
} from '../../utils/engine';

interface ProgressViewProps {
  onOpenWeeklyReview: () => void;
  onOpenWeighInModal: () => void;
}

export function ProgressView({ onOpenWeeklyReview, onOpenWeighInModal }: ProgressViewProps) {
  const { state } = useFitness();
  const { weights, loggedFoods, profile, reviews, completedWorkouts, cardioSessions, templates } =
    state;

  // Top sub-tab selector
  const [activeCategory, setActiveCategory] = useState<'metabolic' | 'strength' | 'cardio'>(
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

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Category Navigation Pills */}
      <div className="grid grid-cols-3 bg-[var(--color-surface)] p-1 rounded-2xl border border-[var(--color-border)]">
        <button
          onClick={() => setActiveCategory('metabolic')}
          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeCategory === 'metabolic'
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Weight & TDEE</span>
        </button>

        <button
          onClick={() => setActiveCategory('strength')}
          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeCategory === 'strength'
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Strength Volume</span>
        </button>

        <button
          onClick={() => setActiveCategory('cardio')}
          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeCategory === 'cardio'
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Cardio Stats</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. METABOLIC & WEIGHT TREND TAB */}
      {/* ======================================================== */}
      {activeCategory === 'metabolic' && (
        <div className="space-y-4">
          {/* Adaptive Expenditure (TDEE) Hero Card */}
          <section className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-subtle)] text-[10px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Adaptive Expenditure</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[var(--color-text)]">{tdeeData.estimatedTdee}</span>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">kcal / day (TDEE)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--color-accent)] text-[var(--color-accent)] border border-[var(--color-accent)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                  {Math.round(tdeeData.confidenceScore * 100)}% Confidence
                </span>
              </div>
            </div>

            {/* Metabolic Comparison Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] mb-3">
              <div>
                <span className="text-[var(--color-text-subtle)] block text-[10px] uppercase font-semibold">
                  Current Intake Target
                </span>
                <span className="font-bold text-[var(--color-text)]">{profile.targets.calories} kcal/day</span>
              </div>
              <div>
                <span className="text-[var(--color-text-subtle)] block text-[10px] uppercase font-semibold">
                  Logged Daily Avg
                </span>
                <span className="font-bold text-[var(--color-text)]">{tdeeData.avgDailyIntake} kcal/day</span>
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
              className="min-h-[44px] mt-4 w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <span>
                {pendingReview ? 'Review Proposed Calorie Target' : 'View Latest Weekly Check-In'}
              </span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </section>

          {/* Weight Trend & Scale Readings Dual Plot */}
          <section className="k-card p-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="k-section-title">
                  Body weight & trend
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="k-display text-xl text-[var(--color-text)] tabular-nums">
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
                      timeRange === r ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-text-subtle)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Chart Canvas */}
            <div className="h-48 w-full pt-2">
              <DualWeightChart points={filteredPoints} />
            </div>

            {/* Chart Legend */}
            <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[var(--color-accent)] inline-block" />
                <span>Smoothed Trend (EWMA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                <span>Scale Readings</span>
              </div>
            </div>

            <button
              onClick={onOpenWeighInModal}
              className="min-h-[38px] w-full mt-3 py-1.5 bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
            >
              + Record New Weigh-in
            </button>
          </section>

          {/* Waist & Body Composition Section */}
          <section className="k-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="k-section-title">
                Waist circumference
              </span>
              <span className="text-xs font-bold text-[var(--color-accent)]">
                {latestTrend?.waistCm ? `${latestTrend.waistCm} cm` : '--'}
              </span>
            </div>

            <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Body composition calculations are estimates derived from weight changes and waist
                metrics. Water retention and muscle glycogen fluctuate daily and should not be
                confused with fat shifts.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STRENGTH VOLUME & ROUTINE PROGRESSION TAB */}
      {/* ======================================================== */}
      {activeCategory === 'strength' && (
        <div className="space-y-4">
          {/* Global Volume Hero Banner */}
          <section className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-subtle)] text-[10px] font-semibold uppercase tracking-wider">
                  <BarChart2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Global Training Volume</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[var(--color-text)]">
                    {totalGlobalVolumeKg.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">kg total lifted</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--color-accent)] text-[var(--color-accent)] border border-[var(--color-accent)]">
                  {completedWorkouts.length} Workouts Logged
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Progressive overload is tracked across all sessions. Consistent global volume growth
              drives hypertrophy and neurological strength adaptations.
            </p>

            {/* Global Volume Evolution Chart */}
            <div className="h-44 w-full pt-2">
              <VolumeProgressionChart
                data={globalVolumeData.map((d) => ({
                  label: d.workoutName.replace('Hypertrophy ', 'H-').replace('Strength ', 'S-'),
                  date: d.date,
                  volume: d.volumeKg,
                }))}
              />
            </div>
          </section>

          {/* Routine-Specific Progression Selector */}
          <section className="k-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="k-section-title">
                  Volume evolution per routine
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Compare specific splits (e.g. Upper A vs Lower B)
                </span>
              </div>

              {/* Routine Select Dropdown */}
              <select
                value={selectedRoutine}
                onChange={(e) => setSelectedRoutine(e.target.value)}
                className="min-h-[40px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--color-accent)] focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="all">Compare All Routines</option>
                {availableRoutineNames.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Individual Routine View or Multi-Routine Comparison */}
            {selectedRoutine !== 'all' && activeRoutineData && (
              <div className="space-y-3">
                <div className="bg-[var(--color-surface-sunken)] p-4 rounded-2xl border border-[var(--color-border)] flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider block">
                      Routine Focus
                    </span>
                    <h4 className="text-sm font-bold text-[var(--color-text)]">{selectedRoutine}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">
                      Latest Volume
                    </span>
                    <span className="text-base font-extrabold text-[var(--color-accent)]">
                      {activeRoutineData.length > 0
                        ? `${activeRoutineData[
                            activeRoutineData.length - 1
                          ].volumeKg.toLocaleString()} kg`
                        : '--'}
                    </span>
                  </div>
                </div>

                {activeRoutineData.length > 0 ? (
                  <div className="h-40 w-full pt-2">
                    <VolumeProgressionChart
                      data={activeRoutineData.map((d) => ({
                        label: d.date.slice(5),
                        date: d.date,
                        volume: d.volumeKg,
                      }))}
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[var(--color-text-subtle)] border border-dashed border-[var(--color-border)] rounded-2xl">
                    No sessions logged for {selectedRoutine} yet. Start a session from the Train tab
                    to see volume progression!
                  </div>
                )}
              </div>
            )}

            {/* Multi-routine summary cards */}
            {selectedRoutine === 'all' && (
              <div className="space-y-2.5">
                {availableRoutineNames.map((name) => {
                  const history = routineVolumeMap[name] || [];
                  const latest = history[history.length - 1];
                  const previous = history[history.length - 2];
                  const delta =
                    latest && previous ? Math.round(latest.volumeKg - previous.volumeKg) : 0;

                  return (
                    <div
                      key={name}
                      onClick={() => setSelectedRoutine(name)}
                      className="bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-[var(--color-text)]">{name}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {history.length} sessions logged
                          {latest ? ` • Last: ${latest.date}` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-[var(--color-accent)]">
                          {latest ? `${latest.volumeKg.toLocaleString()} kg` : '--'}
                        </div>
                        {delta !== 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              delta > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-subtle)]'
                            }`}
                          >
                            {delta > 0 ? `+${delta} kg` : `${delta} kg`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CARDIO PROGRESSION TAB */}
      {/* ======================================================== */}
      {activeCategory === 'cardio' && (
        <div className="space-y-4">
          {/* Cardio Personal Best Records */}
          <section className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-subtle)] text-[10px] font-semibold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Endurance PRs & Records</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[var(--color-text)]">
                    {formatDistance(cardioStats.totalDistanceKm, profile.unitSystem)}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">lifetime distance</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--color-accent)] text-[var(--color-accent)] border border-[var(--color-accent)]">
                  {cardioStats.totalSessions} Sessions Logged
                </span>
              </div>
            </div>

            {/* 3 Key PR Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Longest Dist
                </span>
                <span className="text-sm font-black text-[var(--color-accent)] block">
                  {cardioStats.longestDistanceKm > 0
                    ? formatDistance(cardioStats.longestDistanceKm, profile.unitSystem)
                    : '--'}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] capitalize truncate block">
                  {cardioStats.longestDistanceActivity || 'No data'}
                </span>
              </div>

              <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Best Pace
                </span>
                <span className="text-sm font-black text-[var(--color-accent)] block">
                  {cardioStats.bestPaceMinPerKm !== '--:--'
                    ? `${cardioStats.bestPaceMinPerKm} /km`
                    : '--'}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] capitalize truncate block">
                  {cardioStats.bestPaceActivity || 'No data'}
                </span>
              </div>

              <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-subtle)] uppercase font-bold block mb-1">
                  Longest Time
                </span>
                <span className="text-sm font-black text-[var(--color-accent)] block">
                  {cardioStats.longestDurationMinutes > 0
                    ? `${cardioStats.longestDurationMinutes}m`
                    : '--'}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] block">Endurance</span>
              </div>
            </div>
          </section>

          {/* Cardio History Breakdown by Activity */}
          <section className="k-card p-5 space-y-3">
            <span className="k-section-title">
              Cardio sessions history
            </span>

            {cardioSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-subtle)] border border-dashed border-[var(--color-border)] rounded-2xl">
                No cardio sessions logged yet. Log runs, walks, or cycling in the Train tab.
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-accent)] font-bold border border-[var(--color-accent)]">
                          {session.avgPaceMinPerKm || (session.avgPaceSecPerKm ? formatPace(session.avgPaceSecPerKm, profile.unitSystem) : '--:--')}
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
                        <span className="text-[10px] text-[var(--color-danger)] font-medium">
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
  );
}

// SVG Volume Progression Line/Bar Chart Component
function VolumeProgressionChart({
  data,
}: {
  data: { label: string; date: string; volume: number }[];
}) {
  if (data.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-text-subtle)] text-xs">
        Log at least 2 sessions to see volume progression curves...
      </div>
    );
  }

  const volumes = data.map((d) => d.volume);
  const min = Math.min(...volumes) * 0.9;
  const max = Math.max(...volumes) * 1.05;
  const range = max - min || 1;

  const width = 340;
  const height = 150;

  const points = data.map((d, idx) => {
    const x = (idx / (data.length - 1)) * (width - 30) + 15;
    const y = height - ((d.volume - min) / range) * (height - 30) - 15;
    return { x, y, volume: d.volume, label: d.label };
  });

  const polylineCoords = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Background guideline */}
      <line
        x1="10"
        y1={height * 0.3}
        x2={width - 10}
        y2={height * 0.3}
        style={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
      />
      <line
        x1="10"
        y1={height * 0.7}
        x2={width - 10}
        y2={height * 0.7}
        style={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
      />

      {/* Area gradient under line */}
      <defs>
        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-accent)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Polygon fill under trend */}
      <polygon
        points={`${points[0].x},${height} ${polylineCoords} ${
          points[points.length - 1].x
        },${height}`}
        fill="url(#volGrad)"
      />

      {/* Line */}
      <polyline
        fill="none"
        strokeWidth="2.5"
        style={{ stroke: "var(--color-accent)" }}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylineCoords}
      />

      {/* Data points */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="4" strokeWidth="2"
            style={{ fill: "var(--color-bg)", stroke: "var(--color-accent)" }} />
          <text
            x={p.x}
            y={height - 2}
            textAnchor="middle"
            style={{ fill: "var(--color-text-subtle)" }}
            fontSize="8"
            fontWeight="bold"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Dual Plot Weight Chart SVG Component (Scatter + Smooth Curve)
function DualWeightChart({
  points,
}: {
  points: { actualWeightKg: number; trendWeightKg: number; date: string }[];
}) {
  if (points.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-text-subtle)] text-xs">
        Collecting more weigh-ins for chart...
      </div>
    );
  }

  const actuals = points.map((p) => p.actualWeightKg);
  const trends = points.map((p) => p.trendWeightKg);
  const allVals = [...actuals, ...trends];

  const min = Math.min(...allVals) - 0.4;
  const max = Math.max(...allVals) + 0.4;
  const range = max - min || 1;

  const width = 340;
  const height = 150;

  // Trend line points
  const trendCoords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p.trendWeightKg - min) / range) * (height - 24) - 12;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Horizontal guide lines */}
      <line
        x1="0"
        y1={height * 0.25}
        x2={width}
        y2={height * 0.25}
        style={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
      />
      <line
        x1="0"
        y1={height * 0.75}
        x2={width}
        y2={height * 0.75}
        style={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
      />

      {/* Raw Scale Scatter Dots */}
      {points.map((p, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((p.actualWeightKg - min) / range) * (height - 24) - 12;
        return <circle key={idx} cx={x} cy={y} r="2.5" opacity="0.6" style={{ fill: "var(--color-text-subtle)" }} />;
      })}

      {/* Smoothed EWMA Trend Curve */}
      <polyline
        fill="none"
        strokeWidth="2.5"
        style={{ stroke: "var(--color-accent)" }}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={trendCoords.join(' ')}
      />
    </svg>
  );
}
