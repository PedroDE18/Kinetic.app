import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  ShieldCheck,
  Cpu,
  Minus,
  Plus,
  Compass,
  Brain,
  Dumbbell,
  Sliders,
} from 'lucide-react';
import { WeeklyReviewRecord } from '../../types';
import { useFitness } from '../../context/FitnessContext';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { generateNarrativeInsight, NarrativeInsight } from '../../services/narrativeCoach';

interface WeeklyReviewModalProps {
  review?: WeeklyReviewRecord;
  onClose: () => void;
  onAccept: (reviewId: string, customTarget?: number) => void;
  onReject: (reviewId: string) => void;
}

export function WeeklyReviewModal({
  review,
  onClose,
  onAccept,
  onReject,
}: WeeklyReviewModalProps) {
  useBodyScrollLock(true);
  const { state } = useFitness();

  const [adjustedTarget, setAdjustedTarget] = useState<number>(
    review?.proposedCalorieTarget || 2000
  );
  const [narrative, setNarrative] = useState<NarrativeInsight | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState(false);

  useEffect(() => {
    if (!review) return;
    setAdjustedTarget(review.proposedCalorieTarget);
    setLoadingNarrative(true);

    generateNarrativeInsight(
      {
        profile: state.profile,
        review,
        completedWorkoutsCount: state.completedWorkouts.length,
        avgDailyWaterMl: state.waterMlToday,
      },
      state.profile.geminiApiKey
    )
      .then((res) => {
        setNarrative(res);
      })
      .catch(() => {
        // Fallback already handled inside generateNarrativeInsight
      })
      .finally(() => {
        setLoadingNarrative(false);
      });
  }, [review, state.profile, state.completedWorkouts.length, state.waterMlToday]);

  const holistic = React.useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Mind
    const weekReflections = state.reflections.filter((r) => r.date >= weekAgoStr);
    const weatherCounts: Record<string, number> = {};
    for (const r of weekReflections) {
      if (r.affectiveWeather) {
        weatherCounts[r.affectiveWeather] = (weatherCounts[r.affectiveWeather] || 0) + 1;
      }
    }
    const dominantWeather = Object.entries(weatherCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'clear';

    // Body
    const weekWorkouts = state.completedWorkouts.filter((w) => w.startTime >= weekAgoStr);
    const totalVolume = weekWorkouts.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0);

    // Systems
    const activeHabits = state.habits.filter((h) => !h.archived);
    const totalPossible = activeHabits.length * 7;
    let completedCount = 0;
    for (const h of activeHabits) {
      for (const d of h.completedDates) {
        if (d >= weekAgoStr) completedCount++;
      }
    }
    const habitPct = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 100;

    return {
      mind: {
        reflectionsCount: weekReflections.length,
        dominantWeather,
      },
      body: {
        workoutsCount: weekWorkouts.length,
        totalVolumeKg: totalVolume,
      },
      systems: {
        habitCompliancePct: habitPct,
        activeHabitsCount: activeHabits.length,
      },
    };
  }, [state.reflections, state.completedWorkouts, state.habits]);

  if (!review) return null;

  const currentCal = review.currentCalorieTarget;
  const currentDelta = adjustedTarget - currentCal;
  const deltaFormatted = currentDelta > 0 ? `+${currentDelta}` : `${currentDelta}`;
  const isPending = review.status === 'pending';
  const confidenceScore = narrative?.confidenceBreakdown.scorePct ?? Math.round(review.confidenceScore * 100);

  const handleStepTarget = (amount: number) => {
    setAdjustedTarget((prev) => Math.min(5000, Math.max(1000, prev + amount)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-5 space-y-3.5 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                Weekly Metabolic Check-in
              </span>
              <h3 className="k-display text-base text-[var(--color-text)] leading-tight">
                Adaptive Calorie Review
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout if already resolved */}
        {!isPending && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              review.status === 'accepted'
                ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]/30'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {review.status === 'accepted'
                ? `Accepted (Target: ${review.proposedCalorieTarget} kcal)`
                : `Dismissed (Target kept at ${review.currentCalorieTarget} kcal)`}
            </span>
          </div>
        )}

        {/* Holistic 360° Synthesis Matrix */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-[var(--color-surface)] p-2.5 rounded-2xl border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-accent)] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Brain className="w-3 h-3" /> Mind
            </span>
            <span className="font-bold text-xs text-[var(--color-text)] block mt-0.5">
              {holistic.mind.reflectionsCount} logs
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] capitalize">
              {holistic.mind.dominantWeather}
            </span>
          </div>

          <div className="bg-[var(--color-surface)] p-2.5 rounded-2xl border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-accent)] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Dumbbell className="w-3 h-3" /> Body
            </span>
            <span className="font-bold text-xs text-[var(--color-text)] block mt-0.5">
              {holistic.body.workoutsCount} sessions
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">
              {holistic.body.totalVolumeKg > 0 ? `${(holistic.body.totalVolumeKg / 1000).toFixed(1)}t vol` : '0 vol'}
            </span>
          </div>

          <div className="bg-[var(--color-surface)] p-2.5 rounded-2xl border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-accent)] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Sliders className="w-3 h-3" /> Systems
            </span>
            <span className="font-bold text-xs text-[var(--color-text)] block mt-0.5 tabular-nums">
              {holistic.systems.habitCompliancePct}%
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {holistic.systems.activeHabitsCount} habits
            </span>
          </div>
        </div>

        {/* Narrative Athletic Coaching Insight */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-3.5 border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
              <Compass className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>{narrative ? narrative.headline : 'Weekly Narrative Coach'}</span>
            </div>
            {narrative && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                {narrative.source === 'model' ? <Sparkles className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                {narrative.source === 'model' ? 'Gemini Insight' : 'Coach Synthesis'}
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {loadingNarrative && !narrative
              ? 'Analyzing weekly adherence and trend metrics…'
              : narrative?.story || review.reason}
          </p>

          {narrative?.recommendation && (
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[11px] text-[var(--color-text)]">
              <span className="font-bold text-[var(--color-accent)] block mb-0.5">Coach Recommendation:</span>
              <span>{narrative.recommendation}</span>
            </div>
          )}
        </div>

        {/* Data Confidence Explanation Bar */}
        <div className="bg-[var(--color-surface-sunken)] rounded-2xl p-3 border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Algorithm Confidence</span>
            <span className="font-bold text-[var(--color-accent)]">
              {confidenceScore}% ({narrative?.confidenceBreakdown.level || (confidenceScore >= 70 ? 'High' : 'Moderate')})
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${confidenceScore}%` }}
            />
          </div>

          {/* Breakdown Factors Chips */}
          {narrative?.confidenceBreakdown.factors && (
            <div className="flex flex-wrap gap-1 pt-1">
              {narrative.confidenceBreakdown.factors.map((factor, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-subtle)]"
                >
                  ✓ {factor}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Metrics Matrix */}
        <div className="bg-[var(--color-surface-sunken)] rounded-2xl p-3 border border-[var(--color-border)] space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Avg Daily Intake:</span>
            <span className="font-bold text-[var(--color-text)]">{review.avgCalorieIntake} kcal/day</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Avg Protein Intake:</span>
            <span className="font-bold text-[var(--color-text)]">{review.avgProteinIntake} g/day</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">7-Day Weight Delta:</span>
            <span className="font-bold text-[var(--color-accent)]">
              {review.weightDeltaKg > 0 ? `+${review.weightDeltaKg}` : review.weightDeltaKg} kg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Estimated TDEE:</span>
            <span className="font-bold text-[var(--color-text)]">{review.estimatedTdee} kcal/day</span>
          </div>
        </div>

        {/* Interactive Target Adjuster */}
        {isPending && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--color-text-muted)]">New Target Calibration:</span>
              <span className="text-[11px] font-bold text-[var(--color-accent)]">
                {currentDelta === 0 ? 'Holding Flat' : `${deltaFormatted} kcal/day vs current`}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[var(--color-surface-sunken)] p-2 rounded-xl border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => handleStepTarget(-25)}
                className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text)] active:scale-95 transition-all"
                aria-label="Decrease target by 25 kcal"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="text-center">
                <span className="text-lg font-black text-[var(--color-accent)] block leading-none">
                  {adjustedTarget}
                </span>
                <span className="text-[10px] text-[var(--color-text-subtle)]">kcal / day</span>
              </div>

              <button
                type="button"
                onClick={() => handleStepTarget(25)}
                className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text)] active:scale-95 transition-all"
                aria-label="Increase target by 25 kcal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        {isPending ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onReject(review.id)}
              className="min-h-[44px] py-2.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] font-semibold rounded-xl text-xs active:scale-95 transition-all"
            >
              Keep Current
            </button>
            <button
              onClick={() => onAccept(review.id, adjustedTarget)}
              className="min-h-[44px] py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply {adjustedTarget} kcal</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="min-h-[44px] w-full py-2.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold rounded-xl text-xs"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
