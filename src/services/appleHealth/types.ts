import { CardioActivityType, CardioSession, CompletedWorkout, WeightRecord, SleepRecord } from '../../types';

export type HealthCategoryKey =
  | 'body_composition'
  | 'activity'
  | 'cardiovascular'
  | 'sleep'
  | 'workouts'
  | 'nutrition';

export interface CategorySummaryInfo {
  key: HealthCategoryKey;
  label: string;
  description: string;
  recordCount: number;
  sampleDescription?: string;
  selected: boolean;
}

export interface AppleHealthRawRecord {
  type: string;
  value: string;
  unit?: string;
  startDate: string;
  endDate: string;
  creationDate?: string;
  sourceName?: string;
  sourceVersion?: string;
  device?: string;
  metadata?: Record<string, string>;
}

export interface AppleHealthWorkoutRecord {
  activityType: string;
  durationSeconds: number;
  distanceKm?: number;
  energyKcal?: number;
  startDate: string;
  endDate: string;
  creationDate?: string;
  sourceName?: string;
  sourceVersion?: string;
  device?: string;
  avgHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  metadata?: Record<string, string>;
}

export interface AppleHealthActivitySummaryRecord {
  date: string; // YYYY-MM-DD
  activeEnergyBurnedKcal: number;
  activeEnergyGoalKcal: number;
  exerciseTimeMinutes: number;
  exerciseTimeGoalMinutes: number;
  standHours: number;
  standHoursGoal: number;
}

export interface DailyAggregatedMetrics {
  date: string; // YYYY-MM-DD
  steps?: number;
  walkingRunningDistanceKm?: number;
  activeEnergyKcal?: number;
  basalEnergyKcal?: number;
  exerciseMinutes?: number;
  standHours?: number;
  restingHeartRateBpm?: number;
  avgHeartRateBpm?: number;
  hrvSdnnMs?: number;
  vo2Max?: number;
  sleepDurationMinutes?: number;
  dietaryEnergyKcal?: number;
  dietaryProteinGrams?: number;
  dietaryCarbsGrams?: number;
  dietaryFatGrams?: number;
  dietaryWaterMl?: number;
}

export interface NormalizedHealthImportData {
  weights: WeightRecord[];
  cardioSessions: CardioSession[];
  workouts: CompletedWorkout[];
  sleepRecords: SleepRecord[];
  dailyMetrics: DailyAggregatedMetrics[];
  unsupportedRecordCounts: Record<string, number>;
  sourceNames: string[];
  dateRange: {
    start: string;
    end: string;
  };
  totalRecordsProcessed: number;
}

export interface ImportPreviewStats {
  totalRecordsFound: number;
  dateRange: {
    start: string;
    end: string;
  };
  categories: CategorySummaryInfo[];
  estimatedDuplicates: {
    weights: number;
    workouts: number;
    cardio: number;
    sleep: number;
  };
  unsupportedRecordTypesCount: number;
  sources: string[];
}

export type ImportDateRangeOption = 'all' | '1y' | '6m' | '90d' | '30d';

export interface ImportFilterOptions {
  dateRange: ImportDateRangeOption;
  categories: Record<HealthCategoryKey, boolean>;
}

export interface ImportProgressUpdate {
  stage: 'reading' | 'unzipping' | 'parsing' | 'normalizing' | 'preview_ready' | 'persisting' | 'completed' | 'error';
  progressPct: number;
  recordsParsed: number;
  currentEntity?: string;
  error?: string;
}

export interface FinalImportReport {
  success: boolean;
  weightsImported: number;
  workoutsImported: number;
  cardioImported: number;
  sleepImported: number;
  dailyMetricsDays: number;
  duplicatesSkipped: number;
  timeTakenMs: number;
  sourceSummary: string;
}
