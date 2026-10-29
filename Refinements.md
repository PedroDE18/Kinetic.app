# Kinetic — later refinement pass notes

Ideas that a later Google Antigravity / AI Studio pass could take on, in priority order.
The prior batch that shipped on 2026-10-29 (TDEE estimate badge, per-exercise set-progress
chip, 5-day hydration bar — plus the dark "graphite ember" theme, workout/food detail
sheets, and favorite-food management from that same session) has been removed from this
list. Items 1–5 lead with what Antigravity + the Gemini/AI Suite do best: agentic
implementation, structured output, and evals. Note: `@google/genai` is already a
dependency, so the AI items need no install step.

## High impact — AI Suite / Gemini-first

1. **Real AI meal estimation (replace the mock)**
   - The itemized "AI estimation" in `src/components/food/AddFoodModal.tsx` is currently a
     deterministic script (`handleSimulateAiEstimation`). Replace it with a real Gemini
     call via `@google/genai`: meal description text (stretch goal: a meal photo) →
     structured `FoodItem[]` using a JSON response schema.
   - Keep the human in the loop: parsed rows fill the existing editable review rows and the
     user confirms before `addLoggedFood`. Nothing is stored or synced cloud-side
     (local-first constraint).
   - Offline / missing-key fallback: keep the current parser behind the same UI contract,
     and label which path produced the result ("on-device estimate" vs "model estimate").

2. **AI routine authoring with human approval**
   - Draft a complete `WorkoutTemplate` in `ProgramBuilderModal` from a short brief
     (goal, days/week, equipment, session length, split preference).
   - Constraints the agent must honor: reference existing exercise-library ids only, balance
     push/pull/legs volume, fill default sets × reps and rest times.
   - Delivery is an editable draft inside the builder — never auto-saved without review.

3. **Natural-language quick-log command bar**
   - One input on Today: "chugged a liter and ran 5k in 27:12". A structured-output route
     picks the action (water / meal / cardio / weigh-in) and pre-fills the existing forms;
     the user confirms before anything logs.
   - Every route must reuse existing local actions (`addWater`, `addLoggedFood`, cardio
     logger) and pair with an undo interaction.

4. **Weekly narrative insight**
   - Generate a 3–4 sentence plain-language weekly story (volume trend, adherence,
     hydration, nutrition pacing) plus one targeted suggestion, computed from local
     aggregates only. Deterministic template fallback when offline or out of budget.

5. **Model eval harness as a CI gate**
   - Golden set: meal phrases, routine briefs, adversarial inputs (empty, numeric-only,
     pt-BR decimal separators). Assert the parsed food/volume shapes.
   - Run the mock path in PR checks and the real model nightly; block merges on shape
     regressions or prompt drift. This is the piece agents maintain best over time.

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
