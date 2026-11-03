import { FitnessGoal, MacroGoals, SexType, ActivityLevel } from '../types';

export interface ProfileCalculationParams {
  weightKg: number;
  heightCm: number;
  age?: number;
  sex?: SexType;
  activityLevel?: ActivityLevel;
  goal: FitnessGoal;
  targetRateKgPerWeek?: number;
}

export interface RecommendedNutrition {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  macros: MacroGoals;
}

/**
 * Calculates BMR using the Mifflin-St Jeor formula
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number = 25, sex: SexType = 'male'): number {
  const safeWeight = Math.max(30, Math.min(300, weightKg || 75));
  const safeHeight = Math.max(100, Math.min(250, heightCm || 175));
  const safeAge = Math.max(14, Math.min(100, age || 25));

  const base = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;

  if (sex === 'female') {
    return Math.round(base - 161);
  } else if (sex === 'other') {
    return Math.round(base - 78);
  }
  return Math.round(base + 5);
}

/**
 * Activity multipliers based on athletic frequency
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

/**
 * Calculates recommended calories and athletic macronutrient breakdown
 */
export function calculateRecommendedNutrition(params: ProfileCalculationParams): RecommendedNutrition {
  const {
    weightKg,
    heightCm,
    age = 26,
    sex = 'male',
    activityLevel = 'moderate',
    goal,
    targetRateKgPerWeek,
  } = params;

  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const maintenanceCalories = Math.round(bmr * multiplier);

  // Goal adjustment
  let rate = targetRateKgPerWeek;
  if (rate === undefined) {
    if (goal === 'fat_loss') rate = -0.4;
    else if (goal === 'muscle_gain') rate = 0.25;
    else if (goal === 'recomp') rate = -0.15;
    else rate = 0; // maintenance
  }

  // 1 kg of body tissue delta is ~ 7700 kcal -> daily delta = (rate * 7700) / 7 = rate * 1100
  const dailyDelta = Math.round(rate * 1100);
  const floorCalories = sex === 'female' ? 1200 : 1500;
  const targetCalories = Math.max(floorCalories, maintenanceCalories + dailyDelta);

  // Athletic Macro Ratios:
  // Protein: 2.0 - 2.2 g/kg (recomp/fat loss needs higher protein for muscle retention)
  const proteinMultiplier = goal === 'fat_loss' || goal === 'recomp' ? 2.2 : 2.0;
  const proteinGrams = Math.round(weightKg * proteinMultiplier);
  const proteinCals = proteinGrams * 4;

  // Fat: 0.85 - 0.9 g/kg (essential for hormone production & joint recovery)
  const fatGrams = Math.round(Math.max(45, weightKg * 0.85));
  const fatCals = fatGrams * 9;

  // Carbs: Remainder of daily energy
  const remainingCals = Math.max(200, targetCalories - proteinCals - fatCals);
  const carbsGrams = Math.round(remainingCals / 4);

  // Hydration: 35ml per kg of bodyweight + 500ml athletic baseline
  const waterMl = Math.round(weightKg * 35 + 500);

  return {
    bmr,
    maintenanceCalories,
    targetCalories,
    macros: {
      calories: targetCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      waterMl,
    },
  };
}

/**
 * Calculates effective daily macro targets considering calorie & macro cycling.
 * On training days with cycling enabled, calories shift by trainingDaysOffsetCalories (e.g. +200 kcal).
 * On rest days with cycling enabled, calories shift by restDaysOffsetCalories (e.g. -200 kcal).
 */
export function getEffectiveDailyTargets(
  baseMacros: MacroGoals,
  macroCycling?: { enabled: boolean; trainingDaysOffsetCalories: number; restDaysOffsetCalories: number },
  isTrainingDay: boolean = false
): MacroGoals {
  if (!macroCycling || !macroCycling.enabled) {
    return baseMacros;
  }

  const offset = isTrainingDay
    ? macroCycling.trainingDaysOffsetCalories
    : macroCycling.restDaysOffsetCalories;

  const adjustedCalories = Math.max(1200, baseMacros.calories + offset);
  const carbDeltaGrams = Math.round(offset / 4);
  const adjustedCarbs = Math.max(30, baseMacros.carbsGrams + carbDeltaGrams);

  return {
    ...baseMacros,
    calories: adjustedCalories,
    carbsGrams: adjustedCarbs,
  };
}
