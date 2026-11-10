import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Compass, Heart } from 'lucide-react';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { useFitness } from '../../context/FitnessContext';
import { AffectiveWeatherSelector, HOW_WE_FEEL_QUADRANTS } from './AffectiveWeatherSelector';
import { AffectiveWeather, AffectiveTag } from '../../types';
import { getLocalDateString } from '../../utils/engine';

interface MoodCheckInModalProps {
  onClose: () => void;
}

export function MoodCheckInModal({ onClose }: MoodCheckInModalProps) {
  useBodyScrollLock(true);
  const { state, addReflectionEntry } = useFitness();
  const isPt = state.profile.language === 'pt-BR';

  const [weather, setWeather] = useState<AffectiveWeather>('clear');
  const [emotion, setEmotion] = useState<string>('peaceful');
  const [tags, setTags] = useState<AffectiveTag[]>([]);
  const [stoicNote, setStoicNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const activeQuadrant = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === weather);

  const handleToggleTag = (tag: AffectiveTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const todayStr = getLocalDateString();
    addReflectionEntry({
      id: `mood-${Date.now()}`,
      date: todayStr,
      type: 'freeform',
      promptAnswers: {
        'Control Dichotomy': stoicNote.trim() || 'Checked in with emotional weather.',
      },
      specificEmotion: emotion,
      affectiveWeather: weather,
      affectiveTags: tags,
      freeformContent: stoicNote.trim()
        ? `[Stoic Mood Check-In: ${emotion}] ${stoicNote.trim()}`
        : `[Stoic Mood Check-In: ${emotion}]`,
      createdAt: new Date().toISOString(),
    });

    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-5 pb-3 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-elevated)]">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--color-accent)] text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>{isPt ? 'Clima Afetivo Estóico' : 'Stoic Emotional Weather'}</span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] mt-0.5">
              {isPt ? 'Como Você Está Agora?' : 'How Are You Feeling Right Now?'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-full hover:bg-[var(--color-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {isSaved ? (
            <div className="py-12 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-text)]">
                {isPt ? 'Clima Afetivo Registrado' : 'Emotional State Logged'}
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                {isPt
                  ? '«Você tem poder sobre sua mente, não sobre os eventos externos. Perceba isso e você encontrará a força.»'
                  : '“You have power over your mind, not outside events. Realize this, and you will find strength.”'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* 4 Quadrants & Emotions Selector */}
              <AffectiveWeatherSelector
                selectedWeather={weather}
                selectedEmotion={emotion}
                selectedTags={tags}
                onSelectWeather={(w) => {
                  setWeather(w);
                  const quad = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === w);
                  if (quad && quad.emotions.length > 0) {
                    setEmotion(quad.emotions[0].id);
                  }
                }}
                onSelectEmotion={(e) => setEmotion(e)}
                onToggleTag={handleToggleTag}
                isPortuguese={isPt}
              />

              {/* Stoic Contemplative Note */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
                  <span>{isPt ? 'O que está sob seu controle?' : 'What is within your control?'}</span>
                </label>
                <textarea
                  rows={2}
                  value={stoicNote}
                  onChange={(e) => setStoicNote(e.target.value)}
                  placeholder={
                    isPt
                      ? 'Descreva brevemente a causa ou a resposta estoica a este sentimento...'
                      : 'Briefly note the trigger or your Stoic response to this feeling...'
                  }
                  className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-md mt-2"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isPt ? 'Confirmar Clima Afetivo' : 'Log Emotional Weather'}
                  {activeQuadrant && ` (${isPt ? activeQuadrant.descriptorPt : activeQuadrant.descriptorEn})`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
