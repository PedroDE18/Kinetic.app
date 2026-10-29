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
  Heart,
  BedDouble,
  Footprints,
  CalendarDays,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { calculateWeightTrend, formatWeight, getLocalDateString, getRecentDateStrings } from '../../utils/engine';

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
  const { state, addWater, startWorkout, getScheduledDayForDate } = useFitness();
  const {
    profile,
    loggedFoods,
    weights,
    completedWorkouts,
    cardioSessions,
    activeWorkout,
    reviews,
    waterMlToday,
    templates,
  } = state as any;

  const todayStr = useMemo(() => getLocalDateString(), []);

  const todayFoods = useMemo(
    () => loggedFoods.filter((f: any) => f.loggedAt.startsWith(todayStr)),
    [loggedFoods, todayStr]
  );

  const consumed = useMemo(() => {
    return todayFoods.reduce(
      (acc: any, item: any) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayFoods]);

  const weightTrend = useMemo(() => calculateWeightTrend(weights), [weights]);
  const latestWeight = weightTrend[weightTrend.length - 1];
  const previousWeight = weightTrend.length > 7 ? weightTrend[weightTrend.length - 8] : weightTrend[0];
  const weeklyDelta = latestWeight && previousWeight
    ? Number((latestWeight.trendWeightKg - previousWeight.trendWeightKg).toFixed(2))
    : 0;

  const remainingCals = profile.targets.calories - consumed.calories;
  const isOverTarget = remainingCals < 0;
  const calPercent = Math.min(Math.round((consumed.calories / profile.targets.calories) * 100), 100);

  const pendingReview = reviews.find((r: any) => r.status === 'pending');

  // Today's scheduled routine
  const scheduledDay = useMemo(() => getScheduledDayForDate(todayStr), [getScheduledDayForDate, todayStr]);
  const isTrainingDay = scheduledDay?.type === 'training';
  const scheduledTemplate = useMemo(
    () => templates.find((t: any) => t.id === scheduledDay?.templateId) || templates[0],
    [templates, scheduledDay]
  );

  const lastCompletedWorkout = completedWorkouts[0];
  const latestCardio = cardioSessions[0];

  // Weekly consistency: Mon..Sun of current week
  const weekDays = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const ds = getLocalDateString(d);
      const completed = completedWorkouts.some((w: any) => (w.startTime || '').startsWith(ds));
      const scheduled = (state.weeklySchedule || []).find((s: any) => s.dayIndex === d.getDay());
      days.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), completed, isTraining: scheduled?.type === 'training' });
    }
    return days;
  }, [completedWorkouts, state.weeklySchedule]);

  const trainingDaysThisWeek = weekDays.filter((d) => d.isTraining).length;
  const completedTrainingDays = weekDays.filter((d) => d.completed).length;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="space-y-5 pb-6">
      {/* Editorial header */}
      <header className="pt-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-subtle)] tabular-nums">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="k-display text-2xl text-[var(--color-text)] mt-0.5">
              {greeting}, {profile.name?.split(' ')[0] || 'there'}
            </h1>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Pending review alert */}
      {pendingReview && (
        <button
          onClick={onOpenWeeklyReview}
          aria-label="Open Weekly Macro Check-in"
          className="w-full text-left p-4 rounded-2xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 text-[var(--color-text)] flex items-center justify-between transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0 text-[var(--color-accent)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Weekly review ready
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Expenditure calculated • Macro adjustment ready
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-text-subtle)] shrink-0" />
        </button>
      )}

      {/* TODAY'S PLAN — prominent */}
      <section className="k-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="k-section-title">Today's plan</span>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isTrainingDay
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]'
            }`}
          >
            {isTrainingDay ? 'Training day' : scheduledDay?.type === 'active_recovery' ? 'Recovery day' : 'Rest day'}
          </span>
        </div>

        {isTrainingDay ? (
          <div>
            <h2 className="k-display text-xl text-[var(--color-text)]">
              {scheduledTemplate?.name || scheduledDay?.focusName || 'Training session'}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {scheduledDay?.focusName || 'Scheduled strength session'} • {scheduledTemplate?.exercises?.length || 0} exercises
            </p>

            {activeWorkout ? (
              <>
                <p className="text-xs text-[var(--color-text-subtle)] mt-2">
                  In progress • {activeWorkout.exercises.length} exercises • started{' '}
                  {new Date(activeWorkout.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <button
                  onClick={() => onNavigateTab('train')}
                  className="min-h-[48px] mt-4 w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text)] font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume workout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  startWorkout(scheduledTemplate?.id || scheduledDay?.templateId);
                  onNavigateTab('train');
                }}
                className="min-h-[48px] mt-4 w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text)] font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start workout</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-muted)]">
                {scheduledDay?.type === 'active_recovery' ? <Footprints className="w-5 h-5" /> : <BedDouble className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="k-display text-lg text-[var(--color-text)]">
                  {scheduledDay?.focusName || 'Recovery'}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  {scheduledDay?.type === 'active_recovery'
                    ? 'Light movement and mobility. Keep it easy.'
                    : 'No structured training. Prioritize sleep and nutrition.'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => addWater(250)}
                className="min-h-[44px] py-2.5 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold flex items-center justify-center gap-2 active:scale-95"
              >
                <Droplets className="w-4 h-4 text-[var(--color-info)]" />
                <span>+250 ml water</span>
              </button>
              <button
                onClick={onOpenFoodModal}
                className="min-h-[44px] py-2.5 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Log a meal</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Weekly consistency */}
      <section className="k-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="k-section-title">This week</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {completedTrainingDays} of {trainingDaysThisWeek} training days done
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-[var(--color-text-subtle)]">{d.label}</span>
              <div
                className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold border ${
                  d.completed
                    ? 'bg-[var(--color-success-soft)] border-[var(--color-success)]/40 text-[var(--color-success)]'
                    : d.isTraining
                    ? 'bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-subtle)]'
                    : 'bg-transparent border-[var(--color-border-subtle)] text-[var(--color-text-subtle)]'
                }`}
              >
                {d.completed ? <CheckCircle2 className="w-4 h-4" /> : d.isTraining ? <Dumbbell className="w-3.5 h-3.5" /> : <span className="text-[10px]">·</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrition summary */}
      <section className="k-card p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="k-section-title flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              Daily nutrition
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="k-display text-3xl text-[var(--color-text)]">{consumed.calories}</span>
              <span className="text-sm text-[var(--color-text-muted)]">/ {profile.targets.calories} kcal</span>
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              isOverTarget
                ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]/30'
                : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/30'
            }`}
          >
            {isOverTarget ? `${Math.abs(remainingCals)} over` : `${remainingCals} left`}
          </div>
        </div>

        <div className="w-full bg-[var(--color-surface-raised)] rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[var(--color-accent)]"
            style={{ width: `${calPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MacroBar label="Protein" current={consumed.protein} target={profile.targets.proteinGrams} barColor="bg-[#D96B7E]" unit="g" />
          <MacroBar label="Carbs" current={consumed.carbs} target={profile.targets.carbsGrams} barColor="bg-[#E6A838]" unit="g" />
          <MacroBar label="Fat" current={consumed.fat} target={profile.targets.fatGrams} barColor="bg-[#5B8EA6]" unit="g" />
        </div>

        {/* Hydration */}
        <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Droplets className="w-4 h-4 text-[var(--color-info)]" />
            <span className="font-medium">Hydration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-text)] tabular-nums">
              {(waterMlToday / 1000).toFixed(2)} / {(profile.targets.waterMl / 1000).toFixed(1)} L
            </span>
            <button
              onClick={() => addWater(250)}
              aria-label="Add 250ml water"
              className="px-2.5 py-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl text-xs active:scale-95"
            >
              +250ml
            </button>
          </div>
        </div>
      </section>

      {/* Weight trend */}
      <section
        onClick={onOpenWeighInModal}
        className="k-card p-5 cursor-pointer transition-all active:scale-[0.99]"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="k-section-title">Weight trend</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="k-display text-2xl text-[var(--color-text)]">
                {latestWeight ? formatWeight(latestWeight.trendWeightKg, profile.unitSystem) : '--'}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                scale {latestWeight ? formatWeight(latestWeight.actualWeightKg, profile.unitSystem) : '--'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[var(--color-text-subtle)]">7-day change</div>
            <div
              className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                weeklyDelta <= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'
              }`}
            >
              {weeklyDelta <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>
                {weeklyDelta > 0 ? `+${weeklyDelta}` : weeklyDelta} {profile.unitSystem === 'metric' ? 'kg' : 'lb'}
              </span>
            </div>
          </div>
        </div>
        <div className="h-14 w-full pt-1">
          <SparklineChart points={weightTrend.slice(-14).map((p: any) => p.actualWeightKg)} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-text-subtle)] pt-2 border-t border-[var(--color-border)]">
          <span>Tap to record today's weigh-in</span>
          <span className="text-[var(--color-accent)] font-semibold">{weightTrend.length} days logged</span>
        </div>
      </section>

      {/* Recent activity */}
      {(latestCardio || lastCompletedWorkout) && (
        <section className="k-card p-5 space-y-3">
          <span className="k-section-title">Recent activity</span>
          {lastCompletedWorkout && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Dumbbell className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="font-medium truncate">{lastCompletedWorkout.name}</span>
              </div>
              <span className="text-xs text-[var(--color-text-subtle)] tabular-nums">
                {Math.round(lastCompletedWorkout.durationSeconds / 60)} min • {lastCompletedWorkout.totalVolumeKg.toLocaleString()} kg
              </span>
            </div>
          )}
          {latestCardio && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Watch className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="font-medium truncate">{latestCardio.name || latestCardio.type}</span>
              </div>
              <span className="text-xs text-[var(--color-text-subtle)] tabular-nums">
                {latestCardio.distanceKm ? `${latestCardio.distanceKm} km • ` : ''}{latestCardio.durationMinutes} min
              </span>
            </div>
          )}
        </section>
      )}

      {/* Today's meals */}
      <section className="k-card p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="k-section-title">Today's meals</span>
          <button
            onClick={onOpenFoodModal}
            className="min-h-[36px] px-2 text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
        {todayFoods.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--color-text-subtle)]">No foods logged yet today.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {todayFoods.map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">{item.name}</div>
                  <div className="text-[11px] text-[var(--color-text-subtle)] mt-0.5">
                    <span className="capitalize text-[var(--color-accent)]">{item.mealType}</span> • {item.servingCount}× {item.servingSize} {item.servingUnit}
                  </div>
                </div>
                <div className="text-xs font-semibold text-[var(--color-text)] shrink-0 ml-2 tabular-nums">{item.calories} kcal</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MacroBar({ label, current, target, barColor, unit }: { label: string; current: number; target: number; barColor: string; unit: string }) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div className="bg-[var(--color-surface-raised)] p-3 rounded-2xl border border-[var(--color-border)]">
      <div className="text-[10px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">{label}</div>
      <div className="text-xs font-semibold text-[var(--color-text)] mt-1 tabular-nums">
        {current} <span className="text-[10px] font-normal text-[var(--color-text-subtle)]">/ {target}{unit}</span>
      </div>
      <div className="w-full bg-[var(--color-border)] rounded-full h-1.5 mt-2 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparklineChart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-text-subtle)] text-xs">
        Collecting weigh-ins…
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
        style={{ stroke: "var(--color-accent)" }}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}
