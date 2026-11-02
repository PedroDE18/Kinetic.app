import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateMealOffline, sanitizeAiFoodItem } from './aiFoodEstimation';
import { parseQuickLog } from './quickLogParser';
import { generateRoutineDraftOffline } from './routineGenerator';
import { mockExercises } from '../utils/mockData';

// Golden set of diverse athletic meals and daily queries
const GOLDEN_MEAL_QUERIES = [
  '3 eggs with 2 slices of sourdough bread and avocado',
  'greek yogurt with blueberries and chia seeds',
  'grilled chicken breast with jasmine rice',
  'atlantic salmon with baked sweet potato and olive oil',
  'whey protein shake with whole milk and peanut butter',
  'plain bagel with 2 whole eggs',
  'oatmeal with banana and walnuts',
  'lean ground beef burger with whole wheat toast',
];

test('EVAL HARNESS: Golden meal queries parse with physiological macro consistency', () => {
  for (const query of GOLDEN_MEAL_QUERIES) {
    const items = estimateMealOffline(query);
    assert.ok(items.length >= 1, `Query "${query}" should produce at least 1 food component`);

    for (const item of items) {
      assert.ok(item.name.trim().length > 0, 'Name must not be empty');
      assert.ok(Number.isFinite(item.calories) && item.calories >= 0, 'Calories must be non-negative finite number');
      assert.ok(Number.isFinite(item.protein) && item.protein >= 0, 'Protein must be non-negative');
      assert.ok(Number.isFinite(item.carbs) && item.carbs >= 0, 'Carbs must be non-negative');
      assert.ok(Number.isFinite(item.fat) && item.fat >= 0, 'Fat must be non-negative');
      assert.ok(item.servingCount > 0, 'Serving count must be positive');
      assert.ok(item.servingSize > 0, 'Serving size must be positive');

      // Physiological macronutrient calorie check: 4*P + 4*C + 9*F should be close to kcal
      const calculatedKcal = item.protein * 4 + item.carbs * 4 + item.fat * 9;
      // Allow realistic tolerance for fiber/rounding
      const diff = Math.abs(item.calories - calculatedKcal);
      assert.ok(
        diff <= Math.max(30, item.calories * 0.35),
        `Macro calculation for "${item.name}" (${item.calories} vs ${calculatedKcal.toFixed(0)}) exceeds tolerance`
      );
    }
  }
});

test('EVAL HARNESS: Adversarial and edge case meal inputs do not crash or produce corrupt records', () => {
  const adversarialInputs = [
    '',
    '   ',
    '??? !!! ###',
    '123456789',
    'a',
    'some completely unknown extraterrestrial snack',
    'egg',
    'milk',
  ];

  for (const input of adversarialInputs) {
    const items = estimateMealOffline(input);
    assert.ok(Array.isArray(items), 'Must always return an array');

    for (const item of items) {
      assert.ok(typeof item.name === 'string');
      assert.ok(!Number.isNaN(item.calories));
      assert.ok(!Number.isNaN(item.protein));
      assert.ok(!Number.isNaN(item.carbs));
      assert.ok(!Number.isNaN(item.fat));
    }
  }
});

test('EVAL HARNESS: Quick-log intent classification across composite natural-language phrases', () => {
  const testPhrases = [
    {
      phrase: 'drank 750ml water and weighed 81.2kg',
      expectedTypes: ['water', 'weight'],
    },
    {
      phrase: 'ran 10k in 52 mins and drank 1 liter of water',
      expectedTypes: ['water', 'cardio'],
    },
    {
      phrase: 'weighed 178 lbs and had a protein shake with milk',
      expectedTypes: ['weight', 'food'],
    },
    {
      phrase: 'cycling 20km for 45 min and drank 500ml',
      expectedTypes: ['water', 'cardio'],
    },
  ];

  for (const { phrase, expectedTypes } of testPhrases) {
    const result = parseQuickLog(phrase);
    const actionTypes = result.actions.map((a) => a.type);

    for (const exp of expectedTypes) {
      assert.ok(
        actionTypes.includes(exp as any),
        `Phrase "${phrase}" expected to contain intent "${exp}", got [${actionTypes.join(', ')}]`
      );
    }
  }
});

test('EVAL HARNESS: Routine generator maintains volume sanity across all splits and equipments', () => {
  const equipments: Array<'all' | 'Barbell' | 'Dumbbell' | 'Bodyweight'> = [
    'all',
    'Barbell',
    'Dumbbell',
    'Bodyweight',
  ];
  const focuses: Array<'hypertrophy' | 'strength' | 'conditioning'> = [
    'hypertrophy',
    'strength',
    'conditioning',
  ];

  for (const eq of equipments) {
    for (const f of focuses) {
      const routine = generateRoutineDraftOffline(
        {
          focus: f,
          daysPerWeek: 4,
          equipment: eq,
          sessionLengthMinutes: 45,
        },
        mockExercises
      );

      assert.ok(routine.exercises.length >= 2, `Routine for ${eq} ${f} must have >= 2 exercises`);
      assert.ok(routine.name.length > 0);
      assert.ok(routine.description.length > 0);

      // Verify every exercise belongs to the library
      const libraryIds = new Set(mockExercises.map((e) => e.id));
      for (const ex of routine.exercises) {
        assert.ok(libraryIds.has(ex.exerciseId), `Exercise ID ${ex.exerciseId} must exist in library`);
        assert.ok(ex.defaultSets >= 2 && ex.defaultSets <= 6);
        assert.ok(ex.defaultReps >= 3 && ex.defaultReps <= 25);
        assert.ok((ex.targetRpe ?? 8) >= 6 && (ex.targetRpe ?? 8) <= 10);
      }
    }
  }
});
