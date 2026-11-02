import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRecipeTotals, scaleIngredientFromFood } from './recipeCalculator';

describe('recipeCalculator - Composite Recipe & Serving Yields', () => {
  it('correctly calculates total and per-serving nutrition for 1 serving', () => {
    const ingredients = [
      { id: '1', name: 'Oats', amount: 50, unit: 'g', calories: 190, protein: 6.5, carbs: 34, fat: 3 },
      { id: '2', name: 'Whey', amount: 30, unit: 'g', calories: 120, protein: 24, carbs: 2, fat: 1.5 },
      { id: '3', name: 'Peanut Butter', amount: 16, unit: 'g', calories: 95, protein: 4, carbs: 3.5, fat: 8 },
    ];

    const result = calculateRecipeTotals(ingredients, 1);
    assert.equal(result.servings, 1);
    assert.equal(result.total.calories, 405);
    assert.equal(result.total.protein, 34.5);
    assert.equal(result.total.carbs, 39.5);
    assert.equal(result.total.fat, 12.5);

    assert.equal(result.perServing.calories, 405);
    assert.equal(result.perServing.protein, 34.5);
    assert.equal(result.perServing.carbs, 39.5);
    assert.equal(result.perServing.fat, 12.5);
  });

  it('correctly divides recipe totals into multiple batch servings', () => {
    const ingredients = [
      { id: '1', name: 'Chicken Breast', amount: 600, unit: 'g', calories: 990, protein: 186, carbs: 0, fat: 21.6 },
      { id: '2', name: 'Jasmine Rice', amount: 300, unit: 'g', calories: 1050, protein: 21, carbs: 240, fat: 3 },
      { id: '3', name: 'Olive Oil', amount: 14, unit: 'g', calories: 120, protein: 0, carbs: 0, fat: 14 },
    ];

    // 4 batch meal-prep servings
    const result = calculateRecipeTotals(ingredients, 4);
    assert.equal(result.servings, 4);
    assert.equal(result.total.calories, 2160);
    assert.equal(result.total.protein, 207);
    assert.equal(result.total.carbs, 240);
    assert.equal(result.total.fat, 38.6);

    // 2160 / 4 = 540 kcal
    assert.equal(result.perServing.calories, 540);
    // 207 / 4 = 51.8g
    assert.equal(result.perServing.protein, 51.8);
    // 240 / 4 = 60g
    assert.equal(result.perServing.carbs, 60);
    // 38.6 / 4 = 9.7g (rounded to 1 decimal)
    assert.equal(result.perServing.fat, 9.7);
  });

  it('handles empty ingredients gracefully', () => {
    const result = calculateRecipeTotals([], 2);
    assert.equal(result.servings, 2);
    assert.equal(result.total.calories, 0);
    assert.equal(result.perServing.calories, 0);
  });

  it('scaleIngredientFromFood scales values proportionally', () => {
    const baseFood = {
      id: 'food-chicken',
      name: 'Chicken Breast Raw',
      servingSize: 100,
      servingUnit: 'g',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    };

    const scaled = scaleIngredientFromFood(baseFood, 250);
    assert.equal(scaled.name, 'Chicken Breast Raw');
    assert.equal(scaled.amount, 250);
    assert.equal(scaled.unit, 'g');
    // 165 * 2.5 = 412.5 -> 413 or Math.round
    assert.equal(scaled.calories, Math.round(165 * 2.5));
    // 31 * 2.5 = 77.5
    assert.equal(scaled.protein, 77.5);
    // 3.6 * 2.5 = 9
    assert.equal(scaled.fat, 9);
  });
});
