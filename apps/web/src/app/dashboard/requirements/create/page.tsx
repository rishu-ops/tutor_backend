'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { requirementApi } from '@/lib/api';
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
  GraduationCap,
  Award,
  Code,
  Languages,
  Music,
  Palette,
  Briefcase,
  Activity,
  Brain,
  Home,
  Laptop,
  Users,
  Sun,
  Moon,
  Calendar,
  CalendarDays,
  X,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'School Education',
    label: 'School Education',
    desc: 'Classes 1-12, CBSE, ICSE, State Boards',
    icon: BookOpen,
  },
  {
    id: 'College Education',
    label: 'College Education',
    desc: 'Undergraduate and Postgraduate tutoring',
    icon: GraduationCap,
    comingSoon: true,
  },
  {
    id: 'Competitive Exams',
    label: 'Competitive Exams',
    desc: 'JEE, NEET, UPSC, Bank Exams',
    icon: Award,
    comingSoon: true,
  },
  {
    id: 'Programming',
    label: 'Programming',
    desc: 'Coding, Web Dev, DSA, AI',
    icon: Code,
    comingSoon: true,
  },
  {
    id: 'Languages',
    label: 'Languages',
    desc: 'English, French, German, Spanish',
    icon: Languages,
    comingSoon: true,
  },
  {
    id: 'Music',
    label: 'Music',
    desc: 'Vocal, Guitar, Piano, Keyboard',
    icon: Music,
    comingSoon: true,
  },
  {
    id: 'Arts & Design',
    label: 'Arts & Design',
    desc: 'Painting, Sketching, UI/UX',
    icon: Palette,
    comingSoon: true,
  },
  {
    id: 'Professional Skills',
    label: 'Professional Skills',
    desc: 'Marketing, Finance, Management',
    icon: Briefcase,
    comingSoon: true,
  },
  {
    id: 'Sports & Fitness',
    label: 'Sports & Fitness',
    desc: 'Yoga, Chess, Martial Arts',
    icon: Activity,
    comingSoon: true,
  },
  {
    id: 'Personal Development',
    label: 'Personal Development',
    desc: 'Public Speaking, Soft Skills',
    icon: Brain,
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
  { id: 'Home Tuition', label: 'Home Tuition', icon: Home },
  { id: 'Online', label: 'Online Class', icon: Laptop },
  { id: 'Group Classes', label: 'Group Classes', icon: Users },
];

