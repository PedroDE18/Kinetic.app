export type UnitSystem = 'metric' | 'imperial';
export type FitnessGoal = 'fat_loss' | 'recomp' | 'maintenance' | 'muscle_gain';

export interface MacroGoals {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
}

export interface RecipeIngredient {
  id: string;
  foodId?: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  barcode?: string;
  isFavorite?: boolean;
  isRecent?: boolean;
  recipeIngredients?: RecipeIngredient[];
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

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  targetWeightKg: number;
  targetReps: number;
  actualWeightKg: number;
  actualReps: number;
  isCompleted: boolean;
  rpe?: number;
  setType?: SetType;
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

export interface WeeklyRoutineDay {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string; // 'Monday', 'Tuesday', etc.
  type: 'training' | 'active_recovery' | 'rest';
  templateId?: string; // ID of WorkoutTemplate if type === 'training'
  focusName: string; // e.g. "Push: Chest & Shoulders" or "Active Recovery & Mobility"
}

export type SexType = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  name: string;
  email?: string;
  unitSystem: UnitSystem;
  goal: FitnessGoal;
  targetRateKgPerWeek: number; // e.g. -0.4 for cutting, 0 for maintenance, +0.2 for lean bulk
  heightCm: number;
  weightKg?: number;
  targetWeightKg?: number;
  age?: number;
  sex?: SexType;
  activityLevel?: ActivityLevel;
  experienceLevel?: ExperienceLevel;
  targets: MacroGoals;
  theme: 'dark' | 'light';
  startDate: string;
  geminiApiKey?: string;
  onboardingCompleted?: boolean;
  dailyIntention?: string;
}

/* =========================================================================
   EUNOIA LIFE-MANAGEMENT DOMAIN MODELS
   ========================================================================= */

export type LifeArea =
  | 'health'
  | 'relationships'
  | 'career'
  | 'finances'
  | 'mind_growth'
  | 'craft_creativity';

export interface LifeGoal {
  id: string;
  area: LifeArea;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'active' | 'achieved' | 'paused';
  metricTarget?: number;
  metricCurrent?: number;
  metricUnit?: string;
  createdAt: string;
}

export interface LifeProject {
  id: string;
  goalId?: string;
  area: LifeArea;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

export interface LifeTask {
  id: string;
  projectId?: string;
  goalId?: string;
  area?: LifeArea;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
}

export interface EunoiaHabit {
  id: string;
  title: string;
  purpose: string; // The philosophical "Why"
  area: LifeArea;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly_target';
  targetDaysPerWeek?: number;
  triggerCue: string; // e.g. "After morning tea"
  minimumViableAction: string; // "Read 1 page", "5 pushups"
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  isNonNegotiable: boolean;
  relatedGoalId?: string;
  completedDates: string[]; // ['2026-11-03', ...]
  archived?: boolean;
  createdAt: string;
}

export type FrictionCategory = 'physical' | 'digital' | 'temporal' | 'social';
export type FrictionActionType = 'add_friction' | 'remove_friction';

export interface FrictionIntervention {
  id: string;
  title: string;
  category: FrictionCategory;
  actionType: FrictionActionType;
  targetBehavior: string; // e.g. "Impulsive nighttime phone scrolling"
  mechanism: string; // e.g. "Place charger outside the bedroom"
  implementationSteps: string[];
  status: 'active' | 'experimenting' | 'paused' | 'mastered';
  startDate: string;
  reviewDate: string;
  outcomeNotes?: string;
  perceivedEffectiveness?: number; // 1 to 5
}

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bedTime: string; // e.g. "22:45"
  wakeTime: string; // e.g. "06:30"
  durationMinutes: number;
  qualityRating: number; // 1-5
  restfulness: 'poor' | 'fair' | 'good' | 'optimal';
  notes?: string;
}

export type ReflectionType = 'morning' | 'evening' | 'freeform' | 'weekly_audit';
export type EmotionalState = 'centered' | 'calm' | 'anxious' | 'scattered' | 'fatigued' | 'energized';

export interface ReflectionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: ReflectionType;
  promptAnswers: Record<string, string>;
  freeformContent?: string;
  emotionalState?: EmotionalState;
  createdAt: string;
}

export interface RelationshipTouchpoint {
  id: string;
  name: string;
  relationshipType: 'friend' | 'family' | 'mentor' | 'peer' | 'partner';
  intention: string; // "Listen with full presence and check in"
  desiredFrequencyDays: number; // e.g. 7 or 14
  lastContactDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface LearningItem {
  id: string;
  title: string;
  authorOrSource?: string;
  type: 'book' | 'article' | 'course' | 'skill';
  status: 'backlog' | 'in_progress' | 'completed';
  currentProgress?: number;
  totalProgress?: number;
  keyTakeaway?: string;
  area: LifeArea;
  updatedAt: string;
}
