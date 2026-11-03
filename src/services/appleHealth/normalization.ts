import {
  CardioActivityType,
  CardioSession,
  CompletedWorkout,
  SleepRecord,
  WeightRecord,
} from '../../types';
import {
  AppleHealthRawRecord,
  AppleHealthWorkoutRecord,
  DailyAggregatedMetrics,
} from './types';

/**
 * Parses Apple Health timestamps into UTC ISO string and local YYYY-MM-DD string.
 * Formats in export.xml:
 * - "2026-11-03 14:30:00 -0300"
 * - "2026-11-03T14:30:00-03:00"
 * - "2026-11-03T17:30:00Z"
 */
export function parseAppleHealthDate(dateStr: string): { iso: string; dateOnly: string; timestampMs: number } {
  if (!dateStr) {
    const now = new Date();
    return { iso: now.toISOString(), dateOnly: now.toISOString().slice(0, 10), timestampMs: now.getTime() };
  }

  const trimmed = dateStr.trim();
  let normalized = trimmed;

  // Format "2026-11-03 14:30:00 -0300" -> "2026-11-03T14:30:00-03:00"
  if (trimmed.includes(' ') && !trimmed.includes('T')) {
    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const tzPart = parts[2] || '';
      let formattedTz = '';
      if (tzPart.length === 5 && (tzPart.startsWith('+') || tzPart.startsWith('-'))) {
        formattedTz = `${tzPart.slice(0, 3)}:${tzPart.slice(3)}`;
      } else if (tzPart) {
        formattedTz = tzPart;
      }
      normalized = `${datePart}T${timePart}${formattedTz}`;
    }
  }

  const parsedDate = new Date(normalized);
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const iso = validDate.toISOString();
  // Use date portion from original local date string if present to prevent UTC offset day-shift
  const dateOnly = trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)
    ? trimmed.slice(0, 10)
    : iso.slice(0, 10);

  return { iso, dateOnly, timestampMs: validDate.getTime() };
}

/**
 * Normalizes mass measurements to kilograms (kg).
 */
export function normalizeMassToKg(value: number, unit: string = 'kg'): number {
  const u = unit.toLowerCase().trim();
  if (u === 'lb' || u === 'lbs') {
    return parseFloat((value * 0.45359237).toFixed(2));
  }
  if (u === 'stone' || u === 'st') {
    return parseFloat((value * 6.35029318).toFixed(2));
  }
  if (u === 'g' || u === 'grams') {
    return parseFloat((value / 1000).toFixed(2));
  }
  return parseFloat(value.toFixed(2));
}

/**
 * Normalizes length/height measurements to centimeters (cm).
 */
export function normalizeLengthToCm(value: number, unit: string = 'cm'): number {
  const u = unit.toLowerCase().trim();
  if (u === 'm' || u === 'meter' || u === 'meters') {
    return parseFloat((value * 100).toFixed(1));
  }
  if (u === 'in' || u === 'inch' || u === 'inches') {
    return parseFloat((value * 2.54).toFixed(1));
  }
  if (u === 'ft' || u === 'feet') {
    return parseFloat((value * 30.48).toFixed(1));
  }
  return parseFloat(value.toFixed(1));
}

/**
 * Normalizes distance to kilometers (km).
 */
export function normalizeDistanceToKm(value: number, unit: string = 'km'): number {
  const u = unit.toLowerCase().trim();
  if (u === 'm' || u === 'meter' || u === 'meters') {
    return parseFloat((value / 1000).toFixed(3));
  }
  if (u === 'mi' || u === 'mile' || u === 'miles') {
    return parseFloat((value * 1.609344).toFixed(3));
  }
  if (u === 'yd' || u === 'yard' || u === 'yards') {
    return parseFloat((value * 0.0009144).toFixed(3));
  }
  return parseFloat(value.toFixed(3));
}

/**
 * Normalizes energy to kilocalories (kcal).
 */
export function normalizeEnergyToKcal(value: number, unit: string = 'kcal'): number {
  const u = unit.toLowerCase().trim();
  if (u === 'kj' || u === 'kilojoule' || u === 'kilojoules') {
    return Math.round(value * 0.239006);
  }
  if (u === 'j' || u === 'joules') {
    return Math.round(value * 0.000239006);
  }
  return Math.round(value);
}

/**
 * Normalizes body fat percentage to a clean 0-100 float.
 */
export function normalizeBodyFatPercentage(value: number, unit: string = '%'): number {
  const u = unit.toLowerCase().trim();
  // Often Apple exports 0.185 for 18.5%
  if (u === '%' || u === 'percent') {
    return value <= 1 ? parseFloat((value * 100).toFixed(1)) : parseFloat(value.toFixed(1));
  }
  if (value <= 1 && value > 0) {
    return parseFloat((value * 100).toFixed(1));
  }
  return parseFloat(value.toFixed(1));
}

