import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAppleHealthXmlString } from './appleHealthManager';
import { StreamingAppleHealthXmlParser } from './streamingXmlParser';
import { AppleHealthDataAggregator, filterNormalizedData } from './appleHealthAggregator';
import {
  normalizeMassToKg,
  normalizeLengthToCm,
  normalizeDistanceToKm,
  normalizeEnergyToKcal,
  normalizeBodyFatPercentage,
  normalizeWaterToMl,
  parseAppleHealthDate,
  aggregateSleepRecords,
} from './normalization';
import { AppleHealthRawRecord } from './types';

describe('Apple Health Ingestion Engine — Unit Tests', () => {
  it('normalizes mass, length, distance, and energy units with precision', () => {
    // Pounds to kg
    assert.equal(normalizeMassToKg(180, 'lb'), 81.65);
    assert.equal(normalizeMassToKg(75.5, 'kg'), 75.5);
    assert.equal(normalizeMassToKg(11, 'stone'), 69.85);

    // Height
    assert.equal(normalizeLengthToCm(1.82, 'm'), 182);
    assert.equal(normalizeLengthToCm(70, 'in'), 177.8);
    assert.equal(normalizeLengthToCm(178, 'cm'), 178);

    // Distance
    assert.equal(normalizeDistanceToKm(5000, 'm'), 5);
    assert.equal(normalizeDistanceToKm(3.1, 'mi'), 4.989);
    assert.equal(normalizeDistanceToKm(10, 'km'), 10);

    // Energy
    assert.equal(normalizeEnergyToKcal(2000, 'kJ'), 478);
    assert.equal(normalizeEnergyToKcal(500, 'kcal'), 500);

    // Body Fat Percentage (both fractional 0.18 and percentage 18.0)
    assert.equal(normalizeBodyFatPercentage(0.165), 16.5);
    assert.equal(normalizeBodyFatPercentage(16.5, '%'), 16.5);

    // Water
    assert.equal(normalizeWaterToMl(2.5, 'L'), 2500);
    assert.equal(normalizeWaterToMl(32, 'fl_oz_us'), 946);
  });

  it('parses timestamps in both Apple Health space format and standard ISO', () => {
    const res1 = parseAppleHealthDate('2026-11-03 08:30:00 -0300');
    assert.equal(res1.dateOnly, '2026-11-03');
    assert.ok(res1.iso.includes('2026-11-03'));

    const res2 = parseAppleHealthDate('2026-05-15T12:00:00Z');
    assert.equal(res2.dateOnly, '2026-05-15');
  });

  it('parses multi-record XML containing body mass, body fat, workouts, and activity', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <ExportDate value="2026-11-03 12:00:00 -0300"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Withings Scale" unit="kg" value="82.4" startDate="2026-11-01 07:15:00 -0300" endDate="2026-11-01 07:15:00 -0300"/>
  <Record type="HKQuantityTypeIdentifierBodyFatPercentage" sourceName="Withings Scale" unit="%" value="17.2" startDate="2026-11-01 07:15:00 -0300" endDate="2026-11-01 07:15:00 -0300"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" value="4500" startDate="2026-11-01 09:00:00 -0300" endDate="2026-11-01 12:00:00 -0300"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" value="5500" startDate="2026-11-01 13:00:00 -0300" endDate="2026-11-01 18:00:00 -0300"/>
  <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" value="58" startDate="2026-11-01 08:00:00 -0300" endDate="2026-11-01 08:00:00 -0300"/>
  <Record type="HKQuantityTypeIdentifierHeartRateVariabilitySDNN" sourceName="Apple Watch" unit="ms" value="65" startDate="2026-11-01 06:00:00 -0300" endDate="2026-11-01 06:00:00 -0300"/>
  <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="30" durationUnit="min" totalDistance="5.2" totalDistanceUnit="km" totalEnergyBurned="380" totalEnergyBurnedUnit="kcal" sourceName="Apple Watch" startDate="2026-11-01 10:00:00 -0300" endDate="2026-11-01 10:30:00 -0300">
    <WorkoutStatistics type="HKQuantityTypeIdentifierHeartRate" average="152" maximum="174" unit="count/min"/>
  </Workout>
  <Workout workoutActivityType="HKWorkoutActivityTypeTraditionalStrengthTraining" duration="45" durationUnit="min" totalEnergyBurned="290" totalEnergyBurnedUnit="kcal" sourceName="Strong" startDate="2026-11-01 17:00:00 -0300" endDate="2026-11-01 17:45:00 -0300"/>
  <ActivitySummary dateComponents="2026-11-01" activeEnergyBurned="650" activeEnergyBurnedGoal="600" activeEnergyBurnedUnit="kcal" appleExerciseTime="55" appleStandHours="12"/>
</HealthData>`;

    const parsed = parseAppleHealthXmlString(sampleXml);

    // 1. Weights
    assert.equal(parsed.weights.length, 1);
    assert.equal(parsed.weights[0].weightKg, 82.4);
    assert.equal(parsed.weights[0].bodyFatPct, 17.2);
    assert.equal(parsed.weights[0].date, '2026-11-01');

    // 2. Cardio
    assert.equal(parsed.cardioSessions.length, 1);
    assert.equal(parsed.cardioSessions[0].type, 'running');
    assert.equal(parsed.cardioSessions[0].distanceKm, 5.2);
    assert.equal(parsed.cardioSessions[0].caloriesBurned, 380);
    assert.equal(parsed.cardioSessions[0].avgHeartRateBpm, 152);

    // 3. Strength Workout
    assert.equal(parsed.workouts.length, 1);
    assert.equal(parsed.workouts[0].durationSeconds, 2700); // 45 * 60
    assert.ok(parsed.workouts[0].name.includes('Traditional Strength'));

    // 4. Daily Metrics
    const day = parsed.dailyMetrics.find((m) => m.date === '2026-11-01');
    assert.ok(day);
    assert.equal(day?.steps, 10000); // 4500 + 5500
    assert.equal(day?.restingHeartRateBpm, 58);
    assert.equal(day?.hrvSdnnMs, 65);
    assert.equal(day?.activeEnergyKcal, 650);
  });

  it('deduplicates overlapping sleep intervals into accurate restorative sleep metrics', () => {
    const rawSleep: AppleHealthRawRecord[] = [
      // Broad in-bed container: 23:00 to 07:00
      {
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisInBed',
        startDate: '2026-11-02 23:00:00 -0300',
        endDate: '2026-11-03 07:00:00 -0300',
      },
      // Contiguous sub-stages:
      {
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisAsleepCore',
        startDate: '2026-11-02 23:15:00 -0300',
        endDate: '2026-11-03 01:15:00 -0300', // 120m
      },
      {
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisAsleepDeep',
        startDate: '2026-11-03 01:15:00 -0300',
        endDate: '2026-11-03 02:45:00 -0300', // 90m
      },
      {
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisAwake',
        startDate: '2026-11-03 02:45:00 -0300',
        endDate: '2026-11-03 03:00:00 -0300', // 15m awake (should NOT add to sleep duration)
      },
      {
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisAsleepREM',
        startDate: '2026-11-03 03:00:00 -0300',
        endDate: '2026-11-03 04:30:00 -0300', // 90m
      },
      {
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisAsleepCore',
        startDate: '2026-11-03 04:30:00 -0300',
        endDate: '2026-11-03 06:45:00 -0300', // 135m
      },
    ];

    const sleep = aggregateSleepRecords(rawSleep);
    assert.equal(sleep.length, 1);
    // Total asleep: 120 + 90 + 90 + 135 = 435 min (7.25h)
    assert.equal(sleep[0].durationMinutes, 435);
    assert.equal(sleep[0].date, '2026-11-03');
    assert.equal(sleep[0].restfulness, 'good');
  });

  it('handles arbitrary chunk boundaries without breaking XML tag semantics', () => {
    const rawTag = `<Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Scale" unit="kg" value="79.8" startDate="2026-10-25 08:00:00 -0300" endDate="2026-10-25 08:00:00 -0300"/>`;

    // Split rawTag across 3 awkward chunk slices
    const chunk1 = rawTag.slice(0, 35); // splits inside attribute
    const chunk2 = rawTag.slice(35, 75);
    const chunk3 = rawTag.slice(75);

    const records: AppleHealthRawRecord[] = [];
    const parser = new StreamingAppleHealthXmlParser({
      onRecord: (r) => records.push(r),
    });

    parser.pushChunk(chunk1);
    assert.equal(records.length, 0); // Not ready yet

    parser.pushChunk(chunk2);
    assert.equal(records.length, 0); // Still partial

    parser.pushChunk(chunk3);
    parser.finish();

    assert.equal(records.length, 1);
    assert.equal(records[0].type, 'HKQuantityTypeIdentifierBodyMass');
    assert.equal(records[0].value, '79.8');
    assert.equal(records[0].unit, 'kg');
  });

  it('guarantees idempotency: repeated imports produce identical deterministic IDs', () => {
    const sampleXml = `<HealthData locale="en_US">
      <Workout workoutActivityType="HKWorkoutActivityTypeCycling" duration="40" durationUnit="min" totalDistance="15.5" totalDistanceUnit="km" totalEnergyBurned="450" totalEnergyBurnedUnit="kcal" sourceName="Garmin Edge" startDate="2026-11-02 09:00:00 -0300" endDate="2026-11-02 09:40:00 -0300"/>
    </HealthData>`;

    const run1 = parseAppleHealthXmlString(sampleXml);
    const run2 = parseAppleHealthXmlString(sampleXml);

    assert.equal(run1.cardioSessions.length, 1);
    assert.equal(run2.cardioSessions.length, 1);
    assert.equal(run1.cardioSessions[0].id, run2.cardioSessions[0].id);
    assert.ok(run1.cardioSessions[0].id.startsWith('apple-cardio-Garmin_Edge-'));
  });

  it('filters import categories and date ranges correctly', () => {
    const sampleXml = `<HealthData locale="en_US">
      <Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" value="80" startDate="2024-01-01 08:00:00 -0300" endDate="2024-01-01 08:00:00 -0300"/>
      <Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" value="78" startDate="2026-11-01 08:00:00 -0300" endDate="2026-11-01 08:00:00 -0300"/>
    </HealthData>`;

    const parsed = parseAppleHealthXmlString(sampleXml);
    assert.equal(parsed.weights.length, 2);

    // Filter to last 30 days
    const filtered30d = filterNormalizedData(parsed, {
      dateRange: '30d',
      categories: {
        body_composition: true,
        activity: true,
        cardiovascular: true,
        sleep: true,
        workouts: true,
        nutrition: true,
      },
    });

    assert.equal(filtered30d.weights.length, 1);
    assert.equal(filtered30d.weights[0].weightKg, 78);

    // Toggle off body_composition
    const filteredNoBody = filterNormalizedData(parsed, {
      dateRange: 'all',
      categories: {
        body_composition: false,
        activity: true,
        cardiovascular: true,
        sleep: true,
        workouts: true,
        nutrition: true,
      },
    });
    assert.equal(filteredNoBody.weights.length, 0);
  });
});
