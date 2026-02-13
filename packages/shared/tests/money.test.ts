import { describe, it, expect } from 'vitest';
import { centsToDollars, dollarsToCents, formatMoney, calculateLineTotal } from '../src/utils/money';

describe('money utils', () => {
  it('converts cents to dollars', () => {
    expect(centsToDollars(8999)).toBe(89.99);
    expect(centsToDollars(0)).toBe(0);
    expect(centsToDollars(100)).toBe(1);
  });

  it('converts dollars to cents', () => {
    expect(dollarsToCents(89.99)).toBe(8999);
    expect(dollarsToCents(0)).toBe(0);
    expect(dollarsToCents(1)).toBe(100);
  });

  it('handles floating point correctly', () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30); // rounds properly
  });

  it('formats money as currency string', () => {
    expect(formatMoney(8999)).toBe('$89.99');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(100)).toBe('$1.00');
    expect(formatMoney(1050)).toBe('$10.50');
  });

  it('calculates line totals', () => {
    expect(calculateLineTotal(8999, 1)).toBe(8999);
    expect(calculateLineTotal(8999, 2)).toBe(17998);
    expect(calculateLineTotal(2999, 3)).toBe(8997);
  });
});
