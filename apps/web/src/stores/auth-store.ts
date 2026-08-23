'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';

interface User {
  id: string;
  phone: string;
  role: string | null;
  name: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  isPhoneVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE,
      // accessToken/refreshToken are deliberately excluded: they live in memory
      // only for the life of the tab. The refresh token that actually survives
      // a page reload is an httpOnly cookie the server sets, never JS-readable —
      // see auth-guard.tsx's silent refresh-on-mount, which re-derives a fresh
      // access token from that cookie instead of ever reading one from storage.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Browsers that logged in before this fix still have a real accessToken/
      // refreshToken sitting in this key from the old persisted shape. Blank
      // them out the moment we read it back, so a stale value already on disk
      // is never trusted — the silent refresh in auth-guard.tsx takes it from there.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.accessToken = null;
          state.refreshToken = null;
        }
      },
    }
  )
);
