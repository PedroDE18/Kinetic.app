import React, { useState } from 'react';
import { X, Search, Award, Dumbbell, Sparkles } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface ExerciseAtlasModalProps {
  onClose: () => void;
}

export function ExerciseAtlasModal({ onClose }: ExerciseAtlasModalProps) {
  useBodyScrollLock(true);
  const { state } = useFitness();
  const { exercises } = state;

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');

  const muscles = ['all', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(search.toLowerCase())) ||
      (ex.secondaryMuscles &&
        ex.secondaryMuscles.some((m) => m.toLowerCase().includes(search.toLowerCase())));
    const matchesGroup = selectedMuscle === 'all' || ex.muscleGroup === selectedMuscle;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--color-accent)] text-xs font-bold uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Targeted Muscle Atlas</span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] mt-0.5">Exercise & Muscle Library</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close atlas"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search exercise or muscle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Muscle group tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-[10px] font-bold capitalize whitespace-nowrap transition-all border ${
                selectedMuscle === m
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl p-4 space-y-2.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text)]">{ex.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                    {ex.muscleGroup} • {ex.equipment}
                  </span>
                </div>

                {ex.personalRecord && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--color-accent)] border border-[var(--color-accent)] text-[10px] text-[var(--color-accent)] font-semibold">
                    <Award className="w-3 h-3" />
                    <span>
                      {ex.personalRecord.weightKg} kg × {ex.personalRecord.reps}
                    </span>
                  </div>
                )}
              </div>

              {/* Muscle targeting breakdown */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-900">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    Primary:
                  </span>
                  {ex.primaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md bg-[var(--color-accent)] border border-[var(--color-accent)] text-[var(--color-accent)] text-[11px] font-bold"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                      Secondary:
                    </span>
                    {ex.secondaryMuscles.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
