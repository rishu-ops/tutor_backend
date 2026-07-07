'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Plus, Trash2 } from 'lucide-react';
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

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');

  // Teaching Modes checkboxes
  const [onlineMode, setOnlineMode] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [hybridMode, setHybridMode] = useState(false);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Subjects Array state
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { subject: '', level: '', experienceYears: 1 },
  ]);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Dynamic row addition helpers
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!bio.trim() || bio.length < 50) {
      errors.bio = `Bio must be at least 50 characters (currently ${bio.length} chars)`;
    }
    if (!city.trim()) errors.city = 'City is required';
    if (!area.trim()) errors.area = 'Area is required';
    if (!languagesInput.trim()) errors.languages = 'Please enter at least one language';

    const parsedMinPrice = parseFloat(minPrice);
    const parsedMaxPrice = parseFloat(maxPrice);
    if (isNaN(parsedMinPrice) || parsedMinPrice <= 0) errors.minPrice = 'Must be a positive number';
    if (isNaN(parsedMaxPrice) || parsedMaxPrice <= 0) errors.maxPrice = 'Must be a positive number';
    if (parsedMinPrice > parsedMaxPrice) {
      errors.maxPrice = 'Max price must be greater than or equal to min price';
    }

    // Verify teaching modes
    const selectedModes: string[] = [];
    if (onlineMode) selectedModes.push('ONLINE');
    if (offlineMode) selectedModes.push('OFFLINE');
    if (hybridMode) selectedModes.push('HYBRID');
    if (selectedModes.length === 0) {
      errors.teachingModes = 'Please select at least one teaching mode';
    }

    // Subject row validation
    const verifiedSubjects = subjects.filter((s) => s.subject.trim() && s.level.trim());
    if (verifiedSubjects.length === 0) {
      errors.subjects = 'Please add at least one complete subject details (with level)';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the validation errors before submitting.');
      return;
    }

    if (!accessToken || !user) {
      setError('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
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
          min: parsedMinPrice,
          max: parsedMaxPrice,
        },
        subjects: verifiedSubjects.map((s) => ({
          subject: s.subject,
          level: s.level,
          experienceYears: Number(s.experienceYears),
        })),
      };

      await onboardingApi.submit(payload as any, accessToken);

      // Update Zustand local auth store
      const updatedUser = {
        ...user,
        role: 'TUTOR',
        name,
        city,
      };
      setUser(updatedUser);

      // Go to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: any };
      setError(apiErr.message || 'Failed to complete onboarding.');
      if (apiErr.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([field, value]: [string, any]) => {
          mapped[field] = value._errors?.[0] || 'Invalid value';
        });
        setFieldErrors(mapped);
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

      {/* Form content */}
      <main className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
            {/* Header info */}
            <div className="mb-8 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-blue-50 text-[#004fcb]">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#00060c]">Tutor Onboarding</h1>
                <p className="text-xs text-[#647380]">
                  Complete your onboarding to list your teaching services.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#DC2626] rounded-[8px] p-3 text-xs font-semibold mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#00060c] border-b border-[#dadee2] pb-1 uppercase tracking-wider">
                  1. Profile Basics
                </h3>
                <Input
                  label="Display name"
                  placeholder="Enter your professional display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                  disabled={loading}
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
                      fieldErrors.bio ? 'border-[#DC2626]' : 'border-[#dadee2]'
                    }`}
                  />
                  <div className="flex justify-between mt-1 text-[11px] text-[#647380]">
                    <span>Minimum 50 characters required</span>
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

              {/* Location details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#00060c] border-b border-[#dadee2] pb-1 uppercase tracking-wider">
                  2. Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    error={fieldErrors.city}
                    disabled={loading}
                  />
                  <Input
                    label="Area / Locality"
                    placeholder="e.g. Indiranagar"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    error={fieldErrors.area}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#00060c] border-b border-[#dadee2] pb-1 uppercase tracking-wider">
                  3. Preferences & Pricing
                </h3>

                <Input
                  label="Languages Spoken"
                  placeholder="e.g. English, Hindi, Bengali (comma-separated)"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  error={fieldErrors.languages}
                  disabled={loading}
                />

                {/* Teaching Modes */}
                <div>
                  <label className="block text-sm font-bold text-[#2d2d2d] mb-2">
                    Available Teaching Modes
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-[#384148] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlineMode}
                        onChange={(e) => setOnlineMode(e.target.checked)}
                        disabled={loading}
                        className="w-4 h-4 text-[#00A453] border-[#dadee2] rounded focus:ring-[#00A453]"
                      />
                      Online
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#384148] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offlineMode}
                        onChange={(e) => setOfflineMode(e.target.checked)}
                        disabled={loading}
                        className="w-4 h-4 text-[#00A453] border-[#dadee2] rounded focus:ring-[#00A453]"
                      />
                      Offline (Home)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#384148] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hybridMode}
                        onChange={(e) => setHybridMode(e.target.checked)}
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

                {/* Hourly Pricing range */}
                <div>
                  <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                    Hourly Pricing Range (INR / hr)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="Min Price (e.g. 500)"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      error={fieldErrors.minPrice}
                      disabled={loading}
                    />
                    <span className="text-[#647380] text-sm shrink-0">to</span>
                    <Input
                      type="number"
                      placeholder="Max Price (e.g. 1500)"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      error={fieldErrors.maxPrice}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Subjects Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#dadee2] pb-1">
                  <h3 className="text-sm font-bold text-[#00060c] uppercase tracking-wider">
                    4. Teaching Subjects
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addSubjectRow}
                    disabled={loading}
                    className="text-xs text-[#00A453] font-bold py-1 h-7 rounded-[8px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Subject
                  </Button>
                </div>

                {fieldErrors.subjects && (
                  <p className="text-xs text-[#DC2626]">{fieldErrors.subjects}</p>
                )}

                <div className="space-y-4">
                  {subjects.map((sub, index) => (
                    <div
                      key={index}
                      className="border border-[#dadee2] rounded-[12px] p-4 bg-[#FAFAFA] relative space-y-3"
                    >
                      {/* Trash Button */}
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="Subject"
                          placeholder="e.g. Calculus, Physics"
                          value={sub.subject}
                          onChange={(e) => updateSubjectField(index, 'subject', e.target.value)}
                          disabled={loading}
                        />

                        {/* Dropdown combo level input */}
                        <div>
                          <label className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
                            Level
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. High School"
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
                          label="Exp. Years"
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

              <div className="pt-4 border-t border-[#dadee2]">
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
