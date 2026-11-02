import React, { useState } from 'react';
import { X, Dumbbell, Plus, Minus, Check } from 'lucide-react';
import { calculateBarbellPlates } from '../../utils/plateCalculator';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  unit?: 'kg' | 'lbs';
  onClose: () => void;
  onApplyWeight?: (newWeight: number) => void;
}

export function PlateCalculatorModal({
  initialWeightKg,
  unit = 'kg',
  onClose,
  onApplyWeight,
}: PlateCalculatorModalProps) {
  useBodyScrollLock(true);
  const defaultBar = unit === 'lbs' ? 45 : 20;
  const [targetWeight, setTargetWeight] = useState<number>(
    Math.max(defaultBar, initialWeightKg || defaultBar)
  );
  const [barWeight, setBarWeight] = useState<number>(defaultBar);

  const stepAmount = unit === 'lbs' ? 5 : 2.5;
  const result = calculateBarbellPlates(targetWeight, barWeight, unit);

  const handleStep = (delta: number) => {
    setTargetWeight((prev) => Math.max(barWeight, Number((prev + delta).toFixed(2))));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center font-bold">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Plate Calculator</h3>
              <span className="text-[10px] text-[var(--color-text-muted)]">Barbell sleeve loading math</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close plate calculator"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Weight Display & Quick Steppers */}
        <div className="bg-[var(--color-surface-sunken)] p-3.5 rounded-2xl border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)] font-medium">Target Weight</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setBarWeight(unit === 'lbs' ? 45 : 20)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  barWeight === (unit === 'lbs' ? 45 : 20)
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                }`}
              >
                {unit === 'lbs' ? '45 lb Bar' : '20 kg Bar'}
              </button>
              <button
                type="button"
                onClick={() => setBarWeight(unit === 'lbs' ? 35 : 15)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  barWeight === (unit === 'lbs' ? 35 : 15)
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                }`}
              >
                {unit === 'lbs' ? '35 lb Bar' : '15 kg Bar'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleStep(-stepAmount * 2)}
                className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-bold active:scale-95 transition-all"
              >
                -{stepAmount * 2}
              </button>
              <button
                type="button"
                onClick={() => handleStep(-stepAmount)}
                className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-bold active:scale-95 transition-all"
              >
                <Minus className="w-3.5 h-3.5 mx-auto" />
              </button>
            </div>

            <div className="text-center flex-1">
              <span className="text-2xl font-black text-[var(--color-accent)] leading-none tabular-nums block">
                {targetWeight}
              </span>
              <span className="text-[10px] text-[var(--color-text-subtle)] uppercase tracking-wider font-bold">
                {unit} Total
              </span>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleStep(stepAmount)}
                className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-bold active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(stepAmount * 2)}
                className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-bold active:scale-95 transition-all"
              >
                +{stepAmount * 2}
              </button>
            </div>
          </div>
        </div>

        {/* Visual Barbell Sleeve Rendering */}
        <div className="bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--color-text-muted)]">Per Side Loading</span>
            <span className="font-bold text-[var(--color-accent)] tabular-nums">
              {result.weightPerSide} {unit} / side
            </span>
          </div>

          {/* Barbell Diagram */}
          <div className="h-24 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border)] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Horizontal Bar */}
            <div className="absolute left-0 right-0 h-3 bg-zinc-600 rounded-sm z-0" />
            {/* Bar Collar */}
            <div className="absolute left-6 h-12 w-3 bg-zinc-400 rounded-sm z-10 border border-zinc-700 shadow-sm" />

            {/* Stacked Plates on Sleeve */}
            <div className="flex items-center gap-1 z-20 ml-8">
              {result.platesPerSide.length === 0 ? (
                <span className="text-[11px] text-[var(--color-text-subtle)] font-medium">
                  Empty bar ({barWeight} {unit})
                </span>
              ) : (
                result.platesPerSide.flatMap((p) =>
                  Array.from({ length: p.countPerSide }).map((_, i) => (
                    <div
                      key={`${p.weight}-${i}`}
                      style={{
                        backgroundColor: p.color,
                        height: `${p.heightRem}rem`,
                        width: '14px',
                      }}
                      className="rounded-sm border border-black/40 shadow-md flex items-center justify-center text-[7px] font-black text-black select-none"
                      title={`${p.weight} ${unit}`}
                    >
                      <span className="transform -rotate-90 whitespace-nowrap opacity-85">
                        {p.weight}
                      </span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Plate Inventory Count Summary */}
          {result.platesPerSide.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.platesPerSide.map((p) => (
                <span
                  key={p.weight}
                  className="text-[10px] px-2 py-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-text)] font-semibold flex items-center gap-1"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>
                    {p.weight} {unit} × {p.countPerSide}
                  </span>
                </span>
              ))}
            </div>
          )}

          {result.remainder > 0 && (
            <p className="text-[10px] text-[var(--color-warning)] pt-0.5">
              Note: Unloaded remainder of {result.remainder} {unit} requires microplates.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] font-semibold rounded-xl text-xs active:scale-95 transition-all"
          >
            Done
          </button>
          {onApplyWeight ? (
            <button
              type="button"
              onClick={() => {
                onApplyWeight(result.achievableTotalWeight);
                onClose();
              }}
              className="min-h-[44px] py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Use {result.achievableTotalWeight} {unit}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
