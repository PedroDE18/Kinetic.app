# AGENTS.md — Agentic Engineering Specification & Hierarchical Workflow

Welcome, Agent. This file is the operational manual, multi-tiered hierarchy contract, and system design governance for autonomous coding agents (e.g. Google Antigravity, Claude Code, Cursor Composer, Devin) operating on the **Eunoia** codebase.

---

## 1. Project Topology & Architecture Identity

**Eunoia** is a comprehensive personal operating system and human flourishing platform built with **React 19**, **TypeScript**, **Vite 8**, and **Tailwind CSS v4**. It integrates athletic health tracking (adaptive TDEE, resistance training, nutrition diary) with Stoic contemplative reflection, behavioral habits, and environmental friction engineering.

```mermaid
graph TD
    User([Athlete & Thinker]) <--> Views[React 19 Modular Monolith<br/>Today · Systems · Body · Mind · Growth]
    Views <--> Context[Unified Reactive Store<br/>FitnessContext State & Actions]
    Context <--> Storage[(localStorage: eunoia_os_v1<br/>Non-Destructive Local L1 Cache)]
    Context <--> Engine[Deterministic Engines ($0 Cost)<br/>EWMA · Adaptive TDEE · Epley · QuickLog NLP]
    Context <--> CloudWIP[Firebase Cloud Sync & Auth<br/>Optional $0 Spark Free Tier]
```

### 1.1 Source Code Directory Map
- `src/types.ts`: Central domain schema definitions (5 domains + athletic models).
- `src/context/FitnessContext.tsx`: Local-first unified reactive store and migration engine.
- `src/utils/engine.ts`: Mathematical algorithms (EWMA smoothing, adaptive TDEE, 1RM Epley, pace calculations).
- `src/utils/mockData.ts`: Comprehensive USDA-verified food library (80 items) and multi-equipment Exercise Atlas (60 items).
- `src/utils/eunoiaDefaults.ts`: Foundational secular habits, friction interventions, areas, goals, and reading items.
- `src/components/today/TodayView.tsx`: Command Center (deliberate intention, flourishing signals, priority tasks, habits checklist, quick-log bar).
- `src/components/systems/`: Behavioral systems (Habits, Friction Engineering Engine, Life Organization hierarchy).
- `src/components/body/`: Physical health (Nutrition diary, Training logger, Sleep & Recovery, Progress TDEE).
- `src/components/mind/`: Stoic reflection, morning premeditation, evening honest audit.
- `src/components/growth/`: Intellectual works, Epicurean philia relationships, Socratic secular advisor.

---

## 2. The 3-Tier Agentic Hierarchy

To optimize problem-solving, code quality, and **token-budget stewardship**, agents must operate within a clear 3-tier hierarchy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TIER 1: SENIOR AGENT (System Architect)              │
│  - Owns High-Level Design (HLD) & Architectural Decision Records (ADRs)  │
│  - Enforces Monolithic Cohesion & Token-Budget Stewardship              │
│  - Governs SQL vs NoSQL Paradigm & Storage Invariants                   │
│  - Strictly Enforces $0 Design, Development, and Upkeep Guarantee       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Issues HLD & Boundaries
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              TIER 2: MID-SENIOR AGENT (Solution Architect)              │
│  - Owns Low-Level Design (LLD) & Technical Problem-Solving Approaches    │
│  - Evaluates Algorithmic & Complexity Trade-Offs (Time/Space/Tokens)    │
│  - Designs Component Contracts, State Machine Statecharts, Props Types  │
│  - Formulates Evaluation Harnesses & Failure Recovery Playbooks         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Issues LLD & Contracts
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                TIER 3: JUNIOR AGENT (Feature Implementer)               │
│  - Implements Type-Safe React 19 / TypeScript Components & Reducers     │
│  - Binds UI strictly to Swiss Editorial Design Tokens                   │
│  - Authors Exhaustive Unit Tests (`node:test`, Golden Sets)             │
│  - Executes Pre-Commit Verification Gate (Test · Lint · Build)          │
│  - Executes Atomic Commits & Instant Remote Pushes                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Role Responsibilities & Scope
1. **Senior Agent (System Architecture & HLD)**:
   - Does **not** jump into writing ad-hoc UI code.
   - Evaluates the macro-architecture: domain boundaries, token economics, storage models, and cost boundaries.
   - Produces or updates the High-Level Design (HLD) in `docs/system-design-hld-lld.md`.
2. **Mid-Senior Agent (Approach Evaluation & LLD)**:
   - Analyzes competing approaches (e.g. EWMA vs rolling medians, client-side indexing vs SQLite WASM).
   - Writes Low-Level Design (LLD): defines data flow, exact TypeScript interfaces, edge-case handling, and error boundaries.
   - Ensures solutions minimize cognitive load and fit within compact token windows.