const SCHEDULES = [
  { id: 'Morning', label: 'Morning', icon: Sun },
  { id: 'Afternoon', label: 'Afternoon', icon: Sun },
  { id: 'Evening', label: 'Evening', icon: Moon },
  { id: 'Weekdays', label: 'Weekdays', icon: Calendar },
  { id: 'Weekends', label: 'Weekends', icon: CalendarDays },
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

  // Prompt user before reload or closing tab if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if user has entered data or advanced steps
      const isFormDirty =
        step > 1 ||
        curriculum.board ||
        curriculum.level ||
        curriculum.subject ||
        teachingMode.length > 0 ||
        schedule.length > 0 ||
        location.city.trim() ||
        location.area.trim() ||
        budget.min ||
        budget.max ||
        description.trim();

      if (isFormDirty && !success) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, curriculum, teachingMode, schedule, location, budget, description, success]);

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
      <>
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
      </>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto py-4 space-y-8">
        {/* Step Indicator */}
        <div className="relative bg-white border border-[#dadee2] rounded-2xl p-6  select-none">
          <div className="flex items-center justify-between relative">
            {/* Progress bar line (connecting dots at the bottom) */}
            <div className="absolute bottom-[7px] left-[7%] right-[7%] h-[3.5px] bg-gray-200 -z-0">
              <div
                className="h-full bg-[#00A453] transition-all duration-300"
                style={{ width: `${((step - 1) / (stepsConfig.length - 1)) * 100}%` }}
              />
            </div>

            {stepsConfig.map((sConfig, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={sConfig.title} className="flex flex-col items-center z-10 flex-1">
                  {/* Text Label Above (Sentence Case - removed uppercase) */}
                  <span
                    className={`text-sm mb-3.5 font-bold tracking-wide transition-colors duration-200 hidden sm:block ${
                      isActive
                        ? 'text-[#00A453] font-extrabold'
                        : isCompleted
                          ? 'text-gray-900 font-bold'
                          : 'text-gray-400 font-medium'
                    }`}
                  >
                    {sConfig.title}
                  </span>

                  {/* Small Dot */}
                  <div
                    className={`w-[15px] h-[15px] rounded-full border-[2.5px] transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[#00A453] border-[#00A453]'
                        : isActive
                          ? 'bg-[#00A453] border-[#00A453] ring-4 ring-[#e6f6ee]/90 shadow-sm'
                          : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#dadee2] rounded-2xl p-8  space-y-6">
          {/* Error Banner */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
              ⚠️ {serverError}
            </div>
          )}

          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                What would you like to learn?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    disabled={cat.comingSoon}
                    onClick={() => {
                      setCategory(cat.id);
                      setErrors({});
                    }}
                    className={`group text-left p-5 border rounded-sm transition-all relative ${
                      cat.comingSoon
                        ? 'opacity-50 cursor-not-allowed bg-gray-50/50 border-gray-200'
                        : category === cat.id
                          ? 'border-[#00A453] bg-[#e6f6ee]/10 '
                          : 'border-[#dadee2] hover:border-gray-400/70 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-[#2d2d2d] text-base leading-snug">
                        {cat.label}
                      </div>
                      <div className="text-xs text-[#647380] leading-normal font-medium">
                        {cat.desc}
                      </div>
                    </div>
                    {cat.comingSoon && (
                      <span className="absolute top-2.5 right-2.5 text-[8.5px] font-bold tracking-wider px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full text-gray-400 uppercase">
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
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                Select learning details
              </h2>
              <div className="space-y-5">
                {/* Board */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">Board</label>
                  <div className="flex flex-wrap gap-2.5">
                    {BOARDS.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setCurriculum((c) => ({ ...c, board: b }));
                          setErrors((e) => ({ ...e, board: '' }));
                        }}
                        className={`px-6 py-3 rounded-full text-sm font-bold transition-all border shadow-xs ${
                          curriculum.board === b
                            ? 'border-[#00A453] bg-[#00A453] text-white shadow-sm'
                            : 'border-[#dadee2] hover:border-gray-400 text-[#2d2d2d] bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  {errors.board && <p className="text-xs text-red-500 mt-1">{errors.board}</p>}
                </div>

                {/* Class */}
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">
                    Class / Grade
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {CLASSES.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => {
                          setCurriculum((c) => ({ ...c, level: cls }));
                          setErrors((e) => ({ ...e, level: '' }));
                        }}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border shadow-xs ${
                          curriculum.level === cls
                            ? 'border-[#00A453] bg-[#00A453] text-white shadow-sm'
                            : 'border-[#dadee2] hover:border-gray-400 text-[#2d2d2d] bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                  {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level}</p>}
                </div>

                {/* Subject */}
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-semibold text-[#2d2d2d]">Subject</label>
                  <div className="flex flex-wrap gap-2.5">
                    {SUBJECTS.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => {
                          setCurriculum((c) => ({ ...c, subject: sub }));
                          setErrors((e) => ({ ...e, subject: '' }));
                        }}
                        className={`px-6 py-3 rounded-full text-sm font-bold transition-all border shadow-xs ${
                          curriculum.subject === sub
                            ? 'border-[#00A453] bg-[#00A453] text-white shadow-sm'
                            : 'border-[#dadee2] hover:border-gray-400 text-[#2d2d2d] bg-white hover:bg-gray-50/50'
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
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                How would you like to learn?
              </h2>
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
                          className={`px-5 py-2.5 border rounded-full text-sm font-bold transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-[#00A453] bg-[#00A453] text-white shadow-sm'
                              : 'border-[#dadee2] hover:border-gray-400 text-gray-700 bg-white hover:bg-gray-50/50'
                          }`}
                        >
                          <span>{mode.label}</span>
                          {isSelected && (
                            <X className="w-3.5 h-3.5 stroke-[2.5] text-white/90 hover:text-white shrink-0 ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.teachingMode && (
                    <p className="text-xs text-red-500 mt-1">{errors.teachingMode}</p>
                  )}
                </div>

                {/* Schedule */}
                <div className="space-y-1.5 border-t border-gray-150 pt-5">
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
                          className={`px-5 py-2.5 border rounded-full text-sm font-bold transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-[#00A453] bg-[#00A453] text-white shadow-sm'
                              : 'border-[#dadee2] hover:border-gray-400 text-gray-700 bg-white hover:bg-gray-50/50'
                          }`}
                        >
                          <span>{sched.label}</span>
                          {isSelected && (
                            <X className="w-3.5 h-3.5 stroke-[2.5] text-white/90 hover:text-white shrink-0 ml-0.5" />
                          )}
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
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
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
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                      errors.city
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                        : 'border-[#dadee2] focus:border-[#00A453] focus:ring-2 focus:ring-[#00A453]/20'
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
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                      errors.area
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                        : 'border-[#dadee2] focus:border-[#00A453] focus:ring-2 focus:ring-[#00A453]/20'
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
                  className="w-full border border-[#dadee2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00A453] focus:ring-2 focus:ring-[#00A453]/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 5: BUDGET */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                Set your budget range
              </h2>
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
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                      errors.min
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                        : 'border-[#dadee2] focus:border-[#00A453] focus:ring-2 focus:ring-[#00A453]/20'
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
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                      errors.max
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                        : 'border-[#dadee2] focus:border-[#00A453] focus:ring-2 focus:ring-[#00A453]/20'
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
                      className={`px-4 py-2.5 border rounded-xl text-sm font-bold transition-all ${
                        budget.feeType === type.id
                          ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                          : 'border-[#dadee2] hover:border-gray-400 text-[#2d2d2d] bg-white'
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
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                Describe your learning goals
              </h2>
              <div className="space-y-1.5">
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((er) => ({ ...er, description: '' }));
                  }}
                  placeholder="Describe your learning goals. Mention your syllabus, preferred teaching style, timings, and any important details."
                  className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none transition-all ${
                    errors.description
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                      : 'border-[#dadee2] focus:border-[#00A453] focus:ring-2 focus:ring-[#00A453]/20'
                  }`}
                />
                <div className="flex items-center justify-between text-xs text-[#647380] font-medium">
                  <span>Minimum 20 characters required.</span>
                  <span
                    className={
                      description.length < 20
                        ? 'text-amber-600 font-bold'
                        : 'text-[#00A453] font-bold'
                    }
                  >
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
              <h2 className="text-xl font-extrabold text-[#2d2d2d] tracking-tight">
                Review requirement details
              </h2>
              <p className="text-sm text-[#647380] font-medium">
                Review the details below. If everything looks good, click &quot;Post
                Requirement&quot;.
              </p>
              <div className="border border-[#dadee2] rounded-2xl overflow-hidden divide-y divide-gray-150 shadow-xs bg-gray-50/30">
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-bold text-[#647380]">Category</span>
                  <span className="col-span-2 text-[#2d2d2d] font-semibold">{category}</span>
                </div>
                {category === 'School Education' && (
                  <>
                    <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                      <span className="font-bold text-[#647380]">Curriculum</span>
                      <span className="col-span-2 text-[#2d2d2d] font-semibold">
                        {curriculum.board} · {curriculum.level}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                      <span className="font-bold text-[#647380]">Subject</span>
                      <span className="col-span-2 text-[#2d2d2d] font-bold text-[#00A453]">
                        {curriculum.subject}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-bold text-[#647380]">Teaching Mode</span>
                  <span className="col-span-2 text-[#2d2d2d] font-semibold">
                    {teachingMode.join(', ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-bold text-[#647380]">Schedule</span>
                  <span className="col-span-2 text-[#2d2d2d] font-semibold">
                    {schedule.join(', ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-bold text-[#647380]">Location</span>
                  <span className="col-span-2 text-[#2d2d2d] font-semibold">
                    {location.city}, {location.area} {location.address && `(${location.address})`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-bold text-[#647380]">Budget</span>
                  <span className="col-span-2 text-[#2d2d2d] font-bold">
                    ₹{budget.min} - ₹{budget.max}{' '}
                    <span className="text-xs text-gray-500 font-normal">
                      {FEE_TYPES.find((f) => f.id === budget.feeType)?.label}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 text-sm">
                  <span className="font-bold text-[#647380]">Description</span>
                  <span className="col-span-2 text-[#2d2d2d] leading-relaxed whitespace-pre-line font-medium">
                    {description}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Action Buttons */}
          <div className="flex justify-between border-t border-gray-50 pt-6">
            {step > 1 ? (
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={loading}
                className="gap-1 px-5 rounded-xl border-gray-300 font-bold text-xs uppercase tracking-wide h-10 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <span />
            )}

            {step < 7 ? (
              <Button
                onClick={handleNext}
                className="bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white gap-1 px-6 font-bold text-xs uppercase tracking-wide h-10 rounded-xl shadow-xs"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#00A453] hover:bg-[#009048] text-white gap-2 px-8 font-bold text-xs uppercase tracking-wide h-10 rounded-xl shadow-sm"
              >
                {loading ? 'Publishing…' : 'Post Requirement'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
