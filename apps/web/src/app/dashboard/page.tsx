'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import {
  Plus,
  Compass,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Info,
  Calendar,
  MessageSquare,
  Search,
  CheckCircle,
  Star,
  Users,
  ChevronRight,
  TrendingUp,
  UserCheck,
  TrendingDown,
  Layers,
  ArrowUpRight,
  BookOpenCheck,
  ShieldCheck,
  Zap,
  Phone,
  IndianRupee,
  Video,
  MoreVertical,
  MessageSquareText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requirementApi, profileApi, recommendationApi, adminApi, applicationApi } from '@/lib/api';

// Recent Educational Articles for Task Dashboards
const MOCK_ARTICLES = [
  {
    id: 'art-1',
    title: 'How to Choose the Right Tutor for Your Child',
    readTime: '5 min read',
    category: 'Parent Guide',
  },
  {
    id: 'art-2',
    title: 'Home Tuition vs. Online Tuition: A Comparison',
    readTime: '7 min read',
    category: 'Study Strategy',
  },
];

const DEFAULT_ANNOUNCEMENT = {
  _id: 'default-announce-1',
  type: 'Platform Update',
  title: 'Project Tutor RBAC Engine Live!',
  content:
    'We have initialized role-based access control policies across all administrative interfaces.',
  createdAt: '2026-07-10T00:00:00.000Z',
};

// Fallback recommendations of Tutors
const MOCK_RECOMMENDED_TUTORS = [
  {
    _id: 'rec-t-1',
    name: 'Rahul Sharma',
    subjects: ['Mathematics', 'Physics'],
    ratingAvg: 4.9,
    experience: '8 Yrs',
    verified: true,
    teachingMode: ['Online', 'Home'],
    hourlyRate: 800,
  },
  {
    _id: 'rec-t-2',
    name: 'Priya Patel',
    subjects: ['Chemistry', 'Biology'],
    ratingAvg: 4.8,
    experience: '5 Yrs',
    verified: true,
    teachingMode: ['Online'],
    hourlyRate: 650,
  },
];

