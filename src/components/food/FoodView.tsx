import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LoggedFood, MealType } from '../../types';

interface FoodViewProps {
  onOpenAddModal: (mealType?: MealType) => void;
}

export function FoodView({ onOpenAddModal }: FoodViewProps) {
  const { state, removeLoggedFood, duplicateLoggedFood, updateLoggedFood } = useFitness();
  const { loggedFoods, profile } = state;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFoods = useMemo(
    () => loggedFoods.filter((f) => f.loggedAt.startsWith(todayStr)),
    [loggedFoods, todayStr]
  );

  const [editingItem, setEditingItem] = useState<LoggedFood | null>(null);
  const [editServingCount, setEditServingCount] = useState<number>(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Aggregated totals
  const totalNutrition = useMemo(() => {
    return todayFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayFoods]);

  const meals: { key: MealType; title: string }[] = [
    { key: 'breakfast', title: 'Breakfast' },
    { key: 'lunch', title: 'Lunch' },
    { key: 'dinner', title: 'Dinner' },
    { key: 'snack', title: 'Snacks' },
  ];

  const handleStartEdit = (food: LoggedFood) => {
    setEditingItem(food);
    setEditServingCount(food.servingCount);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const count = Math.max(0.1, editServingCount);
    // Base nutrients per 1 serving count
    const baseCals = editingItem.calories / editingItem.servingCount;
    const baseProtein = editingItem.protein / editingItem.servingCount;
    const baseCarbs = editingItem.carbs / editingItem.servingCount;
    const baseFat = editingItem.fat / editingItem.servingCount;

    const updated: LoggedFood = {
      ...editingItem,
      servingCount: count,
      calories: Math.round(baseCals * count),
      protein: Number((baseProtein * count).toFixed(1)),
      carbs: Number((baseCarbs * count).toFixed(1)),
      fat: Number((baseFat * count).toFixed(1)),
    };
    updateLoggedFood(updated);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Nutrition Summary Bar */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Today's Intake
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{totalNutrition.calories}</span>
              <span className="text-xs text-zinc-400">/ {profile.targets.calories} kcal</span>
            </div>
          </div>

          <button
            onClick={() => onOpenAddModal('breakfast')}
            className="min-h-[44px] px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Food</span>
          </button>
        </div>

        {/* Macro split chips */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-zinc-800/80">
          <div className="bg-zinc-950/80 py-2 rounded-xl">
            <span className="text-[10px] text-emerald-400 font-semibold block">PROTEIN</span>
            <span className="font-bold text-zinc-100">
              {totalNutrition.protein.toFixed(0)} / {profile.targets.proteinGrams}g
            </span>
          </div>
          <div className="bg-zinc-950/80 py-2 rounded-xl">
            <span className="text-[10px] text-amber-400 font-semibold block">CARBS</span>
            <span className="font-bold text-zinc-100">
              {totalNutrition.carbs.toFixed(0)} / {profile.targets.carbsGrams}g
            </span>
          </div>
          <div className="bg-zinc-950/80 py-2 rounded-xl">
            <span className="text-[10px] text-rose-400 font-semibold block">FAT</span>
            <span className="font-bold text-zinc-100">
              {totalNutrition.fat.toFixed(0)} / {profile.targets.fatGrams}g
            </span>
          </div>
        </div>
      </section>

      {/* Meals Groups */}
      <div className="space-y-3">
        {meals.map(({ key, title }) => {
          const items = todayFoods.filter((f) => f.mealType === key);
          const mealCals = items.reduce((sum, item) => sum + item.calories, 0);
          const mealProtein = items.reduce((sum, item) => sum + item.protein, 0);
          const mealCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
          const mealFat = items.reduce((sum, item) => sum + item.fat, 0);

          return (
            <section
              key={key}
              className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-4 transition-all shadow-sm"
            >
              {/* Meal Header */}
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-teal-300">
                      {mealCals} kcal
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    P: {mealProtein.toFixed(0)}g • C: {mealCarbs.toFixed(0)}g • F:{' '}
                    {mealFat.toFixed(0)}g
                  </div>
                </div>

                <button
                  onClick={() => onOpenAddModal(key)}
                  aria-label={`Add food to ${title}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-teal-400 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="py-3 text-center text-xs text-zinc-500 border-t border-zinc-800/60">
                  No food logged in {title.toLowerCase()}
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60 border-t border-zinc-800/60 pt-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <div className="text-xs font-bold text-zinc-100">{item.name}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {item.servingCount}× {item.servingSize} {item.servingUnit} • {item.protein}
                          g P • {item.carbs}g C • {item.fat}g F
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200">{item.calories} kcal</span>

                        {/* Item Action Buttons */}
                        <div className="flex items-center">
                          <button
                            onClick={() => duplicateLoggedFood(item.id)}
                            aria-label="Duplicate entry"
                            className="min-h-[38px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-zinc-200"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(item)}
                            aria-label="Edit serving size"
                            className="min-h-[38px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-teal-400"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            aria-label="Delete entry"
                            className="min-h-[38px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Edit Serving Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Edit Serving Quantity</h4>
            <div className="text-xs text-zinc-300 font-semibold">{editingItem.name}</div>

            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs text-zinc-400">Servings multiplier:</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={editServingCount}
                onChange={(e) =>
                  setEditServingCount(Math.max(0.1, parseFloat(e.target.value) || 0.1))
                }
                className="w-18 bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-center text-sm font-bold text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="min-h-[44px] py-2 bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="min-h-[44px] py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs shadow-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Remove Food Entry?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will remove the food item from today's diary and update your daily calorie totals.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="min-h-[44px] py-2 bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeLoggedFood(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="min-h-[44px] py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
