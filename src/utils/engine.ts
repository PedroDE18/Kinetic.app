import { WeightRecord, LoggedFood, UnitSystem, CompletedWorkout, CardioSession, CardioActivityType } from '../types';

export interface SmoothedWeightPoint {
  date: string;
  actualWeightKg: number;
  trendWeightKg: number;
  waistCm?: number;
}

/**
 * Exponentially Weighted Moving Average (EWMA) weight smoothing.
 * Filters short-term fluid/sodium fluctuations while tracking genuine mass shifts.
 * alpha = 0.15 gives a half-life of ~4.3 days, optimal for human body weight dynamics.
 */
export function calculateWeightTrend(
  records: WeightRecord[],
  alpha = 0.15
): SmoothedWeightPoint[] {
  if (!records || records.length === 0) return [];

  // Sort chronologically ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentTrend = sorted[0].weightKg;

  return sorted.map((rec) => {
    currentTrend = alpha * rec.weightKg + (1 - alpha) * currentTrend;
    return {
      date: rec.date,
      actualWeightKg: Number(rec.weightKg.toFixed(2)),
      trendWeightKg: Number(currentTrend.toFixed(2)),
      waistCm: rec.waistCm,
    };
  });
}

/**
 * Deterministic Adaptive TDEE (Total Daily Energy Expenditure) calculation.
 * Energy balance: 1 kg tissue ≈ 7700 kcal (3500 kcal/lb).
 * Expenditure = Intake - (Weight Trend Delta * 7700 / deltaDays)
 */
