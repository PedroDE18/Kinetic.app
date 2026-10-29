import {
  UserProfile,
  FoodItem,
  ExerciseDefinition,
  WorkoutTemplate,
  WeightRecord,
  LoggedFood,
  CompletedWorkout,
  WeeklyReviewRecord,
  CardioSession,
} from '../types';
import { calculateAdaptiveTDEE, generateWeeklyAdjustmentProposal } from './engine';

export const initialProfile: UserProfile = {
  name: 'Alex Rivera',
  unitSystem: 'metric',
  goal: 'fat_loss',
  targetRateKgPerWeek: -0.4,
  heightCm: 180,
  theme: 'dark',
  startDate: '2026-10-01',
  targets: {
    calories: 2150,
    proteinGrams: 175,
    carbsGrams: 200,
    fatGrams: 65,
    waterMl: 3000,
  },
};

export const mockFoodLibrary: FoodItem[] = [
  {
    id: 'f-1',
    name: 'Rolled Oats',
    brand: 'Quaker',
    category: 'Carbohydrates',
    servingSize: 50,
    servingUnit: 'g',
    calories: 190,
    protein: 7,
    carbs: 32,
    fat: 3.5,
    fiber: 5,
    source: 'USDA FoodData Central #1101825',
    isFavorite: true,
  },
  {
    id: 'f-2',
    name: 'Whey Protein Isolate',
    brand: 'Optimum Nutrition',
    category: 'Protein',
    servingSize: 31,
    servingUnit: 'g',
    calories: 120,
    protein: 24,
    carbs: 2,
    fat: 1,
    fiber: 0,
    source: 'Manufacturer Label (Gold Standard)',
    isFavorite: true,
  },
  {
    id: 'f-3',
    name: 'Grilled Chicken Breast',
    brand: 'Lean Cuts',
    category: 'Protein',
    servingSize: 150,
    servingUnit: 'g',
    calories: 248,
    protein: 46,
    carbs: 0,
    fat: 5.4,
    fiber: 0,
    source: 'USDA FoodData Central SR Legacy #171077',
    isFavorite: true,
  },
  {
    id: 'f-4',
    name: 'Jasmine Rice (Cooked)',
    brand: 'Trader Joe’s',
    category: 'Carbohydrates',
    servingSize: 150,
    servingUnit: 'g',
    calories: 195,
    protein: 3.8,
    carbs: 43,
    fat: 0.5,
    fiber: 1,
    source: 'USDA FoodData Central #168884',
    isFavorite: true,
  },
  {
    id: 'f-5',
    name: 'Extra Virgin Olive Oil',
    brand: 'Kirkland',
    category: 'Fats',
    servingSize: 14,
    servingUnit: 'ml',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    fiber: 0,
    source: 'USDA FoodData Central #171413',
    isFavorite: true,
  },
  {
    id: 'f-6',
    name: 'Pasture-Raised Eggs',
    brand: 'Vital Farms',
    category: 'Protein',
    servingSize: 2,
    servingUnit: 'large eggs',
    calories: 144,
    protein: 12.6,
    carbs: 0.8,
    fat: 9.8,
    fiber: 0,
    source: 'USDA FoodData Central #171287',
    isFavorite: true,
  },
  {
    id: 'f-7',
    name: 'Greek Yogurt 0%',
    brand: 'Fage Total',
    category: 'Dairy',
    servingSize: 200,
    servingUnit: 'g',
    calories: 108,
    protein: 20.6,
    carbs: 6.0,
    fat: 0,
    fiber: 0,
    source: 'USDA FoodData Central & Fage Nutrition',
    isFavorite: true,
  },
  {
    id: 'f-8',
    name: 'Raw Almonds',
    brand: 'Blue Diamond',
    category: 'Fats',
    servingSize: 30,
    servingUnit: 'g',
    calories: 170,
    protein: 6,
    carbs: 6,
    fat: 15,
    fiber: 3.5,
    source: 'USDA FoodData Central #170567',
    isFavorite: false,
  },
  {
    id: 'f-9',
    name: 'Banana',
    brand: 'Fresh Produce',
    category: 'Produce',
    servingSize: 118,
    servingUnit: 'medium (118g)',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
    fiber: 3.1,
    source: 'USDA FoodData Central #173944',
    isFavorite: true,
  },
  {
    id: 'f-10',
    name: 'Hass Avocado',
    brand: 'Fresh Produce',
    category: 'Fats',
    servingSize: 75,
    servingUnit: 'half fruit (75g)',
    calories: 120,
    protein: 1.5,
    carbs: 6.5,
    fat: 11,
    fiber: 5,
    source: 'USDA FoodData Central #171705',
    isFavorite: true,
  },
  {
    id: 'f-11',
    name: 'Atlantic Salmon Fillet',
    brand: 'Wild Catch',
    category: 'Protein',
    servingSize: 150,
    servingUnit: 'g',
    calories: 312,
    protein: 34,
    carbs: 0,
    fat: 19,
    fiber: 0,
    source: 'USDA FoodData Central #175168',
    isFavorite: true,
  },
  {
    id: 'f-12',
    name: 'Roasted Sweet Potato',
    brand: 'Fresh Produce',
    category: 'Carbohydrates',
    servingSize: 150,
    servingUnit: 'g',
    calories: 135,
    protein: 3,
    carbs: 31,
    fat: 0.2,
    fiber: 4.5,
    source: 'USDA FoodData Central #168483',
    isFavorite: true,
  },
  {
    id: 'f-13',
    name: 'Whole Grain Sourdough',
    brand: 'Artisan Bakery',
    category: 'Carbohydrates',
    servingSize: 50,
    servingUnit: 'slice (50g)',
    calories: 120,
    protein: 4.5,
    carbs: 23,
    fat: 1,
    fiber: 2,
    source: 'USDA FoodData Central #172688',
    isFavorite: true,
  },
  {
    id: 'f-14',
    name: 'Natural Peanut Butter',
    brand: 'Smuckers Natural',
    category: 'Fats',
    servingSize: 32,
    servingUnit: 'tbsp (32g)',
    calories: 190,
    protein: 8,
    carbs: 6,
    fat: 16,
    fiber: 2.5,
    source: 'USDA FoodData Central #174266',
    isFavorite: false,
  },
  {
    id: 'f-15',
    name: 'Fresh Blueberries',
    brand: 'Organic Farm',
    category: 'Produce',
    servingSize: 100,
    servingUnit: 'g',
    calories: 57,
    protein: 0.7,
    carbs: 14.5,
    fat: 0.3,
    fiber: 2.4,
    source: 'USDA FoodData Central #171711',
    isFavorite: true,
  },
  {
    id: 'f-16',
    name: 'Steamed Broccoli',
    brand: 'Fresh Produce',
    category: 'Produce',
    servingSize: 120,
    servingUnit: 'g',
    calories: 42,
    protein: 3.4,
    carbs: 8.4,
    fat: 0.5,
    fiber: 3.8,
    source: 'USDA FoodData Central #170379',
    isFavorite: false,
  },
  {
    id: 'f-17',
    name: 'Chia & Hemp Seed Mix',
    brand: 'Superfoods',
    category: 'Fats',
    servingSize: 20,
    servingUnit: 'g (2 tbsp)',
    calories: 105,
    protein: 4.2,
    carbs: 4.8,
    fat: 7.2,
    fiber: 5.4,
    source: 'USDA FoodData Central #170554',
    isFavorite: true,
  },
];

