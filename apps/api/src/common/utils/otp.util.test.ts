import { describe, it, expect } from 'vitest';
import { generateOtp } from './otp.util.js';

describe('generateOtp', () => {
  it('defaults to a 6-digit code', () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('respects a custom length', () => {
    expect(generateOtp(4)).toHaveLength(4);
    expect(generateOtp(8)).toHaveLength(8);
  });

  it('never produces a code with a leading zero (stays within [10^(n-1), 10^n))', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp(4);
      expect(otp[0]).not.toBe('0');
      expect(Number(otp)).toBeGreaterThanOrEqual(1000);
      expect(Number(otp)).toBeLessThan(10000);
    }
  });

  it('rejects a non-positive length', () => {
    expect(() => generateOtp(0)).toThrow();
    expect(() => generateOtp(-1)).toThrow();
  });

  it('produces varying codes across calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateOtp(6)));
    // Astronomically unlikely to collide 20 times in a row if randomness is working.
    expect(codes.size).toBeGreaterThan(1);
  });
});
