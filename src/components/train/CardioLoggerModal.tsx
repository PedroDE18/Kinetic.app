import React, { useState, useMemo } from 'react';
import { X, Check, Flame, Heart, Timer, MapPin, Gauge } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { CardioActivityType, CardioSession } from '../../types';
import { formatPace, convertKmToMiles, convertMilesToKm } from '../../utils/engine';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface CardioLoggerModalProps {
  onClose: () => void;
}

const ACTIVITIES: { type: CardioActivityType; label: string; icon: string; defaultMet: number }[] = [
  { type: 'running', label: 'Running', icon: '🏃', defaultMet: 9.8 },
  { type: 'walking', label: 'Walking', icon: '🚶', defaultMet: 3.5 },
  { type: 'cycling', label: 'Cycling (Road)', icon: '🚴', defaultMet: 7.5 },
  { type: 'stationary_bike', label: 'Stationary Bike', icon: '🚴‍♂️', defaultMet: 7.0 },
  { type: 'swimming', label: 'Swimming', icon: '🏊', defaultMet: 8.0 },
  { type: 'rowing', label: 'Rowing', icon: '🚣', defaultMet: 7.0 },
  { type: 'stairmaster', label: 'Stairmaster', icon: '🪜', defaultMet: 8.5 },
  { type: 'elliptical', label: 'Elliptical', icon: '⚡', defaultMet: 6.5 },
];

export function CardioLoggerModal({ onClose }: CardioLoggerModalProps) {
  useBodyScrollLock(true);
  const { state, addCardioSession } = useFitness();
  const isImperial = state.profile.unitSystem === 'imperial';

  const [activity, setActivity] = useState<CardioActivityType>('running');
  const [distanceInput, setDistanceInput] = useState('5.0');
  const [durationMinutes, setDurationMinutes] = useState('26');
  const [durationSeconds, setDurationSeconds] = useState('0');
  const [avgHeartRate, setAvgHeartRate] = useState('148');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Compute live duration and pace
  const totalDurationSecs = useMemo(() => {
    const mins = parseInt(durationMinutes, 10) || 0;
    const secs = parseInt(durationSeconds, 10) || 0;
    return mins * 60 + secs;
  }, [durationMinutes, durationSeconds]);

  const distanceKm = useMemo(() => {
    const raw = parseFloat(distanceInput) || 0;
    return isImperial ? convertMilesToKm(raw) : raw;
  }, [distanceInput, isImperial]);

  const livePaceSecPerKm = useMemo(() => {
    if (distanceKm <= 0 || totalDurationSecs <= 0) return 0;
    return Math.round(totalDurationSecs / distanceKm);
  }, [distanceKm, totalDurationSecs]);

  // Auto-estimate calories if user hasn't explicitly overridden
  const estimatedCalories = useMemo(() => {
    if (caloriesInput) return parseInt(caloriesInput, 10) || 0;
    const actMeta = ACTIVITIES.find((a) => a.type === activity);
    const met = actMeta ? actMeta.defaultMet : 7.0;
    const bodyWeightKg = state.weights[state.weights.length - 1]?.weightKg || 80;
    // Calories = MET * Weight(kg) * Time(hours)
    const hours = totalDurationSecs / 3600;
    return Math.round(met * bodyWeightKg * hours);
  }, [caloriesInput, activity, totalDurationSecs, state.weights]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalDurationSecs <= 0) return;

    const newSession: CardioSession = {
      id: `cardio-${Date.now()}`,
      date,
      type: activity,
      activity,
      name: `${activity.replace('_', ' ')} session`,
      durationMinutes: Math.round(totalDurationSecs / 60),
      durationSeconds: totalDurationSecs,
      distanceKm: Number(distanceKm.toFixed(2)),
      avgPaceSecPerKm: livePaceSecPerKm,
      avgPaceMinPerKm: formatPace(Math.round(totalDurationSecs / 60), Number(distanceKm.toFixed(2))),
      caloriesBurned: estimatedCalories,
      avgHeartRateBpm: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
      notes: notes.trim() || undefined,
    };

    addCardioSession(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base">Log Cardio Training</h3>
            <span className="text-xs text-zinc-400">Track pace, distance & heart rate</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cardio logger"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Grid Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Select Activity
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACTIVITIES.map((act) => (
                <button
                  key={act.type}
                  type="button"
                  onClick={() => setActivity(act.type)}
                  className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 min-h-[58px] ${
                    activity === act.type
                      ? 'bg-teal-500/20 border-teal-500/80 text-teal-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-lg">{act.icon}</span>
                  <span className="text-[10px] font-bold truncate max-w-full">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Distance & Duration Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>Distance ({isImperial ? 'miles' : 'km'})</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={distanceInput}
                onChange={(e) => setDistanceInput(e.target.value)}
                className="min-h-[46px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-base font-bold text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1 mb-1">
                <Timer className="w-3.5 h-3.5 text-teal-400" />
                <span>Duration</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  placeholder="min"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="min-h-[46px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
                <span className="text-zinc-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="sec"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="min-h-[46px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Calculated Pace Preview Badge */}
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                  Calculated Pace
                </span>
                <span className="text-sm font-black text-teal-300">
                  {formatPace(livePaceSecPerKm, state.profile.unitSystem)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Burn Est.
              </span>
              <span className="text-sm font-bold text-white flex items-center justify-end gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {estimatedCalories} kcal
              </span>
            </div>
          </div>

          {/* Heart Rate & Custom Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>Avg HR (bpm)</span>
              </label>
              <input
                type="number"
                min="40"
                max="230"
                placeholder="e.g. 150"
                value={avgHeartRate}
                onChange={(e) => setAvgHeartRate(e.target.value)}
                className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Override kcal</span>
              </label>
              <input
                type="number"
                placeholder={estimatedCalories.toString()}
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
                className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Session Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Zone 2 outdoor run, steady cadence"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
