/**
 * Get a Date that is `minutes` in the future.
 */
export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check whether a date has passed.
 */
export function isExpired(date: Date): boolean {
  return new Date() > date;
}

/**
 * Format a Date as ISO 8601 string.
 */
export function toISO(date: Date): string {
  return date.toISOString();
}
