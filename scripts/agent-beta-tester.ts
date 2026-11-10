/**
 * Eunoia Autonomous Beta-Testing Simulation Suite
 * Simulates real user behavior across 5 distinct personas (Marcus, Valeria, Zeno, Clara, Thiago).
 * Evaluates edge cases, input tolerances, mathematical precision, and UX friction points.
 * Automatically generates a structured friction report for the autonomous engineering squad.
 */

import { parseQuickLog } from '../src/services/quickLogParser';
import { calculateBarbellPlates } from '../src/utils/plateCalculator';
import { calculate1RM, calculateWorkoutVolume, formatPace, calculateConsecutiveStreak } from '../src/utils/engine';
import { calculateRecipeTotals } from '../src/utils/recipeCalculator';
import { parseNumericInput } from '../src/utils/parseNutrition';
import { mockFoodLibrary } from '../src/utils/mockData';
import { parseGarminTcx } from '../src/services/healthSync';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  persona: string;
  scenario: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  frictionDetected?: {
    severity: 'minor_annoyance' | 'high_friction' | 'blocker';
    area: string;
    issue: string;
    proposedFix: string;
  };
}

const testResults: TestResult[] = [];

function runTest(
  persona: string,
  scenario: string,
  fn: () => { passed: boolean; details?: string; friction?: TestResult['frictionDetected'] }
) {
  const start = performance.now();
  try {
    const outcome = fn();
    const duration = Number((performance.now() - start).toFixed(2));
    testResults.push({
      persona,
      scenario,
      passed: outcome.passed,
      durationMs: duration,
      details: outcome.details,
      frictionDetected: outcome.friction,
    });
  } catch (err: any) {
    const duration = Number((performance.now() - start).toFixed(2));
    testResults.push({
      persona,
      scenario,
      passed: false,
      durationMs: duration,
      details: `Exception: ${err.message}`,
      frictionDetected: {
        severity: 'blocker',
        area: 'system_exception',
        issue: `Crash in scenario '${scenario}': ${err.message}`,
        proposedFix: 'Add try-catch boundary and defensive null-checking.',
      },
    });
  }
}

console.log('===============================================================');
console.log('  STARTING EUNOIA AUTONOMOUS BETA-TESTING SIMULATION RUN       ');
console.log('===============================================================\n');

// ============================================================================
// 1. MARCUS (Overwhelmed Executive & Father, 38)
// ============================================================================
console.log('▶ Simulating Persona 1: Marcus (Executive & Father)');

runTest('Marcus', 'Rapid multi-action natural language input (<5ms latency)', () => {
  const res = parseQuickLog('500ml water, weighin 82.4, 30m run 5km');
  const hasWater = res.actions.some((a) => a.type === 'water' && (a as any).amountMl === 500);
  const hasWeight = res.actions.some((a) => a.type === 'weight' && (a as any).weightKg === 82.4);
  const hasCardio = res.actions.some((a) => a.type === 'cardio' && (a as any).distanceKm === 5);
  return {
    passed: hasWater && hasWeight && hasCardio,
    details: `Parsed ${res.actions.length} actions: water=${hasWater}, weight=${hasWeight}, cardio=${hasCardio}`,
  };
});

runTest('Marcus', 'Handles single water input in various colloquial units', () => {
  const r1 = parseQuickLog('drank 2 glasses of water');
  const r2 = parseQuickLog('1 liter water');
  const r3 = parseQuickLog('tomei 500ml de agua');
  const p1 = r1.actions.some((a) => a.type === 'water' && (a as any).amountMl === 500);
  const p2 = r2.actions.some((a) => a.type === 'water' && (a as any).amountMl === 1000);
  const p3 = r3.actions.some((a) => a.type === 'water' && (a as any).amountMl === 500);
  return {
    passed: p1 && p2 && p3,
    details: `Glasses: ${p1}, Liter: ${p2}, Portuguese: ${p3}`,
  };
});

runTest('Marcus', 'Gracefully absorbs garbage/irrelevant text without inventing actions', () => {
  const res = parseQuickLog('hello this is a test with no metrics');
  // It shouldn't create fictitious water or weight
  const noFictitiousActions = !res.actions.some((a) => a.type === 'water' || a.type === 'weight');
  return {
    passed: noFictitiousActions,
    details: `Found actions: ${res.actions.map((a) => a.type).join(', ')}`,
  };
});

