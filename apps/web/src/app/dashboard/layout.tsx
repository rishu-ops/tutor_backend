'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';
import { registerAuthErrorHandler, unregisterAuthErrorHandler } from '@/lib/auth-error-handler';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const logoutStore = useAuthStore((s) => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      logoutStore();
      router.push(ROUTES.HOME);
    }
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-logout when the API returns "Invalid or expired access token"
  useEffect(() => {
    registerAuthErrorHandler(() => {
      logoutStore();
      router.push(ROUTES.HOME);
    });
    return () => unregisterAuthErrorHandler();
  }, [logoutStore, router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-[#dadee2] bg-white h-16 shrink-0">
        <div className="mx-auto max-w-[1440px] px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-7 w-7" />
            <span className="text-[#00A453] font-bold text-xl tracking-tight">
              FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
            </span>
          </Link>

          {/* Top navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-8 flex-1 ml-10">
              <Link
                href="/dashboard"
                className={`text-sm font-semibold transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-[#00A453]'
                    : 'text-[#647380] hover:text-[#2d2d2d]'
                }`}
              >
                Home
              </Link>
              {user.role === 'STUDENT' && (
                <Link
                  href="/dashboard/requirements"
                  className={`text-sm font-semibold transition-colors ${
                    pathname.startsWith('/dashboard/requirements') && !pathname.includes('/browse')
                      ? 'text-[#00A453]'
                      : 'text-[#647380] hover:text-[#2d2d2d]'
                  }`}
                >
                  My Requirements
                </Link>
              )}
              {user.role === 'TUTOR' && (
                <Link
                  href="/dashboard/requirements/browse"
                  className={`text-sm font-semibold transition-colors ${
                    pathname.includes('/browse') ||
                    (pathname.startsWith('/dashboard/requirements/') &&
                      !pathname.includes('/create') &&
                      !pathname.includes('/edit') &&
                      !pathname.endsWith('/requirements'))
                      ? 'text-[#00A453]'
                      : 'text-[#647380] hover:text-[#2d2d2d]'
                  }`}
                >
                  Browse Requirements
                </Link>
              )}
            </nav>
          )}

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="h-9 w-9 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center select-none">
                <span className="text-sm font-bold text-[#00A453]">{getInitials()}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#647380] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white border border-[#dadee2]  shadow-md py-2 z-50">
                {/* User identity */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#dadee2]">
                  <div className="h-9 w-9 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#00A453]">{getInitials()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2d2d2d] truncate">{user?.name}</p>
                    <p className="text-xs text-[#647380] capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                </div>

                {/* Personal */}
                <div className="pt-2">
                  <p className="text-sm text-[#647380] px-4 py-1 font-medium">Personal</p>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block w-full text-left px-4 py-2.5 text-md text-[#2d2d2d] hover:bg-gray-50 transition-colors"
                  >
                    Edit profile
                  </Link>
                  <button className="block w-full text-left px-4 py-2.5 text-md text-[#2d2d2d] hover:bg-gray-50 transition-colors">
                    Settings
                  </button>
                  <button className="block w-full text-left px-4 py-2.5 text-md text-[#2d2d2d] hover:bg-gray-50 transition-colors">
                    Notifications
                  </button>
                </div>

                {/* Support */}
                <div className="pt-2 border-t border-[#dadee2] mt-1">
                  <p className="text-sm text-[#647380] px-4 py-1 font-medium">Support</p>
                  <button className="block w-full text-left px-4 py-2.5 text-md text-[#2d2d2d] hover:bg-gray-50 transition-colors">
                    Help
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-md text-[#2d2d2d] hover:bg-gray-50 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
