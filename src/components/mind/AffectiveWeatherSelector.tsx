import React from 'react';
import { AffectiveWeather, AffectiveTag } from '../../types';
import { triggerHapticFeedback } from '../../utils/audioHaptics';

interface AffectiveWeatherSelectorProps {
  selectedWeather?: AffectiveWeather;
  selectedTags?: AffectiveTag[];
  onSelectWeather: (weather: AffectiveWeather) => void;
  onToggleTag: (tag: AffectiveTag) => void;
  isPortuguese?: boolean;
}

// 4 Affective Quadrants inspired by How We Feel (Yale Center for Emotional Intelligence)
const QUADRANTS: {
  id: AffectiveWeather;
  labelEn: string;
  labelPt: string;
  descriptorEn: string;
  descriptorPt: string;
  colorClass: string;
  dotColor: string;
}[] = [
  {
    id: 'radiant',
    labelEn: 'Radiant',
    labelPt: 'Radiante',
    descriptorEn: 'High Energy • Pleasant',
    descriptorPt: 'Alta Energia • Agradável',
    colorClass: 'border-amber-400/30 hover:border-amber-400/60 bg-amber-400/5',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'clear',
    labelEn: 'Serene',
    labelPt: 'Sereno',
    descriptorEn: 'Calm • Pleasant',
    descriptorPt: 'Calma • Agradável',
    colorClass: 'border-emerald-400/30 hover:border-emerald-400/60 bg-emerald-400/5',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'turbulent',
    labelEn: 'Restless',
    labelPt: 'Agitado',
    descriptorEn: 'High Energy • Unpleasant',
    descriptorPt: 'Alta Energia • Desafiador',
    colorClass: 'border-rose-400/30 hover:border-rose-400/60 bg-rose-400/5',
    dotColor: 'bg-rose-400',
  },
  {
    id: 'overcast',
    labelEn: 'Low',
    labelPt: 'Recolhido',
    descriptorEn: 'Low Energy • Unpleasant',
    descriptorPt: 'Baixa Energia • Desafiador',
    colorClass: 'border-sky-400/30 hover:border-sky-400/60 bg-sky-400/5',
    dotColor: 'bg-sky-400',
  },
];

const LIFESTYLE_TAGS: { id: AffectiveTag; labelEn: string; labelPt: string }[] = [
  { id: 'sleep', labelEn: 'Sleep', labelPt: 'Sono' },
  { id: 'body', labelEn: 'Body & Movement', labelPt: 'Corpo & Treino' },
  { id: 'deep_work', labelEn: 'Deep Work', labelPt: 'Foco Profundo' },
  { id: 'solitude', labelEn: 'Solitude', labelPt: 'Quietude' },
  { id: 'social', labelEn: 'Social & Philia', labelPt: 'Amizade & Conexão' },
  { id: 'clarity', labelEn: 'Clarity', labelPt: 'Clareza' },
  { id: 'friction', labelEn: 'Friction', labelPt: 'Atrito' },
];

export function AffectiveWeatherSelector({
  selectedWeather,
  selectedTags = [],
  onSelectWeather,
  onToggleTag,
  isPortuguese = false,
}: AffectiveWeatherSelectorProps) {
  const handleSelect = (weather: AffectiveWeather) => {
    triggerHapticFeedback([40]);
    onSelectWeather(weather);
  };

  const handleToggle = (tag: AffectiveTag) => {
    triggerHapticFeedback([25]);
    onToggleTag(tag);
  };

  return (
    <div className="space-y-3">
      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map((quad) => {
          const isSelected = selectedWeather === quad.id;
          return (
            <button
              key={quad.id}
              type="button"
              onClick={() => handleSelect(quad.id)}
              className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                quad.colorClass
              } ${
                isSelected
                  ? 'ring-2 ring-[var(--color-accent)] font-semibold shadow-xs'
                  : 'opacity-80 hover:opacity-100'
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

      {/* Context Tags */}
      <div>
        <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block mb-1.5">
          {isPortuguese ? 'Fatores Contextuais' : 'Contributing Context'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LIFESTYLE_TAGS.map((t) => {
            const active = selectedTags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToggle(t.id)}
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
