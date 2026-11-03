import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mergeLibraries } from './FitnessContext';
import { FoodItem, ExerciseDefinition } from '../types';

describe('Data Persistence & Library Merging', () => {
  it('merges new system default foods without overwriting user custom foods', () => {
    const userCustomFoods: FoodItem[] = [
      {
        id: 'cf-user-1',
        name: "Grandma's Chicken Broth",
        brand: 'Home Recipe',
        category: 'Protein',
        servingSize: 250,
        servingUnit: 'ml',
        calories: 85,
        protein: 12,
        carbs: 2,
        fat: 3,
        source: 'User Custom',
        isFavorite: true,
      },
      {
        id: 'f-1',
        name: 'Rolled Oats (User Custom Brand)',
        brand: 'Organic Farm',
        category: 'Carbohydrates',
        servingSize: 40,
        servingUnit: 'g',
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 2.5,
      },
    ];

    const systemDefaults: FoodItem[] = [
      {
        id: 'f-1',
        name: 'Rolled Oats',
        brand: 'Quaker',
        category: 'Carbohydrates',
        servingSize: 50,
        servingUnit: 'g',
        calories: 190,
        protein: 7,
        carbs: 32,
        fat: 3.5,
      },
      {
        id: 'f-2',
        name: 'Whey Protein Isolate',
        brand: 'Optimum Nutrition',
        category: 'Protein',
        servingSize: 31,
        servingUnit: 'g',
        calories: 120,
        protein: 24,
        carbs: 2,
        fat: 1,
      },
      {
        id: 'f-new-salmon',
        name: 'Wild Alaskan Salmon',
        brand: 'Fresh Catch',
        category: 'Protein',
        servingSize: 150,
        servingUnit: 'g',
        calories: 210,
        protein: 34,
        carbs: 0,
        fat: 8,
      },
    ];

    const merged = mergeLibraries(userCustomFoods, systemDefaults);

    // Assert user's custom food is preserved intact
    const userCustom = merged.find((f) => f.id === 'cf-user-1');
    assert.ok(userCustom, 'User custom food should be present');
    assert.strictEqual(userCustom.name, "Grandma's Chicken Broth");

    // Assert user's customized 'f-1' is kept, not overwritten by default
    const oats = merged.find((f) => f.id === 'f-1');
    assert.ok(oats);
    assert.strictEqual(oats.brand, 'Organic Farm', 'User custom brand must take precedence over system default');

    // Assert new default 'f-new-salmon' was appended
    const salmon = merged.find((f) => f.id === 'f-new-salmon');
    assert.ok(salmon, 'New system default food should be added');
    assert.strictEqual(salmon.protein, 34);

    // Total length should be: 2 user items + 2 new system defaults (f-2 and f-new-salmon) = 4
    assert.strictEqual(merged.length, 4);
  });

  it('merges new exercises into exercise atlas without duplicating existing exercises', () => {
    const userExercises: ExerciseDefinition[] = [
      {
        id: 'ex-1',
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        primaryMuscles: ['Pectoralis Major'],
        secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
        equipment: 'Barbell',
        defaultRestSeconds: 180,
      },
      {
        id: 'ex-custom-dip',
        name: 'Gymnastic Ring Dips',
        muscleGroup: 'Chest',
        primaryMuscles: ['Pectoralis Major'],
        secondaryMuscles: ['Triceps'],
        equipment: 'Bodyweight',
        defaultRestSeconds: 120,
      },
    ];

    const systemDefaults: ExerciseDefinition[] = [
      {
        id: 'ex-1',
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        primaryMuscles: ['Pectoralis Major'],
        secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
        equipment: 'Barbell',
        defaultRestSeconds: 180,
      },
      {
        id: 'ex-2',
        name: 'Barbell Back Squat',
        muscleGroup: 'Legs',
        primaryMuscles: ['Quadriceps', 'Glutes'],
        secondaryMuscles: ['Hamstrings', 'Lower Back'],
        equipment: 'Barbell',
        defaultRestSeconds: 180,
      },
      {
        id: 'ex-3',
        name: 'Barbell Deadlift',
        muscleGroup: 'Back',
        primaryMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
        secondaryMuscles: ['Lats', 'Trapezius', 'Forearms'],
        equipment: 'Barbell',
        defaultRestSeconds: 180,
      },
    ];

    const merged = mergeLibraries(userExercises, systemDefaults);

    // Assert custom ring dips are preserved
    assert.ok(merged.find((e) => e.id === 'ex-custom-dip'));

    // Assert new exercises are merged
    assert.ok(merged.find((e) => e.id === 'ex-2'));
    assert.ok(merged.find((e) => e.id === 'ex-3'));

    // No duplicate Barbell Bench Press
    const benchCount = merged.filter((e) => e.id === 'ex-1').length;
    assert.strictEqual(benchCount, 1, 'Should not duplicate exercise with identical id');
    assert.strictEqual(merged.length, 4);
  });

  it('handles empty or undefined user library gracefully by returning full defaults', () => {
    const defaults = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
    const fromUndefined = mergeLibraries(undefined, defaults);
    const fromEmpty = mergeLibraries([], defaults);

    assert.deepStrictEqual(fromUndefined, defaults);
    assert.deepStrictEqual(fromEmpty, defaults);
  });
});
