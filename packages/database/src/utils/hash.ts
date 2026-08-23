import crypto from 'node:crypto';

// OWASP-recommended minimum for PBKDF2-HMAC-SHA512.
const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${derived}`;
}

export function comparePassword(password: string, storedHash: string): boolean {
  const [salt, derivedHex] = storedHash.split(':');
  if (!salt || !derivedHex) {
    // Pre-fix hashes had no per-user salt at all (a single hardcoded salt for
    // every account) — those are no longer considered valid; the account
    // needs its password reset rather than silently accepted here.
    return false;
  }

  const candidate = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  const stored = Buffer.from(derivedHex, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}
