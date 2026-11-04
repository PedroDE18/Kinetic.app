import React from 'react';
import { AffectiveWeather, AffectiveTag } from '../../types';
import { triggerHapticFeedback } from '../../utils/audioHaptics';

interface AffectiveWeatherSelectorProps {
  selectedWeather?: AffectiveWeather;
  selectedEmotion?: string;
  selectedTags?: AffectiveTag[];
  onSelectWeather: (weather: AffectiveWeather) => void;
  onSelectEmotion?: (emotion: string) => void;
  onToggleTag: (tag: AffectiveTag) => void;
  isPortuguese?: boolean;
}

interface EmotionWord {
  id: string;
  labelEn: string;
  labelPt: string;
}

// 4 Affective Quadrants inspired by How We Feel (Yale Center for Emotional Intelligence / Mood Meter)
export const HOW_WE_FEEL_QUADRANTS: {
  id: AffectiveWeather;
  labelEn: string;
  labelPt: string;
  descriptorEn: string;
  descriptorPt: string;
  colorClass: string;
  selectedBorder: string;
  dotColor: string;
  emotions: EmotionWord[];
}[] = [
  {
    id: 'radiant',
    labelEn: 'High Energy • Pleasant',
    labelPt: 'Alta Energia • Agradável',
    descriptorEn: 'Radiant & Energized',
    descriptorPt: 'Radiante & Energizado',
    colorClass: 'border-amber-400/25 bg-amber-400/5 hover:border-amber-400/40',
    selectedBorder: 'border-amber-400/80 bg-amber-400/10 shadow-sm',
    dotColor: 'bg-amber-400',
    emotions: [
      { id: 'joyful', labelEn: 'Joyful', labelPt: 'Alegre' },
      { id: 'energized', labelEn: 'Energized', labelPt: 'Energizado' },
      { id: 'inspired', labelEn: 'Inspired', labelPt: 'Inspirado' },
      { id: 'excited', labelEn: 'Excited', labelPt: 'Entusiasmado' },
      { id: 'motivated', labelEn: 'Motivated', labelPt: 'Motivado' },
      { id: 'confident', labelEn: 'Confident', labelPt: 'Confiante' },
      { id: 'grateful', labelEn: 'Grateful', labelPt: 'Grato' },
      { id: 'proud', labelEn: 'Proud', labelPt: 'Orgulhoso' },
    ],
  },
  {
    id: 'clear',
    labelEn: 'Low Energy • Pleasant',
    labelPt: 'Baixa Energia • Agradável',
    descriptorEn: 'Serene & At Ease',
    descriptorPt: 'Sereno & Em Paz',
    colorClass: 'border-emerald-400/25 bg-emerald-400/5 hover:border-emerald-400/40',
    selectedBorder: 'border-emerald-400/80 bg-emerald-400/10 shadow-sm',
    dotColor: 'bg-emerald-400',
    emotions: [
      { id: 'calm', labelEn: 'Calm', labelPt: 'Calmo' },
      { id: 'peaceful', labelEn: 'Peaceful', labelPt: 'Em Paz' },
      { id: 'content', labelEn: 'Content', labelPt: 'Contente' },
      { id: 'serene', labelEn: 'Serene', labelPt: 'Sereno' },
      { id: 'rested', labelEn: 'Rested', labelPt: 'Descansado' },
      { id: 'balanced', labelEn: 'Balanced', labelPt: 'Equilibrado' },
      { id: 'thoughtful', labelEn: 'Thoughtful', labelPt: 'Pensativo' },
      { id: 'satisfied', labelEn: 'Satisfied', labelPt: 'Satisfeito' },
    ],
  },
  {
    id: 'turbulent',
    labelEn: 'High Energy • Unpleasant',
    labelPt: 'Alta Energia • Desafiador',
    descriptorEn: 'Stressed & Restless',
    descriptorPt: 'Estressado & Agitado',
    colorClass: 'border-rose-400/25 bg-rose-400/5 hover:border-rose-400/40',
    selectedBorder: 'border-rose-400/80 bg-rose-400/10 shadow-sm',
    dotColor: 'bg-rose-400',
    emotions: [
      { id: 'anxious', labelEn: 'Anxious', labelPt: 'Ansioso' },
      { id: 'frustrated', labelEn: 'Frustrated', labelPt: 'Frustrado' },
      { id: 'stressed', labelEn: 'Stressed', labelPt: 'Estressado' },
      { id: 'overwhelmed', labelEn: 'Overwhelmed', labelPt: 'Sobrecarregado' },
      { id: 'annoyed', labelEn: 'Annoyed', labelPt: 'Irritado' },
      { id: 'jittery', labelEn: 'Jittery', labelPt: 'Inquieto' },
      { id: 'frightened', labelEn: 'Frightened', labelPt: 'Apreensivo' },
      { id: 'enraged', labelEn: 'Enraged', labelPt: 'Enfurecido' },
    ],
  },
  {
    id: 'overcast',
    labelEn: 'Low Energy • Unpleasant',
    labelPt: 'Baixa Energia • Desafiador',
    descriptorEn: 'Down & Fatigued',
    descriptorPt: 'Desanimado & Cansado',
    colorClass: 'border-sky-400/25 bg-sky-400/5 hover:border-sky-400/40',
    selectedBorder: 'border-sky-400/80 bg-sky-400/10 shadow-sm',
    dotColor: 'bg-sky-400',
    emotions: [
      { id: 'fatigued', labelEn: 'Fatigued', labelPt: 'Cansado' },
      { id: 'burned_out', labelEn: 'Burned Out', labelPt: 'Esgotado' },
      { id: 'sad', labelEn: 'Sad', labelPt: 'Triste' },
      { id: 'disappointed', labelEn: 'Disappointed', labelPt: 'Decepcionado' },
      { id: 'lonely', labelEn: 'Lonely', labelPt: 'Solitário' },
      { id: 'down', labelEn: 'Down', labelPt: 'Para Baixo' },
      { id: 'hopeless', labelEn: 'Hopeless', labelPt: 'Desanimado' },
      { id: 'numb', labelEn: 'Numb', labelPt: 'Entorpecido' },
    ],
  },
];

