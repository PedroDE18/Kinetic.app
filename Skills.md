# SKILLS.md — Agentic Skills Catalog & Operational Procedures

This document defines the specialized **Skills** available to autonomous AI agents working on the **Kinetic** platform. Each skill represents a reusable capability, standard operating procedure (SOP), and validation protocol.

---

## 1. Skill Index & Quick Reference

```
Skill Catalog:
├─ SKILL-01: Engine Mathematics & Metabolic Modeling
├─ SKILL-02: Gemini Free-Tier & Structured Schema Integration
├─ SKILL-03: Model Evaluation Harness & CI Gatekeeper
├─ SKILL-04: Token-Based Accessible SVG Charting
├─ SKILL-05: Local-First State Evolution & Migration
├─ SKILL-06: Wearable & Health Data Ingestion
├─ SKILL-07: Firebase Dual-Sync & Security Rules (Optional Cloud)
├─ SKILL-08: Atomic Commits & Instant Push Protocol
└─ SKILL-09: Non-Destructive Schema Evolution & Library Merge
```

---

## 2. Skill Specifications

### SKILL-01: Engine Mathematics & Metabolic Modeling
- **Domain**: `src/utils/engine.ts`
- **Purpose**: Calculate exponentially weighted moving average (EWMA) weight trends, adaptive energy expenditure (TDEE), clamped weekly target adjustments, and 1RM predictions.
- **Invariants**:
  1. *Trend Smoothing*: EWMA smoothing uses $\alpha = 0.1$ ($\approx 10\text{-day}$ time constant) to filter acute water weight fluctuations.
  2. *Energy Conservation Model*: Calculates energy balance via:
     $$\Delta\text{Energy} = \Delta\text{Weight (kg)} \times 7700\text{ kcal/kg}$$
     $$\text{TDEE} = \text{Average Daily Intake} - \left(\frac{\Delta\text{Energy}}{\text{Days Observed}}\right)$$
  3. *Physiological Bounds*: Estimated TDEE must clamp strictly within $[1300, 4500]\text{ kcal/day}$.
  4. *Target Dampening*: Weekly adjustment proposals clamp strictly within $[-200, +200]\text{ kcal/day}$ and round to the nearest $25\text{ kcal}$ for clean nutrition targets.
- **Verification Command**:
  ```bash
  npx tsx --test src/utils/engine.test.ts src/utils/tdeeHardening.test.ts
  ```

---

### SKILL-02: Gemini Free-Tier & Structured Schema Integration
- **Domain**: `src/services/aiFoodEstimation.ts`, `src/services/routineGenerator.ts`, `src/services/narrativeCoach.ts`
- **Purpose**: Call Google Gemini models for structured data extraction while guaranteeing $0 cost.
- **Protocol**:
  1. Always import from `@google/genai`:
     ```typescript
     import { GoogleGenAI, Type } from '@google/genai';
     ```
  2. Model Selection: Use `gemini-2.5-flash` with `responseMimeType: 'application/json'` and a strictly typed `responseSchema`.
  3. API Key Resolution: Check user settings override first (`profile.geminiApiKey`), then `import.meta.env.VITE_GEMINI_API_KEY`.
  4. Mandatory Offline Fallback: If no key exists or if network/quota fails, catch error immediately and return deterministic offline heuristic parsing.
  5. Reading Model Output: In `@google/genai`, `response.text` is a getter property (do NOT call `response.text()`).
- **Verification Command**:
  ```bash
  npx tsx --test src/services/aiFoodEstimation.test.ts src/services/routineGenerator.test.ts
  ```

---

### SKILL-03: Model Evaluation Harness & CI Gatekeeper
- **Domain**: `src/services/aiEvaluationHarness.test.ts`
- **Purpose**: Prevent prompt drift, hallucination, or numerical corruption in AI parsers across agentic coding sessions.
- **Protocol**:
  1. *Golden Dataset Maintenance*: Maintain a diverse set of real-world inputs (single foods, complex meals, international metrics, adversarial text).
  2. *Physiological Sanity Assertions*:
     $$\left|\text{Calories} - (4\cdot\text{Protein} + 4\cdot\text{Carbs} + 9\cdot\text{Fat})\right| \le \max(30, \text{Calories} \times 0.35)$$
  3. *Zero-Crash Invariant*: Adversarial inputs (`""`, `"   "`, `"12345"`, `"!@#$"`) must never throw exceptions or return `NaN`.
- **Verification Command**:
  ```bash
  npx tsx --test src/services/aiEvaluationHarness.test.ts
  ```

---

