import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNumericInput, numericInputError } from './parseNutrition';

const SERVING_OPTS = { min: 0.1, max: 20 };
const CALORIE_OPTS = { min: 0, max: 10000 };

test('accepts plain, decimal, and signed-free whole numbers', () => {
  assert.equal(parseNumericInput('2', SERVING_OPTS).value, 2);
  assert.equal(parseNumericInput('0.5', SERVING_OPTS).value, 0.5);
  assert.equal(parseNumericInput(' 3 ', SERVING_OPTS).value, 3);
});

test('accepts Brazilian decimal commas', () => {
  assert.equal(parseNumericInput('1,5', SERVING_OPTS).value, 1.5);
  assert.equal(parseNumericInput('0,75', SERVING_OPTS).value, 0.75);
  assert.equal(parseNumericInput('2,5', SERVING_OPTS).value, 2.5);
});

test('mixed separators: the last separator is the decimal point', () => {
  const mixedComma = parseNumericInput('1.000,5', { min: 0, max: 5000 });
  assert.equal(mixedComma.value, 1000.5);
  const mixedDot = parseNumericInput('1,000.5', { min: 0, max: 5000 });
  assert.equal(mixedDot.value, 1000.5);
});

test('3-digit trailing group resolves by caller bounds (thousands vs decimal)', () => {
  // 2,500 kcal: thousands reading fits the calorie range.
  assert.equal(parseNumericInput('2,500', CALORIE_OPTS).value, 2500);
  // 1.125 servings: thousands reading (1125) exceeds the serving cap → decimal.
  assert.equal(parseNumericInput('1.125', SERVING_OPTS).value, 1.125);
  // 1,125 servings → decimal (1.125); thousands would breach max 20.
  assert.equal(parseNumericInput('1,125', SERVING_OPTS).value, 1.125);
  // Both readings fit → 3-digit grouping convention wins.
  assert.equal(parseNumericInput('1,250', CALORIE_OPTS).value, 1250);
});

test('rejects empty and whitespace-only input without inventing a value', () => {
  assert.equal(parseNumericInput('', SERVING_OPTS).value, undefined);
  assert.equal(parseNumericInput('', SERVING_OPTS).error, 'empty');
  assert.equal(parseNumericInput('   ', SERVING_OPTS).error, 'empty');
});

test('rejects non-numeric text and partial entries', () => {
  assert.equal(parseNumericInput('abc', SERVING_OPTS).error, 'not_numeric');
  assert.equal(parseNumericInput('2x', SERVING_OPTS).error, 'not_numeric');
  assert.equal(parseNumericInput('1.2.3', SERVING_OPTS).error, 'not_numeric');
  assert.equal(parseNumericInput('-', SERVING_OPTS).error, 'not_numeric');
  // Empty decimal tail while typing quickly never resolves to a crashy NaN.
  assert.equal(parseNumericInput(',', SERVING_OPTS).error, 'not_numeric');
  assert.equal(parseNumericInput('.', SERVING_OPTS).error, 'not_numeric');
});

test('rejects negative, zero-barred and absurd magnitudes', () => {
  assert.equal(parseNumericInput('-1', SERVING_OPTS).error, 'below_minimum');
  assert.equal(parseNumericInput('0', SERVING_OPTS).error, 'below_minimum');
  assert.equal(parseNumericInput('9999', SERVING_OPTS).error, 'above_maximum');
  // Scientific/overflow forms are not supported input in fitness fields.
  assert.equal(parseNumericInput('1e999', SERVING_OPTS).error, 'not_numeric');
  assert.equal(parseNumericInput('1e5', SERVING_OPTS).error, 'not_numeric');
  // Trailing garbage that parseFloat would swallow
  assert.equal(parseNumericInput('1,5--', SERVING_OPTS).error, 'not_numeric');
});

test('integer mode rejects fractional values with a dedicated error', () => {
  const WATER_OPTS = { min: 1, max: 10000, integer: true };
  assert.equal(parseNumericInput('250', WATER_OPTS).value, 250);
  assert.equal(parseNumericInput('250.5', WATER_OPTS).error, 'integer_required');
  assert.equal(parseNumericInput('0', WATER_OPTS).error, 'below_minimum');
  assert.equal(parseNumericInput('20000', WATER_OPTS).error, 'above_maximum');
});

test('error messages are human readable and consequence-free for valid input', () => {
  assert.equal(numericInputError(''), 'Enter a number.');
  assert.equal(numericInputError('abc', SERVING_OPTS), 'Use numbers only (e.g. 1.5 or 1,5).');
  assert.equal(numericInputError('-3', SERVING_OPTS), 'Minimum value is 0.1.');
  assert.equal(numericInputError('999', SERVING_OPTS), 'Maximum value is 20.');
  assert.equal(numericInputError('2', SERVING_OPTS), undefined);
  // Zero is a valid calorie value, though not a valid serving count.
  assert.equal(parseNumericInput('0', CALORIE_OPTS).value, 0);
});

test('unicode separators normalize sensibly', () => {
  // pt-BR thousands-space habits: "1 250 ml"
  assert.equal(parseNumericInput('1 250', { min: 0, max: 10000 }).value, 1250);
  // Arabic-Indic digits "١٢٥" -> 125
  assert.equal(parseNumericInput('١٢٥', { min: 0, max: 10000 }).value, 125);
});
