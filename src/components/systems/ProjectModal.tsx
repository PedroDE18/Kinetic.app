import React, { useState } from 'react';
import { X, FolderGit2, Check } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LifeProject, LifeArea } from '../../types';
import { getLocalDateString } from '../../utils/engine';
import { LIFE_AREAS } from './HabitModal';

interface ProjectModalProps {
  projectToEdit?: LifeProject | null;
  initialArea?: LifeArea;
  initialGoalId?: string;
  onClose: () => void;
}

export function ProjectModal({ projectToEdit, initialArea, initialGoalId, onClose }: ProjectModalProps) {
  const { state, addProject, updateProject } = useFitness();
  const { goals } = state;

  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [area, setArea] = useState<LifeArea>(projectToEdit?.area || initialArea || 'career');
  const [goalId, setGoalId] = useState(projectToEdit?.goalId || initialGoalId || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(projectToEdit?.priority || 'medium');
  const [dueDate, setDueDate] = useState(projectToEdit?.dueDate || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a project title.');
      return;
    }

    if (projectToEdit) {
      updateProject({
        ...projectToEdit,
        title: title.trim(),
        description: description.trim() || undefined,
        area,
        goalId: goalId || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
    } else {
      addProject({
        id: `proj-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        area,
        goalId: goalId || undefined,
        status: 'in_progress',
        priority,
        dueDate: dueDate || undefined,
        progressPercentage: 0,
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
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {projectToEdit ? 'Edit Project' : 'New Strategic Project'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Concrete initiative serving your core intentions
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
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hypertrophy Mesocycle Block 1; Launch Personal Site"
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Domain of Responsibility
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
              Connected Intention / Goal (Optional)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3.5 py-2 text-xs text-[var(--color-text)] focus:outline-none"
            >
              <option value="">No Direct Goal (Independent Project)</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.area.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl border text-center uppercase text-[10px] font-bold transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-600 text-white border-transparent'
                          : 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-transparent'
                        : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Scope & Outcome Details
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key deliverables and definition of done..."
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl p-3 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            />
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
              <span>{projectToEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
