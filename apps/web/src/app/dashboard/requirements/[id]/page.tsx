'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { requirementApi, applicationApi } from '@/lib/api';
import ApplyModal from '@/components/sections/ApplyModal';
import TutorPreviewDrawer from '@/components/sections/TutorPreviewDrawer';
import ComparisonTable from '@/components/sections/ComparisonTable';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  Compass,
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  User,
  XCircle,
  Users,
  Star,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
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

  // Tutor states
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Student Evaluation states
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'details' | 'timeline'>(
    'overview'
  );
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedTutorUserId, setSelectedTutorUserId] = useState<string>('');
  const [selectedAppStatus, setSelectedAppStatus] = useState<string>('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const checkApplication = useCallback(async () => {
    if (!token || user?.role !== 'TUTOR' || !id) return;
    try {
      const res = await applicationApi.getMyApplications(token);
      if (res.success && res.data) {
        setHasApplied(res.data.some((app: any) => app.requirementId === id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, user, id]);

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

  const fetchApplications = useCallback(async () => {
    if (!token || !id || !requirement) return;
    if (requirement.studentUserId !== user?.id) return;
    try {
      const res = await applicationApi.getRequirementApplications(id, token);
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, id, requirement, user]);

  useEffect(() => {
    fetchDetail();
    checkApplication();
  }, [fetchDetail, checkApplication]);

  useEffect(() => {
    if (requirement) {
      fetchApplications();
    }
  }, [requirement, fetchApplications]);

  const handleOpenDrawer = async (tutorUserId: string, appId: string, currentStatus: string) => {
    if (!token) return;
    setSelectedTutorUserId(tutorUserId);
    setSelectedAppStatus(currentStatus);
    setSelectedAppId(appId);
    setIsDrawerOpen(true);

    if (currentStatus === 'SENT') {
      try {
        await applicationApi.viewApplication(appId, token);
        fetchApplications();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAccept = async (appId: string) => {
    if (!token) return;
    const confirm = window.confirm(
      'Are you sure you want to accept this tutor? This will close matching and automatically reject other proposals.'
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await applicationApi.acceptApplication(appId, token);
      if (res.success) {
        alert('Tutor accepted successfully!');
        fetchDetail();
        fetchApplications();
      } else {
        alert(res.error || res.message || 'Failed to accept application.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to accept tutor application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appId: string) => {
    if (!token) return;
    const confirm = window.confirm('Are you sure you want to reject this tutor proposal?');
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await applicationApi.rejectApplication(appId, token);
      if (res.success) {
        alert('Proposal rejected.');
        fetchApplications();
      } else {
        alert(res.error || res.message || 'Failed to reject application.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to reject tutor proposal.');
    } finally {
      setActionLoading(false);
    }
  };

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

  const toggleSelectTutor = (appId: string) => {
    setSelectedTutors((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-[#e6f6ee] text-[#00A453] rounded-full">
            ● Open for Applications
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-600 rounded-full">
            ● Under Review
          </span>
        );
      case 'MATCHED':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
            ● Matched with Tutor
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-red-50 text-red-600 rounded-full">
            ● Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-gray-50 text-[#647380] rounded-full">
            {status}
          </span>
        );
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="bg-[#e6f6ee] text-[#00A453] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-50 text-red-600 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Rejected
          </span>
        );
      case 'VIEWED':
        return (
          <span className="bg-blue-50 text-blue-600 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Viewed
          </span>
        );
      case 'SENT':
      default:
        return (
          <span className="bg-gray-50 text-gray-500 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
            Sent
          </span>
        );
    }
  };

  if (loading) {
    return (
      <>
        <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#647380] font-semibold animate-pulse">
          Loading requirement details...
        </div>
      </>
    );
  }

  if (error || !requirement) {
    return (
      <>
        <div className="max-w-4xl mx-auto py-12 text-center text-xs text-red-500 font-semibold">
          ⚠️ {error || 'Requirement not found'}
        </div>
      </>
    );
  }

  const isOwner = requirement.studentUserId === user?.id;
  const isSchoolEd = requirement.category === 'School Education';

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 text-[#2d2d2d]">
        {/* Back and Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Link href={isOwner ? '/dashboard' : '/dashboard/requirements/browse'}>
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                Requirement Details
              </span>
              <h1 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight mt-0.5">
                {requirement.curriculum?.subject || requirement.category}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(requirement.status)}

            {/* Student Owner Controls */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/requirements/${requirement._id}/edit`}>
                  <Button
                    variant="secondary"
                    className="border-[#dadee2] text-[#2d2d2d] gap-1.5 font-semibold rounded-[4px]"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                </Link>
                {requirement.status !== 'CLOSED' && (
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={actionLoading}
                    className="border-red-200 text-red-500 hover:bg-red-50 gap-1.5 font-semibold rounded-[4px]"
                  >
                    <XCircle className="w-4 h-4" /> Close
                  </Button>
                )}
              </div>
            )}

            {/* Tutor Action Button */}
            {user?.role === 'TUTOR' && requirement.status === 'OPEN' && (
              <div>
                {hasApplied ? (
                  <Button
                    disabled
                    className="bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/20 font-bold px-5 py-2 rounded-[4px] text-xs cursor-not-allowed select-none"
                  >
                    ✓ Applied
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsApplyOpen(true)}
                    className="bg-[#00A453] hover:bg-[#009048] text-white font-bold px-5 py-2 rounded-[4px] text-xs shadow-sm transition-all"
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab switcher headers (Only show tab layout if Student is the owner) */}
        {isOwner ? (
          <div className="flex items-center gap-1 border-b border-gray-100 pb-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: '📊 Overview', icon: Layers },
              {
                id: 'applications',
                label: `👥 Applications (${applications.length})`,
                icon: Users,
              },
              { id: 'details', label: '📝 Details', icon: FileText },
              { id: 'timeline', label: '📈 Timeline Activity', icon: Activity },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg transition-all shrink-0 select-none ${
                    isActive ? 'bg-gray-100 text-[#2d2d2d]' : 'text-[#647380] hover:text-[#2d2d2d]'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* TAB WORKSPACE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main workspace (tabs render on the left span 2, metadata panel on the right span 1) */}
          <div className="md:col-span-2 space-y-6">
            {/* TAB CONTENT: OVERVIEW (Default for owner, full render for non-owners) */}
            {(!isOwner || activeTab === 'overview') && (
              <div className="space-y-6">
                <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-extrabold text-[#2d2d2d] border-b border-gray-100 pb-2.5">
                    Description & Learning Target
                  </h3>
                  <p className="text-xs text-[#647380] leading-relaxed whitespace-pre-line">
                    {requirement.description}
                  </p>
                </div>

                {/* Timeline display on Overview */}
                <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-extrabold text-[#2d2d2d] border-b border-gray-100 pb-2.5">
                    Tutoring Path Activity
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 select-none text-[10px] font-extrabold uppercase text-center">
                    <div className="space-y-1">
                      <span className="text-[#00A453] bg-[#e6f6ee] border border-[#00A453]/20 px-2.5 py-1.5 rounded-full block">
                        ✓ Post Created
                      </span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">➔</span>
                    <div className="space-y-1">
                      <span
                        className={
                          requirement.applicationsCount > 0
                            ? 'text-[#00A453] bg-[#e6f6ee] border border-[#00A453]/20 px-2.5 py-1.5 rounded-full block'
                            : 'text-gray-300 border border-gray-100 px-2.5 py-1.5 rounded-full block'
                        }
                      >
                        {requirement.applicationsCount > 0 ? '✓ Tutors Applied' : 'Tutor Applied'}
                      </span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">➔</span>
                    <div className="space-y-1">
                      <span
                        className={
                          applications.some((a) => a.status === 'VIEWED' || a.status === 'ACCEPTED')
                            ? 'text-[#00A453] bg-[#e6f6ee] border border-[#00A453]/20 px-2.5 py-1.5 rounded-full block'
                            : 'text-gray-300 border border-gray-100 px-2.5 py-1.5 rounded-full block'
                        }
                      >
                        {applications.some((a) => a.status === 'VIEWED' || a.status === 'ACCEPTED')
                          ? '✓ Proposals Viewed'
                          : 'Viewed'}
                      </span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">➔</span>
                    <div className="space-y-1">
                      <span
                        className={
                          requirement.status === 'MATCHED'
                            ? 'text-[#00A453] bg-[#e6f6ee] border border-[#00A453]/20 px-2.5 py-1.5 rounded-full block'
                            : 'text-gray-300 border border-gray-100 px-2.5 py-1.5 rounded-full block'
                        }
                      >
                        {requirement.status === 'MATCHED' ? '✓ Tutor Accepted' : 'Accepted'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: APPLICATIONS (Owner Only) */}
            {isOwner && activeTab === 'applications' && (
              <div className="space-y-6">
                {/* Compare Bar controls */}
                <div className="bg-white border border-[#dadee2] p-4 rounded-xl shadow-sm flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="font-extrabold text-[#2d2d2d]">Comparison Benchmarks</span>
                    <p className="text-[10px] text-[#647380] font-semibold mt-0.5">
                      Select multiple tutor cards below to launch comparison details
                    </p>
                  </div>
                  <Button
                    disabled={selectedTutors.length < 2}
                    onClick={() => setIsCompareOpen(true)}
                    className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-lg"
                  >
                    Compare Tutors ({selectedTutors.length})
                  </Button>
                </div>

                {applications.length === 0 ? (
                  <div className="bg-white border border-[#dadee2] rounded-2xl p-12 text-center text-xs text-[#647380]">
                    No active tutor applications received for this requirement yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div
                        key={app._id}
                        className="bg-white border border-[#eef1f4] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Compare Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedTutors.includes(app._id)}
                              onChange={() => toggleSelectTutor(app._id)}
                              className="w-4 h-4 text-[#00A453] border-gray-300 rounded focus:ring-[#00A453] cursor-pointer"
                            />

                            <div className="w-10 h-10 rounded-full bg-[#f4f7f6] flex items-center justify-center font-bold text-[#00A453] border border-gray-100">
                              {app.tutor?.name?.[0] || 'T'}
                            </div>

                            <div>
                              <h4 className="text-sm font-extrabold text-[#2d2d2d] flex items-center gap-1">
                                {app.tutor?.name}
                                {getApplicationStatusBadge(app.status)}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-[#647380] font-semibold mt-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {app.tutor?.ratingAvg || 5.0}
                                </span>
                                <span>·</span>
                                <span>Proposed: ₹{app.proposedFee}/Hr</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] text-[#647380]">
                            {new Date(app.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Proposal covers preview */}
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-[#384148] leading-relaxed line-clamp-2">
                          {app.message}
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-[#647380] font-semibold">
                            Timings: <strong>{app.availableTimings}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDrawer(app.tutorUserId, app._id, app.status)}
                              className="text-xs font-bold text-[#647380] hover:text-[#2d2d2d] border border-gray-200 px-3 py-1.5 rounded transition-all bg-white"
                            >
                              View Profile
                            </button>

                            {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                              <>
                                <button
                                  onClick={() => handleReject(app._id)}
                                  className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1.5"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAccept(app._id)}
                                  className="text-xs font-bold bg-[#00A453] text-white hover:bg-[#009048] px-3.5 py-1.5 rounded transition-all"
                                >
                                  Accept
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: REQUIREMENT DETAILS (Owner Only) */}
            {isOwner && activeTab === 'details' && (
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-extrabold text-[#2d2d2d] border-b border-gray-100 pb-2.5">
                  Taxonomy & Classification
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#647380]">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">
                      Category
                    </span>
                    <span className="text-sm font-extrabold text-[#2d2d2d] mt-1 block">
                      {requirement.category}
                    </span>
                  </div>
                  {isSchoolEd && (
                    <>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="block text-[10px] uppercase font-bold text-gray-400">
                          Class
                        </span>
                        <span className="text-sm font-extrabold text-[#2d2d2d] mt-1 block">
                          {requirement.curriculum?.level}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="block text-[10px] uppercase font-bold text-gray-400">
                          Board
                        </span>
                        <span className="text-sm font-extrabold text-[#2d2d2d] mt-1 block">
                          {requirement.curriculum?.board}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">
                      Subject
                    </span>
                    <span className="text-sm font-extrabold text-[#2d2d2d] mt-1 block">
                      {requirement.curriculum?.subject || 'All Subjects'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACTIVITY LOG TIMELINE (Owner Only) */}
            {isOwner && activeTab === 'timeline' && (
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-extrabold text-[#2d2d2d] border-b border-gray-100 pb-2.5">
                  Activity Timeline History
                </h3>
                <div className="space-y-6 text-xs pl-4 border-l border-gray-100 relative">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-6 top-0 w-4 h-4 bg-[#00A453] rounded-full border-4 border-white" />
                    <div className="font-bold text-[#2d2d2d]">Tutoring Requirement Posted</div>
                    <p className="text-[10px] text-[#647380] mt-0.5">
                      Requirement published successfully and recommendations matched.
                    </p>
                  </div>

                  {/* Step 2 */}
                  {requirement.applicationsCount > 0 && (
                    <div className="relative">
                      <span className="absolute -left-6 top-0 w-4 h-4 bg-[#00A453] rounded-full border-4 border-white" />
                      <div className="font-bold text-[#2d2d2d]">Tutors Applied</div>
                      <p className="text-[10px] text-[#647380] mt-0.5">
                        Received {requirement.applicationsCount} tutor proposals matching
                        requirements.
                      </p>
                    </div>
                  )}

                  {/* Step 3 */}
                  {requirement.status === 'MATCHED' && (
                    <div className="relative">
                      <span className="absolute -left-6 top-0 w-4 h-4 bg-[#00A453] rounded-full border-4 border-white" />
                      <div className="font-bold text-[#2d2d2d]">Tutor Selected & Accepted</div>
                      <p className="text-[10px] text-[#647380] mt-0.5">
                        Matched contract created. Chat channels initialized.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Details Panel */}
          <div className="space-y-6 md:col-span-1">
            {/* Learning Format */}
            <div className="bg-white border border-[#dadee2] rounded-xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#2d2d2d] border-b border-gray-100 pb-2 uppercase tracking-wider text-gray-400">
                Preferences
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-[#00A453] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#647380] block font-bold uppercase">
                      Teaching Mode
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {requirement.teachingMode.map((mode: string) => (
                        <span
                          key={mode}
                          className="text-[9px] font-bold px-1.5 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded"
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-gray-50 pt-4">
                  <Clock className="w-4 h-4 text-[#00A453] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#647380] block font-bold uppercase">
                      Preferred Schedule
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {requirement.schedule.map((sched: string) => (
                        <span
                          key={sched}
                          className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-[#2d2d2d] rounded"
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
              <h4 className="text-xs font-bold text-[#2d2d2d] border-b border-gray-100 pb-2 uppercase tracking-wider text-gray-400">
                Location Details
              </h4>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#00A453] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-[#647380] block font-bold uppercase">
                      City & Area
                    </span>
                    <span className="text-xs font-bold text-[#2d2d2d] mt-0.5 block">
                      {requirement.location.city}, {requirement.location.area}
                    </span>
                  </div>
                  {requirement.location.address && (
                    <div>
                      <span className="text-[10px] text-[#647380] block font-bold uppercase">
                        Address
                      </span>
                      <span className="text-xs text-[#2d2d2d] block mt-0.5 leading-relaxed font-medium">
                        {requirement.location.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Budget */}
            <div className="bg-white border border-[#dadee2] rounded-xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#2d2d2d] border-b border-gray-100 pb-2 uppercase tracking-wider text-gray-400">
                Budget Rates
              </h4>
              <div className="flex items-start gap-3">
                <DollarSign className="w-4.5 h-4.5 text-[#00A453] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#647380] block font-bold uppercase">
                    Range
                  </span>
                  <span className="text-sm font-extrabold text-[#00A453] block mt-0.5">
                    ₹{requirement.budget.min} - ₹{requirement.budget.max} / Hr
                  </span>
                  <span className="text-[9px] text-[#b0b8c1] block mt-0.5 uppercase font-bold">
                    {requirement.budget.feeType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Modal popup */}
        {requirement && (
          <ApplyModal
            requirementId={requirement._id}
            requirementSubject={requirement.curriculum?.subject || ''}
            requirementCategory={requirement.category}
            defaultBudgetMin={requirement.budget.min}
            defaultBudgetMax={requirement.budget.max}
            isOpen={isApplyOpen}
            onClose={() => setIsApplyOpen(false)}
            onSuccess={() => {
              setHasApplied(true);
              fetchDetail();
            }}
          />
        )}

        {/* Comparison Modal popups */}
        <ComparisonTable
          applicationIds={selectedTutors}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          onAccept={handleAccept}
          actionLoading={actionLoading}
        />

        {/* Tutor Profile Drawers */}
        <TutorPreviewDrawer
          tutorUserId={selectedTutorUserId}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          status={selectedAppStatus}
          onAccept={() => {
            setIsDrawerOpen(false);
            handleAccept(selectedAppId);
          }}
          onReject={() => {
            setIsDrawerOpen(false);
            handleReject(selectedAppId);
          }}
          actionLoading={actionLoading}
        />
      </div>
    </>
  );
}
