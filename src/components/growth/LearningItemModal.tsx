import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LearningItem, LifeArea } from '../../types';
import { getLocalDateString } from '../../utils/engine';
import { LIFE_AREAS } from '../systems/HabitModal';

interface LearningItemModalProps {
  itemToEdit?: LearningItem | null;
  onClose: () => void;
}

export function LearningItemModal({ itemToEdit, onClose }: LearningItemModalProps) {
  const { addLearningItem, updateLearningItem } = useFitness();

  const [title, setTitle] = useState(itemToEdit?.title || '');
  const [authorOrSource, setAuthorOrSource] = useState(itemToEdit?.authorOrSource || '');
  const [type, setType] = useState<LearningItem['type']>(itemToEdit?.type || 'book');
  const [status, setStatus] = useState<LearningItem['status']>(itemToEdit?.status || 'in_progress');
  const [area, setArea] = useState<LifeArea>(itemToEdit?.area || 'mind_growth');
  const [keyTakeaway, setKeyTakeaway] = useState(itemToEdit?.keyTakeaway || '');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title.');
      return;
    }

    const todayStr = getLocalDateString();

    if (itemToEdit) {
      updateLearningItem({
        ...itemToEdit,
        title: title.trim(),
        authorOrSource: authorOrSource.trim() || undefined,
        type,
        status,
        area,
        keyTakeaway: keyTakeaway.trim() || undefined,
        updatedAt: todayStr,
      });
    } else {
      addLearningItem({
        id: `learn-${Date.now()}`,
        title: title.trim(),
        authorOrSource: authorOrSource.trim() || undefined,
        type,
        status,
        area,
        keyTakeaway: keyTakeaway.trim() || undefined,
        updatedAt: todayStr,
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
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                {itemToEdit ? 'Refine Intellectual Work' : 'Add Intellectual Work'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Literature, treatises, and enduring ideas
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
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Nicomachean Ethics; Thinking, Fast and Slow"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Author / Source
            </label>
            <input
              type="text"
              value={authorOrSource}
              onChange={(e) => setAuthorOrSource(e.target.value)}
              placeholder="e.g., Aristotle; Daniel Kahneman"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Format
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none capitalize"
              >
                <option value="book">Book / Monograph</option>
                <option value="article">Article / Essay</option>
                <option value="course">Course / Study</option>
                <option value="skill">Practical Skill</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none capitalize"
              >
                <option value="in_progress">In Progress</option>
                <option value="backlog">Backlog / Queue</option>
                <option value="completed">Completed & Absorbed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Domain / Area
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as any)}
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none capitalize"
            >
              {LIFE_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Core Principle / Key Takeaway
            </label>
            <textarea
              rows={3}
              value={keyTakeaway}
              onChange={(e) => setKeyTakeaway(e.target.value)}
              placeholder="e.g. Virtue is a golden mean between deficiency and excess. System 1 intuition requires conscious System 2 verification."
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-serif"
            />
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
              {itemToEdit ? 'Save Changes' : 'Record Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
