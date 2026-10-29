import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, X, Heart, Utensils, Check, Trash2, Database, Info } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { FoodItem, LoggedFood, MealType, ParsedAiFoodItem } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface AddFoodModalProps {
  initialMealType?: MealType;
  targetDate?: string;
  onClose: () => void;
}

export function AddFoodModal({ initialMealType = 'breakfast', targetDate, onClose }: AddFoodModalProps) {
  useBodyScrollLock(true);
  const { state, addLoggedFood, toggleFoodFavorite, addFoodToLibrary } = useFitness();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType);
  const [activeTab, setActiveTab] = useState<'database' | 'ai_describe' | 'custom'>('database');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);

  const getLogTimestamp = () => {
    if (!targetDate) return new Date().toISOString();
    return `${targetDate}T12:00:00.000Z`;
  };

  // Multi-Part AI Describe State
  const [aiMealPrompt, setAiMealPrompt] = useState('greek yogurt with a standard banana and seed mix');
  const [aiIsEstimating, setAiIsEstimating] = useState(false);
  const [aiItemizedParts, setAiItemizedParts] = useState<ParsedAiFoodItem[] | null>(null);

  // Custom Food Creator State
  const [customName, setCustomName] = useState('');
  const [customServingSize, setCustomServingSize] = useState('100');
  const [customServingUnit, setCustomServingUnit] = useState('g');
  const [customCalories, setCustomCalories] = useState('200');
  const [customProtein, setCustomProtein] = useState('20');
  const [customCarbs, setCustomCarbs] = useState('15');
  const [customFat, setCustomFat] = useState('5');

  // Filtered foods
  const filteredFoods = useMemo(() => {
    return state.foodLibrary.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Favorites'
          ? item.isFavorite
          : item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [state.foodLibrary, searchQuery, selectedCategory]);

  const handleConfirmAddSelectedFood = () => {
    if (!selectedFood) return;
    const count = Math.max(0.1, servingMultiplier);
    const newEntry: LoggedFood = {
      id: `food-log-${Date.now()}`,
      foodId: selectedFood.id,
      mealType: selectedMeal,
      name: selectedFood.name,
      servingCount: count,
      servingSize: selectedFood.servingSize,
      servingUnit: selectedFood.servingUnit,
      calories: Math.round(selectedFood.calories * count),
      protein: Number((selectedFood.protein * count).toFixed(1)),
      carbs: Number((selectedFood.carbs * count).toFixed(1)),
      fat: Number((selectedFood.fat * count).toFixed(1)),
      fiber: selectedFood.fiber ? Number((selectedFood.fiber * count).toFixed(1)) : undefined,
      loggedAt: getLogTimestamp(),
    };
    addLoggedFood(newEntry);
    onClose();
  };

  // Itemized Multi-Part Parsing Simulation
  const handleSimulateAiEstimation = () => {
    if (!aiMealPrompt.trim()) return;
    setAiIsEstimating(true);
    setTimeout(() => {
      const promptLower = aiMealPrompt.toLowerCase();
      const parts: ParsedAiFoodItem[] = [];

      // Check for yogurt
      if (promptLower.includes('yogurt')) {
        parts.push({
          id: `ai-part-${Date.now()}-1`,
          name: 'Greek Yogurt 0% (Fage Total)',
          servingCount: 1,
          servingSize: 200,
          servingUnit: 'g',
          calories: 108,
          protein: 20.6,
          carbs: 6.0,
          fat: 0,
        });
      }

      // Check for banana or fruit
      if (promptLower.includes('banana')) {
        parts.push({
          id: `ai-part-${Date.now()}-2`,
          name: 'Fresh Banana',
          servingCount: 1,
          servingSize: 118,
          servingUnit: 'medium (118g)',
          calories: 105,
          protein: 1.3,
          carbs: 27.0,
          fat: 0.3,
        });
      } else if (promptLower.includes('berry') || promptLower.includes('blueberries')) {
        parts.push({
          id: `ai-part-${Date.now()}-2b`,
          name: 'Fresh Blueberries',
          servingCount: 1,
          servingSize: 100,
          servingUnit: 'g',
          calories: 57,
          protein: 0.7,
          carbs: 14.5,
          fat: 0.3,
        });
      }

      // Check for seeds or nuts
      if (promptLower.includes('seed') || promptLower.includes('chia') || promptLower.includes('flax')) {
        parts.push({
          id: `ai-part-${Date.now()}-3`,
          name: 'Chia & Hemp Seed Mix',
          servingCount: 1,
          servingSize: 20,
          servingUnit: 'g (2 tbsp)',
          calories: 105,
          protein: 4.2,
          carbs: 4.8,
          fat: 7.2,
        });
      } else if (promptLower.includes('nut') || promptLower.includes('almond') || promptLower.includes('peanut')) {
        parts.push({
          id: `ai-part-${Date.now()}-3b`,
          name: 'Raw Almonds',
          servingCount: 1,
          servingSize: 30,
          servingUnit: 'g',
          calories: 170,
          protein: 6.0,
          carbs: 6.0,
          fat: 15.0,
        });
      }

      // Check for eggs
      if (promptLower.includes('egg') || promptLower.includes('omelet')) {
        parts.push({
          id: `ai-part-${Date.now()}-4`,
          name: 'Pasture-Raised Eggs',
          servingCount: 2,
          servingSize: 2,
          servingUnit: 'large eggs',
          calories: 144,
          protein: 12.6,
          carbs: 0.8,
          fat: 9.8,
        });
      }

      // Check for toast / bread
      if (promptLower.includes('toast') || promptLower.includes('bread') || promptLower.includes('sourdough')) {
        parts.push({
          id: `ai-part-${Date.now()}-5`,
          name: 'Sourdough Bread',
          servingCount: 1,
          servingSize: 50,
          servingUnit: 'slice (50g)',
          calories: 120,
          protein: 4.5,
          carbs: 23.0,
          fat: 1.0,
        });
      }

      // Check for avocado
      if (promptLower.includes('avocado')) {
        parts.push({
          id: `ai-part-${Date.now()}-6`,
          name: 'Fresh Hass Avocado',
          servingCount: 1,
          servingSize: 75,
          servingUnit: 'half fruit (75g)',
          calories: 120,
          protein: 1.5,
          carbs: 6.5,
          fat: 11.0,
        });
      }

      // Check for chicken / poultry
      if (promptLower.includes('chicken') || promptLower.includes('breast')) {
        parts.push({
          id: `ai-part-${Date.now()}-7`,
          name: 'Grilled Chicken Breast',
          servingCount: 1,
          servingSize: 150,
          servingUnit: 'g',
          calories: 248,
          protein: 46.0,
          carbs: 0,
          fat: 5.4,
        });
      }

      // Check for rice / carbs
      if (promptLower.includes('rice')) {
        parts.push({
          id: `ai-part-${Date.now()}-8`,
          name: 'Jasmine Rice (Cooked)',
          servingCount: 1,
          servingSize: 150,
          servingUnit: 'g',
          calories: 195,
          protein: 3.8,
          carbs: 43.0,
          fat: 0.5,
        });
      }

      // Fallback if none matched
      if (parts.length === 0) {
        parts.push({
          id: `ai-part-${Date.now()}-custom`,
          name: aiMealPrompt.trim(),
          servingCount: 1,
          servingSize: 1,
          servingUnit: 'portion',
          calories: 450,
          protein: 30,
          carbs: 45,
          fat: 15,
        });
      }

      setAiItemizedParts(parts);
      setAiIsEstimating(false);
    }, 400);
  };

  const handleUpdateItemizedPart = (index: number, field: keyof ParsedAiFoodItem, value: any) => {
    if (!aiItemizedParts) return;
    const updated = [...aiItemizedParts];
    updated[index] = { ...updated[index], [field]: value };
    setAiItemizedParts(updated);
  };

  const handleRemoveItemizedPart = (index: number) => {
    if (!aiItemizedParts) return;
    setAiItemizedParts(aiItemizedParts.filter((_, i) => i !== index));
  };

  // Confirm logging all itemized individual entries into the meal
  const handleConfirmAllItemizedEntries = () => {
    if (!aiItemizedParts || aiItemizedParts.length === 0) return;

    aiItemizedParts.forEach((part, idx) => {
      const newEntry: LoggedFood = {
        id: `ai-part-logged-${Date.now()}-${idx}`,
        foodId: `f-ai-${idx}`,
        mealType: selectedMeal,
        name: part.name,
        servingCount: part.servingCount,
        servingSize: part.servingSize,
        servingUnit: part.servingUnit,
        calories: Math.round(part.calories * part.servingCount),
        protein: Number((part.protein * part.servingCount).toFixed(1)),
        carbs: Number((part.carbs * part.servingCount).toFixed(1)),
        fat: Number((part.fat * part.servingCount).toFixed(1)),
        loggedAt: getLogTimestamp(),
      };
      addLoggedFood(newEntry);
    });

    onClose();
  };

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const food: FoodItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      servingSize: parseFloat(customServingSize) || 100,
      servingUnit: customServingUnit || 'g',
      calories: parseInt(customCalories) || 150,
      protein: parseFloat(customProtein) || 10,
      carbs: parseFloat(customCarbs) || 10,
      fat: parseFloat(customFat) || 5,
      source: 'User Custom Food Entry',
      isFavorite: true,
    };
    addFoodToLibrary(food);
    setSelectedFood(food);
    setActiveTab('database');
  };

  const aiTotalNutrients = useMemo(() => {
    if (!aiItemizedParts) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return aiItemizedParts.reduce(
      (acc, p) => ({
        calories: acc.calories + Math.round(p.calories * p.servingCount),
        protein: acc.protein + Number((p.protein * p.servingCount).toFixed(1)),
        carbs: acc.carbs + Number((p.carbs * p.servingCount).toFixed(1)),
        fat: acc.fat + Number((p.fat * p.servingCount).toFixed(1)),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [aiItemizedParts]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        style={{ overscrollBehavior: 'contain' }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[var(--color-text)] text-sm">Log Food Entry</h3>
            <span className="text-[11px] text-[var(--color-text-muted)] capitalize">Adding to {selectedMeal}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meal Selector Bar */}
        <div className="grid grid-cols-4 p-2 bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-xs">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`min-h-[36px] py-1.5 rounded-lg capitalize font-medium transition-all ${
                selectedMeal === meal
                  ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] font-bold shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {meal}
            </button>
          ))}
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-[var(--color-border)] text-xs font-semibold bg-[var(--color-surface-sunken)]">
          <button
            onClick={() => {
              setActiveTab('database');
              setSelectedFood(null);
            }}
            className={`min-h-[40px] py-2 text-center transition-all ${
              activeTab === 'database'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Food Library
          </button>
          <button
            onClick={() => setActiveTab('ai_describe')}
            className={`min-h-[40px] py-2 text-center flex items-center justify-center gap-1 transition-all ${
              activeTab === 'ai_describe'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Describe</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`min-h-[40px] py-2 text-center transition-all ${
              activeTab === 'custom'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            + Create New
          </button>
        </div>

        {/* Modal Body with Isolated Scrolling */}
        <div className="p-4 flex-1 overflow-y-auto no-scrollbar" style={{ overscrollBehavior: 'contain' }}>
          {/* TAB 1: FOOD LIBRARY & CUSTOMIZER */}
          {activeTab === 'database' && (
            <>
              {selectedFood ? (
                /* Selected Food Detail Screen */
                <div className="space-y-4 animate-in fade-in">
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="min-h-[36px] text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1"
                  >
                    ← Back to food list
                  </button>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[var(--color-text)]">{selectedFood.name}</h4>
                      <button
                        onClick={() => toggleFoodFavorite(selectedFood.id)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            selectedFood.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {selectedFood.brand || 'Standard Reference'} • {selectedFood.servingSize}{' '}
                      {selectedFood.servingUnit} base serving
                    </span>
                    {selectedFood.source && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-text-subtle)]">
                        <Database className="w-3 h-3 text-[var(--color-accent)]" />
                        <span>Source: {selectedFood.source}</span>
                      </div>
                    )}
                  </div>

                  {/* Serving Size Adjuster */}
                  <div className="bg-[var(--color-surface-sunken)] p-4 rounded-2xl border border-[var(--color-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                        Number of Servings:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="20"
                          value={servingMultiplier}
                          onChange={(e) =>
                            setServingMultiplier(Math.max(0.1, parseFloat(e.target.value) || 0.1))
                          }
                          className="w-18 bg-[var(--color-surface)] border border-[var(--color-border)] text-center py-1.5 rounded-lg text-sm font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">
                          = {Math.round(selectedFood.servingSize * servingMultiplier)}{' '}
                          {selectedFood.servingUnit}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stepper Buttons */}
                    <div className="flex gap-2">
                      {[0.5, 1.0, 1.5, 2.0].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setServingMultiplier(step)}
                          className={`min-h-[36px] flex-1 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            servingMultiplier === step
                              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent)]'
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {step}×
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Recalculated Nutrient Breakdown */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--color-border)] text-center">
                      <div className="bg-[var(--color-surface)] p-2 rounded-xl">
                        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">
                          Calories
                        </div>
                        <div className="text-sm font-black text-[var(--color-text)] mt-0.5">
                          {Math.round(selectedFood.calories * servingMultiplier)}
                        </div>
                      </div>
                      <div className="bg-[var(--color-surface)] p-2 rounded-xl">
                        <div className="text-[10px] font-semibold text-[var(--color-success)] uppercase">
                          Protein
                        </div>
                        <div className="text-sm font-bold text-[var(--color-success)] mt-0.5">
                          {(selectedFood.protein * servingMultiplier).toFixed(1)}g
                        </div>
                      </div>
                      <div className="bg-[var(--color-surface)] p-2 rounded-xl">
                        <div className="text-[10px] font-semibold text-[var(--color-warning)] uppercase">
                          Carbs
                        </div>
                        <div className="text-sm font-bold text-[var(--color-warning)] mt-0.5">
                          {(selectedFood.carbs * servingMultiplier).toFixed(1)}g
                        </div>
                      </div>
                      <div className="bg-[var(--color-surface)] p-2 rounded-xl">
                        <div className="text-[10px] font-semibold text-[var(--color-danger)] uppercase">
                          Fat
                        </div>
                        <div className="text-sm font-bold text-[var(--color-danger)] mt-0.5">
                          {(selectedFood.fat * servingMultiplier).toFixed(1)}g
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleConfirmAddSelectedFood}
                    className="min-h-[48px] w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add to {selectedMeal}</span>
                  </button>
                </div>
              ) : (
                /* Food Search & Category Filtering */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search foods, brands..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="min-h-[44px] w-full pl-9 pr-3 py-2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {['All', 'Favorites', 'Protein', 'Carbohydrates', 'Fats', 'Produce', 'Dairy'].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`min-h-[34px] px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                            selectedCategory === cat
                              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold'
                              : 'bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>

                  {/* Database Info Notice */}
                  <div className="p-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                      <span>Standard Reference Database</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-subtle)]">USDA FoodData Central</span>
                  </div>

                  {/* Food Results List */}
                  {filteredFoods.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--color-text-subtle)]">
                      No foods found matching "{searchQuery}".
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {filteredFoods.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedFood(item);
                            setServingMultiplier(1);
                          }}
                          className="min-h-[48px] w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-[var(--color-surface-raised)]/40 rounded-xl transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)]">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {item.servingSize} {item.servingUnit} • {item.calories} kcal • P:{' '}
                              {item.protein}g C: {item.carbs}g F: {item.fat}g
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.isFavorite && (
                              <Heart className="w-3.5 h-3.5 fill-rose-500/80 text-rose-500" />
                            )}
                            <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-accent)] flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-on-accent)] transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MULTI-PART AI DESCRIBE */}
          {activeTab === 'ai_describe' && (
            <div className="space-y-4">
              <div className="p-3 bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-2xl text-xs text-[var(--color-text-muted)] leading-relaxed">
                <span className="font-semibold text-[var(--color-accent)] flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Demo meal parser
                </span>
                Describe your meal and this offline demo parser will split it into typical
                ingredients with approximated nutrition values. Values are rough — adjust each
                item before logging.
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">
                  Describe what you ate:
                </label>
                <textarea
                  value={aiMealPrompt}
                  onChange={(e) => setAiMealPrompt(e.target.value)}
                  placeholder="e.g., greek yogurt with a standard banana and seed mix"
                  className="w-full h-20 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulateAiEstimation}
                disabled={!aiMealPrompt.trim() || aiIsEstimating}
                className="min-h-[44px] w-full py-2.5 bg-[var(--color-accent)] disabled:opacity-50 hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {aiIsEstimating ? (
                  <span>Estimating ingredients…</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estimate ingredients (demo)</span>
                  </>
                )}
              </button>

              {/* Itemized Parts Display */}
              {aiItemizedParts && aiItemizedParts.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--color-accent)]">
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" /> {aiItemizedParts.length} Separate Items Detected
                    </span>
                    <span className="text-[var(--color-text)] font-extrabold">
                      Total: {aiTotalNutrients.calories} kcal ({aiTotalNutrients.protein}g P)
                    </span>
                  </div>

                  {/* Individual Item Cards */}
                  <div className="space-y-2.5">
                    {aiItemizedParts.map((part, idx) => (
                      <div
                        key={part.id}
                        className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] space-y-2 relative"
                      >
                        <div className="flex items-start justify-between pr-6">
                          <div>
                            <input
                              type="text"
                              value={part.name}
                              onChange={(e) =>
                                handleUpdateItemizedPart(idx, 'name', e.target.value)
                              }
                              className="bg-transparent font-bold text-xs text-[var(--color-text)] focus:outline-none border-b border-dashed border-[var(--color-border)] pb-0.5"
                            />
                            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                              {part.servingSize} {part.servingUnit} base portion
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemizedPart(idx)}
                            aria-label={`Remove ${part.name}`}
                            className="absolute top-2.5 right-2.5 text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Macro edit inputs for this specific item */}
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                          <div className="bg-[var(--color-surface)] p-1 rounded-lg">
                            <span className="text-[var(--color-text-subtle)] block">Cals</span>
                            <input
                              type="number"
                              value={part.calories}
                              onChange={(e) =>
                                handleUpdateItemizedPart(
                                  idx,
                                  'calories',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full bg-transparent text-center font-bold text-[var(--color-text)] text-xs"
                            />
                          </div>
                          <div className="bg-[var(--color-surface)] p-1 rounded-lg">
                            <span className="text-[var(--color-success)] block">P (g)</span>
                            <input
                              type="number"
                              value={part.protein}
                              onChange={(e) =>
                                handleUpdateItemizedPart(
                                  idx,
                                  'protein',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-transparent text-center font-bold text-[var(--color-success)] text-xs"
                            />
                          </div>
                          <div className="bg-[var(--color-surface)] p-1 rounded-lg">
                            <span className="text-[var(--color-warning)] block">C (g)</span>
                            <input
                              type="number"
                              value={part.carbs}
                              onChange={(e) =>
                                handleUpdateItemizedPart(
                                  idx,
                                  'carbs',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-transparent text-center font-bold text-[var(--color-warning)] text-xs"
                            />
                          </div>
                          <div className="bg-[var(--color-surface)] p-1 rounded-lg">
                            <span className="text-[var(--color-danger)] block">F (g)</span>
                            <input
                              type="number"
                              value={part.fat}
                              onChange={(e) =>
                                handleUpdateItemizedPart(
                                  idx,
                                  'fat',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-transparent text-center font-bold text-[var(--color-danger)] text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confirm Log All Button */}
                  <button
                    onClick={handleConfirmAllItemizedEntries}
                    className="min-h-[48px] w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Log All {aiItemizedParts.length} Items to {selectedMeal}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM FOOD CREATOR */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCreateCustomFood} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">Food Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Protein Bar, Homemade Stew"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Serving Size</label>
                  <input
                    type="number"
                    value={customServingSize}
                    onChange={(e) => setCustomServingSize(e.target.value)}
                    className="min-h-[40px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Unit</label>
                  <input
                    type="text"
                    value={customServingUnit}
                    onChange={(e) => setCustomServingUnit(e.target.value)}
                    className="min-h-[40px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] block">Calories</label>
                  <input
                    type="number"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="min-h-[40px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl py-2 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] block">Protein (g)</label>
                  <input
                    type="number"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="min-h-[40px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl py-2 text-center text-xs font-bold text-[var(--color-success)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] block">Carbs (g)</label>
                  <input
                    type="number"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className="min-h-[40px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl py-2 text-center text-xs font-bold text-[var(--color-warning)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] block">Fat (g)</label>
                  <input
                    type="number"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    className="min-h-[40px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl py-2 text-center text-xs font-bold text-[var(--color-danger)] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="min-h-[48px] w-full mt-4 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                Save Food to Library
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