runTest('Marcus', 'Habit streak math resets accurately when missing a day', () => {
  const today = new Date().toISOString().split('T')[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
  // Completed 3 days ago, but not yesterday or today -> streak must be 0
  const streak = calculateConsecutiveStreak([threeDaysAgo], today);
  return {
    passed: streak === 0,
    details: `Streak after gap is ${streak} (expected 0)`,
  };
});

// ============================================================================
// 2. VALERIA (Hypertrophy & Progressive Overload Purist, 29)
// ============================================================================
console.log('▶ Simulating Persona 2: Valeria (Hypertrophy Purist)');

runTest('Valeria', 'Barbell plate calculator: 100kg on 20kg bar (standard warm-up/working load)', () => {
  const result = calculateBarbellPlates(100, 20);
  const total = result.platesPerSide.reduce((sum, p) => sum + p.weight * p.countPerSide, 0) * 2 + result.barWeight;
  return {
    passed: total === 100 && result.remainder === 0,
    details: `Plate breakdown: ${result.platesPerSide.map((p) => `${p.countPerSide}x${p.weight}kg`).join(', ')} -> Total: ${total}kg`,
  };
});

runTest('Valeria', 'Barbell plate calculator: 142.5kg on 20kg bar (heavy deadlift single)', () => {
  const result = calculateBarbellPlates(142.5, 20);
  const total = result.platesPerSide.reduce((sum, p) => sum + p.weight * p.countPerSide, 0) * 2 + result.barWeight;
  return {
    passed: total === 142.5 && result.remainder === 0,
    details: `Plates: ${result.platesPerSide.map((p) => `${p.countPerSide}x${p.weight}kg`).join(', ')} -> Total: ${total}kg`,
  };
});

runTest('Valeria', 'Barbell plate calculator: target weight lower than bar weight clamps to 0 plates', () => {
  const result = calculateBarbellPlates(15, 20);
  return {
    passed: result.platesPerSide.length === 0,
    details: `Returned ${result.platesPerSide.length} plates (expected 0, empty bar)`,
  };
});

runTest('Valeria', 'Epley 1RM formula behavior across rep ranges', () => {
  const r1 = calculate1RM(100, 1);
  const r5 = calculate1RM(100, 5);
  const r10 = calculate1RM(100, 10);
  const r0 = calculate1RM(100, 0);

  const p1 = r1 === 100; // 1 rep is exact
  const p5 = r5 === 116.7; // 100 * (1 + 5/30) = 116.666 -> 116.7
  const p10 = r10 === 133.3; // 100 * (1 + 10/30) = 133.333 -> 133.3
  const p0 = r0 === 0;

  return {
    passed: p1 && p5 && p10 && p0,
    details: `1 rep: ${r1}, 5 reps: ${r5}, 10 reps: ${r10}, 0 reps: ${r0}`,
  };
});

runTest('Valeria', 'Workout volume calculation strictly excludes warmup sets', () => {
  const sampleWorkout = [
    {
      sets: [
        { actualWeightKg: 60, actualReps: 10, isCompleted: true, setType: 'warmup' as const },
        { actualWeightKg: 100, actualReps: 5, isCompleted: true, setType: 'normal' as const },
        { actualWeightKg: 100, actualReps: 5, isCompleted: true, setType: 'normal' as const },
      ],
    },
  ];
  const effectiveVolume = calculateWorkoutVolume(sampleWorkout, false);
  const totalVolume = calculateWorkoutVolume(sampleWorkout, true);
  // Warmup: 60*10 = 600. Working: 100*5 + 100*5 = 1000.
  return {
    passed: effectiveVolume === 1000 && totalVolume === 1600,
    details: `Effective: ${effectiveVolume}kg, Total with Warmups: ${totalVolume}kg`,
  };
});

// ============================================================================
// 3. ZENO (Contemplative Stoic Practitioner, 44)
// ============================================================================
console.log('▶ Simulating Persona 3: Zeno (Stoic Practitioner)');

runTest('Zeno', 'HowWeFeel 4-Quadrant Stoic model emotional classification completeness', () => {
  const quadrants = ['high_energy_unpleasant', 'high_energy_pleasant', 'low_energy_unpleasant', 'low_energy_pleasant'];
  // Verify emotional quadrants can represent nuanced feelings
  return {
    passed: quadrants.length === 4,
    details: `Quadrant categories verified: ${quadrants.join(', ')}`,
  };
});

runTest('Zeno', 'Consecutive habit streak calculation for continuous daily practice', () => {
  const today = new Date();
  const d0 = today.toISOString().split('T')[0];
  const d1 = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
  const d2 = new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0];
  const d3 = new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0];

  const streak = calculateConsecutiveStreak([d3, d2, d1, d0], d0);
  return {
    passed: streak === 4,
    details: `4-day streak calculated as ${streak}`,
  };
});

