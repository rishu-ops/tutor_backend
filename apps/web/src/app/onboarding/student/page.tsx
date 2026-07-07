'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/constants';

export default function StudentOnboardingPage() {
  const router = useRouter();

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Form States
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [school, setSchool] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [learningMode, setLearningMode] = useState<'ONLINE' | 'OFFLINE' | 'HYBRID'>('ONLINE');

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Local Step Validation before moving forward
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!name.trim()) errors.name = 'Full name is required';
      if (!city.trim()) errors.city = 'City is required';
    } else if (currentStep === 2) {
      if (!school.trim()) errors.school = 'School or institution is required';
      if (!studentClass.trim()) errors.class = 'Class/Grade is required';
    } else if (currentStep === 3) {
      if (!preferredLanguage.trim()) errors.preferredLanguage = 'Preferred language is required';
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

    if (!validateStep(3)) return;

    if (!accessToken || !user) {
      setError('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      await onboardingApi.submit(
        {
          role: 'STUDENT',
          name,
          city,
          school,
          class: studentClass,
          preferredLanguage,
          learningMode,
        },
        accessToken
      );

      // Update store
      const updatedUser = {
        ...user,
        role: 'STUDENT',
        name,
        city,
      };
      setUser(updatedUser);

      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: any };
      setError(apiErr.message || 'Failed to submit onboarding profile.');
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

      {/* Main Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
            {/* Progress Stepper Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-[#647380] mb-2 uppercase tracking-wide">
                <span>Step {step} of 3</span>
                <span>{Math.round((step / 3) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-[#f3f4f6] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00A453] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Heading */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-[#e6f6ee] text-[#00A453] shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#00060c]">
                  {step === 1 && 'Tell us your name & city'}
                  {step === 2 && 'Enter your education'}
                  {step === 3 && 'Set your preferences'}
                </h1>
                <p className="text-xs text-[#647380]">
                  {step === 1 && "Let's start with basic details."}
                  {step === 2 && 'Help us understand your school/grade level.'}
                  {step === 3 && 'Final step: how and in what language you learn.'}
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
              {/* STEP 1: Basics */}
              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Full name"
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
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore, New Delhi"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                    }}
                    error={fieldErrors.city}
                    disabled={loading}
                  />
                </div>
              )}

              {/* STEP 2: Education */}
              {step === 2 && (
                <div className="space-y-4">
                  <Input
                    label="School / Institution"
                    placeholder="Enter your school name"
                    value={school}
                    onChange={(e) => {
                      setSchool(e.target.value);
                      if (fieldErrors.school) setFieldErrors({ ...fieldErrors, school: '' });
                    }}
                    error={fieldErrors.school}
                    disabled={loading}
                    autoFocus
                  />
                  <Input
                    label="Class / Grade"
                    placeholder="e.g. Class 10, Grade 12"
                    value={studentClass}
                    onChange={(e) => {
                      setStudentClass(e.target.value);
                      if (fieldErrors.class) setFieldErrors({ ...fieldErrors, class: '' });
                    }}
                    error={fieldErrors.class}
                    disabled={loading}
                  />
                </div>
              )}

              {/* STEP 3: Preferences */}
              {step === 3 && (
                <div className="space-y-4">
                  <Input
                    label="Preferred language"
                    placeholder="e.g. English, Hindi, Tamil"
                    value={preferredLanguage}
                    onChange={(e) => {
                      setPreferredLanguage(e.target.value);
                      if (fieldErrors.preferredLanguage)
                        setFieldErrors({ ...fieldErrors, preferredLanguage: '' });
                    }}
                    error={fieldErrors.preferredLanguage}
                    disabled={loading}
                    autoFocus
                  />

                  <div>
                    <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                      Learning mode
                    </label>
                    <select
                      value={learningMode}
                      onChange={(e) => setLearningMode(e.target.value as any)}
                      disabled={loading}
                      className="w-full px-3 py-2 text-sm text-[#00060c] bg-white border border-[#dadee2] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#004fcb] focus:border-[#004fcb]"
                    >
                      <option value="ONLINE">Online Classes</option>
                      <option value="OFFLINE">Offline Home Classes</option>
                      <option value="HYBRID">Hybrid Mode</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Wizard Nav Controls */}
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

                {step < 3 ? (
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