3. **Junior Agent (Feature Mechanics & Unit Delivery)**:
   - Takes the LLD specification and produces clean, idiomatic code without architectural drift.
   - Ensures 100% passing tests, zero TypeScript errors (`tsc --noEmit`), and clean production builds (`vite build`).
   - Immediately commits atomic logical diffs and pushes to `origin/main`.

---

## 3. High-Level Design (HLD) vs Low-Level Design (LLD) Standards

Every major enhancement or architectural modification must reference and update `docs/system-design-hld-lld.md`:

### 3.1 What Constitutes an HLD (Senior Scope)
- **Problem Context & Domain Boundary**: Which domain owns the state? How does it interact with other domains?
- **Monolith Cohesion vs Split Rationale**: Why this belongs in the monolith (or meets trigger criteria).
- **Storage Strategy**: Document vs relational schema, caching tiers, data migration contract.
- **Cost & Token Impact**: How the design preserves $0 cost and avoids token-heavy context overhead.

### 3.2 What Constitutes an LLD (Mid-Senior Scope)
- **Data Schemas & Type Contracts**: Exact TypeScript interfaces in `src/types.ts`.
- **Component Decomposition**: Parent/child hierarchy, controlled vs uncontrolled state, prop interfaces.
- **State Mutation Mechanics**: Reducer/context actions, immutability guarantees, optimistic updates.
- **Algorithms & Mathematical Formulas**: Strict equations, physiological clamps, edge case bounds.
- **Test Matrix**: Golden inputs, adversarial boundary tests, mock configurations.

---

## 4. System Design Strategy: Monolith vs Microservices

### 4.1 Monolithic Architecture Supremacy (Single-User Focus)
Following the Eudaimonia transformation, Eunoia is intentionally structured as a **Modular Monolith**:
1. **Single-User Scope**: Distributed microservices solve multi-team organizational scaling and multi-tenant resource partitioning. For a single-user personal OS, microservices introduce unneeded latency, failure modes, and serialization penalties.
2. **Token-Budget Stewardship**: Distributing features across microservices (multiple repositories, Docker containers, network contracts, API gateways) explodes context size, causing coding agents to hit token limits and hallucinate. The modular monolith enables the entire application AST to be reasoned about with maximum token economy.
3. **Local-First Reliability**: A monolithic web application boots in $<10\text{ms}$ entirely offline from `localStorage`, with zero network dependencies.

### 4.2 Microservices Migration Trigger Criteria
Do **NOT** extract or split any feature into an external service unless one of the following 3 strict triggers is satisfied:
1. **Heavy Isolated Compute**: On-device AI inference (e.g. computer vision food recognition or local Whisper voice models) that cannot run in a Web Worker without locking the browser UI or exceeding browser heap limits.
2. **Multi-User Real-Time Sync**: Expanding from a personal OS to multi-tenant collaborative teams requiring WebSockets or conflict-free replicated data types (CRDTs).
3. **Hardware / Daemon Integration**: Continuous background telemetry collection from wearable hardware that requires a native OS background daemon.

If none of these criteria are met, the code **must remain in the modular monolith**.

---

## 5. Database Architecture: SQL vs NoSQL Decision Framework

| Domain Need | Recommended Storage | Rationale | Cost |
| :--- | :--- | :--- | :--- |
| **Operational State (L1)** | **NoSQL (Document Store)**<br/>`localStorage: eunoia_os_v1` | Fast synchronous boot ($<5\text{ms}$), schema agility during agentic evolution, nested documents (recipes, reflections). | **$0** |
| **Cloud Replication (L2)** | **NoSQL (Firebase Firestore)** | Automatic delta sync, offline cache, generous Spark free tier (50k reads, 20k writes/day). | **$0** |
| **Complex Relational Analytics (L3)** | **SQL / In-Browser SQLite WASM**<br/>(Future Extension via OPFS) | Multi-table joins (Areas $\rightarrow$ Goals $\rightarrow$ Projects $\rightarrow$ Tasks, 12-week volume trends). Only deploy if record count exceeds $10{,}000$ or analytical querying lags. | **$0** |

---

## 6. Inviolable Operational Invariants

Any agent operating on this repository must strictly adhere to the following 8 core invariants:

### INVARIANT 1: Zero Cost Guarantee ($0 Forever)
- Never introduce features or API calls that require paid tokens, credit card billing, or paid subscriptions.
- AI must use Google AI Studio Free Tier (`gemini-2.5-flash`) with instant offline heuristic fallbacks.
- Infrastructure, databases, and toolchains must remain 100% free forever.

