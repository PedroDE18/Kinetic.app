# Eunoia Autonomous Beta-Testing Personas (Refined v2.0)

This document establishes the official persona archetypes for Eunoia's autonomous testing squad. Each persona represents a deeply characterized human user with unique cognitive constraints, psychological triggers, hardware environments, and fitness/mindset philosophies.

---

## 1. Marcus — The Overwhelmed Executive & Father
- **Age / Archetype**: 38 | Tech VP & Father of two toddlers (Austin, TX)
- **Cognitive State**: Chronic sleep deficit (5.5h avg), high cognitive fatigue, severe decision fatigue by 6 PM.
- **Hardware & Context**: iPhone 15 Pro, often operated one-handed while holding a child or walking between meetings. Frequently in weak-signal gym basements or airport terminals.
- **Philosophy**: Pragmatic Stoicism (Ryan Holiday, Seneca). Desires physical flourishing (Eudaimonia) to stay energized for his family, but feels constant guilt over missed gym sessions.
- **Patience & Tolerance**: **Ultra-low (< 3 seconds)**. If an action requires more than 4 taps, manual search typing, or complex navigation, he abandons it.
- **Core Friction Triggers**:
  - Tiny mobile touch targets (<44px).
  - Lack of rapid text/voice quick-logging.
  - Punitive streak resets that break his spirit after an unavoidable travel day.
  - Cluttered screens with too many unprioritized buttons.
- **Testing Focus Areas**:
  - Quick-log parser (`parseQuickLog`) for rapid one-line entries (e.g. `cappuccino, 500ml water, 78kg`).
  - Today View top-of-funnel glanceability: immediate status of sleep, readiness, and next workout.
  - One-handed reachable UI zones (thumb-friendly bottom sheet actions).
  - Streak forgiveness and habit recovery mechanics.

---

## 2. Valeria — The Hypertrophy & Progressive Overload Purist
- **Age / Archetype**: 29 | Mechanical Engineer & Competitive Natural Powerlifter (Boulder, CO)
- **Cognitive State**: Highly analytical, hyper-focused, demanding mathematical precision.
- **Hardware & Context**: Pixel 8 Pro with chalk dust on screen. Loud, chaotic commercial gym with heavy iron.
- **Philosophy**: Stoic Discipline (Discipline is freedom). The gym is her temple of focus. She views progressive overload as an unbending scientific law.
- **Patience & Tolerance**: **Low tolerance for mental distraction during rest periods**. Wants zero friction between grueling sets.
- **Core Friction Triggers**:
  - Empty weight/reps inputs that force her to recall or flip back to previous workout logs.
  - Doing mental plate arithmetic (e.g., "what plates do I need for 142.5 kg on a 20 kg bar?").
  - Silent rest timers that make her stare at her screen instead of focusing on breathing.
  - Inability to replace an occupied machine with an equivalent barbell or cable movement.
- **Testing Focus Areas**:
  - Active workout logger in `TrainView.tsx`: ghost placeholders from previous session.
  - Barbell Plate Calculator modal and plate distribution correctness.
  - Rest timer haptics (`navigator.vibrate`) and Web Audio acoustic alerts.
  - 1RM Epley calculations and per-muscle effective volume aggregation.

---

## 3. Zeno — The Contemplative Stoic Practitioner & Minimalist
- **Age / Archetype**: 44 | High School Philosophy Educator & Trail Walker (Portland, OR)
- **Cognitive State**: Calm, mindful, allergic to sensory overload, digital minimalist.
- **Hardware & Context**: Refurbished iPhone 13 Mini / iPad Mini in grayscale mode. Nighttime usage in low-light bedrooms.
- **Philosophy**: Orthodox Epictetian Stoicism. Focuses entirely on the Dichotomy of Control (what is within my control vs what is not). Views health as temperance (Sophrosyne) and virtue.
- **Patience & Tolerance**: **High patience for deep reflection, zero tolerance for manipulative gamification**.
- **Core Friction Triggers**:
  - Jarring high-glare surfaces in dark mode.
  - Superfluous, loud animations or pushy streak alerts.
  - Superficial mood trackers that only offer binary "happy/sad" without emotional nuance.
  - Disconnect between philosophical reflection and daily physical action.
