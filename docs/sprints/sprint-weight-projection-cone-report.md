# Sprint Report — Weight Trend 12-Week Projection Cone & Target Arrival Forecaster (MacroFactor Parity)

> **Sprint ID:** `sprint-20261112-weight-projection-cone`  
> **Branch:** `autonomous/sprint-weight-projection-cone`  
> **Topic Source:** `Friction-And-Competitive-Analysis.md` (Level 3 / Section 3.1 #4)  
> **Model:** Gemini 3.8 Flash (High Reasoning Effort)  
> **Governing Invariants:** $0 Cost, Local-First, Zero Regression, Preserve Firebase WIP  

---

## 1. Executive Summary & Problems Solved

Athletes engaging in structured physique and performance phases (e.g. fat loss cutting or lean mass gaining) previously had historical Exponentially Weighted Moving Average (EWMA) charts in Eunoia, but **zero forward-looking predictive visibility**.

Without forward projections:
1. Athletes could not see where their current caloric deficit or surplus would put their weight in 4, 8, or 12 weeks.
2. They could not forecast their estimated goal weight arrival date or track whether their current weekly pace was on schedule.
3. Linear extrapolation misled athletes by ignoring **metabolic adaptation** (adaptive thermogenesis and non-exercise activity thermogenesis decline) and real-world variance (fluid shifts, glycogen variance, adherence drift).

### The Solution:
We implemented a deterministic, client-side, $0-cost **12-Week Forward Weight Projection Cone Engine and Target Arrival Forecaster**:
- **Thermodynamic Mass Balance**: Models body tissue delta where $1\text{ kg tissue} \approx 7700\text{ kcal}$.
- **Metabolic Adaptation Attenuation**: Incorporates non-linear metabolic slowing ($\approx 1.5\%$ compound attenuation across 12 weeks).
- **Expanding Brownian Confidence Cone**: Employs an uncertainty envelope $\sigma(w) = \pm (0.25\sqrt{w} + 0.08|\text{rate}|w)$ kg, yielding realistic $p_{10}$ conservative and $p_{90}$ aggressive bounds.
- **Goal Arrival Forecaster**: Dynamically computes projected calendar arrival date (`YYYY-MM-DD`), weeks to goal, days to goal, and goal direction status.
- **Pure SVG Visualization (`WeightProjectionConeChart.tsx`)**: High-contrast, responsive SVG rendering shaded confidence polygon (`url(#coneGradient)`), dashed bounds, solid median trajectory, goal reference threshold, and interactive touch/hover milestone markers.
- **Inline Target Weight Editor (`WeightProjectionCard.tsx`)**: Allows athletes to quickly update their target weight inline in kg or lbs with instant persistence to `localStorage: eunoia_os_v1`.

---

## 2. Mathematical Specification

1. **Weekly Rate of Change**:
   $$\Delta W_0 = \begin{cases} 
   \text{profile.targetRateKgPerWeek} & \text{if set and } |\text{rate}| > 0.01 \\
   \frac{7 \times \Delta E}{7700} = \frac{\text{targetCalories} - \text{TDEE}}{1100} & \text{otherwise}
   \end{cases}$$
   Clamped to $[-1.5, +1.5]\text{ kg/week}$ for biological safety.

2. **Metabolic Adaptation Attenuation**:
   $$\text{attenuation}(w) = 1 - 0.015 \times \frac{w}{12}$$
   $$\Delta W_{\text{cum}}(w) = \Delta W_0 \times w \times \text{attenuation}(w)$$
   $$W_{\text{median}}(w) = W_0 + \Delta W_{\text{cum}}(w)$$

3. **Brownian Confidence Envelope**:
   $$\sigma(w) = \min\left(4.0, 0.25\sqrt{w} + 0.08|\Delta W_0|w\right)$$
   For Fat Loss ($\Delta W_0 < 0$):
   $$W_{\text{conservative}}(w) = W_{\text{median}}(w) + \sigma(w)$$
   $$W_{\text{aggressive}}(w) = W_{\text{median}}(w) - \sigma(w)$$
   For Lean Bulk ($\Delta W_0 > 0$):
   $$W_{\text{conservative}}(w) = W_{\text{median}}(w) - \sigma(w)$$
   $$W_{\text{aggressive}}(w) = W_{\text{median}}(w) + \sigma(w)$$

4. **Target Arrival Date**:
   $$D_{\text{exact}} = \text{clamp}\left(1, 730, \left\lfloor\frac{|W_{\text{target}} - W_0|}{|\Delta W_0| / 7}\right\rfloor\right)$$
   $$\text{ArrivalDate} = \text{Date}_0 + D_{\text{exact}} \times 86400000$$

---

## 3. Verification Gate Results

All gates passed with zero errors:

| Verification Stage | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Unit Test Suite** | `npx tsx --test $(find src -name '*.test.ts')` | **106 / 106 Passed** | Added comprehensive unit tests in `engine.test.ts` verifying fat loss, muscle gain, boundary clamping, and corrupt inputs. |
| **Typecheck** | `npm run lint` (`tsc --noEmit`) | **0 Errors** | Strict TypeScript adherence with zero any-casts. |
| **Production Build** | `npm run build` (`vite build`) | **Success (1.71s)** | All chunks generated cleanly without errors. |
| **Firebase WIP Integrity** | `git status` check | **100% Preserved** | Zero uncommitted Firebase WIP files staged or altered. |

---

## 4. Naive AI Beta Tester Simulation (Black-Box QA)

* **Persona 1: Clara (Fat Loss Athlete)**:
  - *Context*: Trend weight 78.0 kg, Target weight 72.0 kg, Caloric deficit: $-500\text{ kcal/day}$ ($-0.45\text{ kg/week}$).
  - *Observation*: Projection cone models 12-week trajectory reaching $72.63\text{ kg}$ median by week 12 (aggressive $71.33\text{ kg}$, conservative $73.93\text{ kg}$). Target arrival date is accurately calculated as `2027-02-12` (92 days, 13.1 weeks).
  - *Result*: **PASS**.

* **Persona 2: Lucas (Lean Muscle Bulk Athlete)**:
  - *Context*: Trend weight 70.0 kg, Target weight 75.0 kg, Caloric surplus: $+300\text{ kcal/day}$ ($+0.27\text{ kg/week}$).
  - *Observation*: Monotonically progressive upward cone reaching $73.22\text{ kg}$ median at week 12. Target arrival date computed as `2027-03-20` (128 days, 18.3 weeks).
  - *Result*: **PASS**.

* **Persona 3: Imperial Unit System & Edge Cases**:
  - *Context*: 160.0 lbs target converted to kg, goal already reached ($0\text{ daysToGoal}$), and undefined target handling.
  - *Observation*: All conversions round-trip seamlessly; goal reached shows celebration badge with zero days remaining.
  - *Result*: **PASS**.

---

## 5. Modified & Created Files

- `src/types.ts`: Added `WeightProjectionPoint` and `WeightTrendProjection` interfaces.
- `src/utils/engine.ts`: Implemented `calculateWeightTrendProjection` with resilient date and number normalization.
- `src/utils/engine.test.ts`: Added unit test suite covering fat loss, muscle gain, maintenance, goal arrival ETA, and corrupt inputs.
- `src/components/progress/WeightProjectionConeChart.tsx`: Standalone pure SVG projection cone chart component.
- `src/components/progress/WeightProjectionCard.tsx`: Metric summary card, interactive SVG chart, and inline target editor.
- `src/components/progress/ProgressView.tsx`: Integrated `WeightProjectionCard` between historical weight trend and calorie trajectory.
- `docs/system-design-hld-lld.md`: Documented Section 3 schema updates and Section 4.2 HLD/LLD engine principles.
- `docs/friction-backlog.json`: Added `fric-014` item marked as resolved.
