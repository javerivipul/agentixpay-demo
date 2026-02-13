/**
 * Convert cents to dollars.
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format cents as a display string (e.g., "$89.99").
 */
export function formatMoney(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

/**
 * Calculate line total from price and quantity (both in cents).
 */
export function calculateLineTotal(priceCents: number, quantity: number): number {
  return priceCents * quantity;
}
