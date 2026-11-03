import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  WeightRecord,
  LoggedFood,
  FoodItem,
  ExerciseDefinition,
  WorkoutTemplate,
  CompletedWorkout,
  ActiveWorkoutSession,
  WeeklyReviewRecord,
  CardioSession,
  WeeklyRoutineDay,
  LifeGoal,
  LifeProject,
  LifeTask,
  EunoiaHabit,
  FrictionIntervention,
  SleepRecord,
  ReflectionEntry,
  RelationshipTouchpoint,
  LearningItem,
} from '../types';
import {
  initialProfile,
  mockFoodLibrary,
  mockExercises,
  mockTemplates,
  defaultWeeklySchedule,
  initialCardioSessions,
  generateMockHistory,
  buildInitialWeeklyReview,
} from '../utils/mockData';
import {
  defaultStarterHabits,
  defaultStarterFrictionInterventions,
  defaultStarterGoals,
  defaultStarterProjects,
  defaultStarterTasks,
  defaultStarterRelationships,
  defaultStarterLearning,
} from '../utils/eunoiaDefaults';
import { calculateWorkoutVolume, calculate1RM, getLocalDateString, getPreferredTheme } from '../utils/engine';
import { sanitizeLoadedActiveWorkout } from '../utils/workoutSession';

export const STORAGE_KEY = 'eunoia_os_v1';
export const LEGACY_STORAGE_KEYS = [
  'eunoia_os_v1',
  'kinetic_fitness_app_v3',
  'kinetic_fitness_app_v2',
  'kinetic_fitness_app_v1',
  'kinetic_fitness_app',
];

/**
 * Merges system default library items non-destructively into the user's library:
 * - Preserves all user-created items (custom foods, custom exercises, custom templates).
 * - Preserves any user modifications to existing items.
 * - Appends any newly introduced system default items that the user doesn't already have.
 */
export function mergeLibraries<T extends { id: string; name: string }>(
  userItems: T[] | undefined,
  defaultItems: T[]
): T[] {
  if (!userItems || !Array.isArray(userItems) || userItems.length === 0) {
    return [...defaultItems];
  }

  const existingIds = new Set(userItems.map((item) => item.id));
  const existingNames = new Set(userItems.map((item) => item.name.trim().toLowerCase()));

  const newDefaultsToAdd = defaultItems.filter(
    (item) => !existingIds.has(item.id) && !existingNames.has(item.name.trim().toLowerCase())
  );

  return [...userItems, ...newDefaultsToAdd];
}

export interface FitnessState {
  profile: UserProfile;
  weights: WeightRecord[];
  loggedFoods: LoggedFood[];
  foodLibrary: FoodItem[];
  exercises: ExerciseDefinition[];
  templates: WorkoutTemplate[];
  completedWorkouts: CompletedWorkout[];
  cardioSessions: CardioSession[];
  activeWorkout: ActiveWorkoutSession | null;
  reviews: WeeklyReviewRecord[];
  waterMlToday: number;
  hydrationLogs: Record<string, number>;
  weeklySchedule: WeeklyRoutineDay[];

  // Eunoia Flourishing System
  goals: LifeGoal[];
  projects: LifeProject[];
  tasks: LifeTask[];
  habits: EunoiaHabit[];
  frictionInterventions: FrictionIntervention[];
  sleepRecords: SleepRecord[];
  reflections: ReflectionEntry[];
  relationships: RelationshipTouchpoint[];
  learningItems: LearningItem[];
}

