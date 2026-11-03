import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { FrictionIntervention, FrictionCategory, FrictionActionType } from '../../types';
import { getLocalDateString } from '../../utils/engine';

interface FrictionEngineModalProps {
  interventionToEdit?: FrictionIntervention | null;
  onClose: () => void;
}

const CATEGORIES: { id: FrictionCategory; label: string; desc: string }[] = [
  { id: 'physical', label: 'Physical', desc: 'Spaces, physical obstacles, object placement' },
  { id: 'digital', label: 'Digital', desc: 'Screen timers, app blockers, greyscale, notifications' },
  { id: 'temporal', label: 'Temporal', desc: 'Delay rules, 10-minute pauses, scheduling constraints' },
  { id: 'social', label: 'Social', desc: 'Commitment devices, accountability, shared boundaries' },
];

export function FrictionEngineModal({ interventionToEdit, onClose }: FrictionEngineModalProps) {
  const { addFrictionIntervention, updateFrictionIntervention } = useFitness();

  const [title, setTitle] = useState(interventionToEdit?.title || '');
  const [category, setCategory] = useState<FrictionCategory>(interventionToEdit?.category || 'physical');
  const [actionType, setActionType] = useState<FrictionActionType>(
    interventionToEdit?.actionType || 'add_friction'
  );
  const [targetBehavior, setTargetBehavior] = useState(interventionToEdit?.targetBehavior || '');
  const [mechanism, setMechanism] = useState(interventionToEdit?.mechanism || '');
  const [stepsText, setStepsText] = useState(
    interventionToEdit?.implementationSteps?.join('\n') || ''
  );
  const [status, setStatus] = useState<FrictionIntervention['status']>(
    interventionToEdit?.status || 'experimenting'
  );
  const [perceivedEffectiveness, setPerceivedEffectiveness] = useState<number>(
    interventionToEdit?.perceivedEffectiveness || 4
  );
  const [outcomeNotes, setOutcomeNotes] = useState(interventionToEdit?.outcomeNotes || '');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetBehavior.trim() || !mechanism.trim()) {
      setError('Please provide a title, the target behavior, and the engineering mechanism.');
      return;
    }

    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const todayStr = getLocalDateString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const reviewStr = getLocalDateString(nextWeek);

    if (interventionToEdit) {
      updateFrictionIntervention({
        ...interventionToEdit,
        title: title.trim(),
        category,
        actionType,
        targetBehavior: targetBehavior.trim(),
        mechanism: mechanism.trim(),
        implementationSteps: steps.length > 0 ? steps : [mechanism.trim()],
        status,
        perceivedEffectiveness,
        outcomeNotes: outcomeNotes.trim() || undefined,
      });
    } else {
      addFrictionIntervention({
        id: `fric-${Date.now()}`,
        title: title.trim(),
        category,
        actionType,
        targetBehavior: targetBehavior.trim(),
        mechanism: mechanism.trim(),
        implementationSteps: steps.length > 0 ? steps : [mechanism.trim()],
        status,
        perceivedEffectiveness,
        startDate: todayStr,
        reviewDate: reviewStr,
        outcomeNotes: outcomeNotes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                {interventionToEdit ? 'Refine Intervention' : 'Engineer Intervention'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Environment design: make good choices effortless and poor choices difficult
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-full hover:bg-[var(--color-surface-raised)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Action Vector */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Friction Vector
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('add_friction')}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-0.5 ${
                  actionType === 'add_friction'
                    ? 'bg-amber-600/20 text-amber-500 font-bold border-amber-500/40 shadow-xs'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                }`}
              >
                <span className="text-xs font-bold">Add Friction (+)</span>
                <span className="text-[10px] opacity-80">Weaken an unwanted impulse or vice</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('remove_friction')}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-0.5 ${
                  actionType === 'remove_friction'
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold border-transparent shadow-xs'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                }`}
              >
                <span className="text-xs font-bold">Remove Friction (-)</span>
                <span className="text-[10px] opacity-80">Make a desired virtue frictionless</span>
              </button>
            </div>
          </div>

          {/* Intervention Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Intervention Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Living Room Charging Station, Workout Gear Staging"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Domain / Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all ${
                    category === c.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold border-transparent'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }`}
                >
                  <div className="text-[11px] font-bold">{c.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Behavior */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Target Behavior
            </label>
            <input
              type="text"
              required
              value={targetBehavior}
              onChange={(e) => setTargetBehavior(e.target.value)}
              placeholder="e.g., Checking smartphone late at night; Skipping morning training session"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Structural Mechanism */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Structural Mechanism
            </label>
            <textarea
              rows={2}
              required
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              placeholder="Describe the physical/digital constraint that alters the default path of least resistance."
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            />
          </div>

          {/* Implementation Steps */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Concrete Implementation Steps (one per line)
            </label>
            <textarea
              rows={3}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder="1. Move phone charger to hallway&#10;2. Place mechanical alarm clock on bedside table&#10;3. Leave Kindle book on the pillow"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]"
            />
          </div>

          {/* Status & Effectiveness */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Experiment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value="experimenting">Experimenting (Testing)</option>
                <option value="active">Active (Reliable)</option>
                <option value="paused">Paused</option>
                <option value="mastered">Mastered (Second Nature)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Effectiveness Rating
              </label>
              <div className="flex items-center gap-1.5 py-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setPerceivedEffectiveness(star)}
                    className={`w-7 h-7 rounded-xl text-xs font-bold border transition-all ${
                      perceivedEffectiveness >= star
                        ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-transparent'
                        : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold shadow-sm transition-all"
            >
              {interventionToEdit ? 'Save Intervention' : 'Deploy Intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
