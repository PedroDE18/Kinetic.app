import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateNarrativeInsightOffline,
  generateNarrativeInsight,
} from './narrativeCoach';
import { initialProfile } from '../utils/mockData';
import { WeeklyReviewRecord } from '../types';

const sampleReview: WeeklyReviewRecord = {
  id: 'rev-test-1',
  weekEndDate: '2026-11-02',
  avgCalorieIntake: 2100,
  avgProteinIntake: 170,
  avgWeightTrendKg: 82.5,
  weightDeltaKg: -0.35,
  estimatedTdee: 2450,
  currentCalorieTarget: 2150,
  proposedCalorieTarget: 2150,
  adjustmentDelta: 0,
  confidenceScore: 0.85,
  reason: 'Optimal fat loss pace maintained with strong logging adherence.',
  status: 'pending',
};

test('generateNarrativeInsightOffline produces grounded narrative and confidence factors for fat loss', () => {
  const result = generateNarrativeInsightOffline({
    profile: initialProfile,
    review: sampleReview,
    completedWorkoutsCount: 4,
    avgDailyWaterMl: 2800,
  });

  assert.ok(result.headline.length > 5);
  assert.ok(result.story.length > 20);
  assert.ok(result.recommendation.length > 10);
  assert.equal(result.source, 'offline');
  assert.equal(result.confidenceBreakdown.level, 'High');
  assert.ok(result.confidenceBreakdown.factors.length >= 2);
  assert.equal(result.confidenceBreakdown.scorePct, 85);
});

test('generateNarrativeInsightOffline handles muscle gain goal properly', () => {
  const muscleGainReview: WeeklyReviewRecord = {
    ...sampleReview,
    weightDeltaKg: 0.25,
  };

  const result = generateNarrativeInsightOffline({
    profile: {
      ...initialProfile,
      goal: 'muscle_gain',
      targetRateKgPerWeek: 0.2,
    },
    review: muscleGainReview,
    completedWorkoutsCount: 5,
  });

  assert.ok(result.story.includes('gain') || result.headline.includes('Hypertrophy'));
  assert.ok(result.recommendation.length > 0);
});

test('generateNarrativeInsight returns offline result cleanly when no API key provided', async () => {
  const result = await generateNarrativeInsight(
    {
      profile: initialProfile,
      review: sampleReview,
      completedWorkoutsCount: 3,
    },
    '' // no API key
  );

  assert.equal(result.source, 'offline');
  assert.ok(result.headline.length > 0);
  assert.ok(result.confidenceBreakdown.factors.length > 0);
});
