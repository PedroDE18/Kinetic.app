import { CardioSession, CompletedWorkout, SleepRecord, WeightRecord } from '../../types';
import { DailyAggregatedMetrics } from './types';

const DB_NAME = 'eunoia_health_db';
const DB_VERSION = 1;

interface HealthDbSchema {
  dailyMetrics: DailyAggregatedMetrics;
  cardio: CardioSession;
  workouts: CompletedWorkout;
  weights: WeightRecord;
  sleep: SleepRecord;
  metadata: { key: string; value: any };
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and returns the IndexedDB instance for high-volume historical health metrics.
 */
export async function getHealthDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return null; // Fallback in Node or restricted environments
  }
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('dailyMetrics')) {
        db.createObjectStore('dailyMetrics', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('cardio')) {
        const store = db.createObjectStore('cardio', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const store = db.createObjectStore('workouts', { keyPath: 'id' });
        store.createIndex('startTime', 'startTime', { unique: false });
      }
      if (!db.objectStoreNames.contains('weights')) {
        db.createObjectStore('weights', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('sleep')) {
        const store = db.createObjectStore('sleep', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('Could not open IndexedDB for health data:', e);
      resolve(null);
    };
  });
}

/**
 * Persists an array of daily aggregated health metrics (Steps, Energy, HR, HRV) into IndexedDB.
 */
export async function saveDailyMetricsBatch(metrics: DailyAggregatedMetrics[]): Promise<void> {
  const db = await getHealthDb();
  if (!db || metrics.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('dailyMetrics', 'readwrite');
    const store = tx.objectStore('dailyMetrics');

    for (const m of metrics) {
      // Merge with existing record if already present
      store.put(m);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves daily metrics sorted chronologically for trend and progress rendering.
 */
export async function getDailyMetricsHistory(daysLimit: number = 365): Promise<DailyAggregatedMetrics[]> {
  const db = await getHealthDb();
  if (!db) return [];

  return new Promise((resolve) => {
    const tx = db.transaction('dailyMetrics', 'readonly');
    const store = tx.objectStore('dailyMetrics');
    const request = store.getAll();

    request.onsuccess = () => {
      const all: DailyAggregatedMetrics[] = request.result || [];
      all.sort((a, b) => a.date.localeCompare(b.date));
      resolve(daysLimit > 0 ? all.slice(-daysLimit) : all);
    };

    request.onerror = () => {
      resolve([]);
    };
  });
}

/**
 * Persists workouts batch into IndexedDB.
 */
export async function saveWorkoutsBatch(workouts: CompletedWorkout[]): Promise<void> {
  const db = await getHealthDb();
  if (!db || workouts.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('workouts', 'readwrite');
    const store = tx.objectStore('workouts');
    for (const w of workouts) {
      store.put(w);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Persists cardio sessions batch into IndexedDB.
 */
export async function saveCardioBatch(cardio: CardioSession[]): Promise<void> {
  const db = await getHealthDb();
  if (!db || cardio.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cardio', 'readwrite');
    const store = tx.objectStore('cardio');
    for (const c of cardio) {
      store.put(c);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Persists weights batch into IndexedDB.
 */
export async function saveWeightsBatch(weights: WeightRecord[]): Promise<void> {
  const db = await getHealthDb();
  if (!db || weights.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('weights', 'readwrite');
    const store = tx.objectStore('weights');
    for (const w of weights) {
      store.put(w);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Persists sleep records batch into IndexedDB.
 */
export async function saveSleepBatch(sleep: SleepRecord[]): Promise<void> {
  const db = await getHealthDb();
  if (!db || sleep.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('sleep', 'readwrite');
    const store = tx.objectStore('sleep');
    for (const s of sleep) {
      store.put(s);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Fetches storage counts and overview from IndexedDB.
 */
export async function getHealthStorageStats(): Promise<{
  daysRecorded: number;
  cardioCount: number;
  workoutsCount: number;
  weightsCount: number;
  sleepCount: number;
}> {
  const db = await getHealthDb();
  if (!db) {
    return { daysRecorded: 0, cardioCount: 0, workoutsCount: 0, weightsCount: 0, sleepCount: 0 };
  }

  const countStore = (storeName: string): Promise<number> => {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  };

  const [daysRecorded, cardioCount, workoutsCount, weightsCount, sleepCount] = await Promise.all([
    countStore('dailyMetrics'),
    countStore('cardio'),
    countStore('workouts'),
    countStore('weights'),
    countStore('sleep'),
  ]);

  return { daysRecorded, cardioCount, workoutsCount, weightsCount, sleepCount };
}