/**
 * Normalizes water volume to milliliters (ml).
 */
export function normalizeWaterToMl(value: number, unit: string = 'ml'): number {
  const u = unit.toLowerCase().trim();
  if (u === 'l' || u === 'liter' || u === 'liters') {
    return Math.round(value * 1000);
  }
  if (u === 'fl_oz_us' || u === 'oz') {
    return Math.round(value * 29.5735);
  }
  return Math.round(value);
}

/**
 * Generates clean deterministic IDs for idempotent repeated imports.
 */
export function generateDeterministicId(prefix: string, parts: (string | number)[]): string {
  const cleanParts = parts.map((p) =>
    String(p)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
  );
  return `${prefix}-${cleanParts.join('-')}`;
}

/**
 * Workout mapping: translates Apple Health activity types to Eunoia domain models.
 */
export function mapAppleWorkout(
  raw: AppleHealthWorkoutRecord
): { isStrength: boolean; workout?: CompletedWorkout; cardio?: CardioSession } {
  const { activityType, durationSeconds, distanceKm, energyKcal, startDate, endDate, sourceName = 'Apple Watch', avgHeartRateBpm } = raw;
  const startInfo = parseAppleHealthDate(startDate);
  const endInfo = parseAppleHealthDate(endDate || startDate);
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const caloriesBurned = energyKcal || Math.round(durationMinutes * 7.5);

  const isStrengthTraining =
    activityType.includes('Strength') ||
    activityType.includes('WeightTraining') ||
    activityType.includes('CrossTraining') ||
    activityType.includes('FunctionalStrength');

  if (isStrengthTraining) {
    const id = generateDeterministicId('apple-strength', [
      sourceName,
      startInfo.iso,
      activityType,
    ]);

    const workout: CompletedWorkout = {
      id,
      name: formatWorkoutTitle(activityType, sourceName),
      startTime: startInfo.iso,
      endTime: endInfo.iso,
      durationSeconds,
      exercises: [],
      totalVolumeKg: 0,
      notes: `Imported from ${sourceName} (${caloriesBurned} kcal${avgHeartRateBpm ? `, avg HR: ${avgHeartRateBpm} bpm` : ''})`,
    };
    return { isStrength: true, workout };
  }

  // Map to CardioActivityType
  const { type, defaultName } = resolveCardioType(activityType);
  const id = generateDeterministicId('apple-cardio', [
    sourceName,
    startInfo.iso,
    activityType,
  ]);

  let paceMinPerKm: string | undefined;
  if (distanceKm && distanceKm > 0 && durationMinutes > 0) {
    const paceDec = durationMinutes / distanceKm;
    const mins = Math.floor(paceDec);
    const secs = Math.round((paceDec - mins) * 60);
    paceMinPerKm = `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const cardio: CardioSession = {
    id,
    type,
    activity: type,
    name: defaultName,
    date: startInfo.iso,
    durationMinutes,
    durationSeconds,
    distanceKm: distanceKm && distanceKm > 0 ? parseFloat(distanceKm.toFixed(2)) : undefined,
    caloriesBurned,
    avgHeartRateBpm,
    avgPaceMinPerKm: paceMinPerKm,
    notes: `Synced from ${sourceName}`,
  };

  return { isStrength: false, cardio };
}

function resolveCardioType(actType: string): { type: CardioActivityType; defaultName: string } {
  if (actType.includes('Running')) return { type: 'running', defaultName: 'Outdoor Run' };
  if (actType.includes('Cycling')) return { type: 'cycling', defaultName: 'Cycling Ride' };
  if (actType.includes('Walking') || actType.includes('Hiking')) return { type: 'walking', defaultName: 'Outdoor Walk' };
  if (actType.includes('Swimming')) return { type: 'swimming', defaultName: 'Swim Session' };
  if (actType.includes('Rowing')) return { type: 'rowing', defaultName: 'Rowing Session' };
  if (actType.includes('Elliptical')) return { type: 'elliptical', defaultName: 'Elliptical Workout' };
  if (actType.includes('Stair')) return { type: 'stairmaster', defaultName: 'Stair Workout' };
  return { type: 'running', defaultName: formatWorkoutTitle(actType, 'Apple Health') };
}

function formatWorkoutTitle(raw: string, fallbackSource: string): string {
  const stripped = raw.replace(/^HKWorkoutActivityType/, '');
  const spaced = stripped.replace(/([A-Z])/g, ' $1').trim();
  return spaced ? `${spaced} (${fallbackSource})` : `${fallbackSource} Workout`;
}

/**
 * Normalizes raw sleep intervals into clean daily SleepRecords,
 * deduplicating overlapping in-bed and sleep stage intervals.
 */
export function aggregateSleepRecords(rawRecords: AppleHealthRawRecord[]): SleepRecord[] {
  // Filter for HKCategoryTypeIdentifierSleepAnalysis records
  const sleepItems = rawRecords.filter((r) => r.type.includes('SleepAnalysis'));
  if (sleepItems.length === 0) return [];

  // Group by "sleep night" date. A sleep session that starts at 11 PM on 2026-11-01 belongs to the morning of 2026-11-02.
  // Standard clinical convention: sleep ending between 04:00 and 16:00 is indexed on that wake date.
  const nightGroups = new Map<string, { startMs: number; endMs: number; stage: string; value: string }[]>();

  for (const item of sleepItems) {
    const start = parseAppleHealthDate(item.startDate);
    const end = parseAppleHealthDate(item.endDate);
    if (end.timestampMs <= start.timestampMs) continue;

    // Wake date determination
    const wakeDate = new Date(end.timestampMs);
    const wakeDateStr = wakeDate.toISOString().slice(0, 10);

    const stageValue = item.value;
    const stage = classifySleepStage(stageValue);

    if (!nightGroups.has(wakeDateStr)) {
      nightGroups.set(wakeDateStr, []);
    }
    nightGroups.get(wakeDateStr)!.push({
      startMs: start.timestampMs,
      endMs: end.timestampMs,
      stage,
      value: stageValue,
    });
  }

  const results: SleepRecord[] = [];

  for (const [dateStr, intervals] of nightGroups.entries()) {
    // Separate actual asleep intervals (Core, Deep, REM, Asleep) from InBed and Awake
    const asleepIntervals = intervals.filter(
      (i) => i.stage === 'deep' || i.stage === 'core' || i.stage === 'rem' || i.stage === 'asleep'
    );

    // If only InBed was logged (older devices or 3rd party apps), use InBed intervals
    const targetIntervals = asleepIntervals.length > 0 ? asleepIntervals : intervals.filter((i) => i.stage !== 'awake');
    if (targetIntervals.length === 0) continue;

    // Sort intervals chronologically
    targetIntervals.sort((a, b) => a.startMs - b.startMs);

    // Merge overlapping intervals to prevent double-counting
    let totalAsleepMs = 0;
    let currentStart = targetIntervals[0].startMs;
    let currentEnd = targetIntervals[0].endMs;

    for (let i = 1; i < targetIntervals.length; i++) {
      const next = targetIntervals[i];
      if (next.startMs < currentEnd) {
        // Overlap: extend end if next interval finishes later
        if (next.endMs > currentEnd) {
          currentEnd = next.endMs;
        }
      } else {
        // Non-overlapping: tally current span and advance
        totalAsleepMs += (currentEnd - currentStart);
        currentStart = next.startMs;
        currentEnd = next.endMs;
      }
    }
    totalAsleepMs += (currentEnd - currentStart);

    const durationMinutes = Math.max(1, Math.round(totalAsleepMs / (1000 * 60)));
    // Clamp to realistic 24-hour sleep window
    if (durationMinutes > 1440) continue;

    const earliestStart = new Date(Math.min(...intervals.map((i) => i.startMs)));
    const latestEnd = new Date(Math.max(...intervals.map((i) => i.endMs)));

    const bedTime = `${String(earliestStart.getHours()).padStart(2, '0')}:${String(earliestStart.getMinutes()).padStart(2, '0')}`;
    const wakeTime = `${String(latestEnd.getHours()).padStart(2, '0')}:${String(latestEnd.getMinutes()).padStart(2, '0')}`;

    // Quality Rating: 1 to 5 scale based on restorative sleep duration
    let qualityRating = 3;
    let restfulness: 'poor' | 'fair' | 'good' | 'optimal' = 'good';

    if (durationMinutes >= 450) {
      // 7.5h+
      qualityRating = 5;
      restfulness = 'optimal';
    } else if (durationMinutes >= 390) {
      // 6.5h+
      qualityRating = 4;
      restfulness = 'good';
    } else if (durationMinutes >= 330) {
      // 5.5h+
      qualityRating = 3;
      restfulness = 'fair';
    } else {
      qualityRating = 2;
      restfulness = 'poor';
    }

    results.push({
      id: generateDeterministicId('apple-sleep', [dateStr]),
      date: dateStr,
      bedTime,
      wakeTime,
      durationMinutes,
      qualityRating,
      restfulness,
      notes: `Imported Apple Watch sleep session (${(durationMinutes / 60).toFixed(1)}h)`,
    });
  }

  // Sort descending by date
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

function classifySleepStage(val: string): 'deep' | 'core' | 'rem' | 'awake' | 'asleep' | 'in_bed' {
  const v = val.toLowerCase();
  if (v.includes('deep') || v === '4') return 'deep';
  if (v.includes('core') || v === '3') return 'core';
  if (v.includes('rem') || v === '5') return 'rem';
  if (v.includes('awake') || v === '2') return 'awake';
  if (v.includes('inbed') || v === '0') return 'in_bed';
  return 'asleep';
}
