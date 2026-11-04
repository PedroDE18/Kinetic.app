import React, { useState } from 'react';
import { X, Target, Check } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LifeGoal, LifeArea } from '../../types';
import { getLocalDateString } from '../../utils/engine';
import { LIFE_AREAS } from './HabitModal';

interface GoalModalProps {
  goalToEdit?: LifeGoal | null;
  initialArea?: LifeArea;
  onClose: () => void;
}

export function GoalModal({ goalToEdit, initialArea, onClose }: GoalModalProps) {
  const { addGoal, updateGoal } = useFitness();

  const [title, setTitle] = useState(goalToEdit?.title || '');
  const [description, setDescription] = useState(goalToEdit?.description || '');
  const [area, setArea] = useState<LifeArea>(goalToEdit?.area || initialArea || 'health');
  const [targetDate, setTargetDate] = useState(goalToEdit?.targetDate || '');
  const [metricTarget, setMetricTarget] = useState<string>(
    goalToEdit?.metricTarget ? String(goalToEdit.metricTarget) : ''
  );
  const [metricUnit, setMetricUnit] = useState(goalToEdit?.metricUnit || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal title.');
      return;
    }

    const numTarget = metricTarget.trim() ? parseFloat(metricTarget.trim()) : undefined;

    if (goalToEdit) {
      updateGoal({
        ...goalToEdit,
        title: title.trim(),
        description: description.trim() || undefined,
        area,
        targetDate: targetDate || undefined,
        metricTarget: Number.isFinite(numTarget) ? numTarget : undefined,
        metricUnit: metricUnit.trim() || undefined,
      });
    } else {
      addGoal({
        id: `goal-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        area,
        targetDate: targetDate || undefined,
        status: 'active',
        metricTarget: Number.isFinite(numTarget) ? numTarget : undefined,
        metricUnit: metricUnit.trim() || undefined,
        createdAt: getLocalDateString(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {goalToEdit ? 'Edit Goal' : 'New Core Intention (Telos)'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Overarching direction for personal flourishing
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Achieve 12% Body Fat & 2x Bodyweight Deadlift"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Domain of Flourishing
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {LIFE_AREAS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setArea(a.id)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all ${
                    area === a.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold border-transparent'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Philosophical Rationale / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this intention matters for your life architecture..."
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl p-3 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Target Metric (Optional)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={metricTarget}
                  onChange={(e) => setMetricTarget(e.target.value)}
                  placeholder="Target"
                  className="w-1/2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
                />
                <input
                  type="text"
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                  placeholder="Unit (kg, h)"
                  className="w-1/2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] font-semibold rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{goalToEdit ? 'Save Changes' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
