# SKILLS.md — Agentic Skills Catalog & Operational Procedures

This document defines the specialized **Skills** available to autonomous AI agents working on the **Eunoia** platform. Each skill represents a reusable capability, standard operating procedure (SOP), validation protocol, and maps directly to the **3-Tier Agentic Hierarchy** defined in `Agents.md`.

---

## 1. Skill Index & Agentic Hierarchy Mapping

Skills are strictly partitioned across the three agentic tiers to optimize token efficiency, separation of concerns, and system reliability:

```
┌─────────────────────────────────────────────────────────────────────────┐
│               TIER 1: SENIOR AGENT SKILLS (System Architect)            │
│  ├─ SKILL-01: High-Level Design (HLD) & Monolith Governance             │
│  ├─ SKILL-02: Non-Destructive Schema Evolution & Library Merge          │
│  ├─ SKILL-03: Zero-Cost Architecture & Token Budget Stewardship         │
│  └─ SKILL-04: Dual-Store Invariant & Firebase Free-Tier Sync            │
├─────────────────────────────────────────────────────────────────────────┤
│            TIER 2: MID-SENIOR AGENT SKILLS (Solution Architect)         │
│  ├─ SKILL-05: Low-Level Design (LLD) & Technical Approach Trade-offs    │
│  ├─ SKILL-06: Engine Mathematics & Metabolic Modeling                   │
│  ├─ SKILL-07: Gemini Free-Tier & Structured Schema Integration          │
│  ├─ SKILL-08: Model Evaluation Harness & CI Gatekeeper                  │
│  └─ SKILL-09: Wearable & External Data Ingestion                        │
├─────────────────────────────────────────────────────────────────────────┤
│              TIER 3: JUNIOR AGENT SKILLS (Feature Implementer)          │
│  ├─ SKILL-10: Token-Based Accessible UI & Vector SVG Charting           │
│  ├─ SKILL-11: Pre-Commit Verification Gate & Unit Test Authoring        │
│  └─ SKILL-12: Atomic Commits & Instant Remote Push Protocol             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Senior Agent Skills (Tier 1: System Architecture & HLD)

### SKILL-01: High-Level Design (HLD) & Monolith Governance
- **Role Tier**: Senior Agent
- **Domain**: `docs/system-design-hld-lld.md`, `Agents.md`, Project Boundaries
- **Purpose**: Maintain monolithic cohesion for single-user token efficiency while defining modular domain boundaries and microservice split triggers.
- **Protocol**:
  1. *Token Conservation*: Reject distributed microservices for single-user workflows. Keep the modular monolith in one repo to prevent context window blowup from multi-service RPC boilerplate, Docker configs, and network mocks.
  2. *Domain Isolation*: Maintain the 5 explicit domain boundaries:
     - `Today`: Command Center & immediate state orchestration.
     - `Systems`: Habits, Friction Engineering, Life Organization.
     - `Body`: Nutrition, Training, Sleep, Metabolic Progress.
     - `Mind`: Stoic premeditation, evening audit, cognitive balance.
     - `Growth`: Intellectual works, Philia connections, secular wisdom.
  3. *Microservices Extraction Gate*: Enforce the 3 trigger criteria before splitting any service:
     - Heavy background asynchronous compute (e.g. isolated GPU worker for vision models).
     - Multi-user real-time concurrent collaboration.
     - Standalone OS daemon / native background telemetry.
- **Verification Command**:
  ```bash
  npm run build
  ```

---

### SKILL-02: Non-Destructive Schema Evolution & Library Merge
- **Role Tier**: Senior Agent
- **Domain**: `src/context/FitnessContext.tsx`, `src/utils/mockData.ts`, `src/types.ts`
- **Purpose**: Guarantee user data permanence across app releases and seamlessly merge new library additions into existing user stores.
- **Protocol**:
  1. *Never Overwrite User Customizations*: Custom exercises, logged foods, recipes, habits, and reflections must never be deleted or replaced.
  2. *Intelligent Merge on Boot*: When new system default foods or exercises are deployed, match existing items by `id` or normalized `name`. If absent, append new defaults to the user's library without altering user-created items:
     ```typescript
     export function mergeLibraries<T extends { id: string; name: string }>(
       existingItems: T[] = [],
       defaultItems: T[] = []
     ): T[]
     ```
  3. *Storage Key Migration*: On first load with a newer storage key, inspect older keys (e.g. `kinetic_fitness_app_v3`, `v2`, `v1` $\rightarrow$ `eunoia_os_v1`) and migrate all records transparently.
  4. *Safety Invariant*: In unit tests, verify that existing user weights and food logs round-trip without degradation.
- **Verification Command**:
  ```bash
  npx tsx --test src/context/dataPersistence.test.ts
  ```

---

### SKILL-03: Zero-Cost Architecture & Token Budget Stewardship
- **Role Tier**: Senior Agent
- **Domain**: System Design, Third-party dependencies, API integrations
- **Purpose**: Enforce the inviolable invariant: **$0 design, development, and upkeep cost forever**.
- **Protocol**:
  1. *No Paid APIs*: Never introduce services requiring a credit card or subscription (e.g., OpenAI, Anthropic paid tiers, paid database hosting).
  2. *Free Tier Only*: Use Google AI Studio Free Tier (`gemini-2.5-flash`), Firebase Spark Plan (free-tier Firestore/Auth), or offline deterministic heuristics.
  3. *Offline Fallback Mandatory*: If any external service is rate-limited, unreachable, or missing an API key, the system must seamlessly fall back to deterministic local calculation (e.g. offline NLP food parser, EWMA engine).
  4. *Token-Budget Stewardship*: Minimize LLM context footprint by keeping system prompts concise, leveraging deterministic TypeScript algorithms over LLM calls where math/logic suffices, and maintaining compact JSON structures.
- **Verification Command**:
  ```bash
  npx tsx --test src/services/aiFoodEstimation.test.ts
  ```

---

### SKILL-04: Dual-Store Invariant & Firebase Free-Tier Sync
- **Role Tier**: Senior Agent
- **Domain**: `src/services/firebase.ts`, `firestore.rules`, `src/context/AuthContext.tsx`
- **Purpose**: Maintain optional cloud backup without degrading the local-first speed, staying 100% within Firebase Spark Free Tier.
- **Protocol**:
  1. *L1 Cache First*: Read and write synchronously to `localStorage` first. Never block user interaction on a network round-trip.
  2. *Background Replication*: If the user is authenticated, debounced asynchronous sync saves the state to `users/{uid}/fitnessData/state`.
  3. *Strict Owner Rules*: `firestore.rules` enforces `request.auth.uid == userId` and limits payload size to $\le 800\text{ KB}$ (well under Firestore's 1 MB limit and $0 quota limits).
  4. *Free Tier Quota Defense*: Debounce writes to prevent burning the 20,000 writes/day free limit.
- **Verification Command**:
  ```bash
  npm run lint
  ```

---

## 3. Mid-Senior Agent Skills (Tier 2: Solution Architecture & LLD)

### SKILL-05: Low-Level Design (LLD) & Technical Approach Trade-offs
- **Role Tier**: Mid-Senior Agent
- **Domain**: Component Design, State Machine Design, Algorithmic Evaluation
- **Purpose**: Evaluate competing engineering approaches (complexity vs performance vs token cost) and author comprehensive Low-Level Designs before code implementation.
- **Protocol**:
  1. *Approach Comparison Matrix*: Compare at least 2 alternative implementations along time complexity, memory footprint, bundle size, and token overhead.
  2. *Statechart & Dataflow Modeling*: Define state machines with finite states, explicit events, and pure transitions.
  3. *Contract Definition*: Specify exact TypeScript types, props interfaces, and error boundary behaviors.
  4. *Deterministic Preference*: Choose deterministic algorithms over stochastic models whenever predictable outcomes are required.
- **Verification Command**:
  ```bash
  npm run lint && npm run build
  ```

---

### SKILL-06: Engine Mathematics & Metabolic Modeling
- **Role Tier**: Mid-Senior Agent
- **Domain**: `src/utils/engine.ts`
- **Purpose**: Calculate exponentially weighted moving average (EWMA) weight trends, adaptive energy expenditure (TDEE), clamped weekly target adjustments, and 1RM predictions.
- **Protocol**:
  1. *Trend Smoothing*: EWMA smoothing uses $\alpha = 0.1$ ($\approx 10\text{-day}$ time constant) to filter acute water weight fluctuations:
     $$\text{Trend}_t = \alpha \cdot \text{Weight}_t + (1 - \alpha) \cdot \text{Trend}_{t-1}$$
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

### SKILL-07: Gemini Free-Tier & Structured Schema Integration
- **Role Tier**: Mid-Senior Agent
- **Domain**: `src/services/aiFoodEstimation.ts`, `src/services/routineGenerator.ts`, `src/services/narrativeCoach.ts`
- **Purpose**: Call Google Gemini models for structured data extraction while guaranteeing $0 cost and zero hallucination drift.
- **Protocol**:
  1. *SDK Standard*: Import strictly from `@google/genai`:
     ```typescript
     import { GoogleGenAI, Type } from '@google/genai';
     ```
  2. *Model Selection*: Use `gemini-2.5-flash` with `responseMimeType: 'application/json'` and a strictly typed `responseSchema`.
  3. *API Key Resolution*: Check user settings override first (`profile.geminiApiKey`), then `import.meta.env.VITE_GEMINI_API_KEY`.
  4. *Mandatory Offline Fallback*: If no key exists or if network/quota fails, catch error immediately and return deterministic offline heuristic parsing.
  5. *Reading Model Output*: In `@google/genai`, `response.text` is a getter property (do NOT call `response.text()`).
- **Verification Command**:
  ```bash
  npx tsx --test src/services/aiFoodEstimation.test.ts src/services/routineGenerator.test.ts
  ```

---

### SKILL-08: Model Evaluation Harness & CI Gatekeeper
- **Role Tier**: Mid-Senior Agent
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

### SKILL-09: Wearable & External Data Ingestion
- **Role Tier**: Mid-Senior Agent
- **Domain**: `src/services/healthSync.ts`
- **Purpose**: Ingest external wearable data from Apple Health XML, Garmin TCX, generic CSV, or iOS Shortcuts.
- **Protocol**:
  1. *DOMParser / Pure String Parsing*: Parse XML documents using standard browser APIs or pure string matchers in headless Node test environments.
  2. *Duplicate Prevention*: Deduplicate imported weigh-in dates and workouts against existing records.
  3. *URL Parameter Shortcuts*: Listen for `?health_sync=` base64/JSON payloads on app mount and trigger a confirmation toast.
- **Verification Command**:
  ```bash
  npx tsx --test src/services/healthSync.test.ts
  ```

---

## 4. Junior Agent Skills (Tier 3: Feature Mechanics & Unit Delivery)

### SKILL-10: Token-Based Accessible UI & Vector SVG Charting
- **Role Tier**: Junior Agent
- **Domain**: `src/components/common/TrendChart.tsx`, UI components
- **Purpose**: Render responsive, theme-aware Swiss Editorial vector charts and components without third-party bundle bloat.
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

### SKILL-11: Pre-Commit Verification Gate & Unit Test Authoring
- **Role Tier**: Junior Agent
- **Domain**: `node:test`, TypeScript compiler, Vite build
- **Purpose**: Maintain 100% test passing rate and zero regression tolerance before any commit.
- **Protocol**:
  1. *The Three-Tier Verification Gate*: Every task must execute and pass:
     ```bash
     npx tsx --test $(find src -name '*.test.ts') && npm run lint && npm run build
     ```
  2. *Unit Test Coverage*:
     - Every newly added utility or state migration must have a co-located or corresponding `.test.ts` file.
     - Mock user inputs thoroughly, including international comma decimal separators (`1,5` vs `1.5`), negative numbers, and boundary conditions.
  3. *Zero-Warning Compilation*: Eliminate all TypeScript warnings or unresolved types (`any` is prohibited in domain entities).
- **Verification Command**:
  ```bash
  npx tsx --test $(find src -name '*.test.ts') && npm run lint && npm run build
  ```

---

### SKILL-12: Atomic Commits & Instant Remote Push Protocol
- **Role Tier**: Junior Agent
- **Domain**: Git workflow, CI verification, project management
- **Purpose**: Maintain an audit trail of granular, high-confidence commits and push each to remote immediately.
- **Protocol**:
  1. *Single Concern Principle*: Each commit addresses one self-contained task or architectural step.
  2. *Mandatory Pre-Commit Verification Gate*: Never commit without all tests passing and a clean build:
     ```bash
     npx tsx --test $(find src -name '*.test.ts') && npm run lint && npm run build
     ```
  3. *Explicit Staging*: Stage explicitly via `git add <files>`. Never use indiscriminate `git add .` without checking untracked files.
  4. *Semantic Commit Message*: Format as `feat(...)`, `fix(...)`, `docs(...)`, `test(...)`, or `refactor(...)`.
  5. *Immediate Remote Push*: Run `git push origin <branch>` immediately after commit. Never accumulate unpushed local commits.
- **Verification Command**:
  ```bash
  git status
  ```
