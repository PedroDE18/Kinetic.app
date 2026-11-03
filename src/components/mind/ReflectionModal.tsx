import React, { useState } from 'react';
import { X, Sun, Moon, Sparkles, Check, Heart, Feather, BookOpen } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { ReflectionEntry, ReflectionType, EmotionalState, AffectiveWeather, AffectiveTag } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { getLocalDateString } from '../../utils/engine';
import { AffectiveWeatherSelector } from './AffectiveWeatherSelector';

interface ReflectionModalProps {
  onClose: () => void;
  initialType?: ReflectionType;
  targetDate?: string;
}

export function ReflectionModal({
  onClose,
  initialType = 'morning',
  targetDate,
}: ReflectionModalProps) {
  useBodyScrollLock(true);
  const { state, addReflectionEntry } = useFitness();
  const dateStr = targetDate || getLocalDateString();
  const isPortuguese = state.profile.language === 'pt-BR';

  const [reflectionType, setReflectionType] = useState<ReflectionType>(initialType);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('calm');
  const [affectiveWeather, setAffectiveWeather] = useState<AffectiveWeather>('clear');
  const [affectiveTags, setAffectiveTags] = useState<AffectiveTag[]>([]);

  // Morning Prompts
  const [controllable, setControllable] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [conduct, setConduct] = useState('');

  // Evening Prompts
  const [wellDone, setWellDone] = useState('');
  const [unaligned, setUnaligned] = useState('');
  const [learning, setLearning] = useState('');

  // Freeform
  const [freeformText, setFreeformText] = useState('');

  const handleToggleTag = (tag: AffectiveTag) => {
    setAffectiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const promptAnswers: Record<string, string> = {};

    if (reflectionType === 'morning') {
      if (controllable.trim()) promptAnswers['Within My Control'] = controllable.trim();
      if (obstacles.trim()) promptAnswers['Anticipated Obstacles'] = obstacles.trim();
      if (conduct.trim()) promptAnswers['Intended Conduct'] = conduct.trim();
    } else if (reflectionType === 'evening') {
      if (wellDone.trim()) promptAnswers['What Went Well'] = wellDone.trim();
      if (unaligned.trim()) promptAnswers['Where I Stray / Friction'] = unaligned.trim();
      if (learning.trim()) promptAnswers['Insight & Lesson'] = learning.trim();
    }

    const newEntry: ReflectionEntry = {
      id: `refl-${Date.now()}`,
      date: dateStr,
      type: reflectionType,
      promptAnswers,
      freeformContent: freeformText.trim() || undefined,
      emotionalState,
      affectiveWeather,
      affectiveTags,
      createdAt: new Date().toISOString(),
    };

    addReflectionEntry(newEntry);
    onClose();
  };

  const emotions: { key: EmotionalState; label: string }[] = [
    { key: 'centered', label: 'Centered' },
    { key: 'calm', label: 'Calm' },
    { key: 'anxious', label: 'Anxious' },
    { key: 'scattered', label: 'Scattered' },
    { key: 'fatigued', label: 'Fatigued' },
    { key: 'energized', label: 'Energized' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <Feather className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Stoic Reflection</h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">Deliberate pause for {dateStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close reflection dialog"
            className="w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reflection Mode Tabs */}
        <div className="grid grid-cols-3 bg-[var(--color-surface-sunken)] p-1 rounded-2xl border border-[var(--color-border)] text-xs">
          <button
            type="button"
            onClick={() => setReflectionType('morning')}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              reflectionType === 'morning'
                ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Morning</span>
          </button>
          <button
            type="button"
            onClick={() => setReflectionType('evening')}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              reflectionType === 'evening'
                ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Evening</span>
          </button>
          <button
            type="button"
            onClick={() => setReflectionType('freeform')}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              reflectionType === 'freeform'
                ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Freeform</span>
          </button>
        </div>

        {/* Affective Weather & Contributing Factors (How We Feel inspired) */}
        <div className="pt-1">
          <AffectiveWeatherSelector
            selectedWeather={affectiveWeather}
            selectedTags={affectiveTags}
            onSelectWeather={setAffectiveWeather}
            onToggleTag={handleToggleTag}
            isPortuguese={isPortuguese}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {reflectionType === 'morning' && (
            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-accent)] block">
                  1. What is within my direct control today?
                </span>
                <p className="text-[10px] text-[var(--color-text-subtle)]">
                  My actions, responses, and attention — not external outcomes or other people's opinions.
                </p>
                <textarea
                  rows={2}
                  value={controllable}
                  onChange={(e) => setControllable(e.target.value)}
                  placeholder="e.g. My focus during study, my patience with colleagues, choosing to train..."
                  className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none"
                />
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-accent)] block">
                  2. What obstacles or friction might arise?
                </span>
                <textarea
                  rows={2}
                  value={obstacles}
                  onChange={(e) => setObstacles(e.target.value)}
                  placeholder="e.g. Fatigue in the afternoon, impulse to open phone during work..."
                  className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none"
                />
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-accent)] block">
                  3. How do I intend to conduct myself?
                </span>
                <textarea
                  rows={2}
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  placeholder="e.g. Calm, deliberate, attentive to the task in front of me..."
                  className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none"
                />
              </div>
            </div>
          )}

          {reflectionType === 'evening' && (
            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-success)] block">
                  1. What went well today?
                </span>
                <textarea
                  rows={2}
                  value={wellDone}
                  onChange={(e) => setWellDone(e.target.value)}
                  placeholder="e.g. Kept focus during the morning block, finished resistance training..."
                  className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none"
                />
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-warning)] block">
                  2. Where did I act against my intentions?
                </span>
                <textarea
                  rows={2}
                  value={unaligned}
                  onChange={(e) => setUnaligned(e.target.value)}
                  placeholder="e.g. Reacted with mild irritation to an interruption; grazed on snacks..."
                  className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none"
                />
              </div>

              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-accent)] block">
                  3. What did I learn, and what will I adjust tomorrow?
                </span>
                <textarea
                  rows={2}
                  value={learning}
                  onChange={(e) => setLearning(e.target.value)}
                  placeholder="e.g. Step outside for 5 mins of fresh air when feeling restless..."
                  className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none"
                />
              </div>
            </div>
          )}

          {reflectionType === 'freeform' && (
            <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-[var(--color-accent)] block">
                Free-form Journal & Gratitude
              </span>
              <textarea
                rows={6}
                value={freeformText}
                onChange={(e) => setFreeformText(e.target.value)}
                placeholder="Write your candid reflections, observations, ideas or things for which you are genuinely grateful..."
                className="w-full bg-transparent text-xs text-[var(--color-text)] focus:outline-none pt-1 resize-none leading-relaxed"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Preserve Reflection</span>
          </button>
        </form>
      </div>
    </div>
  );
}
