'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { requirementApi } from '@/lib/api';
import DashboardLayout from '../../../layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, X, AlertCircle, Loader2, Layers, BookOpen } from 'lucide-react';

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Hindi',
  'Social Science',
];

const TEACHING_MODES = [
  { id: 'Home Tuition', label: '🏡 Home Tuition' },
  { id: 'Online', label: '💻 Online Class' },
  { id: 'Group Classes', label: '👥 Group Classes' },
];

const SCHEDULES = [
  { id: 'Morning', label: '🌅 Morning' },
  { id: 'Afternoon', label: '☀️ Afternoon' },
  { id: 'Evening', label: '🌆 Evening' },
  { id: 'Weekdays', label: '📅 Weekdays' },
  { id: 'Weekends', label: '🗓️ Weekends' },
];

const FEE_TYPES = [
  { id: 'PER_HOUR', label: 'Per Hour (₹)' },
  { id: 'PER_MONTH', label: 'Per Month (₹)' },
  { id: 'PER_SESSION', label: 'Per Session (₹)' },
];

export default function EditRequirementPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');

  // Form states
  const [category, setCategory] = useState('');
  const [curriculum, setCurriculum] = useState({ board: '', level: '', subject: '' });
  const [teachingMode, setTeachingMode] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [location, setLocation] = useState({ city: '', area: '', address: '' });
  const [budget, setBudget] = useState({ min: '', max: '', feeType: 'PER_HOUR' });
  const [description, setDescription] = useState('');

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchDetail = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError('');
      const res = await requirementApi.getRequirementDetail(id, token);
      if (res.success && res.data) {
        const req = res.data;
        if (req.status !== 'OPEN') {
          setError('Only requirements in OPEN status can be edited.');
          return;
        }
        setCategory(req.category);
        setCurriculum(req.curriculum || { board: '', level: '', subject: '' });
        setTeachingMode(req.teachingMode || []);
        setSchedule(req.schedule || []);
        setLocation({
          city: req.location.city || '',
          area: req.location.area || '',
          address: req.location.address || '',
        });
        setBudget({
          min: String(req.budget.min || ''),
          max: String(req.budget.max || ''),
          feeType: req.budget.feeType || 'PER_HOUR',
        });
        setDescription(req.description || '');
      } else {
        setError(res.error || 'Failed to load requirement details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading details');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (category === 'School Education') {
      if (!curriculum.board) errs.board = 'Please select a board';
      if (!curriculum.level) errs.level = 'Please select a class';
      if (!curriculum.subject) errs.subject = 'Please select a subject';
    }

    if (teachingMode.length === 0) errs.teachingMode = 'Select at least one teaching mode';
    if (schedule.length === 0) errs.schedule = 'Select at least one schedule option';

    if (!location.city.trim()) errs.city = 'City is required';
    if (!location.area.trim()) errs.area = 'Area is required';

    const minNum = Number(budget.min);
    const maxNum = Number(budget.max);
    if (!budget.min) errs.min = 'Minimum budget is required';
    else if (isNaN(minNum) || minNum <= 0) errs.min = 'Must be positive';
    if (!budget.max) errs.max = 'Maximum budget is required';
    else if (isNaN(maxNum) || maxNum <= 0) errs.max = 'Must be positive';
    if (!errs.min && !errs.max && minNum > maxNum) {
      errs.min = 'Minimum budget cannot exceed maximum';
    }

    if (description.trim().length < 20) {
      errs.description = `Description must be at least 20 characters (current: ${description.trim().length})`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleTeachingMode = (mode: string) => {
    setTeachingMode((modes) =>
      modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode]
    );
    setErrors((e) => ({ ...e, teachingMode: '' }));
  };

  const toggleSchedule = (sched: string) => {
    setSchedule((scheds) =>
      scheds.includes(sched) ? scheds.filter((s) => s !== sched) : [...scheds, sched]
    );
    setErrors((e) => ({ ...e, schedule: '' }));
  };

  const handleSave = async () => {
    if (!validate() || !token) return;
    setSaveLoading(true);
    setServerError('');

    const payload = {
      curriculum: category === 'School Education' ? curriculum : undefined,
      teachingMode,
      schedule,
      location: {
        city: location.city.trim(),
        area: location.area.trim(),
        address: location.address.trim() || undefined,
      },
      budget: {
        min: Number(budget.min),
        max: Number(budget.max),
        feeType: budget.feeType,
      },
      description: description.trim(),
    };

    try {
      const res = await requirementApi.updateRequirement(id, payload, token);
      if (res.success) {
        router.push(`/dashboard/requirements/${id}`);
      } else {
        setServerError(res.error || res.message || 'Failed to update');
      }
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while saving.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#647380]">Loading requirement for editing…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-[8px] p-6 text-center max-w-md mx-auto mt-12 space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-600 font-bold">
            <AlertCircle className="w-6 h-6" />
            <h3>Cannot Edit</h3>
          </div>
          <p className="text-sm text-red-600">{error}</p>
          <Button size="sm" onClick={() => router.push(`/dashboard/requirements/${id}`)}>
            Back to Details
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isSchoolEd = category === 'School Education';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        <button
          onClick={() => router.push(`/dashboard/requirements/${id}`)}
          className="flex items-center gap-1 text-sm text-[#647380] hover:text-[#2d2d2d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel and Back
        </button>

        <div className="bg-white border border-[#dadee2] rounded-xl p-8 shadow-sm space-y-8">
          <div className="border-b border-gray-100 pb-5">
            <h1 className="text-2xl font-extrabold text-[#2d2d2d] tracking-tight">
              Edit Requirement
            </h1>
            <p className="text-sm text-[#647380] mt-1">
              Update details for your posted tutoring requirement.
            </p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-[4px] px-4 py-3 text-sm font-medium">
              ⚠️ {serverError}
            </div>
          )}

          <div className="space-y-6">
            {/* Category (read-only) */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[#647380]">Category</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-[4px] text-sm text-[#2d2d2d] font-semibold">
                {category}
              </div>
            </div>

            {/* School Education Fields */}
            {isSchoolEd && (
              <div className="space-y-4 border-t border-gray-50 pt-5">
                <h3 className="font-bold text-sm text-[#2d2d2d] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#00A453]" /> Curriculum Details
                </h3>

                {/* Board */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">Board</label>
                  <div className="flex flex-wrap gap-2">
                    {BOARDS.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setCurriculum((c) => ({ ...c, board: b }));
                          setErrors((e) => ({ ...e, board: '' }));
                        }}
                        className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${
                          curriculum.board === b
                            ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                            : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  {errors.board && <p className="text-xs text-red-500 mt-1">{errors.board}</p>}
                </div>

                {/* Class */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">
                    Class / Grade
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CLASSES.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => {
                          setCurriculum((c) => ({ ...c, level: cls }));
                          setErrors((e) => ({ ...e, level: '' }));
                        }}
                        className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-all ${
                          curriculum.level === cls
                            ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                            : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                  {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level}</p>}
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">Subject</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => {
                          setCurriculum((c) => ({ ...c, subject: sub }));
                          setErrors((e) => ({ ...e, subject: '' }));
                        }}
                        className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${
                          curriculum.subject === sub
                            ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                            : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>
              </div>
            )}

            {/* PREFERENCES */}
            <div className="space-y-4 border-t border-gray-50 pt-5">
              <h3 className="font-bold text-sm text-[#2d2d2d]">Teaching Preferences</h3>

              {/* Modes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#647380]">Teaching Mode</label>
                <div className="flex flex-wrap gap-2">
                  {TEACHING_MODES.map((mode) => {
                    const isSelected = teachingMode.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        onClick={() => toggleTeachingMode(mode.id)}
                        className={`px-4 py-2.5 border rounded-md text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                            : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
                {errors.teachingMode && (
                  <p className="text-xs text-red-500 mt-1">{errors.teachingMode}</p>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-[#647380]">
                  Preferred Schedule
                </label>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULES.map((sched) => {
                    const isSelected = schedule.includes(sched.id);
                    return (
                      <button
                        key={sched.id}
                        onClick={() => toggleSchedule(sched.id)}
                        className={`px-4 py-2.5 border rounded-md text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                            : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                        }`}
                      >
                        {sched.label}
                      </button>
                    );
                  })}
                </div>
                {errors.schedule && <p className="text-xs text-red-500 mt-1">{errors.schedule}</p>}
              </div>
            </div>

            {/* LOCATION */}
            <div className="space-y-4 border-t border-gray-50 pt-5">
              <h3 className="font-bold text-sm text-[#2d2d2d]">Class Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#647380]">City</label>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => {
                      setLocation((l) => ({ ...l, city: e.target.value }));
                      setErrors((er) => ({ ...er, city: '' }));
                    }}
                    className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm focus:outline-none ${
                      errors.city ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#647380]">Area</label>
                  <input
                    type="text"
                    value={location.area}
                    onChange={(e) => {
                      setLocation((l) => ({ ...l, area: e.target.value }));
                      setErrors((er) => ({ ...er, area: '' }));
                    }}
                    className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm focus:outline-none ${
                      errors.area ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#647380]">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => setLocation((l) => ({ ...l, address: e.target.value }))}
                  className="w-full border border-[#dadee2] rounded-[4px] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#00A453]"
                />
              </div>
            </div>

            {/* BUDGET */}
            <div className="space-y-4 border-t border-gray-50 pt-5">
              <h3 className="font-bold text-sm text-[#2d2d2d]">Budget Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#647380]">
                    Minimum Budget (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={budget.min}
                    onChange={(e) => {
                      setBudget((b) => ({ ...b, min: e.target.value }));
                      setErrors((er) => ({ ...er, min: '' }));
                    }}
                    className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm focus:outline-none ${
                      errors.min ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.min && <p className="text-xs text-red-500 mt-1">{errors.min}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#647380]">
                    Maximum Budget (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={budget.max}
                    onChange={(e) => {
                      setBudget((b) => ({ ...b, max: e.target.value }));
                      setErrors((er) => ({ ...er, max: '' }));
                    }}
                    className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm focus:outline-none ${
                      errors.max ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.max && <p className="text-xs text-red-500 mt-1">{errors.max}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#647380]">Fee Type</label>
                <div className="flex gap-2">
                  {FEE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBudget((b) => ({ ...b, feeType: type.id }))}
                      className={`px-4 py-2 border rounded-md text-xs font-medium transition-all ${
                        budget.feeType === type.id
                          ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                          : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-4 border-t border-gray-50 pt-5">
              <h3 className="font-bold text-sm text-[#2d2d2d]">Goals & Details</h3>
              <div className="space-y-1.5">
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((er) => ({ ...er, description: '' }));
                  }}
                  className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm focus:outline-none resize-none ${
                    errors.description
                      ? 'border-red-400'
                      : 'border-[#dadee2] focus:border-[#00A453]'
                  }`}
                />
                <div className="flex items-center justify-between text-xs text-[#647380]">
                  <span>Minimum 20 characters.</span>
                  <span className={description.length < 20 ? 'text-amber-600' : 'text-[#00A453]'}>
                    {description.length} characters
                  </span>
                </div>
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-6">
            <Button
              variant="secondary"
              disabled={saveLoading}
              onClick={() => router.push(`/dashboard/requirements/${id}`)}
              className="gap-1 px-5 border-[#dadee2] rounded-[4px]"
            >
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveLoading}
              className="bg-[#00A453] hover:bg-[#009048] text-white gap-1.5 px-6 font-semibold rounded-[4px]"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
