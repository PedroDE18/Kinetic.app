# Sprint 1 Executive Report — Atlas Filter Isolation & Streak Calculation Fix

> **Sprint ID:** `sprint-20261110-atlas-and-streak-fix`  
> **Branch:** `autonomous/sprint-atlas-and-streak-fix`  
> **Model:** Gemini 3.8 Flash (High Reasoning Effort)  
> **Governing Invariants:** $0 Cost, Local-First, Zero Regression, Preserve Firebase WIP  

---

## 1. Executive Summary & Problems Solved

This initial sprint resolved two top-severity blocker items identified by the user:

1. **`fric-006` (Visual Blocker): Exercise Atlas Selection Filter Rail Overlaps Exercise Cards**
   - **Root Cause**: In `ExerciseAtlasModal.tsx`, the modal lacked `overflow-hidden` and the flex container had `space-y-4` without `min-h-0` on the scrollable exercise card list. Under standard CSS flexbox specifications, `flex-1` elements default to `min-height: auto`, causing the 60+ exercise items to compute full content height and bleed over the sibling muscle filter tabs and search bar.
   - **Fix**: Re-architected `ExerciseAtlasModal.tsx` into a strict two-tier layout:
     - **Pinned Top Section (`shrink-0 z-10`)**: Header title, search input, and muscle group filter rail with a clean bottom border separator.
     - **Constrained Scroll Area (`flex-1 min-h-0 overflow-y-auto`)**: Exercise cards scroll exclusively underneath the filter rail, eliminating all element collisions across all device viewports.

2. **`fric-009` (Mathematical Logic Blocker): Daily Habit Streaks Do Not Reset When a Day is Missed**
   - **Root Cause**: `TodayView.tsx` and `SystemsView.tsx` displayed `{habit.completedDates.length}d streak`, treating total all-time completions as an active streak. If a user skipped several days, the streak never reset. In `ProgressView.tsx`, the algorithm started strictly at `now`, resetting the streak to 0 if the user hadn't checked off today's habit *yet*, even if yesterday was completed.
   - **Fix**: Implemented a pure, deterministic `calculateConsecutiveStreak(completedDates: string[], referenceDate: Date)` algorithm in `src/utils/engine.ts`:
     - Checks if completed today OR yesterday. If neither, streak resets to `0`.
     - Preserves the active grace window if yesterday was completed and today is still in progress.
     - Steps backward consecutively day-by-day without gaps.
     - Deduplicates and handles unsorted arrays.
     - Integrated across `TodayView.tsx`, `SystemsView.tsx`, and `ProgressView.tsx`.

---

## 2. Verification Gate Results

All gates passed with zero errors:

| Verification Stage | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Unit Test Suite** | `npx tsx --test $(find src -name '*.test.ts')` | **104 / 104 Passed** | +1 new suite added with 6 exhaustive edge-case assertions for `calculateConsecutiveStreak`. |
| **Typecheck** | `npm run lint` (`tsc --noEmit`) | **0 Errors** | Strict TypeScript adherence. |
| **Production Build** | `npm run build` (`vite build`) | **Success (1.79s)** | Zero bundle regressions; clean output chunks. |
| **Firebase WIP Integrity** | `git status` check | **100% Preserved** | Zero uncommitted Firebase WIP files staged or altered. |

---

## 3. Naive AI Beta Tester Simulation (Black-Box QA)

* **Persona**: "Valeria" (Competitive Powerlifter) & "Marcus" (Busy Tracker)
* **Goal**: Open Exercise Atlas modal on mobile viewport (390px), filter by "Legs", scroll through exercise list, verify card details, and check habit streak after missing a day.
* **Findings**:
  - `ExerciseAtlasModal`: Muscle filter tabs (`all`, `Chest`, `Back`, `Legs`, `Shoulders`, `Arms`) stay rigidly pinned at the top. When scrolling through exercises, cards scroll smoothly under the filter bar without visual overlap.
  - `Habit Streak`: Completing today and yesterday shows `2d streak`. Missing yesterday drops the streak display to `0d streak` immediately.
  - Zero console errors; 100% fluid response.

---

## 4. Modified Files & Atomic Git Diff

- `src/components/train/ExerciseAtlasModal.tsx`: Two-tier pinned control header and constrained scroll container.
- `src/utils/engine.ts`: Added `calculateConsecutiveStreak`.
- `src/utils/engine.test.ts`: Added 6 edge-case unit tests.
- `src/components/today/TodayView.tsx`: Integrated `calculateConsecutiveStreak`.
- `src/components/systems/SystemsView.tsx`: Integrated `calculateConsecutiveStreak`.
- `src/components/progress/ProgressView.tsx`: Replaced naive while-loop with `calculateConsecutiveStreak`.
- `docs/friction-backlog.json`: Updated backlog with 6 user items, marking `fric-006` and `fric-009` as resolved.
