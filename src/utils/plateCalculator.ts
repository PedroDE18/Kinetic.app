export interface PlateCount {
  weight: number;
  countPerSide: number;
  color: string;
  heightRem: number; // for visual barbell sleeve rendering
}

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: PlateCount[];
  achievableTotalWeight: number;
  remainder: number;
  unit: 'kg' | 'lbs';
}

const METRIC_PLATES: Array<{ weight: number; color: string; heightRem: number }> = [
  { weight: 25, color: '#DC2626', heightRem: 4.5 }, // Red
  { weight: 20, color: '#2563EB', heightRem: 4.2 }, // Blue
  { weight: 15, color: '#EAB308', heightRem: 3.8 }, // Yellow
  { weight: 10, color: '#16A34A', heightRem: 3.4 }, // Green
  { weight: 5, color: '#F8FAFC', heightRem: 2.8 },  // White
  { weight: 2.5, color: '#1E293B', heightRem: 2.3 }, // Black
  { weight: 1.25, color: '#94A3B8', heightRem: 1.8 }, // Silver
];

const IMPERIAL_PLATES: Array<{ weight: number; color: string; heightRem: number }> = [
  { weight: 45, color: '#2563EB', heightRem: 4.5 }, // Blue
  { weight: 35, color: '#EAB308', heightRem: 4.0 }, // Yellow
  { weight: 25, color: '#16A34A', heightRem: 3.6 }, // Green
  { weight: 10, color: '#1E293B', heightRem: 3.0 }, // Black
  { weight: 5, color: '#F8FAFC', heightRem: 2.4 },  // White
  { weight: 2.5, color: '#94A3B8', heightRem: 1.9 }, // Silver
];

/**
 * Calculate greedy plate distribution per barbell sleeve.
 * Local-first, zero-cost, purely deterministic math.
 */
export function calculateBarbellPlates(
  totalWeight: number,
  barWeight = 20,
  unit: 'kg' | 'lbs' = 'kg'
): PlateCalculationResult {
  const safeTotal = Math.max(barWeight, Number.isFinite(totalWeight) ? totalWeight : barWeight);
  const availablePlates = unit === 'lbs' ? IMPERIAL_PLATES : METRIC_PLATES;

  const targetWeightPerSide = (safeTotal - barWeight) / 2;
  let remainingPerSide = targetWeightPerSide;

  const platesPerSide: PlateCount[] = [];

  for (const plate of availablePlates) {
    if (remainingPerSide >= plate.weight - 0.001) {
      const count = Math.floor((remainingPerSide + 0.0001) / plate.weight);
      if (count > 0) {
        platesPerSide.push({
          weight: plate.weight,
          countPerSide: count,
          color: plate.color,
          heightRem: plate.heightRem,
        });
        remainingPerSide = Number((remainingPerSide - count * plate.weight).toFixed(3));
      }
    }
  }

  const loadedWeightPerSide = platesPerSide.reduce(
    (acc, p) => acc + p.weight * p.countPerSide,
    0
  );
  const achievableTotalWeight = Number((barWeight + loadedWeightPerSide * 2).toFixed(2));
  const remainder = Number((safeTotal - achievableTotalWeight).toFixed(2));

  return {
    targetWeight: safeTotal,
    barWeight,
    weightPerSide: targetWeightPerSide,
    platesPerSide,
    achievableTotalWeight,
    remainder: Math.abs(remainder) < 0.01 ? 0 : remainder,
    unit,
  };
}