export interface FitnessContextType {
  state: FitnessState;
  updateProfile: (updater: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
  setDailyIntention: (intention: string) => void;
  addWeightRecord: (record: WeightRecord) => void;
  addLoggedFood: (food: LoggedFood) => void;
  updateLoggedFood: (food: LoggedFood) => void;
  removeLoggedFood: (id: string) => void;
  duplicateLoggedFood: (id: string) => void;
  addFoodToLibrary: (food: FoodItem) => void;
  toggleFoodFavorite: (id: string) => void;
  addWater: (ml: number, date?: string) => void;
  getWaterForDate: (date: string) => number;
  updateWeeklyScheduleDay: (dayIndex: number, updater: Partial<WeeklyRoutineDay>) => void;
  getScheduledDayForDate: (date?: Date | string) => WeeklyRoutineDay;
  startWorkout: (templateId?: string) => void;
  updateActiveWorkout: (workout: ActiveWorkoutSession | null) => void;
  finishActiveWorkout: (notes?: string) => CompletedWorkout | null;
  cancelActiveWorkout: () => void;
  saveWorkoutTemplate: (template: WorkoutTemplate) => void;
  deleteWorkoutTemplate: (id: string) => void;
  addCardioSession: (session: CardioSession) => void;
  removeCardioSession: (id: string) => void;
  importHealthBatch: (batch: {
    cardio?: CardioSession[];
    workouts?: CompletedWorkout[];
    weights?: WeightRecord[];
    sleep?: SleepRecord[];
  }) => { addedCardio: number; addedWorkouts: number; addedWeights: number; addedSleep: number };
  resolveReview: (
    reviewId: string,
    decision: 'accepted' | 'rejected',
    customTarget?: number
  ) => void;
  resetAllData: () => void;
  loadDemoData: () => void;
  clearAllHistory: () => void;
  replaceFitnessState: (newState: FitnessState) => void;
  exportAllJson: () => void;
  importAllJson: (payload: string) => { ok: boolean; error?: string };
  exportCsv: (type: 'weights' | 'foods' | 'workouts' | 'cardio') => void;

  // Eunoia Domain Operations
  addGoal: (goal: LifeGoal) => void;
  updateGoal: (goal: LifeGoal) => void;
  deleteGoal: (id: string) => void;
  addProject: (project: LifeProject) => void;
  updateProject: (project: LifeProject) => void;
  deleteProject: (id: string) => void;
  addTask: (task: LifeTask) => void;
  toggleTaskCompleted: (id: string) => void;
  updateTask: (task: LifeTask) => void;
  deleteTask: (id: string) => void;
  addHabit: (habit: EunoiaHabit) => void;
  toggleHabitDate: (id: string, dateStr?: string) => void;
  updateHabit: (habit: EunoiaHabit) => void;
  deleteHabit: (id: string) => void;
  addFrictionIntervention: (intervention: FrictionIntervention) => void;
  updateFrictionIntervention: (intervention: FrictionIntervention) => void;
  deleteFrictionIntervention: (id: string) => void;
  addSleepRecord: (record: SleepRecord) => void;
  deleteSleepRecord: (id: string) => void;
  addReflectionEntry: (entry: ReflectionEntry) => void;
  deleteReflectionEntry: (id: string) => void;
  addRelationshipTouchpoint: (touchpoint: RelationshipTouchpoint) => void;
  updateRelationshipTouchpoint: (touchpoint: RelationshipTouchpoint) => void;
  logRelationshipContact: (id: string, dateStr?: string) => void;
  deleteRelationshipTouchpoint: (id: string) => void;
  addLearningItem: (item: LearningItem) => void;
  updateLearningItem: (item: LearningItem) => void;
  deleteLearningItem: (id: string) => void;
}

const FitnessContext = createContext<FitnessContextType | null>(null);

function loadInitialFitnessState(): FitnessState {
  const todayStr = getLocalDateString();
  try {
    let raw: string | null = null;
    let foundKey: string | null = null;

    for (const key of LEGACY_STORAGE_KEYS) {
      const data = localStorage.getItem(key);
      if (data) {
        raw = data;
        foundKey = key;
        break;
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile && Array.isArray(parsed.weights)) {
        const hydration = parsed.hydrationLogs || { [todayStr]: parsed.waterMlToday || 0 };
        const migratedState: FitnessState = {
          ...parsed,
          foodLibrary: mergeLibraries(parsed.foodLibrary, mockFoodLibrary),
          exercises: mergeLibraries(parsed.exercises, mockExercises),
          templates: Array.isArray(parsed.templates) && parsed.templates.length >= 3 ? parsed.templates : mockTemplates,
          cardioSessions: Array.isArray(parsed.cardioSessions) ? parsed.cardioSessions : [],
          hydrationLogs: hydration,
          waterMlToday: hydration[todayStr] ?? (parsed.waterMlToday || 0),
          weeklySchedule: parsed.weeklySchedule || defaultWeeklySchedule,
          activeWorkout: sanitizeLoadedActiveWorkout(parsed.activeWorkout).session,

          // Ensure Eunoia domains exist while strictly preserving any existing user records
          goals: Array.isArray(parsed.goals) && parsed.goals.length > 0 ? parsed.goals : defaultStarterGoals,
          projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : defaultStarterProjects,
          tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : defaultStarterTasks,
          habits: Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : defaultStarterHabits,
          frictionInterventions: Array.isArray(parsed.frictionInterventions) && parsed.frictionInterventions.length > 0
            ? parsed.frictionInterventions
            : defaultStarterFrictionInterventions,
          sleepRecords: Array.isArray(parsed.sleepRecords) ? parsed.sleepRecords : [],
          reflections: Array.isArray(parsed.reflections) ? parsed.reflections : [],
          relationships: Array.isArray(parsed.relationships) && parsed.relationships.length > 0
            ? parsed.relationships
            : defaultStarterRelationships,
          learningItems: Array.isArray(parsed.learningItems) && parsed.learningItems.length > 0
            ? parsed.learningItems
            : defaultStarterLearning,
        };

        // If data was loaded from a legacy key, migrate to the current key
        if (foundKey && foundKey !== STORAGE_KEY) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedState));
          } catch (e) {
            console.warn('Failed writing migrated state to STORAGE_KEY', e);
          }
        }

