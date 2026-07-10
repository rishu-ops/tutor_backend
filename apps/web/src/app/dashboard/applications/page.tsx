'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout';
import { useAuthStore } from '@/stores/auth-store';
import { applicationApi } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function MyApplicationsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApplications() {
      if (!token) return;
      try {
        setLoading(true);
        setError('');
        const res = await applicationApi.getMyApplications(token);
        if (res.success && res.data) {
          setApplications(res.data);
        } else {
          setError(res.error || res.message || 'Failed to fetch applications.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while loading your applications.');
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Rejected
          </span>
        );
      case 'VIEWED':
        return (
          <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Viewed
          </span>
        );
      case 'SHORTLISTED':
        return (
          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Shortlisted
          </span>
        );
      case 'SENT':
      default:
        return (
          <span className="bg-gray-50 text-[#647380] border border-gray-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Sent
          </span>
        );
    }
  };

  const renderTimeline = (status: string) => {
    const steps = ['SENT', 'VIEWED', 'ACCEPTED'];
    const activeIndex = steps.indexOf(status === 'REJECTED' ? 'VIEWED' : status);

    return (
      <div className="flex items-center gap-1.5 py-1 text-[10px] font-bold tracking-wide uppercase select-none">
        <span className={activeIndex >= 0 ? 'text-[#00A453]' : 'text-gray-300'}>Sent</span>
        <span className="text-gray-300">→</span>
        <span className={activeIndex >= 1 ? 'text-[#00A453]' : 'text-gray-300'}>Viewed</span>
        <span className="text-gray-300">→</span>
        {status === 'REJECTED' ? (
          <span className="text-red-500">Rejected</span>
        ) : (
          <span className={activeIndex >= 2 ? 'text-[#00A453]' : 'text-gray-300'}>Accepted</span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 text-[#2d2d2d]">
        <div className="flex items-center justify-between border-b border-[#dadee2] pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">My Proposals</h1>
            <p className="text-xs text-[#647380] mt-1 font-medium">
              Track the statuses of your learning proposals and tutoring contracts
            </p>
          </div>
          <Link href="/dashboard/requirements/browse">
            <Button
              size="sm"
              className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-lg"
            >
              Browse More Work
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#eef1f4] rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-8 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold">
            ⚠️ {error}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-[#dadee2] rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">
              📝
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold">No submitted proposals found</h3>
              <p className="text-xs text-[#647380] max-w-sm mx-auto leading-relaxed">
                You haven't submitted any tutor proposals to student requirements yet. Check
                recommendations to apply.
              </p>
              <div className="pt-3">
                <Link href="/dashboard/requirements/browse">
                  <Button className="bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white border border-[#eef1f4] rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-gray-200 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#2d2d2d]">
                        {app.requirement?.subject || 'Tutor Application'}
                      </h3>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#647380] font-semibold">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Proposed: ₹{app.proposedFee}/Hr
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Timings: {app.availableTimings}
                      </span>
                      {app.freeDemo && <span className="text-[#00A453]">✓ Offering Free Demo</span>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    {renderTimeline(app.status)}
                    <span className="text-[10px] text-[#b0b8c1] font-semibold block">
                      Submitted on {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                    Your Pitch Message
                  </span>
                  <p className="text-xs text-[#384148] leading-relaxed whitespace-pre-line">
                    {app.message}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <span className="text-xs text-[#647380] font-semibold">
                    Requirement Status:{' '}
                    <strong className="capitalize text-[#2d2d2d]">
                      {app.requirement?.status?.toLowerCase()}
                    </strong>
                  </span>
                  <Link href={`/dashboard/requirements/${app.requirementId}`}>
                    <button className="text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors flex items-center gap-1">
                      View Original Post <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
