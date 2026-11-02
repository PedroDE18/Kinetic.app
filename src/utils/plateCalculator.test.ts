import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBarbellPlates } from './plateCalculator';

test('calculateBarbellPlates correctly calculates 100kg with 20kg bar', () => {
  // 100kg total - 20kg bar = 80kg -> 40kg per side (1x25kg + 1x15kg)
  const result = calculateBarbellPlates(100, 20, 'kg');

  assert.equal(result.targetWeight, 100);
  assert.equal(result.barWeight, 20);
  assert.equal(result.weightPerSide, 40);
  assert.equal(result.achievableTotalWeight, 100);
  assert.equal(result.remainder, 0);

  const p25 = result.platesPerSide.find((p) => p.weight === 25);
  const p15 = result.platesPerSide.find((p) => p.weight === 15);
  assert.ok(p25 && p25.countPerSide === 1);
  assert.ok(p15 && p15.countPerSide === 1);
});

test('calculateBarbellPlates handles 102.5kg with fractional plates', () => {
  // 102.5kg - 20kg = 82.5kg -> 41.25kg per side (25 + 15 + 1.25)
  const result = calculateBarbellPlates(102.5, 20, 'kg');

  assert.equal(result.weightPerSide, 41.25);
  assert.equal(result.achievableTotalWeight, 102.5);
  assert.equal(result.remainder, 0);

  const p1_25 = result.platesPerSide.find((p) => p.weight === 1.25);
  assert.ok(p1_25 && p1_25.countPerSide === 1);
});

test('calculateBarbellPlates clamps to empty bar when target weight is below bar', () => {
  const result = calculateBarbellPlates(15, 20, 'kg');
  assert.equal(result.targetWeight, 20);
  assert.equal(result.weightPerSide, 0);
  assert.equal(result.platesPerSide.length, 0);
});

test('calculateBarbellPlates handles imperial 225 lbs with 45 lb bar', () => {
  // 225 - 45 = 180 lbs -> 90 lbs per side (2 x 45 lb)
  const result = calculateBarbellPlates(225, 45, 'lbs');

  assert.equal(result.weightPerSide, 90);
  assert.equal(result.achievableTotalWeight, 225);
  assert.equal(result.remainder, 0);

  const p45 = result.platesPerSide.find((p) => p.weight === 45);
  assert.ok(p45 && p45.countPerSide === 2);
});
