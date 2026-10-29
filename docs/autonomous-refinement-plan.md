# Kinetic — Autonomous Refinement Plan (2026-10-29)

Working session plan for polish/interaction work built on the local-first redesign (`4791a8c`).
Base constraints honored throughout: no push, no deploy, no Firebase/config/rule changes,
user's uncommitted Firebase WIP preserved and never staged.

## Baseline (verified before this plan)
- `main` @ `4791a8c` "refactor: finalize local-first Kinetic redesign" (local-first, no auth/cloud deps).
- Lint ✓ · Vite build ✓ · tests 15/15 ✓ · runtime smoke-tested earlier (app boots local-only,
  all four tabs render, hydration mutation persists to `kinetic_fitness_app_v3` only).

## Priority order

### P1 — Dark theme redesign (design system)
Problem: current dark scale (#161413/#211D1A/#2C2622) is a narrow warm-brown ramp; surfaces are
hard to tell apart; accent appears everywhere; on-accent label contrast fails (white on #E07A5F ≈ 2.9:1).
Direction: **"graphite ember"** — wider, calmer warm-neutral elevation scale with clear steps,
desaturated status colors, restrained accent, and a real on-accent text token.
- New dark tokens (index.css `:root` defaults):
  - bg `#141311`, surface `#1C1A18`, raised `#262320`, sunken `#0D0C0B`, bg-elevated `#201D1A`
  - border `#302C28` / subtle `#242220`
  - text `#F4F1EA`, muted `#ABA39A`, subtle `#7D756B`
  - accent `#E8815E`, hover `#F29A77` (lighter on hover in dark), soft 16% alpha
  - on-accent `#201009` (≈6:1 on accent), success `#8FC3A4`, warning `#E9B45C`, danger `#E77B7B`, info `#8FB8D8`
- Light theme: unchanged base + new `--color-on-accent: #FFFFFF` mapping; light accent stays `#C85A32`.
- Replace `text-white`/`text-zinc-950` labels sitting on accent backgrounds with `text-[var(--color-on-accent)]`.
- Convert SVG chart color *attributes* from `var()` strings to inline `style` (presentation
  attributes don't reliably resolve `var()`), so charts truly track the theme.
- QA both themes across Today/Food/Train/Progress/Settings + modals.

### P2 — Interaction design (high-value, non-gratuitous)
1. **Workout history rows → details**: tap a completed session to open the existing
   `WorkoutSummaryModal` (currently rendered only post-workout). Adds chevron affordance.
2. **Template cards → expandable details**: card tap expands the full exercise plan
   (_sets × reps per exercise) inline; collapsed state stays compact. `aria-expanded` set.
3. **Food diary rows → detail sheet**: tapping a logged item opens a bottom sheet with
   nutrition breakdown (per logged serving and per serving), the meal/time context, and actions
   (edit serving, duplicate, remove, favorite if the library item exists). Row itself slims to
   name + kcal + chevron (the three floating icon buttons move into the sheet).
4. **Dismissal rules**: detail/read-only modals close on backdrop tap; data-entry and
   destructive dialogs keep explicit buttons only.

### P3 — Workout card hierarchy
- Template cards currently have **no padding** and inline every muscle + every exercise → cramped.
  Fix: `p-4`; show top-3 muscle chips + "+N"; collapsed preview lists exercises as a compact text
  line ("Bench Press, OHP, Incline DB Press +2"); full list only when expanded.
- History rows keep name/date/volume and gain the tap affordance from P2.
- Truncate long routine names in ProgressView summary cards.

### P4 — Favorite food management
- Toggle hearts **directly on rows** in AddFoodModal (currently only inside the detail view →
  undiscoverable), with immediate fill-state feedback; stop propagation from row open.
- Keep the existing single source of truth: `FoodItem.isFavorite` + `toggleFoodFavorite(id)`
  (id-keyed ⇒ no duplicates) in `state.foodLibrary`, persisted via the same localStorage
  effect as the rest of state (verified pattern).
- Favorites chip already exists in the category rail; add a proper empty state for it.
- Surface favorite toggle in the new food detail sheet (by `foodId` match).
- No type changes required (`isFavorite`, `foodId` already in types).

### P5 — Refinements.md quick wins (within window)
- (1) "Estimate" badge + wording on the TDEE card (already described as calculated).
- (4) Per-exercise "n/m sets" progress chip in the active workout.
- (5) 5-day hydration mini bar on Today.
- Skip (documented): chart library rewrite, ProgramBuilder re-schooling, hydrationLogs data-model
  migration, focus-trap portal, App Check (blocked: Firebase constraint), view lazy-loading.

## Commit plan (feature branch → `main`, staged granularly)
1. `docs: add autonomous refinement plan`
2. `feat: redesign dark theme with graphite-ember palette and on-accent contrast`
3. `feat: workout history details and expandable routine cards`
4. `feat: food entry detail sheet with actions`
5. `feat: favorite food management on rows and sheets`
6. `feat: TDEE estimate badge, per-exercise set progress, hydration mini-bar` (+Refinements.md notes)

## Explicitly out of scope / preserved
- Firebase WIP: `.gitignore`, `firebase.json`, `firestore.rules`, `src/services/firebase.ts`,
  `src/types.ts`, `src/components/auth/`, `src/context/AuthContext.tsx`, `.agents/`,
  `skills-lock.json`, `firebase-applet-config.example.json` — untouched, never staged.
- No push/deploy; no new dependencies.
