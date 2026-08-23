import { Response } from 'express';
import config from '../../config/index.js';

// Matches config.jwt.refreshTokenExpiry ('7d').
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshCookie(res: Response, cookieName: string, token: string): void {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response, cookieName: string): void {
  res.clearCookie(cookieName, { path: '/api' });
}
