import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Dumbbell, Check, Search } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { WorkoutTemplate, WorkoutTemplateExercise } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface ProgramBuilderModalProps {
  onClose: () => void;
  initialTemplate?: WorkoutTemplate;
}

export function ProgramBuilderModal({ onClose, initialTemplate }: ProgramBuilderModalProps) {
  useBodyScrollLock(true);
  const { state, saveWorkoutTemplate } = useFitness();
  const { exercises } = state;

  const [name, setName] = useState(initialTemplate?.name || '');
  const [split, setSplit] = useState(initialTemplate?.targetSplit || 'Upper / Lower');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutTemplateExercise[]>(
    initialTemplate?.exercises || [
      { exerciseId: 'ex-1', defaultSets: 3, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'ex-3', defaultSets: 3, defaultReps: 10, targetRpe: 8 },
    ]
  );

  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMuscle = filterMuscle === 'all' || ex.muscleGroup === filterMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleAddExerciseToRoutine = (exerciseId: string) => {
    if (selectedExercises.some((item) => item.exerciseId === exerciseId)) return;
    const newExItem: WorkoutTemplateExercise = {
      exerciseId,
      defaultSets: 3,
      defaultReps: 10,
      targetRpe: 8,
    };
    setSelectedExercises([...selectedExercises, newExItem]);
    setShowPicker(false);
  };

  const handleRemoveExercise = (idx: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedExercises.length) return;
    const copy = [...selectedExercises];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setSelectedExercises(copy);
  };

  const handleUpdateItem = (
    idx: number,
    field: 'defaultSets' | 'defaultReps' | 'targetRpe',
    val: number
  ) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedExercises.length === 0) return;

    const templateToSave: WorkoutTemplate = {
      id: initialTemplate?.id || `tmpl-${Date.now()}`,
      name: name.trim(),
      targetSplit: split,
      description: description.trim() || 'Custom targeted workout routine',
      exercises: selectedExercises,
    };

    saveWorkoutTemplate(templateToSave);
    onClose();
  };

  const muscleGroups = ['all', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[var(--color-text)] text-base">
              {initialTemplate ? 'Edit Routine' : 'Build Custom Routine'}
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">Design your split & target exercises</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close builder"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Routine Name & Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">
                Routine Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Upper Hypertrophy B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">
                Split Category
              </label>
              <select
                value={split}
                onChange={(e) => setSplit(e.target.value)}
                className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
              >
                <option value="Upper / Lower">Upper / Lower</option>
                <option value="Push / Pull / Legs">Push / Pull / Legs</option>
                <option value="Full Body">Full Body</option>
                <option value="Conditioning">Conditioning</option>
                <option value="Specialization">Specialization</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Notes / Routine Focus</label>
            <input
              type="text"
              placeholder="e.g. Focus on chest fly volume and lats overload"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Exercise List Header */}
          <div className="pt-2 border-t border-[var(--color-border)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Exercises ({selectedExercises.length})
              </span>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="min-h-[38px] px-3 py-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]/25 border border-[var(--color-accent)] text-[var(--color-accent)] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exercise</span>
              </button>
            </div>

            {/* Exercise items */}
            {selectedExercises.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-subtle)] border border-dashed border-[var(--color-border)] rounded-2xl">
                No exercises selected yet. Tap &quot;Add Exercise&quot; above to pick exercises.
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedExercises.map((item, idx) => {
                  const exDef = exercises.find((x) => x.id === item.exerciseId);
                  return (
                    <div
                      key={item.exerciseId}
                      className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-[var(--color-text)]">
                              {exDef?.name || 'Exercise'}
                            </h4>
                          </div>

                          {/* Targeted Muscles Badges */}
                          {exDef && (
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="text-[var(--color-text-subtle)] font-medium">Primary:</span>
                              {exDef.primaryMuscles.map((m) => (
                                <span
                                  key={m}
                                  className="px-1.5 py-0.5 rounded bg-[var(--color-accent)] border border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
                                >
                                  {m}
                                </span>
                              ))}
                              {exDef.secondaryMuscles && exDef.secondaryMuscles.length > 0 && (
                                <>
                                  <span className="text-[var(--color-text-subtle)] font-medium ml-1">Secondary:</span>
                                  {exDef.secondaryMuscles.map((m) => (
                                    <span
                                      key={m}
                                      className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Order & Remove Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-20"
                            aria-label="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === selectedExercises.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-20"
                            aria-label="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(idx)}
                            className="p-1.5 text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] ml-1"
                            aria-label="Remove exercise"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sets, Reps & RPE Config */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-900 text-center">
                        <div>
                          <label className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">Sets</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={item.defaultSets}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'defaultSets', parseInt(e.target.value) || 3)
                            }
                            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">Reps</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={item.defaultReps}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'defaultReps', parseInt(e.target.value) || 10)
                            }
                            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">
                            Target RPE
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="10"
                            step="0.5"
                            value={item.targetRpe || 8}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'targetRpe', parseFloat(e.target.value) || 8)
                            }
                            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-1 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] py-2.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] font-semibold rounded-xl text-xs active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedExercises.length === 0 || !name.trim()}
              className="min-h-[44px] py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Routine</span>
            </button>
          </div>
        </form>

        {/* Exercise Selector Sub-Modal */}
        {showPicker && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-5 space-y-3.5 max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-[var(--color-text)] text-sm">Select Exercise</h4>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search exercise or muscle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              {/* Filter Muscle Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {muscleGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setFilterMuscle(group)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize whitespace-nowrap transition-all border ${
                      filterMuscle === group
                        ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent)]'
                        : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              {/* Exercises List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredExercises.map((ex) => {
                  const alreadyAdded = selectedExercises.some((s) => s.exerciseId === ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddExerciseToRoutine(ex.id)}
                      className={`w-full p-3 rounded-2xl text-left border transition-all flex flex-col gap-1.5 ${
                        alreadyAdded
                          ? 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] opacity-40 cursor-not-allowed'
                          : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] hover:border-[var(--color-accent-hover)]/60 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs text-[var(--color-text)]">{ex.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                          {ex.equipment}
                        </span>
                      </div>

                      {/* Targeted muscles display */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {ex.primaryMuscles.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 rounded bg-[var(--color-accent)] border border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
                          >
                            {m}
                          </span>
                        ))}
                        {ex.secondaryMuscles &&
                          ex.secondaryMuscles.map((m) => (
                            <span key={m} className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                              {m}
                            </span>
                          ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
