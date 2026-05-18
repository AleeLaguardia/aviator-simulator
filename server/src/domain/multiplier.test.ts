import { describe, expect, it } from 'vitest';
import { multiplierAt } from './multiplier';

describe('multiplierAt', () => {
  it('is 1.00 at t=0', () => {
    expect(multiplierAt(0)).toBe(1.0);
  });

  it('follows e^(0.06·t) within 2 decimal places', () => {
    expect(multiplierAt(10)).toBeCloseTo(Math.exp(0.6), 1);
    expect(multiplierAt(30)).toBeCloseTo(Math.exp(1.8), 1);
    expect(multiplierAt(60)).toBeCloseTo(Math.exp(3.6), 0);
  });

  it('truncates to 2 decimal places (no rounding up)', () => {
    const value = multiplierAt(7.5);
    expect(value * 100).toBe(Math.floor(value * 100));
  });

  it('is strictly increasing with time', () => {
    let prev = -Infinity;
    for (let t = 0; t <= 60; t += 0.5) {
      const cur = multiplierAt(t);
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
  });

  it('accepts a custom growth rate', () => {
    expect(multiplierAt(10, 0.1)).toBeCloseTo(Math.exp(1), 1);
  });
});
