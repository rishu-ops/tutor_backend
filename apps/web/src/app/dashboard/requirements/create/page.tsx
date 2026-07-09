'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { requirementApi } from '@/lib/api';
import DashboardLayout from '../../layout';
import { Confetti } from '@/components/ui/confetti';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  BookOpen,
  MapPin,
  Clock,
  CircleDollarSign,
  FileText,
  Eye,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'School Education',
    label: '📚 School Education',
    desc: 'Classes 1-12, CBSE, ICSE, State Boards',
  },
  {
    id: 'College Education',
    label: '🎓 College Education',
    desc: 'Undergraduate and Postgraduate tutoring',
    comingSoon: true,
  },
  {
    id: 'Competitive Exams',
    label: '📝 Competitive Exams',
    desc: 'JEE, NEET, UPSC, Bank Exams',
    comingSoon: true,
  },
  {
    id: 'Programming',
    label: '💻 Programming',
    desc: 'Coding, Web Dev, DSA, AI',
    comingSoon: true,
  },
  {
    id: 'Languages',
    label: '🌍 Languages',
    desc: 'English, French, German, Spanish',
    comingSoon: true,
  },
  { id: 'Music', label: '🎵 Music', desc: 'Vocal, Guitar, Piano, Keyboard', comingSoon: true },
  {
    id: 'Arts & Design',
    label: '🎨 Arts & Design',
    desc: 'Painting, Sketching, UI/UX',
    comingSoon: true,
  },
  {
    id: 'Professional Skills',
    label: '💼 Professional Skills',
    desc: 'Marketing, Finance, Management',
    comingSoon: true,
  },
  {
    id: 'Sports & Fitness',
    label: '🏃 Sports & Fitness',
    desc: 'Yoga, Chess, Martial Arts',
    comingSoon: true,
  },
  {
    id: 'Personal Development',
    label: '🧠 Personal Development',
    desc: 'Public Speaking, Soft Skills',
    comingSoon: true,
  },
];

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

