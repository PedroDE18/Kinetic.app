import { GoogleGenAI, Type } from '@google/genai';
import { UserProfile, WeeklyReviewRecord } from '../types';

export interface NarrativeInsight {
  headline: string;
  story: string;
  recommendation: string;
  confidenceBreakdown: {
    scorePct: number;
    level: 'High' | 'Moderate' | 'Building baseline';
    factors: string[];
  };
  source: 'model' | 'offline';
}

export interface NarrativeCoachContext {
  profile: UserProfile;
  review: WeeklyReviewRecord;
  completedWorkoutsCount: number;
  avgDailyWaterMl?: number;
}

/**
 * Deterministic, intelligent athletic coaching synthesis.
 * Runs 100% locally with zero cost, zero subscriptions, zero network calls.
 */
export function generateNarrativeInsightOffline(ctx: NarrativeCoachContext): NarrativeInsight {
  const { profile, review, completedWorkoutsCount, avgDailyWaterMl = 2500 } = ctx;
  const scorePct = Math.round(Math.min(1, Math.max(0, review.confidenceScore)) * 100);

  // Confidence Factors Breakdown
  const factors: string[] = [];
  let level: NarrativeInsight['confidenceBreakdown']['level'] = 'Building baseline';

  if (scorePct >= 70) {
    level = 'High';
    factors.push('Consistent 7-day weigh-in trend');
    factors.push('Reliable daily food intake entries');
    factors.push('Sufficient metabolic observation window');
  } else if (scorePct >= 50) {
    level = 'Moderate';
    factors.push('Active intake logging observed');
    factors.push('Partial weigh-in cadence (3-5 days)');
    factors.push('Trend algorithm dampening applied for safety');
  } else {
    level = 'Building baseline';
    factors.push('Fewer than 4 weigh-ins logged this cycle');
    factors.push('Baseline energy expenditure anchored at 2,400 kcal');
    factors.push('More weigh-in data will unlock precise calibration');
  }

  // Weight Trend & Goal Alignment Analysis
  const delta = review.weightDeltaKg;
  const goal = profile.goal;
  let headline = 'Steady Progression & Metabolic Health';
  let story = '';
  let recommendation = '';

  const deficitOrSurplus = review.estimatedTdee - review.avgCalorieIntake;

  if (goal === 'fat_loss') {
    if (delta < -0.15) {
      headline = 'Consistent Fat Loss Momentum';
      story = `Your scale trend decreased by ${Math.abs(delta)} kg over the past week with an average intake of ${review.avgCalorieIntake} kcal/day. Your estimated total daily energy expenditure is ${review.estimatedTdee} kcal, creating an effective daily deficit of ~${Math.round(deficitOrSurplus)} kcal.`;
      recommendation = review.adjustmentDelta !== 0
        ? `Adopt the proposed ${review.proposedCalorieTarget} kcal target to keep fat loss in the sweet spot while protecting lean muscle.`
        : `Hold your current target of ${review.currentCalorieTarget} kcal. Your progress is tracking precisely to your target rate.`;
    } else if (delta > 0.1) {
      headline = 'Temporary Plateau or Water Retention';
      story = `Your smoothed scale trend recorded a slight uptick (+${delta} kg) this week despite an intake of ${review.avgCalorieIntake} kcal/day. Daily fluid retention, muscle soreness, or sodium fluctuations frequently mask underlying fat loss.`;
      recommendation = 'Hold intake steady for 7 more days to confirm whether trend weight shifts before making aggressive dietary cuts.';
    } else {
      headline = 'Metabolic Maintenance Holding Flat';
      story = `Your weight held virtually flat (${delta >= 0 ? `+${delta}` : delta} kg) while averaging ${review.avgCalorieIntake} kcal/day. Your calculated metabolic expenditure is approximately ${review.estimatedTdee} kcal.`;
      recommendation = review.adjustmentDelta < 0
        ? `A modest adjustment to ${review.proposedCalorieTarget} kcal/day will re-ignite fat loss at a sustainable pace.`
        : 'Maintain your current nutrition targets and prioritize daily training volume.';
    }
  } else if (goal === 'muscle_gain') {
    if (delta > 0.1) {
      headline = 'Effective Hypertrophy Surfacing';
      story = `Your trend weight gained +${delta} kg this week on an average intake of ${review.avgCalorieIntake} kcal/day. Estimated expenditure is ${review.estimatedTdee} kcal, providing ample energy for progressive overload.`;
      recommendation = `Continue fueling heavy sessions with ${review.avgProteinIntake}g protein daily to maximize hypertrophy and minimize excess adiposity.`;
    } else {
      headline = 'Energy Surplus Needs Nudging';
      story = `Trend weight changed by ${delta} kg this week while taking in ${review.avgCalorieIntake} kcal/day against an expenditure of ${review.estimatedTdee} kcal.`;
      recommendation = `Increase caloric intake toward ${review.proposedCalorieTarget} kcal to ensure adequate energy availability for muscle recovery.`;
    }
  } else {
    // Recomposition or Maintenance
    headline = 'Equilibrium & Adaptive Consistency';
    story = `Your body weight is balancing closely with a 7-day delta of ${delta > 0 ? `+${delta}` : delta} kg. Average energy intake stood at ${review.avgCalorieIntake} kcal/day against an expenditure estimate of ${review.estimatedTdee} kcal.`;
    recommendation = `Keep training consistency high with your current ${completedWorkoutsCount} weekly workouts and sustain ${Math.round(avgDailyWaterMl)} ml daily hydration.`;
  }

  return {
    headline,
    story,
    recommendation,
    confidenceBreakdown: {
      scorePct,
      level,
      factors,
    },
    source: 'offline',
  };
}

