import { ParsedAiFoodItem, CardioActivityType } from '../types';
import { estimateMealOffline } from './aiFoodEstimation';

export interface ParsedWaterAction {
  type: 'water';
  amountMl: number;
  label: string;
}

export interface ParsedWeightAction {
  type: 'weight';
  weightKg: number;
  label: string;
}

export interface ParsedCardioAction {
  type: 'cardio';
  activityType: CardioActivityType;
  distanceKm?: number;
  durationMinutes: number;
  estimatedCalories: number;
  label: string;
}

export interface ParsedFoodAction {
  type: 'food';
  items: ParsedAiFoodItem[];
  label: string;
  totalCalories: number;
  totalProtein: number;
}

export type QuickLogAction =
  | ParsedWaterAction
  | ParsedWeightAction
  | ParsedCardioAction
  | ParsedFoodAction;

export interface QuickLogParseResult {
  actions: QuickLogAction[];
  rawText: string;
}

/**
 * Deterministic offline natural language parser for multi-action quick logging.
 * Zero subscriptions, zero token costs, pure local computation.
 */
export function parseQuickLog(input: string, unitSystem: 'metric' | 'imperial' = 'metric'): QuickLogParseResult {
  const clean = (input || '').trim();
  if (!clean) {
    return { actions: [], rawText: clean };
  }

  const actions: QuickLogAction[] = [];
  let remaining = clean;

  // 1. Water Parsing (e.g. "500ml water", "drank 1 liter", "bebi 500ml de agua", "tomei 1 litro de água")
  const waterRegex = /(?:drank|chugged|had|logged|bebi|tomei)?\s*(\d+(?:[.,]\d+)?)\s*(ml|l|liter|liters|litro|litros|oz|copos?|glasses?)?\s*(?:of|de)?\s*(?:water|água|agua)/i;
  const standaloneWaterRegex = /(?:drank|chugged|bebi|tomei)\s*(\d+(?:[.,]\d+)?)\s*(ml|l|liter|liters|litro|litros|oz)\b/i;
  const waterMatch = remaining.match(waterRegex) || remaining.match(standaloneWaterRegex);

  if (waterMatch) {
    const rawVal = parseFloat(waterMatch[1].replace(',', '.'));
    const unit = (waterMatch[2] || 'ml').toLowerCase();
    let ml = 0;
    if (unit.startsWith('l')) {
      ml = Math.round(rawVal * 1000);
    } else if (unit.startsWith('copo') || unit.startsWith('glass')) {
      ml = Math.round(rawVal * 250); // 1 standard glass = 250ml
    } else if (unit === 'oz') {
      ml = Math.round(rawVal * 29.5735);
    } else {
      ml = Math.round(rawVal);
    }

    if (ml > 0 && ml <= 5000) {
      actions.push({
        type: 'water',
        amountMl: ml,
        label: `+${ml} ml ${unitSystem === 'metric' ? 'Água / Water' : 'Water'}`,
      });
      remaining = remaining.replace(waterMatch[0], ' ');
    }
  }

  // 2. Weight Parsing (e.g. "weigh-in 75.4kg", "peso 74,5 kg", "pesando 75kg", "weighed 75.4 kg")
  const weightRegex = /(?:weigh(?:-?in)?|weighed|weight|pesando|me\s*pesei|peso|balan[cç]a)\s*(?:is|at|em|de)?\s*(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilos|quilos|lbs|pounds)?\b/i;
  const standaloneWeightRegex = /\b(\d{2,3}(?:[.,]\d+)?)\s*(kg|kgs|kilos|quilos|lbs|pounds)\s*(?:weigh(?:-?in)?|scale|balan[cç]a)?\b/i;
  const weightMatch = remaining.match(weightRegex) || remaining.match(standaloneWeightRegex);

  if (weightMatch) {
    const rawVal = parseFloat(weightMatch[1].replace(',', '.'));
    const unit = (weightMatch[2] || (unitSystem === 'imperial' ? 'lbs' : 'kg')).toLowerCase();
    let kg = rawVal;
    if (unit.includes('lb') || unit.includes('pound')) {
      kg = Number((rawVal * 0.453592).toFixed(2));
    } else {
      kg = Number(rawVal.toFixed(2));
    }

    if (kg >= 30 && kg <= 350) {
      actions.push({
        type: 'weight',
        weightKg: kg,
        label: `Pesagem / Weigh-in: ${kg} kg${unit.includes('lb') ? ` (${rawVal} lbs)` : ''}`,
      });
      remaining = remaining.replace(weightMatch[0], ' ');
    }
  }

  // 3. Cardio Parsing (e.g. "ran 5k in 25 min", "corri 5km em 25 min", "pedalei 15km", "caminhada de 30 min")
  const cardioRegex = /(?:ran|run|running|cycling|biked|bike|walked|walk|walking|rowed|rowing|corri|corrida|pedalei|pedal|bicicleta|caminhei|caminhada|remada)\s*(?:a\s*)?(\d+(?:[.,]\d+)?\s*(?:k|km|quil[oô]metros|miles|mi|m)?)?(?:\s*(?:in|for|em|por|de)\s*(\d+)(?::(\d+))?\s*(?:min|mins|minutos|minutes)?)?/i;
  const cardioMatch = remaining.match(cardioRegex);

  if (cardioMatch && (cardioMatch[1] || cardioMatch[2])) {
    const matchStr = cardioMatch[0].toLowerCase();
    let activityType: CardioActivityType = 'running';
    if (matchStr.includes('cycle') || matchStr.includes('bike') || matchStr.includes('pedal') || matchStr.includes('bicicleta')) {
      activityType = 'cycling';
    } else if (matchStr.includes('walk') || matchStr.includes('caminh')) {
      activityType = 'walking';
    } else if (matchStr.includes('row') || matchStr.includes('remad')) {
      activityType = 'rowing';
    }

    let distKm: number | undefined;
    if (cardioMatch[1]) {
      const distRaw = parseFloat(cardioMatch[1].replace(',', '.'));
      const distLower = cardioMatch[1].toLowerCase();
      if (distLower.includes('mi')) {
        distKm = Number((distRaw * 1.60934).toFixed(2));
      } else if (distLower.includes('m') && !distLower.includes('k')) {
        distKm = Number((distRaw / 1000).toFixed(2));
      } else {
        distKm = Number(distRaw.toFixed(2));
      }
    }

    let durationMinutes = 30; // default duration if not specified
    if (cardioMatch[2]) {
      const mins = parseInt(cardioMatch[2], 10);
      const secs = cardioMatch[3] ? parseInt(cardioMatch[3], 10) / 60 : 0;
      durationMinutes = Math.round(mins + secs);
    } else if (distKm) {
      // Estimate realistic duration: running ~5 min/km, cycling ~2.5 min/km, walking ~11 min/km
      const minPerKm = activityType === 'running' ? 5.5 : activityType === 'cycling' ? 2.5 : 11;
      durationMinutes = Math.max(5, Math.round(distKm * minPerKm));
    }

    // Estimate realistic calories burned
    const calPerMin = activityType === 'running' ? 11 : activityType === 'cycling' ? 9 : 5;
    const estimatedCalories = Math.round(durationMinutes * calPerMin);

    const distLabel = distKm ? `${distKm} km` : '';
    const timeLabel = `${durationMinutes} min`;
    const labelType = activityType.charAt(0).toUpperCase() + activityType.slice(1);
    const label = `${labelType} ${[distLabel, timeLabel].filter(Boolean).join(' in ')} (~${estimatedCalories} kcal)`;

    actions.push({
      type: 'cardio',
      activityType,
      distanceKm: distKm,
      durationMinutes,
      estimatedCalories,
      label,
    });
    remaining = remaining.replace(cardioMatch[0], ' ');
  }

  // 4. Food Parsing
  // Clean punctuation / conjunctions from what remains (e.g. "and", "plus", commas)
  const remainingFoodPhrase = remaining
    .replace(/\b(?:and|also|then|plus|with)\b/gi, ' ')
    .replace(/[,;.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If there's meaningful food description remaining (at least 3 characters)
  if (remainingFoodPhrase.length >= 3) {
    const foodItems = estimateMealOffline(remainingFoodPhrase);
    if (foodItems.length > 0) {
      const totalCalories = foodItems.reduce((acc, i) => acc + i.calories * i.servingCount, 0);
      const totalProtein = foodItems.reduce((acc, i) => acc + i.protein * i.servingCount, 0);

      actions.push({
        type: 'food',
        items: foodItems,
        label: `${foodItems.length} food item(s): ${foodItems.map((f) => f.name).join(', ')}`,
        totalCalories: Math.round(totalCalories),
        totalProtein: Number(totalProtein.toFixed(1)),
      });
    }
  }

  return {
    actions,
    rawText: clean,
  };
}
