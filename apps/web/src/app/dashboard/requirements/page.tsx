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
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-[#e6f6ee] text-[#00A453] rounded-full">
            ● Open
          </span>
        );
      case 'MATCHED':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-[#e6f2ff] text-[#004fcb] rounded-full">
            ● Matched
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-gray-100 text-[#647380] rounded-full">
            ● Closed
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
              My Requirements
            </h1>
            <p className="text-sm text-[#647380] mt-1">
              View and manage the tutoring requirements you have posted.
            </p>
          </div>
          <Link href="/dashboard/requirements/create" className="shrink-0">
            <Button className="bg-[#00A453] hover:bg-[#009048] text-white font-semibold gap-1.5 rounded-[4px] shadow-sm">
              <Plus className="w-4 h-4 stroke-[2.5]" /> Post Requirement
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#647380]">Loading requirements…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-[8px] p-6 text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-red-600 mb-3">{error}</p>
            <Button size="sm" onClick={fetchRequirements}>
              Retry
            </Button>
          </div>
        ) : requirements.length === 0 ? (
          /* Empty State */
          <div className="border border-[#dadee2] rounded-xl p-16 text-center bg-white max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-[#e6f6ee] border border-[#00A453]/20 rounded-full flex items-center justify-center mx-auto text-2xl">
              📚
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#2d2d2d]">No requirements posted yet</h3>
              <p className="text-sm text-[#647380] leading-relaxed max-w-sm mx-auto">
                Post your first requirement to start receiving tutor applications and find the best
                match.
              </p>
            </div>
            <div>
              <Link href="/dashboard/requirements/create">
                <Button className="bg-[#00A453] hover:bg-[#009048] text-white font-semibold rounded-[4px] px-6">
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
                    className={`pb-3 font-semibold text-sm transition-colors border-b-2 relative ${
                      isActive
                        ? 'border-[#2d2d2d] text-[#2d2d2d]'
                        : 'border-transparent text-[#647380] hover:text-[#2d2d2d]'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All Requests'
                      : filter.charAt(0) + filter.slice(1).toLowerCase()}
                    <span className="ml-1.5 text-xs bg-gray-100 text-[#647380] px-2 py-0.5 rounded-full font-medium">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List Cards */}
            {filteredRequirements.length === 0 ? (
              <div className="text-center py-12 text-[#647380] text-sm">
                No requirements match this status filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequirements.map((req) => {
                  const hasCurriculum = req.category === 'School Education' && req.curriculum;
                  return (
                    <div
                      key={req._id}
                      className="bg-white border border-[#dadee2] hover:border-[#dadee2]/60 hover:shadow-sm rounded-lg p-6 space-y-4 flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(req.status)}
                          <span className="text-[11px] text-[#647380] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-[#2d2d2d]">
                            {hasCurriculum ? req.curriculum.subject : req.category}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#647380] flex-wrap">
                            {hasCurriculum && (
                              <>
                                <span className="flex items-center gap-1 font-medium bg-gray-50 border border-gray-100 rounded-[3px] px-2 py-0.5">
                                  <Layers className="w-3 h-3 text-gray-400" />
                                  {req.curriculum.level}
                                </span>
                                <span>·</span>
                                <span className="font-medium bg-gray-50 border border-gray-100 rounded-[3px] px-2 py-0.5">
                                  {req.curriculum.board}
                                </span>
                                <span>·</span>
                              </>
                            )}
                            <span className="flex items-center gap-1 font-medium bg-gray-50 border border-gray-100 rounded-[3px] px-2 py-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {req.location.city}, {req.location.area}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-[#647380] line-clamp-2 leading-relaxed">
                          {req.description}
                        </p>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-[#647380]">Budget</div>
                          <div className="text-sm font-extrabold text-[#2d2d2d]">
                            ₹{req.budget.min} - ₹{req.budget.max}
                            <span className="text-[10px] text-[#647380] font-normal block">
                              {req.budget.feeType === 'PER_HOUR'
                                ? 'per hour'
                                : req.budget.feeType === 'PER_MONTH'
                                  ? 'per month'
                                  : 'per session'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#647380] mr-2">
                            {req.applicationsCount || 0} applications
                          </span>
                          <Link href={`/dashboard/requirements/${req._id}`}>
                            <button className="text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors py-1.5 px-3 border border-gray-200 bg-white rounded">
                              View Details
                            </button>
                          </Link>
                          {req.status === 'OPEN' && (
                            <>
                              <Link href={`/dashboard/requirements/${req._id}/edit`}>
                                <button className="text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors py-1.5 px-3 border border-gray-200 bg-white rounded">
                                  Edit
                                </button>
                              </Link>
                              <button
                                onClick={() => handleCloseRequirement(req._id)}
                                className="text-xs font-bold text-red-500 hover:bg-red-50 transition-colors py-1.5 px-3 rounded"
                              >
                                Close
                              </button>
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
