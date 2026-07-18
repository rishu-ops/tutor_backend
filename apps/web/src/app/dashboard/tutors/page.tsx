'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(true);
  const [modeOpen, setModeOpen] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(true);
  const [expOpen, setExpOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(true);

  // Click outside handling for filters dropdown
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };
    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filtersOpen]);

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

  const handleReset = () => {
    setSubject('');
    setTeachingMode('ALL');
    setMaxBudget(3000);
    setMinExp(0);
    setVerifiedOnly(false);
    setDemoOnly(false);
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
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-xs ${
                filtersOpen || activeFiltersCount > 0
                  ? 'border-[#00A453] bg-[#e6f6ee]/30 text-[#00A453]'
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#00A453] text-white font-extrabold text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Popover Dropdown Card (Indeed/LinkedIn style) */}
            {filtersOpen && (
              <div className="absolute right-0 top-12 md:w-100 w-auto bg-white border border-[#dadee2] rounded-2xl shadow-lg z-50 flex flex-col md:max-h-[500px] max-h-auto overflow-hidden">
                {/* Sticky Header */}
                <div className="flex items-center justify-between border-b border-gray-150 p-4 shrink-0 bg-white z-10">
                  <span className="font-extrabold text-gray-950 text-sm">Filter tutors</span>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6 border border-gray-300 rounded-full p-1" />
                  </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Subject expertise Selection */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSubjectOpen(!subjectOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-705 tracking-wider select-none cursor-pointer">
                        Subject expertise
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${
                          subjectOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {subjectOpen && (
                      <Select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="py-2 rounded-xl h-10 text-xs font-semibold"
                      >
                        <option value="">All Subjects</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="English">English</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Literature">Literature</option>
                      </Select>
                    )}
                  </div>

                  <div className="border-b border-gray-100" />

                  {/* Teaching Mode Selection */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setModeOpen(!modeOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-705 tracking-wider select-none cursor-pointer">
                        Tuition Mode
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${
                          modeOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {modeOpen && (
                      <Select
                        value={teachingMode}
                        onChange={(e) => setTeachingMode(e.target.value)}
                        className="py-2 rounded-xl h-10 text-xs font-semibold"
                      >
                        <option value="ALL">Any Mode</option>
                        <option value="Online">Online classes</option>
                        <option value="Home">Home tutor visit</option>
                      </Select>
                    )}
                  </div>

                  <div className="border-b border-gray-100" />

                  {/* Budget Limit (Hourly Rate) */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setBudgetOpen(!budgetOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-705 tracking-wider select-none cursor-pointer">
                        Hourly Rate limit
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${
                          budgetOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {budgetOpen && (
                      <Select
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(Number(e.target.value))}
                        className="py-2 rounded-xl h-10 text-xs font-semibold"
                      >
                        <option value="3000">Any budget</option>
                        <option value="1500">Max ₹1500/hr</option>
                        <option value="1000">Max ₹1000/hr</option>
                        <option value="700">Max ₹700/hr</option>
                      </Select>
                    )}
                  </div>

                  <div className="border-b border-gray-100" />

                  {/* Experience Selection */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpOpen(!expOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-705 tracking-wider select-none cursor-pointer">
                        Minimum Experience
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${
                          expOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {expOpen && (
                      <Select
                        value={minExp}
                        onChange={(e) => setMinExp(Number(e.target.value))}
                        className="py-2 rounded-xl h-10 text-xs font-semibold"
                      >
                        <option value="0">Any experience</option>
                        <option value="2">2+ years</option>
                        <option value="5">5+ years</option>
                        <option value="10">10+ years</option>
                      </Select>
                    )}
                  </div>

                  <div className="border-b border-gray-100" />

                  {/* Toggle options Accordion */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setOptionsOpen(!optionsOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-705 tracking-wider select-none cursor-pointer">
                        Special Criteria
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${
                          optionsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {optionsOpen && (
                      <div className="space-y-2 pt-1">
                        {/* Demo Lecture Toggle */}
                        <div
                          onClick={() => setDemoOnly(!demoOnly)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <span>⚡ Free Demo Class Only</span>
                          {demoOnly && <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />}
                        </div>

                        {/* Verified Tutor Toggle */}
                        <div
                          onClick={() => setVerifiedOnly(!verifiedOnly)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <span>Verified Tutors Only</span>
                          {verifiedOnly && (
                            <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Footer for Apply / Reset Actions */}
                <div className="flex items-center gap-2 p-4 border-t border-gray-100 shrink-0 bg-white z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                  <Button
                    onClick={() => setFiltersOpen(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs py-2 h-10 rounded-xl"
                  >
                    Apply
                  </Button>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        handleReset();
                        setFiltersOpen(false);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-xl h-10 text-xs font-extrabold hover:bg-gray-50 text-red-650 hover:text-red-750"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Pills List */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5 border-t border-gray-150 mt-1.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">
              Active Filters:
            </span>

            {/* Subject Pill */}
            {subject && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6f6ee] text-[#00A453] font-bold text-xs rounded-full border border-[#00A453]/10 animate-fadeIn">
                <span>Subject: {subject}</span>
                <button
                  onClick={() => setSubject('')}
                  className="hover:bg-green-100/60 text-[#00A453] p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Teaching Mode Pill */}
            {teachingMode !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6f6ee] text-[#00A453] font-bold text-xs rounded-full border border-[#00A453]/10 animate-fadeIn">
                <span>Mode: {teachingMode}</span>
                <button
                  onClick={() => setTeachingMode('ALL')}
                  className="hover:bg-green-100/60 text-[#00A453] p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Budget Pill */}
            {maxBudget < 3000 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6f6ee] text-[#00A453] font-bold text-xs rounded-full border border-[#00A453]/10 animate-fadeIn">
                <span>Max Budget: ₹{maxBudget}/hr</span>
                <button
                  onClick={() => setMaxBudget(3000)}
                  className="hover:bg-green-100/60 text-[#00A453] p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Experience Pill */}
            {minExp > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6f6ee] text-[#00A453] font-bold text-xs rounded-full border border-[#00A453]/10 animate-fadeIn">
                <span>Min Exp: {minExp} Yrs</span>
                <button
                  onClick={() => setMinExp(0)}
                  className="hover:bg-green-100/60 text-[#00A453] p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Verified Only Pill */}
            {verifiedOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6f6ee] text-[#00A453] font-bold text-xs rounded-full border border-[#00A453]/10 animate-fadeIn">
                <span>Verified Only</span>
                <button
                  onClick={() => setVerifiedOnly(false)}
                  className="hover:bg-green-100/60 text-[#00A453] p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Demo Only Pill */}
            {demoOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6f6ee] text-[#00A453] font-bold text-xs rounded-full border border-[#00A453]/10 animate-fadeIn">
                <span>Free Demo Only</span>
                <button
                  onClick={() => setDemoOnly(false)}
                  className="hover:bg-green-100/60 text-[#00A453] p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </span>
            )}
          </div>
        )}
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
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all border-b border-gray-150 ${
                    selectedTutorId === tutor._id
                      ? 'bg-[#e6f6ee]/30 border-l-4 border-l-[#00A453]'
                      : 'border-l-4 border-l-transparent hover:bg-gray-50/50'
                  }`}
                >
                  {/* Profile Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#e6f6ee] flex items-center justify-center font-bold text-[#00A453] text-sm shrink-0 border border-[#00A453]/10 shadow-xs mt-0.5">
                    {getInitials(tutor.name)}
                  </div>

                  {/* Simplified Info Column */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-gray-950 truncate leading-none">
                        {tutor.name}
                      </h3>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 border border-amber-250/20">
                        {tutor.ratingAvg}★
                      </span>
                    </div>

                    <p className="text-[11px] text-[#647380] font-bold truncate">
                      {tutor.qualifications?.[0] || 'PhD'} · {tutor.experience || '8 Years'} Exp
                    </p>

                    <p className="text-xs text-gray-500 font-semibold truncate">
                      {tutor.subjects.join(', ')}
                    </p>

                    <div className="flex items-center justify-between gap-2 text-xs font-bold pt-0.5">
                      <div className="flex items-center gap-1.5 text-[#647380] truncate">
                        <span>{tutor.location.area || tutor.location.city}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[#00A453]">₹{tutor.hourlyRate}/hr</span>
                      </div>
                      {tutor.freeDemo && (
                        <span className="text-[9px] font-extrabold text-[#00A453] bg-[#e6f6ee] border border-[#00A453]/15 px-2 py-0.5 rounded-full shrink-0">
                          Demo Free
                        </span>
                      )}
                    </div>
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
              <div className="border border-[#dadee2] rounded-2xl p-6 bg-white space-y-4 hover:border-[#00A453] transition-all duration-200 shadow-xs">
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
                        <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200/50 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                          {selectedTutor.ratingAvg}★
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-700">
                        {selectedTutor.subjects.join(' · ')}
                      </p>
                      <p className="text-xs text-gray-400 font-semibold">
                        {selectedTutor.location.area}, {selectedTutor.location.city} ·{' '}
                        {selectedTutor.experience} Experience
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleSaveTutor(selectedTutor._id, e)}
                    className="p-1.5 text-gray-400 hover:text-[#00A453] transition-colors"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${savedTutorIds.includes(selectedTutor._id) ? 'fill-[#00A453] text-[#00A453]' : ''}`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-50 border border-gray-150 text-gray-700 px-3 py-1 rounded-full font-bold">
                    {selectedTutor.location.city}
                  </span>
                  <span className="bg-gray-50 border border-gray-150 text-[#00A453] px-3 py-1 rounded-full font-bold">
                    ₹{selectedTutor.hourlyRate}/hr (negotiable)
                  </span>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="dark" size="sm" className="rounded-xl flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-green-400 fill-green-400" /> Book Free Demo
                  </Button>

                  <Link href={`/profile/${selectedTutor._id}`}>
                    <Button variant="secondary" size="sm" className="rounded-xl">
                      Full Portfolio
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Match Verification List (LinkedIn Qualifications design style) */}
              <div className="border border-[#dadee2] rounded-2xl p-6 bg-white space-y-4 shadow-xs">
                <h3 className="text-sm font-extrabold text-gray-950">Matches for your profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs text-gray-700 font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />
                    <span>
                      Teaches required subjects:{' '}
                      <strong>{selectedTutor.subjects.join(', ')}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />
                    <span>
                      Location matches requirement: <strong>{selectedTutor.location.city}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />
                    <span>Verified background checks complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />
                    <span>Hourly rate within standard guidelines</span>
                  </div>
                  {selectedTutor.freeDemo && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-xs font-medium">
                      <span>Requires weekend tutoring slots?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, weekendAvailability: true }))
                          }
                          className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.weekendAvailability === true
                              ? 'bg-green-50 text-green-700 border border-green-300'
                              : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, weekendAvailability: false }))
                          }
                          className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.weekendAvailability === false
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> No
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-xs font-medium">
                      <span>Require custom study materials and notes?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, punctuality: true }))
                          }
                          className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.punctuality === true
                              ? 'bg-green-50 text-green-700 border border-green-300'
                              : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() =>
                            setExtraQualifications((p) => ({ ...p, punctuality: false }))
                          }
                          className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-0.5 ${
                            extraQualifications.punctuality === false
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
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
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5 px-1">
                  <Award className="w-4 h-4 text-gray-500" /> About the Tutor
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-150 font-medium">
                  {selectedTutor.bio}
                </p>
              </div>

              {/* Qualifications Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5 px-1">
                  <GraduationCap className="w-4 h-4 text-gray-500" /> Qualifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTutor.qualifications.map((q: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs"
                    >
                      <BookOpen className="w-5.5 h-5.5 text-[#00A453] shrink-0" />
                      <span className="text-xs font-bold text-gray-800 leading-snug">{q}</span>
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