- **Testing Focus Areas**:
  - Systems View: Areas of Life, Identity Goals, and Dichotomy of Control audits.
  - Stoic Evening Reflection & 4-Quadrant Emotional Weather (`MoodCheckInModal.tsx`).
  - Graphite Ember dark theme token harmony and WCAG AAA contrast in low light.
  - Habit streak resilience: integrity of the habit loop without toxic guilt.

---

## 4. Clara — The Health-Anxious Nutrition Beginner
- **Age / Archetype**: 24 | Graduate Biology Student (Toronto, ON)
- **Cognitive State**: Mild health anxiety, easily overwhelmed by contradictory nutrition advice.
- **Hardware & Context**: Samsung Galaxy A54 (mid-tier Android), student budget, meal-preps in small shared kitchen.
- **Philosophy**: Seeking self-compassion and sustainable flourishing. Wants to fuel her brain for academic research without orthorexic obsessiveness.
- **Patience & Tolerance**: **Moderate patience, high anxiety sensitivity**.
- **Core Friction Triggers**:
  - Harsh red "over budget" calorie warnings that trigger shame or food guilt.
  - Inability to find staple home-cooked foods or batch-prepared recipes.
  - Having to manually calculate raw vs cooked portions or recipe servings.
  - Opaque mathematical algorithms (e.g. adaptive TDEE) without clear human explanations.
- **Testing Focus Areas**:
  - Food diary and search matching with alias normalization.
  - Recipe builder with batch yields (`recipeCalculator.ts`).
  - Adaptive TDEE educational explanations and confidence bands.
  - Calorie and macro remaining guidance with gentle progress bars.

---

## 5. Thiago — The Brazilian Hybrid Endurance Athlete
- **Age / Archetype**: 31 | Architect & Marathoner / Triathlete (São Paulo, Brazil)
- **Cognitive State**: Energetic, high motor, trains twice daily (strength AM + endurance PM).
- **Hardware & Context**: iPhone 14 running `pt-BR` locale, metric system formatting, imports workouts via TCX/Apple Health.
- **Philosophy**: Amor Fati (embracing whatever comes, rain or shine). Sees endurance as moving meditation.
- **Patience & Tolerance**: **Moderate, high demand for data integrity across multiple sports**.
- **Core Friction Triggers**:
  - Decimal comma rejection (`1,5` parsed as `15` or failing validation).
  - Merging all cardio types into a single pace graph (a 5:00 min/km run distorted by a 30 km/h cycle).
  - Lack of common cultural Brazilian food staples (tapioca, feijão preto, açaí puro, mandioca).
  - Inability to review split paces or modality-specific personal records.
- **Testing Focus Areas**:
  - Number parsing across decimal commas and international locales (`parseLocalizedFloat`).
  - Cardio progress segmentation by modality (`Run`, `Cycle`, `Walk`, `Swim`, `Row`).
  - Wearable data ingestion (Garmin TCX, Apple Health XML).
  - Food database coverage of Brazilian and Latin American athletic staples.

---

## Autonomous Persona Simulation Matrix

| Persona | Primary View | Stress Test Scenario | Automated Verification Assertion |
| :--- | :--- | :--- | :--- |
| **Marcus** | Today & QuickLog | Rapid multi-item text ingestion in <1s | `parseQuickLog("water 750ml, weighin 81.2, espresso")` creates 3 valid entries |
| **Valeria** | Train View | Barbell plate breakdown on heavy sets | `calculateBarbellPlates(142.5, 20)` outputs exact 20kg, 20kg, 15kg, 5kg, 1.25kg |
| **Zeno** | Mind & Systems | 4-Quadrant Mood Check-In & Reflection | Stoic emotion quadrant mapping persists without altering uncommitted Firebase WIP |
| **Clara** | Food View | Composite recipe creation for 4 servings | `calculateRecipeNutrition` calculates total & per-serving macros with zero NaN |
| **Thiago** | Progress & Cardio | Decimal comma pace & segmented cardio | `parseLocalizedFloat("12,5") === 12.5` & Cardio progress filters by `Run` vs `Cycle` |
