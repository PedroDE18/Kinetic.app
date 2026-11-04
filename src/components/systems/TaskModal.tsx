import React, { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LifeTask, LifeArea } from '../../types';
import { getLocalDateString } from '../../utils/engine';
import { GoalModal } from './GoalModal';
import { ProjectModal } from './ProjectModal';

interface TaskModalProps {
  taskToEdit?: LifeTask | null;
  initialArea?: LifeArea;
  onClose: () => void;
}

const LIFE_AREAS: { id: LifeArea; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'mind_growth', label: 'Mind & Growth' },
  { id: 'craft_creativity', label: 'Craft' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'career', label: 'Career' },
  { id: 'finances', label: 'Finances' },
];

export function TaskModal({ taskToEdit, initialArea, onClose }: TaskModalProps) {
  const { state, addTask, updateTask } = useFitness();
  const { projects, goals } = state;

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [area, setArea] = useState<LifeArea>(taskToEdit?.area || initialArea || 'career');
  const [projectId, setProjectId] = useState(taskToEdit?.projectId || '');
  const [goalId, setGoalId] = useState(taskToEdit?.goalId || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(taskToEdit?.priority || 'medium');
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || '');
  const [error, setError] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task description.');
      return;
    }

    if (taskToEdit) {
      updateTask({
        ...taskToEdit,
        title: title.trim(),
        area,
        projectId: projectId || undefined,
        goalId: goalId || undefined,
        priority,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        id: `task-${Date.now()}`,
        title: title.trim(),
        area,
        projectId: projectId || undefined,
        goalId: goalId || undefined,
        priority,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        isCompleted: false,
        createdAt: getLocalDateString(),
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
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                {taskToEdit ? 'Edit Task' : 'New Actionable Task'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
                Decompose intentions into discrete, actionable steps
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
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Task Description
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Draft systems architecture chapter; Prepare batch meals"
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

          {/* Priority & Due Date */}
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
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          {/* Connected Project / Goal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider">
                  Connected Project
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(true)}
                  className="text-[10px] text-[var(--color-accent)] font-bold hover:underline"
                >
                  + New
                </button>
              </div>
              <select
                value={projectId}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectId(val);
                  const selectedProj = projects.find((p) => p.id === val);
                  if (selectedProj?.area) {
                    setArea(selectedProj.area);
                  }
                }}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value="">No Project (Standalone)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.area.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider">
                  Connected Goal
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(true)}
                  className="text-[10px] text-[var(--color-accent)] font-bold hover:underline"
                >
                  + New
                </button>
              </div>
              <select
                value={goalId}
                onChange={(e) => {
                  const val = e.target.value;
                  setGoalId(val);
                  const selectedGoal = goals.find((g) => g.id === val);
                  if (selectedGoal?.area) {
                    setArea(selectedGoal.area);
                  }
                }}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value="">No Goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.area.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Reflective Context / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires deep uninterrupted focus"
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
              {taskToEdit ? 'Save Task' : 'Commit Task'}
            </button>
          </div>
        </form>
      </div>

      {showNewProjectModal && (
        <ProjectModal
          initialArea={area}
          onClose={() => setShowNewProjectModal(false)}
        />
      )}

      {showNewGoalModal && (
        <GoalModal
          initialArea={area}
          onClose={() => setShowNewGoalModal(false)}
        />
      )}
    </div>
  );
}