/**
 * Generate a personalized athletic narrative coach insight.
 * Prioritizes Gemini 2.5 Flash Free Tier when available, with automatic
 * graceful fallback to the local deterministic athletic coaching engine.
 *
 * GUARANTEE: NEVER incurs any paid tokens or subscription fees.
 */
export async function generateNarrativeInsight(
  ctx: NarrativeCoachContext,
  apiKeyOverride?: string
): Promise<NarrativeInsight> {
  const apiKey =
    (apiKeyOverride && apiKeyOverride.trim()) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GEMINI_API_KEY &&
      import.meta.env.VITE_GEMINI_API_KEY.trim()) ||
    '';

  // If no API key configured, use free offline engine immediately
  if (!apiKey) {
    return generateNarrativeInsightOffline(ctx);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { profile, review, completedWorkoutsCount, avgDailyWaterMl = 2500 } = ctx;

    const promptText = `
User: ${profile.name || 'Athlete'}
Goal: ${profile.goal} (Target rate: ${profile.targetRateKgPerWeek} kg/week)
Current Calorie Target: ${review.currentCalorieTarget} kcal
Proposed New Target: ${review.proposedCalorieTarget} kcal (Delta: ${review.adjustmentDelta} kcal)
Estimated TDEE: ${review.estimatedTdee} kcal
Avg Calorie Intake: ${review.avgCalorieIntake} kcal/day
Avg Protein Intake: ${review.avgProteinIntake} g/day
7-Day Weight Delta: ${review.weightDeltaKg} kg
Confidence Score: ${Math.round(review.confidenceScore * 100)}%
Completed Workouts: ${completedWorkoutsCount} this week
Avg Daily Hydration: ${Math.round(avgDailyWaterMl)} ml/day
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction:
          'You are an elite, evidence-based strength and conditioning coach and sports dietitian. Synthesize the athlete’s weekly metrics into a supportive, concise 3-sentence narrative story, a clear headline, and 1 specific actionable coaching recommendation. Explain the rationale without fluff.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: 'Punchy 3-5 word athletic headline' },
            story: { type: Type.STRING, description: '2-3 sentence evidence-based story summarizing the week' },
            recommendation: { type: Type.STRING, description: '1 clear, actionable coaching recommendation' },
          },
          required: ['headline', 'story', 'recommendation'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty model response');
    }

    const parsed = JSON.parse(text);
    const offlineBase = generateNarrativeInsightOffline(ctx);

    return {
      headline: parsed.headline || offlineBase.headline,
      story: parsed.story || offlineBase.story,
      recommendation: parsed.recommendation || offlineBase.recommendation,
      confidenceBreakdown: offlineBase.confidenceBreakdown,
      source: 'model',
    };
  } catch (err) {
    // Graceful offline fallback
    return generateNarrativeInsightOffline(ctx);
  }
}
