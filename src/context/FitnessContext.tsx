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
} from '../types';
import {
  initialProfile,
  mockFoodLibrary,
  mockExercises,
  mockTemplates,
  initialCardioSessions,
  generateMockHistory,
  buildInitialWeeklyReview,
} from '../utils/mockData';
import { calculateWorkoutVolume, calculate1RM } from '../utils/engine';

const STORAGE_KEY = 'kinetic_fitness_app_v3';

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
}

export interface FitnessContextType {
  state: FitnessState;
  updateProfile: (updater: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
  addWeightRecord: (record: WeightRecord) => void;
  addLoggedFood: (food: LoggedFood) => void;
  updateLoggedFood: (food: LoggedFood) => void;
  removeLoggedFood: (id: string) => void;
  duplicateLoggedFood: (id: string) => void;
  addFoodToLibrary: (food: FoodItem) => void;
  toggleFoodFavorite: (id: string) => void;
  addWater: (ml: number) => void;
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
  }) => { addedCardio: number; addedWorkouts: number; addedWeights: number };
  resolveReview: (reviewId: string, decision: 'accepted' | 'rejected') => void;
  resetAllData: () => void;
  exportAllJson: () => void;
  exportCsv: (type: 'weights' | 'foods' | 'workouts' | 'cardio') => void;
}

const FitnessContext = createContext<FitnessContextType | null>(null);

function loadInitialFitnessState(): FitnessState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile && parsed.weights) {
        return {
          ...parsed,
          cardioSessions: parsed.cardioSessions || initialCardioSessions,
        };
      }
    }
  } catch (e) {
    console.warn('Could not parse saved fitness state from localStorage', e);
  }

  const { weights, loggedFoods, completedWorkouts, cardioSessions } = generateMockHistory();
  const initialReview = buildInitialWeeklyReview(weights, loggedFoods, initialProfile);

  const freshState: FitnessState = {
    profile: initialProfile,
    weights,
    loggedFoods,
    foodLibrary: mockFoodLibrary,
    exercises: mockExercises,
    templates: mockTemplates,
    completedWorkouts,
    cardioSessions: cardioSessions || initialCardioSessions,
    activeWorkout: null,
    reviews: [initialReview],
    waterMlToday: 1750,
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

  // Sync state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to sync to localStorage', err);
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

  const addWater = (ml: number) => {
    setState((prev) => ({
      ...prev,
      waterMlToday: Math.max(0, prev.waterMlToday + ml),
    }));
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
  }) => {
    let addedCardio = 0;
    let addedWorkouts = 0;
    let addedWeights = 0;

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

      return {
        ...prev,
        cardioSessions: [...newCardio, ...prev.cardioSessions],
        completedWorkouts: [...newWorkouts, ...prev.completedWorkouts],
        weights: sortedWeights,
      };
    });

    return { addedCardio, addedWorkouts, addedWeights };
  };

  const resolveReview = (reviewId: string, decision: 'accepted' | 'rejected') => {
    setState((prev) => {
      const review = prev.reviews.find((r) => r.id === reviewId);
      if (!review) return prev;

      const updatedReview: WeeklyReviewRecord = { ...review, status: decision };
      const updatedProfile = { ...prev.profile };

      if (decision === 'accepted') {
        updatedProfile.targets = {
          ...updatedProfile.targets,
          calories: review.proposedCalorieTarget,
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
    const { weights, loggedFoods, completedWorkouts, cardioSessions } = generateMockHistory();
    const freshReview = buildInitialWeeklyReview(weights, loggedFoods, initialProfile);
    setState({
      profile: initialProfile,
      weights,
      loggedFoods,
      foodLibrary: mockFoodLibrary,
      exercises: mockExercises,
      templates: mockTemplates,
      completedWorkouts,
      cardioSessions: cardioSessions || initialCardioSessions,
      activeWorkout: null,
      reviews: [freshReview],
      waterMlToday: 1750,
    });
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

  return (
    <FitnessContext.Provider
      value={{
        state,
        updateProfile,
        addWeightRecord,
        addLoggedFood,
        updateLoggedFood,
        removeLoggedFood,
        duplicateLoggedFood,
        addFoodToLibrary,
        toggleFoodFavorite,
        addWater,
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
        exportAllJson,
        exportCsv,
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