export default function CreateRequirementPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  // Stepper state (1 to 7)
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Form states
  const [category, setCategory] = useState('School Education');
  const [curriculum, setCurriculum] = useState({ board: '', level: '', subject: '' });
  const [teachingMode, setTeachingMode] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [location, setLocation] = useState({ city: '', area: '', address: '' });
  const [budget, setBudget] = useState({ min: '', max: '', feeType: 'PER_HOUR' });
  const [description, setDescription] = useState('');

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!category) errs.category = 'Please select a category';
    } else if (currentStep === 2) {
      if (category === 'School Education') {
        if (!curriculum.board) errs.board = 'Please select a board';
        if (!curriculum.level) errs.level = 'Please select a class';
        if (!curriculum.subject) errs.subject = 'Please select a subject';
      }
    } else if (currentStep === 3) {
      if (teachingMode.length === 0) errs.teachingMode = 'Select at least one teaching mode';
      if (schedule.length === 0) errs.schedule = 'Select at least one preferred schedule option';
    } else if (currentStep === 4) {
      if (!location.city.trim()) errs.city = 'City is required';
      if (!location.area.trim()) errs.area = 'Area is required';
    } else if (currentStep === 5) {
      const minNum = Number(budget.min);
      const maxNum = Number(budget.max);
      if (!budget.min) errs.min = 'Minimum budget is required';
      else if (isNaN(minNum) || minNum <= 0) errs.min = 'Must be a positive number';
      if (!budget.max) errs.max = 'Maximum budget is required';
      else if (isNaN(maxNum) || maxNum <= 0) errs.max = 'Must be a positive number';
      if (!errs.min && !errs.max && minNum > maxNum) {
        errs.min = 'Minimum budget cannot exceed maximum';
      }
    } else if (currentStep === 6) {
      if (description.trim().length < 20) {
        errs.description = `Description must be at least 20 characters (current: ${description.trim().length})`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setServerError('');
    setStep((s) => s - 1);
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

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    setServerError('');

    const payload = {
      category,
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
      const res = await requirementApi.createRequirement(payload, token);
      if (res.success && res.data) {
        setCreatedId(res.data._id);
        setSuccess(true);
      } else {
        setServerError(res.error || res.message || 'Something went wrong');
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit requirement. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  // Stepper config
  const stepsConfig = [
    { title: 'Category', icon: Sparkles },
    { title: 'Curriculum', icon: BookOpen },
    { title: 'Preferences', icon: Clock },
    { title: 'Location', icon: MapPin },
    { title: 'Budget', icon: CircleDollarSign },
    { title: 'Details', icon: FileText },
    { title: 'Review', icon: Eye },
  ];

  if (success) {
    return (
      <DashboardLayout>
        <Confetti />
        <div className="max-w-md mx-auto text-center py-16 space-y-6">
          <div className="w-20 h-20 bg-[#e6f6ee] border border-[#00A453]/20 rounded-full flex items-center justify-center mx-auto text-4xl">
            🎉
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#2d2d2d]">Requirement Posted!</h1>
            <p className="text-[#647380] leading-relaxed">
              Your requirement has been posted successfully. Matching tutors will start seeing your
              request shortly.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Link href={`/dashboard/requirements/${createdId}`}>
              <Button className="w-full bg-[#00A453] hover:bg-[#009048] text-white py-6 text-base font-semibold">
                View Requirement
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" className="w-full py-6 text-base font-semibold">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-4 space-y-8">
        {/* Step Indicator */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {stepsConfig.map((sConfig, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              const StepIcon = sConfig.icon;
              return (
                <div key={sConfig.title} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border text-sm font-semibold transition-all ${
                      isCompleted
                        ? 'bg-[#00A453] border-[#00A453] text-white'
                        : isActive
                          ? 'border-[#00A453] text-[#00A453] bg-white ring-4 ring-[#e6f6ee]'
                          : 'border-gray-200 text-[#647380] bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                    ) : (
                      <StepIcon className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium transition-colors hidden sm:block ${
                      isActive ? 'text-[#2d2d2d] font-semibold' : 'text-[#647380]'
                    }`}
                  >
                    {sConfig.title}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar line */}
          <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-gray-200 -z-10">
            <div
              className="h-full bg-[#00A453] transition-all duration-300"
              style={{ width: `${((step - 1) / (stepsConfig.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-[#dadee2] rounded-xl p-8 shadow-sm space-y-6">
          {/* Error Banner */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-[4px] px-4 py-3 text-sm font-medium">
              ⚠️ {serverError}
            </div>
          )}

          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">What would you like to learn?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    disabled={cat.comingSoon}
                    onClick={() => {
                      setCategory(cat.id);
                      setErrors({});
                    }}
                    className={`text-left p-4 border rounded-lg transition-all relative ${
                      cat.comingSoon
                        ? 'opacity-55 cursor-not-allowed bg-gray-50 border-gray-100'
                        : category === cat.id
                          ? 'border-[#00A453] bg-[#e6f6ee]/10 ring-2 ring-[#00A453]/20'
                          : 'border-[#dadee2] hover:border-[#00A453]/40'
                    }`}
                  >
                    <div className="font-bold text-[#2d2d2d] text-base">{cat.label}</div>
                    <div className="text-xs text-[#647380] mt-1">{cat.desc}</div>
                    {cat.comingSoon && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold tracking-wider px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full text-[#647380]">
                        COMING SOON
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: CURRICULUM */}
          {step === 2 && category === 'School Education' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">Select learning details</h2>
              <div className="space-y-4">
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
            </div>
          )}

          {/* STEP 3: PREFERENCES */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">How would you like to learn?</h2>
              <div className="space-y-5">
                {/* Teaching Modes */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">
                    Teaching Mode (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {TEACHING_MODES.map((mode) => {
                      const isSelected = teachingMode.includes(mode.id);
                      return (
                        <button
                          key={mode.id}
                          onClick={() => toggleTeachingMode(mode.id)}
                          className={`px-5 py-3 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-[#00A453] bg-[#e6f6ee]/10 text-[#00A453] ring-2 ring-[#00A453]/10'
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
                <div className="space-y-1.5 border-t border-gray-100 pt-5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">
                    Schedule (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {SCHEDULES.map((sched) => {
                      const isSelected = schedule.includes(sched.id);
                      return (
                        <button
                          key={sched.id}
                          onClick={() => toggleSchedule(sched.id)}
                          className={`px-5 py-3 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-[#00A453] bg-[#e6f6ee]/10 text-[#00A453] ring-2 ring-[#00A453]/10'
                              : 'border-[#dadee2] hover:border-[#00A453]/30 text-[#2d2d2d]'
                          }`}
                        >
                          {sched.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.schedule && (
                    <p className="text-xs text-red-500 mt-1">{errors.schedule}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LOCATION */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">
                Where should the classes take place?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">City</label>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => {
                      setLocation((l) => ({ ...l, city: e.target.value }));
                      setErrors((er) => ({ ...er, city: '' }));
                    }}
                    placeholder="e.g. Mumbai"
                    className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none ${
                      errors.city ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">Area</label>
                  <input
                    type="text"
                    value={location.area}
                    onChange={(e) => {
                      setLocation((l) => ({ ...l, area: e.target.value }));
                      setErrors((er) => ({ ...er, area: '' }));
                    }}
                    placeholder="e.g. Andheri West"
                    className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none ${
                      errors.area ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#2d2d2d]">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => setLocation((l) => ({ ...l, address: e.target.value }))}
                  placeholder="e.g. Flat 402, Sunshine Heights"
                  className="w-full border border-[#dadee2] rounded-[4px] px-4 py-3 text-base focus:outline-none focus:border-[#00A453]"
                />
              </div>
            </div>
          )}

          {/* STEP 5: BUDGET */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">Set your budget range</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">
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
                    placeholder="e.g. 500"
                    className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none ${
                      errors.min ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.min && <p className="text-xs text-red-500 mt-1">{errors.min}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">
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
                    placeholder="e.g. 1000"
                    className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none ${
                      errors.max ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'
                    }`}
                  />
                  {errors.max && <p className="text-xs text-red-500 mt-1">{errors.max}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#2d2d2d]">Fee Type</label>
                <div className="flex gap-2">
                  {FEE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBudget((b) => ({ ...b, feeType: type.id }))}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${
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
          )}

          {/* STEP 6: DESCRIPTION */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">Describe your learning goals</h2>
              <div className="space-y-1.5">
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((er) => ({ ...er, description: '' }));
                  }}
                  placeholder="Describe your learning goals. Mention your syllabus, preferred teaching style, timings, and any important details."
                  className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none resize-none ${
                    errors.description
                      ? 'border-red-400'
                      : 'border-[#dadee2] focus:border-[#00A453]'
                  }`}
                />
                <div className="flex items-center justify-between text-xs text-[#647380]">
                  <span>Minimum 20 characters required.</span>
                  <span className={description.length < 20 ? 'text-amber-600' : 'text-[#00A453]'}>
                    {description.length} characters
                  </span>
                </div>
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW */}
          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2d2d2d]">Review requirement details</h2>
              <p className="text-sm text-[#647380]">
                Review the details below. If everything looks good, click &quot;Post
                Requirement&quot;.
              </p>
              <div className="border border-[#dadee2] rounded-lg overflow-hidden divide-y divide-gray-100">
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-semibold text-[#647380]">Category</span>
                  <span className="col-span-2 text-[#2d2d2d]">{category}</span>
                </div>
                {category === 'School Education' && (
                  <>
                    <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                      <span className="font-semibold text-[#647380]">Curriculum</span>
                      <span className="col-span-2 text-[#2d2d2d]">
                        {curriculum.board} · {curriculum.level}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                      <span className="font-semibold text-[#647380]">Subject</span>
                      <span className="col-span-2 text-[#2d2d2d] font-semibold">
                        {curriculum.subject}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-semibold text-[#647380]">Teaching Mode</span>
                  <span className="col-span-2 text-[#2d2d2d]">{teachingMode.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-semibold text-[#647380]">Schedule</span>
                  <span className="col-span-2 text-[#2d2d2d]">{schedule.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-semibold text-[#647380]">Location</span>
                  <span className="col-span-2 text-[#2d2d2d]">
                    {location.city}, {location.area} {location.address && `(${location.address})`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-semibold text-[#647380]">Budget</span>
                  <span className="col-span-2 text-[#2d2d2d] font-semibold">
                    ₹{budget.min} - ₹{budget.max}{' '}
                    {FEE_TYPES.find((f) => f.id === budget.feeType)?.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-semibold text-[#647380]">Description</span>
                  <span className="col-span-2 text-[#2d2d2d] leading-relaxed whitespace-pre-line">
                    {description}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Action Buttons */}
          <div className="flex justify-between border-t border-gray-100 pt-6">
            {step > 1 ? (
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={loading}
                className="gap-1 px-5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <span />
            )}

            {step < 7 ? (
              <Button
                onClick={handleNext}
                className="bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white gap-1 px-6 font-semibold"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#00A453] hover:bg-[#009048] text-white gap-2 px-8 font-semibold"
              >
                {loading ? 'Publishing…' : 'Post Requirement'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