export function calculateAdaptiveTDEE(
  weights: WeightRecord[],
  loggedFoods: LoggedFood[],
  windowDays = 21
): {
  estimatedTdee: number;
  confidenceScore: number; // 0.0 - 1.0
  avgDailyIntake: number;
  avgProteinIntake: number;
  weeklyTrendDeltaKg: number;
  loggedDaysCount: number;
  weighInCount: number;
  isConfident: boolean;
} {
  const trend = calculateWeightTrend(weights);
  if (trend.length < 3) {
    return {
      estimatedTdee: 2400,
      confidenceScore: 0.2,
      avgDailyIntake: 2150,
      avgProteinIntake: 160,
      weeklyTrendDeltaKg: 0,
      loggedDaysCount: 0,
      weighInCount: trend.length,
      isConfident: false,
    };
  }

  const now = new Date();
  const cutoffTime = now.getTime() - windowDays * 24 * 60 * 60 * 1000;

  const windowTrend = trend.filter((t) => new Date(t.date).getTime() >= cutoffTime);
  const effectiveTrend = windowTrend.length >= 3 ? windowTrend : trend.slice(-14);

  const windowFoods = loggedFoods.filter(
    (f) => new Date(f.loggedAt).getTime() >= cutoffTime
  );
  const effectiveFoods = windowFoods.length > 0 ? windowFoods : loggedFoods;

  // Aggregate daily intake
  const dailyIntakeMap: Record<string, { cals: number; protein: number }> = {};
  effectiveFoods.forEach((item) => {
    const day = item.loggedAt.split('T')[0];
    if (!dailyIntakeMap[day]) {
      dailyIntakeMap[day] = { cals: 0, protein: 0 };
    }
    dailyIntakeMap[day].cals += item.calories;
    dailyIntakeMap[day].protein += item.protein;
  });

  const loggedDays = Object.values(dailyIntakeMap);
  const loggedDaysCount = loggedDays.length;
  const weighInCount = effectiveTrend.length;

  // Confidence calculation based on consistency over the window
  const foodLoggingFactor = Math.min(loggedDaysCount / Math.max(windowDays * 0.6, 7), 1.0);
  const weighInFactor = Math.min(weighInCount / Math.max(windowDays * 0.5, 7), 1.0);
  const confidenceScore = Number(((foodLoggingFactor * 0.6 + weighInFactor * 0.4)).toFixed(2));

  const totalCalories = loggedDays.reduce((sum, d) => sum + d.cals, 0);
  const totalProtein = loggedDays.reduce((sum, d) => sum + d.protein, 0);
  const avgDailyIntake = loggedDaysCount > 0 ? Math.round(totalCalories / loggedDaysCount) : 2200;
  const avgProteinIntake = loggedDaysCount > 0 ? Math.round(totalProtein / loggedDaysCount) : 160;

  // Weight Trend Rate of Change
  const firstPoint = effectiveTrend[0];
  const lastPoint = effectiveTrend[effectiveTrend.length - 1];
  const deltaDays = Math.max(
    1,
    (new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const totalDeltaKg = lastPoint.trendWeightKg - firstPoint.trendWeightKg;
  const dailyWeightChangeKg = totalDeltaKg / deltaDays;
  const weeklyTrendDeltaKg = Number((dailyWeightChangeKg * 7).toFixed(2));

  // Physiological TDEE equation
  // Tissue deficit/surplus: 1 kg ~= 7700 kcal
  const energyBalanceOffset = dailyWeightChangeKg * 7700;
  const calculatedTdee = avgDailyIntake - energyBalanceOffset;

  // Dampen with confidence: if confidence is low, blend toward default baseline 2400
  const baselineTdee = 2400;
  const blendedTdee = calculatedTdee * confidenceScore + baselineTdee * (1 - confidenceScore);

  // Clamp within realistic human physiological bounds
  const clampedTdee = Math.round(Math.min(Math.max(blendedTdee, 1300), 4500));

  return {
    estimatedTdee: clampedTdee,
    confidenceScore,
    avgDailyIntake,
    avgProteinIntake,
    weeklyTrendDeltaKg,
    loggedDaysCount,
    weighInCount,
    isConfident: confidenceScore >= 0.65,
  };
}

/**
 * Bounded weekly target adjustment calculation.
 * Never adjusts by more than +/- 200 kcal/day in a single review.
 */
export function generateWeeklyAdjustmentProposal(
  currentTdee: number,
  currentTarget: number,
  targetRateKgPerWeek: number, // e.g. -0.4 kg/week
  confidenceScore: number
): {
  proposedTarget: number;
  adjustmentDelta: number;
  reason: string;
} {
  if (confidenceScore < 0.5) {
    return {
      proposedTarget: currentTarget,
      adjustmentDelta: 0,
      reason:
        'Insufficient logging consistency over the past 2 weeks. Maintain your current target until more data is logged.',
    };
  }

  // Energy deficit or surplus needed: e.g. -0.4 kg/week * 7700 kcal / 7 = -440 kcal/day
  const dailyEnergyOffset = (targetRateKgPerWeek * 7700) / 7;
  const theoreticalIdeal = Math.round(currentTdee + dailyEnergyOffset);

  // Compute delta and clamp with strict guardrails [-200, +200]
  let delta = theoreticalIdeal - currentTarget;
  if (delta > 200) delta = 200;
  if (delta < -200) delta = -200;

  // Round to nearest 25 kcal for clean nutrition numbers
  delta = Math.round(delta / 25) * 25;
  const proposedTarget = currentTarget + delta;

  let reason = `Based on your recent logged intake and trend weight change, your estimated expenditure is ${currentTdee} kcal. `;
  if (Math.abs(delta) < 25) {
    reason += `Your current intake of ${currentTarget} kcal is right on pace with your weekly goal. Target remains steady.`;
  } else if (delta > 0) {
    reason += `Your expenditure is higher than projected. Increasing your intake by +${delta} kcal/day will keep your rate of change sustainable.`;
  } else {
    reason += `Weight loss is tracking slightly slower than your target rate. Decreasing your target by ${delta} kcal/day will re-align your pace.`;
  }

  return {
    proposedTarget,
    adjustmentDelta: delta,
    reason,
  };
}

/**
 * Epley formula for estimating 1RM: Weight * (1 + Reps / 30)
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Number((weightKg * (1 + reps / 30)).toFixed(1));
}

/**
 * Calculate total training volume in kg for completed sets.
 */
export function calculateWorkoutVolume(
  exercises: { sets: { actualWeightKg: number; actualReps: number; isCompleted: boolean }[] }[]
): number {
  return exercises.reduce((acc, ex) => {
    const completedSets = ex.sets.filter((s) => s.isCompleted);
    const exVolume = completedSets.reduce(
      (setAcc, s) => setAcc + s.actualWeightKg * s.actualReps,
      0
    );
    return acc + exVolume;
  }, 0);
}

/**
 * Routine-specific volume progression over time
 */
export function calculateRoutineVolumeHistory(
  workouts: CompletedWorkout[]
): Record<string, { date: string; volumeKg: number }[]> {
  const result: Record<string, { date: string; volumeKg: number }[]> = {};
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  sorted.forEach((w) => {
    const key = w.name;
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push({
      date: w.startTime.split('T')[0],
      volumeKg: w.totalVolumeKg,
    });
  });

  return result;
}

/**
 * Global training volume evolution across all workouts
 */
export function calculateGlobalVolumeHistory(
  workouts: CompletedWorkout[]
): { date: string; volumeKg: number; workoutName: string }[] {
  return [...workouts]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((w) => ({
      date: w.startTime.split('T')[0],
      volumeKg: w.totalVolumeKg,
      workoutName: w.name,
    }));
}

/**
 * Format pace in min:sec per km or per mi
 */
export function formatPace(
  arg1: number | string,
  arg2?: number | UnitSystem
): string {
  if (typeof arg1 === 'string') {
    return arg1.includes('/') ? arg1 : `${arg1} /km`;
  }
  if (typeof arg2 === 'number') {
    // formatPace(totalMinutes, distanceKm)
    const totalMinutes = arg1;
    const distanceKm = arg2;
    if (!distanceKm || distanceKm <= 0 || !totalMinutes || totalMinutes <= 0) return '--:--';
    const paceDec = totalMinutes / distanceKm;
    const mins = Math.floor(paceDec);
    const secs = Math.round((paceDec - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  // formatPace(paceSecPerKm, unitSystem)
  const paceSecPerKm = arg1;
  const unit = (typeof arg2 === 'string' ? arg2 : 'metric') as UnitSystem;
  if (!paceSecPerKm || paceSecPerKm <= 0) return '--:--';
  const paceSec = unit === 'imperial' ? paceSecPerKm * 1.60934 : paceSecPerKm;
  const mins = Math.floor(paceSec / 60);
  const secs = Math.round(paceSec % 60);
  const unitLabel = unit === 'imperial' ? '/mi' : '/km';
  return `${mins}:${secs.toString().padStart(2, '0')} ${unitLabel}`;
}

export interface CardioProgressionStats {
  longestDistanceKm: number;
  longestDistanceActivity?: string;
  longestDurationMinutes: number;
  bestPaceMinPerKm: string;
  bestPaceSecPerKm?: number;
  bestPaceActivity?: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  sessionCount: number;
  totalSessions: number;
}

/**
 * Calculate personal records & progression for cardio sessions
 */
export function calculateCardioStats(
  sessions: CardioSession[],
  filterTypeOrUnit?: CardioActivityType | UnitSystem
): CardioProgressionStats {
  const isTypeFilter =
    filterTypeOrUnit &&
    filterTypeOrUnit !== 'metric' &&
    filterTypeOrUnit !== 'imperial';
  const filtered = isTypeFilter
    ? sessions.filter((s) => s.type === filterTypeOrUnit)
    : sessions;

  if (!filtered || filtered.length === 0) {
    return {
      longestDistanceKm: 0,
      longestDurationMinutes: 0,
      bestPaceMinPerKm: '--:--',
      bestPaceSecPerKm: 0,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      totalCaloriesBurned: 0,
      sessionCount: 0,
      totalSessions: 0,
    };
  }

  let longestDist = 0;
  let longestDistAct = '';
  let longestDur = 0;
  let fastestPaceDec = Infinity;
  let fastestPaceSecPerKm = 0;
  let bestPaceStr = '--:--';
  let bestPaceAct = '';
  let totalDist = 0;
  let totalDur = 0;
  let totalCals = 0;

  filtered.forEach((s) => {
    if (s.distanceKm && s.distanceKm > longestDist) {
      longestDist = s.distanceKm;
      longestDistAct = s.type;
    }
    if (s.durationMinutes > longestDur) {
      longestDur = s.durationMinutes;
    }
    if (s.distanceKm && s.distanceKm > 0 && s.durationMinutes > 0) {
      const pace = s.durationMinutes / s.distanceKm;
      if (pace < fastestPaceDec) {
        fastestPaceDec = pace;
        fastestPaceSecPerKm = Math.round((s.durationMinutes * 60) / s.distanceKm);
        bestPaceStr = formatPace(s.durationMinutes, s.distanceKm);
        bestPaceAct = s.type;
      }
    }
    totalDist += s.distanceKm || 0;
    totalDur += s.durationMinutes;
    totalCals += s.caloriesBurned;
  });

  return {
    longestDistanceKm: Number(longestDist.toFixed(2)),
    longestDistanceActivity: longestDistAct,
    longestDurationMinutes: longestDur,
    bestPaceMinPerKm: fastestPaceDec !== Infinity ? bestPaceStr : '--:--',
    bestPaceSecPerKm: fastestPaceSecPerKm,
    bestPaceActivity: bestPaceAct,
    totalDistanceKm: Number(totalDist.toFixed(1)),
    totalDurationMinutes: totalDur,
    totalCaloriesBurned: totalCals,
    sessionCount: filtered.length,
    totalSessions: filtered.length,
  };
}

/**
 * Unit conversions
 */
export function convertKgToLb(kg: number): number {
  return Number((kg * 2.20462).toFixed(1));
}

export function convertLbToKg(lb: number): number {
  return Number((lb / 2.20462).toFixed(2));
}

export function convertCmToInches(cm: number): number {
  return Number((cm / 2.54).toFixed(1));
}

export function convertInchesToCm(inches: number): number {
  return Number((inches * 2.54).toFixed(1));
}

export function convertKmToMiles(km: number): number {
  return Number((km / 1.60934).toFixed(2));
}

export function convertMilesToKm(miles: number): number {
  return Number((miles * 1.60934).toFixed(2));
}

export function formatDistance(distKm: number, unit: UnitSystem = 'metric'): string {
  if (unit === 'imperial') {
    return `${convertKmToMiles(distKm)} mi`;
  }
  return `${distKm.toFixed(2)} km`;
}

export function formatWeight(valKg: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${convertKgToLb(valKg)} lb`;
  }
  return `${valKg.toFixed(1)} kg`;
}

/**
 * Local date string formatter: returns YYYY-MM-DD in the user's local timezone.
 * Eliminates UTC boundary shifting bugs where evening logs get stamped as tomorrow.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a YYYY-MM-DD date string into a clean human label (e.g., "Today", "Yesterday", "Thu, Oct 29")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Returns an array of local date strings for the past N days (for up to 30 days history)
 */
export function getRecentDateStrings(days = 30): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    result.push(getLocalDateString(d));
  }
  return result;
}


/**
 * Determine the user's preferred color scheme from the OS/media query.
 */
export function getPreferredTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}
