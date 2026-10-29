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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                Workout Complete
              </span>
              <h3 className="text-base font-bold text-white leading-tight">{workout.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close summary"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Achievement Callout */}
        {workout.personalRecordsAchieved && workout.personalRecordsAchieved.length > 0 && (
          <div className="p-3 bg-teal-950/60 border border-teal-500/40 rounded-2xl flex items-center gap-2.5">
            <Award className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-teal-300">New Personal Record!</div>
              <div className="text-[11px] text-zinc-300">
                {workout.personalRecordsAchieved.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <Clock className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
            <div className="text-base font-black text-white">{durationMins}</div>
            <div className="text-[10px] text-zinc-400 uppercase">Minutes</div>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <Dumbbell className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
            <div className="text-base font-black text-teal-400">
              {workout.totalVolumeKg.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase">Total Vol (kg)</div>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <CheckCircle2 className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
            <div className="text-base font-black text-white">{totalCompletedSets}</div>
            <div className="text-[10px] text-zinc-400 uppercase">Sets Done</div>
          </div>
        </div>

        {/* Exercise breakdown */}
        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2 max-h-48 overflow-y-auto">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Exercises Logged
          </div>
          <div className="divide-y divide-zinc-850">
            {workout.exercises.map((ex) => {
              const doneSets = ex.sets.filter((s) => s.isCompleted);
              return (
                <div key={ex.exerciseId} className="py-1.5 flex justify-between text-xs">
                  <span className="font-medium text-zinc-200">{ex.exerciseName}</span>
                  <span className="text-zinc-400 font-semibold">{doneSets.length} sets completed</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[48px] w-full py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
