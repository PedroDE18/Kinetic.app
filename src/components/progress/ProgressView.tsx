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
      <div className="grid grid-cols-3 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveCategory('metabolic')}
          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeCategory === 'metabolic'
              ? 'bg-zinc-800 text-teal-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Weight & TDEE</span>
        </button>

        <button
          onClick={() => setActiveCategory('strength')}
          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeCategory === 'strength'
              ? 'bg-zinc-800 text-teal-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Strength Volume</span>
        </button>

        <button
          onClick={() => setActiveCategory('cardio')}
          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeCategory === 'cardio'
              ? 'bg-zinc-800 text-teal-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
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
          <section className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Adaptive Expenditure</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">{tdeeData.estimatedTdee}</span>
                  <span className="text-xs font-semibold text-zinc-400">kcal / day (TDEE)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {Math.round(tdeeData.confidenceScore * 100)}% Confidence
                </span>
              </div>
            </div>

            {/* Metabolic Comparison Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80 mb-3">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                  Current Intake Target
                </span>
                <span className="font-bold text-zinc-100">{profile.targets.calories} kcal/day</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                  Logged Daily Avg
                </span>
                <span className="font-bold text-zinc-100">{tdeeData.avgDailyIntake} kcal/day</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Calculated via metabolic mass balance using real logged intake vs. smoothed scale
              trend. Current weekly rate is{' '}
              <span className="font-semibold text-zinc-200">
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
              className="min-h-[44px] mt-4 w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <span>
                {pendingReview ? 'Review Proposed Calorie Target' : 'View Latest Weekly Check-In'}
              </span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </section>

          {/* Weight Trend & Scale Readings Dual Plot */}
          <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Body Weight & Trend
                </h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold text-white">
                    {latestTrend
                      ? formatWeight(latestTrend.trendWeightKg, profile.unitSystem)
                      : '--'}
                  </span>
                  <span className="text-xs text-zinc-400">
                    ({deltaPeriodKg > 0 ? `+${deltaPeriodKg}` : deltaPeriodKg} kg in period)
                  </span>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 text-[10px] font-bold">
                {(['1M', '3M', '6M', 'All'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`min-h-[28px] px-2.5 py-0.5 rounded-lg transition-all ${
                      timeRange === r ? 'bg-zinc-800 text-teal-400 shadow-sm' : 'text-zinc-500'
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
            <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-teal-400 inline-block" />
                <span>Smoothed Trend (EWMA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                <span>Scale Readings</span>
              </div>
            </div>

            <button
              onClick={onOpenWeighInModal}
              className="min-h-[38px] w-full mt-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-teal-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
            >
              + Record New Weigh-in
            </button>
          </section>

          {/* Waist & Body Composition Section */}
          <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Waist Circumference
              </h4>
              <span className="text-xs font-bold text-teal-300">
                {latestTrend?.waistCm ? `${latestTrend.waistCm} cm` : '85.0 cm'}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-relaxed">
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
          <section className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Global Training Volume</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">
                    {totalGlobalVolumeKg.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">kg total lifted</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {completedWorkouts.length} Workouts Logged
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
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
          <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Volume Evolution Per Routine
                </h3>
                <span className="text-xs text-zinc-400">
                  Compare specific splits (e.g. Upper A vs Lower B)
                </span>
              </div>

              {/* Routine Select Dropdown */}
              <select
                value={selectedRoutine}
                onChange={(e) => setSelectedRoutine(e.target.value)}
                className="min-h-[40px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-teal-300 focus:outline-none focus:border-teal-500"
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
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                      Routine Focus
                    </span>
                    <h4 className="text-sm font-bold text-white">{selectedRoutine}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                      Latest Volume
                    </span>
                    <span className="text-base font-extrabold text-teal-300">
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
                  <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
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
                      className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{name}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {history.length} sessions logged
                          {latest ? ` • Last: ${latest.date}` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-teal-400">
                          {latest ? `${latest.volumeKg.toLocaleString()} kg` : '--'}
                        </div>
                        {delta !== 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              delta > 0 ? 'text-teal-400' : 'text-zinc-500'
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
          <section className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>Endurance PRs & Records</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">
                    {formatDistance(cardioStats.totalDistanceKm, profile.unitSystem)}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">lifetime distance</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {cardioStats.totalSessions} Sessions Logged
                </span>
              </div>
            </div>

            {/* 3 Key PR Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                  Longest Dist
                </span>
                <span className="text-sm font-black text-teal-300 block">
                  {cardioStats.longestDistanceKm > 0
                    ? formatDistance(cardioStats.longestDistanceKm, profile.unitSystem)
                    : '--'}
                </span>
                <span className="text-[9px] text-zinc-400 capitalize truncate block">
                  {cardioStats.longestDistanceActivity || 'No data'}
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                  Best Pace
                </span>
                <span className="text-sm font-black text-teal-300 block">
                  {cardioStats.bestPaceMinPerKm !== '--:--'
                    ? `${cardioStats.bestPaceMinPerKm} /km`
                    : '--'}
                </span>
                <span className="text-[9px] text-zinc-400 capitalize truncate block">
                  {cardioStats.bestPaceActivity || 'No data'}
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                  Longest Time
                </span>
                <span className="text-sm font-black text-teal-300 block">
                  {cardioStats.longestDurationMinutes > 0
                    ? `${cardioStats.longestDurationMinutes}m`
                    : '--'}
                </span>
                <span className="text-[9px] text-zinc-400 block">Endurance</span>
              </div>
            </div>
          </section>

          {/* Cardio History Breakdown by Activity */}
          <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Cardio Sessions History
            </h4>

            {cardioSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                No cardio sessions logged yet. Log runs, walks, or cycling in the Train tab.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {cardioSessions.map((session) => (
                  <div key={session.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white capitalize">
                          {(session.activity || session.type).replace('_', ' ')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30">
                          {session.avgPaceMinPerKm || (session.avgPaceSecPerKm ? formatPace(session.avgPaceSecPerKm, profile.unitSystem) : '--:--')}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {session.date} • {formatDistance(session.distanceKm || 0, profile.unitSystem)} in{' '}
                        {session.durationMinutes} mins
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-200">
                        {session.caloriesBurned} kcal
                      </div>
                      {session.avgHeartRateBpm && (
                        <span className="text-[10px] text-rose-400 font-medium">
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
      <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
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
        stroke="#27272a"
        strokeDasharray="3 3"
      />
      <line
        x1="10"
        y1={height * 0.7}
        x2={width - 10}
        y2={height * 0.7}
        stroke="#27272a"
        strokeDasharray="3 3"
      />

      {/* Area gradient under line */}
      <defs>
        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
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
        stroke="#14b8a6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylineCoords}
      />

      {/* Data points */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="4" fill="#09090b" stroke="#14b8a6" strokeWidth="2.5" />
          <text
            x={p.x}
            y={height - 2}
            textAnchor="middle"
            fill="#71717a"
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
      <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
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
        stroke="#27272a"
        strokeDasharray="3 3"
      />
      <line
        x1="0"
        y1={height * 0.75}
        x2={width}
        y2={height * 0.75}
        stroke="#27272a"
        strokeDasharray="3 3"
      />

      {/* Raw Scale Scatter Dots */}
      {points.map((p, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((p.actualWeightKg - min) / range) * (height - 24) - 12;
        return <circle key={idx} cx={x} cy={y} r="3" fill="#71717a" opacity="0.75" />;
      })}

      {/* Smoothed EWMA Trend Curve */}
      <polyline
        fill="none"
        stroke="#14b8a6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={trendCoords.join(' ')}
      />
    </svg>
  );
}
