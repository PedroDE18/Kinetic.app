import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  X,
  Heart,
  Utensils,
  Check,
  Trash2,
  Database,
  Info,
  Cpu,
  ScanBarcode,
  Camera,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { FoodItem, LoggedFood, MealType, ParsedAiFoodItem } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { estimateMealWithAi, estimateMealOffline } from '../../services/aiFoodEstimation';
import { lookupBarcodeOpenFoodFacts, BarcodeFoodItem } from '../../services/barcodeService';

interface AddFoodModalProps {
  initialMealType?: MealType;
  targetDate?: string;
  onClose: () => void;
}

export function AddFoodModal({ initialMealType = 'breakfast', targetDate, onClose }: AddFoodModalProps) {
  useBodyScrollLock(true);
  const { state, addLoggedFood, toggleFoodFavorite, addFoodToLibrary } = useFitness();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType);
  const [activeTab, setActiveTab] = useState<'database' | 'barcode' | 'ai_describe' | 'custom'>('database');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);

  // Barcode Scanner State (OpenFoodFacts - 100% Free Open API)
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<BarcodeFoodItem | null>(null);
  const [scannedMultiplier, setScannedMultiplier] = useState<number>(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getLogTimestamp = () => {
    if (!targetDate) return new Date().toISOString();
    return `${targetDate}T12:00:00.000Z`;
  };

  // Multi-Part AI Describe State
  const [aiMealPrompt, setAiMealPrompt] = useState('greek yogurt with a standard banana and seed mix');
  const [aiIsEstimating, setAiIsEstimating] = useState(false);
  const [aiItemizedParts, setAiItemizedParts] = useState<ParsedAiFoodItem[] | null>(null);
  const [aiEstimationSource, setAiEstimationSource] = useState<'model' | 'offline' | null>(null);
  const [aiEstimationError, setAiEstimationError] = useState<string | null>(null);

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
          : selectedCategory.includes('Brasil') || selectedCategory.includes('Brazilian')
          ? item.id.startsWith('f-br-') || (item.source && item.source.includes('TACO')) || (item.brand && item.brand.includes('Brasil'))
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

  // Barcode Camera and Search Handlers
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported by your browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Start BarcodeDetector scanning loop if supported natively
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        });

        const scanInterval = setInterval(async () => {
          if (!streamRef.current) {
            clearInterval(scanInterval);
            return;
          }
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const detectedCode = barcodes[0].rawValue;
                clearInterval(scanInterval);
                stopCamera();
                setBarcodeInput(detectedCode);
                handleBarcodeSearch(detectedCode);
              }
            } catch {
              // Ignore frame read failures
            }
          }
        }, 350);
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera. Please allow camera permissions.');
      setCameraActive(false);
    }
  };

  const handleBarcodeSearch = async (barcodeToSearch?: string) => {
    const code = (barcodeToSearch || barcodeInput).trim();
    if (!code) return;
    setBarcodeLoading(true);
    setBarcodeError(null);
    setScannedProduct(null);

    try {
      const res = await lookupBarcodeOpenFoodFacts(code);
      if (res.found && res.food) {
        setScannedProduct(res.food);
        setScannedMultiplier(1);
      } else {
        setBarcodeError(res.error || 'Product not found in OpenFoodFacts database.');
      }
    } catch (err: any) {
      setBarcodeError(err?.message || 'Failed to search barcode.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleConfirmAddScannedFood = () => {
    if (!scannedProduct) return;
    const count = Math.max(0.1, scannedMultiplier);

    // Save to food library if not already present
    const existing = state.foodLibrary.find(
      (f) => f.barcode === scannedProduct.barcode || f.name.toLowerCase() === scannedProduct.name.toLowerCase()
    );

    let foodId = existing?.id;
    if (!foodId) {
      foodId = `food-barcode-${scannedProduct.barcode}`;
      const newFoodItem: FoodItem = {
        id: foodId,
        name: scannedProduct.name,
        brand: scannedProduct.brand,
        barcode: scannedProduct.barcode,
        category: 'Meals',
        servingSize: scannedProduct.servingSize,
        servingUnit: scannedProduct.servingUnit,
        calories: scannedProduct.calories,
        protein: scannedProduct.protein,
        carbs: scannedProduct.carbs,
        fat: scannedProduct.fat,
        fiber: scannedProduct.fiber,
        source: 'OpenFoodFacts Global Database',
        isFavorite: true,
      };
      addFoodToLibrary(newFoodItem);
    }

    const newLog: LoggedFood = {
      id: `food-log-${Date.now()}`,
      foodId,
      mealType: selectedMeal,
      name: scannedProduct.name,
      servingCount: count,
      servingSize: scannedProduct.servingSize,
      servingUnit: scannedProduct.servingUnit,
      calories: Math.round(scannedProduct.calories * count),
      protein: Number((scannedProduct.protein * count).toFixed(1)),
      carbs: Number((scannedProduct.carbs * count).toFixed(1)),
      fat: Number((scannedProduct.fat * count).toFixed(1)),
      fiber: scannedProduct.fiber ? Number((scannedProduct.fiber * count).toFixed(1)) : undefined,
      loggedAt: getLogTimestamp(),
    };

    addLoggedFood(newLog);
    stopCamera();
    onClose();
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Itemized Multi-Part Estimation using Gemini 2.5 Flash with free offline fallback
  const handleRunAiEstimation = async () => {
    if (!aiMealPrompt.trim()) return;
    setAiIsEstimating(true);
    setAiEstimationError(null);
    try {
      const result = await estimateMealWithAi(aiMealPrompt, state.profile.geminiApiKey);
      setAiItemizedParts(result.items);
      setAiEstimationSource(result.source);
      if (result.error) {
        setAiEstimationError(result.error);
      }
    } catch (err: any) {
      const fallback = estimateMealOffline(aiMealPrompt);
      setAiItemizedParts(fallback);
      setAiEstimationSource('offline');
      setAiEstimationError(err?.message || 'Fallback to offline estimation');
    } finally {
      setAiIsEstimating(false);
    }
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
        <div className="grid grid-cols-4 border-b border-[var(--color-border)] text-xs font-semibold bg-[var(--color-surface-sunken)]">
          <button
            onClick={() => {
              setActiveTab('database');
              setSelectedFood(null);
              stopCamera();
            }}
            className={`min-h-[40px] py-2 text-center transition-all ${
              activeTab === 'database'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => {
              setActiveTab('barcode');
              setSelectedFood(null);
            }}
            className={`min-h-[40px] py-2 text-center flex items-center justify-center gap-1 transition-all ${
              activeTab === 'barcode'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>Barcode</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ai_describe');
              stopCamera();
            }}
            className={`min-h-[40px] py-2 text-center flex items-center justify-center gap-1 transition-all ${
              activeTab === 'ai_describe'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('custom');
              stopCamera();
            }}
            className={`min-h-[40px] py-2 text-center transition-all ${
              activeTab === 'custom'
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            + Custom
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
                        type="button"
                        onClick={() => toggleFoodFavorite(selectedFood.id)}
                        aria-label={
                          selectedFood.isFavorite
                            ? `Remove ${selectedFood.name} from favorites`
                            : `Save ${selectedFood.name} to favorites`
                        }
                        aria-pressed={!!selectedFood.isFavorite}
                        title={selectedFood.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] p-1 active:scale-90 transition-all"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            selectedFood.isFavorite ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : ''
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
                              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
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
                    {['All', 'Favorites', 'Brasil (TACO)', 'Protein', 'Carbohydrates', 'Fats', 'Produce', 'Dairy'].map(
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
                    <div className="py-8 text-center text-xs text-[var(--color-text-subtle)] border border-dashed border-[var(--color-border)] rounded-2xl px-4">
                      {selectedCategory === 'Favorites' && !searchQuery ? (
                        <>
                          No favorites yet. Tap the heart on any food to keep it one tap away —
                          or describe a meal below and it will be saved for you.
                        </>
                      ) : (
                        <>No foods found matching "{searchQuery}".</>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {filteredFoods.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-stretch py-2.5 px-2 -mx-0.5 rounded-xl hover:bg-[var(--color-surface-raised)]/40 transition-colors group"
                        >
                          <button
                            onClick={() => {
                              setSelectedFood(item);
                              setServingMultiplier(1);
                            }}
                            className="flex-1 min-w-0 min-h-[48px] flex items-center justify-between gap-2 text-left"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] truncate">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                                {item.servingSize} {item.servingUnit} • {item.calories} kcal • P:{' '}
                                {item.protein}g C: {item.carbs}g F: {item.fat}g
                              </div>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-accent)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-on-accent)] transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFoodFavorite(item.id)}
                            aria-label={item.isFavorite ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
                            aria-pressed={!!item.isFavorite}
                            className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[var(--color-accent-soft)] active:scale-90 transition-all"
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                item.isFavorite
                                  ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                                  : 'text-[var(--color-text-subtle)]'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: BARCODE SCANNER (FREE OPENFOODFACTS) */}
          {activeTab === 'barcode' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl text-xs text-[var(--color-text-muted)] leading-relaxed">
                <span className="font-semibold text-[var(--color-accent)] flex items-center gap-1 mb-1">
                  <ScanBarcode className="w-3.5 h-3.5" />
                  Free OpenFoodFacts Barcode Scanner
                </span>
                Scan package barcodes using your camera or enter the digits directly. Queries a free open database of over 3 million foods.
              </div>

              {/* Camera Scanner Viewfinder */}
              {cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-[var(--color-border)] aspect-video flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Visual reticle & laser */}
                  <div className="absolute inset-10 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-full h-0.5 bg-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent)] animate-pulse" />
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1 rounded-lg bg-black/70 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-sm active:scale-95 transition-all"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-2xl text-xs font-semibold text-[var(--color-text)] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  <Camera className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Scan with Device Camera</span>
                </button>
              )}

              {cameraError && (
                <div className="p-2.5 bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded-xl text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Manual Barcode Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
                  Or enter barcode digits:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 0737628064502"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeSearch();
                      }
                    }}
                    className="flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleBarcodeSearch()}
                    disabled={!barcodeInput.trim() || barcodeLoading}
                    className="px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {barcodeLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Barcode Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Demo items:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('0737628064502');
                    handleBarcodeSearch('0737628064502');
                  }}
                  className="text-[11px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2 py-0.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Thai Noodles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('748927028645');
                    handleBarcodeSearch('748927028645');
                  }}
                  className="text-[11px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2 py-0.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Whey Isolate
                </button>
              </div>

              {/* Barcode Search Error */}
              {barcodeError && (
                <div className="p-3 bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{barcodeError}</span>
                </div>
              )}

              {/* Scanned Food Card & Review */}
              {scannedProduct && (
                <div className="p-4 bg-[var(--color-surface-sunken)] border border-[var(--color-accent)]/50 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold inline-block mb-1">
                        Barcode: {scannedProduct.barcode}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--color-text)] leading-snug">
                        {scannedProduct.name}
                      </h4>
                      {scannedProduct.brand && (
                        <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                          {scannedProduct.brand}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Serving Stepper */}
                  <div className="flex items-center justify-between py-2 border-y border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Serving portion ({scannedProduct.servingSize} {scannedProduct.servingUnit})
                    </span>
                    <div className="flex items-center bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setScannedMultiplier((m) => Math.max(0.25, Number((m - 0.25).toFixed(2))))}
                        className="w-8 h-8 flex items-center justify-center font-bold text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-xs font-bold text-[var(--color-text)] tabular-nums">
                        {scannedMultiplier}×
                      </span>
                      <button
                        type="button"
                        onClick={() => setScannedMultiplier((m) => Number((m + 0.25).toFixed(2)))}
                        className="w-8 h-8 flex items-center justify-center font-bold text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calculated Nutrition */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-[var(--color-surface-raised)] rounded-xl p-2">
                      <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-semibold">Calories</span>
                      <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                        {Math.round(scannedProduct.calories * scannedMultiplier)}
                      </span>
                    </div>
                    <div className="bg-[var(--color-surface-raised)] rounded-xl p-2">
                      <span className="text-[10px] text-[var(--color-success)] block uppercase font-semibold">Protein</span>
                      <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                        {(scannedProduct.protein * scannedMultiplier).toFixed(1)}g
                      </span>
                    </div>
                    <div className="bg-[var(--color-surface-raised)] rounded-xl p-2">
                      <span className="text-[10px] text-[var(--color-warning)] block uppercase font-semibold">Carbs</span>
                      <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                        {(scannedProduct.carbs * scannedMultiplier).toFixed(1)}g
                      </span>
                    </div>
                    <div className="bg-[var(--color-surface-raised)] rounded-xl p-2">
                      <span className="text-[10px] text-[var(--color-danger)] block uppercase font-semibold">Fat</span>
                      <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                        {(scannedProduct.fat * scannedMultiplier).toFixed(1)}g
                      </span>
                    </div>
                  </div>

                  {/* Confirm Log Action */}
                  <button
                    type="button"
                    onClick={handleConfirmAddScannedFood}
                    className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Log to {selectedMeal} & Save to Library</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MULTI-PART AI DESCRIBE */}
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
                onClick={handleRunAiEstimation}
                disabled={!aiMealPrompt.trim() || aiIsEstimating}
                className="min-h-[44px] w-full py-2.5 bg-[var(--color-accent)] disabled:opacity-50 hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {aiIsEstimating ? (
                  <span>Estimating ingredients…</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estimate Ingredients with AI</span>
                  </>
                )}
              </button>

              {/* Itemized Parts Display */}
              {aiItemizedParts && aiItemizedParts.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-[var(--color-accent)]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4" /> {aiItemizedParts.length} Separate Items
                      </span>
                      {aiEstimationSource === 'model' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-info-soft)] text-[var(--color-info)] font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Gemini 2.5 Flash
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" /> Offline Estimate (Free)
                        </span>
                      )}
                    </div>
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
