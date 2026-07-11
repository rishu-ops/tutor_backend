'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Search,
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
  GraduationCap,
  MessageSquare,
  Award,
  ChevronRight,
  TrendingUp,
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

  // Selected tutor for detailed pane
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);

  // Tutor list state
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch verified tutors list from mock or backend recommendations
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
          bio: 'Industry software engineer teaching programming fundamentals, frontend engineering, database architectures, and high-school computer science curriculum.',
          location: { city: 'Noida', area: 'Sector 15' },
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
          location: { city: 'Gurugram', area: 'DLF Phase 3' },
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

  // Apply filters in-memory
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

  // Automatically select first element if current selected tutor is not in filtered list
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
    tutors,
  ]);

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

  return (
    <div className="max-w-[1300px] mx-auto flex flex-col h-[calc(100vh-140px)] bg-[#f3f4f6]">
      {/* Top Filter and Search Bar Row (LinkedIn Job style) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">Find Tutors</h1>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
              {filteredTutors.length} results
            </span>
          </div>
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
            className="text-xs font-semibold text-gray-500 hover:text-green-600 transition-colors"
          >
            Reset all filters
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Inputs */}
          <div className="relative min-w-[200px] max-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subjects, skills, names..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:border-green-600"
            />
          </div>

          <div className="relative min-w-[140px] max-w-[180px] flex-1">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, e.g. Noida, Dwarka"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Quick Filter Selects */}
          <div>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-750 focus:outline-none focus:border-green-600"
            >
              <option value="">Subject (All)</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
              <option value="Web Development">Web Development</option>
            </select>
          </div>

          <div>
            <select
              value={teachingMode}
              onChange={(e) => setTeachingMode(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-750 focus:outline-none focus:border-green-600"
            >
              <option value="ALL">Teaching Mode (Any)</option>
              <option value="Online">Online</option>
              <option value="Home">Home Tuition</option>
            </select>
          </div>

          {/* Budget Limit Select */}
          <div>
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-750 focus:outline-none focus:border-green-600"
            >
              <option value="3000">Budget: Up to ₹3000/hr</option>
              <option value="1500">Up to ₹1500/hr</option>
              <option value="1000">Up to ₹1000/hr</option>
              <option value="700">Up to ₹700/hr</option>
            </select>
          </div>

          {/* Toggle buttons */}
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              verifiedOnly
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Verified Only
          </button>

          <button
            onClick={() => setDemoOnly((d) => !d)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              demoOnly
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Free Demo
          </button>
        </div>
      </div>

      {/* Main Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Tutor Cards List */}
        <div className="w-[420px] border-r border-gray-200 bg-white overflow-y-auto shrink-0 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2 my-auto">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 font-medium">
                Finding best tutor profiles...
              </span>
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="p-8 text-center text-gray-500 my-auto space-y-2">
              <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-800">No tutors found</p>
              <p className="text-xs text-gray-400">Try modifying or resetting the filters above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTutors.map((tutor) => (
                <div
                  key={tutor._id}
                  onClick={() => setSelectedTutorId(tutor._id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                    selectedTutorId === tutor._id
                      ? 'bg-green-50/40 border-l-[3px] border-green-600'
                      : 'border-l-[3px] border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                    {getInitials(tutor.name)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 truncate">{tutor.name}</p>
                      {tutor.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 fill-green-50" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-medium truncate">
                      {tutor.subjects.join(' · ')}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {tutor.location ? `${tutor.location.area}, ${tutor.location.city}` : 'India'}
                    </p>
                    <div className="flex items-center gap-2.5 pt-1">
                      <div className="flex items-center gap-0.5 text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                        {tutor.ratingAvg}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {tutor.experience} Exp
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-gray-900">
                      ₹{tutor.hourlyRate || 500}/hr
                    </p>
                    {tutor.freeDemo && (
                      <span className="inline-block text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded mt-1">
                        Demo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Tutor Detailed Preview */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedTutor ? (
            <div className="p-8 space-y-6 max-w-3xl">
              {/* Header/Identity Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {getInitials(selectedTutor.name)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">{selectedTutor.name}</h2>
                      {selectedTutor.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-50 text-green-700 px-2.5 py-0.5 rounded border border-green-200">
                          <CheckCircle className="w-3 h-3 text-green-600 fill-green-50" /> VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {selectedTutor.subjects.join(' · ')}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedTutor.location
                          ? `${selectedTutor.location.area}, ${selectedTutor.location.city}`
                          : 'India'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-semibold text-yellow-600">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                        {selectedTutor.ratingAvg} ({selectedTutor.reviewsCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-400 font-medium">Hourly Fee</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      ₹{selectedTutor.hourlyRate || 500}/hr
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${selectedTutor._id}`}>
                      <Button
                        variant="secondary"
                        className="h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 text-gray-700 bg-white"
                      >
                        Full Profile
                      </Button>
                    </Link>
                    <Button className="h-8 text-xs font-semibold px-4 rounded-lg bg-green-600 text-white hover:bg-green-700">
                      Message
                    </Button>
                  </div>
                </div>
              </div>

              {/* Match Insights Card (LinkedIn style) */}
              <div className="bg-[#f0fdf4] border border-green-200 rounded-lg p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-green-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-green-800">Perfect Match Opportunity</p>
                  <p className="text-xs text-green-700 leading-relaxed">
                    This tutor matches your learning subjects and location. They offer{' '}
                    {selectedTutor.teachingMode.join(' & ')} tuition.
                    {selectedTutor.freeDemo &&
                      ' You can book a free 30-minute demo class with them directly.'}
                  </p>
                </div>
              </div>

              {/* Experience and Details Table */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Experience
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{selectedTutor.experience}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Teaching Mode
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {selectedTutor.teachingMode.join(' / ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Hourly Rate
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    ₹{selectedTutor.hourlyRate || 500}/hr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Demo Available
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {selectedTutor.freeDemo ? 'Yes (Free)' : 'No'}
                  </p>
                </div>
              </div>

              {/* Qualifications */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
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

              {/* Biography Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gray-500" /> About the Tutor
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedTutor.bio}
                </p>
              </div>

              {/* Subjects tags */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Expertise Subjects
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTutor.subjects.map((sub: string) => (
                    <span
                      key={sub}
                      className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded font-semibold border border-gray-200"
                    >
                      {sub}
                    </span>
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
