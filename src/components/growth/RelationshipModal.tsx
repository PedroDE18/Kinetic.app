import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { RelationshipTouchpoint } from '../../types';
import { getLocalDateString } from '../../utils/engine';

interface RelationshipModalProps {
  personToEdit?: RelationshipTouchpoint | null;
  onClose: () => void;
}

export function RelationshipModal({ personToEdit, onClose }: RelationshipModalProps) {
  const { addRelationshipTouchpoint, updateRelationshipTouchpoint } = useFitness();

  const [name, setName] = useState(personToEdit?.name || '');
  const [relationshipType, setRelationshipType] = useState<RelationshipTouchpoint['relationshipType']>(
    personToEdit?.relationshipType || 'friend'
  );
  const [desiredFrequencyDays, setDesiredFrequencyDays] = useState(
    personToEdit?.desiredFrequencyDays || 14
  );
  const [intention, setIntention] = useState(
    personToEdit?.intention || 'Listen with full presence and check in'
  );
  const [lastContactDate, setLastContactDate] = useState(
    personToEdit?.lastContactDate || getLocalDateString()
  );
  const [notes, setNotes] = useState(personToEdit?.notes || '');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name.');
      return;
    }

    if (personToEdit) {
      updateRelationshipTouchpoint({
        ...personToEdit,
        name: name.trim(),
        relationshipType,
        desiredFrequencyDays: Math.max(1, desiredFrequencyDays),
        intention: intention.trim() || 'Listen with full presence and check in',
        lastContactDate: lastContactDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addRelationshipTouchpoint({
        id: `rel-${Date.now()}`,
        name: name.trim(),
        relationshipType,
        desiredFrequencyDays: Math.max(1, desiredFrequencyDays),
        intention: intention.trim() || 'Listen with full presence and check in',
        lastContactDate: lastContactDate || undefined,
        notes: notes.trim() || undefined,
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
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                {personToEdit ? 'Refine Relationship' : 'Add Meaningful Person'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Epicurean philia — cultivating deep, unhurried human bonds
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
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marcus, Helena, Mentor Julian"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Relationship Bond
              </label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as any)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none capitalize"
              >
                <option value="friend">Friend</option>
                <option value="family">Family</option>
                <option value="partner">Partner</option>
                <option value="mentor">Mentor</option>
                <option value="peer">Peer / Colleague</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Desired Cadence
              </label>
              <select
                value={desiredFrequencyDays}
                onChange={(e) => setDesiredFrequencyDays(Number(e.target.value))}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value={7}>Weekly (Every 7 days)</option>
                <option value={14}>Bi-weekly (Every 14 days)</option>
                <option value={30}>Monthly (Every 30 days)</option>
                <option value={60}>Bi-monthly (Every 60 days)</option>
                <option value={90}>Quarterly (Every 90 days)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Meaningful Intention
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g., Listen with full presence and check in"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Last Meaningful Connection
            </label>
            <input
              type="date"
              value={lastContactDate}
              onChange={(e) => setLastContactDate(e.target.value)}
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Shared love of books, moving to new city"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
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
              {personToEdit ? 'Save Changes' : 'Anchor Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
