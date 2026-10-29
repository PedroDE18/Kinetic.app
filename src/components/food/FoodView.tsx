import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  Clock,
  Heart,
  X,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { LoggedFood, MealType } from '../../types';
import { getLocalDateString, formatDisplayDate, getRecentDateStrings } from '../../utils/engine';

interface FoodViewProps {
  onOpenAddModal: (mealType?: MealType, targetDate?: string) => void;
}

export function FoodView({ onOpenAddModal }: FoodViewProps) {
  const { state, removeLoggedFood, duplicateLoggedFood, updateLoggedFood, toggleFoodFavorite } = useFitness();
  const { loggedFoods, profile } = state;

  const todayStr = useMemo(() => getLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 30 days history list
  const recentDays = useMemo(() => getRecentDateStrings(30), []);

  const selectedFoods = useMemo(
    () => loggedFoods.filter((f) => f.loggedAt.startsWith(selectedDate)),
    [loggedFoods, selectedDate]
  );

  const [editingItem, setEditingItem] = useState<LoggedFood | null>(null);
  const [editServingCount, setEditServingCount] = useState<number>(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<LoggedFood | null>(null);

  // The library definition underneath a logged entry, for favorite control
  const detailLibraryFood = useMemo(() => {
    if (!detailItem) return null;
    return state.foodLibrary.find((f) => f.id === detailItem.foodId) || null;
  }, [detailItem, state.foodLibrary]);

  const mealTitle = (mt: LoggedFood['mealType']): string =>
    ({
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snacks',
    })[mt] || mt;

  // Aggregated totals for the selected date
  const totalNutrition = useMemo(() => {
    return selectedFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedFoods]);

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

  const changeDay = (offset: number) => {
    const currentIndex = recentDays.indexOf(selectedDate);
    if (currentIndex === -1) {
      setSelectedDate(todayStr);
      return;
    }
    const newIndex = currentIndex - offset;
    if (newIndex >= 0 && newIndex < recentDays.length) {
      setSelectedDate(recentDays[newIndex]);
    }
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 30-Day Date Navigator (Antigravity-inspired clean control) */}
      <section className="k-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDay(-1)}
            disabled={recentDays.indexOf(selectedDate) >= recentDays.length - 1}
            aria-label="Previous Day"
            className="h-10 w-10 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-accent)] font-semibold tracking-wider uppercase">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isToday ? 'Today' : formatDisplayDate(selectedDate)}</span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium tabular-nums">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          <button
            onClick={() => changeDay(1)}
            disabled={isToday}
            aria-label="Next Day"
            className="h-9 w-9 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 30-Day Quick Horizontal Carousel */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {recentDays.map((d) => {
            const isSel = d === selectedDate;
            const hasFood = loggedFoods.some((f) => f.loggedAt.startsWith(d));
            const dayObj = new Date(d + 'T12:00:00');
            const dayNum = dayObj.getDate();
            const dayInitial = dayObj.toLocaleDateString(undefined, { weekday: 'narrow' });

            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 flex flex-col items-center justify-center w-9 py-2 rounded-xl text-[11px] transition-all relative ${
                  isSel
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold shadow-sm'
                    : 'bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <span className="text-[9px] uppercase opacity-75">{dayInitial}</span>
                <span className="font-semibold tabular-nums mt-0.5">{dayNum}</span>
                {hasFood && !isSel && (
                  <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Nutrition Summary Bar */}
      <section className="k-card p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="k-section-title flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>{isToday ? "Today's intake" : `${formatDisplayDate(selectedDate)} intake`}</span>
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="k-display text-2xl text-[var(--color-text)] tabular-nums">{totalNutrition.calories}</span>
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">/ {profile.targets.calories} kcal</span>
            </div>
          </div>

          <button
            onClick={() => onOpenAddModal('breakfast', selectedDate)}
            className="min-h-[44px] px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Food</span>
          </button>
        </div>

        {/* Macro split chips */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-[var(--color-border)]">
          <div className="bg-[var(--color-surface-raised)] py-2 rounded-xl">
            <span className="text-[10px] text-[var(--color-success)] font-semibold block uppercase tracking-wide">Protein</span>
            <span className="font-bold text-[var(--color-text)] tabular-nums">
              {totalNutrition.protein.toFixed(0)} / {profile.targets.proteinGrams}g
            </span>
          </div>
          <div className="bg-[var(--color-surface-raised)] py-2 rounded-xl">
            <span className="text-[10px] text-[var(--color-warning)] font-semibold block uppercase tracking-wide">Carbs</span>
            <span className="font-bold text-[var(--color-text)] tabular-nums">
              {totalNutrition.carbs.toFixed(0)} / {profile.targets.carbsGrams}g
            </span>
          </div>
          <div className="bg-[var(--color-surface-raised)] py-2 rounded-xl">
            <span className="text-[10px] text-[var(--color-danger)] font-semibold block uppercase tracking-wide">Fat</span>
            <span className="font-bold text-[var(--color-text)] tabular-nums">
              {totalNutrition.fat.toFixed(0)} / {profile.targets.fatGrams}g
            </span>
          </div>
        </div>
      </section>

      {/* Meals Groups */}
      <div className="space-y-3">
        {meals.map(({ key, title }) => {
          const items = selectedFoods.filter((f) => f.mealType === key);
          const mealCals = items.reduce((sum, item) => sum + item.calories, 0);
          const mealProtein = items.reduce((sum, item) => sum + item.protein, 0);
          const mealCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
          const mealFat = items.reduce((sum, item) => sum + item.fat, 0);

          return (
            <section
              key={key}
              className="k-card p-4 transition-all"
            >
              {/* Meal Header */}
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-accent)] tabular-nums">
                      {mealCals} kcal
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                    P: {mealProtein.toFixed(0)}g • C: {mealCarbs.toFixed(0)}g • F:{' '}
                    {mealFat.toFixed(0)}g
                  </div>
                </div>

                <button
                  onClick={() => onOpenAddModal(key, selectedDate)}
                  aria-label={`Add food to ${title}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="py-3 text-center text-xs text-[var(--color-text-subtle)] border-t border-[var(--color-border)]">
                  No food logged in {title.toLowerCase()} for this date
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)] pt-1">
                  {items.map((item) => {
                    const libFood = state.foodLibrary.find((f) => f.id === item.foodId);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="w-full py-3 flex items-center justify-between gap-2 text-left rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors focus-visible:outline-[var(--color-accent)]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text)] truncate">{item.name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                            {item.servingCount}× {item.servingSize} {item.servingUnit} • P{' '}
                            {item.protein.toFixed(0)}g C {item.carbs.toFixed(0)}g F {item.fat.toFixed(0)}g
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {libFood?.isFavorite && (
                            <Heart className="w-3.5 h-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                          )}
                          <span className="text-xs font-semibold text-[var(--color-text)] tabular-nums">
                            {item.calories} kcal
                          </span>
                          <ChevronRight className="w-4 h-4 text-[var(--color-text-subtle)]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Item Detail Sheet — nutrition breakdown & actions */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in"
          onClick={() => setDetailItem(null)}
          role="presentation"
        >
          <div
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl mb-0 sm:mb-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="k-display text-lg text-[var(--color-text)] truncate">{detailItem.name}</h4>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                  {mealTitle(detailItem.mealType)} •{' '}
                  {new Date(detailItem.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                  {detailItem.servingCount}× {detailItem.servingSize} {detailItem.servingUnit}
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                aria-label="Close details"
                className="min-h-[44px] min-w-[44px] -mt-1.5 -mr-1.5 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nutrition for this entry */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[var(--color-surface-sunken)] rounded-xl p-2">
                <div className="text-[10px] font-semibold text-[var(--color-accent)] uppercase">kcal</div>
                <div className="text-sm font-semibold text-[var(--color-text)] tabular-nums">{detailItem.calories}</div>
              </div>
              <div className="bg-[var(--color-surface-sunken)] rounded-xl p-2">
                <div className="text-[10px] font-semibold text-[var(--color-success)] uppercase">protein</div>
                <div className="text-sm font-semibold text-[var(--color-text)] tabular-nums">
                  {detailItem.protein.toFixed(1)}
                </div>
              </div>
              <div className="bg-[var(--color-surface-sunken)] rounded-xl p-2">
                <div className="text-[10px] font-semibold text-[var(--color-warning)] uppercase">carbs</div>
                <div className="text-sm font-semibold text-[var(--color-text)] tabular-nums">
                  {detailItem.carbs.toFixed(1)}
                </div>
              </div>
              <div className="bg-[var(--color-surface-sunken)] rounded-xl p-2">
                <div className="text-[10px] font-semibold text-[var(--color-danger)] uppercase">fat</div>
                <div className="text-sm font-semibold text-[var(--color-text)] tabular-nums">
                  {detailItem.fat.toFixed(1)}
                </div>
              </div>
            </div>

            {detailItem.fiber ? (
              <div className="text-[11px] text-[var(--color-text-muted)]">
                Fiber: {detailItem.fiber.toFixed(1)} g
              </div>
            ) : null}

            {detailLibraryFood && (
              <button
                type="button"
                onClick={() => toggleFoodFavorite(detailLibraryFood.id)}
                className="min-h-[44px] w-full py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
              >
                <Heart
                  className={`w-4 h-4 ${
                    detailLibraryFood.isFavorite
                      ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                />
                <span>
                  {(detailLibraryFood.isFavorite ? 'Remove from' : 'Save to')} favorites
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handleStartEdit(detailItem);
                  setDetailItem(null);
                }}
                className="min-h-[44px] py-2.5 bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-semibold rounded-xl border border-[var(--color-border)] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit serving</span>
              </button>
              <button
                onClick={() => {
                  duplicateLoggedFood(detailItem.id);
                  setDetailItem(null);
                }}
                className="min-h-[44px] py-2.5 bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-semibold rounded-xl border border-[var(--color-border)] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            </div>

            <button
              onClick={() => {
                setDetailItem(null);
                setDeleteConfirmId(detailItem.id);
              }}
              className="min-h-[44px] w-full py-2.5 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove entry</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Serving Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-[var(--color-text)] text-sm">Edit Serving Quantity</h4>
            <div className="text-xs text-[var(--color-text-muted)] font-semibold">{editingItem.name}</div>

            <div className="flex items-center justify-between bg-[var(--color-surface-sunken)] p-3 rounded-xl border border-[var(--color-border)]">
              <span className="text-xs text-[var(--color-text-muted)]">Servings multiplier:</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={editServingCount}
                onChange={(e) =>
                  setEditServingCount(Math.max(0.1, parseFloat(e.target.value) || 0.1))
                }
                className="w-18 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 text-center text-sm font-bold text-[var(--color-text)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] rounded-xl text-xs font-semibold text-[var(--color-text-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="min-h-[44px] py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs shadow-sm"
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
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-[var(--color-text)] text-sm">Remove Food Entry?</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              This will remove the food item from this day's diary and update your daily calorie totals.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] rounded-xl text-xs font-semibold text-[var(--color-text-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeLoggedFood(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="min-h-[44px] py-2 bg-[var(--color-danger)] hover:bg-[var(--color-danger)] text-[var(--color-text)] font-bold rounded-xl text-xs shadow-sm"
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
