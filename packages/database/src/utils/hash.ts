import crypto from 'node:crypto';

const SALT = 'project-tutor-admin-salt-98765';

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
