'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import {
  Users,
  GraduationCap,
  FileText,
  AlertTriangle,
  DollarSign,
  Briefcase,
  Layers,
  Terminal,
} from 'lucide-react';

interface Analytics {
  totalUsers: number;
  students: number;
  tutors: number;
  activeTutors: number;
  pendingVerifications: number;
  requirements: number;
  applications: number;
  reports: number;
  bookings: number;
  revenue: number;
}

interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  module: string;
  createdAt: string;
}

export default function AdminOverviewPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [overviewRes, logsRes] = await Promise.all([
          adminApi.getOverview(token),
          adminApi.getAuditLogs(token),
        ]);

        if (overviewRes.success) setAnalytics(overviewRes.data);
        if (logsRes.success) setLogs(logsRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to sync dashboard telemetry.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-500/10 rounded-xl text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Total Users',
      value: analytics?.totalUsers || 0,
      sub: `${analytics?.students} Students | ${analytics?.tutors} Tutors`,
      icon: Users,
      color: 'from-[#3B82F6]',
    },
    {
      label: 'Verified Tutors',
      value: analytics?.activeTutors || 0,
      sub: `${analytics?.pendingVerifications} Pending Validation`,
      icon: GraduationCap,
      color: 'from-[#10B981]',
    },
    {
      label: 'Requirements Feed',
      value: analytics?.requirements || 0,
      sub: `${analytics?.applications} Applications Posted`,
      icon: FileText,
      color: 'from-[#F59E0B]',
    },
    {
      label: 'Mock Revenue',
      value: `₹${(analytics?.revenue || 0).toLocaleString()}`,
      sub: `${analytics?.bookings} Total Bookings`,
      icon: DollarSign,
      color: 'from-[#EC4899]',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-6 shadow-md transition-all group"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.color} to-transparent opacity-[0.03] group-hover:opacity-[0.06] rounded-full blur-xl transition-opacity`}
              />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <h3 className="text-2xl font-bold text-white tracking-tight mt-1">
                    {card.value}
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-slate-300">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-2">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live System Logging Registry */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Operational Audit Stream
            </h3>
            <p className="text-xs text-slate-400">
              Live feed of administrative actions and configurations changes
            </p>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg bg-black/45 overflow-hidden">
          <div className="h-[280px] p-4 font-mono text-xs overflow-y-auto space-y-3.5 scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">
                No operational logs recorded on the server registry.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 leading-normal hover:bg-white/[0.01] p-1 rounded transition-colors"
                >
                  <span className="text-slate-500 shrink-0 select-none">
                    [{new Date(log.createdAt).toLocaleTimeString()}]
                  </span>
                  <span className="text-[#10B981] font-semibold shrink-0">
                    {log.module.padEnd(22).substring(0, 22)}
                  </span>
                  <div className="flex-1 text-slate-300">
                    <span className="text-white font-medium">{log.adminName}</span>
                    <span className="text-slate-400"> &raquo; {log.action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
