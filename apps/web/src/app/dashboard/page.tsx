'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import {
  Search,
  Plus,
  Compass,
  MoreHorizontal,
  ChevronDown,
  ArrowRight,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  Award,
  BookMarked,
  Info,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requirementApi, profileApi, recommendationApi } from '@/lib/api';

// Mock list of "My Subjects" for Students (Grapevine's "My Bowls")
const MY_SUBJECTS = [
  { name: 'Mathematics', count: '12+' },
  { name: 'Web Development', count: '4' },
  { name: 'Physics (Class 12)', count: '99+' },
  { name: 'English Spoken', count: '2' },
];

// Mock list of tutors for the Student's right sidebar (Grapevine's "Bowls for you")
const SUGGESTED_TUTORS = [
  {
    id: 'tutor-1',
    initials: 'AK',
    name: 'Amit Kumar',
    tag: 'IIT Delhi · Physics expert',
    students: '1.2K',
    role: 'Tutor',
  },
  {
    id: 'tutor-2',
    initials: 'SS',
    name: 'Sanjana Sen',
    tag: 'LSR · English Literature',
    students: '450',
    role: 'Tutor',
  },
  {
    id: 'tutor-3',
    initials: 'RG',
    name: 'Rohan Gupta',
    tag: 'Google SWE · Programming',
    students: '3.1K',
    role: 'Tutor',
  },
];

// Mock list of recent requirements in the Student's feed
const STUDENT_FEED_POSTS = [
  {
    id: 'req-1',
    subject: 'Mathematics (CBSE)',
    studentName: 'Anonymous Student',
    role: 'Class 10 Student',
    time: '2h',
    budget: '₹500 - ₹800 / Hr',
    description:
      'Looking for a mathematics tutor who can teach Class 10 CBSE Board syllabus. Need home tuition in Andheri West. Focus on trigonometry and calculus fundamentals.',
    reactions: '5 tutors interested',
  },
  {
    id: 'req-2',
    subject: 'React.js & Next.js Development',
    studentName: 'Anonymous Student',
    role: 'College Student',
    time: '1d',
    budget: '₹800 - ₹1200 / Hr',
    description:
      'Need help with React context API, state management, and SSR deployment in Next.js. Beginner to intermediate level. Online sessions only. Weekly 3 days.',
    reactions: '12 tutors interested',
  },
];