const LIFESTYLE_TAGS: { id: AffectiveTag; labelEn: string; labelPt: string }[] = [
  { id: 'sleep', labelEn: 'Sleep', labelPt: 'Sono' },
  { id: 'body', labelEn: 'Body & Training', labelPt: 'Corpo & Treino' },
  { id: 'deep_work', labelEn: 'Deep Work', labelPt: 'Foco Profundo' },
  { id: 'solitude', labelEn: 'Solitude', labelPt: 'Quietude' },
  { id: 'social', labelEn: 'Social & Philia', labelPt: 'Amizade & Conexão' },
  { id: 'clarity', labelEn: 'Clarity', labelPt: 'Clareza' },
  { id: 'friction', labelEn: 'Friction', labelPt: 'Atrito' },
];

export function AffectiveWeatherSelector({
  selectedWeather = 'clear',
  selectedEmotion,
  selectedTags = [],
  onSelectWeather,
  onSelectEmotion,
  onToggleTag,
  isPortuguese = false,
}: AffectiveWeatherSelectorProps) {
  const handleSelectQuadrant = (quadId: AffectiveWeather) => {
    triggerHapticFeedback([40]);
    onSelectWeather(quadId);

    // If changing quadrant, auto-select first emotion if none is selected
    if (onSelectEmotion) {
      const quad = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === quadId);
      if (quad && quad.emotions.length > 0) {
        // If current emotion does not belong to this quadrant, pick first
        const belongs = quad.emotions.some((e) => e.id === selectedEmotion);
        if (!belongs) {
          onSelectEmotion(quad.emotions[0].id);
        }
      }
    }
  };

  const handleSelectEmotionWord = (emotionId: string) => {
    triggerHapticFeedback([25]);
    if (onSelectEmotion) {
      onSelectEmotion(emotionId);
    }
  };

  const handleToggleTag = (tag: AffectiveTag) => {
    triggerHapticFeedback([25]);
    onToggleTag(tag);
  };

  const activeQuadrant = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === selectedWeather) || HOW_WE_FEEL_QUADRANTS[1];

  return (
    <div className="space-y-3.5">
      {/* 4 Quadrants (Energy x Valence) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider">
            {isPortuguese ? 'Quadrante Afetivo (How We Feel)' : 'Emotional Weather Quadrant'}
          </span>
          <span className="text-[10px] text-[var(--color-accent)] font-semibold">
            {isPortuguese ? activeQuadrant.descriptorPt : activeQuadrant.descriptorEn}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {HOW_WE_FEEL_QUADRANTS.map((quad) => {
            const isSelected = selectedWeather === quad.id;
            return (
              <button
                key={quad.id}
                type="button"
                onClick={() => handleSelectQuadrant(quad.id)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  isSelected ? quad.selectedBorder : quad.colorClass
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${quad.dotColor}`} />
                  <span className="text-xs font-bold text-[var(--color-text)]">
                    {isPortuguese ? quad.labelPt : quad.labelEn}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--color-text-subtle)] block">
                  {isPortuguese ? quad.descriptorPt : quad.descriptorEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Emotion Words for Active Quadrant */}
      <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-2">
        <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block">
          {isPortuguese ? 'Emoção Específica' : 'Granular Emotion'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {activeQuadrant.emotions.map((em) => {
            const isSelected = selectedEmotion === em.id;
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => handleSelectEmotionWord(em.id)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 border ${
                  isSelected
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)] font-bold shadow-xs'
                    : 'bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {isPortuguese ? em.labelPt : em.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contextual Lifestyle Tags */}
      <div>
        <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block mb-1.5 px-0.5">
          {isPortuguese ? 'Fatores Contextuais' : 'Contributing Context'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LIFESTYLE_TAGS.map((t) => {
            const active = selectedTags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToggleTag(t.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] transition-all active:scale-95 border ${
                  active
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)] font-semibold'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {isPortuguese ? t.labelPt : t.labelEn}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
