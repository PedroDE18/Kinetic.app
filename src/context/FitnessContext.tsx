import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import { calculateWorkoutVolume, calculate1RM, getLocalDateString, getPreferredTheme } from '../utils/engine';
import { useAuth } from './AuthContext';
import { saveUserFitnessState, loadUserFitnessState } from '../services/firebase';

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
  hydrationLogs: Record<string, number>;
  weeklySchedule: WeeklyRoutineDay[];
}

export interface FitnessContextType {
  state: FitnessState;
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  forceSyncCloud: () => Promise<boolean>;
  updateProfile: (updater: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
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
  }) => { addedCardio: number; addedWorkouts: number; addedWeights: number };
  resolveReview: (reviewId: string, decision: 'accepted' | 'rejected') => void;
  resetAllData: () => void;
  exportAllJson: () => void;
  importAllJson: (payload: string) => { ok: boolean; error?: string };
  exportCsv: (type: 'weights' | 'foods' | 'workouts' | 'cardio') => void;
}

const FitnessContext = createContext<FitnessContextType | null>(null);

function loadInitialFitnessState(): FitnessState {
  const todayStr = getLocalDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile && parsed.weights) {
        const hydration = parsed.hydrationLogs || { [todayStr]: parsed.waterMlToday || 1750 };
        return {
          ...parsed,
          templates: parsed.templates && parsed.templates.length >= 3 ? parsed.templates : mockTemplates,
          cardioSessions: parsed.cardioSessions || initialCardioSessions,
          hydrationLogs: hydration,
          waterMlToday: hydration[todayStr] ?? (parsed.waterMlToday || 0),
          weeklySchedule: parsed.weeklySchedule || defaultWeeklySchedule,
        };
      }
    }
  } catch (e) {
    console.warn('Could not parse saved fitness state from localStorage', e);
  }

  const { weights, loggedFoods, completedWorkouts, cardioSessions } = generateMockHistory();
  const initialReview = buildInitialWeeklyReview(weights, loggedFoods, initialProfile);

  const freshState: FitnessState = {
    profile: { ...initialProfile, theme: getPreferredTheme() },
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
    hydrationLogs: { [todayStr]: 1750 },
    weeklySchedule: defaultWeeklySchedule,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
  } catch {
    // fallback
  }

  return freshState;
}

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<FitnessState>(loadInitialFitnessState);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const isInitialLoadRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When currentUser changes (sign in, sign out, switch account)
  useEffect(() => {
    let isCancelled = false;

    async function handleUserAuthChange() {
      if (!currentUser) {
        // Fallback to local default state if not signed in
        setState(loadInitialFitnessState());
        return;
      }

      const uid = currentUser.uid;
      const userStorageKey = `${STORAGE_KEY}_${uid}`;
      isInitialLoadRef.current = true;

      // 1. Immediately hydrate from user's local cache if available
      const localCache = localStorage.getItem(userStorageKey);
      if (localCache) {
        try {
          const parsed = JSON.parse(localCache);
          if (parsed && parsed.profile && parsed.weights) {
            setState(parsed);
          }
        } catch (e) {
          console.warn('Failed parsing user local cache', e);
        }
      }

      // 2. Fetch fresh user data from Cloud Firestore
      setSyncStatus('syncing');
      try {
        const remoteState = await loadUserFitnessState(uid);
        if (isCancelled) return;

        if (remoteState && remoteState.profile) {
          setState(remoteState);
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(remoteState));
          } catch {}
          setSyncStatus('saved');
        } else {
          // First time user: initialize with starting data customized with their account name
          const initialCustomState: FitnessState = {
            ...loadInitialFitnessState(),
            profile: {
              ...initialProfile,
              theme: getPreferredTheme(),
              name: currentUser.displayName || currentUser.email?.split('@')[0] || initialProfile.name,
            },
          };
          setState(initialCustomState);
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(initialCustomState));
            await saveUserFitnessState(uid, initialCustomState);
            setSyncStatus('saved');
          } catch (initErr) {
            console.error('Failed to initialize user state in Firestore:', initErr);
          }
        }
      } catch (err) {
        console.error('Error fetching user fitness state from Firestore:', err);
        setSyncStatus('error');
      } finally {
        setTimeout(() => {
          if (!isCancelled) {
            isInitialLoadRef.current = false;
            setSyncStatus('idle');
          }
        }, 1200);
      }
    }

    handleUserAuthChange();

    return () => {
      isCancelled = true;
    };
  }, [currentUser]);

  // Sync state changes to local storage & debounced Cloud Firestore
  useEffect(() => {
    if (!currentUser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
      return;
    }

    const uid = currentUser.uid;
    const userStorageKey = `${STORAGE_KEY}_${uid}`;

    // Always keep local storage updated
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed caching to localStorage:', err);
    }

    // Skip cloud save if currently performing initial load
    if (isInitialLoadRef.current) return;

    // Debounce Firestore save to keep well within Spark free tier limits
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await saveUserFitnessState(uid, state);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (e) {
        console.error('Debounced save to Firestore failed:', e);
        setSyncStatus('error');
      }
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, currentUser]);

  const forceSyncCloud = async (): Promise<boolean> => {
    if (!currentUser) return false;
    setSyncStatus('syncing');
    try {
      await saveUserFitnessState(currentUser.uid, state);
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2500);
      return true;
    } catch (e) {
      console.error('Manual force sync failed:', e);
      setSyncStatus('error');
      return false;
    }
  };

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
    if (currentUser) {
      localStorage.removeItem(`${STORAGE_KEY}_${currentUser.uid}`);
    }
    const { weights, loggedFoods, completedWorkouts, cardioSessions } = generateMockHistory();
    const freshReview = buildInitialWeeklyReview(weights, loggedFoods, initialProfile);
    const todayStr = getLocalDateString();
    const freshState: FitnessState = {
      profile: {
        ...initialProfile,
        theme: getPreferredTheme(),
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || initialProfile.name,
      },
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
      hydrationLogs: { [todayStr]: 1750 },
      weeklySchedule: defaultWeeklySchedule,
    };
    setState(freshState);
    if (currentUser) {
      saveUserFitnessState(currentUser.uid, freshState).catch(console.error);
    }
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
        foodLibrary: Array.isArray(parsed.foodLibrary) ? parsed.foodLibrary : mockFoodLibrary,
        exercises: Array.isArray(parsed.exercises) ? parsed.exercises : mockExercises,
        templates: Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : mockTemplates,
        completedWorkouts: Array.isArray(parsed.completedWorkouts) ? parsed.completedWorkouts : [],
        cardioSessions: Array.isArray(parsed.cardioSessions) ? parsed.cardioSessions : [],
        activeWorkout: parsed.activeWorkout ?? null,
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        waterMlToday: typeof parsed.waterMlToday === 'number' ? parsed.waterMlToday : 0,
        hydrationLogs: parsed.hydrationLogs && typeof parsed.hydrationLogs === 'object' ? parsed.hydrationLogs : { [todayStr]: parsed.waterMlToday || 0 },
        weeklySchedule: Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule : defaultWeeklySchedule,
      };
      setState(next);
      if (currentUser) {
        saveUserFitnessState(currentUser.uid, next).catch(console.error);
      } else {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Parse error' };
    }
  };

  return (
    <FitnessContext.Provider
      value={{
        state,
        syncStatus,
        forceSyncCloud,
        updateProfile,
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
        exportAllJson,
        importAllJson,
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