        return migratedState;
      }
    }
  } catch (e) {
    console.warn('Could not parse saved fitness state from localStorage', e);
  }

  // CLEAN INITIAL STATE: Real user first-run with zero artificial mock history
  const freshState: FitnessState = {
    profile: { ...initialProfile, theme: getPreferredTheme() },
    weights: [],
    loggedFoods: [],
    foodLibrary: mockFoodLibrary,
    exercises: mockExercises,
    templates: mockTemplates,
    completedWorkouts: [],
    cardioSessions: [],
    activeWorkout: null,
    reviews: [],
    waterMlToday: 0,
    hydrationLogs: { [todayStr]: 0 },
    weeklySchedule: defaultWeeklySchedule,

    // Eunoia Starter Domains
    goals: defaultStarterGoals,
    projects: defaultStarterProjects,
    tasks: defaultStarterTasks,
    habits: defaultStarterHabits,
    frictionInterventions: defaultStarterFrictionInterventions,
    sleepRecords: [],
    reflections: [],
    relationships: defaultStarterRelationships,
    learningItems: defaultStarterLearning,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
  } catch {
    // fallback
  }

  return freshState;
}

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FitnessState>(loadInitialFitnessState);

  // Keep waterMlToday in sync when the calendar day rolls over while the app is open
  useEffect(() => {
    const syncDay = () => {
      const today = getLocalDateString();
      setState((prev) => {
        const logs = prev.hydrationLogs || {};
        if (logs[today] === undefined) {
          // new day: start at 0
          return { ...prev, hydrationLogs: { ...logs, [today]: 0 }, waterMlToday: 0 };
        }
        if (prev.waterMlToday !== logs[today]) {
          return { ...prev, waterMlToday: logs[today] };
        }
        return prev;
      });
    };
    const id = setInterval(syncDay, 60000);
    return () => clearInterval(id);
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed caching to localStorage:', e);
    }
  }, [state]);

  const updateProfile = (updater: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => {
    setState((prev) => {
      const nextProfile = typeof updater === 'function' ? updater(prev.profile) : { ...prev.profile, ...updater };
      return { ...prev, profile: nextProfile };
    });
  };

  const addWeightRecord = (record: WeightRecord) => {
    setState((prev) => {
      const filtered = prev.weights.filter((w) => w.date !== record.date);
      return {
        ...prev,
        weights: [...filtered, record].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      };
    });
  };

  const addLoggedFood = (food: LoggedFood) => {
    setState((prev) => ({
      ...prev,
      loggedFoods: [food, ...prev.loggedFoods],
    }));
  };

  const updateLoggedFood = (food: LoggedFood) => {
    setState((prev) => ({
      ...prev,
      loggedFoods: prev.loggedFoods.map((f) => (f.id === food.id ? food : f)),
    }));
  };

  const removeLoggedFood = (id: string) => {
    setState((prev) => ({
      ...prev,
      loggedFoods: prev.loggedFoods.filter((f) => f.id !== id),
    }));
  };

  const duplicateLoggedFood = (id: string) => {
    setState((prev) => {
      const item = prev.loggedFoods.find((f) => f.id === id);
      if (!item) return prev;
      const copy: LoggedFood = {
        ...item,
        id: `food-dup-${Date.now()}`,
        loggedAt: new Date().toISOString(),
      };
      return { ...prev, loggedFoods: [copy, ...prev.loggedFoods] };
    });
  };

  const addFoodToLibrary = (food: FoodItem) => {
    setState((prev) => ({
      ...prev,
      foodLibrary: [food, ...prev.foodLibrary],
    }));
  };

  const toggleFoodFavorite = (id: string) => {
    setState((prev) => ({
      ...prev,
      foodLibrary: prev.foodLibrary.map((f) =>
        f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
      ),
    }));
  };

  const addWater = (ml: number, date?: string) => {
    const targetDate = date || getLocalDateString();
    setState((prev) => {
      const logs = prev.hydrationLogs || {};
      const current = logs[targetDate] || 0;
      const nextAmount = Math.max(0, current + ml);
      const nextLogs = { ...logs, [targetDate]: nextAmount };
      return {
        ...prev,
        hydrationLogs: nextLogs,
        waterMlToday: targetDate === getLocalDateString() ? nextAmount : prev.waterMlToday,
      };
    });
  };

  const getWaterForDate = (date: string): number => {
    return state.hydrationLogs?.[date] ?? (date === getLocalDateString() ? state.waterMlToday : 0);
  };

  const updateWeeklyScheduleDay = (dayIndex: number, updater: Partial<WeeklyRoutineDay>) => {
    setState((prev) => {
      const schedule = [...(prev.weeklySchedule || defaultWeeklySchedule)];
      const idx = schedule.findIndex((s) => s.dayIndex === dayIndex);
      if (idx !== -1) {
        schedule[idx] = { ...schedule[idx], ...updater };
      }
      return { ...prev, weeklySchedule: schedule };
    });
  };

  const getScheduledDayForDate = (inputDate?: Date | string): WeeklyRoutineDay => {
    let dayIndex = new Date().getDay();
    if (inputDate) {
      if (typeof inputDate === 'string') {
        const [y, m, d] = inputDate.split('-').map(Number);
        dayIndex = new Date(y, m - 1, d).getDay();
      } else {
        dayIndex = inputDate.getDay();
      }
    }
    const schedule = state.weeklySchedule || defaultWeeklySchedule;
    return schedule.find((s) => s.dayIndex === dayIndex) || schedule[0];
  };

  const startWorkout = (templateId?: string) => {
    setState((prev) => {
      const template = prev.templates.find((t) => t.id === templateId) || prev.templates[0];
      const active: ActiveWorkoutSession = {
        templateId: template?.id,
        name: template?.name || 'Quick Workout',
        startTime: new Date().toISOString(),
        exercises: (template?.exercises || []).map((e) => {
          const exDef = prev.exercises.find((x) => x.id === e.exerciseId);
          return {
            exerciseId: e.exerciseId,
            exerciseName: exDef?.name || 'Exercise',
            sets: Array.from({ length: e.defaultSets }).map((_, idx) => ({
              id: `set-${Date.now()}-${e.exerciseId}-${idx}`,
              setNumber: idx + 1,
              targetWeightKg: exDef?.personalRecord ? Math.round(exDef.personalRecord.weightKg * 0.85) : 60,
              targetReps: e.defaultReps,
              actualWeightKg: exDef?.personalRecord ? Math.round(exDef.personalRecord.weightKg * 0.85) : 60,
              actualReps: e.defaultReps,
              isCompleted: false,
            })),
          };
        }),
        isTimerRunning: false,
        restTimerSecondsRemaining: 90,
      };
      return { ...prev, activeWorkout: active };
    });
  };

  const updateActiveWorkout = (workout: ActiveWorkoutSession | null) => {
    setState((prev) => ({ ...prev, activeWorkout: workout }));
  };

  const finishActiveWorkout = (notes?: string): CompletedWorkout | null => {
    if (!state.activeWorkout) return null;

    const current = state.activeWorkout;
    const startTime = new Date(current.startTime).getTime();
    const durationSeconds = Math.max(60, Math.round((Date.now() - startTime) / 1000));
    const totalVolumeKg = calculateWorkoutVolume(current.exercises);

    // Track any new personal records
    const prsAchieved: string[] = [];
    const updatedExercises = [...state.exercises];

    current.exercises.forEach((ex) => {
      const exIndex = updatedExercises.findIndex((def) => def.id === ex.exerciseId);
      if (exIndex !== -1) {
        const def = updatedExercises[exIndex];
        ex.sets
          .filter((s) => s.isCompleted)
          .forEach((s) => {
            const set1RM = calculate1RM(s.actualWeightKg, s.actualReps);
            const currentRecord1RM = def.personalRecord?.estimated1RMKg || 0;
            if (set1RM > currentRecord1RM) {
              prsAchieved.push(`${def.name}: ${s.actualWeightKg} kg × ${s.actualReps} reps`);
              updatedExercises[exIndex] = {
                ...def,
                personalRecord: {
                  weightKg: s.actualWeightKg,
                  reps: s.actualReps,
                  estimated1RMKg: set1RM,
                  date: new Date().toISOString().split('T')[0],
                },
              };
            }
          });
      }
    });

    const completed: CompletedWorkout = {
      id: `cw-${Date.now()}`,
      templateId: current.templateId,
      name: current.name,
      startTime: current.startTime,
      endTime: new Date().toISOString(),
      durationSeconds,
      exercises: current.exercises,
      totalVolumeKg,
      personalRecordsAchieved: prsAchieved.length > 0 ? prsAchieved : undefined,
      notes,
    };

    setState((prev) => ({
      ...prev,
      activeWorkout: null,
      completedWorkouts: [completed, ...prev.completedWorkouts],
      exercises: updatedExercises,
    }));

    return completed;
  };

  const cancelActiveWorkout = () => {
    setState((prev) => ({ ...prev, activeWorkout: null }));
  };

  const saveWorkoutTemplate = (template: WorkoutTemplate) => {
    setState((prev) => {
      const exists = prev.templates.some((t) => t.id === template.id);
      const nextTemplates = exists
        ? prev.templates.map((t) => (t.id === template.id ? template : t))
        : [...prev.templates, template];
      return { ...prev, templates: nextTemplates };
    });
  };

  const deleteWorkoutTemplate = (id: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  };

  const addCardioSession = (session: CardioSession) => {
    setState((prev) => ({
      ...prev,
      cardioSessions: [session, ...prev.cardioSessions],
    }));
  };

  const removeCardioSession = (id: string) => {
    setState((prev) => ({
      ...prev,
      cardioSessions: prev.cardioSessions.filter((s) => s.id !== id),
    }));
  };

  const importHealthBatch = (batch: {
    cardio?: CardioSession[];
    workouts?: CompletedWorkout[];
    weights?: WeightRecord[];
    sleep?: SleepRecord[];
  }) => {
    let addedCardio = 0;
    let addedWorkouts = 0;
    let addedWeights = 0;
    let addedSleep = 0;

    setState((prev) => {
      // De-duplicate cardio by ID and timestamp/name
      const existingCardioIds = new Set(prev.cardioSessions.map((c) => c.id));
      const newCardio = (batch.cardio || []).filter((c) => !existingCardioIds.has(c.id));
      addedCardio = newCardio.length;

      // De-duplicate workouts
      const existingWorkoutIds = new Set(prev.completedWorkouts.map((w) => w.id));
      const newWorkouts = (batch.workouts || []).filter((w) => !existingWorkoutIds.has(w.id));
      addedWorkouts = newWorkouts.length;

      // Merge weights by date (overwrite or keep latest)
      const weightMap = new Map(prev.weights.map((w) => [w.date, w]));
      (batch.weights || []).forEach((w) => {
        weightMap.set(w.date, w);
        addedWeights++;
      });
      const sortedWeights = Array.from(weightMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // De-duplicate sleep by date or ID
      const existingSleepDates = new Set((prev.sleepRecords || []).map((s) => s.date));
      const existingSleepIds = new Set((prev.sleepRecords || []).map((s) => s.id));
      const newSleep = (batch.sleep || []).filter(
        (s) => !existingSleepDates.has(s.date) && !existingSleepIds.has(s.id)
      );
      addedSleep = newSleep.length;

      // Safeguard against localStorage quota exhaustion (keep top recent 500 records in state, while IndexedDB has all)
      const mergedWorkouts = [...newWorkouts, ...prev.completedWorkouts].slice(0, 500);
      const mergedCardio = [...newCardio, ...prev.cardioSessions].slice(0, 500);
      const mergedSleep = [...newSleep, ...(prev.sleepRecords || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 500);

      return {
        ...prev,
        cardioSessions: mergedCardio,
        completedWorkouts: mergedWorkouts,
        weights: sortedWeights,
        sleepRecords: mergedSleep,
      };
    });

    return { addedCardio, addedWorkouts, addedWeights, addedSleep };
  };

  const resolveReview = (
    reviewId: string,
    decision: 'accepted' | 'rejected',
    customTarget?: number
  ) => {
    setState((prev) => {
      const review = prev.reviews.find((r) => r.id === reviewId);
      if (!review) return prev;

      const finalTarget =
        typeof customTarget === 'number' && Number.isFinite(customTarget) && customTarget > 500
          ? Math.round(customTarget)
          : review.proposedCalorieTarget;

      const updatedReview: WeeklyReviewRecord = {
        ...review,
        status: decision,
        proposedCalorieTarget: decision === 'accepted' ? finalTarget : review.proposedCalorieTarget,
        adjustmentDelta:
          decision === 'accepted' ? finalTarget - review.currentCalorieTarget : review.adjustmentDelta,
      };
      const updatedProfile = { ...prev.profile };

      if (decision === 'accepted') {
        updatedProfile.targets = {
          ...updatedProfile.targets,
          calories: finalTarget,
        };
      }

      return {
        ...prev,
        profile: updatedProfile,
        reviews: prev.reviews.map((r) => (r.id === reviewId ? updatedReview : r)),
      };
    });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const todayStr = getLocalDateString();
    const freshState: FitnessState = {
      profile: {
        ...initialProfile,
        theme: getPreferredTheme(),
        name: 'Athlete',
      },
      weights: [],
      loggedFoods: [],
      foodLibrary: mockFoodLibrary,
      exercises: mockExercises,
      templates: mockTemplates,
      completedWorkouts: [],
      cardioSessions: [],
      activeWorkout: null,
      reviews: [],
      waterMlToday: 0,
      hydrationLogs: { [todayStr]: 0 },
      weeklySchedule: defaultWeeklySchedule,
      goals: defaultStarterGoals,
      projects: defaultStarterProjects,
      tasks: defaultStarterTasks,
      habits: defaultStarterHabits,
      frictionInterventions: defaultStarterFrictionInterventions,
      sleepRecords: [],
      reflections: [],
      relationships: defaultStarterRelationships,
      learningItems: defaultStarterLearning,
    };
    setState(freshState);
  };

  const loadDemoData = () => {
    const { weights, loggedFoods, completedWorkouts, cardioSessions } = generateMockHistory();
    const freshReview = buildInitialWeeklyReview(weights, loggedFoods, initialProfile);
    const todayStr = getLocalDateString();
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: 'Alex Rivera',
        onboardingCompleted: true,
      },
      weights,
      loggedFoods,
      completedWorkouts,
      cardioSessions: cardioSessions || [],
      reviews: [freshReview],
      waterMlToday: 1750,
      hydrationLogs: { [todayStr]: 1750 },
    }));
  };

  const clearAllHistory = () => {
    const todayStr = getLocalDateString();
    setState((prev) => ({
      ...prev,
      weights: [],
      loggedFoods: [],
      completedWorkouts: [],
      cardioSessions: [],
      reviews: [],
      waterMlToday: 0,
      hydrationLogs: { [todayStr]: 0 },
    }));
  };

  const replaceFitnessState = (newState: FitnessState) => {
    if (!newState || !newState.profile) return;
    setState(newState);
  };

  const exportAllJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `kinetic_export_${new Date().toISOString().split('T')[0]}.json`
    );
    dlAnchor.click();
  };

  const exportCsv = (type: 'weights' | 'foods' | 'workouts' | 'cardio') => {
    let csvContent = '';
    let filename = '';

    if (type === 'weights') {
      csvContent = 'Date,WeightKg,WaistCm,BodyFatPct,Notes\n' +
        state.weights
          .map((w) => `${w.date},${w.weightKg},${w.waistCm || ''},${w.bodyFatPct || ''},"${w.notes || ''}"`)
          .join('\n');
      filename = `kinetic_weights_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'foods') {
      csvContent = 'Date,MealType,Name,ServingCount,ServingSize,ServingUnit,Calories,Protein,Carbs,Fat\n' +
        state.loggedFoods
          .map(
            (f) =>
              `${f.loggedAt},${f.mealType},"${f.name}",${f.servingCount},${f.servingSize},${f.servingUnit},${f.calories},${f.protein},${f.carbs},${f.fat}`
          )
          .join('\n');
      filename = `kinetic_foods_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'workouts') {
      csvContent = 'Date,Name,DurationMinutes,TotalVolumeKg\n' +
        state.completedWorkouts
          .map(
            (w) =>
              `${w.startTime},"${w.name}",${Math.round(w.durationSeconds / 60)},${w.totalVolumeKg}`
          )
          .join('\n');
      filename = `kinetic_workouts_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'cardio') {
      csvContent = 'Date,ActivityType,Name,DurationMinutes,DistanceKm,PaceMinPerKm,CaloriesBurned,HeartRateBpm\n' +
        state.cardioSessions
          .map(
            (c) =>
              `${c.date},${c.type},"${c.name}",${c.durationMinutes},${c.distanceKm || ''},${c.avgPaceMinPerKm || ''},${c.caloriesBurned},${c.avgHeartRateBpm || ''}`
          )
          .join('\n');
      filename = `kinetic_cardio_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodedUri);
    dlAnchor.setAttribute('download', filename);
    dlAnchor.click();
  };

  const importAllJson = (payload: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(payload);
      if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'Invalid JSON' };
      if (!parsed.profile || !Array.isArray(parsed.weights)) return { ok: false, error: 'Missing profile or weights' };
      // Normalize
      const todayStr = getLocalDateString();
      const next: FitnessState = {
        profile: parsed.profile,
        weights: parsed.weights,
        loggedFoods: Array.isArray(parsed.loggedFoods) ? parsed.loggedFoods : [],
        foodLibrary: mergeLibraries(parsed.foodLibrary, mockFoodLibrary),
        exercises: mergeLibraries(parsed.exercises, mockExercises),
        templates: Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : mockTemplates,
        completedWorkouts: Array.isArray(parsed.completedWorkouts) ? parsed.completedWorkouts : [],
        cardioSessions: Array.isArray(parsed.cardioSessions) ? parsed.cardioSessions : [],
        activeWorkout: sanitizeLoadedActiveWorkout(parsed.activeWorkout).session,
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        waterMlToday: typeof parsed.waterMlToday === 'number' ? parsed.waterMlToday : 0,
        hydrationLogs: parsed.hydrationLogs && typeof parsed.hydrationLogs === 'object' ? parsed.hydrationLogs : { [todayStr]: parsed.waterMlToday || 0 },
        weeklySchedule: Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule : defaultWeeklySchedule,
        goals: Array.isArray(parsed.goals) ? parsed.goals : defaultStarterGoals,
        projects: Array.isArray(parsed.projects) ? parsed.projects : defaultStarterProjects,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultStarterTasks,
        habits: Array.isArray(parsed.habits) ? parsed.habits : defaultStarterHabits,
        frictionInterventions: Array.isArray(parsed.frictionInterventions)
          ? parsed.frictionInterventions
          : defaultStarterFrictionInterventions,
        sleepRecords: Array.isArray(parsed.sleepRecords) ? parsed.sleepRecords : [],
        reflections: Array.isArray(parsed.reflections) ? parsed.reflections : [],
        relationships: Array.isArray(parsed.relationships) ? parsed.relationships : defaultStarterRelationships,
        learningItems: Array.isArray(parsed.learningItems) ? parsed.learningItems : defaultStarterLearning,
      };
      setState(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Parse error' };
    }
  };

  const setDailyIntention = (intention: string) => {
    updateProfile({ dailyIntention: intention });
  };

  // --- Eunoia Goals ---
  const addGoal = (goal: LifeGoal) => {
    setState((prev) => ({ ...prev, goals: [goal, ...prev.goals] }));
  };
  const updateGoal = (goal: LifeGoal) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goal.id ? goal : g)),
    }));
  };
  const deleteGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  };

  // --- Eunoia Projects ---
  const addProject = (project: LifeProject) => {
    setState((prev) => ({ ...prev, projects: [project, ...prev.projects] }));
  };
  const updateProject = (project: LifeProject) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === project.id ? project : p)),
    }));
  };
  const deleteProject = (id: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  // --- Eunoia Tasks ---
  const addTask = (task: LifeTask) => {
    setState((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
  };
  const toggleTaskCompleted = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              isCompleted: !t.isCompleted,
              completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
            }
          : t
      ),
    }));
  };
  const updateTask = (task: LifeTask) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  };
  const deleteTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  // --- Eunoia Habits ---
  const addHabit = (habit: EunoiaHabit) => {
    setState((prev) => ({ ...prev, habits: [habit, ...prev.habits] }));
  };
  const toggleHabitDate = (id: string, dateStr?: string) => {
    const targetDate = dateStr || getLocalDateString();
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        const exists = h.completedDates.includes(targetDate);
        return {
          ...h,
          completedDates: exists
            ? h.completedDates.filter((d) => d !== targetDate)
            : [...h.completedDates, targetDate],
        };
      }),
    }));
  };
  const updateHabit = (habit: EunoiaHabit) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habit.id ? habit : h)),
    }));
  };
  const deleteHabit = (id: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
  };

  // --- Eunoia Friction Interventions ---
  const addFrictionIntervention = (intervention: FrictionIntervention) => {
    setState((prev) => ({
      ...prev,
      frictionInterventions: [intervention, ...prev.frictionInterventions],
    }));
  };
  const updateFrictionIntervention = (intervention: FrictionIntervention) => {
    setState((prev) => ({
      ...prev,
      frictionInterventions: prev.frictionInterventions.map((f) =>
        f.id === intervention.id ? intervention : f
      ),
    }));
  };
  const deleteFrictionIntervention = (id: string) => {
    setState((prev) => ({
      ...prev,
      frictionInterventions: prev.frictionInterventions.filter((f) => f.id !== id),
    }));
  };

  // --- Eunoia Sleep Records ---
  const addSleepRecord = (record: SleepRecord) => {
    setState((prev) => {
      const filtered = prev.sleepRecords.filter((s) => s.date !== record.date);
      return {
        ...prev,
        sleepRecords: [record, ...filtered].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    });
  };
  const deleteSleepRecord = (id: string) => {
    setState((prev) => ({
      ...prev,
      sleepRecords: prev.sleepRecords.filter((s) => s.id !== id),
    }));
  };

  // --- Eunoia Reflection Journal ---
  const addReflectionEntry = (entry: ReflectionEntry) => {
    setState((prev) => ({
      ...prev,
      reflections: [entry, ...prev.reflections],
    }));
  };
  const deleteReflectionEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      reflections: prev.reflections.filter((r) => r.id !== id),
    }));
  };

  // --- Eunoia Relationships ---
  const addRelationshipTouchpoint = (touchpoint: RelationshipTouchpoint) => {
    setState((prev) => ({
      ...prev,
      relationships: [touchpoint, ...prev.relationships],
    }));
  };
  const updateRelationshipTouchpoint = (touchpoint: RelationshipTouchpoint) => {
    setState((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === touchpoint.id ? touchpoint : r
      ),
    }));
  };
  const logRelationshipContact = (id: string, dateStr?: string) => {
    const contactDate = dateStr || getLocalDateString();
    setState((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === id ? { ...r, lastContactDate: contactDate } : r
      ),
    }));
  };
  const deleteRelationshipTouchpoint = (id: string) => {
    setState((prev) => ({
      ...prev,
      relationships: prev.relationships.filter((r) => r.id !== id),
    }));
  };

  // --- Eunoia Learning ---
  const addLearningItem = (item: LearningItem) => {
    setState((prev) => ({
      ...prev,
      learningItems: [item, ...prev.learningItems],
    }));
  };
  const updateLearningItem = (item: LearningItem) => {
    setState((prev) => ({
      ...prev,
      learningItems: prev.learningItems.map((l) => (l.id === item.id ? item : l)),
    }));
  };
  const deleteLearningItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      learningItems: prev.learningItems.filter((l) => l.id !== id),
    }));
  };

  return (
    <FitnessContext.Provider
      value={{
        state,
        updateProfile,
        setDailyIntention,
        addWeightRecord,
        addLoggedFood,
        updateLoggedFood,
        removeLoggedFood,
        duplicateLoggedFood,
        addFoodToLibrary,
        toggleFoodFavorite,
        addWater,
        getWaterForDate,
        updateWeeklyScheduleDay,
        getScheduledDayForDate,
        startWorkout,
        updateActiveWorkout,
        finishActiveWorkout,
        cancelActiveWorkout,
        saveWorkoutTemplate,
        deleteWorkoutTemplate,
        addCardioSession,
        removeCardioSession,
        importHealthBatch,
        resolveReview,
        resetAllData,
        loadDemoData,
        clearAllHistory,
        replaceFitnessState,
        exportAllJson,
        importAllJson,
        exportCsv,

        // Eunoia Domain Operations
        addGoal,
        updateGoal,
        deleteGoal,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        toggleTaskCompleted,
        updateTask,
        deleteTask,
        addHabit,
        toggleHabitDate,
        updateHabit,
        deleteHabit,
        addFrictionIntervention,
        updateFrictionIntervention,
        deleteFrictionIntervention,
        addSleepRecord,
        deleteSleepRecord,
        addReflectionEntry,
        deleteReflectionEntry,
        addRelationshipTouchpoint,
        updateRelationshipTouchpoint,
        logRelationshipContact,
        deleteRelationshipTouchpoint,
        addLearningItem,
        updateLearningItem,
        deleteLearningItem,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
}
