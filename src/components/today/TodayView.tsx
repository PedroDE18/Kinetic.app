import React, { useMemo } from 'react';
import {
  Plus,
  Flame,
  Droplets,
  Play,
  Sparkles,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { calculateWeightTrend, formatWeight } from '../../utils/engine';

interface TodayViewProps {
  onOpenFoodModal: () => void;
  onOpenWeighInModal: () => void;
  onOpenWeeklyReview: () => void;
  onNavigateTab: (tab: 'food' | 'train' | 'progress') => void;
}

export function TodayView({
  onOpenFoodModal,
  onOpenWeighInModal,
  onOpenWeeklyReview,
  onNavigateTab,
}: TodayViewProps) {
  const { state, addWater, startWorkout } = useFitness();
  const { profile, loggedFoods, weights, completedWorkouts, activeWorkout, reviews, waterMlToday } = state;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's logged foods
  const todayFoods = useMemo(
    () => loggedFoods.filter((f) => f.loggedAt.startsWith(todayStr)),
    [loggedFoods, todayStr]
  );

  // Total macro consumption
  const consumed = useMemo(() => {
    return todayFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayFoods]);

  // Weight Trend calculation
  const weightTrend = useMemo(() => calculateWeightTrend(weights), [weights]);
  const latestWeight = weightTrend[weightTrend.length - 1];
  const previousWeight = weightTrend.length > 7 ? weightTrend[weightTrend.length - 8] : weightTrend[0];
  const weeklyDelta = latestWeight && previousWeight
    ? Number((latestWeight.trendWeightKg - previousWeight.trendWeightKg).toFixed(2))
    : 0;

  // Calorie calculations
  const remainingCals = profile.targets.calories - consumed.calories;
  const isOverTarget = remainingCals < 0;
  const calPercent = Math.min(Math.round((consumed.calories / profile.targets.calories) * 100), 100);

  // Pending Review check
  const pendingReview = reviews.find((r) => r.status === 'pending');

  // Today scheduled template (or default)
  const scheduledTemplate = state.templates[0];
  const lastCompletedWorkout = completedWorkouts[0];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Pending Weekly Review Alert Banner */}
      {pendingReview && (
        <button
          onClick={onOpenWeeklyReview}
          aria-label="Open Weekly Macro Check-in"
          className="w-full text-left bg-gradient-to-r from-teal-950/80 via-zinc-900 to-zinc-900 border border-teal-500/50 hover:border-teal-400/70 rounded-2xl p-3.5 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                Weekly Check-In Available
              </div>
              <div className="text-xs font-medium text-zinc-100">
                Expenditure calculated • Target adjustment proposed
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 ml-2" />
        </button>
      )}

      {/* 2. Quick Actions 2x2 Grid */}
      <section aria-label="Quick Actions">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenFoodModal}
            className="min-h-[46px] flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 rounded-2xl text-xs font-semibold text-zinc-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Log Meal</span>
          </button>
          <button
            onClick={onOpenWeighInModal}
            className="min-h-[46px] flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 rounded-2xl text-xs font-semibold text-zinc-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Add Weigh-in</span>
          </button>
          <button
            onClick={() => addWater(250)}
            className="min-h-[46px] flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 rounded-2xl text-xs font-semibold text-zinc-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <span>+250ml Water</span>
          </button>
          <button
            onClick={() => {
              if (activeWorkout) {
                onNavigateTab('train');
              } else {
                startWorkout(scheduledTemplate?.id);
                onNavigateTab('train');
              }
            }}
            className="min-h-[46px] flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 rounded-2xl text-xs font-semibold text-zinc-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <span>{activeWorkout ? 'Resume Workout' : 'Start Workout'}</span>
          </button>
        </div>
      </section>

      {/* 3. Daily Nutrition Summary Card */}
      <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Daily Nutrition
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {consumed.calories}
              </span>
              <span className="text-sm font-medium text-zinc-400">
                / {profile.targets.calories} kcal
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              isOverTarget
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
            }`}
          >
            {isOverTarget
              ? `${Math.abs(remainingCals)} kcal over`
              : `${remainingCals} kcal remaining`}
          </div>
        </div>

        {/* Calorie Overall Progress Bar */}
        <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800 mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverTarget ? 'bg-amber-500' : 'bg-teal-400'
            }`}
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* Macro Gauges */}
        <div className="grid grid-cols-3 gap-2.5">
          <MacroBar
            label="Protein"
            current={consumed.protein}
            target={profile.targets.proteinGrams}
            color="bg-emerald-400"
            unit="g"
          />
          <MacroBar
            label="Carbs"
            current={consumed.carbs}
            target={profile.targets.carbsGrams}
            color="bg-amber-400"
            unit="g"
          />
          <MacroBar
            label="Fat"
            current={consumed.fat}
            target={profile.targets.fatGrams}
            color="bg-rose-400"
            unit="g"
          />
        </div>

        {/* Hydration Secondary Row */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">Hydration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">
              {(waterMlToday / 1000).toFixed(2)} / {(profile.targets.waterMl / 1000).toFixed(1)} L
            </span>
            <button
              onClick={() => addWater(250)}
              aria-label="Add 250ml water"
              className="min-h-[32px] px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold rounded-lg border border-cyan-800/40 text-xs active:scale-95 transition-all"
            >
              +250ml
            </button>
          </div>
        </div>
      </section>

      {/* 4. Body-Weight & Trend Summary Card */}
      <section
        onClick={onOpenWeighInModal}
        className="bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 rounded-3xl p-5 cursor-pointer transition-all active:scale-[0.99]"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Weight Trend (EWMA)
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-white">
                {latestWeight ? formatWeight(latestWeight.trendWeightKg, profile.unitSystem) : '--'}
              </span>
              <span className="text-xs text-zinc-400">
                Scale: {latestWeight ? formatWeight(latestWeight.actualWeightKg, profile.unitSystem) : '--'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-zinc-400">7-Day Change</div>
            <div
              className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                weeklyDelta <= 0 ? 'text-teal-400' : 'text-amber-400'
              }`}
            >
              {weeklyDelta <= 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span>
                {weeklyDelta > 0 ? `+${weeklyDelta}` : weeklyDelta}{' '}
                {profile.unitSystem === 'metric' ? 'kg' : 'lb'}
              </span>
            </div>
          </div>
        </div>

        {/* Compact SVG Sparkline */}
        <div className="h-16 w-full pt-1">
          <SparklineChart points={weightTrend.slice(-14).map((p) => p.actualWeightKg)} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
          <span>Tap to record today's weigh-in</span>
          <span className="text-teal-400 font-medium">Logged {weightTrend.length} days</span>
        </div>
      </section>

      {/* 5. Training Summary Card */}
      <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Training Session
            </span>
          </div>

          {activeWorkout ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              In Progress
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">Scheduled for today</span>
          )}
        </div>

        {activeWorkout ? (
          <div>
            <h4 className="text-base font-bold text-white">{activeWorkout.name}</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeWorkout.exercises.length} exercises • Started at{' '}
              {new Date(activeWorkout.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <button
              onClick={() => onNavigateTab('train')}
              className="min-h-[44px] mt-3.5 w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Live Workout</span>
            </button>
          </div>
        ) : (
          <div>
            <h4 className="text-base font-bold text-white">
              {scheduledTemplate?.name || 'Upper Hypertrophy A'}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {scheduledTemplate?.exercises.length || 5} exercises • ~45-55 mins target
            </p>
            <button
              onClick={() => {
                startWorkout(scheduledTemplate?.id);
                onNavigateTab('train');
              }}
              className="min-h-[44px] mt-3.5 w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Workout Session</span>
            </button>
          </div>
        )}

        {/* Previous session preview */}
        {lastCompletedWorkout && !activeWorkout && (
          <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Last session: {lastCompletedWorkout.name}</span>
            <span className="font-semibold text-zinc-300">
              {lastCompletedWorkout.totalVolumeKg.toLocaleString()} kg vol
            </span>
          </div>
        )}
      </section>

      {/* 6. Daily Meal Timeline */}
      <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Today's Logged Meals
          </div>
          <button
            onClick={onOpenFoodModal}
            className="min-h-[44px] px-2 text-xs font-bold text-teal-400 flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal</span>
          </button>
        </div>

        {todayFoods.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            No foods logged yet today. Tap "+ Log Meal" above.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {todayFoods.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{item.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    <span className="capitalize text-teal-400/90 font-medium">{item.mealType}</span> •{' '}
                    {item.servingCount}× {item.servingSize} {item.servingUnit} • P: {item.protein}g C:{' '}
                    {item.carbs}g F: {item.fat}g
                  </div>
                </div>
                <div className="text-xs font-bold text-zinc-200 shrink-0 ml-2">
                  {item.calories} kcal
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MacroBar({
  label,
  current,
  target,
  color,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</div>
      <div className="text-xs font-bold text-zinc-100 mt-1">
        {current} <span className="text-[10px] font-normal text-zinc-400">/ {target}{unit}</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparklineChart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
        Collecting weigh-ins...
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 340;
  const height = 48;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <polyline
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}
