import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Compass, Shield } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { getLocalDateString } from '../../utils/engine';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface DichotomyModalProps {
  onClose: () => void;
  isPortuguese?: boolean;
}

export function DichotomyModal({ onClose, isPortuguese = false }: DichotomyModalProps) {
  useBodyScrollLock(true);
  const { addReflectionEntry } = useFitness();

  const [situation, setSituation] = useState('');
  const [withinPower, setWithinPower] = useState<string[]>([]);
  const [outsidePower, setOutsidePower] = useState<string[]>([]);
  const [withinInput, setWithinInput] = useState('');
  const [outsideInput, setOutsideInput] = useState('');
  const [deliberateAction, setDeliberateAction] = useState('');

  const handleAddWithin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withinInput.trim()) return;
    setWithinPower((prev) => [...prev, withinInput.trim()]);
    setWithinInput('');
  };

  const handleAddOutside = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outsideInput.trim()) return;
    setOutsidePower((prev) => [...prev, outsideInput.trim()]);
    setOutsideInput('');
  };

  const handleRemoveWithin = (idx: number) => {
    setWithinPower((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveOutside = (idx: number) => {
    setOutsidePower((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!situation.trim()) return;

    const summaryContent = `
[Situation]: ${situation.trim()}

[Within My Power]:
${withinPower.map((item) => `- ${item}`).join('\n') || '- None listed'}

[Outside My Power]:
${outsidePower.map((item) => `- ${item}`).join('\n') || '- None listed'}

[Deliberate Action]: ${deliberateAction.trim() || 'Accept the uncontrollable and focus energy on deliberate effort.'}
    `.trim();

    addReflectionEntry({
      id: `dichotomy-${Date.now()}`,
      date: getLocalDateString(),
      type: 'freeform',
      promptAnswers: {
        situation: situation.trim(),
        action: deliberateAction.trim(),
      },
      freeformContent: summaryContent,
      worksheetType: 'dichotomy_of_control',
      dichotomyData: {
        withinControl: withinPower,
        outsideControl: outsidePower,
        actionablePivot: deliberateAction.trim(),
      },
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--color-accent)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {isPortuguese ? 'Dicotomia do Controle' : 'Dichotomy of Control'}
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] font-serif italic">
                {isPortuguese
                  ? '"Algumas coisas estão sob nosso poder, outras não." — Epicteto'
                  : '"Some things are within our power, while others are not." — Epictetus'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Situation Input */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text)] block mb-1">
            {isPortuguese ? 'Qual situação ou desafio está em sua mente?' : 'What situation or challenge is weighing on your mind?'}
          </label>
          <input
            type="text"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={
              isPortuguese
                ? 'Ex: Ansiedade sobre a apresentação de amanhã'
                : 'e.g., Anxiety regarding tomorrow’s client presentation'
            }
            className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* 2-Column Canvas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Column 1: Within Power */}
          <div className="bg-[var(--color-surface-sunken)] p-3.5 rounded-2xl border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span>{isPortuguese ? 'Sob Meu Poder' : 'Within My Control'}</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {isPortuguese ? 'Minha preparação, esforço, intenção e atitude' : 'My preparation, response, values, and effort'}
            </p>

            <form onSubmit={handleAddWithin} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={withinInput}
                onChange={(e) => setWithinInput(e.target.value)}
                placeholder={isPortuguese ? 'Adicionar item...' : 'Add item...'}
                className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--color-text)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 bg-[var(--color-accent)] text-[var(--color-on-accent)] rounded-xl text-xs font-bold"
              >
                <Plus className="w-3 h-3" />
              </button>
            </form>

            <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
              {withinPower.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface)] text-[11px] text-[var(--color-text)] border border-[var(--color-border)]"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWithin(idx)}
                    className="text-[var(--color-text-subtle)] hover:text-red-500 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Outside Power */}
          <div className="bg-[var(--color-surface-sunken)] p-3.5 rounded-2xl border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <X className="w-3.5 h-3.5" />
              <span>{isPortuguese ? 'Fora de Meu Poder' : 'Outside My Control'}</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {isPortuguese ? 'Resultado final, opiniões alheias, o passado' : 'Outcomes, others’ thoughts, past, future'}
            </p>

            <form onSubmit={handleAddOutside} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={outsideInput}
                onChange={(e) => setOutsideInput(e.target.value)}
                placeholder={isPortuguese ? 'Adicionar item...' : 'Add item...'}
                className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--color-text)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl text-xs font-bold"
              >
                <Plus className="w-3 h-3" />
              </button>
            </form>

            <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
              {outsidePower.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface)] text-[11px] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                >
                  <span className="truncate line-through opacity-70">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOutside(idx)}
                    className="text-[var(--color-text-subtle)] hover:text-red-500 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Step */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">
            {isPortuguese ? 'Minha próxima ação deliberada:' : 'My deliberate next action:'}
          </label>
          <input
            type="text"
            value={deliberateAction}
            onChange={(e) => setDeliberateAction(e.target.value)}
            placeholder={
              isPortuguese
                ? 'Ex: Revisar meus slides com calma e dormir 8 horas'
                : 'e.g., Review my key talking points calmly and protect 8 hours of sleep'
            }
            className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-accent)]/40 rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none"
          />
        </div>

        {/* Confirm Save */}
        <button
          onClick={handleSave}
          disabled={!situation.trim()}
          className="min-h-[46px] w-full py-2.5 bg-[var(--color-accent)] disabled:opacity-50 hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{isPortuguese ? 'Gravar Discernimento' : 'Anchor Deliberate Insight'}</span>
        </button>
      </div>
    </div>
  );
}
