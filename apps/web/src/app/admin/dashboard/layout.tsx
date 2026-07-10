'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  AlertTriangle,
  FileText,
  Settings,
  History,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Moderation', path: '/admin/dashboard/users', icon: Users },
  { label: 'Administrators', path: '/admin/dashboard/admins', icon: ShieldAlert },
  { label: 'Abuse Reports', path: '/admin/dashboard/reports', icon: AlertTriangle },
  { label: 'CMS Announcements', path: '/admin/dashboard/posts', icon: FileText },
  { label: 'Roles & Permissions', path: '/admin/dashboard/roles', icon: Settings },
  { label: 'Audit Logs', path: '/admin/dashboard/audit-logs', icon: History },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, logoutAdmin } = useAdminAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = () => {
    logoutAdmin();
    router.replace('/admin/login');
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0D18] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0A0D18] text-[#E2E8F0] font-sans">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.02),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.02),transparent_40%)] pointer-events-none" />

      {/* Sidebar Container */}
      <aside className="w-[260px] border-r border-white/5 bg-white/[0.01] backdrop-blur-md flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#3B82F6] flex items-center justify-center">
            <ShieldAlert className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-wide">Tutor Control</span>
            <span className="block text-[10px] text-[#10B981] font-semibold tracking-wider uppercase">
              Console
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#10B981]/15 to-[#3B82F6]/5 border-l-2 border-[#10B981] text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#10B981]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Admin Node Card */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-[#10B981] border border-white/10 uppercase">
              {admin?.name?.substring(0, 2) || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase truncate">
                {admin?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full h-9 border border-white/5 bg-white/[0.02] hover:bg-red-950/20 hover:border-red-500/20 text-slate-400 hover:text-red-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            {NAV_ITEMS.find((n) => n.path === pathname)?.label || 'Console Terminal'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#10B981] uppercase tracking-wider">
              Connected Server Node
            </span>
          </div>
        </header>
        <main className="flex-1 p-8 relative min-w-0">{children}</main>
      </div>
    </div>
  );
}
