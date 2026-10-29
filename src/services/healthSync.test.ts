import { test } from 'node:test';
import assert from 'node:assert';
import {
  parseAppleHealthXml,
  parseGarminTcx,
  parseFitnessCsv,
  parseJsonPayload,
  getSampleWearableActivities,
} from './healthSync.js';

test('parseAppleHealthXml extracts workouts and weight records', () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
  <HealthData>
    <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="1800" durationUnit="sec" totalDistance="5.0" totalDistanceUnit="km" totalEnergyBurned="380" totalEnergyBurnedUnit="kcal" creationDate="2026-05-10 08:30:00 -0400"/>
    <Record type="HKQuantityTypeIdentifierBodyMass" value="79.5" unit="kg" startDate="2026-05-10 07:15:00 -0400"/>
  </HealthData>`;

  const result = parseAppleHealthXml(sampleXml);
  assert.strictEqual(result.cardio.length, 1);
  assert.strictEqual(result.cardio[0].type, 'running');
  assert.strictEqual(result.cardio[0].durationMinutes, 30);
  assert.strictEqual(result.cardio[0].distanceKm, 5.0);
  assert.strictEqual(result.weights.length, 1);
  assert.strictEqual(result.weights[0].weightKg, 79.5);
});

test('parseGarminTcx extracts rides and calories', () => {
  const sampleTcx = `<?xml version="1.0" encoding="UTF-8"?>
  <TrainingCenterDatabase>
    <Activities>
      <Activity Sport="Biking">
        <Id>2026-05-11T14:00:00Z</Id>
        <Lap>
          <TotalTimeSeconds>3600</TotalTimeSeconds>
          <DistanceMeters>25000</DistanceMeters>
          <Calories>650</Calories>
          <AverageHeartRateBpm><Value>145</Value></AverageHeartRateBpm>
        </Lap>
      </Activity>
    </Activities>
  </TrainingCenterDatabase>`;

  const result = parseGarminTcx(sampleTcx);
  assert.strictEqual(result.cardio.length, 1);
  assert.strictEqual(result.cardio[0].type, 'cycling');
  assert.strictEqual(result.cardio[0].distanceKm, 25.0);
  assert.strictEqual(result.cardio[0].durationMinutes, 60);
  assert.strictEqual(result.cardio[0].caloriesBurned, 650);
  assert.strictEqual(result.cardio[0].avgHeartRateBpm, 145);
});

test('parseFitnessCsv handles generic activity rows', () => {
  const csv = `Date,Activity Type,Distance,Calories,Time,Avg HR
2026-05-12,Running,6.2,450,35:00,152`;

  const result = parseFitnessCsv(csv);
  assert.strictEqual(result.cardio.length, 1);
  assert.strictEqual(result.cardio[0].distanceKm, 6.2);
  assert.strictEqual(result.cardio[0].durationMinutes, 35);
});

test('parseJsonPayload ingests iOS Shortcut arrays', () => {
  const payload = [
    { type: 'running', distanceKm: 5.2, durationMinutes: 28, calories: 390 },
    { type: 'weight', weightKg: 78.8, date: '2026-05-12' },
  ];

  const result = parseJsonPayload(payload);
  assert.strictEqual(result.cardio.length, 1);
  assert.strictEqual(result.weights.length, 1);
  assert.strictEqual(result.weights[0].weightKg, 78.8);
});

test('getSampleWearableActivities provides ready-to-test data', () => {
  const apple = getSampleWearableActivities('apple_watch');
  assert.ok(apple.cardio.length > 0);
  assert.ok(apple.weights.length > 0);

  const garmin = getSampleWearableActivities('garmin_forerunner');
  assert.ok(garmin.cardio.length > 0);
  assert.ok(garmin.workouts.length > 0);
});
