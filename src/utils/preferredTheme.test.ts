import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreferredTheme } from './engine';

test('getPreferredTheme returns dark by default in node', () => {
  assert.equal(getPreferredTheme(), 'dark');
});

import { getWeekDates, getLocalDateString } from './engine';

test('getWeekDates returns Monday-first 7 local dates', () => {
  // 2026-10-29 is a Thursday
  const week = getWeekDates(new Date(2026, 9, 29));
  assert.equal(week.length, 7);
  assert.equal(week[0], '2026-10-26'); // Monday
  assert.equal(week[6], '2026-11-01'); // Sunday
  assert.equal(week.includes(getLocalDateString(new Date(2026, 9, 29))), true);
});
