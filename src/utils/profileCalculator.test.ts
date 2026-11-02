import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBMR, calculateRecommendedNutrition } from './profileCalculator';

describe('profileCalculator - Athletic BMR & Macro Recommendations', () => {
  it('calculates correct male BMR using Mifflin-St Jeor', () => {
    // 80kg, 180cm, 25yo male: 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
    const bmr = calculateBMR(80, 180, 25, 'male');
    assert.equal(bmr, 1805);
  });

  it('calculates correct female BMR using Mifflin-St Jeor', () => {
    // 60kg, 165cm, 30yo female: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320
    const bmr = calculateBMR(60, 165, 30, 'female');
    assert.equal(bmr, 1320);
  });

  it('calculates athletic macros for fat loss', () => {
    const res = calculateRecommendedNutrition({
      weightKg: 80,
      heightCm: 180,
      age: 25,
      sex: 'male',
      activityLevel: 'moderate', // 1.55
      goal: 'fat_loss',
      targetRateKgPerWeek: -0.4, // -440 kcal/day
    });

    // BMR = 1805, Maintenance = 1805 * 1.55 = 2798 kcal
    assert.equal(res.bmr, 1805);
    assert.equal(res.maintenanceCalories, 2798);
    // Target = 2798 - 440 = 2358 kcal
    assert.equal(res.targetCalories, 2358);
    // Protein: 80 * 2.2 = 176g
    assert.equal(res.macros.proteinGrams, 176);
    // Fat: 80 * 0.85 = 68g
    assert.equal(res.macros.fatGrams, 68);
    // Remainder for carbs: (2358 - 176*4 - 68*9) / 4 = (2358 - 704 - 612) / 4 = 1042 / 4 = 261g
    assert.equal(res.macros.carbsGrams, 261);
    // Water: 80 * 35 + 500 = 3300ml
    assert.equal(res.macros.waterMl, 3300);
  });

  it('clamps target calories above healthy biological minimums', () => {
    const res = calculateRecommendedNutrition({
      weightKg: 45,
      heightCm: 150,
      age: 40,
      sex: 'female',
      activityLevel: 'sedentary',
      goal: 'fat_loss',
      targetRateKgPerWeek: -1.0, // Aggressive deficit
    });

    assert.ok(res.targetCalories >= 1200);
  });
});
