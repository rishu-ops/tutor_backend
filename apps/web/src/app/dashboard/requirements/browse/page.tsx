'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Zap,
  Bookmark,
  Check,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { requirementApi, applicationApi } from '@/lib/api';
import ApplyModal from '@/components/sections/ApplyModal';

const CATEGORIES = [
  'School Education',
  'College Education',
  'Competitive Exams',
  'Programming & Tech',
  'Languages',
  'Music & Arts',
  'Arts & Design',
  'Professional Skills',
  'Sports & Fitness',
];

const CardSkeleton = () => (
  <div className="p-4 flex items-start gap-3 bg-white animate-pulse border-b border-gray-100">
    <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-10" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-44" />
      <div className="h-3.5 bg-gray-200 rounded w-32" />
      <div className="h-3 bg-gray-200 rounded w-28" />
      <div className="h-4 bg-gray-200 rounded w-24" />
    </div>
  </div>
);

const TEACHING_MODES = ['Online', 'Home Tuition', 'Group Classes'];

export default function BrowseRequirementsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  // States for search and filter values
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [teachingMode, setTeachingMode] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [datePosted, setDatePosted] = useState('any'); // 'any' | 'day' | '3days' | 'week'
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [modeOpen, setModeOpen] = useState(true);
  const [datePostedOpen, setDatePostedOpen] = useState(true);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Selected requirement for detail pane
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [savedReqIds, setSavedReqIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [sortByDropdownOpen, setSortByDropdownOpen] = useState(false);

  // Interactive specs checklist answers
  const [extraSpecs, setExtraSpecs] = useState({
    sessionLength: null as boolean | null,
    materialsProvided: null as boolean | null,
  });

  // Results & Pagination
  const [requirements, setRequirements] = useState<any[]>([]);
  const [tutorApplications, setTutorApplications] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apply Modal state
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Fetch tutor's applications to check if already applied
  const fetchTutorApplications = useCallback(async () => {
    if (!token || user?.role !== 'TUTOR') return;
    try {
      const res = await applicationApi.getMyApplications(token);
      if (res.success && res.data) {
        setTutorApplications(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, user]);

  // Trigger search on parameter change
  const fetchRequirements = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    const filters = {
      search,
      category,
      teachingMode,
      city: location || undefined,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
    };

    try {
      const res = await requirementApi.searchRequirements(filters, page, 10, token);
      if (res.success && res.items) {
        setRequirements(res.items);
        if (res.items.length > 0) {
          setSelectedReqId(res.items[0]._id);
        }
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
  }, [token, page, category, teachingMode, minBudget, maxBudget, search, location]);

  useEffect(() => {
    fetchRequirements();
    fetchTutorApplications();
  }, [fetchRequirements, fetchTutorApplications]);

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setTeachingMode('');
    setLocation('');
    setMinBudget('');
    setMaxBudget('');
    setDatePosted('any');
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequirements();
  };

  const filteredRequirements = requirements.filter((req) => {
    if (datePosted === 'any') return true;
    const reqDate = new Date(req.createdAt).getTime();
    const now = Date.now();
    const diffHours = (now - reqDate) / (1000 * 60 * 60);
    if (datePosted === 'day') return diffHours <= 24;
    if (datePosted === '3days') return diffHours <= 72;
    if (datePosted === 'week') return diffHours <= 168;
    return true;
  });

  // Keep first item selected when requirements list updates
  useEffect(() => {
    if (filteredRequirements.length > 0) {
      const exists = filteredRequirements.some((r) => r._id === selectedReqId);
      if (!exists) {
        setSelectedReqId(filteredRequirements[0]._id);
      }
    } else {
      setSelectedReqId(null);
    }
  }, [filteredRequirements]);

  const toggleSaveReq = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedReqIds((prev) =>
      prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
    );
  };

  const selectedReq = filteredRequirements.find((r) => r._id === selectedReqId);
  const hasApplied =
    selectedReq &&
    tutorApplications.some((app: any) => {
      const appId = app.requirementId?._id || app.requirementId;
      return appId === selectedReq._id;
    });

  const getInitials = (title?: string) => {
    const target = title || '📚';
    return target.slice(0, 1);
  };

  // Active filters count
  const activeFiltersCount =
    (category ? 1 : 0) +
    (teachingMode ? 1 : 0) +
    (minBudget || maxBudget ? 1 : 0) +
    (datePosted !== 'any' ? 1 : 0);

  return (
    <div className="max-w-[1300px] mx-auto flex flex-col h-[calc(100vh-100px)] bg-white text-[#2d2d2d] font-sans">
      {/* Top Combined Search Bar Row (LinkedIn/Indeed style) */}
      <div className="px-6 py-4 flex flex-col gap-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto w-full">
          {/* Double Search Bar Wrapper */}
          <div className="flex items-center flex-1 bg-gray-50 border border-gray-300 rounded-full overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-green-600 focus-within:border-green-600 transition-all">
            {/* Search topic input */}
            <div className="flex items-center flex-1 px-4 py-2 gap-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Topic, class or curriculum details"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-500 font-medium"
              />
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-gray-300 shrink-0" />

            {/* Location city input */}
            <div className="flex items-center flex-1 px-4 py-2 gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Delhi, Noida, Bangalore, etc."
                className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-500 font-medium"
              />
            </div>
          </div>

          {/* Adjust Filters Button */}
          <div className="relative">
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-sm font-semibold transition-colors ${
                filtersOpen || activeFiltersCount > 0
                  ? 'border-green-600 bg-green-50/35 text-green-700 font-extrabold'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Popover Dropdown Card (Indeed/LinkedIn style) */}
            {filtersOpen && (
              <div className="absolute right-0 top-12 md:w-100 w-auto bg-white border border-gray-250 rounded-2xl shadow-xl z-50 flex flex-col md:max-h-[500px] max-h-auto overflow-hidden">
                {/* Sticky Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-4 shrink-0 bg-white z-10">
                  <span className="font-extrabold text-gray-950 text-sm">Filter requirements</span>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6 border rounded-full p-1" />
                  </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setCategoryOpen(!categoryOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-705  tracking-wider select-none cursor-pointer">
                        Category
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {categoryOpen && (
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="py-2 rounded-xl h-10 text-xs font-semibold"
                      >
                        <option value="">All Categories</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
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
                      <label className="text-xs font-extrabold text-gray-705  tracking-wider select-none cursor-pointer">
                        Tuition Mode
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${modeOpen ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {modeOpen && (
                      <Select
                        value={teachingMode}
                        onChange={(e) => setTeachingMode(e.target.value)}
                        className="py-2 rounded-xl h-10 text-xs font-semibold"
                      >
                        <option value="">Any Mode</option>
                        {TEACHING_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>

                  <div className="border-b border-gray-100" />

                  {/* Budget Range (Salary Range style) */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-[#384148]  tracking-wider block">
                      Budget Range
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Min (₹)"
                          value={minBudget}
                          onChange={(e) => setMinBudget(e.target.value)}
                          className="h-10 py-2 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <span className="text-gray-450 text-xs">-</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Max (₹)"
                          value={maxBudget}
                          onChange={(e) => setMaxBudget(e.target.value)}
                          className="h-10 py-2 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-100" />

                  {/* Date Posted (Indeed style checkable accordion) */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setDatePostedOpen(!datePostedOpen)}
                    >
                      <label className="text-xs font-extrabold text-gray-708  tracking-wider select-none cursor-pointer">
                        Date posted
                      </label>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-450 transition-transform ${datePostedOpen ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {datePostedOpen && (
                      <div className="space-y-1 pt-1">
                        {[
                          { label: 'Any time', value: 'any' },
                          { label: 'Last day', value: 'day' },
                          { label: 'Last 3 days', value: '3days' },
                          { label: 'Last week', value: 'week' },
                        ].map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => setDatePosted(opt.value)}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <span>{opt.label}</span>
                            {datePosted === opt.value && (
                              <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                            )}
                          </div>
                        ))}
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
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-gray-100/60 mt-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">
              Active Filters:
            </span>

            {/* Category Pill */}
            {category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full border border-green-200 animate-fadeIn">
                <span>Category: {category}</span>
                <button
                  onClick={() => setCategory('')}
                  className="hover:bg-green-100 text-green-700 p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Teaching Mode Pill */}
            {teachingMode && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full border border-green-200 animate-fadeIn">
                <span>Mode: {teachingMode}</span>
                <button
                  onClick={() => setTeachingMode('')}
                  className="hover:bg-green-100 text-green-700 p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Budget Pill */}
            {(minBudget || maxBudget) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full border border-green-200 animate-fadeIn">
                <span>
                  Budget:{' '}
                  {minBudget && maxBudget
                    ? `₹${minBudget}-₹${maxBudget}`
                    : minBudget
                      ? `≥ ₹${minBudget}`
                      : `≤ ₹${maxBudget}`}
                </span>
                <button
                  onClick={() => {
                    setMinBudget('');
                    setMaxBudget('');
                  }}
                  className="hover:bg-green-100 text-green-700 p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Date Posted Pill */}
            {datePosted !== 'any' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full border border-green-200 animate-fadeIn">
                <span>
                  Posted:{' '}
                  {datePosted === 'day'
                    ? 'Last 24h'
                    : datePosted === '3days'
                      ? 'Last 3 days'
                      : 'Last week'}
                </span>
                <button
                  onClick={() => setDatePosted('any')}
                  className="hover:bg-green-100 text-green-700 p-0.5 rounded-full transition-colors ml-0.5"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              </span>
            )}

            {/* Reset All Filters Button */}
            <button
              onClick={handleReset}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors ml-2 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Split Pane Container */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Pane: Requirements list */}
        <div
          className={`w-full md:w-[400px] border-r border-gray-200 bg-white overflow-y-auto shrink-0 flex flex-col justify-between ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Header Row */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {filteredRequirements.length} Active requirements{' '}
                {location ? `in ${location}` : 'globally'}
              </span>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortByDropdownOpen((o) => !o)}
                  className="text-xs font-bold text-gray-700 flex items-center gap-1 hover:text-green-700 transition-colors"
                >
                  Sort: {sortBy === 'newest' ? 'Newest first' : 'Proposals count'}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {sortByDropdownOpen && (
                  <div className="absolute right-0 top-6 bg-white border border-gray-250 shadow-md py-1 z-35 rounded w-40 text-xs">
                    <button
                      onClick={() => {
                        setSortBy('newest');
                        setSortByDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      Newest first
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('proposals');
                        setSortByDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      Proposals count
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error box */}
            {error && (
              <div className="p-4 bg-red-50 text-red-650 text-xs font-medium border-b border-red-100">
                ⚠️ {error}
              </div>
            )}

            {/* Cards List */}
            <div className="divide-y divide-gray-150">
              {loading ? (
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <CardSkeleton key={idx} />
                  ))}
                </div>
              ) : filteredRequirements.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2 mt-8">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-800">No student requirements found</p>
                  <p className="text-[11px] text-gray-500">Try broad filters or search terms.</p>
                </div>
              ) : (
                filteredRequirements.map((req) => {
                  const reqHasApplied = tutorApplications.some((app: any) => {
                    const appId = app.requirementId?._id || app.requirementId;
                    return appId === req._id;
                  });

                  return (
                    <div
                      key={req._id}
                      onClick={() => {
                        setSelectedReqId(req._id);
                        setShowMobileDetail(true);
                      }}
                      className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50/70 transition-all relative ${
                        selectedReqId === req._id
                          ? 'bg-green-50/20 border-l-[3px] border-green-600'
                          : 'border-l-[3px] border-transparent'
                      }`}
                    >
                      {/* Left icon */}
                      <div className="w-10 h-10 rounded bg-[#e6f6ee] flex items-center justify-center font-bold text-green-700 text-sm shrink-0 border border-green-100">
                        {getInitials(req.curriculum?.subject || req.category)}
                      </div>

                      {/* Info body */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-gray-500 hover:underline">
                            {req.category}
                          </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-gray-950 leading-tight">
                          {req.curriculum?.subject || req.category}
                        </h3>

                        <p className="text-xs text-gray-600 font-medium">
                          {req.curriculum?.level}{' '}
                          {req.curriculum?.board ? `· ${req.curriculum.board}` : ''}
                        </p>

                        <p className="text-xs text-gray-400">
                          {req.location.area}, {req.location.city}
                        </p>

                        <p className="text-xs font-bold text-gray-950 pt-0.5">
                          ₹{req.budget.min}–{req.budget.max}{' '}
                          <span className="text-[10px] text-gray-450 font-normal">
                            /{req.budget.feeType.toLowerCase().replace('_', ' ')}
                          </span>
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                            🏡 {req.teachingMode.join(', ')}
                          </span>
                          {reqHasApplied && (
                            <span className="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                              Applied
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Save & Posted date Column */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                        <button
                          onClick={(e) => toggleSaveReq(req._id, e)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${savedReqIds.includes(req._id) ? 'fill-green-600 text-green-600' : ''}`}
                          />
                        </button>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(req.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="border-t border-gray-250 p-3 bg-gray-50 flex items-center justify-between shrink-0">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="h-8 text-xs font-semibold px-4 rounded bg-white border-gray-300 text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <span className="text-xs font-medium text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="h-8 text-xs font-semibold px-4 rounded bg-white border-gray-300 text-gray-700"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right Pane: Detailed Requirement View */}
        <div
          className={`flex-1 bg-white overflow-y-auto ${
            showMobileDetail ? 'block' : 'hidden md:block'
          }`}
        >
          {selectedReq ? (
            <div className="p-8 space-y-6 max-w-3xl">
              {/* Back button on mobile */}
              <div className="md:hidden pb-4 border-b border-gray-150 mb-4">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
                >
                  ← Back to list
                </button>
              </div>
              {/* Header card container */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-gray-150 flex items-center justify-center font-bold text-gray-700 text-lg shrink-0">
                      {getInitials(selectedReq.curriculum?.subject || selectedReq.category)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-extrabold text-gray-950 leading-tight">
                          {selectedReq.curriculum?.subject || selectedReq.category}
                        </h2>
                        <span className="inline-flex items-center text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                          <Circle className="w-2 h-2 fill-green-500 text-green-500 mr-1.5" /> ACTIVE
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {selectedReq.curriculum?.level}{' '}
                        {selectedReq.curriculum?.board ? `· ${selectedReq.curriculum.board}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedReq.location.area}, {selectedReq.location.city} · Posted{' '}
                        {new Date(selectedReq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleSaveReq(selectedReq._id, e)}
                    className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${savedReqIds.includes(selectedReq._id) ? 'fill-green-600 text-green-600' : ''}`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-semibold">
                    🏡 {selectedReq.teachingMode.join(', ')}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-semibold">
                    💰 Budget: ₹{selectedReq.budget.min} - ₹{selectedReq.budget.max} (
                    {selectedReq.budget.feeType.toLowerCase().replace('_', ' ')})
                  </span>
                </div>

                {/* Primary Action Row */}
                <div className="flex items-center gap-3 pt-2">
                  {hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-6 py-2.5 rounded-lg text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Proposal Submitted
                    </span>
                  ) : (
                    <Button
                      onClick={() => setIsApplyOpen(true)}
                      className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-sm px-6 h-10 rounded-lg flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 text-green-400 fill-green-400" /> Easy Apply
                    </Button>
                  )}
                </div>
              </div>

              {/* Match Verification Grid List (LinkedIn Qualifications style) */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
                <h3 className="text-sm font-bold text-gray-950">Matching criteria for this role</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Location matches your profile tutoring city</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>
                      Teaches subject category: <strong>{selectedReq.category}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Tutoring budget matches your rates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Open tuition format matches your preference</span>
                  </div>
                </div>

                {/* Interactive check/cross question block (Indeed/LinkedIn style) */}
                <div className="border-t border-gray-150 pt-4 mt-2 space-y-3">
                  <p className="text-xs font-bold text-gray-800">
                    Confirm slot preferences & specs
                  </p>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span>Are you available for 2-hour sessions?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExtraSpecs((p) => ({ ...p, sessionLength: true }))}
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraSpecs.sessionLength === true
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() => setExtraSpecs((p) => ({ ...p, sessionLength: false }))}
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraSpecs.sessionLength === false
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> No
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span>Can you provide printouts and reference tests?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExtraSpecs((p) => ({ ...p, materialsProvided: true }))}
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraSpecs.materialsProvided === true
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() => setExtraSpecs((p) => ({ ...p, materialsProvided: false }))}
                          className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                            extraSpecs.materialsProvided === false
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

              {/* Requirement Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" /> Subject Requirements
                </h3>
                <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedReq.description}
                </p>
              </div>

              {/* Safe interactions advisory */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800">Safety & Verification Advisory</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Always conduct classes via verified channels, and discuss demo sessions
                    transparently. Do not complete payments outside of standard guidelines. Contact
                    support if you identify suspicious profiles.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center text-gray-400">
              Select a requirement from the list to view details.
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal overlay */}
      {selectedReq && (
        <ApplyModal
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          requirementId={selectedReq._id}
          requirementSubject={selectedReq.curriculum?.subject || selectedReq.category}
          requirementCategory={selectedReq.category}
          defaultBudgetMin={selectedReq.budget.min}
          defaultBudgetMax={selectedReq.budget.max}
          onSuccess={() => {
            fetchTutorApplications();
            fetchRequirements();
          }}
        />
      )}
    </div>
  );
}