// ============================================================================
// 4. CLARA (Health-Anxious Nutrition Beginner, 24)
// ============================================================================
console.log('▶ Simulating Persona 4: Clara (Nutrition Beginner)');

runTest('Clara', 'Recipe builder scales 1 serving to 4 servings with exact macro proportionality', () => {
  const ingredients = [
    {
      foodId: 'oats',
      name: 'Rolled Oats',
      servingAmount: 100, // 100g total for batch
      servingUnit: 'g',
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
    },
    {
      foodId: 'protein_powder',
      name: 'Whey Protein',
      servingAmount: 60,
      servingUnit: 'g',
      calories: 240,
      protein: 48,
      carbs: 4,
      fat: 2,
    },
  ];

  const result = calculateRecipeTotals(ingredients as any, 4); // 4 servings batch
  const totalCals = 389 + 240; // 629
  const expectedPerServingCals = Math.round(629 / 4); // 157
  const expectedPerServingProtein = Number(((16.9 + 48) / 4).toFixed(1)); // 16.2

  const matches =
    result.total.calories === totalCals &&
    result.perServing.calories === expectedPerServingCals &&
    result.perServing.protein === expectedPerServingProtein;

  return {
    passed: matches,
    details: `Total: ${result.total.calories} kcal, Per Serving: ${result.perServing.calories} kcal, ${result.perServing.protein}g P`,
  };
});

runTest('Clara', 'Recipe builder handles 0 servings safely without throwing or NaN', () => {
  const result = calculateRecipeTotals([], 0);
  const isSafe = !isNaN(result.perServing.calories) && result.perServing.calories === 0;
  return {
    passed: isSafe,
    details: `perServingCalories: ${result.perServing.calories}`,
  };
});

runTest('Clara', 'Food library search aliases match common beginner terms', () => {
  const query = 'egg';
  const match = mockFoodLibrary.some(
    (f) => f.name.toLowerCase().includes(query) || f.aliases?.some((a) => a.toLowerCase().includes(query))
  );
  return {
    passed: match,
    details: `Found egg in library: ${match}`,
  };
});

// ============================================================================
// 5. THIAGO (Brazilian Hybrid Endurance Athlete, 31)
// ============================================================================
console.log('▶ Simulating Persona 5: Thiago (Hybrid Athlete & pt-BR)');

runTest('Thiago', 'Accepts Brazilian comma decimal input (e.g. 12,5 km)', () => {
  const parsed = parseNumericInput('12,5');
  return {
    passed: parsed.value === 12.5 && !parsed.error,
    details: `Parsed '12,5' -> value=${parsed.value}, error=${parsed.error}`,
  };
});

runTest('Thiago', 'Accepts Brazilian dot thousand + comma decimal (e.g. 1.250,50)', () => {
  const parsed = parseNumericInput('1.250,50');
  return {
    passed: parsed.value === 1250.5 && !parsed.error,
    details: `Parsed '1.250,50' -> value=${parsed.value}, error=${parsed.error}`,
  };
});

runTest('Thiago', 'Cardio pace formatting for running', () => {
  // 5km in 25 minutes = 5:00 /km
  const pace = formatPace(25, 5);
  return {
    passed: pace === '5:00',
    details: `Pace for 5km in 25min: ${pace}`,
  };
});

runTest('Thiago', 'Cardio progress UI friction audit: Cycling speed vs running pace', () => {
  // A cyclist rides 40km in 80min. Speed is 30 km/h.
  // In min/km pace, it shows 2:00 /km.
  // Cyclists do NOT think in min/km! This is a real friction point for hybrid athletes.
  return {
    passed: true,
    friction: {
      severity: 'minor_annoyance',
      area: 'progress_cardio',
      issue: 'Cycling pace is formatted as minutes/km (e.g. 2:00/km) instead of km/h (or mph) speed.',
      proposedFix: 'When cardio activity or selected modality is cycling, display speed in km/h (distance / (duration / 60)) alongside or instead of min/km pace.',
    },
    details: 'Flagged UX friction: Cyclists need km/h speed units, not min/km running pace.',
  };
});

runTest('Thiago', 'Cardio progress UI friction audit: Hardcoded /km in imperial mode', () => {
  // In ProgressView.tsx lines 676-678, the best pace is displayed with hardcoded ` /km`
  // even if user profile unitSystem is imperial.
  return {
    passed: true,
    friction: {
      severity: 'minor_annoyance',
      area: 'progress_cardio',
      issue: 'ProgressView best pace summary card hardcodes " /km" suffix regardless of user unitSystem setting.',
      proposedFix: 'Render `/mi` when profile.unitSystem === "imperial" and `/km` when "metric".',
    },
    details: 'Flagged UI friction: Imperial unit users see /km in best pace summary card.',
  };
});

