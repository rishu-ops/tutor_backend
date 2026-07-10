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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requirementApi, profileApi, recommendationApi, adminApi } from '@/lib/api';

// Recent Educational Articles for Task Dashboards
const MOCK_ARTICLES = [
  {
    id: 'art-1',
    title: '5 Habits of High-Scoring CBSE Math Students',
    readTime: '4 min read',
    category: 'Study Strategy',
  },
  {
    id: 'art-2',
    title: 'Understanding Online vs Home Tuition: Which is best?',
    readTime: '6 min read',
    category: 'Parent Guide',
  },
];

// Fallback suggestions of Tutors for student carousel
const FALLBACK_TUTORS = [
  {
    _id: 't-1',
    name: 'Dr. Rahul Sharma',
    subjects: ['Math', 'Physics'],
    ratingAvg: 4.9,
    experience: '8 Yrs',
    verified: true,
  },
  {
    _id: 't-2',
    name: 'Priya Patel',
    subjects: ['Chemistry', 'Biology'],
    ratingAvg: 4.8,
    experience: '5 Yrs',
    verified: true,
  },
  {
    _id: 't-3',
    name: "Sarah D'Souza",
    subjects: ['English'],
    ratingAvg: 5.0,
    experience: '12 Yrs',
    verified: true,
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  // States
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

  const [posts, setPosts] = useState<any[]>([]); // Announcements
  const [studentRequirements, setStudentRequirements] = useState<any[]>([]);
  const [activeArticleIndex, setActiveArticleIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch student requirements directly if user is STUDENT
  const fetchStudentRequirements = useCallback(async () => {
    if (!token || user?.role !== 'STUDENT') return;
    try {
      const res = await requirementApi.getMyRequirements(token);
      if (res.success && res.data) {
        setStudentRequirements(res.data.slice(0, 3)); // show top 3 active requirements
      }
    } catch (e) {
      console.error('Failed to load student requirements:', e);
    }
  }, [token, user]);

  const fetchFeedData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      if (user?.role === 'TUTOR') {
        setProfileLoading(true);
        // Get tutor profile
        const profRes = await profileApi.getTutorProfile(token);
        if (profRes.success && profRes.data) {
          setTutorProfile(profRes.data);
        }
        setProfileLoading(false);

        // Get home recommendations & announcements posts
        const recRes = await recommendationApi.getHomeRecommendations(token);
        if (recRes.success) {
          setPosts(recRes.posts || []);
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
      } else if (user?.role === 'STUDENT') {
        // Fetch only public posts/announcements
        const postsRes = await adminApi.getPublicPosts(token);
        if (postsRes.success) {
          setPosts(postsRes.data || []);
        } else {
          setError(postsRes.error || postsRes.message || 'Failed to fetch announcements.');
        }
        await fetchStudentRequirements();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading feed data.');
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  }, [token, user, fetchStudentRequirements]);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  // Rotate Right-Sidebar Single Announcement Card every 12 seconds
  useEffect(() => {
    if (posts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveArticleIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [posts]);

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // -------------------------------------------------------------
  // STUDENT DASHBOARD LAYOUT (Task-Oriented)
  // -------------------------------------------------------------
  if (user?.role === 'STUDENT') {
    const featuredAnnouncement = posts[activeArticleIndex] || posts[0];

    return (
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 py-6 bg-[#FAFAFA] min-h-screen text-[#2d2d2d]">
        {/* LEFT COLUMN: ACTIVE CHECKS & TASKS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f4f7f6] border border-[#dadee2] flex items-center justify-center font-bold text-[#00A453] text-sm select-none">
                {getInitials()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-[#647380] block leading-tight">
                  Student Account
                </span>
                <span className="text-xs font-bold text-[#2d2d2d] truncate block">{user.name}</span>
              </div>
            </div>
            <Link href="/dashboard/requirements/create" className="block">
              <Button className="w-full bg-[#00A453] hover:bg-[#008A45] text-white font-bold rounded-2xl py-5 text-xs gap-1.5 shadow-sm">
                Post Requirement <Plus className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </Link>
          </div>

          {/* Left Sidebar Bookmarks */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
              Hiring Activity
            </h3>
            <div className="bg-white border border-[#dadee2] rounded-3xl p-4 shadow-sm space-y-3.5">
              <div className="space-y-2">
                <span className="text-[10px] text-[#b0b8c1] block font-extrabold uppercase">
                  Your Active Requirements
                </span>
                {studentRequirements.length === 0 ? (
                  <span className="text-xs text-[#647380] block italic">No active requests</span>
                ) : (
                  studentRequirements.map((req) => (
                    <Link
                      key={req._id}
                      href={`/dashboard/requirements/${req._id}`}
                      className="block p-2 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <span className="text-xs font-bold text-[#2d2d2d] block truncate">
                        {req.curriculum?.subject || req.category}
                      </span>
                      <span className="text-[10px] text-[#00A453] font-bold block mt-0.5">
                        {req.applicationsCount || 0} Tutors Applied
                      </span>
                    </Link>
                  ))
                )}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <Link
                  href="/dashboard/requirements"
                  className="text-xs font-bold text-[#00A453] hover:underline flex items-center justify-between"
                >
                  <span>Manage Requirements</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER MAIN TASK AREA */}
        <div className="lg:col-span-2 space-y-8">
          {/* Welcome Action banner */}
          <div className="bg-white border border-[#dadee2] rounded-3xl p-8 shadow-sm space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold text-[#2d2d2d]">
                Good Evening, {user.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-xs text-[#647380] leading-relaxed">
                Welcome back to your control center. What would you like to achieve today?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard/tutors" className="block">
                <div className="p-5 border border-[#dadee2] hover:border-[#00A453]/40 bg-gray-50/50 hover:bg-white rounded-3xl transition-all space-y-2 cursor-pointer shadow-sm group">
                  <div className="w-10 h-10 bg-[#e6f6ee] text-[#00A453] rounded-full flex items-center justify-center font-bold">
                    🔍
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2d2d2d] group-hover:text-[#00A453] flex items-center gap-1">
                      Find Tutors <ArrowRight className="w-3 h-3" />
                    </h4>
                    <p className="text-[10px] text-[#647380] mt-1">
                      Search profiles by subject, budget, rating & area.
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/requirements/create" className="block">
                <div className="p-5 border border-[#dadee2] hover:border-[#00A453]/40 bg-gray-50/50 hover:bg-white rounded-3xl transition-all space-y-2 cursor-pointer shadow-sm group">
                  <div className="w-10 h-10 bg-[#e6f6ee] text-[#00A453] rounded-full flex items-center justify-center font-bold">
                    📋
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2d2d2d] group-hover:text-[#00A453] flex items-center gap-1">
                      Post Requirement <ArrowRight className="w-3 h-3" />
                    </h4>
                    <p className="text-[10px] text-[#647380] mt-1">
                      Receive custom proposals from verified local experts.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Active Requirements Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                Active Requirements
              </h3>
              <Link
                href="/dashboard/requirements"
                className="text-[10px] font-bold text-[#00A453] hover:underline"
              >
                View All
              </Link>
            </div>

            {studentRequirements.length === 0 ? (
              <div className="bg-white border border-[#dadee2] rounded-3xl p-10 text-center shadow-sm space-y-4">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-[#2d2d2d]">No posted requirements</h4>
                  <p className="text-[11px] text-[#647380] max-w-xs mx-auto">
                    Post a CBSE, ICSE, or computer programming requirement to get started.
                  </p>
                </div>
                <Link href="/dashboard/requirements/create">
                  <Button
                    size="sm"
                    className="bg-[#00060c] text-white hover:bg-slate-800 text-[10px] font-bold px-4 rounded-xl"
                  >
                    Post Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {studentRequirements.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#e6f6ee] border border-[#00A453]/25 flex items-center justify-center text-xs text-[#00A453] font-bold">
                            📚
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-[#2d2d2d]">
                              {req.curriculum?.subject || req.category}
                            </h4>
                            <span className="text-[9px] text-[#647380] font-bold mt-0.5 block capitalize">
                              {req.location?.area}, {req.location?.city} ·{' '}
                              {req.teachingMode.join('/')}
                            </span>
                          </div>
                        </div>

                        {req.status === 'MATCHED' ? (
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold">
                            MATCHED
                          </span>
                        ) : (
                          <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-extrabold">
                            {req.status}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-2">
                        {req.description}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-[#00A453] font-extrabold">
                        {req.applicationsCount || 0} applications received
                      </span>

                      <Link href={`/dashboard/requirements/${req._id}`}>
                        <Button className="bg-[#00060c] text-white hover:bg-slate-800 text-[10px] font-bold px-3.5 h-8 rounded-xl">
                          View Applications
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Tutors Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
              Recommended Tutors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FALLBACK_TUTORS.map((tutor) => (
                <div
                  key={tutor._id}
                  className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm flex flex-col justify-between items-center text-center space-y-4"
                >
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-xl bg-[#e6f6ee] flex items-center justify-center font-bold text-[#00A453] text-xs">
                      {tutor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-[#2d2d2d] truncate max-w-[100px]">
                        {tutor.name}
                      </h4>
                      <p className="text-[9px] text-[#647380] mt-0.5">
                        {tutor.subjects.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {tutor.ratingAvg} ({tutor.experience})
                  </div>

                  <Link href="/dashboard/tutors" className="w-full">
                    <Button className="w-full border border-[#dadee2] bg-white hover:bg-gray-50 text-[#2d2d2d] text-[9px] font-bold h-7.5 rounded-lg">
                      View Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SINGLE HIGHLIGHT & RESOURCES */}
        <div className="lg:col-span-1 space-y-6">
          {/* Platform Single Announcement card (Distraction-Free) */}
          {featuredAnnouncement && (
            <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#00A453] bg-[#e6f6ee] px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                  {featuredAnnouncement.type || 'Platform Notice'}
                </span>
                <h3 className="text-xs font-extrabold text-[#2d2d2d] leading-snug">
                  {featuredAnnouncement.title}
                </h3>
              </div>
              <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-4">
                {featuredAnnouncement.content}
              </p>
              <div className="text-[9px] text-[#b0b8c1]">
                Posted {new Date(featuredAnnouncement.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Educational Articles */}
          <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
              Educational Guides
            </h3>
            <div className="space-y-4">
              {MOCK_ARTICLES.map((article) => (
                <div
                  key={article.id}
                  className="space-y-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
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
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TUTOR DASHBOARD LAYOUT (Tutor Control Center)
  // -------------------------------------------------------------
  const list = recommendations.recommended || [];
  const featuredAnnouncement = posts[activeArticleIndex] || posts[0];

  return (
    <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 py-6 bg-[#FAFAFA] min-h-screen text-[#2d2d2d]">
      {/* LEFT COLUMN: PROFILE COMPLEXITY */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e6f6ee] border border-[#dadee2] flex items-center justify-center font-bold text-[#00A453] text-sm select-none">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#647380] block leading-tight">Tutor Account</span>
              <span className="text-xs font-bold text-[#2d2d2d] truncate block">{user?.name}</span>
            </div>
          </div>

          {profileLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
            </div>
          ) : tutorProfile ? (
            <div className="space-y-3.5 pt-3 border-t border-[#dadee2] text-xs">
              <div className="space-y-1">
                <span className="text-[#647380] block font-bold text-[9px] uppercase tracking-wider text-gray-400">
                  Location
                </span>
                <span className="font-bold text-[#2d2d2d] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {tutorProfile.location?.area || 'Not Set'},{' '}
                  {tutorProfile.location?.city || 'Not Set'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[#647380] block font-bold text-[9px] uppercase tracking-wider text-gray-400">
                  Teaching Modes
                </span>
                <span className="font-bold text-[#2d2d2d]">
                  {tutorProfile.teachingModes?.join(' · ') || 'None Selected'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[#647380] block font-bold text-[9px] uppercase tracking-wider text-gray-400">
                  Pricing Rates
                </span>
                <span className="font-bold text-[#2d2d2d]">
                  ₹{tutorProfile.pricing?.min} - ₹{tutorProfile.pricing?.max} / Hr
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#dadee2] text-center space-y-2">
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

        {/* Expertise lists */}
        {tutorProfile?.subjects && tutorProfile.subjects.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider px-1">
              My Expertise
            </h3>
            <div className="space-y-2">
              {tutorProfile.subjects.map((sub: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-[#dadee2] rounded-2xl text-xs font-semibold text-[#384148]"
                >
                  <span className="truncate">{sub.subject}</span>
                  <span className="text-[10px] text-[#647380] bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {sub.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CENTER MAIN TASK AREA */}
      <div className="lg:col-span-2 space-y-8">
        {/* Welcome Counters strip */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#2d2d2d]">Good Evening, Tutor</h2>
            <p className="text-xs text-[#647380]">
              Here is the status summary of your marketplace applications:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
              <span className="text-[9px] text-[#647380] block font-extrabold uppercase">
                Matched
              </span>
              <span className="text-base font-extrabold text-[#00A453] block mt-1">1 Accepted</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
              <span className="text-[9px] text-[#647380] block font-extrabold uppercase">
                Submitted
              </span>
              <span className="text-base font-extrabold text-[#2d2d2d] block mt-1">3 Active</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
              <span className="text-[9px] text-[#647380] block font-extrabold uppercase">
                Unread Messages
              </span>
              <span className="text-base font-extrabold text-[#2d2d2d] block mt-1">2 New</span>
            </div>
          </div>
        </div>

        {/* Recommended Requirements (Airbnb discovery cards list) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
              Recommended Student Requirements
            </h3>
            <Link
              href="/dashboard/requirements/browse"
              className="text-[10px] font-bold text-[#00A453] hover:underline"
            >
              Search All
            </Link>
          </div>

          {list.length === 0 ? (
            <div className="bg-white border border-[#dadee2] rounded-3xl p-12 text-center shadow-sm space-y-4">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#2d2d2d]">No matching requirements</h4>
                <p className="text-xs text-[#647380] mt-1 max-w-xs mx-auto">
                  Complete your profile subjects expertise to receive daily matching alerts.
                </p>
              </div>
              <Link href="/dashboard/requirements/browse">
                <Button
                  size="sm"
                  className="bg-[#00060c] text-white hover:bg-slate-800 text-[10px] font-bold px-4 rounded-xl"
                >
                  Browse All Posts
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#e6f6ee] flex items-center justify-center text-xs font-bold text-[#00A453]">
                          📚
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-[#2d2d2d]">
                            {req.curriculum?.subject || req.category}
                          </h4>
                          <span className="text-[9px] text-[#647380] font-bold mt-0.5 block">
                            {req.location?.area}, {req.location?.city} ·{' '}
                            {req.teachingMode.join('/')}
                          </span>
                        </div>
                      </div>

                      <span className="text-[9px] font-extrabold bg-[#e6f6ee] text-[#00A453] px-2.5 py-0.5 rounded-full">
                        🎯 {req.score || 95}% Match
                      </span>
                    </div>

                    <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-2">
                      {req.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#2d2d2d]">
                      ₹{req.budget?.min} - ₹{req.budget?.max}
                      <span className="text-[10px] text-[#647380] font-medium block mt-0.5">
                        Budget ({req.budget?.feeType.toLowerCase().replace('_', ' ')})
                      </span>
                    </span>

                    <Link href={`/dashboard/requirements/${req._id}`}>
                      <Button className="bg-[#00060c] text-white hover:bg-slate-800 text-[10px] font-bold px-4 h-9 rounded-xl">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: SINGLE ROTATING POSTS */}
      <div className="lg:col-span-1 space-y-6">
        {featuredAnnouncement && (
          <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#00A453] bg-[#e6f6ee] px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                {featuredAnnouncement.type || 'Announcement'}
              </span>
              <h3 className="text-xs font-extrabold text-[#2d2d2d] leading-snug">
                {featuredAnnouncement.title}
              </h3>
            </div>
            <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-4">
              {featuredAnnouncement.content}
            </p>
            <div className="text-[9px] text-[#b0b8c1]">
              Posted {new Date(featuredAnnouncement.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Platform Advice card */}
        <div className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
            Tutor Tips
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#00A453]" /> Profile Completion
              </h4>
              <p className="text-[10px] text-[#647380] leading-relaxed">
                Tutors who complete their bio and experience blocks land 4x more parent inquiries.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#2d2d2d] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#00A453]" /> Demo Session Policy
              </h4>
              <p className="text-[10px] text-[#647380] leading-relaxed">
                Always establish demo agenda items during the 30-min discovery call.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
