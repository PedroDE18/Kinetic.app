import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeAiFoodItem,
  estimateMealOffline,
  estimateMealWithAi,
} from './aiFoodEstimation';

test('sanitizeAiFoodItem clamps numbers, fixes NaN and handles corrupt inputs', () => {
  const item = sanitizeAiFoodItem(
    {
      name: '  Protein Bowl  ',
      calories: -50, // invalid negative
      protein: NaN as any, // invalid NaN
      carbs: 45.26,
      fat: 12.99,
      servingCount: 0, // invalid zero
      servingSize: -10, // invalid negative
      servingUnit: '',
    },
    0
  );

  assert.equal(item.name, 'Protein Bowl');
  assert.equal(item.calories, 0); // clamped to 0
  assert.equal(item.protein, 5); // fallback default
  assert.equal(item.carbs, 45.3);
  assert.equal(item.fat, 13);
  assert.equal(item.servingCount, 1); // clamped to min
  assert.equal(item.servingSize, 100); // fallback default
  assert.equal(item.servingUnit, 'portion'); // fallback
});

test('estimateMealOffline parses multi-component breakfast', () => {
  const prompt = '3 eggs with 2 slices of whole wheat toast and half an avocado';
  const items = estimateMealOffline(prompt);

  assert.ok(items.length >= 3, `Expected at least 3 parts, got ${items.length}`);
  const names = items.map((i) => i.name.toLowerCase());

  assert.ok(names.some((n) => n.includes('egg')), 'Should detect eggs');
  assert.ok(names.some((n) => n.includes('toast') || n.includes('bread')), 'Should detect toast');
  assert.ok(names.some((n) => n.includes('avocado')), 'Should detect avocado');

  // Verify numerical plausibility
  for (const item of items) {
    assert.ok(Number.isFinite(item.calories) && item.calories > 0);
    assert.ok(Number.isFinite(item.protein) && item.protein >= 0);
    assert.ok(Number.isFinite(item.carbs) && item.carbs >= 0);
    assert.ok(Number.isFinite(item.fat) && item.fat >= 0);
  }
});

test('estimateMealOffline parses Greek yogurt with banana and seeds', () => {
  const prompt = 'greek yogurt with a banana and chia seeds';
  const items = estimateMealOffline(prompt);

  assert.equal(items.length, 3);
  const names = items.map((i) => i.name.toLowerCase());
  assert.ok(names.some((n) => n.includes('yogurt')));
  assert.ok(names.some((n) => n.includes('banana')));
  assert.ok(names.some((n) => n.includes('seed')));
});

test('estimateMealOffline falls back cleanly for unknown foods without crashing', () => {
  const prompt = 'mysterious exotic hotpot';
  const items = estimateMealOffline(prompt);

  assert.equal(items.length, 1);
  assert.ok(items[0].name.includes('mysterious exotic hotpot'));
  assert.ok(items[0].calories > 0);
});

test('estimateMealOffline parses Brazilian cultural foods accurately', () => {
  const prompt = 'feijoada com farofa e arroz';
  const items = estimateMealOffline(prompt);
  assert.ok(items.length >= 3);
  const names = items.map((i) => i.name.toLowerCase());
  assert.ok(names.some((n) => n.includes('feijoada')));
  assert.ok(names.some((n) => n.includes('farofa')));
  assert.ok(names.some((n) => n.includes('arroz') || n.includes('rice')));
});

test('estimateMealWithAi returns offline estimate when no API key is provided (Zero Cost)', async () => {
  const result = await estimateMealWithAi('chicken breast with white rice', '');
  assert.equal(result.source, 'offline');
  assert.ok(result.items.length >= 2);
  const names = result.items.map((i) => i.name.toLowerCase());
  assert.ok(names.some((n) => n.includes('chicken')));
  assert.ok(names.some((n) => n.includes('rice')));
});

test('estimateMealWithAi returns empty array for empty prompt', async () => {
  const result = await estimateMealWithAi('   ', '');
  assert.equal(result.items.length, 0);
  assert.equal(result.source, 'offline');
});
