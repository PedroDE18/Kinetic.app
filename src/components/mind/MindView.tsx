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
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { ReflectionEntry, ReflectionType } from '../../types';
import { ReflectionModal } from './ReflectionModal';
import { getLocalDateString } from '../../utils/engine';

export function MindView() {
  const { state, deleteReflectionEntry } = useFitness();
  const { reflections } = state;

  const todayStr = useMemo(() => getLocalDateString(), []);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ReflectionType>('morning');

  const todayMorning = reflections.find((r) => r.date === todayStr && r.type === 'morning');
  const todayEvening = reflections.find((r) => r.date === todayStr && r.type === 'evening');

  const openNewReflection = (type: ReflectionType) => {
    setModalType(type);
    setShowModal(true);
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

  const currentQuote = contemplativeQuotes[Math.floor(Date.now() / (1000 * 60 * 60 * 12)) % contemplativeQuotes.length];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Editorial Wisdom Card */}
      <section className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-2.5 relative overflow-hidden shadow-xs">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
          <Quote className="w-3.5 h-3.5" />
          <span>Contemplative Grounding</span>
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
          <span className="k-section-title flex items-center gap-1.5">
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
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col justify-between space-y-3">
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
                className="w-full py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] text-[var(--color-text)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
              >
                <span>Write Morning Intention</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Evening Reflection Card */}
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-secondary-accent-soft)] text-[var(--color-secondary-accent)] flex items-center justify-center">
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
                className="w-full py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] text-[var(--color-text)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
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
          <span className="k-section-title">Reflections Archive ({reflections.length})</span>
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
                className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-2 text-xs relative group"
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

      {/* Reflection Modal */}
      {showModal && (
        <ReflectionModal
          initialType={modalType}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
