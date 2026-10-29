import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { convertKgToLb, convertLbToKg } from '../../utils/engine';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface WeighInModalProps {
  onClose: () => void;
}

export function WeighInModal({ onClose }: WeighInModalProps) {
  useBodyScrollLock(true);
  const { state, addWeightRecord } = useFitness();
  const { profile, weights } = state;
  const isImperial = profile.unitSystem === 'imperial';

  const latestRec = weights[weights.length - 1];
  const initialWeight = latestRec
    ? isImperial
      ? convertKgToLb(latestRec.weightKg).toString()
      : latestRec.weightKg.toString()
    : '82.5';

  const [weightInput, setWeightInput] = useState(initialWeight);
  const [waistInput, setWaistInput] = useState(latestRec?.waistCm ? latestRec.waistCm.toString() : '');
  const [bodyFatInput, setBodyFatInput] = useState(
    latestRec?.bodyFatPct ? latestRec.bodyFatPct.toString() : ''
  );
  const [notesInput, setNotesInput] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(weightInput);
    if (!rawVal || isNaN(rawVal)) return;

    const finalWeightKg = isImperial ? convertLbToKg(rawVal) : rawVal;
    const finalWaistCm = waistInput ? parseFloat(waistInput) : undefined;
    const finalBf = bodyFatInput ? parseFloat(bodyFatInput) : undefined;

    addWeightRecord({
      date: new Date().toISOString().split('T')[0],
      weightKg: Number(finalWeightKg.toFixed(2)),
      waistCm: finalWaistCm,
      bodyFatPct: finalBf,
      notes: notesInput.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base">Record Weigh-In</h3>
            <span className="text-xs text-zinc-400">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close weigh-in"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Main Weight Field */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Scale Weight ({isImperial ? 'lb' : 'kg'}) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="min-h-[50px] w-full bg-zinc-950 border border-zinc-800 rounded-2xl text-center text-2xl font-black text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Waist Circumference */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Waist Circumference (cm - optional)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 84.5"
              value={waistInput}
              onChange={(e) => setWaistInput(e.target.value)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Body Fat % */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Body Fat % (optional)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 15.2"
              value={bodyFatInput}
              onChange={(e) => setBodyFatInput(e.target.value)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Weigh-in Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Ate late, heavy training day, sore"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

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
              <span>Save Weigh-in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
