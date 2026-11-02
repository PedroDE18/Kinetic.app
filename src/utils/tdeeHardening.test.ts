import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAdaptiveTDEE, generateWeeklyAdjustmentProposal } from './engine';
import { WeightRecord, LoggedFood } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function dateStr(nowMs: number, daysAgo: number): string {
  const d = new Date(nowMs - daysAgo * DAY_MS);
  const [y, m, dd] = d.toISOString().split('T')[0].split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function dayLog(daysAgo: number, calories: number, protein = 150): LoggedFood {
  const nowMs = Date.now();
  return {
    id: `f-${daysAgo}-${calories}`,
    foodId: 'fda-1',
    mealType: 'lunch',
    name: 'Test Meal',
    servingCount: 1,
    servingSize: 100,
    servingUnit: 'g',
    calories,
    protein,
    carbs: Math.max(0, (calories - protein * 4) * 0.5 / 4),
    fat: Math.max(0, calories * 0.25 / 9),
    loggedAt: `${dateStr(nowMs, daysAgo)}T12:00:00.000Z`,
  };
}

function steadyScale(nowMs: number, days: number, startKg: number, kgPerDay: number): WeightRecord[] {
  const recs: WeightRecord[] = [];
  for (let i = days - 1; i >= 0; i--) {
    recs.push({ date: dateStr(nowMs, i), weightKg: startKg + kgPerDay * (days - 1 - i) });
  }
  return recs;
}

test('missing weight history: falls back to baseline with low confidence, no crash', () => {
  const result = calculateAdaptiveTDEE([], [dayLog(0, 2200)]);
  assert.equal(result.estimatedTdee, 2400);
  assert.equal(result.confidenceScore, 0.2);
  assert.equal(result.isConfident, false);
  // Zero data at all is also safe.
  const empty = calculateAdaptiveTDEE([], []);
  assert.equal(empty.estimatedTdee, 2400);
  assert.ok(Number.isFinite(empty.estimatedTdee));
});

test('insufficient observation: fewer than 3 weigh-ins never estimates', () => {
  const nowMs = Date.now();
  const twoWeighIns = steadyScale(nowMs, 2, 84, -0.1);
  const result = calculateAdaptiveTDEE(twoWeighIns, [dayLog(0, 2200), dayLog(1, 2200)]);
  assert.equal(result.estimatedTdee, 2400);
  assert.equal(result.confidenceScore, 0.2);
  assert.equal(result.isConfident, false);
});

test('very low intake with steady weight: short-observation dampening keeps the estimate humble', () => {
  const nowMs = Date.now();
  // 4-day observation window, losing weight rapidly atف starvation intake.
  const weights = steadyScale(nowMs, 4, 85, -0.9);
  const foods: LoggedFood[] = [];
  for (let i = 0; i < 4; i++) foods.push(dayLog(i, 800));
  const result = calculateAdaptiveTDEE(weights, foods);
  // The raw model (800 + 0.9*7700 ≈ 6730) would be absurd from 4 days of data.
  // Confidence must be penalized by the short observation span and the final
  // estimate clamped within sane bounds.
  assert.ok(result.confidenceScore < 0.35, `confidence should be heavily dampened, got ${result.confidenceScore}`);
  assert.ok(result.estimatedTdee >= 1300 && result.estimatedTdee <= 4500);
  assert.equal(result.isConfident, false);
});

test('very high intake with weight gain: estimate stays within human bounds', () => {
  const nowMs = Date.now();
  const weights = steadyScale(nowMs, 14, 80, 1.5); // 1.5 kg/day gain (gaining phase)
  const foods: LoggedFood[] = [];
  for (let i = 0; i < 14; i++) foods.push(dayLog(i, 7000));
  const result = calculateAdaptiveTDEE(weights, foods);
  // 7000 - 1.5*7700/1… spirals; the model must clamp, not project pseudoscience.
  assert.ok(result.estimatedTdee <= 4500, `expected clamp at 4500, got ${result.estimatedTdee}`);
  assert.ok(Number.isFinite(result.estimatedTdee));
});

test('implausible sensor/data garbage is excluded from the estimate', () => {
  const nowMs = Date.now();
  const weights: WeightRecord[] = [
    { date: dateStr(nowMs, 14), weightKg: 85 },                 // good
    { date: dateStr(nowMs, 12), weightKg: NaN },                // NaN → excluded
    { date: dateStr(nowMs, 10), weightKg: -3.4 },               // floor malfunction → excluded
    { date: dateStr(nowMs, 8), weightKg: 1200 },                // elephant scale → excluded
    { date: dateStr(nowMs, 6), weightKg: 84.8 },                // good
    { date: dateStr(nowMs, 4), weightKg: 84.6 },                // good
    { date: dateStr(nowMs, 2), weightKg: 84.4 },                // good
    { date: dateStr(nowMs, -2), weightKg: 84.0 },               // FUTURE date → excluded
    { date: 'garbage', weightKg: 84.0 },                        // unparsable → excluded
  ];
  const foods: LoggedFood[] = [
    dayLog(0, 2000),
    dayLog(1, NaN),         // malformed → excluded
    dayLog(2, -400),        // negative → excluded
    dayLog(3, 1e6),         // absurd entry → excluded
    dayLog(4, 1900),
  ];
  const result = calculateAdaptiveTDEE(weights, foods);
  // Only the 4 good weigh-ins count; garbage didn't crash or skew the output.
  assert.equal(result.weighInCount, 4);
  assert.ok(Number.isFinite(result.estimatedTdee));
  assert.ok(result.estimatedTdee >= 1300 && result.estimatedTdee <= 4500);
  // Daily intake reflects only valid entries: (2000+1900)/2 in the window.
  assert.ok(result.avgDailyIntake >= 1800 && result.avgDailyIntake <= 2000);
});

test('extreme same-period weight change remains bounded and finite', () => {
  const nowMs = Date.now();
  // 3 weigh-ins with a 10 kg jump in a few days (mis-logged or real crash diet):
  // must still clamp and dampen rather than output a 40,000 kcal TDEE.
  const weights: WeightRecord[] = [
    { date: dateStr(nowMs, 3), weightKg: 80 },
    { date: dateStr(nowMs, 2), weightKg: 85 },
    { date: dateStr(nowMs, 0), weightKg: 90 },
  ];
  const foods: LoggedFood[] = [dayLog(0, 3000), dayLog(1, 3000), dayLog(2, 3000)];
  const result = calculateAdaptiveTDEE(weights, foods);
  assert.ok(Number.isFinite(result.estimatedTdee));
  assert.ok(result.estimatedTdee >= 1300 && result.estimatedTdee <= 4500);
});

test('sane long-observation data still estimates fluidly (regression guard)', () => {
  const nowMs = Date.now();
  const weights = steadyScale(nowMs, 14, 85.0, -0.075); // -0.75/week approx
  const foods: LoggedFood[] = [];
  for (let i = 0; i < 14; i++) foods.push(dayLog(i, 2200, 160));
  const result = calculateAdaptiveTDEE(weights, foods);
  // 2200 + (0.525/7? trend rate… energy offset) — the pre-existing test pins
  // exact semantics elsewhere; here assert plausibility + confidence matured.
  assert.ok(result.estimatedTdee > 2200); // losing weight ⇒ expenditure > intake
  assert.ok(result.confidenceScore > 0.5);
  assert.ok(Number.isFinite(result.weeklyTrendDeltaKg));
});

test('weekly adjustment proposal: guardrails and invalid inputs', () => {
  // Hard ±200 kcal/day clamp with 25 kcal rounding.
  const wild = generateWeeklyAdjustmentProposal(4000, 2500, -1.0, 0.9);
  assert.equal(wild.adjustmentDelta, 200);
  assert.equal(wild.proposedTarget, 2700);

  const lowConf = generateWeeklyAdjustmentProposal(2200, 2000, -0.4, 0.10);
  assert.equal(lowConf.adjustmentDelta, 0);
  assert.equal(lowConf.proposedTarget, 2000);

  // Corrupt inputs must never move the target.
  const corrupt = generateWeeklyAdjustmentProposal(NaN, 2000, -0.4, 0.9);
  assert.equal(corrupt.adjustmentDelta, 0);
  assert.equal(corrupt.proposedTarget, 2000);
  const corrupt2 = generateWeeklyAdjustmentProposal(2300, Number.POSITIVE_INFINITY, -0.4, 0.9);
  assert.equal(corrupt2.adjustmentDelta, 0);
  assert.ok(Number.isFinite(corrupt2.proposedTarget));
});
