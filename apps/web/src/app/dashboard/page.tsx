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
  const [hiredTutor, setHiredTutor] = useState<any>(null);

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
        // If a requirement has status MATCHED, load hired tutor details
        const matched = reqsRes.data.find((r: any) => r.status === 'MATCHED');
        if (matched && matched.acceptedTutorId) {
          try {
            const tutorRes = await profileApi.getPublicTutorProfile(matched.acceptedTutorId, token);
            if (tutorRes.success && tutorRes.data) {
              setHiredTutor(tutorRes.data);
            }
          } catch (e) {
            console.error('Failed to load matched tutor public profile details:', e);
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
  const currentAnnouncement = announcements[activeAnnounceIndex] || announcements[0];

  // Helper render for Right Sidebar Rotating Announcement Card
  const renderAnnouncementWidget = () => {
    if (!currentAnnouncement) return null;
    return (
      <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#00A453] bg-[#e6f6ee] px-2 py-0.5 rounded-full inline-block border border-emerald-100">
            {currentAnnouncement.type || 'Announcement'}
          </span>
          <h3 className="text-xs font-extrabold text-[#2d2d2d] leading-snug">
            {currentAnnouncement.title}
          </h3>
        </div>
        <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-4">
          {currentAnnouncement.content}
        </p>
        <div className="text-[9px] text-[#b0b8c1]">
          Posted {new Date(currentAnnouncement.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  // Helper render for Educational Guides list
  const renderEducationalGuides = () => {
    return (
      <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
          Learning Guides
        </h3>
        <div className="space-y-4">
          {MOCK_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="space-y-1 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-[9px] font-bold text-[#00A453]">{article.category}</span>
              <h4 className="text-xs font-extrabold text-[#2d2d2d] leading-snug">
                {article.title}
              </h4>
              <span className="text-[9px] text-[#b0b8c1] block">{article.readTime}</span>
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
        <div className="bg-white border border-[#dadee2] rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-[#2d2d2d]">
              Good Evening, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-xs text-[#647380] leading-relaxed">
              Find and hire a verified tutor in Noida or post your curriculum request to start.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/tutors" className="block">
              <button className="w-full bg-[#00A453] hover:bg-[#008A45] text-white font-extrabold rounded-2xl py-4 text-xs gap-1.5 shadow-sm flex items-center justify-center transition-colors">
                Find Tutors <Search className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard/requirements/create" className="block">
              <button className="w-full border border-[#dadee2] hover:bg-gray-50 text-[#2d2d2d] font-extrabold rounded-2xl py-4 text-xs gap-1.5 shadow-sm flex items-center justify-center bg-white transition-colors">
                Post Requirement <Plus className="w-4 h-4" />
              </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_RECOMMENDED_TUTORS.map((tutor) => (
              <div
                key={tutor._id}
                className="bg-white border border-[#dadee2] p-5 rounded-3xl flex justify-between items-center shadow-sm"
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
        <div className="bg-white border border-[#dadee2] rounded-3xl p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Active Requirement
              </span>
              <h2 className="text-base font-extrabold text-[#2d2d2d]">
                Your {primaryReq.curriculum?.subject || primaryReq.category || 'Class'} Requirement
                is Live
              </h2>
            </div>
            <Link href={`/dashboard/requirements/${primaryReq._id}`}>
              <Button className="bg-[#00060c] hover:bg-slate-800 text-white text-[10px] font-bold h-9 rounded-xl">
                View Applications
              </Button>
            </Link>
          </div>

          {/* Stepper progress */}
          <div className="border-t border-[#dadee2] pt-4 mt-2">
            <span className="text-[9px] text-[#b0b8c1] block font-extrabold uppercase tracking-wider mb-2">
              Hiring Progress
            </span>
            <div className="flex items-center justify-between text-[9px] text-[#647380] font-bold">
              <span className="text-[#00A453] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Post Live
              </span>
              <span className="text-[#00A453] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Applications Received
              </span>
              <span className="text-[#2d2d2d] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Review Tutors
              </span>
              <span className="text-gray-300">Hire Tutor</span>
            </div>
          </div>
        </div>

        {/* Section 2: Recommended Tutors (AI match based on requirement parameters) */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            AI Recommended Matches
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {MOCK_RECOMMENDED_TUTORS.map((tutor) => (
              <div
                key={tutor._id}
                className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-[#2d2d2d] text-[10px]">
                      {getInitials(tutor.name)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-[#2d2d2d]">{tutor.name}</h4>
                      <p className="text-[9px] text-[#647380]">{tutor.experience} Experience</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded-full">
                    98% Match
                  </span>
                </div>
                <div className="text-[10px] text-[#647380]">
                  Proposed budget:{' '}
                  <span className="font-extrabold text-[#2d2d2d]">₹{tutor.hourlyRate}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Recently Active Tutors */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
            Recently Active Tutors
          </h3>
          <div className="bg-white border border-[#dadee2] rounded-3xl divide-y divide-gray-100 overflow-hidden shadow-sm">
            {MOCK_ACTIVE_TUTORS.map((tutor) => (
              <div key={tutor._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f4f7f6] flex items-center justify-center font-bold text-xs text-[#00A453]">
                    {getInitials(tutor.name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2d2d2d]">{tutor.name}</h4>
                    <span className="text-[9px] text-[#647380]">{tutor.subjects.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#b28b00]">
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
    const displayTutor = hiredTutor || MOCK_RECOMMENDED_TUTORS[0];
    return (
      <div className="space-y-6">
        {/* Congratulations Hero */}
        <div className="bg-emerald-600/90 text-white rounded-3xl p-8 shadow-sm space-y-5">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full inline-block">
              Hiring Completed
            </span>
            <h2 className="text-lg font-extrabold">Congratulations!</h2>
            <p className="text-xs text-emerald-50/95 leading-relaxed max-w-sm">
              You accepted a tutor's proposal. The locked conversation is now active.
            </p>
          </div>
          <Link href="/dashboard/messages" className="inline-block">
            <Button className="bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-6 py-3 rounded-2xl h-10 flex items-center gap-1 shadow-sm">
              Start Chatting <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Hired Tutor Card */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <UserCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
              Your Hired Tutor
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e6f6ee] flex items-center justify-center font-bold text-emerald-700 text-base border border-emerald-100 shrink-0 animate-bounce">
                {getInitials(displayTutor.name)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-[#2d2d2d]">{displayTutor.name}</h4>
                  <span className="flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200/50">
                    <CheckCircle className="w-2.5 h-2.5 shrink-0 text-emerald-600" /> VERIFIED
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#647380] font-semibold">
                  <span>🎓 {displayTutor.qualifications?.join(', ') || 'PhD in Mathematics'}</span>
                  <span>·</span>
                  <span>💼 {displayTutor.experience || '8 Years'} Exp</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(displayTutor.subjects || ['Mathematics', 'Physics']).map(
                    (sub: string | any) => (
                      <span
                        key={typeof sub === 'string' ? sub : sub.subject}
                        className="text-[9px] bg-gray-50 border border-gray-100 text-[#2d2d2d] font-bold px-2 py-0.5 rounded-lg"
                      >
                        {typeof sub === 'string' ? sub : sub.subject}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[9px] text-[#b0b8c1] block uppercase tracking-wider font-extrabold">
                Proposed rate
              </span>
              <span className="text-sm font-extrabold text-[#2d2d2d]">
                ₹{displayTutor.hourlyRate || displayTutor.pricing?.min || 800}
                <span className="text-[10px] font-bold text-[#647380]">/hr</span>
              </span>
              <div className="text-[9px] text-[#647380] mt-1 font-bold">
                Teaching Format: {displayTutor.teachingMode?.join('/') || 'Online/Home'}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#dadee2] p-5 rounded-3xl space-y-2">
            <span className="text-[9px] text-[#647380] uppercase tracking-wider font-extrabold block">
              Upcoming Classes
            </span>
            <div className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> Monday 5:00 PM
            </div>
            <span className="text-[10px] text-[#647380] block">Algebra Foundations demo class</span>
          </div>

          <div className="bg-white border border-[#dadee2] p-5 rounded-3xl space-y-2">
            <span className="text-[9px] text-[#647380] uppercase tracking-wider font-extrabold block">
              Active Homework
            </span>
            <div className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" /> Quadratic Equations
            </div>
            <span className="text-[10px] text-[#647380] block">Prepare exercises 3 & 4</span>
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
        <div className="bg-[#00A453] text-white rounded-3xl p-8 shadow-sm space-y-5">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-[#008A45] text-white px-2 py-0.5 rounded-full inline-block">
              Hired Match
            </span>
            <h2 className="text-lg font-extrabold">Congratulations!</h2>
            <p className="text-xs text-emerald-50/95 leading-relaxed">
              A student accepted your proposal! Click below to open chat and schedule the first
              class.
            </p>
          </div>
          <Link href="/dashboard/messages" className="inline-block">
            <Button className="bg-white hover:bg-emerald-50 text-[#00A453] font-bold text-[10px] px-6 h-10 rounded-2xl shadow-sm flex items-center gap-1.5">
              Open Chat <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          </Link>
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
        <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e6f6ee] border border-[#dadee2] flex items-center justify-center font-bold text-[#00A453] text-sm select-none">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#647380] block leading-tight capitalize">
                {user?.role?.toLowerCase()} Profile
              </span>
              <span className="text-xs font-bold text-[#2d2d2d] truncate block">{user?.name}</span>
            </div>
          </div>

          {/* Quick CTA to create posts if Student */}
          {user?.role === 'STUDENT' && (
            <Link
              href="/dashboard/requirements/create"
              className="block border-t border-[#dadee2] pt-4"
            >
              <Button className="w-full bg-[#00A453] hover:bg-[#008A45] text-white font-bold rounded-2xl py-4 text-xs gap-1.5">
                Post Requirement <Plus className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}

          {/* Onboarding checklist if Tutor */}
          {user?.role === 'TUTOR' && tutorProfile && (
            <div className="border-t border-[#dadee2] pt-4 text-[10px] text-[#647380] space-y-2">
              <span className="font-extrabold text-[#2d2d2d] uppercase">Verification Status</span>
              <div className="flex items-center gap-1.5">
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
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
              Recent Requests
            </h3>
            <div className="bg-white border border-[#dadee2] rounded-3xl p-4 shadow-sm space-y-2">
              {studentRequirements.slice(0, 3).map((req) => (
                <Link
                  key={req._id}
                  href={`/dashboard/requirements/${req._id}`}
                  className="block p-2 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <span className="text-xs font-bold text-[#2d2d2d] block truncate">
                    {req.curriculum?.subject || req.category}
                  </span>
                  <span className="text-[9px] text-[#00A453] font-bold block mt-0.5">
                    {req.applicationsCount || 0} applications received
                  </span>
                </Link>
              ))}
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
