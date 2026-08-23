import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './hash.js';

describe('hashPassword / comparePassword', () => {
  it('round-trips a correct password', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(comparePassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(comparePassword('wrong-password', hash)).toBe(false);
  });

  it('produces a different hash each time for the same password', () => {
    // A per-password random salt means two hashes of the same input must differ.
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    expect(a).not.toBe(b);
    expect(comparePassword('same-password', a)).toBe(true);
    expect(comparePassword('same-password', b)).toBe(true);
  });

  it('stores the salt alongside the hash', () => {
    const hash = hashPassword('whatever');
    expect(hash).toContain(':');
    const [salt, derived] = hash.split(':');
    expect(salt.length).toBeGreaterThan(0);
    expect(derived.length).toBeGreaterThan(0);
  });

  it('rejects the old unsalted hash format instead of silently accepting it', () => {
    // Pre-fix hashes were a bare 128-char hex digest with no salt separator.
    const oldFormatHash = 'a'.repeat(128);
    expect(comparePassword('anything', oldFormatHash)).toBe(false);
  });

  it('rejects empty or malformed stored hashes', () => {
    expect(comparePassword('anything', '')).toBe(false);
    expect(comparePassword('anything', ':')).toBe(false);
  });
});
