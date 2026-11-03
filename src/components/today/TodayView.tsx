import React, { useMemo, useState } from 'react';
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
  Scale,
  Feather,
  Sliders,
  Compass,
  Repeat,
  CheckSquare,
  Moon,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { calculateWeightTrend, formatWeight, getLocalDateString, getRecentDateStrings } from '../../utils/engine';
import { QuickLogBar } from './QuickLogBar';

interface TodayViewProps {
  onOpenFoodModal: () => void;
  onOpenWeighInModal: () => void;
  onOpenWeeklyReview: () => void;
  onOpenProfile?: () => void;
  onNavigateTab: (tab: 'systems' | 'body' | 'mind' | 'growth') => void;
  onOpenSleepModal?: () => void;
  onOpenReflectionModal?: () => void;
}

export function TodayView({
  onOpenFoodModal,
  onOpenWeighInModal,
  onOpenWeeklyReview,
  onOpenProfile,
  onNavigateTab,
  onOpenSleepModal,
  onOpenReflectionModal,
}: TodayViewProps) {
  const {
    state,
    addWater,
    startWorkout,
    getScheduledDayForDate,
    setDailyIntention,
    toggleHabitDate,
    toggleTaskCompleted,
  } = useFitness();

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
    habits,
    tasks,
    sleepRecords,
    reflections,
    frictionInterventions,
  } = state;

  const todayStr = useMemo(() => getLocalDateString(), []);
  const [waterToast, setWaterToast] = useState<{ amount: number; message: string } | null>(null);

  // Daily Intention State
  const [intentionText, setIntentionText] = useState(profile.dailyIntention || '');
  const [isEditingIntention, setIsEditingIntention] = useState(!profile.dailyIntention);

  const handleSaveIntention = (e: React.FormEvent) => {
    e.preventDefault();
    setDailyIntention(intentionText.trim());
    setIsEditingIntention(false);
  };

  const handleQuickAddWater = (amount: number) => {
    addWater(amount);
    setWaterToast({ amount, message: `Added +${amount} ml water` });
    setTimeout(() => {
      setWaterToast((curr: { amount: number; message: string } | null) =>
        curr?.amount === amount ? null : curr
      );
    }, 4500);
  };

  const handleUndoWater = () => {
    if (!waterToast) return;
    addWater(-waterToast.amount);
    setWaterToast(null);
  };

  const todayFoods = useMemo(
    () => loggedFoods.filter((f) => f.loggedAt.startsWith(todayStr)),
    [loggedFoods, todayStr]
  );

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

  // Today's scheduled routine
  const scheduledDay = useMemo(() => getScheduledDayForDate(todayStr), [getScheduledDayForDate, todayStr]);
  const recentDates = useMemo(() => getRecentDateStrings(5), []);
  const isTrainingDay = scheduledDay?.type === 'training';
  const scheduledTemplate = useMemo(
    () => templates.find((t) => t.id === scheduledDay?.templateId) || templates[0],
    [templates, scheduledDay]
  );

  const lastCompletedWorkout = completedWorkouts[0];
  const latestCardio = cardioSessions[0];

  // Sleep and reflection signals for Today
  const recentSleep = sleepRecords[0];
  const todayMorningReflection = reflections.find((r) => r.date === todayStr && r.type === 'morning');
  const todayEveningReflection = reflections.find((r) => r.date === todayStr && r.type === 'evening');

  // Habits and Tasks for Today
  const todayHabits = habits.slice(0, 4);
  const completedHabitsCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const highPriorityTasks = tasks.filter((t) => !t.isCompleted).slice(0, 3);
  const activeFrictionTip = frictionInterventions.find((f) => f.status === 'active' || f.status === 'experimenting');

  // Weekly consistency: Mon..Sun of current week
  const weekDays = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const ds = getLocalDateString(d);
      const completed = completedWorkouts.some((w) => (w.startTime || '').startsWith(ds));
      const scheduled = (state.weeklySchedule || []).find((s) => s.dayIndex === d.getDay());
      days.push({
        date: ds,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        completed,
        isTraining: scheduled?.type === 'training',
      });
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
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <header className="pt-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-serif italic text-[var(--color-text-subtle)]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="eunoia-editorial text-2xl font-bold text-[var(--color-text)] mt-0.5 tracking-tight">
              {greeting}, {profile.name?.split(' ')[0] || 'Friend'}
            </h1>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-serif font-black text-lg shadow-xs">
            Ε
          </div>
        </div>
      </header>

      {/* Daily Intention Card (Grounding in Deliberate Action) */}
      <section className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2 shadow-xs transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Daily Deliberate Intention</span>
          </span>
          {!isEditingIntention && (
            <button
              onClick={() => setIsEditingIntention(true)}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] font-semibold"
            >
              Refine
            </button>
          )}
        </div>

        {isEditingIntention ? (
          <form onSubmit={handleSaveIntention} className="space-y-2">
            <input
              type="text"
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              placeholder="What will you choose to focus on today? (e.g. Unhurried presence, disciplined focus)"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-serif italic"
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-3 py-1 bg-[var(--color-accent)] text-[var(--color-on-accent)] rounded-xl text-[11px] font-bold shadow-xs"
              >
                Set Intention
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs font-serif italic text-[var(--color-text)] leading-relaxed">
            "{profile.dailyIntention || 'Live deliberately today; differentiate what is in your control from what is not.'}"
          </p>
        )}
      </section>

      {/* Flourishing Signals 4-Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Mind Signal */}
        <button
          onClick={() => onNavigateTab('mind')}
          className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-left space-y-1 hover:border-[var(--color-accent)]/40 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-semibold">
            <span className="flex items-center gap-1">
              <Feather className="w-3 h-3 text-[var(--color-accent)]" /> Mind
            </span>
            <span>{todayMorningReflection ? 'Done' : 'Pending'}</span>
          </div>
          <div className="text-xs font-bold text-[var(--color-text)] truncate">
            {todayMorningReflection ? 'Morning Audited' : 'Reflect Today'}
          </div>
        </button>

        {/* Recovery / Sleep Signal */}
        <button
          onClick={() => (onOpenSleepModal ? onOpenSleepModal() : onNavigateTab('body'))}
          className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-left space-y-1 hover:border-[var(--color-accent)]/40 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-semibold">
            <span className="flex items-center gap-1">
              <Moon className="w-3 h-3 text-[var(--color-accent)]" /> Sleep
            </span>
            <span>{recentSleep ? `${(recentSleep.durationMinutes / 60).toFixed(1)}h` : 'Log'}</span>
          </div>
          <div className="text-xs font-bold text-[var(--color-text)] truncate">
            {recentSleep ? `${recentSleep.restfulness} rest` : 'Log Last Night'}
          </div>
        </button>

        {/* Systems Signal */}
        <button
          onClick={() => onNavigateTab('systems')}
          className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-left space-y-1 hover:border-[var(--color-accent)]/40 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-semibold">
            <span className="flex items-center gap-1">
              <Repeat className="w-3 h-3 text-[var(--color-accent)]" /> Habits
            </span>
            <span>{completedHabitsCount}/{habits.length}</span>
          </div>
          <div className="text-xs font-bold text-[var(--color-text)] truncate">
            {habits.length > 0 ? `${Math.round((completedHabitsCount / habits.length) * 100)}% Complete` : 'None'}
          </div>
        </button>

        {/* Nutrition Signal */}
        <button
          onClick={() => onNavigateTab('body')}
          className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-left space-y-1 hover:border-[var(--color-accent)]/40 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-semibold">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-[var(--color-accent)]" /> Energy
            </span>
            <span>{isOverTarget ? 'Over' : `${remainingCals} left`}</span>
          </div>
          <div className="text-xs font-bold text-[var(--color-text)] truncate">
            {consumed.calories} / {profile.targets.calories} kcal
          </div>
        </button>
      </section>

      {/* Natural Language Quick-Log Bar */}
      <QuickLogBar />

      {/* Pending Review Alert (if any) */}
      {pendingReview && (
        <button
          onClick={onOpenWeeklyReview}
          aria-label="Open Weekly Macro Check-in"
          className="w-full text-left p-4 rounded-3xl bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-text)] flex items-center justify-between transition-all active:scale-[0.99] shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center shrink-0 text-[var(--color-accent)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Weekly Review Proposal Ready
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Expenditure calculated • Macro adjustment recommendation
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-text-subtle)] shrink-0" />
        </button>
      )}

      {/* TODAY'S HABITS CHECKLIST */}
      {todayHabits.length > 0 && (
        <section className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="k-section-title flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Today's Habits</span>
            </span>
            <button
              onClick={() => onNavigateTab('systems')}
              className="text-[11px] text-[var(--color-accent)] font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View all ({habits.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {todayHabits.map((habit) => {
              const isCompleted = habit.completedDates.includes(todayStr);
              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-2.5 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)] text-xs"
                >
                  <button
                    onClick={() => toggleHabitDate(habit.id, todayStr)}
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className={`font-semibold ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {habit.title}
                      </span>
                      {habit.minimumViableAction && (
                        <div className="text-[10px] text-[var(--color-text-muted)] font-serif italic">
                          Fallback: {habit.minimumViableAction}
                        </div>
                      )}
                    </div>
                  </button>
                  <span className="text-[10px] font-bold text-[var(--color-text-subtle)] px-2">
                    {habit.completedDates.length}d
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TODAY'S PRIORITY TASKS */}
      {highPriorityTasks.length > 0 && (
        <section className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="k-section-title flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Priority Tasks</span>
            </span>
            <button
              onClick={() => onNavigateTab('systems')}
              className="text-[11px] text-[var(--color-accent)] font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Systems</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {highPriorityTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2.5 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)] text-xs"
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <button
                    onClick={() => toggleTaskCompleted(t.id)}
                    className="w-4 h-4 rounded-md border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center shrink-0"
                  >
                    {t.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />}
                  </button>
                  <span className="font-semibold text-[var(--color-text)] truncate">{t.title}</span>
                </div>
                <span className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                  {t.area}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVE FRICTION ENGINEERING NUDGE */}
      {activeFrictionTip && (
        <section className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)] flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              <span>Active Environment Design</span>
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] capitalize">
              {activeFrictionTip.category}
            </span>
          </div>
          <div className="text-xs font-bold text-[var(--color-text)]">{activeFrictionTip.title}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            {activeFrictionTip.mechanism}
          </p>
        </section>
      )}

      {/* TODAY'S TRAINING / RECOVERY PLAN */}
      <section className="k-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="k-section-title">Physical Training</span>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isTrainingDay
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]'
            }`}
          >
            {isTrainingDay ? 'Training Day' : scheduledDay?.type === 'active_recovery' ? 'Active Recovery' : 'Rest Day'}
          </span>
        </div>

        {isTrainingDay ? (
          <div>
            <h2 className="k-display text-xl text-[var(--color-text)]">
              {scheduledTemplate?.name || scheduledDay?.focusName || 'Training Session'}
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
                  onClick={() => onNavigateTab('body')}
                  className="min-h-[48px] mt-4 w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Workout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  startWorkout(scheduledTemplate?.id || scheduledDay?.templateId);
                  onNavigateTab('body');
                }}
                className="min-h-[48px] mt-4 w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Workout</span>
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
                  {scheduledDay?.focusName || 'Rest & Recovery'}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  {scheduledDay?.type === 'active_recovery'
                    ? 'Light movement and mobility. Keep it easy.'
                    : 'No structured training. Prioritize sleep, nutrition, and reflection.'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAddWater(250)}
                className="min-h-[44px] py-2.5 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold flex items-center justify-center gap-2 active:scale-95"
              >
                <Droplets className="w-4 h-4 text-[var(--color-info)]" />
                <span>+250 ml Water</span>
              </button>
              <button
                onClick={onOpenFoodModal}
                className="min-h-[44px] py-2.5 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Log a Meal</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Weekly consistency */}
      <section className="k-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="k-section-title">Weekly Cadence</span>
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
              Daily Nutrition
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
              onClick={() => handleQuickAddWater(250)}
              aria-label="Add 250ml water"
              className="px-2.5 py-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl text-xs active:scale-95"
            >
              +250ml
            </button>
          </div>
        </div>

        {/* Quick Water Undo Toast */}
        {waterToast && (
          <div className="mt-2 p-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-info)]/30 text-xs flex items-center justify-between text-[var(--color-text)] animate-fade-in">
            <span className="text-[11px] text-[var(--color-info)] font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              {waterToast.message}
            </span>
            <button
              onClick={handleUndoWater}
              className="text-[10px] font-bold text-[var(--color-accent)] hover:underline px-2 py-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              Undo
            </button>
          </div>
        )}
      </section>

      {/* Weight trend */}
      <section
        onClick={onOpenWeighInModal}
        className="k-card p-5 cursor-pointer transition-all active:scale-[0.99]"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="k-section-title">Weight Trend</span>
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
            <div className="text-[11px] text-[var(--color-text-subtle)]">7-Day Change</div>
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
          <SparklineChart points={weightTrend.slice(-14).map((p) => p.actualWeightKg)} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-text-subtle)] pt-2 border-t border-[var(--color-border)]">
          <span>Tap to record today's weigh-in</span>
          <span className="text-[var(--color-accent)] font-semibold">{weightTrend.length} days logged</span>
        </div>
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
        style={{ stroke: 'var(--color-accent)' }}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}