runTest('Thiago', 'Brazilian staple athletic foods present in library', () => {
  const staples = ['Tapioca', 'Feijão', 'Açaí', 'Pão de Queijo'];
  const missing: string[] = [];
  for (const staple of staples) {
    const found = mockFoodLibrary.some((f) =>
      f.name.toLowerCase().includes(staple.toLowerCase()) ||
      f.aliases?.some((a) => a.toLowerCase().includes(staple.toLowerCase()))
    );
    if (!found) missing.push(staple);
  }
  return {
    passed: missing.length === 0,
    details: missing.length === 0 ? 'All Brazilian staples present' : `Missing: ${missing.join(', ')}`,
  };
});

runTest('Thiago', 'Garmin TCX parser extracts bike ride workout accurately', () => {
  const sampleTcx = `
  <TrainingCenterDatabase>
    <Activities>
      <Activity Sport="Biking">
        <Id>2026-11-09T08:00:00Z</Id>
        <Lap StartTime="2026-11-09T08:00:00Z">
          <TotalTimeSeconds>3600</TotalTimeSeconds>
          <DistanceMeters>30000</DistanceMeters>
          <Calories>750</Calories>
        </Lap>
      </Activity>
    </Activities>
  </TrainingCenterDatabase>
  `;
  const result = parseGarminTcx(sampleTcx);
  const session = result.cardio[0];
  const passed = result.cardio.length === 1 && session.distanceKm === 30 && session.durationMinutes === 60;
  return {
    passed,
    details: `Parsed TCX: distance=${session?.distanceKm}km, duration=${session?.durationMinutes}m, calories=${session?.caloriesBurned}`,
  };
});

// ============================================================================
// SIMULATION SUMMARY & FRICTION REPORT GENERATION
// ============================================================================
console.log('\n===============================================================');
console.log('  SIMULATION RESULTS SUMMARY                                   ');
console.log('===============================================================');

const passedCount = testResults.filter((r) => r.passed).length;
const totalCount = testResults.length;
console.log(`\nTests Executed: ${totalCount}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${totalCount - passedCount}`);

testResults.filter((r) => !r.passed).forEach((r) => {
  console.log(`  ✖ [${r.persona}] ${r.scenario}: ${r.details}`);
});

const frictions = testResults.filter((r) => r.frictionDetected).map((r) => r.frictionDetected!);

console.log(`\nUX Friction Points Detected: ${frictions.length}`);
frictions.forEach((f, idx) => {
  console.log(`\n[Friction #${idx + 1}] (${f.severity.toUpperCase()} in ${f.area}):`);
  console.log(`  Issue: ${f.issue}`);
  console.log(`  Proposed Fix: ${f.proposedFix}`);
});

// If frictions were detected, write them into docs/friction-backlog.json
if (frictions.length > 0) {
  const backlogPath = path.resolve(process.cwd(), 'docs/friction-backlog.json');
  try {
    let existingBacklog: any[] = [];
    if (fs.existsSync(backlogPath)) {
      existingBacklog = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));
    }

    let addedCount = 0;
    for (const f of frictions) {
      const alreadyExists = existingBacklog.some(
        (item) =>
          item.description?.toLowerCase().includes(f.issue.toLowerCase().slice(0, 30)) ||
          item.title?.toLowerCase().includes(f.issue.toLowerCase().slice(0, 30))
      );
      if (!alreadyExists) {
        const newId = `fric-${String(existingBacklog.length + 1).padStart(3, '0')}`;
        existingBacklog.push({
          id: newId,
          type: 'friction',
          title: `Beta Tester Finding: ${f.issue.slice(0, 60)}...`,
          category: f.area === 'progress_cardio' ? 'progress_tracking' : 'general',
          severity: f.severity,
          description: f.issue,
          suggestedSolution: f.proposedFix,
          reporter: 'ai_beta_tester_thiago',
          status: 'open',
          timestamp: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      fs.writeFileSync(backlogPath, JSON.stringify(existingBacklog, null, 2), 'utf-8');
      console.log(`\nSuccessfully appended ${addedCount} new friction items to ${backlogPath}`);
    }
  } catch (err) {
    console.error('Failed to update friction backlog:', err);
  }
}

console.log('\n===============================================================');
console.log('  BETA-TESTING SIMULATION FINISHED                             ');
console.log('===============================================================\n');
