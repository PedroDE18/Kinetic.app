import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Heart,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LearningItem, RelationshipTouchpoint } from '../../types';
import { LearningItemModal } from './LearningItemModal';
import { RelationshipModal } from './RelationshipModal';
import { getLocalDateString } from '../../utils/engine';

type GrowthSubTab = 'intellect' | 'relationships' | 'advisor';

export function GrowthView() {
  const {
    state,
    deleteLearningItem,
    logRelationshipContact,
    deleteRelationshipTouchpoint,
  } = useFitness();

  const { learningItems, relationships, habits, sleepRecords, tasks } = state;
  const todayStr = useMemo(() => getLocalDateString(), []);

  const [activeSubTab, setActiveSubTab] = useState<GrowthSubTab>('intellect');

  // Modals
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [editingLearningItem, setEditingLearningItem] = useState<LearningItem | null>(null);

  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<RelationshipTouchpoint | null>(null);

  // Status Filter for Reading List
  const [statusFilter, setStatusFilter] = useState<LearningItem['status'] | 'all'>('all');

  const filteredItems = useMemo(() => {
    return learningItems.filter((i) => (statusFilter === 'all' ? true : i.status === statusFilter));
  }, [learningItems, statusFilter]);

  // Advisor Synthesis Logic
  const advisorAnalysis = useMemo(() => {
    // 1. Biological status (Sleep)
    const avgSleep = sleepRecords.length > 0
      ? sleepRecords.slice(0, 5).reduce((acc, s) => acc + s.durationMinutes, 0) / Math.min(5, sleepRecords.length) / 60
      : 8;

    const sleepDebt = avgSleep < 7.0;

    // 2. Habit compliance
    const completedHabitsCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;

    // 3. Cognitive Task Load
    const highPriorityTasks = tasks.filter((t) => !t.isCompleted && t.priority === 'high');

    // 4. Overdue Touchpoints
    const todayDate = new Date();
    const overdueContacts = relationships.filter((r) => {
      if (!r.lastContactDate) return true;
      const last = new Date(r.lastContactDate);
      const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= r.desiredFrequencyDays;
    });

    let primaryFocus = 'Maintain Steady Cadence';
    let counsel = 'Your systems are operating in equilibrium. Guard your calm attention and avoid adding non-essential commitments.';
    let recommendation = 'Protect your evening decompression window and review active friction experiments.';

    if (sleepDebt) {
      primaryFocus = 'Biological Debt & Restoration';
      counsel = `Recent sleep average (${avgSleep.toFixed(1)} hrs) is below the threshold needed for optimal emotional regulation and cognitive acuity. When biology is depleted, discipline feels like torture.`;
      recommendation = 'Lower cognitive ambition today: execute only the 2-minute minimum viable version of habits, clear high-stress tasks, and protect tonight’s bedtime.';
    } else if (highPriorityTasks.length > 3) {
      primaryFocus = 'Cognitive Overcommitment';
      counsel = `You have ${highPriorityTasks.length} high-priority tasks pending simultaneously. In Stoic and behavioral science terms, attempting to solve multiple critical demands at once fragments executive function.`;
      recommendation = 'Select only ONE decisive task for today. Defer or eliminate the others to establish unbroken momentum.';
    } else if (overdueContacts.length > 0) {
      primaryFocus = 'Relational Connection (Epicurean Philia)';
      counsel = `You have ${overdueContacts.length} meaningful relationship touchpoint${overdueContacts.length > 1 ? 's' : ''} past due (including ${overdueContacts[0].name}). True tranquility requires unhurried human warmth.`;
      recommendation = `Send a brief, unhurried message of goodwill to ${overdueContacts[0].name} without seeking immediate transactional utility.`;
    }

    return {
      primaryFocus,
      counsel,
      recommendation,
      sleepDebt,
      completedHabitsCount,
      highPriorityTasks,
      overdueContacts,
    };
  }, [sleepRecords, habits, todayStr, tasks, relationships]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sub-tab Navigation */}
      <div className="flex items-center p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveSubTab('intellect')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'intellect'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Intellect ({learningItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('relationships')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'relationships'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Relationships</span>
        </button>

        <button
          onClick={() => setActiveSubTab('advisor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'advisor'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Systems Advisor</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTELLECT & LEARNING SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'intellect' && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
                Intellectual Formation
              </div>
              <div className="text-base font-bold text-[var(--color-text)]">
                {learningItems.filter((i) => i.status === 'in_progress').length} Works Currently in Study
              </div>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Literature, scientific inquiries, and philosophical treatises
              </p>
            </div>
            <button
              onClick={() => {
                setEditingLearningItem(null);
                setShowLearningModal(true);
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Record Work</span>
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'in_progress', 'backlog', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {st === 'all' ? 'All Works' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                No items recorded in this view. Add a book, article, or treatise above.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2.5 shadow-xs hover:border-[var(--color-border-hover)] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[10px] font-semibold uppercase tracking-wider">
                          {item.type}
                        </span>
                        <span className="px-2 py-0.5 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-md text-[10px] font-bold capitalize">
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[10px] font-medium capitalize">
                          {item.area.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--color-text)]">{item.title}</h3>
                      {item.authorOrSource && (
                        <div className="text-xs text-[var(--color-text-muted)] font-serif italic">
                          by {item.authorOrSource}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingLearningItem(item);
                          setShowLearningModal(true);
                        }}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-raised)]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLearningItem(item.id)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--color-surface-raised)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.keyTakeaway && (
                    <div className="pt-1.5 border-t border-[var(--color-border)] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block">
                        Core Takeaway
                      </span>
                      <p className="text-xs text-[var(--color-text)] font-serif italic">
                        "{item.keyTakeaway}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RELATIONSHIPS SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'relationships' && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
                Epicurean Philia
              </div>
              <div className="text-base font-bold text-[var(--color-text)]">
                {relationships.length} Meaningful Connections
              </div>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Unhurried, intentional human bonds without transactional utility
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRelationship(null);
                setShowRelationshipModal(true);
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Person</span>
            </button>
          </div>

          {/* People List */}
          <div className="space-y-3">
            {relationships.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                No relationships configured yet. Add close friends, mentors, or family above.
              </div>
            ) : (
              relationships.map((person) => {
                const todayDate = new Date();
                const last = person.lastContactDate ? new Date(person.lastContactDate) : null;
                const daysSince = last
                  ? Math.floor((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
                  : 999;
                const isOverdue = daysSince >= person.desiredFrequencyDays;

                return (
                  <div
                    key={person.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      isOverdue
                        ? 'bg-[var(--color-surface)] border-amber-500/30 shadow-xs'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--color-text)]">{person.name}</span>
                          <span className="px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[10px] font-semibold capitalize">
                            {person.relationshipType}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[9px] font-bold uppercase tracking-wider">
                              Due for touchpoint
                            </span>
                          )}
                        </div>

                        {person.intention && (
                          <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                            "{person.intention}"
                          </p>
                        )}

                        <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-3 pt-0.5">
                          <span>
                            Last connected: {person.lastContactDate || 'Never'} ({daysSince === 999 ? '—' : `${daysSince}d ago`})
                          </span>
                          <span>•</span>
                          <span>Cadence: every {person.desiredFrequencyDays}d</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingRelationship(person);
                            setShowRelationshipModal(true);
                          }}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-raised)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRelationshipTouchpoint(person.id)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--color-surface-raised)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-subtle)]">
                        {isOverdue ? 'Reach out with genuine goodwill' : 'Connection cadence healthy'}
                      </span>
                      <button
                        onClick={() => logRelationshipContact(person.id, todayStr)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-surface-raised)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-all border border-[var(--color-border)]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Log Touchpoint Today</span>
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
      {/* 3. EUNOIA SECULAR ADVISOR SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'advisor' && (
        <div className="space-y-4">
          <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <Compass className="w-4 h-4" />
                <span>Socratic Systems Counsel</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">
                Secular Heuristics • $0 Cost
              </span>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
              "No toxic positivity, no aggressive hustle. Just an objective audit of biological energy, behavioral friction, and deliberate living."
            </p>

            <div className="p-4 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-accent)] tracking-wider block">
                Current Diagnostic Focus
              </span>
              <div className="text-sm font-bold text-[var(--color-text)]">
                {advisorAnalysis.primaryFocus}
              </div>
              <p className="text-xs text-[var(--color-text)] leading-relaxed">
                {advisorAnalysis.counsel}
              </p>
            </div>

            <div className="p-4 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-2xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--color-accent)] tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>The Single Next Lever</span>
              </span>
              <p className="text-xs font-medium text-[var(--color-text)] leading-relaxed">
                {advisorAnalysis.recommendation}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="p-2.5 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] block">Habits Done</span>
                <span className="font-bold text-[var(--color-text)]">
                  {advisorAnalysis.completedHabitsCount} / {habits.length}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] block">Biological State</span>
                <span className={`font-bold ${advisorAnalysis.sleepDebt ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {advisorAnalysis.sleepDebt ? 'Deficit' : 'Restored'}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-subtle)] block">Urgent Tasks</span>
                <span className="font-bold text-[var(--color-text)]">
                  {advisorAnalysis.highPriorityTasks.length}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modals */}
      {showLearningModal && (
        <LearningItemModal
          itemToEdit={editingLearningItem}
          onClose={() => setShowLearningModal(false)}
        />
      )}

      {showRelationshipModal && (
        <RelationshipModal
          personToEdit={editingRelationship}
          onClose={() => setShowRelationshipModal(false)}
        />
      )}
    </div>
  );
}
