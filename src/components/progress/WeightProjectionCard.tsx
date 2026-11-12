import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Check,
  X,
  Flame,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import {
  calculateWeightTrend,
  calculateAdaptiveTDEE,
  calculateWeightTrendProjection,
  convertKgToLb,
  convertLbToKg,
  formatDisplayDate,
} from '../../utils/engine';
import { WeightProjectionConeChart } from './WeightProjectionConeChart';

export function WeightProjectionCard() {
  const { state, updateProfile } = useFitness();
  const { weights, loggedFoods, profile } = state;
  const isImperial = profile.unitSystem === 'imperial';
  const unit = isImperial ? 'lbs' : 'kg';

  // State for inline target weight editing
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(
    profile.targetWeightKg !== undefined
      ? String(
          isImperial
            ? Number(convertKgToLb(profile.targetWeightKg).toFixed(1))
            : profile.targetWeightKg
        )
      : ''
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Compute adaptive TDEE & current trend weight
  const adaptiveTdee = useMemo(
    () => calculateAdaptiveTDEE(weights, loggedFoods),
    [weights, loggedFoods]
  );

  const trendPoints = useMemo(() => calculateWeightTrend(weights), [weights]);
  const currentTrendWeightKg = useMemo(() => {
    if (trendPoints.length > 0) {
      return trendPoints[trendPoints.length - 1].trendWeightKg;
    }
    return profile.weightKg || 75.0;
  }, [trendPoints, profile.weightKg]);

  // Daily energy balance
  const targetCalories = profile.targets?.calories || 2150;
  const dailyEnergyBalance = targetCalories - adaptiveTdee.estimatedTdee;

  // Rate of change: use profile target rate if set, otherwise derive from energy balance
  const weeklyRateKg =
    typeof profile.targetRateKgPerWeek === 'number' && Math.abs(profile.targetRateKgPerWeek) > 0.01
      ? profile.targetRateKgPerWeek
      : (dailyEnergyBalance * 7) / 7700;

  // Compute 12-week forward projection cone
  const projection = useMemo(() => {
    return calculateWeightTrendProjection(
      currentTrendWeightKg,
      profile.targetWeightKg,
      weeklyRateKg,
      dailyEnergyBalance,
      new Date(),
      12
    );
  }, [currentTrendWeightKg, profile.targetWeightKg, weeklyRateKg, dailyEnergyBalance]);

  const displayVal = (kg: number) =>
    Number((isImperial ? convertKgToLb(kg) : kg).toFixed(1));

  const handleSaveTargetWeight = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(targetInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 20 && parsed < 500) {
      const targetKg = isImperial ? convertLbToKg(parsed) : parsed;
      updateProfile({ targetWeightKg: Number(targetKg.toFixed(1)) });
      setIsEditingTarget(false);
      setSaveSuccessMsg(`Target set to ${parsed} ${unit}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const week12Point = projection.projectionPoints[11];
  const projected12WkWeight = week12Point
    ? displayVal(week12Point.medianKg)
    : displayVal(currentTrendWeightKg);
  const currentDisplayWeight = displayVal(currentTrendWeightKg);
  const net12WkDelta = Number((projected12WkWeight - currentDisplayWeight).toFixed(1));

  return (
    <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-4 shadow-xs">
      {/* Header and Trajectory Intent */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
            <h3 className="text-xs uppercase font-bold tracking-wider text-[var(--color-text)]">
              12-Week Weight Projection Cone
            </h3>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
            Thermodynamic mass trajectory based on adaptive expenditure ({adaptiveTdee.estimatedTdee} kcal) and target intake ({targetCalories} kcal).
          </p>
        </div>

        {/* Goal Status Badge */}
        {projection.isGoalReached ? (
          <span className="px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] text-[10px] font-bold flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Goal Reached
          </span>
        ) : projection.isMovingTowardGoal ? (
          <span className="px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-accent)] text-[10px] font-bold flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {projection.weeksToGoal}w to goal
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text-subtle)] text-[10px] font-medium shrink-0">
            {profile.goal.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* 4 Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* 1. Current Trend */}
        <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl">
          <span className="text-[10px] uppercase font-semibold text-[var(--color-text-subtle)] block">
            Current Trend
          </span>
          <div className="text-sm font-bold text-[var(--color-text)] mt-0.5">
            {currentDisplayWeight} <span className="text-[11px] font-normal text-[var(--color-text-muted)]">{unit}</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
            Smoothed EWMA
          </span>
        </div>

        {/* 2. Projected 12-Week Weight */}
        <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl">
          <span className="text-[10px] uppercase font-semibold text-[var(--color-text-subtle)] block">
            Projected 12w
          </span>
          <div className="text-sm font-bold text-[var(--color-text)] mt-0.5 flex items-center gap-1">
            <span>{projected12WkWeight}</span>
            <span className="text-[11px] font-normal text-[var(--color-text-muted)]">{unit}</span>
            {net12WkDelta < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            ) : net12WkDelta > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            ) : null}
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
            {net12WkDelta > 0 ? `+${net12WkDelta}` : net12WkDelta} {unit} total
          </span>
        </div>

        {/* 3. Expected Weekly Rate */}
        <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl">
          <span className="text-[10px] uppercase font-semibold text-[var(--color-text-subtle)] block">
            Weekly Pace
          </span>
          <div className="text-sm font-bold text-[var(--color-text)] mt-0.5">
            {displayVal(projection.weeklyRateKg) > 0 ? `+${displayVal(projection.weeklyRateKg)}` : displayVal(projection.weeklyRateKg)}{' '}
            <span className="text-[11px] font-normal text-[var(--color-text-muted)]">{unit}/wk</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
            {dailyEnergyBalance > 0 ? `+${dailyEnergyBalance}` : dailyEnergyBalance} kcal/day
          </span>
        </div>

        {/* 4. Target Goal & Projected Arrival */}
        <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-subtle)] block">
              Target Goal
            </span>
            <button
              onClick={() => setIsEditingTarget(!isEditingTarget)}
              aria-label="Edit target goal weight"
              className="text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] transition-colors p-0.5"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>

          {profile.targetWeightKg !== undefined ? (
            <>
              <div className="text-sm font-bold text-[var(--color-accent)] mt-0.5">
                {displayVal(profile.targetWeightKg)}{' '}
                <span className="text-[11px] font-normal text-[var(--color-text-muted)]">{unit}</span>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5 truncate">
                {projection.estimatedArrivalDate
                  ? `ETA: ${formatDisplayDate(projection.estimatedArrivalDate)}`
                  : 'Maintain focus'}
              </span>
            </>
          ) : (
            <button
              onClick={() => setIsEditingTarget(true)}
              className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline mt-1 block"
            >
              + Set Target
            </button>
          )}
        </div>
      </div>

      {/* Target Weight Quick-Editor Drawer */}
      {isEditingTarget && (
        <form
          onSubmit={handleSaveTargetWeight}
          className="p-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between gap-2 animate-in fade-in"
        >
          <div className="flex items-center gap-2 flex-1">
            <Target className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Target weight in ${unit}`}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingTarget(false)}
              className="p-1.5 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {saveSuccessMsg && (
        <p className="text-[11px] font-semibold text-[var(--color-accent)] text-center animate-in fade-in">
          {saveSuccessMsg}
        </p>
      )}

      {/* SVG Projection Cone Chart */}
      <WeightProjectionConeChart
        projection={projection}
        unitSystem={profile.unitSystem}
        height={210}
      />

      {/* Informative Guidance Footer */}
      <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        <p>
          <strong className="text-[var(--color-text)]">MacroFactor-Grade Energetics:</strong> The solid trajectory represents expected progress under your current caloric plan. The shaded confidence cone accounts for natural metabolic adaptation, fluid shifts, and real-world adherence drift.
        </p>
      </div>
    </div>
  );
}