// Tutor feed tips
const PLATFORM_TIPS = [
  {
    id: 'tip-1',
    title: 'How to write a winning tutor profile?',
    desc: 'Tutors with completed qualifications and structured hourly pricing get 4x more direct student contacts.',
    icon: Sparkles,
  },
  {
    id: 'tip-2',
    title: 'Preparing for demo sessions',
    desc: 'Always align on syllabus benchmarks during the free 30-min discovery call before charging.',
    icon: Info,
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  // Tutor states
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<{
    recommended: any[];
    recent: any[];
    nearby: any[];
    highBudget: any[];
    explore: any[];
  }>({
    recommended: [],
    recent: [],
    nearby: [],
    highBudget: [],
    explore: [],
  });

  const [activeTab, setActiveTab] = useState<
    'recommended' | 'recent' | 'nearby' | 'high-budget' | 'explore'
  >('recommended');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTutorData = useCallback(async () => {
    if (!token || user?.role !== 'TUTOR') return;
    setLoading(true);
    setProfileLoading(true);
    setError('');

    try {
      // Get tutor profile
      const profRes = await profileApi.getTutorProfile(token);
      if (profRes.success && profRes.data) {
        setTutorProfile(profRes.data);
      }

      // Get home recommendations sections mapping
      const recRes = await recommendationApi.getHomeRecommendations(token);
      if (recRes.success) {
        setRecommendations({
          recommended: recRes.recommended || [],
          recent: recRes.recent || [],
          nearby: recRes.nearby || [],
          highBudget: recRes.highBudget || [],
          explore: recRes.explore || [],
        });
      } else {
        setError(recRes.error || recRes.message || 'Failed to fetch recommendations.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading recommendation data.');
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchTutorData();
  }, [fetchTutorData]);

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendations.recommended;
      case 'recent':
        return recommendations.recent;
      case 'nearby':
        return recommendations.nearby;
      case 'high-budget':
        return recommendations.highBudget;
      case 'explore':
        return recommendations.explore;
      default:
        return [];
    }
  };

  // -------------------------------------------------------------
  // RENDERING RISHU'S DYNAMIC FEED FOR TUTORS
  // -------------------------------------------------------------
  if (user?.role === 'TUTOR') {
    const list = getActiveList();

    return (
      <div className="max-w-[1250px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 py-6 bg-[#FAFAFA] min-h-screen text-[#2d2d2d]">
        {/* LEFT COLUMN: TUTOR SUMMARY INFO */}
        <div className="md:col-span-1 space-y-6">
          {/* Summary Card */}
          <div className="bg-white border border-[#eef1f4] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center font-bold text-[#00A453] text-sm select-none">
                {getInitials()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-[#647380] block leading-tight">Logged in as</span>
                <span className="text-sm font-bold text-[#2d2d2d] truncate block">{user.name}</span>
                <span className="text-[10px] text-[#00A453] font-semibold bg-[#e6f6ee] px-1.5 py-0.5 rounded mt-1 inline-block">
                  Verified Tutor
                </span>
              </div>
            </div>

            {/* Profile info list */}
            {profileLoading ? (
              <div className="space-y-2 py-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
              </div>
            ) : tutorProfile ? (
              <div className="space-y-3.5 pt-3 border-t border-gray-100 text-xs">
                <div className="space-y-1">
                  <span className="text-[#647380] block font-semibold">City & Location</span>
                  <span className="font-bold text-[#2d2d2d] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {tutorProfile.location?.area || 'Not Set'},{' '}
                    {tutorProfile.location?.city || 'Not Set'}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[#647380] block font-semibold">Teaching Modes</span>
                  <span className="font-bold text-[#2d2d2d]">
                    {tutorProfile.teachingModes?.join(' · ') || 'None Selected'}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[#647380] block font-semibold">Pricing Rates</span>
                  <span className="font-bold text-[#2d2d2d]">
                    ₹{tutorProfile.pricing?.min} - ₹{tutorProfile.pricing?.max} / Hr
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100 text-center space-y-2">
                <p className="text-xs text-[#647380]">
                  Complete your onboarding to match with students.
                </p>
                <Link href="/profile">
                  <Button
                    size="sm"
                    className="bg-[#00060c] text-white hover:bg-slate-800 text-xs w-full py-2"
                  >
                    Complete Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Subjects Taught List */}
          {tutorProfile?.subjects && tutorProfile.subjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#2d2d2d] px-1">My Expertise</h3>
              <div className="space-y-2">
                {tutorProfile.subjects.map((sub: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border border-[#eef1f4] rounded-xl text-xs font-semibold text-[#384148]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm shrink-0">🎓</span>
                      <span className="truncate">{sub.subject}</span>
                    </div>
                    <span className="text-[10px] text-[#647380] bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {sub.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/dashboard/requirements/browse" className="block">
            <button className="w-full flex items-center justify-center gap-1.5 py-3 border border-[#dadee2] rounded-xl text-xs font-bold text-[#384148] bg-white hover:bg-gray-50 transition-colors">
              <Compass className="w-4 h-4 text-[#00A453]" /> Search All Requirements
            </button>
          </Link>
        </div>

        {/* CENTER FEED: MODULAR RECOMMENDATIONS ENGINE (80% weight) */}
        <div className="md:col-span-2 space-y-5">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#647380]" />
            <Link href="/dashboard/requirements/browse" className="block">
              <input
                type="text"
                readOnly
                placeholder="Search other subjects or open requirements..."
                className="w-full pl-12 pr-4 py-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-sm rounded-full border border-transparent cursor-pointer focus:outline-none transition-all placeholder-[#647380]"
              />
            </Link>
          </div>

          {/* Section Recommendation Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-gray-100">
            {[
              { id: 'recommended', label: '⭐ Recommended' },
              { id: 'recent', label: '📅 Recently Posted' },
              { id: 'nearby', label: '📍 Nearby Matches' },
              { id: 'high-budget', label: '💰 High Budget' },
              { id: 'explore', label: '🎨 Explore More' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 text-xs font-bold rounded-full transition-all shrink-0 select-none ${
                    isActive
                      ? 'bg-[#00060c] text-white shadow-sm'
                      : 'bg-white border border-[#dadee2] text-[#647380] hover:text-[#2d2d2d]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Matched Requirement listings */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#eef1f4] rounded-2xl p-6 space-y-4 shadow-sm animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                      <div className="space-y-1.5 py-1">
                        <div className="h-3 bg-gray-100 rounded w-28"></div>
                        <div className="h-2 bg-gray-100 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded w-8"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold">
              ⚠️ {error}
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white border border-[#dadee2] rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#f4f7f6] border border-[#00A453]/10 rounded-full flex items-center justify-center mx-auto text-2xl">
                🔎
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-extrabold text-[#2d2d2d]">
                  No Matches in this Section
                </h3>
                <p className="text-xs text-[#647380] leading-relaxed font-medium">
                  {activeTab === 'recommended' &&
                    'Complete your onboarding and select subjects to see targeted matches.'}
                  {activeTab === 'nearby' &&
                    "We couldn't find active local Home Tuition requirements matching your registered city."}
                  {activeTab === 'high-budget' &&
                    'No premium high budget tutoring contracts currently listed.'}
                  {activeTab === 'explore' &&
                    'All listed requirements match your profile subjects. Browse requirements for all topics.'}
                  {activeTab === 'recent' &&
                    'No active student learning requirements registered recently.'}
                </p>
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-2">
                  <Link href="/profile">
                    <Button
                      variant="secondary"
                      className="border-[#dadee2] hover:bg-gray-50 text-xs w-full sm:w-auto font-bold rounded-lg bg-white"
                    >
                      Update Profile Settings
                    </Button>
                  </Link>
                  <Link href="/dashboard/requirements/browse">
                    <Button className="bg-[#00060c] text-white hover:bg-slate-800 text-xs w-full sm:w-auto font-bold rounded-lg">
                      Explore Marketplace
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-[#eef1f4] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-gray-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-[#e6f6ee] border border-[#00A453]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#00A453]">
                          {req.curriculum?.subject?.[0] || '📚'}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#2d2d2d]">
                            {req.curriculum?.subject || req.category}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#647380] font-semibold mt-0.5">
                            {req.curriculum?.level && <span>{req.curriculum.level}</span>}
                            {req.curriculum?.board && (
                              <>
                                <span>·</span>
                                <span>{req.curriculum.board}</span>
                              </>
                            )}
                            <span>·</span>
                            <span>{req.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Show relevance score match percentage badge if activeTab === 'recommended' or if score exists */}
                      {req.score !== undefined ? (
                        <span className="text-[10px] font-extrabold bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                          🎯 {req.score}% Match
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#647380] flex items-center gap-1 mt-0.5 font-medium">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(req.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-[#647380]">
                      <span className="bg-[#f3f4f6] text-[#2d2d2d] px-2 py-0.5 rounded">
                        🏡 {req.teachingMode.join(', ')}
                      </span>
                      <span className="bg-[#e6f6ee] text-[#00A453] px-2 py-0.5 rounded">
                        💰 ₹{req.budget.min} - ₹{req.budget.max} (
                        {req.budget.feeType.toLowerCase().replace('_', ' ')})
                      </span>
                      <span className="bg-gray-100 text-[#2d2d2d] px-2 py-0.5 rounded">
                        📍 {req.location.city}, {req.location.area}
                      </span>
                    </div>

                    <p className="text-xs text-[#647380] leading-relaxed line-clamp-3 whitespace-pre-line">
                      {req.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#647380]">
                      {req.applicationsCount || 0} applications
                    </span>
                    <Link href={`/dashboard/requirements/${req._id}`}>
                      <button className="text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors flex items-center gap-1">
                        View Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TIPS & ADVICE (20% weight) */}
        <div className="md:col-span-1 space-y-6">
          {/* Advice card */}
          <div className="bg-white border border-[#eef1f4] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#2d2d2d]">Success Tips</h3>
              <span className="text-[10px] text-[#647380] font-medium block">
                How to land student leads
              </span>
            </div>

            <div className="space-y-4">
              {PLATFORM_TIPS.map((tip) => {
                const IconComp = tip.icon;
                return (
                  <div
                    key={tip.id}
                    className="space-y-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                  >
                    <h4 className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1">
                      <IconComp className="w-3.5 h-3.5 text-[#00A453]" />
                      {tip.title}
                    </h4>
                    <p className="text-[11px] text-[#647380] leading-relaxed">{tip.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERING RISHU'S DYNAMIC FEED FOR STUDENTS
  // -------------------------------------------------------------
  return (
    <div className="max-w-[1250px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 py-6 bg-[#FAFAFA] min-h-screen text-[#2d2d2d]">
      {/* 1. LEFT SIDEBAR: PROFILE & CATEGORIES */}
      <div className="md:col-span-1 space-y-6">
        {/* User Card */}
        <div className="bg-white border border-[#eef1f4] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f4f7f6] border border-gray-200 flex items-center justify-center font-bold text-[#00A453] text-sm select-none">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-[#647380] block leading-tight">
                Post requirement as
              </span>
              <button className="flex items-center gap-1 text-sm font-bold text-[#2d2d2d] truncate hover:text-[#00A453] transition-colors">
                Student <ChevronDown className="w-4 h-4 text-[#647380]" />
              </button>
            </div>
          </div>

          <Link href="/dashboard/requirements/create" className="block">
            <Button className="w-full bg-[#00060c] hover:bg-[#1a1a1a] text-white font-bold rounded-full py-5 text-sm gap-1.5 shadow-sm">
              Create post <Plus className="w-4 h-4 stroke-[2.5]" />
            </Button>
          </Link>
        </div>

        {/* My Categories / Bowls */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-[#2d2d2d] px-1">My Subjects</h3>

          <div className="space-y-2">
            {MY_SUBJECTS.map((sub) => (
              <div
                key={sub.name}
                className="flex items-center justify-between p-3 bg-white border border-[#eef1f4] rounded-xl hover:border-gray-200 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#e6f6ee] flex items-center justify-center text-xs">
                    📚
                  </div>
                  <span className="text-xs font-semibold text-[#384148]">{sub.name}</span>
                </div>
                <span className="text-[10px] font-bold bg-[#00060c] text-white px-2 py-0.5 rounded-full">
                  {sub.count}
                </span>
              </div>
            ))}
          </div>

          <Link href="/dashboard/requirements" className="block">
            <button className="w-full flex items-center justify-center gap-1.5 py-3 border border-[#dadee2] rounded-xl text-xs font-bold text-[#384148] bg-white hover:bg-gray-50 transition-colors">
              <Compass className="w-4 h-4 text-[#00A453]" /> Manage My Requirements
              <span className="w-2 h-2 rounded-full bg-[#00A453]" />
            </button>
          </Link>
        </div>
      </div>

      {/* 2. CENTER FEED */}
      <div className="md:col-span-2 space-y-5">
        {/* Top Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#647380]" />
          <input
            type="text"
            placeholder="Search for subjects or tutoring needs"
            className="w-full pl-12 pr-4 py-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] focus:bg-white text-sm rounded-full border border-transparent focus:border-[#00A453] focus:outline-none transition-all placeholder-[#647380]"
          />
        </div>

        {/* Quick Post Prompt */}
        <div className="bg-white border border-[#eef1f4] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f4f7f6] flex items-center justify-center text-sm font-semibold select-none border border-gray-100">
            💬
          </div>
          <Link href="/dashboard/requirements/create" className="flex-1">
            <input
              type="text"
              readOnly
              placeholder={`Post a new requirement as "Student"`}
              className="w-full px-4 py-2.5 bg-[#f8fafc] border border-gray-100 hover:border-gray-200 rounded-lg text-sm text-[#647380] cursor-pointer focus:outline-none"
            />
          </Link>
        </div>

        {/* Startups Rocket Card */}
        <div className="bg-white border border-[#eef1f4] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Blue rocket banner */}
          <div className="h-44 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] relative flex items-center justify-center overflow-hidden">
            {/* Simple CSS vector rocket mock */}
            <div className="w-20 h-28 bg-[#f8fafc] rounded-t-full rounded-b-2xl relative border-2 border-slate-300 flex flex-col items-center py-4 transform -rotate-12">
              <div className="w-6 h-6 rounded-full bg-cyan-400 border border-slate-300 mb-2" />
              <div className="w-full flex justify-between absolute bottom-4 px-2">
                <div className="w-4 h-6 bg-red-500 rounded-l-full" />
                <div className="w-4 h-6 bg-red-500 rounded-r-full" />
              </div>
              <div className="w-2 h-4 bg-orange-400 rounded-full animate-bounce mt-auto" />
            </div>
          </div>

          {/* Banner bottom info */}
          <div className="bg-[#6366f1] p-5 text-white space-y-2">
            <h4 className="font-extrabold text-base flex items-center gap-1">
              💡 Need Math or Physics Guidance?
            </h4>
            <p className="text-xs text-white/90 leading-relaxed">
              We have featured tutors verified for you! Explore the tutoring network to clear your
              doubts and learn with top educators.
            </p>
          </div>
        </div>

        {/* FEED ITEMS */}
        <div className="space-y-4">
          {STUDENT_FEED_POSTS.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-[#eef1f4] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-gray-200 transition-all"
            >
              {/* Feed Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e6f6ee] border border-[#00A453]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#00A453]">
                    {post.subject[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1.5">
                      {post.subject}
                    </h4>
                    <span className="text-[10px] text-[#647380] font-medium leading-none block mt-1">
                      {post.studentName} · {post.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#647380]">{post.time}</span>
                  <button className="p-1 text-gray-400 hover:text-gray-700">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feed Body */}
              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#00A453] bg-[#e6f6ee]/40 px-3 py-1.5 rounded-md inline-block">
                  Budget: {post.budget}
                </div>
                <p className="text-sm text-[#384148] leading-relaxed whitespace-pre-line">
                  {post.description}
                </p>
              </div>

              {/* Feed Footer */}
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#00A453]">{post.reactions}</span>

                <Link href="/dashboard/requirements">
                  <button className="text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors flex items-center gap-1">
                    View Requirement <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR: TUTORS FOR YOU */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white border border-[#eef1f4] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#2d2d2d]">Tutors for you</h3>
            <button className="text-xs font-bold text-[#00A453] hover:underline flex items-center gap-0.5">
              Explore all Tutors <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          <div className="space-y-4">
            {SUGGESTED_TUTORS.map((tutor) => (
              <div
                key={tutor.id}
                className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#f4f7f6] border border-gray-200 flex items-center justify-center font-bold text-xs text-[#00A453] shrink-0">
                    {tutor.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#2d2d2d] truncate">{tutor.name}</h4>
                    <span className="text-[10px] text-[#647380] block truncate">{tutor.tag}</span>
                    <span className="text-[9px] text-[#b0b8c1] block mt-0.5">
                      {tutor.students} learners
                    </span>
                  </div>
                </div>

                <button className="text-[10px] font-bold border border-[#dadee2] hover:bg-gray-50 text-[#2d2d2d] px-3 py-1.5 rounded-[4px] shrink-0 transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
