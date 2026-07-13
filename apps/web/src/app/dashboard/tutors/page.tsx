'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Search,
  Star,
  MapPin,
  CheckCircle2,
  Sparkles,
  Bookmark,
  SlidersHorizontal,
  GraduationCap,
  MessageSquare,
  Award,
  Zap,
  Check,
  X,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FindTutorsPage() {
  const token = useAuthStore((s) => s.accessToken);

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('Noida');
  const [subject, setSubject] = useState('');
  const [teachingMode, setTeachingMode] = useState<string>('ALL');
  const [maxBudget, setMaxBudget] = useState<number>(3000);
  const [minExp, setMinExp] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [demoOnly, setDemoOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevant');

  // Selected tutor for detailed pane
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [savedTutorIds, setSavedTutorIds] = useState<string[]>([]);
  const [sortByDropdownOpen, setSortByDropdownOpen] = useState(false);

  // Interactive qualification answers
  const [extraQualifications, setExtraQualifications] = useState({
    punctuality: null as boolean | null,
    weekendAvailability: null as boolean | null,
  });

  // Tutor list state
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch verified tutors list
  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/recommendations/home', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.recommended) {
        setTutors(data.recommended);
        if (data.recommended.length > 0) {
          setSelectedTutorId(data.recommended[0]._id);
        }
      } else {
        throw new Error();
      }
    } catch {
      const fallbackTutors = [
        {
          _id: 'tutor-1',
          name: 'Dr. Rahul Sharma',
          subjects: ['Mathematics', 'Physics'],
          experience: '8 Years',
          ratingAvg: 4.9,
          reviewsCount: 32,
          qualifications: ['MSc in Mathematics', 'PhD in Applied Physics'],
          hourlyRate: 800,
          teachingMode: ['Online', 'Home'],
          freeDemo: true,
          verified: true,
          bio: 'Passionate educator specializing in preparing students for competitive boards exams. Over 8 years of mentoring students in advanced physics and calculus. Known for breaking down complex concepts into simple interactive visualizations.',
          location: { city: 'Noida', area: 'Sector 62' },
          postedDaysAgo: '2d',
        },
        {
          _id: 'tutor-2',
          name: 'Priya Patel',
          subjects: ['Chemistry', 'Biology'],
          experience: '5 Years',
          ratingAvg: 4.8,
          reviewsCount: 18,
          qualifications: ['BTech in Biotechnology', 'UGC NET Qualified'],
          hourlyRate: 650,
          teachingMode: ['Online'],
          freeDemo: true,
          verified: true,
          bio: 'Specialist in making chemistry concepts interactive and easy to understand. Helping high school and college students achieve stellar scores in board exams and pre-medical entrances.',
          location: { city: 'Noida', area: 'Dwarka' },
          postedDaysAgo: '3d',
        },
        {
          _id: 'tutor-3',
          name: 'Amit Verma',
          subjects: ['Web Development', 'Computer Science'],
          experience: '4 Years',
          ratingAvg: 4.7,
          reviewsCount: 12,
          qualifications: ['BCA', 'Full Stack Developer'],
          hourlyRate: 1000,
          teachingMode: ['Online', 'Home'],
          freeDemo: false,
          verified: true,
          bio: 'Industry software engineer teaching programming fundamentals, frontend engineering, database architectures, and high-school computer science curriculum.',
          location: { city: 'Noida', area: 'Sector 15' },
          postedDaysAgo: '5d',
        },
        {
          _id: 'tutor-4',
          name: "Sarah D'Souza",
          subjects: ['English', 'Literature'],
          experience: '12 Years',
          ratingAvg: 5.0,
          reviewsCount: 45,
          qualifications: ['MA in English Literature', 'TESOL Certified'],
          hourlyRate: 900,
          teachingMode: ['Home'],
          freeDemo: true,
          verified: false,
          bio: 'Experienced educator focusing on english communication skills, creative writing, high-school grammar curriculum, and public speaking coaching for children.',
          location: { city: 'Delhi', area: 'DLF Phase 3' },
          postedDaysAgo: '1w',
        },
      ];
      setTutors(fallbackTutors);
      if (fallbackTutors.length > 0) {
        setSelectedTutorId(fallbackTutors[0]._id);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Apply filters
  const filteredTutors = tutors.filter((tutor) => {
    if (searchTerm) {
      const matchName = tutor.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject = tutor.subjects.some((s: string) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchName && !matchSubject) return false;
    }
    if (location && tutor.location) {
      const matchCity = tutor.location.city.toLowerCase().includes(location.toLowerCase());
      const matchArea = tutor.location.area.toLowerCase().includes(location.toLowerCase());
      if (!matchCity && !matchArea) return false;
    }
    if (subject && !tutor.subjects.some((s: string) => s.toLowerCase() === subject.toLowerCase())) {
      return false;
    }
    if (teachingMode !== 'ALL' && !tutor.teachingMode.includes(teachingMode)) {
      return false;
    }
    const rate = tutor.hourlyRate || tutor.budget?.max || 500;
    if (rate > maxBudget) return false;

    const expYrs = parseInt(tutor.experience) || 1;
    if (expYrs < minExp) return false;

    if (verifiedOnly && !tutor.verified) return false;
    if (demoOnly && !tutor.freeDemo) return false;

    return true;
  });

  // Sorting
  if (sortBy === 'rating') {
    filteredTutors.sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (sortBy === 'price_asc') {
    filteredTutors.sort((a, b) => a.hourlyRate - b.hourlyRate);
  } else if (sortBy === 'price_desc') {
    filteredTutors.sort((a, b) => b.hourlyRate - a.hourlyRate);
  }

  // Handle selected element sync
  useEffect(() => {
    if (filteredTutors.length > 0) {
      const exists = filteredTutors.some((t) => t._id === selectedTutorId);
      if (!exists) {
        setSelectedTutorId(filteredTutors[0]._id);
      }
    } else {
      setSelectedTutorId(null);
    }
  }, [
    searchTerm,
    location,
    subject,
    teachingMode,
    maxBudget,
    minExp,
    verifiedOnly,
    demoOnly,
    sortBy,
    tutors,
  ]);

  const toggleSaveTutor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTutorIds((prev) =>
      prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
    );
  };

  const getInitials = (name?: string) => {
    const target = name || 'User';
    return target
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedTutor = tutors.find((t) => t._id === selectedTutorId);

  // Active filters count
  const activeFiltersCount =
    (teachingMode !== 'ALL' ? 1 : 0) +
    (maxBudget < 3000 ? 1 : 0) +
    (minExp > 0 ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (demoOnly ? 1 : 0) +
    (subject ? 1 : 0);

  return (
    <div className="max-w-[1300px] mx-auto flex flex-col h-[calc(100vh-100px)] bg-white text-[#2d2d2d] font-sans">
      {/* Top Combined Search Bar Row (LinkedIn/Indeed style) */}
      <div className="px-6 py-4 flex flex-col gap-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto w-full">
          {/* Double Search Bar Wrapper */}
          <div className="flex items-center flex-1 bg-gray-50 border border-gray-300 rounded-full overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-green-600 focus-within:border-green-600 transition-all">
            {/* Subject/Keyword input */}
            <div className="flex items-center flex-1 px-4 py-2 gap-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Subject or tutor name"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-500 font-medium"
              />
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-gray-300 shrink-0" />

            {/* Location input */}
            <div className="flex items-center flex-1 px-4 py-2 gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Noida, India"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-500 font-medium"
              />
            </div>
          </div>

          {/* Adjust Filters Button */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => {
                // Quick reset as toggle
                if (activeFiltersCount > 0) {
                  setTeachingMode('ALL');
                  setMaxBudget(3000);
                  setMinExp(0);
                  setVerifiedOnly(false);
                  setDemoOnly(false);
                  setSubject('');
                } else {
                  setVerifiedOnly(true);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Pills list */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {/* Demo Only Pill */}
          <button
            onClick={() => setDemoOnly((d) => !d)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              demoOnly
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚡ Free Demo only
          </button>

          {/* Verified Only Pill */}
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              verifiedOnly
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Verified only
          </button>

          {/* Subject selector pill */}
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 bg-white focus:outline-none appearance-none pr-8 hover:bg-gray-50 cursor-pointer"
            >
              <option value="">Subject expertise</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Teaching Mode selector pill */}
          <div className="relative">
            <select
              value={teachingMode}
              onChange={(e) => setTeachingMode(e.target.value)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 bg-white focus:outline-none appearance-none pr-8 hover:bg-gray-50 cursor-pointer"
            >
              <option value="ALL">Tuition mode (Any)</option>
              <option value="Online">Online classes</option>
              <option value="Home">Home tutor visit</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Budget Limit selector pill */}
          <div className="relative">
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 bg-white focus:outline-none appearance-none pr-8 hover:bg-gray-50 cursor-pointer"
            >
              <option value="3000">Hourly Rate limit (Any)</option>
              <option value="1500">Max ₹1500/hr</option>
              <option value="1000">Max ₹1000/hr</option>
              <option value="700">Max ₹700/hr</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Split Pane Container */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Pane: Tutors list */}
        <div className="w-[400px] border-r border-gray-200 bg-white overflow-y-auto shrink-0 flex flex-col">
          {/* Header Row */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {filteredTutors.length} tutors in {location || 'India'}
            </span>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortByDropdownOpen((o) => !o)}
                className="text-xs font-bold text-gray-700 flex items-center gap-1 hover:text-green-700 transition-colors"
              >
                Sort:{' '}
                {sortBy === 'relevant'
                  ? 'Most relevant'
                  : sortBy === 'rating'
                    ? 'Top Rated'
                    : sortBy === 'price_asc'
                      ? 'Low fee first'
                      : 'High fee first'}
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>
              {sortByDropdownOpen && (
                <div className="absolute right-0 top-6 bg-white border border-gray-250 shadow-md py-1 z-35 rounded w-40 text-xs">
                  <button
                    onClick={() => {
                      setSortBy('relevant');
                      setSortByDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Most relevant
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('rating');
                      setSortByDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Top Rated
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price_asc');
                      setSortByDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Low fee first
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price_desc');
                      setSortByDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    High fee first
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cards feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-150">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500 font-semibold">
                  Finding tutor profiles...
                </span>
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-2 mt-8">
                <Search className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-800">No tutors match your search</p>
                <p className="text-[11px] text-gray-500">
                  Adjust locations or filters in the bar above.
                </p>
              </div>
            ) : (
              filteredTutors.map((tutor) => (
                <div
                  key={tutor._id}
                  onClick={() => setSelectedTutorId(tutor._id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50/70 transition-all relative ${
                    selectedTutorId === tutor._id
                      ? 'bg-green-50/20 border-l-[3px] border-green-600'
                      : 'border-l-[3px] border-transparent'
                  }`}
                >
                  {/* Left profile initial box */}
                  <div className="w-10 h-10 rounded bg-[#e6f6ee] flex items-center justify-center font-bold text-green-700 text-sm shrink-0 border border-green-100">
                    {getInitials(tutor.name)}
                  </div>

                  {/* Mid info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-gray-500 hover:underline">
                        {tutor.location.city} Tuition
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs font-bold text-yellow-600 flex items-center gap-0.5">
                        {tutor.ratingAvg}{' '}
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 shrink-0" />
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-gray-950 leading-tight">
                      {tutor.name}
                    </h3>

                    <p className="text-xs text-gray-600 font-medium truncate">
                      {tutor.subjects.join(', ')}
                    </p>

                    <p className="text-xs text-gray-400">
                      {tutor.location.area}, {tutor.location.city}
                    </p>

                    <p className="text-xs font-bold text-gray-950 pt-0.5">
                      ₹{tutor.hourlyRate}/hr{' '}
                      <span className="text-[10px] text-gray-400 font-normal">estimated fee</span>
                    </p>

                    {/* Easy Apply type indicator */}
                    {tutor.freeDemo && (
                      <div className="flex items-center gap-1 text-green-700 text-[10px] font-bold pt-1">
                        <Zap className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                        <span>⚡ Free Demo Class</span>
                      </div>
                    )}
                  </div>

                  {/* Bookmark & Date Column */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <button
                      onClick={(e) => toggleSaveTutor(tutor._id, e)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${savedTutorIds.includes(tutor._id) ? 'fill-green-600 text-green-600' : ''}`}
                      />
                    </button>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {tutor.postedDaysAgo || '2d'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Tutor Details Panel */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedTutor ? (
            <div className="p-8 space-y-6 max-w-3xl">
              {/* Profile Card Header */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center font-bold text-white text-lg shrink-0">
                      {getInitials(selectedTutor.name)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-extrabold text-gray-950 leading-tight">
                          {selectedTutor.name}
                        </h2>
                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5">
                          {selectedTutor.ratingAvg}★
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {selectedTutor.subjects.join(' · ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedTutor.location.area}, {selectedTutor.location.city} ·{' '}
                        {selectedTutor.experience} Experience
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleSaveTutor(selectedTutor._id, e)}
                    className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${savedTutorIds.includes(selectedTutor._id) ? 'fill-green-600 text-green-600' : ''}`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-semibold">
                    {selectedTutor.location.city}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-semibold">
                    ₹{selectedTutor.hourlyRate}/hr (negotiable)
                  </span>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-sm px-6 h-10 rounded-lg flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-green-400 fill-green-400" /> Book Free Demo
                  </Button>

                  <Link href={`/profile/${selectedTutor._id}`}>
                    <Button
                      variant="secondary"
                      className="h-10 text-sm font-semibold px-6 border-gray-300 text-gray-700 bg-white"
                    >
                      Full Portfolio
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Match Verification List (LinkedIn Qualifications design style) */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
                <h3 className="text-sm font-bold text-gray-950">Matches for your profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>
                      Teaches required subjects:{' '}
                      <strong>{selectedTutor.subjects.join(', ')}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>
                      Location matches requirement: <strong>{selectedTutor.location.city}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Verified background checks complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Hourly rate within standard guidelines</span>
                  </div>
                  {selectedTutor.freeDemo && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>Free demo lessons available</span>
                    </div>
                  )}
                </div>

                {/* Interactive check/cross question block (Indeed/LinkedIn style) */}
                <div className="border-t border-gray-150 pt-4 mt-2 space-y-3">
                  <p className="text-xs font-bold text-gray-800">
                    Do you want to confirm additional specifications?
                  </p>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span>Requires weekend tutoring slots?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, weekendAvailability: true }))
                          }
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.weekendAvailability === true
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, weekendAvailability: false }))
                          }
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.weekendAvailability === false
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> No
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span>Require custom study materials and notes?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, punctuality: true }))
                          }
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.punctuality === true
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, punctuality: false }))
                          }
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.punctuality === false
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biography Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gray-500" /> About the Tutor
                </h3>
                <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedTutor.bio}
                </p>
              </div>

              {/* Qualifications Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-gray-500" /> Qualifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTutor.qualifications.map((q: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-2.5"
                    >
                      <BookOpen className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-gray-800 leading-snug">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center text-gray-400">
              Select a tutor from the list to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
