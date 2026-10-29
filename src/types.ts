export type UnitSystem = 'metric' | 'imperial';
export type FitnessGoal = 'fat_loss' | 'recomp' | 'maintenance' | 'muscle_gain';

export interface MacroGoals {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category?: 'Protein' | 'Carbohydrates' | 'Fats' | 'Produce' | 'Dairy' | 'Meals';
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source?: string; // e.g. "USDA FoodData Central SR Legacy"
  isFavorite?: boolean;
  isRecent?: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LoggedFood {
  id: string;
  foodId: string;
  mealType: MealType;
  name: string;
  servingCount: number;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  loggedAt: string; // ISO date string
}

export interface ParsedAiFoodItem {
  id: string;
  name: string;
  servingCount: number;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightRecord {
  date: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number;
  bodyFatPct?: number;
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  targetWeightKg: number;
  targetReps: number;
  actualWeightKg: number;
  actualReps: number;
  isCompleted: boolean;
  rpe?: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight';
  defaultRestSeconds: number;
  instructions?: string;
  personalRecord?: {
    weightKg: number;
    reps: number;
    estimated1RMKg: number;
    date: string;
  };
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutTemplateExercise {
  exerciseId: string;
  defaultSets: number;
  defaultReps: number;
  targetRpe?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  targetSplit: string;
  description?: string;
  exercises: WorkoutTemplateExercise[];
}

export interface ActiveWorkoutSession {
  templateId?: string;
  name: string;
  startTime: string; // ISO date string
  exercises: WorkoutExercise[];
  restTimerSecondsRemaining?: number;
  isTimerRunning?: boolean;
  activeExerciseIndex?: number;
}

export interface CompletedWorkout {
  id: string;
  templateId?: string;
  name: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  personalRecordsAchieved?: string[];
  notes?: string;
}

export type CardioActivityType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'stationary_bike'
  | 'swimming'
  | 'rowing'
  | 'stairmaster'
  | 'elliptical';

export interface CardioSession {
  id: string;
  type: CardioActivityType;
  activity?: CardioActivityType;
  name?: string;
  date: string; // ISO date string
  durationMinutes: number;
  durationSeconds?: number;
  distanceKm?: number;
  avgPaceMinPerKm?: string; // e.g. "5:20"
  avgPaceSecPerKm?: number;
  caloriesBurned: number;
  avgHeartRateBpm?: number;
  elevationMeters?: number;
  notes?: string;
}

export interface WeeklyReviewRecord {
  id: string;
  weekEndDate: string;
  avgCalorieIntake: number;
  avgProteinIntake: number;
  avgWeightTrendKg: number;
  weightDeltaKg: number;
  estimatedTdee: number;
  confidenceScore: number; // 0 to 1
  proposedCalorieTarget: number;
  currentCalorieTarget: number;
  adjustmentDelta: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface UserProfile {
  name: string;
  unitSystem: UnitSystem;
  goal: FitnessGoal;
  targetRateKgPerWeek: number; // e.g. -0.4 for cutting, 0 for maintenance, +0.2 for lean bulk
  heightCm: number;
  targets: MacroGoals;
  theme: 'dark' | 'light';
  startDate: string;
}
