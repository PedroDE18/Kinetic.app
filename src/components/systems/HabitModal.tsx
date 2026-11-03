import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { EunoiaHabit, LifeArea } from '../../types';
import { getLocalDateString } from '../../utils/engine';

interface HabitModalProps {
  habitToEdit?: EunoiaHabit | null;
  onClose: () => void;
}

export const LIFE_AREAS: { id: LifeArea; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'mind_growth', label: 'Mind & Growth' },
  { id: 'craft_creativity', label: 'Craft' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'career', label: 'Career' },
  { id: 'finances', label: 'Finances' },
];

export function HabitModal({ habitToEdit, onClose }: HabitModalProps) {
  const { addHabit, updateHabit } = useFitness();

  const [title, setTitle] = useState(habitToEdit?.title || '');
  const [area, setArea] = useState<LifeArea>(habitToEdit?.area || 'health');
  const [purpose, setPurpose] = useState(habitToEdit?.purpose || '');
  const [triggerCue, setTriggerCue] = useState(habitToEdit?.triggerCue || '');
  const [minimumViableAction, setMinimumViableAction] = useState(habitToEdit?.minimumViableAction || '');
  const [frequency, setFrequency] = useState<EunoiaHabit['frequency']>(habitToEdit?.frequency || 'daily');
  const [timeOfDay, setTimeOfDay] = useState<EunoiaHabit['timeOfDay']>(habitToEdit?.timeOfDay || 'morning');
  const [isNonNegotiable, setIsNonNegotiable] = useState(habitToEdit?.isNonNegotiable || false);
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a habit name.');
      return;
    }

    if (habitToEdit) {
      updateHabit({
        ...habitToEdit,
        title: title.trim(),
        area,
        purpose: purpose.trim() || 'Cultivate intentionality and personal excellence.',
        triggerCue: triggerCue.trim() || 'Daily deliberate practice',
        minimumViableAction: minimumViableAction.trim() || '1 minute execution',
        frequency,
        timeOfDay,
        isNonNegotiable,
      });
    } else {
      addHabit({
        id: `habit-${Date.now()}`,
        title: title.trim(),
        area,
        purpose: purpose.trim() || 'Cultivate intentionality and personal excellence.',
        triggerCue: triggerCue.trim() || 'Daily deliberate practice',
        minimumViableAction: minimumViableAction.trim() || '1 minute execution',
        frequency,
        timeOfDay,
        isNonNegotiable,
        completedDates: [],
        createdAt: getLocalDateString(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">
              {habitToEdit ? 'Refine Habit' : 'Design New Habit'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
              Behavioral architecture grounded in small, consistent actions
            </p>
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
          {/* Habit Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Habit Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Stoic Contemplation, 20-min Walk, Read Literature"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Area of Life */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Area of Responsibility
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {LIFE_AREAS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setArea(a.id)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
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

          {/* Trigger Cue */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider">
                Trigger Cue (Implementation Intention)
              </label>
              <span className="text-[10px] text-[var(--color-text-subtle)]">When / Where</span>
            </div>
            <input
              type="text"
              value={triggerCue}
              onChange={(e) => setTriggerCue(e.target.value)}
              placeholder="e.g., Immediately after brewing morning coffee, sitting at desk"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Minimum Viable Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Minimum Viable Action (2-Minute Rule)</span>
              </label>
              <span className="text-[10px] text-[var(--color-text-subtle)]">Low-friction fallback</span>
            </div>
            <input
              type="text"
              value={minimumViableAction}
              onChange={(e) => setMinimumViableAction(e.target.value)}
              placeholder="e.g., Read just 1 paragraph, or do 2 deep conscious breaths"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-accent)]/30 rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-serif italic">
              On exhausted or turbulent days, completing this maintains identity without guilt.
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Philosophical Purpose (The 'Why')
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Cultivate emotional equilibrium and deliberate attention (Ataraxia)"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Cadence, Time of Day & Non-Negotiable */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Cadence
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-2.5 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="weekly_target">Weekly Target</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Time of Day
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as any)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-2.5 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-1.5 p-2 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNonNegotiable}
                  onChange={(e) => setIsNonNegotiable(e.target.checked)}
                  className="rounded text-[var(--color-accent)] focus:ring-0"
                />
                <span className="text-[10px] font-semibold text-[var(--color-text)]">
                  Non-Negotiable
                </span>
              </label>
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
              {habitToEdit ? 'Save Changes' : 'Anchor Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
