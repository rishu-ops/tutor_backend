'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { requirementApi } from '@/lib/api';
import DashboardLayout from '../../layout';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Pencil,
  XCircle,
  MapPin,
  Calendar,
  Layers,
  BookOpen,
  DollarSign,
  Clock,
  Briefcase,
  Users,
  AlertCircle,
} from 'lucide-react';

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const id = params.id as string;

  const fetchDetail = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError('');
      const res = await requirementApi.getRequirementDetail(id, token);
      if (res.success && res.data) {
        setRequirement(res.data);
      } else {
        setError(res.error || 'Failed to fetch requirement details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading details');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleClose = async () => {
    if (!token || !id) return;
    if (
      !confirm(
        'Are you sure you want to close this requirement? This will stop tutors from applying.'
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await requirementApi.closeRequirement(id, token);
      if (res.success) {
        // Reload details
        fetchDetail();
      } else {
        alert(res.error || 'Failed to close requirement');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close requirement');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-[#e6f6ee] text-[#00A453] rounded-full">
            ● Open for Applications
          </span>
        );
      case 'MATCHED':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-[#e6f2ff] text-[#004fcb] rounded-full">
            ● Matched
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-gray-100 text-[#647380] rounded-full">
            ● Closed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#647380]">Loading requirement details…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !requirement) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-[8px] p-6 text-center max-w-md mx-auto mt-12 space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-600 font-bold">
            <AlertCircle className="w-6 h-6" />
            <h3>Error Loading Details</h3>
          </div>
          <p className="text-sm text-red-600">{error || 'Requirement not found.'}</p>
          <Button size="sm" onClick={() => router.push('/dashboard/requirements')}>
            Back to Requirements
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.id === requirement.studentUserId;
  const isSchoolEd = requirement.category === 'School Education';
  const displayTitle = isSchoolEd ? requirement.curriculum?.subject : requirement.category;

  return (
    <DashboardLayout>
      <div className="max-w-[900px] mx-auto py-4 space-y-6">
        {/* Back Link */}
        <button
          onClick={() => router.push('/dashboard/requirements')}
          className="flex items-center gap-1 text-sm text-[#647380] hover:text-[#2d2d2d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Requirements
        </button>

        {/* Header Summary Card */}
        <div className="bg-white border border-[#dadee2] rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(requirement.status)}
                <span className="text-xs text-[#647380] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Posted on{' '}
                  {new Date(requirement.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#2d2d2d] tracking-tight">
                Need {displayTitle} Tutor
              </h1>
              <div className="text-sm text-[#647380]">
                Posted by{' '}
                <span className="font-semibold text-[#2d2d2d]">{requirement.studentName}</span>
              </div>
            </div>

            {/* Action buttons (Only for owner when OPEN) */}
            {isOwner && requirement.status === 'OPEN' && (
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/requirements/${requirement._id}/edit`}>
                  <Button
                    variant="secondary"
                    className="border-[#dadee2] text-[#2d2d2d] gap-1.5 font-semibold rounded-[4px]"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  disabled={actionLoading}
                  className="border-red-200 text-red-500 hover:bg-red-50 gap-1.5 font-semibold rounded-[4px]"
                >
                  <XCircle className="w-4 h-4" /> Close
                </Button>
              </div>
            )}

            {user?.role === 'TUTOR' && requirement.status === 'OPEN' && (
              <div className="shrink-0">
                <Button
                  disabled
                  className="bg-gray-100 border border-gray-200 text-gray-400 font-bold px-5 py-2.5 rounded-[4px] text-xs cursor-not-allowed select-none"
                >
                  Apply (Coming in Phase 3)
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-6">
            <div className="space-y-1">
              <span className="text-xs text-[#647380] block">Category</span>
              <span className="font-semibold text-sm text-[#2d2d2d]">{requirement.category}</span>
            </div>
            {isSchoolEd && (
              <>
                <div className="space-y-1">
                  <span className="text-xs text-[#647380] block">Class</span>
                  <span className="font-semibold text-sm text-[#2d2d2d]">
                    {requirement.curriculum?.level}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#647380] block">Board</span>
                  <span className="font-semibold text-sm text-[#2d2d2d]">
                    {requirement.curriculum?.board}
                  </span>
                </div>
              </>
            )}
            <div className="space-y-1">
              <span className="text-xs text-[#647380] block">Budget</span>
              <span className="font-extrabold text-sm text-[#2d2d2d]">
                ₹{requirement.budget.min} - ₹{requirement.budget.max}
                <span className="text-[10px] text-[#647380] font-normal block capitalize">
                  {requirement.budget.feeType.toLowerCase().replace('_', ' ')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white border border-[#dadee2] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#2d2d2d] border-b border-gray-100 pb-3">
                Learning Goals & Description
              </h3>
              <p className="text-sm text-[#647380] leading-relaxed whitespace-pre-line">
                {requirement.description}
              </p>
            </div>

            {/* Applications List */}
            {isOwner && (
              <div className="bg-white border border-[#dadee2] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-bold text-[#2d2d2d]">Tutor Applications</h3>
                  <span className="text-xs bg-gray-100 text-[#647380] px-2 py-0.5 rounded-full font-medium">
                    {requirement.applicationsCount || 0} applications
                  </span>
                </div>
                <div className="text-center py-12 text-[#647380] text-sm space-y-2">
                  <Users className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-medium text-gray-500">No tutor has applied yet</p>
                  <p className="text-xs text-[#b0b8c1] max-w-[280px] mx-auto leading-relaxed">
                    We are matching your requirement with qualified tutors. You will receive
                    notifications as they apply.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Preferences Panel */}
          <div className="space-y-6">
            {/* Learning Format */}
            <div className="bg-white border border-[#dadee2] rounded-xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#2d2d2d] border-b border-gray-100 pb-2">
                Preferences
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4.5 h-4.5 text-[#00A453] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[#647380] block font-medium">Teaching Modes</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {requirement.teachingMode.map((mode: string) => (
                        <span
                          key={mode}
                          className="text-[10px] font-semibold px-2 py-0.5 bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/15 rounded-[3px]"
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-gray-50 pt-4">
                  <Clock className="w-4.5 h-4.5 text-[#00A453] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[#647380] block font-medium">
                      Preferred Schedule
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {requirement.schedule.map((sched: string) => (
                        <span
                          key={sched}
                          className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-[#2d2d2d] rounded-[3px]"
                        >
                          {sched}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location details */}
            <div className="bg-white border border-[#dadee2] rounded-xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#2d2d2d] border-b border-gray-100 pb-2">
                Location details
              </h4>
              <div className="flex items-start gap-3">
                <MapPin className="w-4.5 h-4.5 text-[#00A453] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-[#647380] block font-medium">City & Area</span>
                    <span className="text-sm font-semibold text-[#2d2d2d] mt-0.5 block">
                      {requirement.location.city}, {requirement.location.area}
                    </span>
                  </div>
                  {requirement.location.address && (
                    <div>
                      <span className="text-xs text-[#647380] block font-medium">Address</span>
                      <span className="text-sm text-[#2d2d2d] block mt-0.5 font-medium leading-relaxed">
                        {requirement.location.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
