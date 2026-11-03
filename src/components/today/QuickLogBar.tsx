import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, RotateCcw, Droplets, Scale, Activity, Utensils, X } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { parseQuickLog, QuickLogAction } from '../../services/quickLogParser';
import { getLocalDateString } from '../../utils/engine';
import { LoggedFood } from '../../types';

export function QuickLogBar() {
  const {
    state,
    addWater,
    addWeightRecord,
    addCardioSession,
    addLoggedFood,
    removeLoggedFood,
    removeCardioSession,
  } = useFitness();

  const [input, setInput] = useState('');
  const [parsedActions, setParsedActions] = useState<QuickLogAction[] | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [lastBatch, setLastBatch] = useState<{
    waterMlAdded: number;
    weightLogged?: boolean;
    cardioId?: string;
    foodIds: string[];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!val.trim()) {
      setParsedActions(null);
      setIsReviewOpen(false);
      return;
    }
    const result = parseQuickLog(val, state.profile.unitSystem);
    setParsedActions(result.actions.length > 0 ? result.actions : null);
    setIsReviewOpen(result.actions.length > 0);
  };

  const handleApplyActions = () => {
    if (!parsedActions || parsedActions.length === 0) return;

    const todayStr = getLocalDateString();
    const nowIso = new Date().toISOString();
    let waterMlAdded = 0;
    let weightLogged = false;
    let cardioId: string | undefined;
    const foodIds: string[] = [];

    parsedActions.forEach((action, idx) => {
      switch (action.type) {
        case 'water':
          addWater(action.amountMl, todayStr);
          waterMlAdded += action.amountMl;
          break;

        case 'weight':
          addWeightRecord({
            date: todayStr,
            weightKg: action.weightKg,
            notes: 'Quick-logged via natural language bar',
          });
          weightLogged = true;
          break;

        case 'cardio': {
          const cId = `cardio-ql-${Date.now()}-${idx}`;
          cardioId = cId;
          addCardioSession({
            id: cId,
            type: action.activityType,
            durationMinutes: action.durationMinutes,
            distanceKm: action.distanceKm,
            caloriesBurned: action.estimatedCalories,
            date: todayStr,
            notes: 'Manual quick-log',
          });
          break;
        }

        case 'food':
          action.items.forEach((item, fIdx) => {
            const fId = `food-ql-${Date.now()}-${fIdx}`;
            foodIds.push(fId);
            const newFood: LoggedFood = {
              id: fId,
              foodId: `f-ql-${Date.now()}-${fIdx}`,
              mealType: 'snack',
              name: item.name,
              servingCount: item.servingCount,
              servingSize: item.servingSize,
              servingUnit: item.servingUnit,
              calories: Math.round(item.calories * item.servingCount),
              protein: Number((item.protein * item.servingCount).toFixed(1)),
              carbs: Number((item.carbs * item.servingCount).toFixed(1)),
              fat: Number((item.fat * item.servingCount).toFixed(1)),
              loggedAt: nowIso,
            };
            addLoggedFood(newFood);
          });
          break;
      }
    });

    setLastBatch({
      waterMlAdded,
      weightLogged,
      cardioId,
      foodIds,
    });

    setToastMessage(`Logged ${parsedActions.length} item(s) successfully!`);
    setInput('');
    setParsedActions(null);
    setIsReviewOpen(false);

    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleUndo = () => {
    if (!lastBatch) return;
    const todayStr = getLocalDateString();

    if (lastBatch.waterMlAdded > 0) {
      addWater(-lastBatch.waterMlAdded, todayStr);
    }
    if (lastBatch.cardioId) {
      removeCardioSession(lastBatch.cardioId);
    }
    lastBatch.foodIds.forEach((fId) => {
      removeLoggedFood(fId);
    });

    setLastBatch(null);
    setToastMessage('Last quick-log undone.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getActionIcon = (type: QuickLogAction['type']) => {
    switch (type) {
      case 'water':
        return <Droplets className="w-3.5 h-3.5 text-[var(--color-info)]" />;
      case 'weight':
        return <Scale className="w-3.5 h-3.5 text-[var(--color-accent)]" />;
      case 'cardio':
        return <Activity className="w-3.5 h-3.5 text-[var(--color-success)]" />;
      case 'food':
        return <Utensils className="w-3.5 h-3.5 text-[var(--color-secondary-accent)]" />;
    }
  };

  return (
    <div className="space-y-2 mb-3">
      {/* Undo Toast */}
      {toastMessage && (
        <div className="p-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-md flex items-center justify-between text-xs text-[var(--color-text)] animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
            <span>{toastMessage}</span>
          </div>
          {lastBatch && (
            <button
              onClick={handleUndo}
              className="text-[var(--color-accent)] hover:underline flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Natural Language Input Bar */}
      <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm focus-within:border-[var(--color-accent)] transition-all">
        <div className="flex items-center px-3 py-2 gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyActions();
              }
            }}
            placeholder="Quick log: e.g. 500ml water, ran 5k in 25 min, 2 eggs with toast"
            className="w-full bg-transparent text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none"
          />
          {input && (
            <button
              onClick={() => {
                setInput('');
                setParsedActions(null);
                setIsReviewOpen(false);
              }}
              aria-label="Clear input"
              className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Real-time Parsed Actions Preview Card */}
        {isReviewOpen && parsedActions && parsedActions.length > 0 && (
          <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-sunken)] rounded-b-2xl space-y-2">
            <div className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider flex items-center justify-between">
              <span>Detected {parsedActions.length} Action{parsedActions.length > 1 ? 's' : ''}</span>
              <span className="text-[var(--color-text-subtle)] font-normal lowercase">Press Enter or Apply</span>
            </div>

            <div className="space-y-1.5">
              {parsedActions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-[var(--color-text)] bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-border)]/60"
                >
                  {getActionIcon(action.type)}
                  <span className="font-medium flex-1 truncate">{action.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleApplyActions}
              className="min-h-[38px] w-full mt-2 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
            >
              <span>Confirm & Log All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
