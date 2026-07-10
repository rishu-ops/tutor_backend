'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { applicationApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from 'lucide-react';

export default function StudentApplicantDashboard() {
  const token = useAuthStore((s) => s.accessToken);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchApplications = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError('');
      const res = await applicationApi.getRequirementApplications(id, token);
      if (res.success && res.data) {
        setApplications(res.data);
        if (res.data.length > 0) {
          // Keep selection if already selected, otherwise select first
          setSelectedApp((prev: any) => {
            const current = res.data.find((a: any) => a._id === prev?._id);
            return current || res.data[0];
          });
        } else {
          setSelectedApp(null);
        }
      } else {
        setError(res.error || res.message || 'Failed to fetch applicants.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading applicants.');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAccept = async (appId: string) => {
    if (!token) return;
    const confirm = window.confirm(
      'Are you sure you want to accept this tutor? This will close matching and automatically reject other proposals.'
    );
    if (!confirm) return;

    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await applicationApi.acceptApplication(appId, token);
      if (res.success) {
        setSuccessMsg('Tutor accepted! Chat conversation created.');
        await fetchApplications();
      } else {
        setError(res.error || res.message || 'Failed to accept application.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to accept tutor application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appId: string) => {
    if (!token) return;
    const confirm = window.confirm('Are you sure you want to reject this tutor proposal?');
    if (!confirm) return;

    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await applicationApi.rejectApplication(appId, token);
      if (res.success) {
        setSuccessMsg('Proposal rejected.');
        await fetchApplications();
      } else {
        setError(res.error || res.message || 'Failed to reject application.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to reject tutor proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/20 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Rejected
          </span>
        );
      case 'VIEWED':
        return (
          <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Viewed
          </span>
        );
      case 'SENT':
      default:
        return (
          <span className="bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Sent
          </span>
        );
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6 text-[#2d2d2d]">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 border-b border-[#dadee2] pb-4">
          <Link href={`/dashboard/requirements/${id}`}>
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Review Applicants</h1>
            <p className="text-xs text-[#647380] font-semibold mt-0.5">
              Review qualifications, proposals, and select the best fit tutor for your requirement
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-[#e6f6ee] border border-[#00A453]/25 text-[#00A453] rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-xs text-[#647380] font-semibold animate-pulse">
            Loading applicants list...
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-[#dadee2] rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">
              🤝
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold">No applications yet</h3>
              <p className="text-xs text-[#647380] max-w-sm mx-auto leading-relaxed">
                Tutors matching your subject will apply here soon. Once proposals are sent, they
                will appear in this workspace.
              </p>
              <div className="pt-3">
                <Link href={`/dashboard/requirements/${id}`}>
                  <Button
                    variant="secondary"
                    className="border-[#dadee2] text-xs font-bold bg-white"
                  >
                    Back to Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start min-h-[500px]">
            {/* Left list panel (hiring sidebar) */}
            <div className="md:col-span-1 border border-[#dadee2] bg-white rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm max-h-[600px] overflow-y-auto">
              <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                <span className="text-xs font-bold text-[#647380] uppercase tracking-wider">
                  Applications ({applications.length})
                </span>
              </div>

              {applications.map((app) => {
                const isSelected = selectedApp?._id === app._id;
                return (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50/70 space-y-2 flex flex-col justify-between ${
                      isSelected ? 'bg-gray-50 border-l-4 border-l-[#00A453]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-[#2d2d2d] truncate block">
                          {app.tutor?.name}
                        </span>
                        <span className="text-[10px] text-[#647380] font-semibold mt-0.5 block">
                          Proposed fee: ₹{app.proposedFee}/Hr
                        </span>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#647380] font-semibold pt-1 border-t border-gray-50">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        {app.tutor?.ratingAvg || 5.0} Rating
                      </span>
                      <span>
                        {new Date(app.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Details Panel */}
            <div className="md:col-span-2 border border-[#dadee2] bg-white rounded-2xl p-6 shadow-sm space-y-6">
              {selectedApp ? (
                <div className="space-y-6">
                  {/* Tutor Header Identity */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center text-sm font-bold text-[#00A453] shrink-0">
                        {selectedApp.tutor?.name?.[0] || 'T'}
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-[#2d2d2d] flex items-center gap-1.5">
                          {selectedApp.tutor?.name}
                          <ShieldCheck className="w-4 h-4 text-[#00A453]" />
                        </h2>
                        <span className="text-xs text-[#647380] font-semibold flex items-center gap-1 mt-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {selectedApp.tutor?.ratingAvg || 5.0} Average rating (Verified tutor)
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (only show if application is not accepted or rejected yet) */}
                    {selectedApp.status !== 'ACCEPTED' && selectedApp.status !== 'REJECTED' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          disabled={actionLoading}
                          onClick={() => handleReject(selectedApp._id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 py-2 px-3 shadow-none shrink-0"
                        >
                          Reject
                        </Button>
                        <Button
                          disabled={actionLoading}
                          onClick={() => handleAccept(selectedApp._id)}
                          className="bg-[#00060c] hover:bg-slate-800 text-white text-xs font-bold rounded-lg py-2 px-4 shrink-0"
                        >
                          Accept Proposal
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#647380] block">
                          Proposal Resolved
                        </span>
                        {getStatusBadge(selectedApp.status)}
                      </div>
                    )}
                  </div>

                  {/* Proposal Summary Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                        Proposed Fee
                      </span>
                      <span className="text-sm font-extrabold text-[#00A453] flex items-center">
                        <DollarSign className="w-4 h-4 shrink-0" />₹{selectedApp.proposedFee} / Hour
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                        Timings Availability
                      </span>
                      <span className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {selectedApp.availableTimings}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                        Free Trial Class
                      </span>
                      <span className="text-xs font-bold text-[#2d2d2d] block mt-0.5">
                        {selectedApp.freeDemo ? '✨ 30-min Trial Offered' : 'No Free Trial'}
                      </span>
                    </div>
                  </div>

                  {/* Tutor Introduction */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-[#647380] uppercase tracking-wider">
                      Proposal Cover Message
                    </h3>
                    <p className="text-xs text-[#384148] leading-relaxed whitespace-pre-line border border-gray-100 rounded-xl p-4 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      {selectedApp.message}
                    </p>
                  </div>

                  {/* Tutor Experience / Qualifications */}
                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-[#647380] uppercase tracking-wider flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" /> Professional Summary
                      </h3>
                      <p className="text-xs text-[#384148] leading-relaxed">
                        {selectedApp.introduction}
                      </p>
                    </div>

                    {selectedApp.tutor?.qualifications &&
                      selectedApp.tutor.qualifications.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-[#647380] uppercase tracking-wider flex items-center gap-1">
                            <GraduationCap className="w-4 h-4 text-gray-400" /> Qualifications
                          </h3>
                          <div className="space-y-2">
                            {selectedApp.tutor.qualifications.map((q: any, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs font-semibold p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <span className="text-[#2d2d2d] block">{q.degree}</span>
                                  <span className="text-[#647380] text-[10px] block mt-0.5">
                                    {q.institution}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#647380] bg-white border border-gray-200 px-2 py-0.5 rounded">
                                  {q.year}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-xs text-[#647380] font-semibold">
                  Select an applicant on the left list to review proposal details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
