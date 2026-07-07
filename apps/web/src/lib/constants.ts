export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const ROUTES = {
  HOME: '/',
  AUTH_LOGIN: '/auth/login',
  AUTH_VERIFY: '/auth/verify',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
} as const;

export const STORAGE_KEYS = {
  AUTH_STORE: 'project-tutor-auth',
} as const;
