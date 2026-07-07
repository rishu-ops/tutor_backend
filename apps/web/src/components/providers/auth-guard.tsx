'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/constants';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (!isAuthenticated) {
      // Unauthenticated users can only access public routes (like landing page or auth screens)
      if (isOnboardingRoute || isDashboardRoute) {
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
      } else if (isDashboardRoute) {
        // Prevent new users without a profile from viewing the dashboard
        if (!hasRole) {
          router.replace(ROUTES.ONBOARDING);
        }
      }
    }
  }, [mounted, isAuthenticated, user, pathname, router]);

  // Prevent flash of content during initial SSR / hydration
  if (!mounted) {
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

  if (!isAuthenticated && (isOnboardingRoute || isDashboardRoute)) {
    return null;
  }

  if (isAuthenticated) {
    const hasRole = user && user.role !== null;
    if (isAuthRoute) return null;
    if (isOnboardingRoute && hasRole) return null;
    if (isDashboardRoute && !hasRole) return null;
    if (pathname === '/') return null;
  }

  return <>{children}</>;
}
