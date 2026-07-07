'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { ROUTES } from '@/lib/constants';

interface SubjectInput {
  subject: string;
  level: string;
  experienceYears: number;
}

interface QualificationInput {
  degree: string;
  institution: string;
  year: string;
}

const COMMON_LEVELS = ['Class 6–8', 'Class 10', 'Class 12', 'JEE Prep', 'NEET Prep', 'Beginner'];
const COMMON_LANGUAGES = ['English', 'Hindi', 'Other'];
const COMMON_MODES = ['Home Tuition', 'Online', 'Group Classes', 'Coaching Center'];
const COMMON_AVAILABILITY = ['Weekdays', 'Weekends', 'Morning', 'Afternoon', 'Evening'];

export default function TutorOnboardingPage() {
  const router = useRouter();

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Read persisted draft state from store
  const tutorState = useOnboardingStore((s) => s.tutor);
  const setTutorField = useOnboardingStore((s) => s.setTutorField);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Sync state values on initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate name and city from logged in user if they are blank in the draft
  useEffect(() => {
    if (mounted && user) {
      if (!tutorState.name) setTutorField('name', user.name || '');
      if (!tutorState.city) setTutorField('city', user.city || '');
    }
  }, [mounted, user, tutorState.name, tutorState.city, setTutorField]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#00A453] border-t-transparent animate-spin" />
      </div>
    );
  }

  const {
    step,
    name,
    city,
    bio,
    subjects,
    teachingModes,
    languages,
    minPrice,
    maxPrice,
    feeType,
    qualifications,
    availability,
  } = tutorState;

  // Row operations for Subjects
  const addSubjectRow = () => {
    setTutorField('subjects', [...subjects, { subject: '', level: '', experienceYears: 1 }]);
  };

  const removeSubjectRow = (index: number) => {
    if (subjects.length === 1) return;
    setTutorField(
      'subjects',
      subjects.filter((_, idx) => idx !== index)
    );
  };

  const updateSubjectField = (index: number, key: keyof SubjectInput, value: any) => {
    setTutorField(
      'subjects',
      subjects.map((sub, idx) => (idx === index ? { ...sub, [key]: value } : sub))
    );
  };

  // Row operations for Qualifications
  const addQualRow = () => {
    setTutorField('qualifications', [...qualifications, { degree: '', institution: '', year: '' }]);
  };

  const removeQualRow = (index: number) => {
    setTutorField(
      'qualifications',
      qualifications.filter((_, idx) => idx !== index)
    );
  };

  const updateQualField = (index: number, key: keyof QualificationInput, value: any) => {
    setTutorField(
      'qualifications',
      qualifications.map((q, idx) => (idx === index ? { ...q, [key]: value } : q))
    );
  };

  // Multi-select toggle helpers
  const toggleSelection = (key: 'teachingModes' | 'languages' | 'availability', value: string) => {
    const list = tutorState[key] as string[];
    if (list.includes(value)) {
      setTutorField(
        key,
        list.filter((v) => v !== value)
      );
    } else {
      setTutorField(key, [...list, value]);
    }
  };

  // Local step validations
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!name.trim()) errors.name = 'Display name is required';
      if (!city.trim()) errors.city = 'City is required';
    } else if (currentStep === 2) {
      if (!bio.trim() || bio.length < 50) {
        errors.bio = `Bio must be at least 50 characters (currently ${bio.length} characters)`;
      }
    } else if (currentStep === 3) {
      const verified = subjects.filter((s) => s.subject.trim() && s.level.trim());
      if (verified.length === 0) {
        errors.subjects = 'Please add at least one subject detail (with name & level)';
      }
    } else if (currentStep === 4) {
      if (teachingModes.length === 0)
        errors.teachingModes = 'Please select at least one teaching mode';
      if (languages.length === 0) errors.languages = 'Please select at least one language';
    } else if (currentStep === 5) {
      const minVal = parseFloat(minPrice);
      const maxVal = parseFloat(maxPrice);
      if (isNaN(minVal) || minVal <= 0) errors.minPrice = 'Must be a positive rate';
      if (isNaN(maxVal) || maxVal <= 0) errors.maxPrice = 'Must be a positive rate';
      if (minVal > maxVal) {
        errors.maxPrice = 'Max price must be greater than or equal to min price';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setTutorField('step', step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setTutorField('step', Math.max(1, step - 1));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setFieldErrors({});

    if (!accessToken || !user) {
      setError('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      // Map multiple checkbox selected modes directly. We will convert modes like "Home Tuition" to "OFFLINE", "Online" to "ONLINE" etc if necessary,
      // but in the backend tutor validation, it expects any array of strings. We can map:
      // Home Tuition -> OFFLINE
      // Online -> ONLINE
      // Group Classes -> HYBRID
      // Coaching Center -> HYBRID
      const mappedModes = teachingModes.map((mode) => {
        if (mode === 'Home Tuition') return 'OFFLINE';
        if (mode === 'Online') return 'ONLINE';
        return 'HYBRID';
      });

      const payload = {
        role: 'TUTOR',
        name,
        bio,
        location: {
          city,
          area: 'Not Specified', // fallback
        },
        languages,
        teachingModes: Array.from(new Set(mappedModes)),
        pricing: {
          min: parseFloat(minPrice),
          max: parseFloat(maxPrice),
        },
        subjects: subjects
          .filter((s) => s.subject.trim() && s.level.trim())
          .map((s) => ({
            subject: s.subject,
            level: s.level,
            experienceYears: Number(s.experienceYears),
          })),
        qualifications: qualifications.filter((q) => q.degree.trim() && q.institution.trim()),
        availability,
      };

      await onboardingApi.submit(payload as any, accessToken);

      // Save store auth user
      const updatedUser = {
        ...user,
        role: 'TUTOR',
        name,
        city,
      };
      setUser(updatedUser);

      // Reset the draft
      resetOnboarding();

      // Forward to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: any };
      setError(apiErr.message || 'Failed to complete onboarding.');
      if (apiErr.errors) {
        const mappedErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([field, value]: [string, any]) => {
          mappedErrors[field] = value._errors?.[0] || 'Invalid value';
        });
        setFieldErrors(mappedErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">
          <span className="text-[#00A453] font-bold text-xl tracking-tight">
            project<span className="font-extrabold text-[#00060c]">tutor</span>
          </span>
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 text-sm text-[#647380] hover:text-[#00060c] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
        </div>
      </header>

      {/* Main stepper wrapper */}
      <main className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-[512px]">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
            {/* Step progress tracker dots */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold text-[#647380] mb-2 uppercase tracking-wide">
                <span>Step {step} of 8</span>
                <span>{Math.round((step / 8) * 100)}% Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const s = idx + 1;
                  return (
                    <div
                      key={s}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                        s <= step ? 'bg-[#00A453]' : 'bg-[#dadee2]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Headers */}
            <div className="mb-8">
              <h1 className="text-xl font-extrabold text-[#00060c]">
                {step === 1 && "Welcome! Let's introduce you."}
                {step === 2 && 'Tell students about yourself.'}
                {step === 3 && 'What do you teach?'}
                {step === 4 && 'How do you teach?'}
                {step === 5 && 'Set your fee.'}
                {step === 6 && 'Tell us about your education.'}
                {step === 7 && 'When are you available?'}
                {step === 8 && '🎉 Your tutor profile is ready.'}
              </h1>
              <p className="text-sm text-[#647380] mt-1.5">
                {step === 1 && 'Start with your name and primary location.'}
                {step === 2 && 'A short summary helps students know your style.'}
                {step === 3 && 'Specify your subjects, teaching level, and experience.'}
                {step === 4 && 'Select languages spoken and available formats.'}
                {step === 5 && 'Specify your min/max fees and billing frequency.'}
                {step === 6 && 'Add degrees or educational certificates (Optional).'}
                {step === 7 && 'Select times/days you are open for requests (Optional).'}
                {step === 8 && 'Start exploring student requirements.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#DC2626] rounded-[8px] p-3 text-xs font-semibold mb-6">
                {error}
              </div>
            )}

            {/* Stepper Wizard form inputs */}
            <div className="space-y-4">
              {/* STEP 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter display name"
                    value={name}
                    onChange={(e) => {
                      setTutorField('name', e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    error={fieldErrors.name}
                    disabled={loading}
                    autoFocus
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore, Delhi"
                    value={city}
                    onChange={(e) => {
                      setTutorField('city', e.target.value);
                      if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                    }}
                    error={fieldErrors.city}
                    disabled={loading}
                  />
                </div>
              )}

              {/* STEP 2: About You (Bio) */}
              {step === 2 && (
                <div>
                  <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                    Short Bio (Min 50 characters)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Describe your qualifications, teaching methodology, and experience..."
                    value={bio}
                    onChange={(e) => {
                      setTutorField('bio', e.target.value);
                      if (fieldErrors.bio) setFieldErrors({ ...fieldErrors, bio: '' });
                    }}
                    disabled={loading}
                    className={`w-full px-3 py-2 text-sm text-[#00060c] bg-white border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#004fcb] focus:border-[#004fcb] placeholder:text-[#647380] ${
                      fieldErrors.bio
                        ? 'border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]'
                        : 'border-[#dadee2]'
                    }`}
                    autoFocus
                  />
                  <div className="flex justify-between mt-1 text-[11px] text-[#647380]">
                    <span>Introduce yourself professionally</span>
                    <span
                      className={
                        bio.length < 50 ? 'text-[#DC2626]' : 'text-[#00A453] font-semibold'
                      }
                    >
                      {bio.length} characters
                    </span>
                  </div>
                  {fieldErrors.bio && (
                    <p className="mt-1.5 text-xs text-[#DC2626]">{fieldErrors.bio}</p>
                  )}
                </div>
              )}

              {/* STEP 3: Subjects */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#dadee2] pb-1">
                    <label className="text-sm font-bold text-[#00060c] uppercase tracking-wider">
                      Subject list
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addSubjectRow}
                      className="text-xs text-[#00A453] font-bold py-1 h-7 rounded-[8px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Subject
                    </Button>
                  </div>

                  {fieldErrors.subjects && (
                    <p className="text-xs text-[#DC2626]">{fieldErrors.subjects}</p>
                  )}

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {subjects.map((sub, index) => (
                      <div
                        key={index}
                        className="border border-[#dadee2] rounded-[12px] p-4 bg-[#FAFAFA] relative space-y-3"
                      >
                        {/* Trash */}
                        {subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(index)}
                            className="absolute top-2 right-2 text-[#647380] hover:text-[#DC2626] transition-colors p-1"
                            aria-label="Remove subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <div className="space-y-3">
                          <Input
                            label="Subject"
                            placeholder="e.g. Mathematics, Calculus"
                            value={sub.subject}
                            onChange={(e) => updateSubjectField(index, 'subject', e.target.value)}
                          />

                          <div>
                            <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                              Level (e.g. Class 10, JEE)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Class 10"
                              value={sub.level}
                              onChange={(e) => updateSubjectField(index, 'level', e.target.value)}
                              className="w-full px-3 py-2 text-sm text-[#00060c] bg-white border border-[#dadee2] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#004fcb] focus:border-[#004fcb]"
                            />
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {COMMON_LEVELS.map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => updateSubjectField(index, 'level', lvl)}
                                  className="text-[10px] bg-white border border-[#dadee2] text-[#647380] hover:border-[#00060c] hover:text-[#00060c] px-2.5 py-0.5 rounded-full transition-colors"
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>

                          <Input
                            label="Experience (years)"
                            type="number"
                            value={sub.experienceYears}
                            onChange={(e) =>
                              updateSubjectField(
                                index,
                                'experienceYears',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Teaching Preferences */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Modes */}
                  <div>
                    <label className="block text-sm font-bold text-[#2d2d2d] mb-2.5">
                      Teaching Modes (Select all that apply)
                    </label>
                    <div className="flex flex-col gap-2">
                      {COMMON_MODES.map((mode) => {
                        const isSelected = teachingModes.includes(mode);
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => toggleSelection('teachingModes', mode)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-[12px] text-xs text-left transition-all ${
                              isSelected
                                ? 'bg-[#e6f6ee]/30 border-[#00A453] text-[#00060c] font-bold'
                                : 'bg-white border-[#dadee2] text-[#384148] hover:border-[#00060c]'
                            }`}
                          >
                            <span>{mode}</span>
                            {isSelected && (
                              <div className="h-4.5 w-4.5 flex items-center justify-center rounded-full bg-[#00A453] text-white">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.teachingModes && (
                      <p className="mt-1.5 text-xs text-[#DC2626]">{fieldErrors.teachingModes}</p>
                    )}
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-sm font-bold text-[#2d2d2d] mb-2.5">
                      Languages Spoken
                    </label>
                    <div className="flex items-center gap-3">
                      {COMMON_LANGUAGES.map((lang) => {
                        const isSelected = languages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleSelection('languages', lang)}
                            className={`flex-1 px-4 py-2 border rounded-[12px] text-xs text-center transition-all ${
                              isSelected
                                ? 'bg-[#e6f6ee]/30 border-[#00A453] text-[#00060c] font-bold'
                                : 'bg-white border-[#dadee2] text-[#384148] hover:border-[#00060c]'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.languages && (
                      <p className="mt-1.5 text-xs text-[#DC2626]">{fieldErrors.languages}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: Pricing */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      label="Minimum Fee"
                      placeholder="Min fee"
                      value={minPrice}
                      onChange={(e) => {
                        setTutorField('minPrice', e.target.value);
                        if (fieldErrors.minPrice) setFieldErrors({ ...fieldErrors, minPrice: '' });
                      }}
                      error={fieldErrors.minPrice}
                      autoFocus
                    />
                    <span className="text-[#647380] text-sm pt-6">to</span>
                    <Input
                      type="number"
                      label="Maximum Fee"
                      placeholder="Max fee"
                      value={maxPrice}
                      onChange={(e) => {
                        setTutorField('maxPrice', e.target.value);
                        if (fieldErrors.maxPrice) setFieldErrors({ ...fieldErrors, maxPrice: '' });
                      }}
                      error={fieldErrors.maxPrice}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                      Fee Type
                    </label>
                    <select
                      value={feeType}
                      onChange={(e) => setTutorField('feeType', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-[#00060c] bg-white border border-[#dadee2] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#004fcb] focus:border-[#004fcb]"
                    >
                      <option value="Per Hour">Per Hour</option>
                      <option value="Per Month">Per Month</option>
                      <option value="Per Session">Per Session</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 6: Qualifications (Optional) */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#dadee2] pb-1">
                    <label className="text-sm font-bold text-[#00060c] uppercase tracking-wider">
                      Degrees & Qualifications
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addQualRow}
                      className="text-xs text-[#00A453] font-bold py-1 h-7 rounded-[8px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </Button>
                  </div>

                  {qualifications.length === 0 ? (
                    <p className="text-sm text-[#647380] text-center py-6">
                      No qualifications added yet. You can click Add Row above to add one, or click
                      Continue to skip.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {qualifications.map((qual, index) => (
                        <div
                          key={index}
                          className="border border-[#dadee2] rounded-[12px] p-4 bg-[#FAFAFA] relative space-y-3"
                        >
                          <button
                            type="button"
                            onClick={() => removeQualRow(index)}
                            className="absolute top-2 right-2 text-[#647380] hover:text-[#DC2626] transition-colors p-1"
                            aria-label="Remove qualification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="space-y-3">
                            <Input
                              label="Degree / Course"
                              placeholder="e.g. B.Sc Mathematics, B.Tech"
                              value={qual.degree}
                              onChange={(e) => updateQualField(index, 'degree', e.target.value)}
                            />
                            <Input
                              label="Institution / University"
                              placeholder="e.g. Delhi University"
                              value={qual.institution}
                              onChange={(e) =>
                                updateQualField(index, 'institution', e.target.value)
                              }
                            />
                            <Input
                              label="Year of Completion"
                              type="number"
                              placeholder="e.g. 2022"
                              value={qual.year}
                              onChange={(e) => updateQualField(index, 'year', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 7: Availability (Optional) */}
              {step === 7 && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                    Select Available Times (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {COMMON_AVAILABILITY.map((time) => {
                      const isSelected = availability.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleSelection('availability', time)}
                          className={`px-4 py-3 border rounded-[12px] text-xs text-center transition-all ${
                            isSelected
                              ? 'bg-[#e6f6ee]/30 border-[#00A453] text-[#00060c] font-bold'
                              : 'bg-white border-[#dadee2] text-[#384148] hover:border-[#00060c]'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 8: Finish */}
              {step === 8 && (
                <div className="text-center py-6">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[#e6f6ee] text-[#00A453] mb-4">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>
                  <p className="text-sm text-[#384148] leading-relaxed max-w-xs mx-auto">
                    Your tutor profile is ready. Click below to enter your tutor dashboard and
                    manage class requests.
                  </p>
                </div>
              )}

              {/* Navigation trigger controls */}
              <div className="flex items-center gap-3 pt-6 border-t border-[#dadee2] mt-6">
                {step > 1 && step < 8 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={loading}
                    className="w-[100px] h-[40px] text-xs font-bold rounded-[12px]"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                )}

                {step < 7 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    className="flex-1 h-[40px] text-xs font-bold rounded-[12px] justify-center"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : step === 7 ? (
                  <Button
                    type="button"
                    variant="primary"
                    loading={loading}
                    onClick={handleSubmit}
                    className="flex-1 h-[40px] text-xs font-bold rounded-[12px] justify-center"
                  >
                    Finish Setup
                  </Button>
                ) : (
                  <Link href={ROUTES.DASHBOARD} className="w-full">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full h-[40px] text-xs font-bold rounded-[12px] justify-center"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dadee2] bg-white mt-auto">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center">
          <p className="text-xs text-[#647380]">
            &copy; {new Date().getFullYear()} Project Tutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
