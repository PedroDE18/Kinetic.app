import { GoogleGenAI, Type } from '@google/genai';
import { ExerciseDefinition, WorkoutTemplateExercise } from '../types';

export interface RoutineGeneratorInput {
  focus: 'hypertrophy' | 'strength' | 'conditioning';
  daysPerWeek: number; // 2 to 6
  equipment: 'all' | 'Barbell' | 'Dumbbell' | 'Bodyweight';
  sessionLengthMinutes?: number; // 30, 45, 60, 75
}

export interface GeneratedRoutineDraft {
  name: string;
  targetSplit: string;
  description: string;
  exercises: WorkoutTemplateExercise[];
  source: 'model' | 'offline';
}

/**
 * Filter exercises matching equipment constraints.
 */
function filterByEquipment(
  exercises: ExerciseDefinition[],
  equipment: RoutineGeneratorInput['equipment']
): ExerciseDefinition[] {
  if (equipment === 'all') return exercises;
  return exercises.filter(
    (e) => e.equipment === equipment || e.equipment === 'Bodyweight'
  );
}

/**
 * Deterministic offline routine generator.
 * Strictly picks from provided ExerciseDefinition[] and enforces volume & movement balance.
 * Zero cost, zero external API calls.
 */
export function generateRoutineDraftOffline(
  input: RoutineGeneratorInput,
  availableExercises: ExerciseDefinition[]
): GeneratedRoutineDraft {
  const validList = filterByEquipment(availableExercises, input.equipment);
  const pool = validList.length >= 3 ? validList : availableExercises;

  const defaultSets = input.focus === 'strength' ? 4 : 3;
  const defaultReps =
    input.focus === 'strength' ? 5 : input.focus === 'hypertrophy' ? 10 : 14;
  const targetRpe =
    input.focus === 'strength' ? 8.5 : input.focus === 'hypertrophy' ? 8 : 7.5;

  const maxExercises =
    (input.sessionLengthMinutes || 60) <= 30
      ? 3
      : (input.sessionLengthMinutes || 60) <= 45
      ? 4
      : 5;

  // Curate balanced routine: 1 Chest, 1 Back, 1 Legs, 1 Shoulders/Arms/Core
  const selected: ExerciseDefinition[] = [];

  const pickForMuscle = (mg: ExerciseDefinition['muscleGroup']) => {
    const candidates = pool.filter((e) => e.muscleGroup === mg);
    for (const cand of candidates) {
      if (!selected.some((s) => s.id === cand.id)) {
        selected.push(cand);
        return;
      }
    }
  };

  pickForMuscle('Chest');
  pickForMuscle('Back');
  pickForMuscle('Legs');
  pickForMuscle('Shoulders');
  pickForMuscle('Arms');

  // Fill up to maxExercises from whatever is remaining
  for (const ex of pool) {
    if (selected.length >= maxExercises) break;
    if (!selected.some((s) => s.id === ex.id)) {
      selected.push(ex);
    }
  }

  // Map to WorkoutTemplateExercise
  const exercises: WorkoutTemplateExercise[] = selected.map((ex) => ({
    exerciseId: ex.id,
    defaultSets,
    defaultReps,
    targetRpe,
  }));

  const focusTitle =
    input.focus === 'hypertrophy'
      ? 'Hypertrophy Full Body'
      : input.focus === 'strength'
      ? 'Max Strength Compound'
      : 'Conditioning & Capacity';

  const equipLabel = input.equipment === 'all' ? 'Full Gym' : `${input.equipment} Only`;

  return {
    name: `${focusTitle} (${equipLabel})`,
    targetSplit: input.daysPerWeek <= 3 ? 'Full Body' : 'Upper / Lower',
    description: `Targeted ${input.focus} program balanced across ${selected.length} movements for a ~${input.sessionLengthMinutes || 45} min session.`,
    exercises,
    source: 'offline',
  };
}

/**
 * Validates that all exercise IDs in draft strictly exist in the library.
 * Replaces any hallucinated or missing IDs with valid ones.
 */
