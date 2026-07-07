'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
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

  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [school, setSchool] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [learningMode, setLearningMode] = useState<'ONLINE' | 'OFFLINE' | 'HYBRID'>('ONLINE');

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!school.trim()) errors.school = 'School is required';
    if (!studentClass.trim()) errors.class = 'Class is required';
    if (!preferredLanguage.trim()) errors.preferredLanguage = 'Preferred language is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

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

      // Update local Zustand store state
      const updatedUser = {
        ...user,
        role: 'STUDENT',
        name,
        city,
      };
      setUser(updatedUser);

      // Navigate to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: any };
      setError(apiErr.message || 'Failed to submit onboarding profile.');
      if (apiErr.errors) {
        // Map backend zod errors to field-level states
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
            className="flex items-center gap-1.5 text-sm text-[#647380] hover:text-[#00060c] font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      {/* Form Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-[#e6f6ee] text-[#00A453]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#00060c]">Student Onboarding</h1>
                <p className="text-xs text-[#647380]">
                  Complete your profile to find your matches.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#DC2626] rounded-[8px] p-3 text-xs font-semibold mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                disabled={loading}
              />

              <Input
                label="City"
                placeholder="e.g. Bangalore, Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={fieldErrors.city}
                disabled={loading}
              />

              <Input
                label="School / Institution"
                placeholder="Enter your school name"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                error={fieldErrors.school}
                disabled={loading}
              />

              <Input
                label="Class / Grade"
                placeholder="e.g. Class 10, Grade 12"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                error={fieldErrors.class}
                disabled={loading}
              />

              <Input
                label="Preferred language"
                placeholder="e.g. English, Hindi, Kannada"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                error={fieldErrors.preferredLanguage}
                disabled={loading}
              />

              {/* Learning Mode Select */}
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
                  <option value="ONLINE">Online Class</option>
                  <option value="OFFLINE">Offline Home Class</option>
                  <option value="HYBRID">Hybrid Mode</option>
                </select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full rounded-[12px]"
                >
                  Complete Setup
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center">
          <p className="text-xs text-[#647380]">
            &copy; {new Date().getFullYear()} Project Tutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
