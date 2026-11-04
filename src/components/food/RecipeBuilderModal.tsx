import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChefHat,
  Search,
  Check,
  Scale,
  Utensils,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { FoodItem, LoggedFood, MealType, RecipeIngredient } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { calculateRecipeTotals, scaleIngredientFromFood } from '../../utils/recipeCalculator';

interface RecipeBuilderModalProps {
  onClose: () => void;
  targetDate?: string;
  onRecipeSavedAndLogged?: (loggedFood: LoggedFood) => void;
}

export function RecipeBuilderModal({
  onClose,
  targetDate,
  onRecipeSavedAndLogged,
}: RecipeBuilderModalProps) {
  useBodyScrollLock(true);
  const { state, addFoodToLibrary, addLoggedFood } = useFitness();

  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState<number>(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [viewMode, setViewMode] = useState<'per_serving' | 'total'>('per_serving');

  // Ingredient Picker Drawer/Selector
  const [isPickingIngredient, setIsPickingIngredient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [pickerAmount, setPickerAmount] = useState<number>(100);

  // Manual custom ingredient fallback
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('100');
  const [customUnit, setCustomUnit] = useState('g');
  const [customCals, setCustomCals] = useState('150');
  const [customProtein, setCustomProtein] = useState('10');
  const [customCarbs, setCustomCarbs] = useState('15');
  const [customFat, setCustomFat] = useState('5');

  // Save & Log target meal
  const [logMealType, setLogMealType] = useState<MealType>('breakfast');

  // Filter food library for ingredient search
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return state.foodLibrary.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return state.foodLibrary.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q)) ||
        (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }, [state.foodLibrary, searchQuery]);

  // Calculate live nutrition totals
  const totals = useMemo(() => {
    return calculateRecipeTotals(ingredients, servings);
  }, [ingredients, servings]);

  const displayedMacros = viewMode === 'per_serving' ? totals.perServing : totals.total;

  const handleAddSelectedFoodIngredient = () => {
    if (!selectedFood) return;
    const ing = scaleIngredientFromFood(selectedFood, pickerAmount);
    setIngredients((prev) => [...prev, ing]);
    setSelectedFood(null);
    setIsPickingIngredient(false);
    setSearchQuery('');
  };

  const handleAddCustomIngredient = () => {
    if (!customName.trim()) return;
    const amt = parseFloat(customAmount) || 100;
    const newIng: RecipeIngredient = {
      id: `ing-custom-${Date.now()}`,
      name: customName.trim(),
      amount: amt,
      unit: customUnit.trim() || 'g',
      calories: Math.max(0, parseInt(customCals, 10) || 0),
      protein: Math.max(0, parseFloat(customProtein) || 0),
      carbs: Math.max(0, parseFloat(customCarbs) || 0),
      fat: Math.max(0, parseFloat(customFat) || 0),
    };
    setIngredients((prev) => [...prev, newIng]);
    setCustomName('');
    setIsCustomMode(false);
    setIsPickingIngredient(false);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateIngredientAmount = (id: string, newAmount: number) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        const safeAmt = Math.max(0.1, newAmount);
        const ratio = ing.amount > 0 ? safeAmt / ing.amount : 1;
        return {
          ...ing,
          amount: safeAmt,
          calories: Math.round(ing.calories * ratio),
          protein: Number((ing.protein * ratio).toFixed(1)),
          carbs: Number((ing.carbs * ratio).toFixed(1)),
          fat: Number((ing.fat * ratio).toFixed(1)),
        };
      })
    );
  };

  const createCompositeFoodItem = (): FoodItem => {
    const safeName = recipeName.trim() || 'My Custom Recipe';
    return {
      id: `recipe-${Date.now()}`,
      name: safeName,
      brand: 'Custom Recipe',
      category: 'Meals',
      servingSize: 1,
      servingUnit: 'serving',
      calories: totals.perServing.calories,
      protein: totals.perServing.protein,
      carbs: totals.perServing.carbs,
      fat: totals.perServing.fat,
      isFavorite: true,
      source: `Yields ${servings} serving${servings > 1 ? 's' : ''}`,
      recipeIngredients: ingredients,
    };
  };

  const handleSaveToLibrary = () => {
    if (ingredients.length === 0) return;
    const foodItem = createCompositeFoodItem();
    addFoodToLibrary(foodItem);
    onClose();
  };

  const handleSaveAndLog = () => {
    if (ingredients.length === 0) return;
    const foodItem = createCompositeFoodItem();
    addFoodToLibrary(foodItem);

    const logTimestamp = targetDate ? `${targetDate}T12:00:00.000Z` : new Date().toISOString();
    const newLoggedFood: LoggedFood = {
      id: `food-log-${Date.now()}`,
      foodId: foodItem.id,
      mealType: logMealType,
      name: foodItem.name,
      servingCount: 1,
      servingSize: 1,
      servingUnit: 'serving',
      calories: totals.perServing.calories,
      protein: totals.perServing.protein,
      carbs: totals.perServing.carbs,
      fat: totals.perServing.fat,
      loggedAt: logTimestamp,
    };

    addLoggedFood(newLoggedFood);
    if (onRecipeSavedAndLogged) {
      onRecipeSavedAndLogged(newLoggedFood);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] w-full max-w-xl max-h-[92vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <ChefHat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">Recipe & Meal Builder</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Consolidate multiple ingredients into one meal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center hover:text-[var(--color-text)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Recipe Name & Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Recipe / Meal Name
              </label>
              <input
                type="text"
                placeholder="e.g. Protein Power Oats, Batch Chicken Bowls"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Servings Yield
              </label>
              <div className="flex items-center bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-9 h-10 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-base font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="flex-1 bg-transparent text-center font-bold text-sm text-[var(--color-text)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="w-9 h-10 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-base font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Macro Overview Card */}
          <div className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Scale className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Calculated Nutrition</span>
              </div>

              {/* Toggle: Per Serving vs Total Recipe */}
              <div className="flex bg-[var(--color-surface-raised)] p-0.5 rounded-lg border border-[var(--color-border)] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('per_serving')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    viewMode === 'per_serving'
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Per Serving (1/{servings})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('total')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    viewMode === 'total'
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Full Recipe Total
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[var(--color-surface-raised)] rounded-xl py-2 px-1">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">Calories</span>
                <span className="text-base font-bold text-[var(--color-text)] tabular-nums">
                  {displayedMacros.calories}
                  <span className="text-[10px] font-normal text-[var(--color-text-muted)] ml-0.5">kcal</span>
                </span>
              </div>
              <div className="bg-[var(--color-surface-raised)] rounded-xl py-2 px-1">
                <span className="text-[10px] text-[var(--color-success)] uppercase font-semibold block">Protein</span>
                <span className="text-base font-bold text-[var(--color-text)] tabular-nums">
                  {displayedMacros.protein}g
                </span>
              </div>
              <div className="bg-[var(--color-surface-raised)] rounded-xl py-2 px-1">
                <span className="text-[10px] text-[var(--color-warning)] uppercase font-semibold block">Carbs</span>
                <span className="text-base font-bold text-[var(--color-text)] tabular-nums">
                  {displayedMacros.carbs}g
                </span>
              </div>
              <div className="bg-[var(--color-surface-raised)] rounded-xl py-2 px-1">
                <span className="text-[10px] text-[var(--color-danger)] uppercase font-semibold block">Fat</span>
                <span className="text-base font-bold text-[var(--color-text)] tabular-nums">
                  {displayedMacros.fat}g
                </span>
              </div>
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
                <Layers className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Ingredients ({ingredients.length})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPickingIngredient(true);
                  setIsCustomMode(false);
                  setSelectedFood(null);
                }}
                className="px-2.5 py-1 bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Ingredient</span>
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="p-6 border border-dashed border-[var(--color-border)] rounded-2xl text-center space-y-2">
                <Utensils className="w-6 h-6 mx-auto text-[var(--color-text-muted)] opacity-50" />
                <p className="text-xs text-[var(--color-text-muted)]">
                  No ingredients added yet. Tap <strong>Add Ingredient</strong> to start building your meal.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="p-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[var(--color-text)] truncate">{ing.name}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {ing.calories} kcal • {ing.protein}g P • {ing.carbs}g C • {ing.fat}g F
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={ing.amount}
                          onChange={(e) =>
                            handleUpdateIngredientAmount(ing.id, parseFloat(e.target.value) || 1)
                          }
                          className="w-12 bg-transparent text-center font-bold text-xs text-[var(--color-text)] focus:outline-none"
                        />
                        <span className="text-[10px] text-[var(--color-text-muted)] ml-1 font-medium">
                          {ing.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ing.id)}
                        className="w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 flex items-center justify-center transition-all"
                        aria-label="Remove ingredient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Ingredient Drawer Modal (Nested) */}
          {isPickingIngredient && (
            <div className="p-4 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text)]">
                  {isCustomMode ? 'New Custom Ingredient' : 'Select Ingredient from Library'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-[11px] text-[var(--color-accent)] font-semibold underline"
                  >
                    {isCustomMode ? 'Pick from Library' : 'Add Custom Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPickingIngredient(false)}
                    className="w-6 h-6 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isCustomMode ? (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Ingredient Name (e.g. Chia seeds)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[9px] text-[var(--color-text-muted)] block uppercase font-semibold">Amount</span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1.5 text-xs text-center font-bold text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-text-muted)] block uppercase font-semibold">Calories</span>
                      <input
                        type="number"
                        value={customCals}
                        onChange={(e) => setCustomCals(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1.5 text-xs text-center font-bold text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-success)] block uppercase font-semibold">Protein (g)</span>
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1.5 text-xs text-center font-bold text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-warning)] block uppercase font-semibold">Carbs (g)</span>
                      <input
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1.5 text-xs text-center font-bold text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomIngredient}
                    disabled={!customName.trim()}
                    className="w-full py-2 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs disabled:opacity-40"
                  >
                    Add Ingredient
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search food library..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {selectedFood ? (
                    <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-accent)]/50 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--color-text)]">{selectedFood.name}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          Base: {selectedFood.servingSize} {selectedFood.servingUnit} ({selectedFood.calories} kcal)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                          Amount in recipe:
                        </label>
                        <div className="flex items-center bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg px-2 py-1">
                          <input
                            type="number"
                            min="1"
                            value={pickerAmount}
                            onChange={(e) => setPickerAmount(parseFloat(e.target.value) || 1)}
                            className="w-16 bg-transparent text-center font-bold text-xs text-[var(--color-text)] focus:outline-none"
                          />
                          <span className="text-[11px] text-[var(--color-text-muted)] ml-1">
                            {selectedFood.servingUnit}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedFood(null)}
                          className="flex-1 py-1.5 bg-[var(--color-surface-raised)] rounded-lg text-xs font-semibold text-[var(--color-text-muted)]"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleAddSelectedFoodIngredient}
                          className="flex-1 py-1.5 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold rounded-lg text-xs"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredLibrary.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => {
                            setSelectedFood(food);
                            setPickerAmount(food.servingSize);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-[var(--color-surface)] flex items-center justify-between text-xs transition-all"
                        >
                          <div className="truncate pr-2">
                            <span className="font-semibold text-[var(--color-text)]">{food.name}</span>
                            {food.brand && (
                              <span className="text-[10px] text-[var(--color-text-muted)] ml-1.5">({food.brand})</span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
                            {food.calories} kcal / {food.servingSize}{food.servingUnit}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold">Log to:</span>
            <select
              value={logMealType}
              onChange={(e) => setLogMealType(e.target.value as MealType)}
              className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)] focus:outline-none"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snacks</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={ingredients.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]/80 text-[var(--color-text)] font-semibold rounded-xl text-xs active:scale-95 transition-all disabled:opacity-40"
            >
              Save to Library
            </button>
            <button
              type="button"
              onClick={handleSaveAndLog}
              disabled={ingredients.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save & Log 1 Serving</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
