import React from 'react';
import { Award, CheckCircle2, X, Dumbbell, Clock } from 'lucide-react';
import { CompletedWorkout } from '../../types';

interface WorkoutSummaryModalProps {
  workout: CompletedWorkout;
  onClose: () => void;
}

export function WorkoutSummaryModal({ workout, onClose }: WorkoutSummaryModalProps) {
  const durationMins = Math.round(workout.durationSeconds / 60);
  const totalCompletedSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                Workout Complete
              </span>
              <h3 className="text-base font-bold text-[var(--color-text)] leading-tight">{workout.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close summary"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Achievement Callout */}
        {workout.personalRecordsAchieved && workout.personalRecordsAchieved.length > 0 && (
          <div className="p-3 bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-2xl flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[var(--color-accent)]">New Personal Record!</div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {workout.personalRecordsAchieved.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)]">
            <Clock className="w-4 h-4 text-[var(--color-text-muted)] mx-auto mb-1" />
            <div className="text-base font-semibold text-[var(--color-text)]">{durationMins}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Minutes</div>
          </div>
          <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)]">
            <Dumbbell className="w-4 h-4 text-[var(--color-text-muted)] mx-auto mb-1" />
            <div className="text-base font-semibold text-[var(--color-accent)]">
              {workout.totalVolumeKg.toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Total Vol (kg)</div>
          </div>
          <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-text-muted)] mx-auto mb-1" />
            <div className="text-base font-semibold text-[var(--color-text)]">{totalCompletedSets}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Sets Done</div>
          </div>
        </div>

        {/* Exercise breakdown */}
        <div className="bg-[var(--color-surface-sunken)] p-3.5 rounded-2xl border border-[var(--color-border)] space-y-2 max-h-48 overflow-y-auto">
          <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Exercises Logged
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {workout.exercises.map((ex) => {
              const doneSets = ex.sets.filter((s) => s.isCompleted);
              return (
                <div key={ex.exerciseId} className="py-1.5 flex justify-between text-xs">
                  <span className="font-medium text-[var(--color-text)]">{ex.exerciseName}</span>
                  <span className="text-[var(--color-text-muted)] font-semibold">{doneSets.length} sets completed</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[48px] w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
