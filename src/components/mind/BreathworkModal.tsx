import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Wind } from 'lucide-react';
import { BreathworkPatternType, BreathworkPhase } from '../../types';
import { playBreathworkTone, triggerHapticFeedback } from '../../utils/audioHaptics';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface BreathworkModalProps {
  onClose: () => void;
  isPortuguese?: boolean;
}

type BreathingPhaseKind = 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

interface BreathPhaseStep {
  phase: BreathingPhaseKind;
  durationSeconds: number;
  labelEn: string;
  labelPt: string;
}

interface PatternConfig {
  id: BreathworkPatternType;
  titleEn: string;
  titlePt: string;
  descEn: string;
  descPt: string;
  phases: BreathPhaseStep[];
}

const PATTERNS: PatternConfig[] = [
  {
    id: 'box',
    titleEn: 'Box Breathing (4-4-4-4)',
    titlePt: 'Respiração Quadrada (4-4-4-4)',
    descEn: 'Focus & autonomic grounding',
    descPt: 'Foco e equilíbrio autônomo',
    phases: [
      { phase: 'inhale', durationSeconds: 4, labelEn: 'Inhale through nose', labelPt: 'Inspire pelo nariz' },
      { phase: 'hold_in', durationSeconds: 4, labelEn: 'Hold lungs full', labelPt: 'Retenha com ar' },
      { phase: 'exhale', durationSeconds: 4, labelEn: 'Exhale slowly', labelPt: 'Expire devagar' },
      { phase: 'hold_out', durationSeconds: 4, labelEn: 'Hold lungs empty', labelPt: 'Retenha sem ar' },
    ],
  },
  {
    id: 'physiological_sigh',
    titleEn: 'Physiological Sigh',
    titlePt: 'Suspiro Fisiológico',
    descEn: 'Rapid acute nervous system reset',
    descPt: 'Redução rápida de estresse agudo',
    phases: [
      { phase: 'inhale', durationSeconds: 2, labelEn: 'Deep inhale', labelPt: 'Inspiração profunda' },
      { phase: 'hold_in', durationSeconds: 1, labelEn: 'Second top-up sip', labelPt: 'Pequena inspiração extra' },
      { phase: 'exhale', durationSeconds: 6, labelEn: 'Long, slow sigh', labelPt: 'Suspiro longo e suave' },
    ],
  },
  {
    id: 'relax_478',
    titleEn: '4-7-8 Relaxing Breath',
    titlePt: 'Respiração 4-7-8 Relaxante',
    descEn: 'Deep parasympathetic calm',
    descPt: 'Calma parassimpática profunda',
    phases: [
      { phase: 'inhale', durationSeconds: 4, labelEn: 'Quiet inhale', labelPt: 'Inspire suavemente' },
      { phase: 'hold_in', durationSeconds: 7, labelEn: 'Hold calmly', labelPt: 'Retenha com calma' },
      { phase: 'exhale', durationSeconds: 8, labelEn: 'Whoosh exhale', labelPt: 'Expire prolongadamente' },
    ],
  },
];

export function BreathworkModal({ onClose, isPortuguese = false }: BreathworkModalProps) {
  useBodyScrollLock(true);
  const [selectedPattern, setSelectedPattern] = useState<PatternConfig>(PATTERNS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(PATTERNS[0].phases[0].durationSeconds);
  const [completedCycles, setCompletedCycles] = useState(0);

  const currentPhase = selectedPattern.phases[phaseIndex];

  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Next phase
            const nextIdx = (phaseIndex + 1) % selectedPattern.phases.length;
            const nextPhase = selectedPattern.phases[nextIdx];
            setPhaseIndex(nextIdx);

            if (nextIdx === 0) {
              setCompletedCycles((c) => c + 1);
            }

            // Audio & Haptic cue
            const toneType = nextPhase.phase.startsWith('inhale')
              ? 'inhale'
              : nextPhase.phase.startsWith('exhale')
              ? 'exhale'
              : 'hold';
            playBreathworkTone(toneType);
            triggerHapticFeedback([40]);

            return nextPhase.durationSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, phaseIndex, selectedPattern]);

  const handleStart = () => {
    setIsRunning(true);
    setPhaseIndex(0);
    setSecondsRemaining(selectedPattern.phases[0].durationSeconds);
    playBreathworkTone('inhale');
    triggerHapticFeedback([60]);
  };

  const handleStop = () => {
    setIsRunning(false);
    setPhaseIndex(0);
    setSecondsRemaining(selectedPattern.phases[0].durationSeconds);
  };

  const handleSelectPattern = (pat: PatternConfig) => {
    setSelectedPattern(pat);
    setIsRunning(false);
    setPhaseIndex(0);
    setSecondsRemaining(pat.phases[0].durationSeconds);
    setCompletedCycles(0);
  };

  const isExpanding = currentPhase.phase.startsWith('inhale');
  const isContracting = currentPhase.phase.startsWith('exhale');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              {isPortuguese ? 'Respiração Somática' : 'Somatic Breathwork'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pattern Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl">
          {PATTERNS.map((p) => {
            const isSel = selectedPattern.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPattern(p)}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                  isSel
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {p.id === 'box'
                  ? 'Box 4-4'
                  : p.id === 'physiological_sigh'
                  ? 'Phys. Sigh'
                  : '4-7-8 Calm'}
              </button>
            );
          })}
        </div>

        {/* Breathing Animation Canvas */}
        <div className="py-6 flex flex-col items-center justify-center relative min-h-[200px]">
          {/* Animated Glow Circle */}
          <div
            className={`w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-1000 ${
              isExpanding
                ? 'scale-125 border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-lg'
                : isContracting
                ? 'scale-90 border-[var(--color-border)] bg-transparent'
                : 'scale-110 border-[var(--color-accent)]/60 bg-[var(--color-accent)]/5'
            }`}
          >
            <div className="text-center space-y-0.5">
              <span className="text-3xl font-black text-[var(--color-text)] tabular-nums">
                {secondsRemaining}
              </span>
              <span className="text-[10px] uppercase font-bold text-[var(--color-accent)] block tracking-wider">
                {isPortuguese ? currentPhase.labelPt : currentPhase.labelEn}
              </span>
            </div>
          </div>

          {completedCycles > 0 && (
            <span className="text-[10px] text-[var(--color-text-subtle)] font-medium mt-4 block">
              {completedCycles} {isPortuguese ? 'ciclos concluídos' : 'cycles completed'}
            </span>
          )}
        </div>

        {/* Action Button */}
        <div>
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="min-h-[46px] w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPortuguese ? 'Iniciar Sessão' : 'Begin Breathing Session'}</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="min-h-[46px] w-full py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{isPortuguese ? 'Pausar' : 'Pause'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
