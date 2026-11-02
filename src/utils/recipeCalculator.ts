import { RecipeIngredient } from '../types';

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeCalculationResult {
  total: MacroTotals;
  perServing: MacroTotals;
  servings: number;
}

/**
 * Calculates total and per-serving nutrition for a composite recipe
 */
export function calculateRecipeTotals(
  ingredients: RecipeIngredient[],
  servings: number = 1
): RecipeCalculationResult {
  const safeServings = Math.max(1, Math.round(servings) || 1);

  const total = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (Number(ing.calories) || 0),
      protein: acc.protein + (Number(ing.protein) || 0),
      carbs: acc.carbs + (Number(ing.carbs) || 0),
      fat: acc.fat + (Number(ing.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const perServing: MacroTotals = {
    calories: Math.round(total.calories / safeServings),
    protein: Number((total.protein / safeServings).toFixed(1)),
    carbs: Number((total.carbs / safeServings).toFixed(1)),
    fat: Number((total.fat / safeServings).toFixed(1)),
  };

  return {
    total: {
      calories: Math.round(total.calories),
      protein: Number(total.protein.toFixed(1)),
      carbs: Number(total.carbs.toFixed(1)),
      fat: Number(total.fat.toFixed(1)),
    },
    perServing,
    servings: safeServings,
  };
}

/**
 * Scales an ingredient from a base FoodItem given a new amount
 */
export function scaleIngredientFromFood(
  food: {
    id: string;
    name: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
  amount: number
): RecipeIngredient {
  const safeAmount = Math.max(0.1, Number(amount) || 1);
  const ratio = food.servingSize > 0 ? safeAmount / food.servingSize : 1;

  return {
    id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: food.id,
    name: food.name,
    amount: safeAmount,
    unit: food.servingUnit || 'g',
    calories: Math.round(food.calories * ratio),
    protein: Number((food.protein * ratio).toFixed(1)),
    carbs: Number((food.carbs * ratio).toFixed(1)),
    fat: Number((food.fat * ratio).toFixed(1)),
  };
}
