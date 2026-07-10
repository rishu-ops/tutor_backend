'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requirementApi } from '@/lib/api';

const CATEGORIES = [
  'School Education',
  'College Education',
  'Competitive Exams',
  'Programming',
  'Languages',
  'Music',
  'Arts & Design',
  'Professional Skills',
  'Sports & Fitness',
  'Personal Development',
];

const TEACHING_MODES = ['Online', 'Home Tuition', 'Group Classes'];

export default function BrowseRequirementsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  // States for search and filter values
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [teachingMode, setTeachingMode] = useState('');
  const [city, setCity] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Results & Pagination
  const [requirements, setRequirements] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trigger search on parameter change
  const fetchRequirements = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    const filters = {
      search,
      category,
      subject,
      teachingMode,
      city,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
    };

    try {
      const res = await requirementApi.searchRequirements(filters, page, 10, token);
      if (res.success && res.items) {
        setRequirements(res.items);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setError(res.error || res.message || 'Failed to search requirements.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading requirements.');
    } finally {
      setLoading(false);
    }
  }, [token, page, category, teachingMode, minBudget, maxBudget]);

  // Handle live updates on category/mode selections, but debounce search/text filters if necessary
  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setSubject('');
    setTeachingMode('');
    setCity('');
    setMinBudget('');
    setMaxBudget('');
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequirements();
  };

  return (
    <>
      <div className="max-w-[1250px] mx-auto py-4 space-y-6 text-[#2d2d2d]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Browse Requirements</h1>
            <p className="text-xs text-[#647380] mt-1">
              Search and filter active student learning requests on the platform.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="self-start md:self-auto border-[#dadee2] text-[#647380] flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-white"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT SIDEBAR: FILTERS PANEL */}
          <div className="bg-white border border-[#dadee2] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <h3 className="text-xs font-extrabold text-[#2d2d2d] flex items-center gap-1.5 uppercase tracking-wider border-b border-gray-50 pb-2">
              <Filter className="w-4 h-4 text-[#00A453]" /> Filters
            </h3>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#647380]">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-[#00A453]"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#647380]">Subject / Skill</label>
              <input
                type="text"
                placeholder="e.g. Mathematics, Python"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onBlur={() => {
                  setPage(1);
                  fetchRequirements();
                }}
                className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-[#00A453]"
              />
            </div>

            {/* Teaching Mode Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#647380]">Teaching Mode</label>
              <select
                value={teachingMode}
                onChange={(e) => {
                  setTeachingMode(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-[#00A453]"
              >
                <option value="">All Modes</option>
                {TEACHING_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* City Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#647380]">City</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => {
                  setPage(1);
                  fetchRequirements();
                }}
                className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-[#00A453]"
              />
            </div>

            {/* Budget Fields */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#647380]">Hourly Budget (₹)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  onBlur={() => {
                    setPage(1);
                    fetchRequirements();
                  }}
                  className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A453]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  onBlur={() => {
                    setPage(1);
                    fetchRequirements();
                  }}
                  className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A453]"
                />
              </div>
            </div>
          </div>

          {/* MAIN RESULTS FEED */}
          <div className="lg:col-span-3 space-y-5">
            {/* Search Form bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#647380]" />
              <input
                type="text"
                placeholder="Search descriptions, topics, or requirements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 bg-white text-sm rounded-xl border border-[#dadee2] focus:border-[#00A453] focus:outline-none transition-all placeholder-[#647380] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-[#00A453] hover:bg-[#009048] text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </form>

            {/* Error alerts */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* List and Loading templates */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#dadee2] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-pulse"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <div className="space-y-1.5 py-1">
                          <div className="h-3 bg-gray-100 rounded w-28"></div>
                          <div className="h-2 bg-gray-100 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded w-12"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : requirements.length === 0 ? (
              <div className="bg-white border border-[#dadee2] rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-[#f4f7f6] border border-[#00A453]/10 rounded-full flex items-center justify-center mx-auto text-2xl">
                  🔎
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-extrabold text-[#2d2d2d]">
                    No Requirements Match Your Filters
                  </h3>
                  <p className="text-xs text-[#647380] leading-relaxed">
                    Try relaxing your search terms, changing the category, or expanding budget
                    boundaries to explore more tutoring openings.
                  </p>
                  <Button
                    onClick={handleReset}
                    className="bg-[#00060c] text-white hover:bg-slate-800 text-xs font-bold rounded-lg px-4 mt-2"
                  >
                    Reset Search
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {requirements.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white border border-[#dadee2] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:border-gray-300 transition-all flex flex-col justify-between"
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
                        <span className="text-[10px] text-[#647380] flex items-center gap-1 mt-0.5 font-medium">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(req.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
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
                      <span className="text-xs font-semibold text-[#00A453]">
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

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className="border-[#dadee2] disabled:opacity-50 text-xs gap-1 py-2 font-semibold bg-white"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <span className="text-xs text-[#647380] font-semibold">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      className="border-[#dadee2] disabled:opacity-50 text-xs gap-1 py-2 font-semibold bg-white"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