### SKILL-04: Token-Based Accessible SVG Charting
- **Domain**: `src/components/common/TrendChart.tsx`
- **Purpose**: Render responsive, theme-aware vector charts without third-party chart bundle bloat.
- **Protocol**:
  1. *Color Presentation*: Presentation attributes in inline SVG do not reliably resolve CSS variables across all browsers. Always use inline style objects or SVG definitions:
     ```tsx
     <polyline style={{ stroke: 'var(--color-accent)' }} />
     ```
  2. *Accessibility Requirements*:
     - Root `<svg>` must declare `role="img"` and a descriptive `aria-label`.
     - Include a hidden screen-reader table (`<div className="sr-only"><table>...</table></div>`) for accessibility scanners and assistive tech.
  3. *Touch Affordance*: Data points must render an invisible `<circle r="14" fill="transparent" />` hit target so mobile users can easily trigger tooltips.
- **Verification Command**:
  ```bash
  npm run lint && npm run build
  ```

---

### SKILL-05: Local-First State Evolution & Migration
- **Domain**: `src/context/FitnessContext.tsx`
- **Purpose**: Evolve the local-first application schema stored under `localStorage: kinetic_fitness_app_v3` without data loss.
- **Protocol**:
  1. *Non-Destructive Initialization*: When adding a new field to `FitnessState`, always supply a sensible fallback in `loadInitialFitnessState`:
     ```typescript
     weeklySchedule: parsed.weeklySchedule || defaultWeeklySchedule,
     geminiApiKey: parsed.profile.geminiApiKey || '',
     ```
  2. *Session Sanitization*: Always pass active workout sessions through `sanitizeLoadedActiveWorkout` to clear stale rest timers or corrupt exercise rows.
  3. *Full JSON Export/Import*: Preserve backward compatibility in `exportAllJson` and `importAllJson` to guarantee athlete data portability.
- **Verification Command**:
  ```bash
  npx tsx --test src/utils/workoutSession.test.ts
  ```

---

### SKILL-06: Wearable & Health Data Ingestion
- **Domain**: `src/services/healthSync.ts`
- **Purpose**: Ingest external wearable data from Apple Health XML, Garmin TCX, generic CSV, or iOS Shortcuts.
- **Protocol**:
  1. *DOMParser / Regex Parsing*: Parse XML documents using standard browser APIs or pure string matchers in headless Node test environments.
  2. *Duplicate Prevention*: Deduplicate imported weigh-in dates and workouts against existing records.
  3. *URL Parameter Shortcuts*: Listen for `?health_sync=` base64/JSON payloads on app mount and trigger a confirmation toast.
- **Verification Command**:
  ```bash
  npx tsx --test src/services/healthSync.test.ts
  ```

---

### SKILL-07: Firebase Dual-Sync & Security Rules (Optional Cloud)
- **Domain**: `src/services/firebase.ts`, `firestore.rules`, `src/context/AuthContext.tsx`
- **Purpose**: Maintain optional cloud backup without degrading the local-first speed.
- **Protocol**:
  1. *L1 Cache First*: Read and write synchronously to `localStorage` first. Never block user interaction on a network round-trip.
  2. *Background Replication*: If the user is authenticated, debounced asynchronous sync saves the state to `users/{uid}/fitnessData/state`.
  3. *Strict Owner Rules*: `firestore.rules` enforces `request.auth.uid == userId` and limits payload size to $\le 800\text{ KB}$.
  4. *Rule Verification*: Always audit security rules against the checklist in `.agents/skills/firebase-security-rules-auditor/` before deployment.
- **Verification Command**:
  ```bash
  npm run lint
  ```

---

### SKILL-08: Atomic Commits & Instant Push Protocol
- **Domain**: Git workflow, CI verification, project management
- **Purpose**: Maintain an audit trail of granular, high-confidence commits and push each to remote immediately.
- **Protocol**:
  1. *Single Concern Principle*: Each commit addresses one self-contained task or architectural step.
  2. *Mandatory Pre-Commit Verification Gate*:
     ```bash
     npx tsx --test $(find src -name '*.test.ts') && npm run lint && npm run build
     ```
  3. *Selective Staging*: Stage explicitly via `git add <files>`.
  4. *Semantic Commit Message*: Format as `feat(...)`, `fix(...)`, `docs(...)`, `test(...)`, or `refactor(...)`.
  5. *Immediate Remote Push*: Run `git push origin <branch>` immediately after commit. Never accumulate unpushed local commits.

---

### SKILL-09: Non-Destructive Schema Evolution & Library Merge
- **Domain**: `src/context/FitnessContext.tsx`, `src/utils/mockData.ts`
- **Purpose**: Guarantee user data permanence across app releases and seamlessly merge new library additions into existing stores.
- **Protocol**:
  1. *Never Overwrite User Customizations*: Custom exercises, logged foods, recipes, habits, and reflections must never be deleted or replaced.
  2. *Intelligent Merge on Boot*: When new system default foods or exercises are deployed, match existing items by `id` or normalized `name`. If absent, append new defaults to the user's library without altering user-created items.
  3. *Storage Key Migration*: On first load with a newer storage key, inspect older keys (e.g. `kinetic_fitness_app_v3` -> `eunoia_os_v1`) and migrate all records transparently.
  4. *Safety Invariant*: In unit tests, verify that existing user weights and food logs round-trip without degradation.
