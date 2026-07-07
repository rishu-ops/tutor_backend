'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const logoutStore = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      // Always clear auth store locally regardless of network request success
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#dadee2] bg-white h-16 shrink-0">
        <div className="mx-auto max-w-[1440px] px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#00A453] font-bold text-xl tracking-tight">
              project<span className="font-extrabold text-[#00060c]">tutor</span>
            </span>
            <span className="bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/25 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">
              {user?.role}
            </span>
          </Link>

          {/* Right Section: Avatar & Logout Button */}
          <div className="flex items-center gap-4">
            {/* User details */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-[#00060c]">{user?.name}</span>
              <span className="text-[10px] text-[#647380] tracking-wider uppercase font-semibold">
                {user?.role}
              </span>
            </div>

            {/* Avatar initials */}
            <div className="h-9 w-9 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center select-none">
              <span className="text-sm font-bold text-[#00A453]">{getInitials()}</span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-[#dadee2]" />

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-[#647380] hover:text-[#DC2626] h-9 px-3 rounded-[8px] flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-[#dadee2] bg-white shrink-0 hidden md:block py-6 px-4">
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-[#00060c] bg-[#e6f6ee]/40 border-l-2 border-[#00A453] rounded-r-[8px]"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00A453]" />
              Dashboard
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#647380] hover:text-[#00060c] hover:bg-[#f3f4f6] rounded-[8px] transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Classes
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#647380] hover:text-[#00060c] hover:bg-[#f3f4f6] rounded-[8px] transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#647380] hover:text-[#00060c] hover:bg-[#f3f4f6] rounded-[8px] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>
        </aside>

        {/* Content body */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
