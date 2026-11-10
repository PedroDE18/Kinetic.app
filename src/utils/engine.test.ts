import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightTrend,
  calculateAdaptiveTDEE,
  generateWeeklyAdjustmentProposal,
  calculate1RM,
  calculateWorkoutVolume,
  convertKgToLb,
  convertLbToKg,
  calculateRoutineVolumeHistory,
  formatPace,
  formatSpeed,
  calculateCardioStats,
  calculateConsecutiveStreak,
} from './engine';
import { WeightRecord, LoggedFood, CompletedWorkout, CardioSession } from '../types';

test('EWMA weight smoothing computes correct trend values', () => {
  const records: WeightRecord[] = [
    { date: '2026-10-01', weightKg: 85.0 },
    { date: '2026-10-02', weightKg: 84.0 },
    { date: '2026-10-03', weightKg: 86.0 },
  ];

  const trend = calculateWeightTrend(records, 0.2);
  assert.equal(trend.length, 3);
  assert.equal(trend[0].trendWeightKg, 85.0);

  // Day 2: 0.2 * 84 + 0.8 * 85 = 16.8 + 68 = 84.8
  assert.equal(trend[1].trendWeightKg, 84.8);

  // Day 3: 0.2 * 86 + 0.8 * 84.8 = 17.2 + 67.84 = 85.04
  assert.equal(trend[2].trendWeightKg, 85.04);
});

test('calculateAdaptiveTDEE estimates expenditure from intake and weight delta', () => {
  const weights: WeightRecord[] = [];
  const foods: LoggedFood[] = [];

  // Generate 14 days of data: 2200 kcal/day, losing ~0.1 kg/day (0.7 kg/week)
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    weights.push({
      date: dateStr,
      weightKg: 85.0 - (13 - i) * 0.1,
    });
    foods.push({
      id: `f-${i}`,
      foodId: 'f1',
      mealType: 'lunch',
      name: 'Standard Meal',
      servingCount: 1,
      servingSize: 100,
      servingUnit: 'g',
      calories: 2200,
      protein: 160,
      carbs: 220,
      fat: 65,
      loggedAt: `${dateStr}T12:00:00.000Z`,
    });
  }

  const result = calculateAdaptiveTDEE(weights, foods, 14);
  assert.equal(result.avgDailyIntake, 2200);
  assert.ok(result.confidenceScore >= 0.7);
  // Weight loss means TDEE is higher than intake (2200 + daily deficit)
  assert.ok(result.estimatedTdee > 2200);
  assert.ok(result.estimatedTdee <= 4500);
});

test('generateWeeklyAdjustmentProposal enforces damping bounds [-200, +200]', () => {
  // Case 1: Extreme deficit recommended, should clamp to +200
  const proposalHigh = generateWeeklyAdjustmentProposal(3200, 2000, 0, 0.9);
  assert.ok(proposalHigh.adjustmentDelta <= 200);

  // Case 2: Extreme surplus recommended, should clamp to -200
  const proposalLow = generateWeeklyAdjustmentProposal(1800, 2600, -0.5, 0.9);
  assert.ok(proposalLow.adjustmentDelta >= -200);

  // Case 3: Low confidence, should keep target steady
  const proposalUncertain = generateWeeklyAdjustmentProposal(2800, 2000, -0.4, 0.3);
  assert.equal(proposalUncertain.adjustmentDelta, 0);
  assert.equal(proposalUncertain.proposedTarget, 2000);
});

test('calculate1RM correctly applies Epley formula', () => {
  // 1 rep of 100kg is 100kg
  assert.equal(calculate1RM(100, 1), 100);

  // 10 reps of 100kg: 100 * (1 + 10/30) = 133.3 kg
  assert.equal(calculate1RM(100, 10), 133.3);

  // 0 reps or 0 weight
  assert.equal(calculate1RM(0, 10), 0);
});

test('calculateWorkoutVolume sums only completed sets', () => {
  const exercises = [
    {
      sets: [
        { actualWeightKg: 80, actualReps: 10, isCompleted: true }, // 800
        { actualWeightKg: 80, actualReps: 8, isCompleted: true },  // 640
        { actualWeightKg: 80, actualReps: 8, isCompleted: false }, // not completed
      ],
    },
    {
      sets: [
        { actualWeightKg: 50, actualReps: 10, isCompleted: true }, // 500
      ],
    },
  ];

  const volume = calculateWorkoutVolume(exercises);
  assert.equal(volume, 800 + 640 + 500); // 1940
});

test('calculateWorkoutVolume excludes warmup sets from effective volume by default', () => {
  const exercises = [
    {
      sets: [
        { actualWeightKg: 20, actualReps: 15, isCompleted: true, setType: 'warmup' as const }, // 300 warmup
        { actualWeightKg: 60, actualReps: 10, isCompleted: true, setType: 'warmup' as const }, // 600 warmup
        { actualWeightKg: 100, actualReps: 5, isCompleted: true, setType: 'normal' as const }, // 500 working
        { actualWeightKg: 100, actualReps: 5, isCompleted: true, setType: 'failure' as const }, // 500 working
      ],
    },
  ];

  const effectiveVolume = calculateWorkoutVolume(exercises);
  assert.equal(effectiveVolume, 1000); // Only normal + failure

  const grossVolume = calculateWorkoutVolume(exercises, true);
  assert.equal(grossVolume, 1900); // All completed sets
});