export const mockExercises: ExerciseDefinition[] = [
  {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest (Pectoralis Major)', 'Anterior Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Serratus Anterior'],
    equipment: 'Barbell',
    defaultRestSeconds: 120,
    instructions: 'Retract scapulae, touch bar to mid-sternum, press upward keeping elbows at ~45-60°.',
    personalRecord: {
      weightKg: 92.5,
      reps: 6,
      estimated1RMKg: 111,
      date: '2026-10-18',
    },
  },
  {
    id: 'ex-2',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Clavicular Head (Upper Chest)'],
    secondaryMuscles: ['Anterior Deltoids', 'Triceps'],
    equipment: 'Dumbbell',
    defaultRestSeconds: 90,
    instructions: 'Set bench to 30° incline. Deep stretch at bottom, press up without clashing dumbbells.',
    personalRecord: {
      weightKg: 32,
      reps: 8,
      estimated1RMKg: 40.5,
      date: '2026-10-22',
    },
  },
  {
    id: 'ex-3',
    name: 'Barbell Back Squat',
    muscleGroup: 'Legs',
    primaryMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Spinal Erectors'],
    equipment: 'Barbell',
    defaultRestSeconds: 150,
    instructions: 'Break at knees and hips simultaneously. Descend below parallel, drive through mid-foot.',
    personalRecord: {
      weightKg: 125,
      reps: 5,
      estimated1RMKg: 145.8,
      date: '2026-10-12',
    },
  },
  {
    id: 'ex-4',
    name: 'Romanian Deadlift',
    muscleGroup: 'Legs',
    primaryMuscles: ['Hamstrings (Biceps Femoris)', 'Gluteus Maximus'],
    secondaryMuscles: ['Erector Spinae', 'Latissimus Dorsi', 'Forearms'],
    equipment: 'Barbell',
    defaultRestSeconds: 120,
    instructions: 'Push hips back with soft knees. Lower bar along shins until deep hamstring stretch.',
    personalRecord: {
      weightKg: 110,
      reps: 8,
      estimated1RMKg: 139.3,
      date: '2026-10-24',
    },
  },
  {
    id: 'ex-5',
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    primaryMuscles: ['Anterior & Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius', 'Core'],
    equipment: 'Barbell',
    defaultRestSeconds: 120,
    instructions: 'Brace core and glutes. Press vertically clearing chin, lock out overhead.',
    personalRecord: {
      weightKg: 62.5,
      reps: 6,
      estimated1RMKg: 75,
      date: '2026-10-15',
    },
  },
  {
    id: 'ex-6',
    name: 'Weighted Pull-Up',
    muscleGroup: 'Back',
    primaryMuscles: ['Latissimus Dorsi', 'Teres Major'],
    secondaryMuscles: ['Biceps Brachii', 'Rhomboids', 'Lower Traps'],
    equipment: 'Bodyweight',
    defaultRestSeconds: 120,
    instructions: 'Hang from full extension. Drive elbows down to your pockets to chest height.',
    personalRecord: {
      weightKg: 15,
      reps: 6,
      estimated1RMKg: 18,
      date: '2026-10-20',
    },
  },
  {
    id: 'ex-7',
    name: 'Chest Supported Row',
    muscleGroup: 'Back',
    primaryMuscles: ['Rhomboids', 'Mid Trapezius', 'Latissimus Dorsi'],
    secondaryMuscles: ['Biceps Brachii', 'Rear Deltoids'],
    equipment: 'Dumbbell',
    defaultRestSeconds: 90,
    instructions: 'Lie prone on incline bench. Retract scapulae firmly at top without shrugging.',
    personalRecord: {
      weightKg: 34,
      reps: 10,
      estimated1RMKg: 45.3,
      date: '2026-10-25',
    },
  },
  {
    id: 'ex-8',
    name: 'Cable Lateral Raise',
    muscleGroup: 'Shoulders',
    primaryMuscles: ['Lateral Deltoids'],
    secondaryMuscles: ['Supraspinatus', 'Trapezius'],
    equipment: 'Cable',
    defaultRestSeconds: 60,
    instructions: 'Position pulley at wrist height. Raise in scapular plane with slight elbow bend.',
    personalRecord: {
      weightKg: 12.5,
      reps: 15,
      estimated1RMKg: 18.8,
      date: '2026-10-26',
    },
  },
  {
    id: 'ex-9',
    name: 'Triceps Rope Pushdown',
    muscleGroup: 'Arms',
    primaryMuscles: ['Triceps Brachii (Lateral & Medial Heads)'],
    secondaryMuscles: ['Anconeus'],
    equipment: 'Cable',
    defaultRestSeconds: 60,
    instructions: 'Keep upper arms fixed at sides. Flare rope out at full bottom extension.',
    personalRecord: {
      weightKg: 27.5,
      reps: 12,
      estimated1RMKg: 38.5,
      date: '2026-10-26',
    },
  },
  {
    id: 'ex-10',
    name: 'Incline Dumbbell Curl',
    muscleGroup: 'Arms',
    primaryMuscles: ['Biceps Brachii (Long Head)'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    instructions: 'Lean back against incline bench. Full elbow extension at bottom, supinate on curl.',
    personalRecord: {
      weightKg: 16,
      reps: 10,
      estimated1RMKg: 21.3,
      date: '2026-10-26',
    },
  },
  {
    id: 'ex-11',
    name: 'Leg Press 45°',
    muscleGroup: 'Legs',
    primaryMuscles: ['Quadriceps (Vastus Medialis/Lateralis)'],
    secondaryMuscles: ['Gluteus Maximus', 'Calves'],
    equipment: 'Machine',
    defaultRestSeconds: 120,
    instructions: 'Place feet shoulder-width on platform. Lower sled until knees hit 90° angle.',
    personalRecord: {
      weightKg: 240,
      reps: 10,
      estimated1RMKg: 320,
      date: '2026-10-21',
    },
  },
  {
    id: 'ex-12',
    name: 'Hanging Leg Raise',
    muscleGroup: 'Core',
    primaryMuscles: ['Rectus Abdominis (Lower)', 'Iliopsoas'],
    secondaryMuscles: ['Obliques', 'Forearms'],
    equipment: 'Bodyweight',
    defaultRestSeconds: 60,
    instructions: 'Hang from bar. Roll pelvis upward towards ribs without swinging.',
    personalRecord: {
      weightKg: 0,
      reps: 15,
      estimated1RMKg: 0,
      date: '2026-10-23',
    },
  },
];

export const mockTemplates: WorkoutTemplate[] = [
  {
    id: 'tmpl-push',
    name: 'Push (Chest, Delts & Triceps)',
    targetSplit: 'Push / Pull / Legs',
    description: 'Horizontal and vertical pressing volume with tricep isolation.',
    exercises: [
      { exerciseId: 'ex-1', defaultSets: 3, defaultReps: 8 },
      { exerciseId: 'ex-2', defaultSets: 3, defaultReps: 10 },
      { exerciseId: 'ex-5', defaultSets: 3, defaultReps: 6 },
      { exerciseId: 'ex-8', defaultSets: 3, defaultReps: 15 },
      { exerciseId: 'ex-9', defaultSets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'tmpl-pull',
    name: 'Pull (Back, Rear Delts & Biceps)',
    targetSplit: 'Push / Pull / Legs',
    description: 'Vertical and horizontal pulling with heavy lat and bicep emphasis.',
    exercises: [
      { exerciseId: 'ex-6', defaultSets: 3, defaultReps: 6 },
      { exerciseId: 'ex-7', defaultSets: 3, defaultReps: 10 },
      { exerciseId: 'ex-8', defaultSets: 3, defaultReps: 15 },
      { exerciseId: 'ex-10', defaultSets: 3, defaultReps: 10 },
    ],
  },
  {
    id: 'tmpl-legs',
    name: 'Legs & Core (Quads, Posterior Chain & Abs)',
    targetSplit: 'Push / Pull / Legs',
    description: 'Quad strength, posterior chain hinge, and abdominal control.',
    exercises: [
      { exerciseId: 'ex-3', defaultSets: 3, defaultReps: 6 },
      { exerciseId: 'ex-4', defaultSets: 3, defaultReps: 8 },
      { exerciseId: 'ex-11', defaultSets: 3, defaultReps: 10 },
      { exerciseId: 'ex-12', defaultSets: 3, defaultReps: 15 },
    ],
  },
];

export const defaultWeeklySchedule = [
  { dayIndex: 0, dayName: 'Sunday', type: 'active_recovery' as const, focusName: 'Active Recovery: Walk & Mobility' },
  { dayIndex: 1, dayName: 'Monday', type: 'training' as const, templateId: 'tmpl-push', focusName: 'Push: Chest, Shoulders & Triceps' },
  { dayIndex: 2, dayName: 'Tuesday', type: 'active_recovery' as const, focusName: 'Active Recovery: Zone 2 Cardio & Stretch' },
  { dayIndex: 3, dayName: 'Wednesday', type: 'training' as const, templateId: 'tmpl-pull', focusName: 'Pull: Back, Rear Delts & Biceps' },
  { dayIndex: 4, dayName: 'Thursday', type: 'active_recovery' as const, focusName: 'Active Recovery: 8,000 Steps & Mobility' },
  { dayIndex: 5, dayName: 'Friday', type: 'training' as const, templateId: 'tmpl-legs', focusName: 'Legs: Quads, Hamstrings & Core' },
  { dayIndex: 6, dayName: 'Saturday', type: 'active_recovery' as const, focusName: 'Active Recovery: Outdoor Light Ride or Walk' },
];

export const initialCardioSessions: CardioSession[] = [
  {
    id: 'cardio-1',
    type: 'running',
    name: 'Outdoor 5K Tempo Run',
    date: '2026-10-27T07:15:00.000Z',
    durationMinutes: 26,
    distanceKm: 5.0,
    avgPaceMinPerKm: '5:12',
    caloriesBurned: 380,
    avgHeartRateBpm: 158,
    elevationMeters: 45,
    notes: 'Good rhythm on hills, negative split in final km.',
  },
  {
    id: 'cardio-2',
    type: 'cycling',
    name: 'Zone 2 Endurance Ride',
    date: '2026-10-25T08:30:00.000Z',
    durationMinutes: 52,
    distanceKm: 21.4,
    avgPaceMinPerKm: '2:25',
    caloriesBurned: 485,
    avgHeartRateBpm: 136,
    elevationMeters: 120,
    notes: 'Kept nasal breathing throughout, smooth cadence ~88 rpm.',
  },
  {
    id: 'cardio-3',
    type: 'walking',
    name: 'Incline Hill Walk',
    date: '2026-10-24T18:00:00.000Z',
    durationMinutes: 40,
    distanceKm: 3.6,
    avgPaceMinPerKm: '11:06',
    caloriesBurned: 210,
    avgHeartRateBpm: 115,
    notes: 'Active recovery evening walk.',
  },
  {
    id: 'cardio-4',
    type: 'stationary_bike',
    name: 'Intervals Sprint Session',
    date: '2026-10-21T17:45:00.000Z',
    durationMinutes: 25,
    distanceKm: 10.2,
    avgPaceMinPerKm: '2:27',
    caloriesBurned: 290,
    avgHeartRateBpm: 164,
    notes: '8x 30s max effort intervals with 90s spin down.',
  },
];

/**
 * Generate coherent historical data with multi-session volume progression
 */
export function generateMockHistory(): {
  weights: WeightRecord[];
  loggedFoods: LoggedFood[];
  completedWorkouts: CompletedWorkout[];
  cardioSessions: CardioSession[];
} {
  const weights: WeightRecord[] = [];
  const loggedFoods: LoggedFood[] = [];
  const completedWorkouts: CompletedWorkout[] = [];

  const baseWeight = 85.2;
  const now = new Date();

  for (let i = 27; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const trendDrop = (27 - i) * 0.055;
    const noise = Math.sin(i * 1.3) * 0.35 + (i % 4 === 0 ? 0.25 : -0.12);
    const weightVal = Number((baseWeight - trendDrop + noise).toFixed(2));
    const waistVal = Number((86.5 - (27 - i) * 0.045).toFixed(1));

    weights.push({
      date: dateStr,
      weightKg: weightVal,
      waistCm: waistVal,
      notes: i === 6 ? 'High carb refeed day' : undefined,
    });

    if (i > 0) {
      loggedFoods.push(
        {
          id: `hist-f1-${i}`,
          foodId: 'f-1',
          mealType: 'breakfast',
          name: 'Rolled Oats & Whey Protein',
          servingCount: 1.5,
          servingSize: 50,
          servingUnit: 'g',
          calories: 405,
          protein: 38,
          carbs: 49,
          fat: 6,
          loggedAt: `${dateStr}T08:15:00.000Z`,
        },
        {
          id: `hist-f2-${i}`,
          foodId: 'f-3',
          mealType: 'lunch',
          name: 'Grilled Chicken & Jasmine Rice',
          servingCount: 1.2,
          servingSize: 150,
          servingUnit: 'g',
          calories: 560,
          protein: 58,
          carbs: 52,
          fat: 7.5,
          loggedAt: `${dateStr}T12:45:00.000Z`,
        },
        {
          id: `hist-f3-${i}`,
          foodId: 'f-11',
          mealType: 'dinner',
          name: 'Salmon Fillet & Roasted Sweet Potato',
          servingCount: 1.0,
          servingSize: 150,
          servingUnit: 'g',
          calories: 566,
          protein: 41,
          carbs: 31,
          fat: 20,
          loggedAt: `${dateStr}T19:30:00.000Z`,
        },
        {
          id: `hist-f4-${i}`,
          foodId: 'f-7',
          mealType: 'snack',
          name: 'Greek Yogurt 0% & Fresh Blueberries',
          servingCount: 1.2,
          servingSize: 200,
          servingUnit: 'g',
          calories: 198,
          protein: 25,
          carbs: 23,
          fat: 0.5,
          loggedAt: `${dateStr}T21:20:00.000Z`,
        }
      );
    }
  }

  // Pre-log Today's Breakfast and Lunch
  const todayStr = now.toISOString().split('T')[0];
  loggedFoods.push(
    {
      id: 'today-bfast',
      foodId: 'f-1',
      mealType: 'breakfast',
      name: 'Rolled Oats + Whey Protein Scoop',
      servingCount: 1.5,
      servingSize: 50,
      servingUnit: 'g',
      calories: 425,
      protein: 41,
      carbs: 51,
      fat: 6.5,
      loggedAt: `${todayStr}T08:00:00.000Z`,
    },
    {
      id: 'today-lunch',
      foodId: 'f-3',
      mealType: 'lunch',
      name: 'Grilled Chicken Breast, Jasmine Rice & Olive Oil',
      servingCount: 1.3,
      servingSize: 150,
      servingUnit: 'g',
      calories: 680,
      protein: 64,
      carbs: 56,
      fat: 14,
      loggedAt: `${todayStr}T12:30:00.000Z`,
    }
  );

  // Progressive workout volume history across 4 distinct sessions over the past 3 weeks
  // Week 3 ago: Upper A
  const dW3 = new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString();
  completedWorkouts.push({
    id: 'cw-hist-4',
    templateId: 'tmpl-upper',
    name: 'Upper Hypertrophy A',
    startTime: dW3,
    endTime: dW3,
    durationSeconds: 3000,
    totalVolumeKg: 8900,
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Barbell Bench Press',
        sets: [
          { id: 'w3-s1', setNumber: 1, targetWeightKg: 80, targetReps: 8, actualWeightKg: 80, actualReps: 8, isCompleted: true },
          { id: 'w3-s2', setNumber: 2, targetWeightKg: 80, targetReps: 8, actualWeightKg: 80, actualReps: 8, isCompleted: true },
          { id: 'w3-s3', setNumber: 3, targetWeightKg: 80, targetReps: 8, actualWeightKg: 80, actualReps: 8, isCompleted: true },
        ],
      },
    ],
  });

  // Week 2 ago: Lower B
  const dW2L = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString();
  completedWorkouts.push({
    id: 'cw-hist-3',
    templateId: 'tmpl-lower',
    name: 'Lower Strength B',
    startTime: dW2L,
    endTime: dW2L,
    durationSeconds: 2700,
    totalVolumeKg: 7800,
    exercises: [
      {
        exerciseId: 'ex-3',
        exerciseName: 'Barbell Back Squat',
        sets: [
          { id: 'w2-sq1', setNumber: 1, targetWeightKg: 110, targetReps: 6, actualWeightKg: 110, actualReps: 6, isCompleted: true },
          { id: 'w2-sq2', setNumber: 2, targetWeightKg: 110, targetReps: 6, actualWeightKg: 110, actualReps: 6, isCompleted: true },
        ],
      },
    ],
  });

  // Week 1 ago: Lower B (Progression +320 kg)
  const d3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  completedWorkouts.push({
    id: 'cw-hist-2',
    templateId: 'tmpl-lower',
    name: 'Lower Strength B',
    startTime: d3,
    endTime: d3,
    durationSeconds: 2880,
    totalVolumeKg: 8120,
    exercises: [
      {
        exerciseId: 'ex-3',
        exerciseName: 'Barbell Back Squat',
        sets: [
          { id: 'sq-1', setNumber: 1, targetWeightKg: 115, targetReps: 6, actualWeightKg: 115, actualReps: 6, isCompleted: true },
          { id: 'sq-2', setNumber: 2, targetWeightKg: 115, targetReps: 6, actualWeightKg: 115, actualReps: 6, isCompleted: true },
          { id: 'sq-3', setNumber: 3, targetWeightKg: 115, targetReps: 6, actualWeightKg: 115, actualReps: 5, isCompleted: true },
        ],
      },
    ],
  });

  // 1 day ago: Upper A (Progression +940 kg from week 3)
  const d1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  completedWorkouts.push({
    id: 'cw-hist-1',
    templateId: 'tmpl-upper',
    name: 'Upper Hypertrophy A',
    startTime: d1,
    endTime: d1,
    durationSeconds: 3180,
    totalVolumeKg: 9840,
    notes: 'Solid bench press sets; triceps felt strong.',
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Barbell Bench Press',
        sets: [
          { id: 's-1', setNumber: 1, targetWeightKg: 85, targetReps: 8, actualWeightKg: 85, actualReps: 8, isCompleted: true },
          { id: 's-2', setNumber: 2, targetWeightKg: 85, targetReps: 8, actualWeightKg: 85, actualReps: 8, isCompleted: true },
          { id: 's-3', setNumber: 3, targetWeightKg: 85, targetReps: 8, actualWeightKg: 85, actualReps: 7, isCompleted: true },
        ],
      },
      {
        exerciseId: 'ex-7',
        exerciseName: 'Chest Supported Row',
        sets: [
          { id: 's-4', setNumber: 1, targetWeightKg: 32, targetReps: 10, actualWeightKg: 32, actualReps: 10, isCompleted: true },
          { id: 's-5', setNumber: 2, targetWeightKg: 32, targetReps: 10, actualWeightKg: 32, actualReps: 10, isCompleted: true },
          { id: 's-6', setNumber: 3, targetWeightKg: 32, targetReps: 10, actualWeightKg: 32, actualReps: 9, isCompleted: true },
        ],
      },
      {
        exerciseId: 'ex-8',
        exerciseName: 'Cable Lateral Raise',
        sets: [
          { id: 's-7', setNumber: 1, targetWeightKg: 10, targetReps: 15, actualWeightKg: 10, actualReps: 15, isCompleted: true },
          { id: 's-8', setNumber: 2, targetWeightKg: 10, targetReps: 15, actualWeightKg: 10, actualReps: 14, isCompleted: true },
        ],
      },
    ],
  });

  return {
    weights,
    loggedFoods,
    completedWorkouts,
    cardioSessions: initialCardioSessions,
  };
}

export function buildInitialWeeklyReview(
  weights: WeightRecord[],
  loggedFoods: LoggedFood[],
  profile: UserProfile
): WeeklyReviewRecord {
  const tdee = calculateAdaptiveTDEE(weights, loggedFoods);
  const proposal = generateWeeklyAdjustmentProposal(
    tdee.estimatedTdee,
    profile.targets.calories,
    profile.targetRateKgPerWeek,
    tdee.confidenceScore
  );

  return {
    id: 'review-1',
    weekEndDate: new Date().toISOString().split('T')[0],
    avgCalorieIntake: tdee.avgDailyIntake,
    avgProteinIntake: tdee.avgProteinIntake,
    avgWeightTrendKg: 83.5,
    weightDeltaKg: tdee.weeklyTrendDeltaKg,
    estimatedTdee: tdee.estimatedTdee,
    confidenceScore: tdee.confidenceScore,
    proposedCalorieTarget: proposal.proposedTarget,
    currentCalorieTarget: profile.targets.calories,
    adjustmentDelta: proposal.adjustmentDelta,
    reason: proposal.reason,
    status: 'pending',
  };
}
