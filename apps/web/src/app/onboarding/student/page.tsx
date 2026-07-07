'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronRight, ChevronLeft, Check, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Confetti } from '@/components/ui/confetti';
import { onboardingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { ROUTES } from '@/lib/constants';

export default function StudentOnboardingPage() {
  const router = useRouter();

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Read persisted draft state from store
  const studentState = useOnboardingStore((s) => s.student);
  const setStudentField = useOnboardingStore((s) => s.setStudentField);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Sync state values on initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate name and city from logged in user if they are blank in the draft
  useEffect(() => {
    if (mounted && user) {
      if (!studentState.name) setStudentField('name', user.name || '');
      if (!studentState.city) setStudentField('city', user.city || '');
    }
  }, [mounted, user, studentState.name, studentState.city, setStudentField]);

  // Hook tab close / reload warnings
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your onboarding progress is saved.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#00A453] border-t-transparent animate-spin" />
      </div>
    );
  }

  const { step, name, city, studentClass, school, preferredLanguage, learningModes } = studentState;

  // Local validation per step
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!name.trim()) errors.name = 'Full name is required';
      if (!city.trim()) errors.city = 'City is required';
    } else if (currentStep === 2) {
      if (!studentClass.trim()) errors.studentClass = 'Class / Grade is required';
      if (!preferredLanguage.trim()) errors.preferredLanguage = 'Preferred language is required';
    } else if (currentStep === 3) {
      if (learningModes.length === 0) {
        errors.learningModes = 'Please select at least one learning preference';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStudentField('step', step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setStudentField('step', Math.max(1, step - 1));
    setError('');
  };

  const toggleLearningMode = (mode: string) => {
    if (learningModes.includes(mode)) {
      setStudentField(
        'learningModes',
        learningModes.filter((m) => m !== mode)
      );
    } else {
      setStudentField('learningModes', [...learningModes, mode]);
    }
    if (fieldErrors.learningModes) setFieldErrors({ ...fieldErrors, learningModes: '' });
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
      // Map frontend multiple select inputs into backend enum (ONLINE / OFFLINE / HYBRID)
      // Home Tuition = OFFLINE
      // Online = ONLINE
      // Group Classes / Multiple selections = HYBRID
      let finalMode: 'ONLINE' | 'OFFLINE' | 'HYBRID' = 'ONLINE';
      if (learningModes.includes('Home Tuition') && learningModes.includes('Online')) {
        finalMode = 'HYBRID';
      } else if (learningModes.includes('Group Classes') || learningModes.length > 1) {
        finalMode = 'HYBRID';
      } else if (learningModes.includes('Home Tuition')) {
        finalMode = 'OFFLINE';
      } else if (learningModes.includes('Online')) {
        finalMode = 'ONLINE';
      }

      await onboardingApi.submit(
        {
          role: 'STUDENT',
          name,
          city,
          school: school || 'Not Specified',
          class: studentClass,
          preferredLanguage,
          learningMode: finalMode,
        },
        accessToken
      );

      // Save user profile state changes in local auth store
      const updatedUser = {
        ...user,
        role: 'STUDENT',
        name,
        city,
      };
      setUser(updatedUser);

      // Clean up the draft
      resetOnboarding();

      // Forward to dashboard
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
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-7 w-7" />
            <span className="text-[#00A453] font-bold text-xl tracking-tight">
              FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
            </span>
          </div>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-1.5 text-sm text-[#647380] hover:text-[#00060c] font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
            {/* Step Progress indicators */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold text-[#647380] mb-2 uppercase tracking-wide">
                <span>Step {step} of 4</span>
                <span>{Math.round((step / 4) * 100)}% Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      s <= step ? 'bg-[#00A453]' : 'bg-[#dadee2]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Headings */}
            <div className="mb-8">
              <h1 className="text-xl font-extrabold text-[#00060c]">
                {step === 1 && 'Tell us about yourself'}
                {step === 2 && 'What are you studying?'}
                {step === 3 && 'How do you want to learn?'}
                {step === 4 && '🎉 Your profile is ready.'}
              </h1>
              <p className="text-sm text-[#647380] mt-1.5">
                {step === 1 && 'Start by introducing yourself to potential tutors.'}
                {step === 2 && 'Enter your current grade and school details.'}
                {step === 3 && 'Select your preferred learning models.'}
                {step === 4 && 'Start posting your first tuition requirement.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#DC2626] rounded-[8px] p-3 text-xs font-semibold mb-6">
                {error}
              </div>
            )}

            {/* Stepped inputs */}
            <div className="space-y-4">
              {/* Step 1: Basics */}
              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setStudentField('name', e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    error={fieldErrors.name}
                    disabled={loading}
                    autoFocus
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore, Mumbai"
                    value={city}
                    onChange={(e) => {
                      setStudentField('city', e.target.value);
                      if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                    }}
                    error={fieldErrors.city}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Step 2: Academic Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <Input
                    label="Class / Grade"
                    placeholder="e.g. Class 10, Grade 12"
                    value={studentClass}
                    onChange={(e) => {
                      setStudentField('studentClass', e.target.value);
                      if (fieldErrors.studentClass)
                        setFieldErrors({ ...fieldErrors, studentClass: '' });
                    }}
                    error={fieldErrors.studentClass}
                    disabled={loading}
                    autoFocus
                  />
                  <Input
                    label="School / College (Optional)"
                    placeholder="Enter your institution name"
                    value={school}
                    onChange={(e) => setStudentField('school', e.target.value)}
                    disabled={loading}
                  />
                  <Input
                    label="Preferred Language"
                    placeholder="e.g. English, Hindi"
                    value={preferredLanguage}
                    onChange={(e) => {
                      setStudentField('preferredLanguage', e.target.value);
                      if (fieldErrors.preferredLanguage)
                        setFieldErrors({ ...fieldErrors, preferredLanguage: '' });
                    }}
                    error={fieldErrors.preferredLanguage}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Step 3: Learning Preferences */}
              {step === 3 && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                    Select Class Mode (Select all that apply)
                  </label>

                  {['Home Tuition', 'Online', 'Group Classes'].map((mode) => {
                    const isSelected = learningModes.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleLearningMode(mode)}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-[12px] text-sm text-left transition-all ${
                          isSelected
                            ? 'bg-[#e6f6ee]/30 border-[#00A453] text-[#00060c] font-bold'
                            : 'bg-white border-[#dadee2] text-[#384148] hover:border-[#00060c]'
                        }`}
                      >
                        <span>{mode}</span>
                        {isSelected && (
                          <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#00A453] text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {fieldErrors.learningModes && (
                    <p className="mt-1.5 text-xs text-[#DC2626]">{fieldErrors.learningModes}</p>
                  )}
                </div>
              )}

              {/* Step 4: Finish */}
              {step === 4 && (
                <div className="text-center py-6">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[#e6f6ee] text-[#00A453] mb-4">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>
                  <p className="text-sm text-[#384148] leading-relaxed max-w-xs mx-auto">
                    Your profile is completely verified. Click below to enter your student dashboard
                    and post requirements.
                  </p>
                </div>
              )}

              {/* Navigation triggers */}
              <div className="flex items-center gap-3 pt-6 border-t border-[#dadee2] mt-6">
                {step > 1 && step < 4 && (
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
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : step === 3 ? (
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
            &copy; {new Date().getFullYear()} FindMyTutor. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Celebration animation when onboarding finishes */}
      {step === 4 && <Confetti />}

      {/* Leave warning popup modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00060c]/50 p-4">
          <div className="bg-white border border-[#dadee2] rounded-[18px] p-6 max-w-sm w-full text-center shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#00060c] mb-2">
              Are you sure you want to leave?
            </h3>
            <p className="text-xs text-[#647380] leading-relaxed mb-6">
              Your progress is saved automatically. You can safely return and complete your profile
              setup anytime!
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => setShowLeaveModal(false)}
                className="w-full justify-center h-[40px] text-xs font-bold rounded-[12px]"
              >
                Continue Onboarding
              </Button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  router.push('/onboarding');
                }}
                className="w-full py-2.5 text-xs text-[#647380] hover:text-red-500 font-bold transition-colors"
              >
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
