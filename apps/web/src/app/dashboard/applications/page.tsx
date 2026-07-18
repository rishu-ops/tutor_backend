'use client';

import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
} from 'lucide-react';

export default function MyApplicationsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'>(
    'ALL'
  );

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

  const filteredApps = applications.filter((app) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') {
      return app.status === 'SENT' || app.status === 'VIEWED' || app.status === 'SHORTLISTED';
    }
    return app.status === filter;
  });

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
            Not Selected
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
        <span className={activeIndex >= 1 ? 'text-[#00A453]' : 'text-gray-300'}>Seen</span>
        <span className="text-gray-300">→</span>
        {status === 'REJECTED' ? (
          <span className="text-red-500">Not Selected</span>
        ) : (
          <span className={activeIndex >= 2 ? 'text-[#00A453]' : 'text-gray-300'}>Accepted</span>
        )}
      </div>
    );
  };

  const filterPills = [
    { id: 'ALL', label: 'All Proposals', icon: ClipboardList },
    { id: 'ACTIVE', label: 'Active', icon: Clock },
    { id: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
    { id: 'REJECTED', label: 'Rejected', icon: XCircle },
    { id: 'EXPIRED', label: 'Expired', icon: AlertTriangle },
  ] as const;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6 text-[#2d2d2d]">
        <div className="flex items-center justify-between border-b border-[#dadee2] pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">My Applications</h1>
            <p className="text-sm text-[#647380] mt-1">
              Track all the tutoring jobs you&apos;ve applied for.
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

        {/* Filter Pills categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
          {filterPills.map((pill) => {
            const isActive = filter === pill.id;
            const Icon = pill.icon;
            return (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all shrink-0 select-none ${
                  isActive
                    ? 'bg-[#00060c] text-white shadow-sm'
                    : 'bg-white border border-[#dadee2] text-[#647380] hover:text-[#2d2d2d]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{pill.label}</span>
              </button>
            );
          })}
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
        ) : filteredApps.length === 0 ? (
          <div className="bg-white border border-[#dadee2] rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">
              📝
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold">
                {filter === 'ALL' ? "You haven't applied yet" : 'No proposals here'}
              </h3>
              <p className="text-sm text-[#647380] max-w-sm mx-auto leading-relaxed font-medium">
                {filter === 'ALL'
                  ? 'Browse open requirements and send your first proposal to get started.'
                  : 'No proposals match this filter. Try switching to "All Proposals".'}
              </p>
            </div>
            {filter === 'ALL' && (
              <Link href="/dashboard/requirements/browse">
                <Button
                  size="sm"
                  className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-xs rounded-xl px-5"
                >
                  Browse Open Jobs
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div
                key={app._id}
                className="bg-white border border-[#dadee2] hover:border-[#00A453] hover:shadow-md rounded-2xl p-6 space-y-4 flex flex-col justify-between transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(app.status)}
                    <span className="text-[11px] text-[#647380] font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Submitted on{' '}
                      {new Date(app.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-[#2d2d2d] leading-snug">
                      {app.requirement?.subject || app.requirement?.category || 'Tutor Application'}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#647380] flex-wrap">
                      {app.requirement?.curriculum && (
                        <>
                          <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1">
                            {app.requirement.curriculum.level}
                          </span>
                          {app.requirement.curriculum.board && (
                            <>
                              <span className="text-gray-300 font-normal">·</span>
                              <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1">
                                {app.requirement.curriculum.board}
                              </span>
                            </>
                          )}
                          <span className="text-gray-300 font-normal">·</span>
                        </>
                      )}
                      <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        Timings: {app.availableTimings}
                      </span>
                      {app.freeDemo && (
                        <>
                          <span className="text-gray-300 font-normal">·</span>
                          <span className="font-bold bg-[#e6f6ee] border border-[#00A453]/25 text-[#00A453] rounded-full px-3 py-1">
                            Free Demo Offered
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {app.message && (
                    <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                        Your Proposal Pitch
                      </span>
                      <p className="text-xs text-[#4c5a67] leading-relaxed font-medium whitespace-pre-line line-clamp-3">
                        {app.message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-150 pt-4 mt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-[#647380] font-bold uppercase tracking-wider">
                        Proposed Fee
                      </div>
                      <div className="text-sm font-black text-[#2d2d2d]">
                        ₹{app.proposedFee}
                        <span className="text-[10px] text-[#647380] font-bold inline-block ml-1">
                          per hour
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">{renderTimeline(app.status)}</div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-gray-150">
                    <span className="text-xs text-[#647380] font-semibold">
                      Requirement Status:{' '}
                      <strong className="capitalize text-[#2d2d2d]">
                        {app.requirement?.status?.toLowerCase() || 'open'}
                      </strong>
                    </span>
                    <Link href={`/dashboard/requirements/${app.requirementId}`}>
                      <Button variant="primary" size="sm" className="flex items-center gap-1">
                        View Original Post <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
