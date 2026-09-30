import { describe, expect, it } from 'vitest';
import { formatListDate, formatPostDate } from './dates';

describe('formatPostDate', () => {
  it('formats UTC dates as Month Dth, YYYY', () => {
    expect(formatPostDate(new Date('2026-09-28T00:00:00.000Z'))).toBe(
      'September 28th, 2026',
    );
  });

  it.each([
    ['2026-08-01T00:00:00.000Z', 'August 1st, 2026'],
    ['2026-08-02T00:00:00.000Z', 'August 2nd, 2026'],
    ['2026-08-03T00:00:00.000Z', 'August 3rd, 2026'],
    ['2026-08-04T00:00:00.000Z', 'August 4th, 2026'],
    ['2026-08-11T00:00:00.000Z', 'August 11th, 2026'],
    ['2026-08-12T00:00:00.000Z', 'August 12th, 2026'],
    ['2026-08-13T00:00:00.000Z', 'August 13th, 2026'],
    ['2026-08-21T00:00:00.000Z', 'August 21st, 2026'],
    ['2026-08-22T00:00:00.000Z', 'August 22nd, 2026'],
    ['2026-08-23T00:00:00.000Z', 'August 23rd, 2026'],
    ['2026-08-31T00:00:00.000Z', 'August 31st, 2026'],
  ])('uses the correct ordinal for %s', (iso, expected) => {
    expect(formatPostDate(new Date(iso))).toBe(expected);
  });
});

describe('formatListDate', () => {
  it('formats UTC dates as Month Dth, YYYY', () => {
    expect(formatListDate(new Date('2026-07-05T00:00:00.000Z'))).toBe(
      'July 5th, 2026',
    );
  });
});
