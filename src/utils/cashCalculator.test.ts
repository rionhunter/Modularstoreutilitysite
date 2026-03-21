import { describe, it, expect } from 'vitest';
import {
  DENOMINATIONS,
  calculateFloatBreakdown,
  calculateCashTotal,
} from '../utils/cashCalculator';

describe('DENOMINATIONS', () => {
  it('contains all standard denominations in descending order', () => {
    expect(DENOMINATIONS).toEqual([100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05]);
  });
});

describe('calculateFloatBreakdown', () => {
  it('returns null for zero float', () => {
    expect(calculateFloatBreakdown(0)).toBeNull();
  });

  it('returns null for negative float', () => {
    expect(calculateFloatBreakdown(-10)).toBeNull();
  });

  it('produces a breakdown that sums to the exact float amount', () => {
    const float = 150;
    const breakdown = calculateFloatBreakdown(float);
    expect(breakdown).not.toBeNull();

    const total = Object.entries(breakdown!).reduce(
      (sum, [denom, count]) => sum + parseFloat(denom) * count,
      0
    );
    expect(Math.round(total * 100) / 100).toBe(float);
  });

  it('produces a valid breakdown for a typical float (200)', () => {
    const breakdown = calculateFloatBreakdown(200);
    expect(breakdown).not.toBeNull();
    const total = Object.entries(breakdown!).reduce(
      (sum, [denom, count]) => sum + parseFloat(denom) * count,
      0
    );
    expect(Math.round(total * 100) / 100).toBe(200);
  });

  it('handles a small float amount (e.g. $1.50)', () => {
    const breakdown = calculateFloatBreakdown(1.5);
    expect(breakdown).not.toBeNull();
    const total = Object.entries(breakdown!).reduce(
      (sum, [denom, count]) => sum + parseFloat(denom) * count,
      0
    );
    expect(Math.round(total * 100) / 100).toBe(1.5);
  });

  it('handles a float that needs small denominations (e.g. $0.15)', () => {
    const breakdown = calculateFloatBreakdown(0.15);
    expect(breakdown).not.toBeNull();
    const total = Object.entries(breakdown!).reduce(
      (sum, [denom, count]) => sum + parseFloat(denom) * count,
      0
    );
    expect(Math.round(total * 100) / 100).toBe(0.15);
  });

  it('all counts in breakdown are positive integers', () => {
    const breakdown = calculateFloatBreakdown(50);
    expect(breakdown).not.toBeNull();
    for (const count of Object.values(breakdown!)) {
      expect(count).toBeGreaterThan(0);
      expect(Number.isInteger(count)).toBe(true);
    }
  });

  it('all denomination keys are from the supported DENOMINATIONS list', () => {
    const breakdown = calculateFloatBreakdown(100);
    expect(breakdown).not.toBeNull();
    for (const denom of Object.keys(breakdown!)) {
      expect(DENOMINATIONS).toContain(parseFloat(denom));
    }
  });
});

describe('calculateCashTotal', () => {
  it('returns 0 for empty entries', () => {
    expect(calculateCashTotal({})).toBe(0);
  });

  it('returns 0 when all counts are 0', () => {
    const entries = Object.fromEntries(DENOMINATIONS.map(d => [d, 0]));
    expect(calculateCashTotal(entries)).toBe(0);
  });

  it('correctly calculates total for a single denomination', () => {
    // 3 × $50 = $150
    expect(calculateCashTotal({ 50: 3 })).toBe(150);
  });

  it('correctly calculates total for multiple denominations', () => {
    // 1 × $100 + 2 × $20 + 3 × $5 = $100 + $40 + $15 = $155
    expect(calculateCashTotal({ 100: 1, 20: 2, 5: 3 })).toBe(155);
  });

  it('correctly handles coin denominations', () => {
    // 4 × $0.50 + 3 × $0.20 + 2 × $0.10 = $2.00 + $0.60 + $0.20 = $2.80
    const result = calculateCashTotal({ 0.5: 4, 0.2: 3, 0.1: 2 });
    expect(Math.round(result * 100) / 100).toBe(2.8);
  });

  it('ignores unknown denominations not in the DENOMINATIONS list', () => {
    // Only known denominations are iterated
    expect(calculateCashTotal({ 100: 1, 999: 100 })).toBe(100);
  });
});
