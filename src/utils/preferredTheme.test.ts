import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreferredTheme } from './engine';

test('getPreferredTheme returns dark by default in node', () => {
  assert.equal(getPreferredTheme(), 'dark');
});
