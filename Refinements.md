# Kinetic — later refinement pass notes

Ideas that a later Google Antigravity / AI Studio pass could take on, in priority order.
The batch that shipped on 2026-11-02:
- Real AI meal estimation with Gemini 2.5 Flash + offline fallback (`AddFoodModal.tsx`, `aiFoodEstimation.ts`)
- AI routine draftsman with exercise library constraints (`ProgramBuilderModal.tsx`, `routineGenerator.ts`)
- Natural-language quick-log command bar on Today with undo support (`QuickLogBar.tsx`, `quickLogParser.ts`)
- Weekly narrative athletic coach insight with visual confidence meter (`WeeklyReviewModal.tsx`, `narrativeCoach.ts`)
- Interactive target calibration in weekly check-in (-/+ 25 kcal fine-tuning)
- Hydration instant undo toast on TodayView
- Token-based accessible SVG chart layer with crosshair tooltips (`TrendChart.tsx`, `ProgressView.tsx`)
- Automated AI model evaluation harness CI gate (`aiEvaluationHarness.test.ts`)
- Zero-cost architecture guaranteed ($0 tokens/subscriptions; local-first fallback)

## Next backlog candidates

## High impact — app fundamentals

6. **Adaptive nutrition engine hardening**
   - Crash-hit handling in the serving-count flow (decimal separators across locales,
     non-numeric and absurdly large inputs).
   - Programmatic tests for adaptive TDEE boundary conditions (very low/high intake).

7. **Chart layer**
   - The hand-rolled SVG charts (now theme-correct) should graduate to a small token-based
     chart layer: axis labels, grid lines, tooltips.
   - Accessibility: `role="img"` + `aria-label`, a text-table alternative, and legibility
     at 200% text zoom.

8. **Active workout durability**
   - `activeWorkout` already persists in local state; audit that a mid-workout reload
     restores cleanly (elapsed timer resumes from `startTime`, no phantom duplicates).
   - Rest timers are component state only: persist across reload/tab-background so a
     workout doesn't silently lose the rest countdown.
   - Keyboard-accessible skip / navigate exercises in the long set list.

9. **Hydration guardrail**
   - Confirm when a single action logs a large amount (e.g. >1500 ml), with undo instead
     of a silent add.

## Medium

10. **Program editor UX**
    - Move `ProgramBuilderModal` onto the editorial layout (k-card, k-section-title,
      token surfaces).
    - Drag/reorder of exercises and inline validation of empty routine names.
    - Show per-exercise rest-time defaults from the exercise library.

11. **Weekly review modal**
    - Explain the confidence score visually (bar) and say what makes it high/low.
    - Prefill "proposed target" clamped, with neutral copy describing what changed and why.

12. **Settings IA**
    - Per-section headings + descriptions so users can scan settings at a glance.
    - A single fixed "Save changes" bar while scrolling instead of duplicate save buttons.
    - In-app link to the feedback (bug/fix) tracker, clearly scoped to new bugs.

13. **Local-first data lifecycle**
    - Export/import full-state JSON with a schema version + migration notes; offer an
      automatic backup before destructive operations.

14. **Deferred with the Firebase effort**
    - hydrationLogs → per-date subdocuments (smaller writes, same import story).
    - App Check and request-validation before save. Resume only when cloud work returns.

## Low priority / nice to have

15. **Onboarding**
    - First-run tour pointing to Today plan, hydration, and weigh-in cards.
    - Empty-state illustrations for a brand-new profile with no logged data.

16. **Accessibility**
    - Every modal: portal container, focus trap, and focus return to the trigger.
    - High-contrast shadows/weights for key numeric text (weight, calories) at small sizes.

17. **Performance**
    - Lazy-load Train/Progress views behind dynamic imports to keep Today snappy on
      low-end phones.
    - Re-audit `motion`: barely used; drop it if the bundle size doesn't pay for itself.

18. **PWA quick actions**
    - Home-screen shortcuts: +250 ml water, weigh-in, start scheduled workout.
