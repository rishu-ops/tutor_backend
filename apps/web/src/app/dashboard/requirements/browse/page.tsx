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
  Circle,
  FileText,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requirementApi, applicationApi } from '@/lib/api';
import ApplyModal from '@/components/sections/ApplyModal';

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

  // Selected requirement for detail pane
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

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
  }, [token, page, category, teachingMode, minBudget, maxBudget]);

  useEffect(() => {
    fetchRequirements();
    fetchTutorApplications();
  }, [fetchRequirements, fetchTutorApplications]);

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

  // Keep first item selected when requirements list updates
  useEffect(() => {
    if (requirements.length > 0) {
      const exists = requirements.some((r) => r._id === selectedReqId);
      if (!exists) {
        setSelectedReqId(requirements[0]._id);
      }
    } else {
      setSelectedReqId(null);
    }
  }, [requirements]);

  const selectedReq = requirements.find((r) => r._id === selectedReqId);
  const hasApplied =
    selectedReq &&
    tutorApplications.some((app: any) => {
      const appId = app.requirementId?._id || app.requirementId;
      return appId === selectedReq._id;
    });

  return (
    <div className="max-w-[1300px] mx-auto flex flex-col h-[calc(100vh-140px)] bg-[#f3f4f6] text-[#2d2d2d]">
      {/* Top Filter and Search Bar Row (LinkedIn Job style) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">Browse Requirements</h1>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
              Active learning requests
            </span>
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-gray-500 hover:text-green-600 transition-colors"
          >
            Reset all filters
          </button>
        </div>

        {/* Filters Form Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Main search input */}
          <div className="relative min-w-[200px] max-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, board, details..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:border-green-600"
            />
          </div>

          <div className="relative min-w-[120px] max-w-[160px] flex-1">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City, e.g. Noida, Delhi"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:border-green-600"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-700 focus:outline-none focus:border-green-600"
            >
              <option value="">Category (All)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={teachingMode}
              onChange={(e) => {
                setTeachingMode(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-700 focus:outline-none focus:border-green-600"
            >
              <option value="">Mode (All)</option>
              {TEACHING_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {/* Quick budget filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-md px-2 py-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Budget Range</span>
            <input
              type="number"
              placeholder="Min"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="w-12 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400"
            />
            <span className="text-gray-300 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-12 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Requirements List */}
        <div className="w-[420px] border-r border-gray-200 bg-white overflow-y-auto shrink-0 flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 text-red-650 text-xs font-medium border-b border-red-150">
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-2 my-auto">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Loading requirements...</span>
              </div>
            ) : requirements.length === 0 ? (
              <div className="p-8 text-center text-gray-500 my-auto space-y-2">
                <Filter className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-800">No requirements found</p>
                <p className="text-xs text-gray-400">
                  Try broadening your search or resetting filters.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {requirements.map((req) => {
                  const reqHasApplied = tutorApplications.some((app: any) => {
                    const appId = app.requirementId?._id || app.requirementId;
                    return appId === req._id;
                  });

                  return (
                    <div
                      key={req._id}
                      onClick={() => setSelectedReqId(req._id)}
                      className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                        selectedReqId === req._id
                          ? 'bg-green-50/40 border-l-[3px] border-green-600'
                          : 'border-l-[3px] border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                        {req.curriculum?.subject?.[0] || req.category?.[0] || '📚'}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {req.curriculum?.subject || req.category}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium truncate">
                          {req.curriculum?.level}{' '}
                          {req.curriculum?.board ? `· ${req.curriculum.board}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {req.location.area}, {req.location.city}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                          <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                            {req.teachingMode.join(', ')}
                          </span>
                          {reqHasApplied && (
                            <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold">
                              Applied
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-gray-900">
                          ₹{req.budget.min}–{req.budget.max}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          /{req.budget.feeType.toLowerCase().replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination controls at the bottom of the list */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-between shrink-0">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="h-7 text-xs font-semibold px-3 rounded bg-white border-gray-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <span className="text-xs font-medium text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="h-7 text-xs font-semibold px-3 rounded bg-white border-gray-300"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Requirement View */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedReq ? (
            <div className="p-8 space-y-6 max-w-3xl">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedReq.curriculum?.subject || selectedReq.category}
                    </h2>
                    <span className="inline-flex items-center text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500 mr-1.5" /> ACTIVE
                      REQUIREMENT
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {selectedReq.curriculum?.level} ·{' '}
                    {selectedReq.curriculum?.board || 'Standard Curriculum'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedReq.location.area}, {selectedReq.location.city}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Posted {new Date(selectedReq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-400 font-medium">Budget</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      ₹{selectedReq.budget.min} – ₹{selectedReq.budget.max}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      /{selectedReq.budget.feeType.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    {hasApplied ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-lg text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> PROPOSAL SENT
                      </span>
                    ) : (
                      <Button
                        onClick={() => setIsApplyOpen(true)}
                        className="h-9 text-xs font-bold px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Insights Card */}
              <div className="bg-[#f0fdf4] border border-green-200 rounded-lg p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-green-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-green-800">Perfect Match Opportunity</p>
                  <p className="text-xs text-green-700 leading-relaxed">
                    Based on your profile skills and tutoring location, you match the subject,
                    board, and city criteria for this request. Parents are looking for active tutors
                    who can offer {selectedReq.teachingMode.join('/')}.
                  </p>
                </div>
              </div>

              {/* Parameters Table Grid */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Level
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {selectedReq.curriculum?.level || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Board / Curriculum
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {selectedReq.curriculum?.board || 'Any Board'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Format
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {selectedReq.teachingMode.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Proposals
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {selectedReq.applicationsCount || 0} received
                  </p>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" /> Learning Requirement Details
                </h3>
                <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedReq.description}
                </p>
              </div>

              {/* Safe interactions advisory */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 font-semibold">
                    Tutor Safety Advisory
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Always conduct demo sessions in public or verify parent profiles. Do not share
                    advance payment details or security deposits. Contact Project Tutor support if
                    you detect suspicious requests.
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

      {/* Apply Modal */}
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