### INVARIANT 2: Local-First Supremacy
- Core functionality must operate with zero network access and no mandatory account sign-up.
- Primary state must cleanly serialize and restore from `localStorage: eunoia_os_v1`.

### INVARIANT 3: Preserve Firebase WIP
- The working directory contains uncommitted Firebase Auth & Firestore WIP files (`firebase.json`, `firestore.rules`, `src/services/firebase.ts`, `src/context/AuthContext.tsx`, `src/components/auth/`).
- Do NOT overwrite, discard, or stage these files in local-first commits unless explicitly commanded.

### INVARIANT 4: Human-in-the-Loop AI
- AI-generated content (parsed food items, routine prescriptions, quick-log actions) must NEVER commit silently to user state without explicit user review and confirmation in the UI. Output must populate editable preview forms.

### INVARIANT 5: Resilient Numerical & Locale Parsing
- All numeric inputs must handle international decimal formatting (e.g., Brazilian `1,5` vs English `1.5`) via `src/utils/parseNutrition.ts`. Guard against `NaN`, infinite, negative, or absurd values ($>5000\text{ kcal}$, $>350\text{ kg}$).

### INVARIANT 6: Zero Regression Policy
- No code change is complete without green tests, zero type errors, and a successful production build.
  - Test Suite: `npx tsx --test $(find src -name '*.test.ts')`
  - Typecheck: `npm run lint` (`tsc --noEmit`)
  - Production Build: `npm run build` (`vite build`)

### INVARIANT 7: Atomic Commits & Instant Remote Pushes
- Break work into distinct, self-contained atomic units.
- Every atomic commit MUST pass tests, typecheck, and build before committing.
- IMMEDIATELY push every commit to `origin/main` (`git push origin main`). Never accumulate unpushed local commits.
- Use semantic commit messages: `feat(domain): ...`, `fix(domain): ...`, `docs: ...`, `refactor(domain): ...`.

### INVARIANT 8: User Data Permanence & Non-Destructive Migrations
- Application updates must NEVER wipe, reset, or degrade existing user data in `localStorage` or cloud storage.
- When new default options (foods, exercises, routines) are added, the storage hydration logic MUST non-destructively merge the new system defaults into the user's existing library using `mergeLibraries`.
- Upgrades from legacy storage keys (`kinetic_fitness_app_v3` -> `eunoia_os_v1`) must automatically migrate all records on first boot without requiring manual user action or data loss.

---

## 7. The Agentic Execution Protocol

```
[1. HLD Alignment (Senior)] ──> [2. LLD Formulation (Mid-Senior)] ──> [3. Implementation (Junior)] ──> [4. Verification Gate] ──> [5. Atomic Commit & Push]
             │                                   │                                  │                            │                              │
     Verify Monolith &                   Evaluate Approaches,               Type-Safe React 19,          Tests (90/90 pass),            Granular Git commit,
     $0 Cost Invariant                   Schemas, Equations                 Design Tokens Bound          Lint (0 errors), Build OK      Instant push to main
```

1. **HLD Alignment (Senior)**: Verify that the task respects the modular monolith, $0 cost guarantee, and token limits.
2. **LLD Formulation (Mid-Senior)**: Define exact TypeScript schemas, component breakdown, algorithmic equations, and test specifications.
3. **Implementation (Junior)**: Author clean, modular React 19 / TypeScript code bound to design tokens.
4. **Verification Gate**:
   - `npx tsx --test $(find src -name '*.test.ts')`
   - `npm run lint` (`tsc --noEmit`)
   - `npm run build` (`vite build`)
5. **Commit & Push (Atomic & Instant)**:
   - `git add <files>`
   - `git commit -m "type(scope): description"`
   - `git push origin main`

---

## 8. Debugging & Error Recovery Playbook

| Symptom | Diagnostic Step | Remediating Action |
| :--- | :--- | :--- |
| **`TypeScript error: TS6234 get accessor`** | Check `@google/genai` response methods. | `response.text` is a getter property, not a function. Do not invoke as `response.text()`. |
| **`New default foods/exercises missing on reload`** | Check storage hydration logic. | Use `mergeLibraries(parsed.items, defaultItems)` to append new defaults without overwriting user data. |
| **`Weights/foods filter is not a function`** | Check mock helper arguments. | `buildInitialWeeklyReview(weights, loggedFoods, profile)` takes 3 arguments. |
| **Interactive command prompt hangs** | A command prompted for interactive input. | Cancel via `manage_task(Action='kill')` and run with non-interactive flags (e.g. `npx tsx --test`). |
| **Accidental git staging of Firebase WIP** | Check `git status`. | Use `git reset <file>` to unstage Firebase WIP files immediately before committing. |