test('routine volume history groups volume correctly by routine', () => {
  const workouts: CompletedWorkout[] = [
    {
      id: 'w1',
      name: 'Upper Hypertrophy A',
      startTime: '2026-10-20T10:00:00Z',
      endTime: '2026-10-20T11:00:00Z',
      durationSeconds: 3600,
      totalVolumeKg: 9000,
      exercises: [],
    },
    {
      id: 'w2',
      name: 'Lower Strength B',
      startTime: '2026-10-22T10:00:00Z',
      endTime: '2026-10-22T11:00:00Z',
      durationSeconds: 3600,
      totalVolumeKg: 8500,
      exercises: [],
    },
    {
      id: 'w3',
      name: 'Upper Hypertrophy A',
      startTime: '2026-10-24T10:00:00Z',
      endTime: '2026-10-24T11:00:00Z',
      durationSeconds: 3600,
      totalVolumeKg: 9500,
      exercises: [],
    },
  ];

  const history = calculateRoutineVolumeHistory(workouts);
  assert.equal(history['Upper Hypertrophy A'].length, 2);
  assert.equal(history['Upper Hypertrophy A'][1].volumeKg, 9500);
  assert.equal(history['Lower Strength B'].length, 1);
});

test('formatPace and calculateCardioStats compute records accurately', () => {
  assert.equal(formatPace(30, 5), '6:00');
  assert.equal(formatPace(25, 5), '5:00');
  assert.equal(formatSpeed(30, 'metric'), '30.0 km/h');
  assert.equal(formatSpeed(30, 'imperial'), '18.6 mph');

  const sessions: CardioSession[] = [
    {
      id: 'c1',
      type: 'running',
      name: 'Morning 5K Run',
      date: '2026-10-25T07:00:00Z',
      durationMinutes: 28,
      distanceKm: 5.0,
      avgPaceMinPerKm: '5:36',
      caloriesBurned: 350,
    },
    {
      id: 'c2',
      type: 'running',
      name: 'Tempo Run',
      date: '2026-10-27T07:00:00Z',
      durationMinutes: 45,
      distanceKm: 8.5,
      avgPaceMinPerKm: '5:18',
      caloriesBurned: 580,
    },
    {
      id: 'c3',
      type: 'cycling',
      name: 'Outdoor Ride',
      date: '2026-10-28T07:00:00Z',
      durationMinutes: 60,
      distanceKm: 30,
      caloriesBurned: 600,
    },
  ];

  const stats = calculateCardioStats(sessions, 'running');
  assert.equal(stats.longestDistanceKm, 8.5);
  assert.equal(stats.longestDurationMinutes, 45);
  assert.equal(stats.sessionCount, 2);
  assert.equal(stats.totalDistanceKm, 13.5);

  const cycleStats = calculateCardioStats(sessions, 'cycling');
  assert.equal(cycleStats.sessionCount, 1);
  assert.equal(cycleStats.bestSpeedKmh, 30);
});

test('unit conversion helpers work accurately', () => {
  const lb = convertKgToLb(80);
  assert.equal(lb, 176.4);
  const kg = convertLbToKg(176.4);
  assert.equal(Math.round(kg), 80);
});

test('calculateConsecutiveStreak accurately computes and resets habit streaks', () => {
  const refDate = new Date(2026, 10, 10); // Nov 10, 2026

  // 1. Empty dates
  assert.equal(calculateConsecutiveStreak([], refDate), 0);

  // 2. Completed today (Nov 10), yesterday (Nov 09), day before (Nov 08) => 3
  assert.equal(
    calculateConsecutiveStreak(['2026-11-10', '2026-11-09', '2026-11-08'], refDate),
    3
  );

  // 3. Not completed today yet, but completed yesterday (Nov 09) and day before (Nov 08) => 2 (active grace)
  assert.equal(
    calculateConsecutiveStreak(['2026-11-09', '2026-11-08'], refDate),
    2
  );

  // 4. Lost yesterday! Completed Nov 08, Nov 07, Nov 06, but skipped Nov 09 and Nov 10 => 0 (streak reset)
  assert.equal(
    calculateConsecutiveStreak(['2026-11-08', '2026-11-07', '2026-11-06'], refDate),
    0
  );

  // 5. Gap in middle: Completed today (Nov 10), skipped Nov 09, completed Nov 08, 07 => 1 (fresh streak restarted today)
  assert.equal(
    calculateConsecutiveStreak(['2026-11-10', '2026-11-08', '2026-11-07'], refDate),
    1
  );

  // 6. Unsorted dates and duplicate entries handled idempotently
  assert.equal(
    calculateConsecutiveStreak(['2026-11-08', '2026-11-10', '2026-11-09', '2026-11-10'], refDate),
    3
  );
});