// Active/Recently Active Tutors
const MOCK_ACTIVE_TUTORS = [
  {
    _id: 'act-t-1',
    name: "Sarah D'Souza",
    subjects: ['English'],
    ratingAvg: 5.0,
    experience: '12 Yrs',
    verified: true,
    hourlyRate: 900,
  },
  {
    _id: 'act-t-2',
    name: 'Amit Verma',
    subjects: ['Computer Science'],
    ratingAvg: 4.7,
    experience: '4 Yrs',
    verified: false,
    hourlyRate: 700,
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  // Data States
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [tutorApplications, setTutorApplications] = useState<any[]>([]);
  const [studentRequirements, setStudentRequirements] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [hiredTutors, setHiredTutors] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');

  // Rotating announcement state
  const [activeAnnounceIndex, setActiveAnnounceIndex] = useState(0);
  // Compute profile completion percentage for Tutors
  const getProfileCompletionPercentage = () => {
    if (!tutorProfile) return 40; // Default base completion
    let score = 30; // base score
    if (tutorProfile.bio) score += 15;
    if (tutorProfile.location?.city) score += 15;
    if (tutorProfile.subjects && tutorProfile.subjects.length > 0) score += 15;
    if (tutorProfile.teachingModes && tutorProfile.teachingModes.length > 0) score += 15;
    if (tutorProfile.pricing?.min) score += 10;
    return Math.min(score, 100);
  };

  // Fetch Student Home Data
  const fetchStudentHomeData = useCallback(async () => {
    if (!token) return;
    try {
      const reqsRes = await requirementApi.getMyRequirements(token);
      if (reqsRes.success && reqsRes.data) {
        setStudentRequirements(reqsRes.data);
        // Fetch public profiles for all MATCHED requirements
        const matchedReqs = reqsRes.data.filter((r: any) => r.status === 'MATCHED');
        if (matchedReqs.length > 0) {
          try {
            const tutorPromises = matchedReqs.map(async (req: any) => {
              if (req.acceptedTutorId) {
                const tutorRes = await profileApi.getPublicTutorProfile(req.acceptedTutorId, token);
                if (tutorRes.success && tutorRes.data) {
                  return { ...tutorRes.data, subjectName: req.curriculum?.subject || req.category };
                }
              }
              return null;
            });
            const resolved = await Promise.all(tutorPromises);
            setHiredTutors(resolved.filter((t) => t !== null));
          } catch (e) {
            console.error('Failed to load matched tutors profiles:', e);
          }
        }
      }

      const postsRes = await adminApi.getPublicPosts(token);
      if (postsRes.success) {
        setAnnouncements(postsRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    }
  }, [token]);

  // Fetch Tutor Home Data
  const fetchTutorHomeData = useCallback(async () => {
    if (!token) return;
    try {
      setProfileLoading(true);
      const profRes = await profileApi.getTutorProfile(token);
      if (profRes.success && profRes.data) {
        setTutorProfile(profRes.data);
      }
      setProfileLoading(false);

      const appsRes = await applicationApi.getMyApplications(token);
      if (appsRes.success && appsRes.data) {
        setTutorApplications(appsRes.data);
      }

      const recRes = await recommendationApi.getHomeRecommendations(token);
      if (recRes.success) {
        setRecommendations(recRes.recommended || []);
        setAnnouncements(recRes.posts || []);
      }
    } catch (err) {
      console.error('Error fetching tutor dashboard data:', err);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (user?.role === 'STUDENT') {
        await fetchStudentHomeData();
      } else if (user?.role === 'TUTOR') {
        await fetchTutorHomeData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync dashboard status.');
    } finally {
      setLoading(false);
    }
  }, [user, fetchStudentHomeData, fetchTutorHomeData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle rotating announcements timer
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAnnounceIndex((prev) => (prev + 1) % announcements.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [announcements]);

  const getInitials = (name?: string) => {
    const target = name || user?.name || 'User';
    return target
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine current active state depending on user details
  const getActiveState = () => {
    if (user?.role === 'STUDENT') {
      if (studentRequirements.length === 0) {
        return 'STATE_1_NEW_STUDENT';
      }
      const hasMatched = studentRequirements.some((r) => r.status === 'MATCHED');
      if (hasMatched) {
        return 'STATE_3_TUTOR_ACCEPTED';
      }
      const hasClosed = studentRequirements.some((r) => r.status === 'CLOSED');
      const allClosed = studentRequirements.every((r) => r.status === 'CLOSED');
      if (allClosed && hasClosed) {
        return 'STATE_4_COMPLETED';
      }
      return 'STATE_2_REQ_POSTED';
    }

    if (user?.role === 'TUTOR') {
      const percentage = getProfileCompletionPercentage();
      if (percentage < 80 || !tutorProfile?.pricing?.min) {
        return 'STATE_1_NEW_TUTOR';
      }
      const hasAccepted = tutorApplications.some((a) => a.status === 'ACCEPTED');
      if (hasAccepted) {
        return 'STATE_4_TUTOR_ACCEPTED';
      }
      if (tutorApplications.length > 0) {
        return 'STATE_3_APPS_SENT';
      }
      return 'STATE_2_READY_TO_APPLY';
    }

    return 'STATE_1_NEW_STUDENT';
  };

  const activeState = getActiveState();
  const currentAnnouncement =
    announcements[activeAnnounceIndex] || announcements[0] || DEFAULT_ANNOUNCEMENT;

  // Helper render for Right Sidebar Rotating Announcement Card
  const renderAnnouncementWidget = () => {
    if (!currentAnnouncement) return null;
    return (
      <div className="bg-white border border-[#dadee2] rounded-[14px] p-5  space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-black tracking-tight">
            {currentAnnouncement.type || 'Announcement'}
          </h3>
          <h3 className="text-sm font-semibold text-[#2d2d2d] leading-snug">
            {currentAnnouncement.title}
          </h3>
        </div>
        <p className="text-[12px] text-[#647380] leading-relaxed line-clamp-4">
          {currentAnnouncement.content}
        </p>
        <div className="text-[10px] text-[#b0b8c1]">
          Posted {new Date(currentAnnouncement.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  // Helper render for Educational Guides list
  const renderEducationalGuides = () => {
    return (
      <div className="bg-white border border-[#dadee2] rounded-[14px] p-6 space-y-4">
        <div className="space-y-1 pb-1">
          <h3 className="text-lg font-bold text-black tracking-tight">Learning Guides</h3>
          <span className="text-xs text-[#00A453] font-bold flex items-center gap-1 hover:underline cursor-pointer">
            Explore all Guides <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {MOCK_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="py-4 first:pt-0 last:pb-0 flex items-start gap-3.5 justify-between"
            >
              {/* Middle Column: Title & Category */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-black leading-snug break-words">
                  {article.title}
                </h4>
                <p className="text-[12px] text-[#647380] font-medium mt-1">
                  Category: {article.category}
                </p>
              </div>

              {/* Right Column: View / Read Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button className="bg-[#F4F6F8] hover:bg-gray-200 text-xs font-bold text-black px-3 py-1.5 rounded-full transition-colors">
                  Read
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // STUDENT STATES RENDERING
  // -------------------------------------------------------------

  // State 1 — New Student
  const renderNewStudent = () => {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white border border-[#dadee2] rounded-[14px] p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-[#2d2d2d]">
              Good Evening, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-sm text-[#647380] leading-relaxed">
              Find and hire a verified tutor in Noida or post your curriculum request to start.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/tutors" className="block">
              <Button
                variant="primary"
                className="w-full py-4 rounded-2xl text-xs gap-1.5 shadow-sm flex items-center justify-center font-extrabold transition-colors"
              >
                Find Tutors <Search className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/requirements/create" className="block">
              <Button
                variant="secondary"
                className="w-full py-4 rounded-2xl text-xs gap-1.5 shadow-sm flex items-center justify-center font-extrabold transition-colors border border-[#dadee2] bg-white text-[#2d2d2d] hover:bg-gray-50"
              >
                Post Requirement <Plus className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: How Project Tutor Works */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            How Project Tutor Works
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                num: '1',
                title: 'Post Requirement',
                desc: 'Detail subjects, levels, and your hourly budget.',
              },
              {
                num: '2',
                title: 'Tutors Apply',
                desc: 'Receive applications from matching verified educators.',
              },
              {
                num: '3',
                title: 'Hire & Chat',
                desc: 'Compare proposal credentials and start real-time classes.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white border border-[#dadee2] p-5 rounded-2xl space-y-2"
              >
                <span className="text-xs font-extrabold bg-[#e6f6ee] text-[#00A453] w-6 h-6 flex items-center justify-center rounded-full">
                  {step.num}
                </span>
                <h4 className="text-xs font-extrabold text-[#2d2d2d]">{step.title}</h4>
                <p className="text-[10px] text-[#647380] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Featured Tutors */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
              Featured Tutors
            </h3>
            <Link
              href="/dashboard/tutors"
              className="text-[10px] font-bold text-[#00A453] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_RECOMMENDED_TUTORS.map((tutor) => (
              <div
                key={tutor._id}
                className="bg-white border border-[#dadee2] p-4 rounded-2xl flex justify-between items-center hover:border-[#00A453] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e6f6ee] flex items-center justify-center font-bold text-[#00A453] text-xs shrink-0">
                    {getInitials(tutor.name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2d2d2d]">{tutor.name}</h4>
                    <p className="text-[9px] text-[#647380] mt-0.5">
                      {tutor.subjects.join(', ')} · {tutor.experience} Exp
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/tutors">
                  <Button
                    size="sm"
                    className="border border-[#dadee2] bg-white hover:bg-gray-50 text-[#2d2d2d] text-[10px] font-bold h-8 rounded-xl"
                  >
                    View Profile
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // State 2 — Requirement Posted
  const renderRequirementPosted = () => {
    // Top requirements
    const primaryReq = studentRequirements[0] || {};
    return (
      <div className="space-y-8">
        {/* Hero Banner */}
        <div className="bg-white border border-[#dadee2] rounded-[14px] p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold tracking-wider text-[#2d2d2d]">
                Active Requirement
              </span>
              <h2 className="text-lg font-extrabold text-[#2d2d2d]">
                Your {primaryReq.curriculum?.subject || primaryReq.category || 'Class'} Requirement
                is Live
              </h2>
            </div>
            <Link href={`/dashboard/requirements/${primaryReq._id}`}>
              <Button className="bg-[#00060c] hover:bg-slate-800 text-white text-xs font-extrabold px-5 py-4 rounded-2xl shadow-sm">
                View Applications
              </Button>
            </Link>
          </div>

          {/* Stepper progress */}
          <div className="border-t border-[#dadee2] pt-5">
            <span className="text-xs text-[#b0b8c1] block font-extrabold uppercase tracking-wider mb-3">
              Hiring Progress
            </span>
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-[#00A453] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Post Live
              </span>
              <span className="text-[#00A453] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Applications Received
              </span>
              <span className="text-[#d97706] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Review Tutors
              </span>
              <span className="text-[#dadee2]">Hire Tutor</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            AI Recommended Matches
          </h3>
          <div className="flex flex-col gap-3">
            {MOCK_RECOMMENDED_TUTORS.map((tutor) => (
              <div
                key={tutor._id}
                className="bg-white border border-[#dadee2] rounded-[14px] p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-[#2d2d2d] text-xs">
                      {getInitials(tutor.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#2d2d2d]">{tutor.name}</h4>
                      <p className="text-xs text-[#647380]">{tutor.experience} Experience</p>
                    </div>
                  </div>
                  <span className="text-xs bg-[#e6f6ee] text-[#00A453] font-extrabold px-2.5 py-1 rounded-full">
                    98% Match
                  </span>
                </div>
                <div className="text-xs text-[#647380]">
                  Proposed budget:{' '}
                  <span className="font-extrabold text-[#2d2d2d]">₹{tutor.hourlyRate}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            Recently Active Tutors
          </h3>
          <div className="bg-white border border-[#dadee2] rounded-[14px] divide-y divide-gray-100 overflow-hidden ">
            {MOCK_ACTIVE_TUTORS.map((tutor) => (
              <div key={tutor._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e6f6ee] flex items-center justify-center font-bold text-xs text-[#00A453]">
                    {getInitials(tutor.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#2d2d2d]">{tutor.name}</h4>
                    <span className="text-xs text-[#647380]">{tutor.subjects.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#b28b00]">
                  <Star className="w-3.5 h-3.5 fill-[#b28b00]" /> {tutor.ratingAvg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // State 3 — Tutor Accepted
  const renderStudentAccepted = () => {
    const displayTutors =
      hiredTutors.length > 0
        ? hiredTutors
        : [
            {
              _id: 'mock-hired-1',
              name: 'Dr. Rahul Sharma',
              qualifications: ['PhD in Physics'],
              experience: '8 Yrs',
              subjects: ['Physics', 'Mathematics'],
              subjectName: 'Physics (Class 12)',
              hourlyRate: 800,
              teachingMode: ['Home', 'Online'],
              verified: true,
            },
          ];

    return (
      <div className="space-y-6">
        {/* Congratulations Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#F0FBF6] via-[#E6F6EE] to-[#F0FBF6] text-black rounded-3xl p-8 border border-[#b2e2cb]">
          {/* Abstract background shapes */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-[#b2e2cb]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-[#d1f2e1]/30 rounded-full blur-2xl pointer-events-none" />

          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00A45318_1px,transparent_1px),linear-gradient(to_bottom,#00A45318_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#00A453] border border-[#b2e2cb] bg-[#e6f6ee] px-3 py-1 rounded-full inline-block">
                Hiring Completed
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-[#1b4332] mt-2">
                Congratulations!
              </h2>
              <p className="text-sm text-[#2d2d2d] leading-relaxed max-w-sm">
                You accepted a tutor's proposal. The locked conversation is now active.
              </p>
            </div>
            <Link href="/dashboard/messages" className="inline-block">
              <Button className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-[12px] px-6 h-10 rounded-2xl flex items-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-95">
                Start Chatting <MessageSquareText className="w-4 h-4 shrink-0" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Accepted Tutors Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-[#2d2d2d] tracking-tight px-1">
            My Accepted Tutors
          </h3>

          <div className="space-y-6">
            {displayTutors.map((tutor) => (
              <div
                key={tutor._id}
                className="bg-white border border-[#dadee2] rounded-[14px] flex overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Right content side */}
                <div className="flex-1 p-5 space-y-4">
                  <div className="flex justify-between w-full items-start">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-xs uppercase shrink-0">
                        {tutor.name
                          ? tutor.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)
                          : 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-[#2d2d2d]">{tutor.name}</h4>
                          {tutor.verified !== false && (
                            <ShieldCheck className="w-4 h-4 text-white fill-black shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#647380] font-semibold mt-0.5">
                          {tutor.qualifications?.join(', ') || tutor.qualifications?.[0] || 'PhD'} ·{' '}
                          {tutor.experience || '8 Years'} Experience
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-[10px] text-emerald-600 font-extrabold bg-[#e6f6ee] px-2.5 py-1 rounded-md border border-[#b2e2cb] uppercase tracking-wider">
                        Active Match
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-[#dadee2]/60" />

                  {/* Highlighted match detail lists */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs font-semibold text-[#647380]">
                    <div className="flex items-center gap-1.5">
                      <BookOpenCheck className="h-4 text-[#00A453] shrink-0" />
                      <span>Matched for:</span>
                      <span className="font-extrabold text-[#2d2d2d]">
                        {tutor.subjectName || 'Physics (Class 12)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-[#00A453] shrink-0" />
                      <span>Proposed rate:</span>
                      <span className="font-extrabold text-[#2d2d2d]">
                        ₹{tutor.hourlyRate || tutor.pricing?.min || 800}/hr
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Video className="w-4 text-[#00A453] shrink-0" />
                      <span>Format:</span>
                      <span className="font-extrabold text-[#2d2d2d]">
                        {tutor.teachingMode?.join('/') || 'Online/Home'}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-[#dadee2]/60" />

                  {/* Bottom Actions button bar */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Link href="/dashboard/messages">
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs font-extrabold  bg-white text-[#2d2d2d] hover:bg-gray-50 rounded-xl flex items-center gap-1.5 "
                        >
                          <MessageSquareText className="w-4 h-4  shrink-0" />
                          Message
                        </Button>
                      </Link>
                      <Button className="bg-[#00060c] hover:bg-slate-800 text-white font-extrabold text-xs h-8 px-3 rounded-xl flex items-center gap-1 ">
                        Rate Tutor <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // State 4 — Completed
  const renderStudentCompleted = () => {
    return (
      <div className="space-y-8">
        {/* Completed Hero */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-8 shadow-sm space-y-5 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-gray-100">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#2d2d2d]">Hiring Goal Achieved</h2>
            <p className="text-xs text-[#647380] max-w-sm mx-auto leading-relaxed">
              Your requirement is completed. Please rate your tutor's demo lessons to maintain
              verification standards.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            <Button className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-[10px] px-4 rounded-xl">
              Rate Tutor
            </Button>
            <Link href="/dashboard/tutors">
              <Button className="border border-[#dadee2] bg-white text-[#2d2d2d] hover:bg-gray-50 font-bold text-[10px] px-4 rounded-xl">
                Book Again
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // TUTOR STATES RENDERING
  // -------------------------------------------------------------

  // State 1 — New Tutor
  const renderNewTutor = () => {
    const completion = getProfileCompletionPercentage();
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-extrabold text-[#2d2d2d]">Complete your onboarding</h2>
            <p className="text-xs text-[#647380] leading-relaxed">
              A complete profile appears higher in search indexes and gets 4x more parent
              invitations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#647380]">Profile Completion</span>
              <span className="text-[#00A453]">{completion}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#00A453] h-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <Link href="/profile" className="block pt-2">
            <Button className="bg-[#00060c] hover:bg-slate-800 text-white text-[10px] font-extrabold px-6 rounded-xl">
              Finish Profile Onboarding
            </Button>
          </Link>
        </div>

        {/* popular requirements fallback */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            Top Subjects on Platform
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['CBSE Math', 'JEE Physics', 'NEET Biology', 'React coding', 'English Spoken'].map(
              (cat) => (
                <div
                  key={cat}
                  className="bg-white border border-[#dadee2] p-4 rounded-2xl text-center"
                >
                  <span className="text-[10px] font-extrabold text-[#2d2d2d] block">{cat}</span>
                  <span className="text-[9px] text-[#647380] mt-1 block">High Demand</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // State 2 — Ready to Apply
  const renderTutorReady = () => {
    return (
      <div className="space-y-8">
        {/* Hero section */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-8 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-base font-extrabold text-[#2d2d2d]">You are ready to apply!</h2>
            <p className="text-xs text-[#647380] leading-relaxed">
              We found matching student requirements that fit your subjects expertise in Noida.
            </p>
          </div>
          <Link href="/dashboard/requirements/browse" className="block">
            <Button className="bg-[#00A453] hover:bg-[#008A45] text-white text-[10px] font-bold px-6 rounded-xl h-9">
              View Student Requirements Marketplace
            </Button>
          </Link>
        </div>

        {/* Nearby Requirements list */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            Recommended Requirements
          </h3>
          <div className="space-y-4">
            {recommendations.slice(0, 2).map((req) => (
              <div
                key={req._id}
                className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#2d2d2d]">
                    {req.curriculum?.subject || req.category}
                  </span>
                  <span className="text-[9px] text-[#00A453] font-bold bg-[#e6f6ee] px-2 py-0.5 rounded-full border border-[#00A453]/25">
                    95% Match
                  </span>
                </div>
                <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-2">
                  {req.description}
                </p>
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <span className="text-xs font-extrabold text-[#2d2d2d]">
                    ₹{req.budget?.min} - ₹{req.budget?.max}/hr
                  </span>
                  <Link href={`/dashboard/requirements/${req._id}`}>
                    <Button
                      size="sm"
                      className="bg-[#00060c] hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl px-4"
                    >
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // State 3 — Applications Sent
  const renderTutorApplied = () => {
    // Count views and accepts
    const sentCount = tutorApplications.length;
    const viewedCount = tutorApplications.filter((a) => a.isViewed).length;
    const acceptedCount = tutorApplications.filter((a) => a.status === 'ACCEPTED').length;

    return (
      <div className="space-y-8">
        {/* Analytics Hero */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#647380]">
              Application Analytics
            </span>
            <h2 className="text-base font-extrabold text-[#2d2d2d]">Applications Tracking</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[9px] text-[#647380] font-bold block uppercase">Sent</span>
              <span className="text-base font-extrabold text-[#2d2d2d] block mt-1">
                {sentCount}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[9px] text-[#647380] font-bold block uppercase">Viewed</span>
              <span className="text-base font-extrabold text-[#2d2d2d] block mt-1">
                {viewedCount}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[9px] text-[#647380] font-bold block uppercase">Accepted</span>
              <span className="text-base font-extrabold text-[#00A453] block mt-1">
                {acceptedCount}
              </span>
            </div>
          </div>
        </div>

        {/* My Applications List */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            Submitted Applications
          </h3>
          <div className="bg-white border border-[#dadee2] rounded-3xl divide-y divide-gray-100 overflow-hidden shadow-sm">
            {tutorApplications.map((app) => (
              <div key={app._id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#2d2d2d]">
                    {app.requirementId?.curriculum?.subject || 'Class Subject'}
                  </h4>
                  <span className="text-[9px] text-[#647380] capitalize mt-0.5 block">
                    Status: {app.status?.toLowerCase()}
                  </span>
                </div>
                <span
                  className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                    app.status === 'ACCEPTED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // State 4 — Tutor Accepted
  const renderTutorAccepted = () => {
    return (
      <div className="space-y-8">
        {/* Congratulations Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#F0FBF6] via-[#E6F6EE] to-[#F0FBF6] text-black rounded-3xl p-8 border border-[#b2e2cb]">
          {/* Abstract background shapes */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-[#b2e2cb]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-[#d1f2e1]/30 rounded-full blur-2xl pointer-events-none" />

          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00A45318_1px,transparent_1px),linear-gradient(to_bottom,#00A45318_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#00A453] border border-[#b2e2cb] bg-[#e6f6ee] px-3 py-1 rounded-full inline-block">
                Hired Match
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-[#1b4332] mt-2">
                Congratulations!
              </h2>
              <p className="text-sm text-[#2d2d2d] leading-relaxed max-w-sm">
                A student accepted your proposal! Click below to open chat and schedule the first
                class.
              </p>
            </div>
            <Link href="/dashboard/messages" className="inline-block">
              <Button className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-[12px] px-6 h-10 rounded-2xl flex items-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-95">
                Open Chat <MessageSquareText className="w-4 h-4 shrink-0" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Teaching Schedule strip */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#dadee2] p-5 rounded-3xl space-y-2">
            <span className="text-[9px] text-[#647380] uppercase tracking-wider font-extrabold block">
              Today's Schedule
            </span>
            <div className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" /> 5:30 PM - Noida Home
            </div>
            <span className="text-[10px] text-[#647380] block">Class 10 CBSE Math lesson</span>
          </div>

          <div className="bg-white border border-[#dadee2] p-5 rounded-3xl space-y-2">
            <span className="text-[9px] text-[#647380] uppercase tracking-wider font-extrabold block">
              Earnings Summary
            </span>
            <div className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> ₹3,400 earned
            </div>
            <span className="text-[10px] text-[#647380] block">
              Payout releases on monthly cycle
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 py-6 bg-[#FAFAFA] min-h-screen text-[#2d2d2d] relative">
      {/* LEFT COLUMN: ACTIVE ROLE IDENTITY SUMMARY */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-[#dadee2] rounded-[18px] p-6 space-y-5">
          <div className="flex items-start gap-4">
            {/* Avatar circle (RR) on the left */}
            <div className="w-14 h-14 rounded-full bg-[#e6f6ee] border border-[#b2e2cb] flex items-center justify-center font-extrabold text-[#00A453] text-lg select-none shrink-0 shadow-sm">
              {getInitials()}
            </div>

            {/* Details stacked on the right */}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <span className="text-[12px] py-2 text-[#647380] block font-medium leading-tight">
                  Post requirements as
                </span>
                <span className="text-sm font-extrabold text-[#2d2d2d] leading-snug block truncate capitalize">
                  {user?.name}
                </span>
              </div>

              {user?.phone && (
                <div className="flex items-center gap-1  flex-wrap">
                  <span className="text-xs text-[#2d2d2d] font-semibold">{user.phone}</span>
                  {user.isPhoneVerified && (
                    <ShieldCheck className="w-4 h-4 text-white fill-black shrink-0" />
                  )}
                </div>
              )}

              <div className="text-xs  text-[#647380] font-medium capitalize">
                {user?.city || 'noida'}
              </div>
            </div>
          </div>

          {/* Quick CTA to create posts if Student */}
          {user?.role === 'STUDENT' && (
            <Link
              href="/dashboard/requirements/create"
              className="block border-t border-[#dadee2] pt-4"
            >
              <Button className="w-full bg-black hover:bg-neutral-900 text-white font-bold rounded-2xl py-4 text-xs gap-1.5">
                Post Requirement <Plus className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}

          {/* Onboarding checklist if Tutor */}
          {user?.role === 'TUTOR' && tutorProfile && (
            <div className="border-t border-[#dadee2] pt-4 text-[14px] text-[#647380] space-y-2">
              <span className="font-bold text-[#2d2d2d] ">Verification Status</span>
              <div className="flex items-center gap-1.5 pt-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Phone verified
              </div>
              <div className="flex items-center gap-1.5">
                {tutorProfile.verified ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                Profile Verification {tutorProfile.verified ? 'Complete' : 'Pending Review'}
              </div>
            </div>
          )}
        </div>

        {/* Platform stats for Students or list of active applications */}
        {user?.role === 'STUDENT' && studentRequirements.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-[#2d2d2d] tracking-tight">My Requests</h3>
            <div className="space-y-3">
              {studentRequirements.slice(0, 3).map((req) => (
                <Link
                  key={req._id}
                  href={`/dashboard/requirements/${req._id}`}
                  className="flex items-center gap-2  p-3  rounded-2xl border-transparent"
                >
                  <div className="flex items-center min-w-0">
                    <span className="text-xs font-bold text-[#2d2d2d] truncate">
                      {req.curriculum?.subject || req.category}
                    </span>
                  </div>
                  <span className="bg-black text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                    {req.applicationsCount || 0}
                  </span>
                </Link>
              ))}

              <div className="pt-2">
                <Link href="/dashboard/requirements" className="inline-block">
                  <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[11px] font-extrabold text-black border border-black rounded-full px-5 py-2 transition-all active:scale-95 shadow-sm relative">
                    <Compass className="w-4 h-4 text-black" />
                    Explore Requirements
                    <span className="w-4 h-4 rounded-full bg-[#00A453] absolute -right-1.5 top-2 animate-pulse" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER DYNAMIC MAIN AREA */}
      <div className="lg:col-span-2 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 text-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-[#00A453] border-t-transparent rounded-full" />
            <span className="text-xs text-[#647380]">Syncing dashboard status...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-3xl p-6 text-xs font-bold text-center">
            {error}
          </div>
        ) : (
          <>
            {/* Student state branches */}
            {user?.role === 'STUDENT' && (
              <>
                {activeState === 'STATE_1_NEW_STUDENT' && renderNewStudent()}
                {activeState === 'STATE_2_REQ_POSTED' && renderRequirementPosted()}
                {activeState === 'STATE_3_TUTOR_ACCEPTED' && renderStudentAccepted()}
                {activeState === 'STATE_4_COMPLETED' && renderStudentCompleted()}
              </>
            )}

            {/* Tutor state branches */}
            {user?.role === 'TUTOR' && (
              <>
                {activeState === 'STATE_1_NEW_TUTOR' && renderNewTutor()}
                {activeState === 'STATE_2_READY_TO_APPLY' && renderTutorReady()}
                {activeState === 'STATE_3_APPS_SENT' && renderTutorApplied()}
                {activeState === 'STATE_4_TUTOR_ACCEPTED' && renderTutorAccepted()}
              </>
            )}
          </>
        )}
      </div>

      {/* RIGHT COLUMN: ROTATING ANNOUNCEMENTS & ARTICLES */}
      <div className="lg:col-span-1 space-y-6">
        {renderAnnouncementWidget()}
        {renderEducationalGuides()}
      </div>
    </div>
  );
}
