'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAdminAuth: (admin: AdminUser, accessToken: string, refreshToken: string) => void;
  setAdminTokens: (accessToken: string, refreshToken: string) => void;
  setAdminUser: (admin: AdminUser) => void;
  logoutAdmin: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAdminAuth: (admin, accessToken, refreshToken) =>
        set({
          admin,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setAdminTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setAdminUser: (admin) => set({ admin }),

      logoutAdmin: () =>
        set({
          admin: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: STORAGE_KEYS.ADMIN_AUTH_STORE,
      partialize: (state) => ({
        admin: state.admin,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
