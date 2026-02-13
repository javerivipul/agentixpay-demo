import { describe, it, expect } from 'vitest';
import { canTransition, VALID_TRANSITIONS } from '../src/types/checkout.types';

describe('checkout state machine', () => {
  it('allows CREATED → ITEMS_ADDED', () => {
    expect(canTransition('CREATED', 'ITEMS_ADDED')).toBe(true);
  });

  it('allows CREATED → CANCELLED', () => {
    expect(canTransition('CREATED', 'CANCELLED')).toBe(true);
  });

  it('allows ITEMS_ADDED → SHIPPING_SET', () => {
    expect(canTransition('ITEMS_ADDED', 'SHIPPING_SET')).toBe(true);
  });

  it('allows SHIPPING_SET → PAYMENT_PENDING', () => {
    expect(canTransition('SHIPPING_SET', 'PAYMENT_PENDING')).toBe(true);
  });

  it('allows PAYMENT_PENDING → COMPLETED', () => {
    expect(canTransition('PAYMENT_PENDING', 'COMPLETED')).toBe(true);
  });

  it('blocks CREATED → COMPLETED (skipping steps)', () => {
    expect(canTransition('CREATED', 'COMPLETED')).toBe(false);
  });

  it('blocks COMPLETED → anything (terminal state)', () => {
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canTransition('COMPLETED', 'CREATED')).toBe(false);
  });

  it('blocks CANCELLED → anything (terminal state)', () => {
    expect(canTransition('CANCELLED', 'CREATED')).toBe(false);
    expect(canTransition('CANCELLED', 'COMPLETED')).toBe(false);
  });

  it('allows re-entry to same status (update items/shipping)', () => {
    expect(canTransition('ITEMS_ADDED', 'ITEMS_ADDED')).toBe(true);
    expect(canTransition('SHIPPING_SET', 'SHIPPING_SET')).toBe(true);
  });

  it('allows FAILED → PAYMENT_PENDING (retry)', () => {
    expect(canTransition('FAILED', 'PAYMENT_PENDING')).toBe(true);
  });

  it('all statuses have transition rules', () => {
    const statuses = Object.keys(VALID_TRANSITIONS);
    expect(statuses).toContain('CREATED');
    expect(statuses).toContain('ITEMS_ADDED');
    expect(statuses).toContain('SHIPPING_SET');
    expect(statuses).toContain('PAYMENT_PENDING');
    expect(statuses).toContain('COMPLETED');
    expect(statuses).toContain('CANCELLED');
    expect(statuses).toContain('EXPIRED');
    expect(statuses).toContain('FAILED');
  });
});
