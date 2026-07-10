'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
  DollarSign,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FindTutorsPage() {
  const token = useAuthStore((s) => s.accessToken);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [subject, setSubject] = useState('');
  const [teachingMode, setTeachingMode] = useState<string>('ALL');
  const [maxBudget, setMaxBudget] = useState<number>(3000);
  const [minExp, setMinExp] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [demoOnly, setDemoOnly] = useState(false);

  // Tutor list state
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch verified tutors list from mock or backend recommendations
  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch recommendation matching tutors or profiles
      const res = await fetch('/api/v1/recommendations/home', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      // Use matched recommendations if available, otherwise fallback to premium mock profiles
      if (data.success && data.recommended) {
        setTutors(data.recommended);
      } else {
        throw new Error();
      }
    } catch {
      // Mock profiles representing premium Airbnb style tutors
      setTutors([
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
          bio: 'Passionate educator specializing in preparing students for competitive boards exams.',
          location: { city: 'Noida', area: 'Sector 62' },
        },
        {
          _id: 'tutor-2',
          name: 'Priya Patel',
          subjects: ['Chemistry', 'Biology'],
          experience: '5 Years',
          ratingAvg: 4.8,
          reviewsCount: 18,
          qualifications: ['BTech in Biotechnology'],
          hourlyRate: 650,
          teachingMode: ['Online'],
          freeDemo: true,
          verified: true,
          bio: 'Specialist in making chemistry concepts interactive and easy to understand.',
          location: { city: 'Delhi', area: 'Dwarka' },
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
          bio: 'Industry professional teaching programming fundamentals and frontend engineering.',
          location: { city: 'Noida', area: 'Sector 15' },
        },
        {
          _id: 'tutor-4',
          name: "Sarah D'Souza",
          subjects: ['English', 'Literature'],
          experience: '12 Years',
          ratingAvg: 5.0,
          reviewsCount: 45,
          qualifications: ['MA in English Literature'],
          hourlyRate: 900,
          teachingMode: ['Home'],
          freeDemo: true,
          verified: false,
          bio: 'Focus on communication skills, creative writing, and high-school grammar curriculum.',
          location: { city: 'Gurugram', area: 'DLF Phase 3' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Apply filters in-memory
  const filteredTutors = tutors.filter((tutor) => {
    // Subject/Name Search
    if (searchTerm) {
      const matchName = tutor.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject = tutor.subjects.some((s: string) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchName && !matchSubject) return false;
    }
    // Location Filter
    if (location && tutor.location) {
      const matchCity = tutor.location.city.toLowerCase().includes(location.toLowerCase());
      const matchArea = tutor.location.area.toLowerCase().includes(location.toLowerCase());
      if (!matchCity && !matchArea) return false;
    }
    // Subject Specific Filter
    if (subject && !tutor.subjects.some((s: string) => s.toLowerCase() === subject.toLowerCase())) {
      return false;
    }
    // Teaching Mode Filter
    if (teachingMode !== 'ALL' && !tutor.teachingMode.includes(teachingMode)) {
      return false;
    }
    // Budget limit
    const rate = tutor.hourlyRate || tutor.budget?.max || 500;
    if (rate > maxBudget) {
      return false;
    }
    // Experience limit
    const expYrs = parseInt(tutor.experience) || 1;
    if (expYrs < minExp) {
      return false;
    }
    // Verification check
    if (verifiedOnly && !tutor.verified) {
      return false;
    }
    // Demo class check
    if (demoOnly && !tutor.freeDemo) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#dadee2] pb-6">
        <div>
          <h1 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">Find Tutors</h1>
          <p className="text-xs text-[#647380] mt-1">
            Search and filter verified professional tutors for your requirements.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0b8c1]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tutor name or subject..."
            className="w-full pl-10 pr-4 py-2 border border-[#dadee2] rounded-xl text-xs bg-white focus:outline-none focus:border-[#00A453] transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side Filters (Airbnb style) */}
        <div className="lg:col-span-1 bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm space-y-6 h-fit shrink-0">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-extrabold text-[#2d2d2d] flex items-center gap-1.5 uppercase tracking-wider text-gray-500">
              <SlidersHorizontal className="w-4 h-4 text-[#00A453]" /> Filters
            </h2>
            <button
              onClick={() => {
                setSearchTerm('');
                setLocation('');
                setSubject('');
                setTeachingMode('ALL');
                setMaxBudget(3000);
                setMinExp(0);
                setVerifiedOnly(false);
                setDemoOnly(false);
              }}
              className="text-[10px] font-bold text-gray-400 hover:text-[#00A453] transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#2d2d2d] uppercase tracking-wider text-gray-400">
              Location / Area
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Noida, Dwarka"
              className="w-full p-2.5 border border-[#dadee2] rounded-xl text-xs bg-[#FAFAFA] focus:outline-none focus:bg-white focus:border-[#00A453] transition-all"
            />
          </div>

          {/* Subject Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#2d2d2d] uppercase tracking-wider text-gray-400">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2.5 border border-[#dadee2] rounded-xl text-xs bg-[#FAFAFA] focus:outline-none focus:bg-white focus:border-[#00A453] transition-all"
            >
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
              <option value="Web Development">Web Development</option>
            </select>
          </div>

          {/* Format (Teaching Mode) */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#2d2d2d] uppercase tracking-wider text-gray-400">
              Format
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#FAFAFA] border border-[#dadee2] p-1 rounded-xl">
              {['ALL', 'Online', 'Home'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTeachingMode(mode)}
                  className={`text-[9px] font-bold py-1.5 px-2 rounded-lg text-center transition-all ${
                    teachingMode === mode
                      ? 'bg-white text-[#00A453] shadow-sm'
                      : 'text-[#647380] hover:text-[#2d2d2d]'
                  }`}
                >
                  {mode === 'ALL' ? 'Any' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Limit Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-extrabold text-[#2d2d2d] uppercase tracking-wider text-gray-400">
                Max Budget (₹/hr)
              </span>
              <span className="font-bold text-[#00A453]">₹{maxBudget}</span>
            </div>
            <input
              type="range"
              min="300"
              max="3000"
              step="50"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-[#00A453]"
            />
          </div>

          {/* Minimum Experience */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-extrabold text-[#2d2d2d] uppercase tracking-wider text-gray-400">
                Min Experience
              </span>
              <span className="font-bold text-[#00A453]">{minExp}+ Years</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="w-full accent-[#00A453]"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#2d2d2d]">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#00A453] focus:ring-[#00A453]"
              />
              <span className="font-semibold">Verified Tutors Only</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#2d2d2d]">
              <input
                type="checkbox"
                checked={demoOnly}
                onChange={(e) => setDemoOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#00A453] focus:ring-[#00A453]"
              />
              <span className="font-semibold">Free Demo Class Available</span>
            </label>
          </div>
        </div>

        {/* Right Side Tutors Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 text-center gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full" />
              <span className="text-xs text-[#647380]">Finding best tutor profiles...</span>
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="bg-white border border-[#dadee2] rounded-3xl p-12 text-center shadow-sm space-y-4">
              <Compass className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <h3 className="text-sm font-extrabold text-[#2d2d2d]">No matching tutors found</h3>
                <p className="text-xs text-[#647380] mt-1">
                  Try clearing some filters or broadening your search queries.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTutors.map((tutor) => (
                <div
                  key={tutor._id}
                  className="bg-white border border-[#dadee2] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Identity bar */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center font-bold text-[#00A453] text-sm shrink-0">
                          {tutor.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-extrabold text-[#2d2d2d] leading-none">
                              {tutor.name}
                            </h3>
                            {tutor.verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-[#00A453] fill-emerald-50 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#647380] mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />{' '}
                            {tutor.location
                              ? `${tutor.location.area}, ${tutor.location.city}`
                              : 'India'}
                          </p>
                        </div>
                      </div>

                      {/* Ratings */}
                      <div className="flex items-center gap-1 bg-[#fff8e6] text-[#b28b00] px-2 py-1 rounded-xl text-[10px] font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#b28b00]" />
                        <span>{tutor.ratingAvg}</span>
                        <span className="text-gray-400 font-medium">({tutor.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-[11px] text-[#647380] leading-relaxed line-clamp-2">
                      {tutor.bio}
                    </p>

                    {/* Subjects and Experience Badge */}
                    <div className="flex flex-wrap gap-1.5">
                      {tutor.subjects.map((sub: string) => (
                        <span
                          key={sub}
                          className="text-[9px] bg-gray-50 border border-gray-100 text-[#2d2d2d] font-bold px-2 py-0.5 rounded-lg"
                        >
                          {sub}
                        </span>
                      ))}
                      <span className="text-[9px] bg-[#e6f6ee] text-[#00A453] font-bold px-2 py-0.5 rounded-lg">
                        {tutor.experience} Experience
                      </span>
                    </div>

                    {/* Qualifications */}
                    <div className="text-[10px] text-[#647380] space-y-1">
                      <span className="font-extrabold text-[#2d2d2d] block text-[9px] uppercase tracking-wider text-gray-400">
                        Qualifications
                      </span>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {tutor.qualifications.map((q: string, idx: number) => (
                          <span key={idx} className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-gray-400" /> {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price footer */}
                  <div className="border-t border-gray-100 pt-4 mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-[#b0b8c1] block uppercase tracking-wider font-extrabold">
                        Proposed Fee
                      </span>
                      <span className="text-xs font-extrabold text-[#2d2d2d]">
                        ₹{tutor.hourlyRate || 500}
                        <span className="text-[10px] font-bold text-[#647380]">/hr</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {tutor.freeDemo && (
                        <span className="text-[9px] bg-emerald-50 text-[#00A453] font-extrabold px-2 py-1 rounded-xl">
                          Demo Available
                        </span>
                      )}
                      <Link href={`/profile/${tutor._id}`}>
                        <Button className="border border-[#dadee2] bg-white hover:bg-gray-50 text-[#2d2d2d] px-3.5 h-9 rounded-xl text-[10px] font-bold">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
