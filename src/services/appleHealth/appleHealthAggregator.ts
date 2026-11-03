import { CardioSession, CompletedWorkout, SleepRecord, WeightRecord } from '../../types';
import {
  AppleHealthActivitySummaryRecord,
  AppleHealthRawRecord,
  AppleHealthWorkoutRecord,
  CategorySummaryInfo,
  DailyAggregatedMetrics,
  HealthCategoryKey,
  ImportFilterOptions,
  ImportPreviewStats,
  NormalizedHealthImportData,
} from './types';
import {
  aggregateSleepRecords,
  mapAppleWorkout,
  normalizeBodyFatPercentage,
  normalizeDistanceToKm,
  normalizeEnergyToKcal,
  normalizeLengthToCm,
  normalizeMassToKg,
  normalizeWaterToMl,
  parseAppleHealthDate,
} from './normalization';
import { StreamingAppleHealthXmlParser } from './streamingXmlParser';

/**
 * State accumulator for streaming Apple Health records.
 * Collects and aggregates time series into structured categories without memory bloat.
 */
export class AppleHealthDataAggregator {
  private weightsMap = new Map<string, WeightRecord>();
  private workoutsList: CompletedWorkout[] = [];
  private cardioList: CardioSession[] = [];
  private rawSleepRecords: AppleHealthRawRecord[] = [];
  private dailyMetricsMap = new Map<string, DailyAggregatedMetrics>();
  private hrDailyAccumulator = new Map<string, { sum: number; count: number }>();
  private rhrDailyAccumulator = new Map<string, { sum: number; count: number }>();
  private hrvDailyAccumulator = new Map<string, { sum: number; count: number }>();
  private unsupportedCounts: Record<string, number> = {};
  private sourceNamesSet = new Set<string>();

  private earliestDate: string = '9999-99-99';
  private latestDate: string = '0000-00-00';
  private totalRecords = 0;

