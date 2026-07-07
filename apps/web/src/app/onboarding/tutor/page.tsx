'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/constants';

interface SubjectInput {
  subject: string;
  level: string;
  experienceYears: number;
}

const COMMON_LEVELS = [
  'Primary School',
  'Middle School',
  'High School',
  'College',
  'JEE/NEET Prep',
];

export default function TutorOnboardingPage() {
  const router = useRouter();

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Form States
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');

  const [onlineMode, setOnlineMode] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [hybridMode, setHybridMode] = useState(false);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { subject: '', level: '', experienceYears: 1 },
  ]);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Row operations
  const addSubjectRow = () => {
    setSubjects([...subjects, { subject: '', level: '', experienceYears: 1 }]);
  };

  const removeSubjectRow = (index: number) => {
    if (subjects.length === 1) return;
    setSubjects(subjects.filter((_, idx) => idx !== index));
  };

  const updateSubjectField = (index: number, key: keyof SubjectInput, value: any) => {
    setSubjects(subjects.map((sub, idx) => (idx === index ? { ...sub, [key]: value } : sub)));
  };

  // Step-level validations
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!name.trim()) errors.name = 'Display name is required';
      if (!bio.trim() || bio.length < 50) {
        errors.bio = `Bio must be at least 50 characters (currently ${bio.length})`;
      }
    } else if (currentStep === 2) {
      if (!city.trim()) errors.city = 'City is required';
      if (!area.trim()) errors.area = 'Area/Locality is required';
    } else if (currentStep === 3) {
      if (!languagesInput.trim()) errors.languages = 'Please enter at least one language';
      if (!onlineMode && !offlineMode && !hybridMode) {
        errors.teachingModes = 'Please select at least one teaching mode';
      }
    } else if (currentStep === 4) {
      const parsedMin = parseFloat(minPrice);
      const parsedMax = parseFloat(maxPrice);
      if (isNaN(parsedMin) || parsedMin <= 0) errors.minPrice = 'Must be a positive rate';
      if (isNaN(parsedMax) || parsedMax <= 0) errors.maxPrice = 'Must be a positive rate';
      if (parsedMin > parsedMax) {
        errors.maxPrice = 'Max rate must be greater than or equal to min rate';
      }
    } else if (currentStep === 5) {
      const verified = subjects.filter((s) => s.subject.trim() && s.level.trim());
      if (verified.length === 0) {
        errors.subjects = 'Please add at least one subject with level';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateStep(5)) return;

    if (!accessToken || !user) {
      setError('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const selectedModes: string[] = [];
      if (onlineMode) selectedModes.push('ONLINE');
      if (offlineMode) selectedModes.push('OFFLINE');
      if (hybridMode) selectedModes.push('HYBRID');

      const payload = {
        role: 'TUTOR',
        name,
        bio,
        location: {
          city,
          area,
        },
        languages: languagesInput
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        teachingModes: selectedModes,
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
      };

      await onboardingApi.submit(payload as any, accessToken);

      const updatedUser = {
        ...user,
        role: 'TUTOR',
        name,
        city,
      };
      setUser(updatedUser);

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

      {/* Main Body */}
      <main className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
            {/* Stepper progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-[#647380] mb-2 uppercase tracking-wide">
                <span>Step {step} of 5</span>
                <span>{Math.round((step / 5) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-[#f3f4f6] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00A453] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Step headings */}
            <div className="mb-8 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-blue-50 text-[#004fcb] shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#00060c]">
                  {step === 1 && 'Tutor display details'}
                  {step === 2 && 'Where do you teach?'}
                  {step === 3 && 'Preferences & languages'}
                  {step === 4 && 'Hourly billing rate'}
                  {step === 5 && 'Tell us what you teach'}
                </h1>
                <p className="text-xs text-[#647380]">
                  {step === 1 && 'Start your profile with your professional summary.'}
                  {step === 2 && 'Enter your city and neighborhood locality.'}
                  {step === 3 && 'Tell us your languages and offline/online modes.'}
                  {step === 4 && 'Set your hourly min-max pricing structure.'}
                  {step === 5 && 'Last step: add subjects and teaching experience.'}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#DC2626] rounded-[8px] p-3 text-xs font-semibold mb-6">
                {error}
              </div>
            )}

            {/* Stepped Form Elements */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: Profile Basics */}
              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Display name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    error={fieldErrors.name}
                    disabled={loading}
                    autoFocus
                  />
                  <div>
                    <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                      Bio (Min 50 characters)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your qualifications, teaching methodology, and experience..."
                      value={bio}
                      onChange={(e) => {
                        setBio(e.target.value);
                        if (fieldErrors.bio) setFieldErrors({ ...fieldErrors, bio: '' });
                      }}
                      disabled={loading}
                      className={`w-full px-3 py-2 text-sm text-[#00060c] bg-white border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#004fcb] focus:border-[#004fcb] placeholder:text-[#647380] ${
                        fieldErrors.bio
                          ? 'border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]'
                          : 'border-[#dadee2]'
                      }`}
                    />
                    <div className="flex justify-between mt-1 text-[11px] text-[#647380]">
                      <span>Describe your background</span>
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
                </div>
              )}

              {/* STEP 2: Location */}
              {step === 2 && (
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                    }}
                    error={fieldErrors.city}
                    disabled={loading}
                    autoFocus
                  />
                  <Input
                    label="Area / Locality"
                    placeholder="e.g. Koramangala"
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      if (fieldErrors.area) setFieldErrors({ ...fieldErrors, area: '' });
                    }}
                    error={fieldErrors.area}
                    disabled={loading}
                  />
                </div>
              )}

              {/* STEP 3: Language & Modes */}
              {step === 3 && (
                <div className="space-y-4">
                  <Input
                    label="Languages Spoken"
                    placeholder="e.g. English, Hindi, Punjabi (comma-separated)"
                    value={languagesInput}
                    onChange={(e) => {
                      setLanguagesInput(e.target.value);
                      if (fieldErrors.languages) setFieldErrors({ ...fieldErrors, languages: '' });
                    }}
                    error={fieldErrors.languages}
                    disabled={loading}
                    autoFocus
                  />

                  <div>
                    <label className="block text-sm font-bold text-[#2d2d2d] mb-2">
                      Available Teaching Modes
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm text-[#384148] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlineMode}
                          onChange={(e) => {
                            setOnlineMode(e.target.checked);
                            if (fieldErrors.teachingModes)
                              setFieldErrors({ ...fieldErrors, teachingModes: '' });
                          }}
                          disabled={loading}
                          className="w-4 h-4 text-[#00A453] border-[#dadee2] rounded focus:ring-[#00A453]"
                        />
                        Online
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#384148] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offlineMode}
                          onChange={(e) => {
                            setOfflineMode(e.target.checked);
                            if (fieldErrors.teachingModes)
                              setFieldErrors({ ...fieldErrors, teachingModes: '' });
                          }}
                          disabled={loading}
                          className="w-4 h-4 text-[#00A453] border-[#dadee2] rounded focus:ring-[#00A453]"
                        />
                        Offline (Home)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#384148] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hybridMode}
                          onChange={(e) => {
                            setHybridMode(e.target.checked);
                            if (fieldErrors.teachingModes)
                              setFieldErrors({ ...fieldErrors, teachingModes: '' });
                          }}
                          disabled={loading}
                          className="w-4 h-4 text-[#00A453] border-[#dadee2] rounded focus:ring-[#00A453]"
                        />
                        Hybrid
                      </label>
                    </div>
                    {fieldErrors.teachingModes && (
                      <p className="mt-1.5 text-xs text-[#DC2626]">{fieldErrors.teachingModes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Hourly rate pricing */}
              {step === 4 && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                    Hourly Pricing Range (INR / hr)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="Min Rate (e.g. 500)"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        if (fieldErrors.minPrice) setFieldErrors({ ...fieldErrors, minPrice: '' });
                      }}
                      error={fieldErrors.minPrice}
                      disabled={loading}
                      autoFocus
                    />
                    <span className="text-[#647380] text-sm shrink-0">to</span>
                    <Input
                      type="number"
                      placeholder="Max Rate (e.g. 1500)"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        if (fieldErrors.maxPrice) setFieldErrors({ ...fieldErrors, maxPrice: '' });
                      }}
                      error={fieldErrors.maxPrice}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Dynamic Subjects experience */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#dadee2] pb-1">
                    <label className="text-sm font-bold text-[#00060c] uppercase tracking-wider">
                      Add Subjects
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addSubjectRow}
                      disabled={loading}
                      className="text-xs text-[#00A453] font-bold py-1 h-7 rounded-[8px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
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
                        {/* Trash helper */}
                        {subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(index)}
                            disabled={loading}
                            className="absolute top-2 right-2 text-[#647380] hover:text-[#DC2626] transition-colors p-1"
                            aria-label="Remove subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <Input
                            label="Subject Name"
                            placeholder="e.g. Mathematics, Calculus"
                            value={sub.subject}
                            onChange={(e) => updateSubjectField(index, 'subject', e.target.value)}
                            disabled={loading}
                          />

                          <div>
                            <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                              Subject Level
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Secondary School"
                              value={sub.level}
                              onChange={(e) => updateSubjectField(index, 'level', e.target.value)}
                              disabled={loading}
                              className="w-full px-3 py-2 text-sm text-[#00060c] bg-white border border-[#dadee2] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#004fcb] focus:border-[#004fcb]"
                            />
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {COMMON_LEVELS.map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => updateSubjectField(index, 'level', lvl)}
                                  disabled={loading}
                                  className="text-[10px] bg-white border border-[#dadee2] text-[#647380] hover:border-[#00060c] hover:text-[#00060c] px-2 py-0.5 rounded-full transition-colors"
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>

                          <Input
                            label="Years of Experience"
                            type="number"
                            value={sub.experienceYears}
                            onChange={(e) =>
                              updateSubjectField(
                                index,
                                'experienceYears',
                                parseInt(e.target.value) || 0
                              )
                            }
                            disabled={loading}
                            min={0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation trigger controls */}
              <div className="flex items-center gap-3 pt-6 border-t border-[#dadee2] mt-6">
                {step > 1 && (
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

                {step < 5 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    className="flex-1 h-[40px] text-xs font-bold rounded-[12px] justify-center"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="flex-1 h-[40px] text-xs font-bold rounded-[12px] justify-center"
                  >
                    Complete Setup
                  </Button>
                )}
              </div>
            </form>
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
