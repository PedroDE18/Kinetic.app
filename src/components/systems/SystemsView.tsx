import React, { useState, useMemo } from 'react';
import {
  Layers,
  Repeat,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { EunoiaHabit, FrictionIntervention, LifeTask, LifeArea, FrictionCategory, LifeGoal, LifeProject } from '../../types';
import { HabitModal, LIFE_AREAS } from './HabitModal';
import { FrictionEngineModal } from './FrictionEngineModal';
import { TaskModal } from './TaskModal';
import { GoalModal } from './GoalModal';
import { ProjectModal } from './ProjectModal';
import { getLocalDateString } from '../../utils/engine';
import { getTranslations, resolveInitialLanguage } from '../../utils/i18n';

type SystemsSubTab = 'habits' | 'friction' | 'organization';

export function SystemsView() {
  const {
    state,
    toggleHabitDate,
    deleteHabit,
    updateFrictionIntervention,
    deleteFrictionIntervention,
    toggleTaskCompleted,
    deleteTask,
    deleteGoal,
    deleteProject,
  } = useFitness();

  const { habits, frictionInterventions, tasks, projects, goals } = state;
  const todayStr = useMemo(() => getLocalDateString(), []);

  const [activeSubTab, setActiveSubTab] = useState<SystemsSubTab>('habits');

  // Modals state
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<EunoiaHabit | null>(null);

  const [showFrictionModal, setShowFrictionModal] = useState(false);
  const [editingFriction, setEditingFriction] = useState<FrictionIntervention | null>(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<LifeTask | null>(null);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LifeGoal | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<LifeProject | null>(null);

  // Filters
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'anytime'>('all');
  const [frictionCategoryFilter, setFrictionCategoryFilter] = useState<FrictionCategory | 'all'>('all');

  // Last 28 days for habit consistency dot matrix
  const recent28Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, []);

  // Habits calculations
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      const matchArea = areaFilter === 'all' ? true : h.area === areaFilter;
      const matchTime = timeFilter === 'all' ? true : (h.timeOfDay || 'anytime') === timeFilter;
      return matchArea && matchTime;
    });
  }, [habits, areaFilter, timeFilter]);

  const completedHabitsToday = useMemo(() => {
    return habits.filter((h) => h.completedDates.includes(todayStr)).length;
  }, [habits, todayStr]);

  // Friction calculations
  const filteredFriction = useMemo(() => {
    return frictionInterventions.filter((f) =>
      frictionCategoryFilter === 'all' ? true : f.category === frictionCategoryFilter
    );
  }, [frictionInterventions, frictionCategoryFilter]);

  // Tasks calculations
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => (areaFilter === 'all' ? true : t.area === areaFilter));
  }, [tasks, areaFilter]);

  const activeTasks = filteredTasks.filter((t) => !t.isCompleted);
  const completedTasks = filteredTasks.filter((t) => t.isCompleted);
  const lang = state.profile.language || resolveInitialLanguage();
  const t = getTranslations(lang);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="px-1 pt-1 pb-0.5">
        <h1 className="stoic-title text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t.systems.title}
        </h1>
      </div>

      {/* Systems Sub-navigation Switcher */}
      <div className="flex items-center p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveSubTab('habits')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'habits'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>{t.systems.habits} ({habits.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('friction')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'friction'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t.systems.frictionEngine}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('organization')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'organization'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.systems.organization}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. HABITS & ROUTINES SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'habits' && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
                Behavioral Cadence
              </div>
              <div className="text-base font-bold text-[var(--color-text)]">
                {completedHabitsToday} of {habits.length} Anchored Today
              </div>
            </div>
            <button
              onClick={() => {
                setEditingHabit(null);
                setShowHabitModal(true);
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Design Habit</span>
            </button>
          </div>

          {/* Area & Time Filter Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setAreaFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all ${
                  areaFilter === 'all'
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                All Areas
              </button>
              {LIFE_AREAS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAreaFilter(a.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all ${
                    areaFilter === a.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(['all', 'morning', 'afternoon', 'evening', 'anytime'] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeFilter(time)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 capitalize transition-all ${
                    timeFilter === time
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] border border-[var(--color-accent)]/40 font-bold'
                      : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]'
                  }`}
                >
                  {time === 'all' ? 'All Times' : time}
                </button>
              ))}
            </div>
          </div>

          {/* Habits List */}
          <div className="space-y-2.5">
            {filteredHabits.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                No habits configured in this filter.
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const isCompletedToday = habit.completedDates.includes(todayStr);
                const streak = habit.completedDates.length;
                const dayOfWeek = new Date().getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isScheduledToday =
                  habit.frequency === 'daily'
                    ? true
                    : habit.frequency === 'weekdays'
                    ? !isWeekend
                    : habit.frequency === 'weekends'
                    ? isWeekend
                    : true;
                const habit28Count = recent28Days.filter((d) => habit.completedDates.includes(d)).length;
                const habit28Pct = Math.round((habit28Count / 28) * 100);

                return (
                  <div
                    key={habit.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      isCompletedToday
                        ? 'bg-[var(--color-surface)] border-[var(--color-accent)]/40 shadow-xs'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => toggleHabitDate(habit.id, todayStr)}
                        className="flex items-start gap-3 text-left flex-1"
                      >
                        <div
                          className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isCompletedToday
                              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                              : 'border-2 border-[var(--color-border)] hover:border-[var(--color-accent)]'
                          }`}
                        >
                          {isCompletedToday && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold tracking-tight ${
                                isCompletedToday
                                  ? 'text-[var(--color-text)] line-through opacity-70'
                                  : 'text-[var(--color-text)]'
                              }`}
                            >
                              {habit.title}
                            </span>
                            {!isScheduledToday && (
                              <span className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-subtle)] rounded-md text-[9px] font-semibold">
                                Off Day ({habit.frequency})
                              </span>
                            )}
                            {habit.isNonNegotiable && (
                              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                Non-Negotiable
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[9px] font-semibold capitalize">
                              {habit.timeOfDay || 'anytime'}
                            </span>
                          </div>

                          {habit.purpose && (
                            <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                              "{habit.purpose}"
                            </p>
                          )}

                          {habit.minimumViableAction && (
                            <div className="inline-flex items-center gap-1 text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-lg font-medium">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>2-Min Fallback: {habit.minimumViableAction}</span>
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-bold text-[var(--color-text-muted)] mr-1">
                          {streak}d
                        </span>
                        <button
                          onClick={() => {
                            setEditingHabit(habit);
                            setShowHabitModal(true);
                          }}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-raised)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--color-surface-raised)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 28-Day Consistency Dot Matrix / Heatmap */}
                    <div className="pt-2.5 mt-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {recent28Days.map((d) => {
                          const done = habit.completedDates.includes(d);
                          const isToday = d === todayStr;
                          return (
                            <div
                              key={d}
                              title={`${d}: ${done ? 'Completed' : 'Missed'}`}
                              className={`w-2 h-2 rounded-[2px] transition-colors ${
                                done
                                  ? 'bg-[var(--color-accent)]'
                                  : isToday
                                  ? 'bg-transparent border border-[var(--color-accent)]'
                                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)]'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-[var(--color-text-subtle)] font-medium tabular-nums">
                        {habit28Pct}% 28d
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FRICTION ENGINEERING ENGINE SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'friction' && (
        <div className="space-y-4">
          {/* Header */}
          <section className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <Sliders className="w-4 h-4" />
                <span>Behavioral Architecture</span>
              </div>
              <button
                onClick={() => {
                  setEditingFriction(null);
                  setShowFrictionModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Engineer Intervention</span>
              </button>
            </div>
          </section>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'physical', 'digital', 'temporal', 'social'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFrictionCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 capitalize transition-all ${
                  frictionCategoryFilter === cat
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {cat === 'all' ? 'All Interventions' : cat}
              </button>
            ))}
          </div>

          {/* Interventions Grid */}
          <div className="space-y-3">
            {filteredFriction.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                No active friction interventions in this domain. Design one above to reshape your behavioral environment.
              </div>
            ) : (
              filteredFriction.map((item) => {
                const isAdd = item.actionType === 'add_friction';
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs hover:border-[var(--color-border-hover)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isAdd
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                            }`}
                          >
                            {isAdd ? '+ Add Friction' : '− Remove Friction'}
                          </span>
                          <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[10px] font-semibold capitalize">
                            {item.category}
                          </span>
                          <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-subtle)] rounded-md text-[10px] font-medium capitalize">
                            {item.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--color-text)]">{item.title}</h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingFriction(item);
                            setShowFrictionModal(true);
                          }}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-raised)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteFrictionIntervention(item.id)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--color-surface-raised)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider">
                          Target Impulse:{' '}
                        </span>
                        <span className="text-[var(--color-text)] font-medium">{item.targetBehavior}</span>
                      </div>
                      <div className="p-3 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-accent)] tracking-wider block mb-1">
                          Structural Mechanism
                        </span>
                        <p className="text-xs text-[var(--color-text)] leading-relaxed">{item.mechanism}</p>
                      </div>

                      {item.implementationSteps && item.implementationSteps.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block mb-1">
                            Architecture Checklist:
                          </span>
                          <ul className="space-y-1">
                            {item.implementationSteps.map((step, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-[11px] text-[var(--color-text)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                      <span>Effectiveness: {item.perceivedEffectiveness || 4}/5</span>
                      <button
                        onClick={() => {
                          const nextStatus: Record<string, FrictionIntervention['status']> = {
                            experimenting: 'active',
                            active: 'mastered',
                            mastered: 'paused',
                            paused: 'experimenting',
                          };
                          updateFrictionIntervention({
                            ...item,
                            status: nextStatus[item.status] || 'active',
                          });
                        }}
                        className="text-[10px] font-semibold text-[var(--color-accent)] hover:underline"
                      >
                        Cycle Status →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIFE ORGANIZATION (HIERARCHY) SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'organization' && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
                Telos & Hierarchy
              </div>
              <div className="text-base font-bold text-[var(--color-text)]">
                {activeTasks.length} Active Tasks Across {goals.length} Goals
              </div>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Areas of Life → Goals → Projects → Tasks
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Area Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setAreaFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all ${
                areaFilter === 'all'
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
              }`}
            >
              All Domains
            </button>
            {LIFE_AREAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAreaFilter(a.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all ${
                  areaFilter === a.id
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Active Tasks */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="k-section-title">Actionable Tasks</span>
              <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
                {activeTasks.length} pending
              </span>
            </div>

            {activeTasks.length === 0 ? (
              <div className="p-6 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                All clear in this domain. No pending tasks.
              </div>
            ) : (
              <div className="space-y-2">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-[var(--color-border-hover)] transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="w-5 h-5 rounded-lg border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center shrink-0 transition-all"
                      >
                        {task.isCompleted && <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-text)]">{task.title}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              task.priority === 'high'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-subtle)]">
                          {task.area && <span className="capitalize">{task.area.replace('_', ' ')}</span>}
                          {task.dueDate && <span>Due {task.dueDate}</span>}
                          {task.notes && <span>• {task.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowTaskModal(true);
                        }}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-raised)]"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--color-surface-raised)]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Telos & Core Goals Rollup */}
          <section className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="k-section-title">Telos & Core Intentions</span>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Goal</span>
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-center space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">No long-term intentions defined yet.</p>
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setShowGoalModal(true);
                  }}
                  className="px-3 py-1.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-sunken)] inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Define Telos / Goal</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {goals.map((g) => {
                  const goalProjects = projects.filter((p) => p.goalId === g.id);
                  const goalTasks = tasks.filter(
                    (t) => t.goalId === g.id || goalProjects.some((p) => p.id === t.projectId)
                  );
                  const completedTasksCount = goalTasks.filter((t) => t.isCompleted).length;
                  const rollupPct =
                    goalTasks.length > 0
                      ? Math.round((completedTasksCount / goalTasks.length) * 100)
                      : (g.progressPercentage ?? 0);

                  return (
                    <div
                      key={g.id}
                      className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2 shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-accent)] rounded-md text-[10px] font-bold capitalize">
                          {g.area.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[var(--color-accent)] tabular-nums">
                            {rollupPct}%
                          </span>
                          <button
                            onClick={() => {
                              setEditingGoal(g);
                              setShowGoalModal(true);
                            }}
                            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded hover:bg-[var(--color-surface-raised)]"
                            title="Edit Goal"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteGoal(g.id)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-red-500 rounded hover:bg-[var(--color-surface-raised)]"
                            title="Delete Goal"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--color-text)]">{g.title}</h4>
                      {g.description && (
                        <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">{g.description}</p>
                      )}
                      <div className="w-full h-1.5 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-accent)] transition-all duration-300"
                          style={{ width: `${rollupPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] flex justify-between pt-0.5">
                        <span>{goalProjects.length} Projects</span>
                        <span>{completedTasksCount}/{goalTasks.length} Tasks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active Projects Overview */}
          <section className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="k-section-title">Active Projects</span>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectModal(true);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Project</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-center space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">No active projects configured.</p>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setShowProjectModal(true);
                  }}
                  className="px-3 py-1.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-sunken)] inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start New Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {projects.map((proj) => {
                  const projTasks = tasks.filter((t) => t.projectId === proj.id);
                  const doneCount = projTasks.filter((t) => t.isCompleted).length;
                  const progressPct = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;

                  return (
                    <div
                      key={proj.id}
                      className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2 shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[10px] font-semibold capitalize">
                          {proj.area.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[var(--color-accent)]">{progressPct}%</span>
                          <button
                            onClick={() => {
                              setEditingProject(proj);
                              setShowProjectModal(true);
                            }}
                            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded hover:bg-[var(--color-surface-raised)]"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteProject(proj.id)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-red-500 rounded hover:bg-[var(--color-surface-raised)]"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--color-text)]">{proj.title}</h4>
                      {proj.description && (
                        <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">{proj.description}</p>
                      )}
                      <div className="w-full h-1.5 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-accent)] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] text-right pt-0.5">
                        <span>{doneCount}/{projTasks.length} Tasks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed Tasks Accordion */}
          {completedTasks.length > 0 && (
            <section className="pt-2">
              <details className="group">
                <summary className="cursor-pointer text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-between px-1 py-1">
                  <span>Completed Tasks ({completedTasks.length})</span>
                  <span className="text-[10px] text-[var(--color-text-subtle)]">Tap to expand</span>
                </summary>
                <div className="space-y-1.5 pt-2">
                  {completedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 bg-[var(--color-surface)]/60 border border-[var(--color-border)]/60 rounded-xl flex items-center justify-between text-xs opacity-60"
                    >
                      <div className="flex items-center gap-2 line-through">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <span>{t.title}</span>
                      </div>
                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-[var(--color-text-muted)] hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      {showHabitModal && (
        <HabitModal habitToEdit={editingHabit} onClose={() => setShowHabitModal(false)} />
      )}

      {showFrictionModal && (
        <FrictionEngineModal
          interventionToEdit={editingFriction}
          onClose={() => setShowFrictionModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          taskToEdit={editingTask}
          initialArea={areaFilter === 'all' ? undefined : areaFilter}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showGoalModal && (
        <GoalModal
          goalToEdit={editingGoal}
          initialArea={areaFilter === 'all' ? undefined : areaFilter}
          onClose={() => setShowGoalModal(false)}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          projectToEdit={editingProject}
          initialArea={areaFilter === 'all' ? undefined : areaFilter}
          onClose={() => setShowProjectModal(false)}
        />
      )}
    </div>
  );
}