  public handleRecord(record: AppleHealthRawRecord): void {
    this.totalRecords++;
    if (record.sourceName) {
      this.sourceNamesSet.add(record.sourceName);
    }

    const { dateOnly, iso } = parseAppleHealthDate(record.startDate);
    this.updateDateRange(dateOnly);

    const type = record.type;
    const rawVal = parseFloat(record.value || '0');
    const unit = record.unit || '';

    // 1. BODY COMPOSITION
    if (type === 'HKQuantityTypeIdentifierBodyMass') {
      if (rawVal > 0) {
        const weightKg = normalizeMassToKg(rawVal, unit);
        const existing = this.weightsMap.get(dateOnly);
        if (!existing || iso > (existing as any)._lastIso) {
          this.weightsMap.set(dateOnly, {
            date: dateOnly,
            weightKg,
            bodyFatPct: existing?.bodyFatPct,
            waistCm: existing?.waistCm,
            notes: `Imported from ${record.sourceName || 'Apple Health'}`,
            ...({ _lastIso: iso } as any),
          });
        }
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierBodyFatPercentage') {
      if (rawVal > 0) {
        const bodyFatPct = normalizeBodyFatPercentage(rawVal, unit);
        const existing = this.weightsMap.get(dateOnly);
        if (existing) {
          existing.bodyFatPct = bodyFatPct;
        } else {
          this.weightsMap.set(dateOnly, {
            date: dateOnly,
            weightKg: 0, // placeholder until BodyMass record is found
            bodyFatPct,
            notes: `Imported from ${record.sourceName || 'Apple Health'}`,
            ...({ _lastIso: iso } as any),
          });
        }
      }
      return;
    }

    // 2. SLEEP ANALYSIS
    if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      this.rawSleepRecords.push(record);
      return;
    }

    // 3. ACTIVITY & MOVEMENT
    const daily = this.getOrCreateDailyMetric(dateOnly);

    if (type === 'HKQuantityTypeIdentifierStepCount') {
      if (rawVal > 0) {
        daily.steps = (daily.steps || 0) + Math.round(rawVal);
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierDistanceWalkingRunning') {
      if (rawVal > 0) {
        const km = normalizeDistanceToKm(rawVal, unit);
        daily.walkingRunningDistanceKm = parseFloat(((daily.walkingRunningDistanceKm || 0) + km).toFixed(3));
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
      if (rawVal > 0) {
        const kcal = normalizeEnergyToKcal(rawVal, unit);
        daily.activeEnergyKcal = (daily.activeEnergyKcal || 0) + kcal;
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierBasalEnergyBurned') {
      if (rawVal > 0) {
        const kcal = normalizeEnergyToKcal(rawVal, unit);
        daily.basalEnergyKcal = (daily.basalEnergyKcal || 0) + kcal;
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierAppleExerciseTime') {
      if (rawVal > 0) {
        daily.exerciseMinutes = (daily.exerciseMinutes || 0) + Math.round(rawVal);
      }
      return;
    }

    // 4. CARDIOVASCULAR
    if (type === 'HKQuantityTypeIdentifierRestingHeartRate') {
      if (rawVal > 0) {
        const acc = this.rhrDailyAccumulator.get(dateOnly) || { sum: 0, count: 0 };
        acc.sum += rawVal;
        acc.count++;
        this.rhrDailyAccumulator.set(dateOnly, acc);
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
      if (rawVal > 0) {
        const acc = this.hrvDailyAccumulator.get(dateOnly) || { sum: 0, count: 0 };
        acc.sum += rawVal;
        acc.count++;
        this.hrvDailyAccumulator.set(dateOnly, acc);
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierHeartRate') {
      if (rawVal > 0) {
        const acc = this.hrDailyAccumulator.get(dateOnly) || { sum: 0, count: 0 };
        acc.sum += rawVal;
        acc.count++;
        this.hrDailyAccumulator.set(dateOnly, acc);
      }
      return;
    }

    if (type === 'HKQuantityTypeIdentifierVO2Max') {
      if (rawVal > 0) {
        daily.vo2Max = parseFloat(rawVal.toFixed(1));
      }
      return;
    }

    // 5. NUTRITION & DIETARY
    if (type === 'HKQuantityTypeIdentifierDietaryEnergyConsumed') {
      if (rawVal > 0) {
        daily.dietaryEnergyKcal = (daily.dietaryEnergyKcal || 0) + normalizeEnergyToKcal(rawVal, unit);
      }
      return;
    }
    if (type === 'HKQuantityTypeIdentifierDietaryProtein') {
      if (rawVal > 0) {
        daily.dietaryProteinGrams = parseFloat(((daily.dietaryProteinGrams || 0) + rawVal).toFixed(1));
      }
      return;
    }
    if (type === 'HKQuantityTypeIdentifierDietaryCarbohydrates') {
      if (rawVal > 0) {
        daily.dietaryCarbsGrams = parseFloat(((daily.dietaryCarbsGrams || 0) + rawVal).toFixed(1));
      }
      return;
    }
    if (type === 'HKQuantityTypeIdentifierDietaryFatTotal') {
      if (rawVal > 0) {
        daily.dietaryFatGrams = parseFloat(((daily.dietaryFatGrams || 0) + rawVal).toFixed(1));
      }
      return;
    }
    if (type === 'HKQuantityTypeIdentifierDietaryWater') {
      if (rawVal > 0) {
        daily.dietaryWaterMl = (daily.dietaryWaterMl || 0) + normalizeWaterToMl(rawVal, unit);
      }
      return;
    }

    // Unsupported / other record types tracked for summary
    const cleanType = type.replace(/^HK(?:Quantity|Category)TypeIdentifier/, '');
    this.unsupportedCounts[cleanType] = (this.unsupportedCounts[cleanType] || 0) + 1;
  }

  public handleWorkout(workout: AppleHealthWorkoutRecord): void {
    this.totalRecords++;
    if (workout.sourceName) {
      this.sourceNamesSet.add(workout.sourceName);
    }

    const { dateOnly } = parseAppleHealthDate(workout.startDate);
    this.updateDateRange(dateOnly);

    const mapped = mapAppleWorkout(workout);
    if (mapped.isStrength && mapped.workout) {
      this.workoutsList.push(mapped.workout);
    } else if (mapped.cardio) {
      this.cardioList.push(mapped.cardio);
    }
  }

  public handleActivitySummary(summary: AppleHealthActivitySummaryRecord): void {
    this.totalRecords++;
    const date = summary.date;
    this.updateDateRange(date);

    const daily = this.getOrCreateDailyMetric(date);
    daily.activeEnergyKcal = Math.max(daily.activeEnergyKcal || 0, summary.activeEnergyBurnedKcal);
    daily.exerciseMinutes = Math.max(daily.exerciseMinutes || 0, summary.exerciseTimeMinutes);
    daily.standHours = Math.max(daily.standHours || 0, summary.standHours);
  }

  private getOrCreateDailyMetric(date: string): DailyAggregatedMetrics {
    let item = this.dailyMetricsMap.get(date);
    if (!item) {
      item = { date };
      this.dailyMetricsMap.set(date, item);
    }
    return item;
  }

  private updateDateRange(dateOnly: string): void {
    if (dateOnly < this.earliestDate) this.earliestDate = dateOnly;
    if (dateOnly > this.latestDate) this.latestDate = dateOnly;
  }

  /**
   * Finalizes aggregation, processes sleep intervals, computes daily averages,
   * and returns structured normalized import data.
   */
  public finalize(): NormalizedHealthImportData {
    // 1. Finalize cardiovascular daily averages
    for (const [date, acc] of this.rhrDailyAccumulator.entries()) {
      const daily = this.getOrCreateDailyMetric(date);
      daily.restingHeartRateBpm = Math.round(acc.sum / acc.count);
    }
    for (const [date, acc] of this.hrvDailyAccumulator.entries()) {
      const daily = this.getOrCreateDailyMetric(date);
      daily.hrvSdnnMs = Math.round(acc.sum / acc.count);
    }
    for (const [date, acc] of this.hrDailyAccumulator.entries()) {
      const daily = this.getOrCreateDailyMetric(date);
      daily.avgHeartRateBpm = Math.round(acc.sum / acc.count);
    }

    // 2. Aggregate sleep intervals
    const sleepRecords = aggregateSleepRecords(this.rawSleepRecords);
    for (const s of sleepRecords) {
      const daily = this.getOrCreateDailyMetric(s.date);
      daily.sleepDurationMinutes = s.durationMinutes;
    }

    // 3. Filter weights (remove weightKg: 0 if only bodyFatPct was logged)
    const validWeights = Array.from(this.weightsMap.values())
      .filter((w) => w.weightKg > 0)
      .map((w) => {
        const copy = { ...w };
        delete (copy as any)._lastIso;
        return copy;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Sort daily metrics chronologically
    const dailyMetrics = Array.from(this.dailyMetricsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 5. Deduplicate cardio & workouts by stable ID
    const cardioUnique = deduplicateById(this.cardioList);
    const workoutsUnique = deduplicateById(this.workoutsList);

    return {
      weights: validWeights,
      cardioSessions: cardioUnique,
      workouts: workoutsUnique,
      sleepRecords,
      dailyMetrics,
      unsupportedRecordCounts: this.unsupportedCounts,
      sourceNames: Array.from(this.sourceNamesSet),
      dateRange: {
        start: this.earliestDate !== '9999-99-99' ? this.earliestDate : new Date().toISOString().slice(0, 10),
        end: this.latestDate !== '0000-00-00' ? this.latestDate : new Date().toISOString().slice(0, 10),
      },
      totalRecordsProcessed: this.totalRecords,
    };
  }

  /**
   * Builds an import preview breakdown based on discovered categories.
   */
  public buildPreviewStats(
    normalized: NormalizedHealthImportData,
    existingWeights: WeightRecord[] = [],
    existingCardio: CardioSession[] = [],
    existingWorkouts: CompletedWorkout[] = [],
    existingSleep: SleepRecord[] = []
  ): ImportPreviewStats {
    return buildImportPreviewStats(normalized, {
      weights: existingWeights,
      cardio: existingCardio,
      workouts: existingWorkouts,
      sleep: existingSleep,
    });
  }
}

/**
 * Builds an import preview breakdown based on discovered categories and existing state.
 */
export function buildImportPreviewStats(
  normalized: NormalizedHealthImportData,
  existing: {
    weights?: WeightRecord[];
    cardio?: CardioSession[];
    workouts?: CompletedWorkout[];
    sleep?: SleepRecord[];
  } = {}
): ImportPreviewStats {
  const existingWeightDates = new Set((existing.weights || []).map((w) => w.date));
  const existingCardioIds = new Set((existing.cardio || []).map((c) => c.id));
  const existingWorkoutIds = new Set((existing.workouts || []).map((w) => w.id));
  const existingSleepIds = new Set((existing.sleep || []).map((s) => s.id));

  const duplicateWeights = normalized.weights.filter((w) => existingWeightDates.has(w.date)).length;
  const duplicateCardio = normalized.cardioSessions.filter((c) => existingCardioIds.has(c.id)).length;
  const duplicateWorkouts = normalized.workouts.filter((w) => existingWorkoutIds.has(w.id)).length;
  const duplicateSleep = normalized.sleepRecords.filter((s) => existingSleepIds.has(s.id)).length;

  const categories: CategorySummaryInfo[] = [
    {
      key: 'body_composition',
      label: 'Body Composition',
      description: 'Scale weight logs, body fat percentage, and lean mass',
      recordCount: normalized.weights.length,
      sampleDescription: `${normalized.weights.length} weigh-ins`,
      selected: normalized.weights.length > 0,
    },
    {
      key: 'workouts',
      label: 'Workouts & Training',
      description: 'Strength training sessions and completed gym routines',
      recordCount: normalized.workouts.length,
      sampleDescription: `${normalized.workouts.length} strength workouts`,
      selected: normalized.workouts.length > 0,
    },
    {
      key: 'activity',
      label: 'Activity & Movement',
      description: 'Cardio sessions, daily steps, active kcal, and distances',
      recordCount: normalized.cardioSessions.length + normalized.dailyMetrics.length,
      sampleDescription: `${normalized.cardioSessions.length} cardio runs/rides, ${normalized.dailyMetrics.length} days of steps`,
      selected: normalized.cardioSessions.length > 0 || normalized.dailyMetrics.length > 0,
    },
    {
      key: 'sleep',
      label: 'Sleep & Recovery',
      description: 'Restorative sleep sessions, bedtimes, and sleep duration',
      recordCount: normalized.sleepRecords.length,
      sampleDescription: `${normalized.sleepRecords.length} sleep nights`,
      selected: normalized.sleepRecords.length > 0,
    },
    {
      key: 'cardiovascular',
      label: 'Cardiovascular Health',
      description: 'Resting heart rate trends and heart-rate variability (HRV)',
      recordCount: normalized.dailyMetrics.filter((m) => m.restingHeartRateBpm || m.hrvSdnnMs).length,
      sampleDescription: `${normalized.dailyMetrics.filter((m) => m.restingHeartRateBpm).length} days with resting HR`,
      selected: true,
    },
    {
      key: 'nutrition',
      label: 'Nutrition & Hydration',
      description: 'Dietary energy, macronutrients, and water intake records',
      recordCount: normalized.dailyMetrics.filter((m) => m.dietaryEnergyKcal || m.dietaryWaterMl).length,
      sampleDescription: `${normalized.dailyMetrics.filter((m) => m.dietaryEnergyKcal).length} days of nutrition`,
      selected: normalized.dailyMetrics.some((m) => m.dietaryEnergyKcal || m.dietaryWaterMl),
    },
  ];

  const unsupportedCount = Object.values(normalized.unsupportedRecordCounts).reduce(
    (acc, c) => acc + c,
    0
  );

  return {
    totalRecordsFound: normalized.totalRecordsProcessed,
    dateRange: normalized.dateRange,
    categories,
    estimatedDuplicates: {
      weights: duplicateWeights,
      workouts: duplicateWorkouts,
      cardio: duplicateCardio,
      sleep: duplicateSleep,
    },
    unsupportedRecordTypesCount: unsupportedCount,
    sources: normalized.sourceNames,
  };
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

/**
 * Filters normalized import data based on user selections (selected categories & date range).
 */
export function filterNormalizedData(
  data: NormalizedHealthImportData,
  options: ImportFilterOptions
): {
  weights: WeightRecord[];
  cardio: CardioSession[];
  workouts: CompletedWorkout[];
  sleep: SleepRecord[];
  dailyMetrics: DailyAggregatedMetrics[];
} {
  const cutoffDate = computeCutoffDate(options.dateRange);

  const filterByDate = (dateStr: string) => {
    if (!cutoffDate) return true;
    return dateStr >= cutoffDate;
  };

  const weights = options.categories.body_composition
    ? data.weights.filter((w) => filterByDate(w.date))
    : [];

  const workouts = options.categories.workouts
    ? data.workouts.filter((w) => filterByDate(w.startTime.slice(0, 10)))
    : [];

  const cardio = options.categories.activity
    ? data.cardioSessions.filter((c) => filterByDate(c.date.slice(0, 10)))
    : [];

  const sleep = options.categories.sleep
    ? data.sleepRecords.filter((s) => filterByDate(s.date))
    : [];

  const dailyMetrics = data.dailyMetrics.filter((m) => filterByDate(m.date));

  return { weights, cardio, workouts, sleep, dailyMetrics };
}

function computeCutoffDate(range: ImportFilterOptions['dateRange']): string | null {
  if (range === 'all') return null;
  const now = new Date();
  const d = new Date(now);
  if (range === '30d') d.setDate(d.getDate() - 30);
  else if (range === '90d') d.setDate(d.getDate() - 90);
  else if (range === '6m') d.setMonth(d.getMonth() - 6);
  else if (range === '1y') d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