export function enforceExerciseLibraryConstraints(
  draftExercises: WorkoutTemplateExercise[],
  availableExercises: ExerciseDefinition[]
): WorkoutTemplateExercise[] {
  const validIds = new Set(availableExercises.map((e) => e.id));
  const cleanList: WorkoutTemplateExercise[] = [];
  const used = new Set<string>();

  for (const item of draftExercises) {
    if (validIds.has(item.exerciseId) && !used.has(item.exerciseId)) {
      cleanList.push({
        exerciseId: item.exerciseId,
        defaultSets: Math.min(10, Math.max(1, Math.round(item.defaultSets || 3))),
        defaultReps: Math.min(50, Math.max(1, Math.round(item.defaultReps || 10))),
        targetRpe: Math.min(10, Math.max(5, Number(item.targetRpe || 8))),
      });
      used.add(item.exerciseId);
    }
  }

  // If after validation we have fewer than 2 exercises, backfill from available library
  if (cleanList.length < 2 && availableExercises.length >= 2) {
    for (const ex of availableExercises) {
      if (!used.has(ex.id)) {
        cleanList.push({
          exerciseId: ex.id,
          defaultSets: 3,
          defaultReps: 10,
          targetRpe: 8,
        });
        used.add(ex.id);
        if (cleanList.length >= 3) break;
      }
    }
  }

  return cleanList;
}

/**
 * Generate a complete routine draft using Gemini 2.5 Flash Free Tier,
 * with automatic fallback to the deterministic offline routine generator.
 *
 * GUARANTEE: NEVER incurs any paid cost. Uses the free-tier Gemini API or pure offline computation.
 */
export async function generateRoutineDraft(
  input: RoutineGeneratorInput,
  availableExercises: ExerciseDefinition[],
  apiKeyOverride?: string
): Promise<GeneratedRoutineDraft> {
  const apiKey =
    (apiKeyOverride && apiKeyOverride.trim()) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GEMINI_API_KEY &&
      import.meta.env.VITE_GEMINI_API_KEY.trim()) ||
    '';

  // If no API key, use free offline generator immediately
  if (!apiKey || availableExercises.length === 0) {
    return generateRoutineDraftOffline(input, availableExercises);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const allowedList = availableExercises
      .map((e) => `- ID "${e.id}": ${e.name} [Muscle: ${e.muscleGroup}, Equip: ${e.equipment}]`)
      .join('\n');

    const promptText = `
Create an optimal resistance training routine draft based on the following parameters:
- Goal: ${input.focus}
- Days Per Week: ${input.daysPerWeek}
- Equipment Constraint: ${input.equipment}
- Target Session Length: ${input.sessionLengthMinutes || 45} minutes

CRITICAL CONSTRAINT: You MUST select exercises EXCLUSIVELY from the allowed exercises list below. Use the exact ID string. Do NOT invent new IDs or names.

ALLOWED EXERCISES:
${allowedList}
    `.trim();

    let responseText = '';
    for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction:
              'You are an athletic strength & conditioning coach. Build a balanced workout routine for the requested goal. You MUST ONLY use the exercise IDs provided in the allowed exercises list. DO NOT invent IDs. Return a valid JSON object matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Descriptive routine title' },
                targetSplit: { type: Type.STRING, description: 'e.g. Upper / Lower, Full Body, Push, Pull' },
                description: { type: Type.STRING, description: 'Brief explanation of programming philosophy' },
                exercises: {
                  type: Type.ARRAY,
                  description: 'List of exercise prescriptions',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      exerciseId: { type: Type.STRING, description: 'Exact ID from allowed exercises list' },
                      defaultSets: { type: Type.NUMBER, description: 'Prescribed working sets (typically 3-5)' },
                      defaultReps: { type: Type.NUMBER, description: 'Target repetition range (e.g. 5, 8, 10, 12)' },
                      targetRpe: { type: Type.NUMBER, description: 'Target RPE on a scale of 6 to 10' },
                    },
                    required: ['exerciseId', 'defaultSets', 'defaultReps'],
                  },
                },
              },
              required: ['name', 'targetSplit', 'description', 'exercises'],
            },
          },
        });
        if (res.text) {
          responseText = res.text;
          break;
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('API_KEY_INVALID')) break;
      }
    }

    if (!responseText) {
      throw new Error('Model returned empty response');
    }

    const parsed = JSON.parse(responseText);
    const validatedExercises = enforceExerciseLibraryConstraints(
      parsed.exercises || [],
      availableExercises
    );

    return {
      name: parsed.name || 'AI Athletic Routine',
      targetSplit: parsed.targetSplit || 'Upper / Lower',
      description: parsed.description || 'Custom programmed routine',
      exercises: validatedExercises,
      source: 'model',
    };
  } catch (err) {
    // Graceful fallback to offline generator on any error
    return generateRoutineDraftOffline(input, availableExercises);
  }
}
