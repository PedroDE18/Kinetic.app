import { Sparkles, X, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { WeeklyReviewRecord } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface WeeklyReviewModalProps {
  review?: WeeklyReviewRecord;
  onClose: () => void;
  onAccept: (reviewId: string) => void;
  onReject: (reviewId: string) => void;
}

export function WeeklyReviewModal({
  review,
  onClose,
  onAccept,
  onReject,
}: WeeklyReviewModalProps) {
  useBodyScrollLock(true);
  if (!review) return null;

  const deltaFormatted =
    review.adjustmentDelta > 0
      ? `+${review.adjustmentDelta}`
      : `${review.adjustmentDelta}`;

  const isPending = review.status === 'pending';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                Weekly metabolic check-in
              </span>
              <h3 className="k-display text-base text-[var(--color-text)] leading-tight">Adaptive calorie review</h3>
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
                ? `Accepted on ${review.weekEndDate} (Target: ${review.proposedCalorieTarget} kcal)`
                : `Dismissed on ${review.weekEndDate} (Target kept at ${review.currentCalorieTarget} kcal)`}
            </span>
          </div>
        )}

        {/* Nutrition & Metabolic Summary Grid */}
        <div className="bg-[var(--color-surface-sunken)] rounded-2xl p-4 border border-[var(--color-border)] space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">Avg Logged Calorie Intake:</span>
            <span className="font-bold text-[var(--color-text)]">{review.avgCalorieIntake} kcal/day</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">Avg Protein Intake:</span>
            <span className="font-bold text-[var(--color-text)]">{review.avgProteinIntake} g/day</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">7-Day Weight Trend Delta:</span>
            <span className="font-bold text-[var(--color-accent)]">
              {review.weightDeltaKg > 0 ? `+${review.weightDeltaKg}` : review.weightDeltaKg} kg/week
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">Estimated Expenditure (TDEE):</span>
            <span className="font-bold text-[var(--color-text)]">{review.estimatedTdee} kcal/day</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">Data Confidence Level:</span>
            <span className="font-bold text-[var(--color-accent)]">
              {Math.round(review.confidenceScore * 100)}% High
            </span>
          </div>

          {/* Proposed Adjustment Highlight */}
          <div className="pt-2.5 border-t border-[var(--color-border)] flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
                Proposed New Target
              </span>
              <span className="text-xs text-[var(--color-text-subtle)]">
                Current: {review.currentCalorieTarget} kcal
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-[var(--color-accent)]">
                {review.proposedCalorieTarget} kcal
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-accent)] block">
                ({deltaFormatted} kcal/day)
              </span>
            </div>
          </div>
        </div>

        {/* Transparent Rationale Explanation */}
        <div className="space-y-1 text-xs text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)]">
          <div className="font-semibold text-[var(--color-text)] mb-0.5">Algorithm Rationale</div>
          <p>{review.reason}</p>
        </div>

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
              onClick={() => onAccept(review.id)}
              className="min-h-[44px] py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Accept Adjustment</span>
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
