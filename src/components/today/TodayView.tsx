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
  Watch,
  Activity,
  Heart
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
  const { profile, loggedFoods, weights, completedWorkouts, cardioSessions, activeWorkout, reviews, waterMlToday } = state;

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

  const remainingCals = profile.targets.calories - consumed.calories;
  const isOverTarget = remainingCals < 0;
  const calPercent = Math.min(Math.round((consumed.calories / profile.targets.calories) * 100), 100);

  const pendingReview = reviews.find((r) => r.status === 'pending');
  const scheduledTemplate = state.templates[0];
  const lastCompletedWorkout = completedWorkouts[0];
  const latestCardio = cardioSessions[0];

  // Cozy greeting based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Cozy Editorial Header Card ("Get Cozy" inspired) */}
      <div className="p-4 rounded-3xl bg-[#FAF3EA] dark:bg-[#25201C] border border-[#EBE1D3] dark:border-[#38302A] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#8A7B6E] dark:text-[#A8988B] font-medium">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            <span>•</span>
            <span className="capitalize">{profile.name}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#28221D] dark:text-[#F7F2EC] mt-0.5">
            {greeting}
          </h2>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center font-bold text-sm">
          <Heart className="w-5 h-5 fill-current" />
        </div>
      </div>

      {/* 2. Adaptive Macro Check-in Alert (if available) */}
      {pendingReview && (
        <button
          onClick={onOpenWeeklyReview}
          aria-label="Open Weekly Macro Check-in"
          className="w-full text-left p-4 rounded-3xl bg-[#FCE8E4] dark:bg-[#2E1E1C] border border-[#F4C7BE] dark:border-[#4B2924] text-[#8A3127] dark:text-[#F4A599] flex items-center justify-between transition-all active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-black/30 flex items-center justify-center shrink-0 text-[#E07A5F]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                Weekly Review Available
              </div>
              <div className="text-xs font-semibold mt-0.5">
                Expenditure calculated • Macro adjustment ready
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 ml-2" />
        </button>
      )}

      {/* 3. Quick Actions Grid with Cozy Reference Palette */}
      <section aria-label="Quick Actions">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Action 1: Log Meal (Cozy Rose/Pink) */}
          <button
            onClick={onOpenFoodModal}
            className="min-h-[50px] p-3 rounded-2xl bg-[#FDE8E4] dark:bg-[#2E1E1C] border border-[#F4C7BE] dark:border-[#4B2924] text-[#8A3127] dark:text-[#F4A599] flex items-center gap-2.5 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-xl bg-white/80 dark:bg-black/30 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span>Log Meal</span>
          </button>

          {/* Action 2: Add Weigh-in (Cozy Slate Blue) */}
          <button
            onClick={onOpenWeighInModal}
            className="min-h-[50px] p-3 rounded-2xl bg-[#E1ECF4] dark:bg-[#1B2732] border border-[#BCD4E6] dark:border-[#2B4052] text-[#1D4C6E] dark:text-[#9EC7E6] flex items-center gap-2.5 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-xl bg-white/80 dark:bg-black/30 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span>Weigh-in</span>
          </button>

          {/* Action 3: Water (Cozy Butter Yellow) */}
          <button
            onClick={() => addWater(250)}
            className="min-h-[50px] p-3 rounded-2xl bg-[#FEF4D6] dark:bg-[#2B2516] border border-[#F1DE9F] dark:border-[#493B1F] text-[#7A5B0B] dark:text-[#ECD28C] flex items-center gap-2.5 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-xl bg-white/80 dark:bg-black/30 flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <span>+250ml Water</span>
          </button>

          {/* Action 4: Workout (Cozy Sage Green) */}
          <button
            onClick={() => {
              if (activeWorkout) {
                onNavigateTab('train');
              } else {
                startWorkout(scheduledTemplate?.id);
                onNavigateTab('train');
              }
            }}
            className="min-h-[50px] p-3 rounded-2xl bg-[#E5EDE4] dark:bg-[#1C2A1E] border border-[#C4D9C2] dark:border-[#2D4632] text-[#2A5835] dark:text-[#9FD1A8] flex items-center gap-2.5 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-xl bg-white/80 dark:bg-black/30 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <span className="truncate">{activeWorkout ? 'Resume' : 'Workout'}</span>
          </button>
        </div>
      </section>

      {/* 4. Daily Nutrition Summary Card */}
      <section className="bg-[#FFFDF9] dark:bg-[#211D1A] border border-[#EBE3D7] dark:border-[#342D27] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A7B6E] dark:text-[#A8988B] uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Daily Nutrition</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black tracking-tight text-[#28221D] dark:text-[#F7F2EC]">
                {consumed.calories}
              </span>
              <span className="text-sm font-medium text-[#8A7B6E] dark:text-[#A8988B]">
                / {profile.targets.calories} kcal
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold ${
              isOverTarget
                ? 'bg-[#FEF4D6] dark:bg-[#2B2516] text-[#7A5B0B] dark:text-[#ECD28C] border border-[#F1DE9F] dark:border-[#493B1F]'
                : 'bg-[#FDE8E4] dark:bg-[#2E1E1C] text-[#8A3127] dark:text-[#F4A599] border border-[#F4C7BE] dark:border-[#4B2924]'
            }`}
          >
            {isOverTarget
              ? `${Math.abs(remainingCals)} kcal over`
              : `${remainingCals} kcal left`}
          </div>
        </div>

        {/* Calorie Overall Progress Bar */}
        <div className="w-full bg-[#F4EFE6] dark:bg-[#2E2723] rounded-full h-2.5 overflow-hidden border border-[#EBE3D7] dark:border-[#38302A]">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[#E07A5F]"
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* Macro Gauges */}
        <div className="grid grid-cols-3 gap-2">
          <MacroBar
            label="Protein"
            current={consumed.protein}
            target={profile.targets.proteinGrams}
            barColor="bg-[#D96B7E]"
            unit="g"
          />
          <MacroBar
            label="Carbs"
            current={consumed.carbs}
            target={profile.targets.carbsGrams}
            barColor="bg-[#E6A838]"
            unit="g"
          />
          <MacroBar
            label="Fat"
            current={consumed.fat}
            target={profile.targets.fatGrams}
            barColor="bg-[#5B8EA6]"
            unit="g"
          />
        </div>

        {/* Hydration Row */}
        <div className="pt-3 border-t border-[#EBE3D7] dark:border-[#342D27] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#8A7B6E] dark:text-[#A8988B]">
            <Droplets className="w-4 h-4 text-[#2D6C96] shrink-0" />
            <span className="font-medium">Hydration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#28221D] dark:text-[#F7F2EC]">
              {(waterMlToday / 1000).toFixed(2)} / {(profile.targets.waterMl / 1000).toFixed(1)} L
            </span>
            <button
              onClick={() => addWater(250)}
              aria-label="Add 250ml water"
              className="px-2.5 py-1 bg-[#FEF4D6] dark:bg-[#2B2516] text-[#7A5B0B] dark:text-[#ECD28C] border border-[#F1DE9F] dark:border-[#493B1F] font-bold rounded-xl text-xs active:scale-95 transition-all"
            >
              +250ml
            </button>
          </div>
        </div>
      </section>

      {/* 5. Body-Weight & Trend Summary Card */}
      <section
        onClick={onOpenWeighInModal}
        className="bg-[#FFFDF9] dark:bg-[#211D1A] border border-[#EBE3D7] dark:border-[#342D27] hover:border-[#E07A5F]/60 rounded-3xl p-5 cursor-pointer transition-all active:scale-[0.99] shadow-xs"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-xs font-semibold text-[#8A7B6E] dark:text-[#A8988B] uppercase tracking-wider">
              Weight Trend (EWMA)
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black tracking-tight text-[#28221D] dark:text-[#F7F2EC]">
                {latestWeight ? formatWeight(latestWeight.trendWeightKg, profile.unitSystem) : '--'}
              </span>
              <span className="text-xs text-[#8A7B6E] dark:text-[#A8988B]">
                Scale: {latestWeight ? formatWeight(latestWeight.actualWeightKg, profile.unitSystem) : '--'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-[#8A7B6E] dark:text-[#A8988B]">7-Day Change</div>
            <div
              className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                weeklyDelta <= 0 ? 'text-[#387B4C] dark:text-[#81B29A]' : 'text-[#C85A32] dark:text-[#E07A5F]'
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

        <div className="mt-2 flex items-center justify-between text-[11px] text-[#8A7B6E] dark:text-[#A8988B] pt-2 border-t border-[#EBE3D7] dark:border-[#342D27]">
          <span>Tap to record today's weigh-in</span>
          <span className="text-[#E07A5F] font-semibold">Logged {weightTrend.length} days</span>
        </div>
      </section>

      {/* 6. Training & Wearable Activities Card */}
      <section className="bg-[#FFFDF9] dark:bg-[#211D1A] border border-[#EBE3D7] dark:border-[#342D27] rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span className="text-xs font-semibold text-[#8A7B6E] dark:text-[#A8988B] uppercase tracking-wider">
              Training Session
            </span>
          </div>

          {activeWorkout ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8E4] dark:bg-[#2E1E1C] text-[#8A3127] dark:text-[#F4A599] border border-[#F4C7BE] dark:border-[#4B2924]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] animate-ping" />
              In Progress
            </span>
          ) : (
            <span className="text-[11px] text-[#8A7B6E] dark:text-[#A8988B]">Scheduled for today</span>
          )}
        </div>

        {activeWorkout ? (
          <div>
            <h4 className="text-base font-bold text-[#28221D] dark:text-[#F7F2EC]">{activeWorkout.name}</h4>
            <p className="text-xs text-[#8A7B6E] dark:text-[#A8988B] mt-0.5">
              {activeWorkout.exercises.length} exercises • Started at{' '}
              {new Date(activeWorkout.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <button
              onClick={() => onNavigateTab('train')}
              className="min-h-[44px] mt-3.5 w-full py-2.5 bg-[#E07A5F] hover:bg-[#D0694E] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Live Workout</span>
            </button>
          </div>
        ) : (
          <div>
            <h4 className="text-base font-bold text-[#28221D] dark:text-[#F7F2EC]">
              {scheduledTemplate?.name || 'Upper Hypertrophy A'}
            </h4>
            <p className="text-xs text-[#8A7B6E] dark:text-[#A8988B] mt-0.5">
              {scheduledTemplate?.exercises.length || 5} exercises • ~45-55 mins target
            </p>
            <button
              onClick={() => {
                startWorkout(scheduledTemplate?.id);
                onNavigateTab('train');
              }}
              className="min-h-[44px] mt-3.5 w-full py-2.5 bg-[#E07A5F] hover:bg-[#D0694E] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Workout Session</span>
            </button>
          </div>
        )}

        {/* Wearable Cardio Activity Banner (Apple Health / Garmin) */}
        {latestCardio && (
          <div className="pt-2.5 border-t border-[#EBE3D7] dark:border-[#342D27] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#8A7B6E] dark:text-[#A8988B]">
              <Watch className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span className="font-medium truncate max-w-[170px]">{latestCardio.name || latestCardio.type}</span>
            </div>
            <span className="font-semibold text-[#28221D] dark:text-[#F7F2EC]">
              {latestCardio.distanceKm ? `${latestCardio.distanceKm} km • ` : ''}{latestCardio.durationMinutes}m ({latestCardio.caloriesBurned} kcal)
            </span>
          </div>
        )}
      </section>

      {/* 7. Daily Meal Timeline */}
      <section className="bg-[#FFFDF9] dark:bg-[#211D1A] border border-[#EBE3D7] dark:border-[#342D27] rounded-3xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-semibold text-[#8A7B6E] dark:text-[#A8988B] uppercase tracking-wider">
            Today's Logged Meals
          </div>
          <button
            onClick={onOpenFoodModal}
            className="min-h-[44px] px-2 text-xs font-bold text-[#E07A5F] flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal</span>
          </button>
        </div>

        {todayFoods.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8A7B6E] dark:text-[#A8988B]">
            No foods logged yet today. Tap "Log Meal" above.
          </div>
        ) : (
          <div className="divide-y divide-[#EBE3D7] dark:divide-[#342D27]">
            {todayFoods.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#28221D] dark:text-[#F7F2EC]">{item.name}</div>
                  <div className="text-[11px] text-[#8A7B6E] dark:text-[#A8988B] mt-0.5">
                    <span className="capitalize text-[#E07A5F] font-medium">{item.mealType}</span> •{' '}
                    {item.servingCount}× {item.servingSize} {item.servingUnit} • P: {item.protein}g C:{' '}
                    {item.carbs}g F: {item.fat}g
                  </div>
                </div>
                <div className="text-xs font-bold text-[#28221D] dark:text-[#F7F2EC] shrink-0 ml-2">
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
  barColor,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  barColor: string;
  unit: string;
}) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div className="bg-[#FAF3EA] dark:bg-[#2A241F] p-3 rounded-2xl border border-[#EBE1D3] dark:border-[#38302A]">
      <div className="text-[10px] font-semibold text-[#8A7B6E] dark:text-[#A8988B] uppercase tracking-wider">{label}</div>
      <div className="text-xs font-bold text-[#28221D] dark:text-[#F7F2EC] mt-1">
        {current} <span className="text-[10px] font-normal text-[#8A7B6E] dark:text-[#A8988B]">/ {target}{unit}</span>
      </div>
      <div className="w-full bg-[#EBE1D3] dark:bg-[#38302A] rounded-full h-1.5 mt-2 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparklineChart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-[#8A7B6E] dark:text-[#A8988B] text-xs">
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
        stroke="#E07A5F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}
