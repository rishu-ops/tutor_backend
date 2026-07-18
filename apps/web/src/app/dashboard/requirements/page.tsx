'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { requirementApi } from '@/lib/api';
import DashboardLayout from '../layout';
import { Button } from '@/components/ui/button';
import {
  Plus,
  MapPin,
  Calendar,
  Layers,
  Users,
  Eye,
  Pencil,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function MyRequirementsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'MATCHED' | 'CLOSED'>('ALL');

  const fetchRequirements = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await requirementApi.getMyRequirements(token);
      if (res.success && res.data) {
        setRequirements(res.data);
      } else {
        setError(res.error || 'Failed to fetch requirements');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading requirements');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleCloseRequirement = async (id: string) => {
    if (!token) return;
    if (
      !confirm('Are you sure you want to close this requirement? This action cannot be undone.')
    ) {
      return;
    }
    try {
      const res = await requirementApi.closeRequirement(id, token);
      if (res.success) {
        // Refresh requirements
        fetchRequirements();
      } else {
        alert(res.error || 'Failed to close requirement');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close requirement');
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    if (activeFilter === 'ALL') return true;
    return req.status === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center text-xs font-bold px-3 py-1 bg-[#e6f6ee] text-[#00A453] rounded-full">
            Accepting Applications
          </span>
        );
      case 'MATCHED':
        return (
          <span className="inline-flex items-center text-xs font-bold px-3 py-1 bg-[#e6f2ff] text-[#004fcb] rounded-full">
            Tutor Found
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center text-xs font-bold px-3 py-1 bg-gray-100 text-[#647380] rounded-full">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="max-w-[1100px] mx-auto py-6 space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dadee2] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2d2d2d] tracking-tight">
              My Tutor Requests
            </h1>
            <p className="text-sm text-[#647380] mt-1 font-medium">
              Manage your tutoring requests and view applications from expert tutors.
            </p>
          </div>
          <Link href="/dashboard/requirements/create" className="shrink-0">
            <Button className="bg-[#00A453] hover:bg-[#009048] text-white font-bold gap-1.5 rounded-xl shadow-sm px-5 h-11 uppercase text-xs tracking-wider">
              <Plus className="w-4 h-4 stroke-[3]" /> Post Requirement
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#647380] font-semibold">Loading requirements…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto shadow-xs">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-red-600 mb-3">{error}</p>
            <Button size="sm" onClick={fetchRequirements} className="rounded-xl">
              Retry
            </Button>
          </div>
        ) : requirements.length === 0 ? (
          /* Empty State */
          <div className="border border-[#dadee2] rounded-2xl p-16 text-center bg-white max-w-xl mx-auto space-y-6 shadow-xs">
            <div className="w-16 h-16 bg-[#e6f6ee] border border-[#00A453]/20 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
              📚
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                No tutor requests yet
              </h3>
              <p className="text-sm text-[#647380] leading-relaxed max-w-sm mx-auto font-medium">
                Post a requirement and we&apos;ll match you with qualified tutors who can apply
                directly.
              </p>
            </div>
            <div>
              <Link href="/dashboard/requirements/create">
                <Button className="bg-[#00A453] hover:bg-[#009048] text-white font-bold rounded-xl px-6 h-11 uppercase text-xs tracking-wider">
                  Post your first requirement
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 gap-6">
              {(['ALL', 'OPEN', 'MATCHED', 'CLOSED'] as const).map((filter) => {
                const isActive = activeFilter === filter;
                const count =
                  filter === 'ALL'
                    ? requirements.length
                    : requirements.filter((r) => r.status === filter).length;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`pb-3.5 font-bold text-sm transition-all border-b-2 relative ${
                      isActive
                        ? 'border-[#00A453] text-[#00A453]'
                        : 'border-transparent text-[#647380] hover:text-[#2d2d2d]'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All Requests'
                      : filter.charAt(0) + filter.slice(1).toLowerCase()}
                    <span
                      className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-bold transition-all ${
                        isActive ? 'bg-[#e6f6ee] text-[#00A453]' : 'bg-gray-100 text-[#647380]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List Cards */}
            {filteredRequirements.length === 0 ? (
              <div className="text-center py-12 text-[#647380] text-sm font-semibold">
                No requirements match this status filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredRequirements.map((req) => {
                  const hasCurriculum = req.category === 'School Education' && req.curriculum;
                  return (
                    <div
                      key={req._id}
                      className="bg-white border border-[#dadee2] hover:border-[#00A453] hover:shadow-md rounded-2xl p-6 space-y-4 flex flex-col justify-between transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(req.status)}
                          <span className="text-[11px] text-[#647380] font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-extrabold text-[#2d2d2d] leading-snug">
                            {hasCurriculum ? req.curriculum.subject : req.category}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-[#647380] flex-wrap">
                            {hasCurriculum && (
                              <>
                                <span className="flex items-center gap-1 font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1">
                                  <Layers className="w-3 h-3 text-gray-400" />
                                  {req.curriculum.level}
                                </span>
                                <span className="text-gray-300 font-normal">·</span>
                                <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1">
                                  {req.curriculum.board}
                                </span>
                                <span className="text-gray-300 font-normal">·</span>
                              </>
                            )}
                            <span className="flex items-center gap-1 font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {req.location.city}, {req.location.area}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-[#647380] line-clamp-2 leading-relaxed font-medium">
                          {req.description}
                        </p>
                      </div>

                      <div className="border-t border-gray-150 pt-4 mt-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-[#647380] font-bold uppercase tracking-wider">
                              Budget
                            </div>
                            <div className="text-sm font-black text-[#2d2d2d]">
                              ₹{req.budget.min} - ₹{req.budget.max}
                              <span className="text-[10px] text-[#647380] font-bold inline-block ml-1">
                                {req.budget.feeType === 'PER_HOUR'
                                  ? 'per hour'
                                  : req.budget.feeType === 'PER_MONTH'
                                    ? 'per month'
                                    : 'per session'}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs text-[#647380] font-bold bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-full shadow-xs">
                            {req.applicationsCount || 0}{' '}
                            {req.applicationsCount === 1 ? 'proposal' : 'proposals'}
                          </span>
                        </div>

                        {/* Separate line with flex wrap for details, edit, and close buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-dashed border-gray-150">
                          <Link href={`/dashboard/requirements/${req._id}`}>
                            <Button variant="primary" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {req.status === 'OPEN' && (
                            <>
                              <Link href={`/dashboard/requirements/${req._id}/edit`}>
                                <Button variant="secondary" size="sm">
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCloseRequirement(req._id)}
                                className="text-red-500 border-red-200 hover:bg-red-50/50"
                              >
                                Close Request
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
