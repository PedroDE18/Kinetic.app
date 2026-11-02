import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickLog } from './quickLogParser';

test('parseQuickLog parses single water intake in milliliters and liters', () => {
  const res1 = parseQuickLog('drank 500ml water');
  assert.equal(res1.actions.length, 1);
  assert.equal(res1.actions[0].type, 'water');
  assert.equal((res1.actions[0] as any).amountMl, 500);

  const res2 = parseQuickLog('chugged 1.5l of water');
  assert.equal(res2.actions.length, 1);
  assert.equal((res2.actions[0] as any).amountMl, 1500);
});

test('parseQuickLog parses weigh-in with kg and lbs conversion', () => {
  const resMetric = parseQuickLog('weigh-in 76.5kg');
  assert.equal(resMetric.actions.length, 1);
  assert.equal(resMetric.actions[0].type, 'weight');
  assert.equal((resMetric.actions[0] as any).weightKg, 76.5);

  const resImperial = parseQuickLog('weighed 165 lbs');
  assert.equal(resImperial.actions.length, 1);
  assert.equal(resImperial.actions[0].type, 'weight');
  // 165 * 0.453592 = 74.84 kg
  assert.equal((resImperial.actions[0] as any).weightKg, 74.84);
});

test('parseQuickLog parses cardio session with distance and duration', () => {
  const res = parseQuickLog('ran 5k in 25 min');
  assert.equal(res.actions.length, 1);
  assert.equal(res.actions[0].type, 'cardio');
  const cardio = res.actions[0] as any;
  assert.equal(cardio.activityType, 'running');
  assert.equal(cardio.distanceKm, 5);
  assert.equal(cardio.durationMinutes, 25);
  assert.ok(cardio.estimatedCalories > 200);
});

test('parseQuickLog parses multi-intent command line', () => {
  const command = 'drank 500ml water and ran 5k in 25 min, weighed 75.2kg and had 2 eggs with toast';
  const res = parseQuickLog(command);

  assert.equal(res.actions.length, 4);

  const types = res.actions.map((a) => a.type);
  assert.ok(types.includes('water'));
  assert.ok(types.includes('cardio'));
  assert.ok(types.includes('weight'));
  assert.ok(types.includes('food'));

  const foodAction = res.actions.find((a) => a.type === 'food') as any;
  assert.ok(foodAction.items.length >= 2);
  assert.ok(foodAction.totalCalories > 0);
});

test('parseQuickLog handles empty and blank input gracefully without crashing', () => {
  const res = parseQuickLog('   ');
  assert.equal(res.actions.length, 0);
});
