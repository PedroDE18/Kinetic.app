# Kinetic — later refinement pass notes

Ideas that a later Google AI Studio / Antigravity pass could take on, in priority order.

## High impact

1. **Adaptive nutrition engine polish**
   - Improve crash-hit handling in food logging (serving count / favorites flow).
   - Add programmatic tests for adaptive TDEE boundary conditions (very low/high intake).
   - Show a small inline "estimated" badge on the TDEE card so users know it's a model output, not measured.

2. **Program editor UX**
   - Move ProgramBuilderModal to the same editorial layout (k-card, k-section-title, token surfaces).
   - Add drag/rm reorder of exercises and inline validation of empty routine names.
   - Show per-exercise rest time defaults from the exercise library.

3. **Charts**
   - Current volume/weight charts are hand-rolled SVG. Replace with a small chart layer built on tokens (axis labels, grid lines, tooltips) or a tiny charting dep.
   - Ensure axis labels are localized, have accessible `role="img"` + `aria-label`, and read correctly at 200% text zoom.

4. **Active workout experience**
   - Keep a per-exercise progress indicator (e.g. "3/4 sets done").
   - Persist active workout elapsed time across page reloads using the existing Firebase sync (already partly saved).
   - Add keyboard-accessible skip-to-next-exercise in the long set list.

5. **Hydration**
   - Show a small 5-day hydration bar on the Today view so weekly progress is visible without leaving the tab.
   - Add warnings when a huge amount is logged in one tap (e.g. >1500 ml) to avoid fat-finger errors.

## Medium

6. **Weekly review modal**
   - Explain the confidence score visually (bar) and say what makes it high/low.
   - Prefill "proposed target" clamped with a neutral tone describing what changed and why.

7. **Settings**
   - Add per-section headings + descriptions so users can scan settings at a glance.
   - Add a primary "Save changes" bar that stays fixed while scrolling to avoid duplicate save buttons.
   - Add an in-app link to the Feedback (bug/fix) tracker but clearly mark new bugs, not Mits' fixes.

8. **Data model**
   - Move hydrationLogs to per-date subdocuments instead of one JSON payload (reduces write size, keeps import/import easy).
   - Add App Check and request-account-before-save validation code paths.

## Low priority / nice to have

9. **Onboarding**
   - First-run tour pointing to Today plan, hydration, and weigh-in cards.
   - Empty-state illustrations for a brand-new user with no logged data.

10. **Accessibility**
   - Ensure every modal traps focus with a portal container and returns focus to the trigger.
   - Add high-contrast shadows for key numeric text (weight, calories) at small sizes.

11. **Performance**
   - Lazy-load Train/Progress views behind dynamic imports to keep Today snappy on low-end phones.
   - Consider removing the `motion` dep if unnecessary after the Audit (currently barely used).
