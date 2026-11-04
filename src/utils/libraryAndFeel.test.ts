import test from 'node:test';
import assert from 'node:assert/strict';
import { mockFoodLibrary, mockExercises } from './mockData';
import { HOW_WE_FEEL_QUADRANTS } from '../components/mind/AffectiveWeatherSelector';

test('Food Library Aliases & Search Matching', () => {
  // Test "ovos" alias matches Eggs
  const queryOvos = 'ovos';
  const matchedEgg = mockFoodLibrary.filter(
    (f) =>
      f.name.toLowerCase().includes(queryOvos) ||
      (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(queryOvos)))
  );
  assert.ok(matchedEgg.length > 0, 'Searching "ovos" should find egg items');
  assert.ok(
    matchedEgg.some((f) => f.name.toLowerCase().includes('egg')),
    'Should match an egg item'
  );

  // Test "arroz" alias matches Rice
  const queryArroz = 'arroz';
  const matchedRice = mockFoodLibrary.filter(
    (f) =>
      f.name.toLowerCase().includes(queryArroz) ||
      (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(queryArroz)))
  );
  assert.ok(matchedRice.length > 0, 'Searching "arroz" should find rice items');

  // Test "frango" alias matches Chicken Breast
  const queryFrango = 'frango';
  const matchedChicken = mockFoodLibrary.filter(
    (f) =>
      f.name.toLowerCase().includes(queryFrango) ||
      (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(queryFrango)))
  );
  assert.ok(matchedChicken.length > 0, 'Searching "frango" should find chicken items');

  // Test "caseina" alias matches Micellar Casein
  const queryCasein = 'caseina';
  const matchedCasein = mockFoodLibrary.filter(
    (f) =>
      f.name.toLowerCase().includes(queryCasein) ||
      (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(queryCasein)))
  );
  assert.ok(matchedCasein.length > 0, 'Searching "caseina" should find casein items');
});

test('Exercise Atlas: Machine and Cable Exercises Coverage', () => {
  const machineExercises = mockExercises.filter((e) => e.equipment === 'Machine');
  const cableExercises = mockExercises.filter((e) => e.equipment === 'Cable');

  assert.ok(machineExercises.length >= 25, `Expected at least 25 machine exercises, found ${machineExercises.length}`);
  assert.ok(cableExercises.length >= 10, `Expected at least 10 cable exercises, found ${cableExercises.length}`);

  // Check specific essential machines
  const names = mockExercises.map((e) => e.name);
  assert.ok(names.some((n) => n.includes('Leg Press')), 'Contains Leg Press');
  assert.ok(names.some((n) => n.includes('Hack Squat')), 'Contains Hack Squat');
  assert.ok(names.some((n) => n.includes('Chest Press Machine')), 'Contains Chest Press Machine');
  assert.ok(names.some((n) => n.includes('Pec Deck')), 'Contains Pec Deck');
  assert.ok(names.some((n) => n.includes('Seated Cable Row')), 'Contains Seated Cable Row');
  assert.ok(names.some((n) => n.includes('Preacher Curl Machine')), 'Contains Preacher Curl Machine');
});

test('How We Feel 4-Quadrant Emotional Weather Model', () => {
  assert.strictEqual(HOW_WE_FEEL_QUADRANTS.length, 4, 'Must have exactly 4 quadrants');

  const yellow = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === 'radiant');
  assert.ok(yellow, 'Yellow/Radiant quadrant exists');
  assert.ok(yellow.emotions.some((e) => e.id === 'joyful' || e.id === 'energized'));

  const green = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === 'clear');
  assert.ok(green, 'Green/Clear quadrant exists');
  assert.ok(green.emotions.some((e) => e.id === 'calm' || e.id === 'peaceful'));

  const red = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === 'turbulent');
  assert.ok(red, 'Red/Turbulent quadrant exists');
  assert.ok(red.emotions.some((e) => e.id === 'anxious' || e.id === 'stressed'));

  const blue = HOW_WE_FEEL_QUADRANTS.find((q) => q.id === 'overcast');
  assert.ok(blue, 'Blue/Overcast quadrant exists');
  assert.ok(blue.emotions.some((e) => e.id === 'fatigued' || e.id === 'burned_out'));
});
