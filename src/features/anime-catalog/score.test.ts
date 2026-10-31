import { describe, expect, it } from 'vitest';
import { getScoreTone } from './score';

describe('getScoreTone', () => {
  it.each([
    [0, 'red'],
    [49, 'red'],
    [50, 'yellow'],
    [80, 'yellow'],
    [81, 'green'],
    [100, 'green'],
    [null, 'neutral'],
  ] as const)('maps %s to %s', (score, tone) => {
    expect(getScoreTone(score)).toBe(tone);
  });
});
