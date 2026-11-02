import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRoutineDraftOffline,
  enforceExerciseLibraryConstraints,
  generateRoutineDraft,
} from './routineGenerator';
import { mockExercises } from '../utils/mockData';
import { WorkoutTemplateExercise } from '../types';

test('generateRoutineDraftOffline strictly selects valid exercises from library', () => {
  const result = generateRoutineDraftOffline(
    {
      focus: 'hypertrophy',
      daysPerWeek: 4,
      equipment: 'all',
      sessionLengthMinutes: 45,
    },
    mockExercises
  );

  assert.ok(result.exercises.length >= 3);
  const allowedIds = new Set(mockExercises.map((e) => e.id));

  for (const ex of result.exercises) {
    assert.ok(allowedIds.has(ex.exerciseId), `Exercise ${ex.exerciseId} must exist in library`);
    assert.ok(ex.defaultSets > 0 && ex.defaultSets <= 6);
    assert.ok(ex.defaultReps > 0 && ex.defaultReps <= 30);
  }

  assert.equal(result.source, 'offline');
});

test('generateRoutineDraftOffline respects Dumbbell equipment constraint', () => {
  const result = generateRoutineDraftOffline(
    {
      focus: 'strength',
      daysPerWeek: 3,
      equipment: 'Dumbbell',
      sessionLengthMinutes: 45,
    },
    mockExercises
  );

  assert.ok(result.exercises.length >= 2);
  const dbExercises = mockExercises.filter(
    (e) => e.equipment === 'Dumbbell' || e.equipment === 'Bodyweight'
  );
  const dbIds = new Set(dbExercises.map((e) => e.id));

  for (const ex of result.exercises) {
    assert.ok(dbIds.has(ex.exerciseId), `Exercise ${ex.exerciseId} must be Dumbbell/Bodyweight`);
  }
});

test('enforceExerciseLibraryConstraints eliminates hallucinated exercise IDs', () => {
  const rawExercises: WorkoutTemplateExercise[] = [
    { exerciseId: 'ex-1', defaultSets: 3, defaultReps: 8 },
    { exerciseId: 'invented-fake-id-12345', defaultSets: 4, defaultReps: 12 },
    { exerciseId: 'ex-3', defaultSets: 3, defaultReps: 5 },
  ];

  const cleaned = enforceExerciseLibraryConstraints(rawExercises, mockExercises);

  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].exerciseId, 'ex-1');
  assert.equal(cleaned[1].exerciseId, 'ex-3');
});

test('generateRoutineDraft runs offline cleanly with zero cost when no key provided', async () => {
  const draft = await generateRoutineDraft(
    {
      focus: 'conditioning',
      daysPerWeek: 3,
      equipment: 'all',
      sessionLengthMinutes: 30,
    },
    mockExercises,
    '' // no API key
  );

  assert.equal(draft.source, 'offline');
  assert.ok(draft.exercises.length >= 2);
  assert.ok(draft.name.length > 0);
});
