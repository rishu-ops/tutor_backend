'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const logout = useAuthStore((s) => s.logout);

  const [mounted, setMounted] = useState(false);
  const [refreshChecked, setRefreshChecked] = useState(false);
  const refreshAttempted = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // A hard page reload clears the in-memory access token — it's deliberately
  // never persisted to localStorage (see auth-store.ts). Before treating this
  // as a real logout, try to silently redeem a fresh one from the httpOnly
  // refresh cookie the server set at login/verify.
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || accessToken || refreshAttempted.current) {
      setRefreshChecked(true);
      return;
    }
    refreshAttempted.current = true;
    authApi
      .refreshToken()
      .then((res) => {
        if (res.success && res.data?.accessToken && res.data?.refreshToken) {
          setTokens(res.data.accessToken, res.data.refreshToken);
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setRefreshChecked(true));
  }, [mounted, isAuthenticated, accessToken, setTokens, logout]);

  useEffect(() => {
    if (!mounted || !refreshChecked) return;

    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isDashboardRoute = pathname.startsWith('/dashboard');
    const isProfileRoute = pathname.startsWith('/profile');

    if (!isAuthenticated) {
      // Unauthenticated users can only access public routes (like landing page or auth screens)
      if (isOnboardingRoute || isDashboardRoute || isProfileRoute) {
        router.replace(ROUTES.AUTH_LOGIN);
      }
    } else {
      // Authenticated users
      const hasRole = user && user.role !== null;

      if (pathname === '/') {
        // Redirection away from landing page
        if (hasRole) {
          router.replace(ROUTES.DASHBOARD);
        } else {
          router.replace(ROUTES.ONBOARDING);
        }
      } else if (isAuthRoute) {
        // Prevent logged-in users from viewing auth screens
        if (hasRole) {
          router.replace(ROUTES.DASHBOARD);
        } else {
          router.replace(ROUTES.ONBOARDING);
        }
      } else if (isOnboardingRoute) {
        // Prevent already-onboarded users from doing onboarding again
        if (hasRole) {
          router.replace(ROUTES.DASHBOARD);
        }
      } else if (isDashboardRoute || isProfileRoute) {
        // Prevent new users without a profile from viewing the dashboard or profile
        if (!hasRole) {
          router.replace(ROUTES.ONBOARDING);
        }
      }
    }
  }, [mounted, refreshChecked, isAuthenticated, user, pathname, router]);

  // Prevent flash of content during initial SSR / hydration, and while a
  // silent token refresh (see above) is still deciding the real auth state.
  if (!mounted || !refreshChecked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#00A453] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Define route constraints to prevent rendering unauthorized layout states before redirect fires
  const isAuthRoute = pathname.startsWith('/auth');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isProfileRoute = pathname.startsWith('/profile');

  if (!isAuthenticated && (isOnboardingRoute || isDashboardRoute || isProfileRoute)) {
    return null;
  }

  if (isAuthenticated) {
    const hasRole = user && user.role !== null;
    if (isAuthRoute) return null;
    if (isOnboardingRoute && hasRole) return null;
    if ((isDashboardRoute || isProfileRoute) && !hasRole) return null;
    if (pathname === '/') return null;
  }

  return <>{children}</>;
}
