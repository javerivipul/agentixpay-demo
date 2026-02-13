import { describe, it, expect } from 'vitest';
import { minutesFromNow, isExpired, toISO } from '../src/utils/date';

describe('date utils', () => {
  it('minutesFromNow returns a future date', () => {
    const future = minutesFromNow(30);
    expect(future.getTime()).toBeGreaterThan(Date.now());
    // Should be roughly 30 minutes from now (within 2 seconds tolerance)
    const diff = future.getTime() - Date.now();
    expect(diff).toBeGreaterThan(29 * 60 * 1000);
    expect(diff).toBeLessThan(31 * 60 * 1000);
  });

  it('isExpired returns false for future dates', () => {
    const future = minutesFromNow(10);
    expect(isExpired(future)).toBe(false);
  });

  it('isExpired returns true for past dates', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isExpired(past)).toBe(true);
  });

  it('toISO returns ISO 8601 string', () => {
    const date = new Date('2026-01-15T12:00:00Z');
    expect(toISO(date)).toBe('2026-01-15T12:00:00.000Z');
  });
});
