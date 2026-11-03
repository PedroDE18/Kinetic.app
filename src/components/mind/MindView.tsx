import React, { useState, useMemo } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Feather,
  Quote,
  CheckCircle2,
  ChevronRight,
  Heart,
  Edit2,
  Compass,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { ReflectionEntry, ReflectionType, LearningItem, RelationshipTouchpoint } from '../../types';
import { ReflectionModal } from './ReflectionModal';
import { LearningItemModal } from '../growth/LearningItemModal';
import { RelationshipModal } from '../growth/RelationshipModal';
import { getLocalDateString } from '../../utils/engine';

export type MindSubTab = 'rituals' | 'intellect' | 'philia' | 'advisor';

export function MindView() {
  const {
    state,
    deleteReflectionEntry,
    deleteLearningItem,
    logRelationshipContact,
    deleteRelationshipTouchpoint,
  } = useFitness();

  const { reflections, learningItems, relationships, habits, sleepRecords, tasks } = state;
  const todayStr = useMemo(() => getLocalDateString(), []);

  const [activeSubTab, setActiveSubTab] = useState<MindSubTab>('rituals');

  // Reflection Modals
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionModalType, setReflectionModalType] = useState<ReflectionType>('morning');

  // Learning Item Modal
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [editingLearningItem, setEditingLearningItem] = useState<LearningItem | null>(null);

  // Relationship Modal
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<RelationshipTouchpoint | null>(null);

  // Status Filter for Reading List
  const [statusFilter, setStatusFilter] = useState<LearningItem['status'] | 'all'>('all');

  const filteredLearningItems = useMemo(() => {
    return learningItems.filter((i) => (statusFilter === 'all' ? true : i.status === statusFilter));
  }, [learningItems, statusFilter]);

  const todayMorning = reflections.find((r) => r.date === todayStr && r.type === 'morning');
  const todayEvening = reflections.find((r) => r.date === todayStr && r.type === 'evening');

  const openNewReflection = (type: ReflectionType) => {
    setReflectionModalType(type);
    setShowReflectionModal(true);
  };

  // Rotating Classical Secular Wisdom
  const contemplativeQuotes = [
    {
      text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
      author: 'Marcus Aurelius',
      work: 'Meditations, IV.3',
    },
    {
      text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
      author: 'Aristotle',
      work: 'Nicomachean Ethics',
    },
    {
      text: 'First say to yourself what you would be; and then do what you have to do.',
      author: 'Epictetus',
      work: 'Discourses, III.23',
    },
    {
      text: 'Do not spoil what you have by desiring what you have not; remember that what you now have was once only among the things you hoped for.',
      author: 'Epicurus',
      work: 'Principal Doctrines',
    },
    {
      text: 'Peace comes from within. Do not seek it without.',
      author: 'Secular Buddhist Teaching',
      work: 'Dhammapada',
    },
  ];

  const currentQuote =
    contemplativeQuotes[Math.floor(Date.now() / (1000 * 60 * 60 * 12)) % contemplativeQuotes.length];

  // Advisor Synthesis Logic
  const advisorAnalysis = useMemo(() => {
    const avgSleep =
      sleepRecords.length > 0
        ? sleepRecords.slice(0, 5).reduce((acc, s) => acc + s.durationMinutes, 0) /
          Math.min(5, sleepRecords.length) /
          60
        : 8;

    const sleepDebt = avgSleep < 7.0;
    const completedHabitsCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
    const highPriorityTasks = tasks.filter((t) => !t.isCompleted && t.priority === 'high');

    const todayDate = new Date();
    const overdueContacts = relationships.filter((r) => {
      if (!r.lastContactDate) return true;
      const last = new Date(r.lastContactDate);
      const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= r.desiredFrequencyDays;
    });

    let primaryFocus = 'Maintain Steady Cadence';
    let counsel =
      'Your systems are operating in equilibrium. Guard your calm attention and avoid adding non-essential commitments.';
    let recommendation =
      'Protect your evening decompression window and review active friction experiments.';

    if (sleepDebt) {
      primaryFocus = 'Biological Debt & Restoration';
      counsel = `Recent sleep average (${avgSleep.toFixed(1)} hrs) is below the threshold needed for optimal emotional regulation and cognitive acuity. When biology is depleted, discipline feels like torture.`;
      recommendation =
        'Lower cognitive ambition today: execute only the 2-minute minimum viable version of habits, clear high-stress tasks, and protect tonight’s bedtime.';
    } else if (highPriorityTasks.length > 3) {
      primaryFocus = 'Cognitive Overcommitment';
      counsel = `You have ${highPriorityTasks.length} high-priority tasks pending simultaneously. In Stoic and behavioral science terms, attempting to solve multiple critical demands at once fragments executive function.`;
      recommendation =
        'Select only ONE decisive task for today. Defer or eliminate the others to establish unbroken momentum.';
    } else if (overdueContacts.length > 0) {
      primaryFocus = 'Relational Connection (Epicurean Philia)';
      counsel = `You have ${overdueContacts.length} meaningful relationship touchpoint${
        overdueContacts.length > 1 ? 's' : ''
      } past due (including ${overdueContacts[0].name}). True tranquility requires unhurried human warmth.`;
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
      {/* Editorial Header */}
      <div className="px-1 pt-1 pb-0.5">
        <h1 className="stoic-title text-2xl font-bold tracking-tight text-[var(--color-text)]">
          mind.
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          contemplative grounding, intellectual study, deep relationships & personal wisdom.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveSubTab('rituals')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'rituals'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Feather className="w-3.5 h-3.5" />
          <span>Rituals</span>
        </button>

        <button
          onClick={() => setActiveSubTab('intellect')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'intellect'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Intellect</span>
        </button>

        <button
          onClick={() => setActiveSubTab('philia')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'philia'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Philia</span>
        </button>

        <button
          onClick={() => setActiveSubTab('advisor')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'advisor'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Advisor</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONTEMPLATIVE RITUALS SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'rituals' && (
        <div className="space-y-4">
          {/* Editorial Wisdom Card */}
          <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2.5 relative overflow-hidden shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
              <Quote className="w-3.5 h-3.5" />
              <span>contemplative grounding</span>
            </div>
            <blockquote className="eunoia-editorial text-sm sm:text-base text-[var(--color-text)] leading-relaxed italic">
              "{currentQuote.text}"
            </blockquote>
            <div className="text-[11px] text-[var(--color-text-muted)] font-medium">
              — {currentQuote.author}, <span className="opacity-75">{currentQuote.work}</span>
            </div>
          </section>

          {/* Today's Reflection Rituals */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Today's Contemplative Rituals</span>
              </span>
              <button
                onClick={() => openNewReflection('freeform')}
                className="text-xs text-[var(--color-accent)] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Freeform entry</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Morning Reflection Card */}
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--color-text)]">Morning Intention</h4>
                      <p className="text-[10px] text-[var(--color-text-muted)]">Control & obstacle preview</p>
                    </div>
                  </div>
                  {todayMorning && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>

                {todayMorning ? (
                  <div className="space-y-1 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-2.5">
                    {Object.entries(todayMorning.promptAnswers).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] font-semibold text-[var(--color-text)] block">{k}</span>
                        <p className="text-[11px] text-[var(--color-text-subtle)] truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => openNewReflection('morning')}
                    className="w-full py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] text-[var(--color-text)] font-semibold rounded-2xl text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Write Morning Intention</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Evening Reflection Card */}
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-accent)] flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--color-text)]">Evening Audit</h4>
                      <p className="text-[10px] text-[var(--color-text-muted)]">Honest review without guilt</p>
                    </div>
                  </div>
                  {todayEvening && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>

                {todayEvening ? (
                  <div className="space-y-1 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-2.5">
                    {Object.entries(todayEvening.promptAnswers).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] font-semibold text-[var(--color-text)] block">{k}</span>
                        <p className="text-[11px] text-[var(--color-text-subtle)] truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => openNewReflection('evening')}
                    className="w-full py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] text-[var(--color-text)] font-semibold rounded-2xl text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Complete Evening Audit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Historical Reflections Journal */}
          <section className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                Reflections Archive ({reflections.length})
              </span>
            </div>

            {reflections.length === 0 ? (
              <div className="p-8 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-3xl text-center space-y-2">
                <Feather className="w-6 h-6 mx-auto text-[var(--color-text-muted)] opacity-40" />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Your reflective entries will appear here. Begin with a morning reflection to set deliberate focus.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reflections.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2 text-xs relative group shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-accent)] border border-[var(--color-border)]">
                          {entry.type}
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-text)]">
                          {entry.date}
                        </span>
                        {entry.emotionalState && (
                          <span className="text-[10px] text-[var(--color-text-muted)] italic">
                            • {entry.emotionalState}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteReflectionEntry(entry.id)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Prompt Answers */}
                    {entry.promptAnswers && Object.keys(entry.promptAnswers).length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-[var(--color-border)]">
                        {Object.entries(entry.promptAnswers).map(([q, a]) => (
                          <div key={q} className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[var(--color-accent)] block uppercase tracking-wider">
                              {q}
                            </span>
                            <p className="text-xs text-[var(--color-text)] leading-relaxed pl-1 border-l-2 border-[var(--color-accent)]/30">
                              {a}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Freeform content */}
                    {entry.freeformContent && (
                      <p className="text-xs text-[var(--color-text)] leading-relaxed pt-1 whitespace-pre-wrap border-t border-[var(--color-border)]">
                        {entry.freeformContent}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTELLECT & LEARNING SUB-TAB */}
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
              <p className="text-xs text-[var(--color-text-muted)] italic">
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
            {filteredLearningItems.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                No items recorded in this view. Add a book, article, or treatise above.
              </div>
            ) : (
              filteredLearningItems.map((item) => (
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
                        <div className="text-xs text-[var(--color-text-muted)] italic">
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
                      <p className="text-xs text-[var(--color-text)] italic">
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
      {/* 3. PHILIA & RELATIONSHIPS SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'philia' && (
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
              <p className="text-xs text-[var(--color-text-muted)] italic">
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
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] shadow-xs'
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
                          <p className="text-xs text-[var(--color-text-muted)] italic">
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
      {/* 4. SOCRATIC ADVISOR SUB-TAB */}
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

            <p className="text-xs text-[var(--color-text-muted)] italic">
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

      {/* MODALS */}
      {showReflectionModal && (
        <ReflectionModal
          initialType={reflectionModalType}
          onClose={() => setShowReflectionModal(false)}
        />
      )}

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
