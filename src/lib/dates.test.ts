import { describe, expect, it } from 'vitest';
import { formatListDate, formatPostDate } from './dates';

describe('formatPostDate', () => {
  it('formats UTC dates as DD Mon YYYY', () => {
    expect(formatPostDate(new Date('2026-08-28T00:00:00.000Z'))).toBe('28 Aug 2026');
  });
});

describe('formatListDate', () => {
  it('formats UTC dates as Mon DD, YYYY', () => {
    expect(formatListDate(new Date('2026-07-05T00:00:00.000Z'))).toBe('Jul 05, 2026');
  });
});
