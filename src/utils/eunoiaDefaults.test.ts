import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultStarterHabits,
  defaultStarterFrictionInterventions,
  defaultStarterGoals,
  defaultStarterProjects,
  defaultStarterTasks,
} from './eunoiaDefaults';

describe('eunoiaDefaults - System Verification', () => {
  it('supplies properly structured foundational habits', () => {
    assert.ok(defaultStarterHabits.length >= 3);
    for (const habit of defaultStarterHabits) {
      assert.ok(habit.id);
      assert.ok(habit.title);
      assert.ok(habit.purpose);
      assert.ok(habit.triggerCue);
      assert.ok(habit.minimumViableAction);
      assert.ok(Array.isArray(habit.completedDates));
    }
  });

  it('supplies friction interventions across behavioral categories', () => {
    assert.ok(defaultStarterFrictionInterventions.length >= 2);
    const categories = new Set(defaultStarterFrictionInterventions.map((f) => f.category));
    assert.ok(categories.has('physical'));
    for (const f of defaultStarterFrictionInterventions) {
      assert.ok(f.targetBehavior);
      assert.ok(f.mechanism);
      assert.ok(f.implementationSteps.length > 0);
    }
  });

  it('maintains relational connections between areas, goals, and projects', () => {
    assert.ok(defaultStarterGoals.length > 0);
    assert.ok(defaultStarterProjects.length > 0);
    const vitalityGoal = defaultStarterGoals.find((g) => g.id === 'goal-vitality');
    assert.ok(vitalityGoal);

    const relatedProject = defaultStarterProjects.find((p) => p.goalId === vitalityGoal.id);
    assert.ok(relatedProject);
    assert.equal(relatedProject.area, vitalityGoal.area);
  });
});
