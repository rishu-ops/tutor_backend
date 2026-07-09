'use client';

import React, { useState, useEffect } from 'react';
import {
  Pencil,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  X,
  Plus,
  Save,
  Loader2,
  Check,
} from 'lucide-react';
import DashboardLayout from '../dashboard/layout';
import { useAuthStore } from '@/stores/auth-store';
import { profileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SectionHeaderProps {
  title: string;
  description?: string;
  isEditing: boolean;
  saveStatus: SaveStatus;
  canSave: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  illustration?: React.ReactNode;
}

// ─── Illustrations ────────────────────────────────────────────────────────────
function IllustrationCV() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-90"
    >
      <rect
        x="20"
        y="10"
        width="60"
        height="80"
        rx="6"
        fill="#f1f3f5"
        stroke="#dadee2"
        strokeWidth="1.5"
      />
      <rect x="30" y="25" width="40" height="4" rx="2" fill="#dadee2" />
      <rect x="30" y="35" width="30" height="3" rx="1.5" fill="#dadee2" />
      <rect x="30" y="45" width="35" height="3" rx="1.5" fill="#dadee2" />
      <circle cx="140" cy="40" r="28" fill="#f8fafc" stroke="#dadee2" strokeWidth="1.5" />
      <path
        d="M128 40 L136 48 L152 32"
        stroke="#00A453"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="160" cy="85" r="16" fill="#e6f6ee" stroke="#dadee2" strokeWidth="1.5" />
      <path
        d="M153 85 L158 90 L167 81"
        stroke="#00A453"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IllustrationDefault() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-90"
    >
      <rect
        x="80"
        y="70"
        width="60"
        height="35"
        rx="4"
        fill="#f1f3f5"
        stroke="#dadee2"
        strokeWidth="1.5"
      />
      <rect x="85" y="75" width="50" height="24" rx="2" fill="#e6f6ee" />
      <circle cx="115" cy="45" r="14" fill="#f1f3f5" stroke="#dadee2" strokeWidth="1.5" />
      <line x1="115" y1="59" x2="115" y2="70" stroke="#dadee2" strokeWidth="2" />
      <circle cx="40" cy="30" r="6" fill="#e6f6ee" stroke="#00A453" strokeWidth="1" />
      <circle cx="160" cy="25" r="4" fill="#dadee2" />
      <circle cx="155" cy="95" r="8" fill="#f1f3f5" stroke="#dadee2" strokeWidth="1" />
    </svg>
  );
}

// ─── Nav sections ─────────────────────────────────────────────────────────────
const STUDENT_SECTIONS = [
  {
    group: 'Profile',
    items: [
      { id: 'Personal Information', label: 'Personal Information' },
      { id: 'Academic Information', label: 'Academic Information' },
      { id: 'Learning Preferences', label: 'Learning Preferences' },
    ],
  },
  {
    group: 'Account',
    items: [
      { id: 'Account Settings', label: 'Account Settings' },
      { id: 'Security', label: 'Security' },
    ],
  },
  { group: 'Manage account', items: [{ id: 'Danger Zone', label: 'Danger Zone' }] },
];

const TUTOR_SECTIONS = [
  {
    group: 'Profile',
    items: [
      { id: 'Personal Information', label: 'Personal Information' },
      { id: 'Professional Information', label: 'Professional Info' },
      { id: 'Pricing', label: 'Pricing and Fees' },
      { id: 'Qualifications', label: 'Qualifications' },
      { id: 'Availability', label: 'Availability' },
    ],
  },
  {
    group: 'Verification and Reviews',
    items: [
      { id: 'Verification', label: 'Verification Status' },
      { id: 'Reviews', label: 'Student Reviews' },
    ],
  },
  {
    group: 'Account',
    items: [
      { id: 'Account Settings', label: 'Account Settings' },
      { id: 'Security', label: 'Security' },
    ],
  },
  { group: 'Manage account', items: [{ id: 'Danger Zone', label: 'Danger Zone' }] },
];

const SECTION_DESC: Record<string, string> = {
  'Academic Information': 'Update your class, school, and language preferences.',
  'Learning Preferences': 'Get the classes that best match your goals and needs.',
  'Professional Information': 'Tell students about your expertise and teaching background.',
  Pricing: 'Set your hourly rate range for tutoring sessions.',
  Qualifications: 'List your academic degrees and professional certifications.',
  Availability: 'Let students know when you are free to teach.',
  Verification: 'Track the status of your identity and credential checks.',
  Reviews: 'See what your students are saying about you.',
  'Account Settings': 'Manage your notification and privacy preferences.',
  Security: 'Review your linked phone number and active sessions.',
  'Danger Zone': 'Permanently delete or deactivate your account.',
};

// ─── Validation helpers ───────────────────────────────────────────────────────
function validateStudentPersonal(form: any) {
  const errors: Record<string, string> = {};
  if (!form.name?.trim()) errors.name = 'Name cannot be empty.';
  if (form.name && form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (form.city && form.city.trim().length < 1) errors.city = 'City cannot be empty.';
  return errors;
}

function validateStudentAcademic(form: any) {
  const errors: Record<string, string> = {};
  if (form.class && !form.class.trim()) errors.class = 'Class cannot be empty.';
  if (form.school && !form.school.trim()) errors.school = 'School cannot be empty.';
  if (form.preferredLanguage && !form.preferredLanguage.trim())
    errors.preferredLanguage = 'Language cannot be empty.';
  return errors;
}

function validateTutorPersonal(form: any) {
  const errors: Record<string, string> = {};
  if (!form.name?.trim()) errors.name = 'Name cannot be empty.';
  if (form.name && form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (form.locationCity && !form.locationCity.trim()) errors.locationCity = 'City cannot be empty.';
  if (form.locationArea && !form.locationArea.trim()) errors.locationArea = 'Area cannot be empty.';
  return errors;
}

function validateTutorProfessional(form: any) {
  const errors: Record<string, string> = {};
  if (form.bio !== undefined && form.bio.trim().length > 0 && form.bio.trim().length < 50)
    errors.bio = 'Bio must be at least 50 characters.';
  (form.subjects || []).forEach((s: any, i: number) => {
    if (!s.subject?.trim()) errors[`subject_${i}`] = 'Subject name is required.';
    if (!s.level?.trim()) errors[`level_${i}`] = 'Level is required.';
    if (s.experienceYears === '' || s.experienceYears < 0)
      errors[`exp_${i}`] = 'Experience must be ≥ 0.';
  });
  return errors;
}

function validateTutorPricing(form: any) {
  const errors: Record<string, string> = {};
  const min = Number(form.min);
  const max = Number(form.max);
  if (!form.min && form.min !== 0) errors.min = 'Minimum rate is required.';
  else if (isNaN(min) || min <= 0) errors.min = 'Min must be a positive number.';
  if (!form.max && form.max !== 0) errors.max = 'Maximum rate is required.';
  else if (isNaN(max) || max <= 0) errors.max = 'Max must be a positive number.';
  if (!errors.min && !errors.max && max <= min) errors.max = 'Max must be greater than min.';
  return errors;
}

function validateTutorQualifications(form: any) {
  const errors: Record<string, string> = {};
  (form || []).forEach((q: any, i: number) => {
    if (!q.degree?.trim()) errors[`degree_${i}`] = 'Degree is required.';
    if (!q.institution?.trim()) errors[`institution_${i}`] = 'Institution is required.';
    const yr = Number(q.year);
    if (!q.year) errors[`year_${i}`] = 'Year is required.';
    else if (isNaN(yr) || yr < 1900 || yr > new Date().getFullYear())
      errors[`year_${i}`] = `Year must be 1900–${new Date().getFullYear()}.`;
  });
  return errors;
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function ReadField({ label, value, note }: { label: string; value?: string; note?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[#2d2d2d] font-medium">{label}</label>
      <div className="w-full border border-[#dadee2] rounded-[4px] px-4 py-3 text-base text-[#2d2d2d] bg-[#FAFAFA] min-h-[48px]">
        {value || <span className="text-[#b0b8c1]">Not set</span>}
      </div>
      {note && <p className="text-sm text-[#647380]">{note}</p>}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  error,
  note,
  disabled = false,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  note?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-[#2d2d2d] font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full border rounded-[4px] px-4 py-3 text-base text-[#2d2d2d] bg-white focus:outline-none transition-colors ${
          error ? 'border-red-400 focus:border-red-500' : 'border-[#dadee2] focus:border-[#00A453]'
        } ${disabled ? 'bg-[#FAFAFA] cursor-not-allowed text-[#647380]' : ''}`}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {note && !error && <p className="text-sm text-[#647380]">{note}</p>}
    </div>
  );
}

function EditTextarea({
  label,
  value,
  onChange,
  error,
  placeholder = '',
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-[#2d2d2d] font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border rounded-[4px] px-4 py-3 text-base text-[#2d2d2d] bg-white focus:outline-none transition-colors resize-none ${
          error ? 'border-red-400 focus:border-red-500' : 'border-[#dadee2] focus:border-[#00A453]'
        }`}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        ) : (
          <span />
        )}
        <span
          className={`text-xs ${value.length < 50 && value.length > 0 ? 'text-amber-500' : 'text-[#b0b8c1]'}`}
        >
          {value.length}/50 min
        </span>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  isEditing,
  saveStatus,
  canSave,
  onEdit,
  onSave,
  onCancel,
  illustration,
}: SectionHeaderProps) {
  return (
    <div className="relative px-8 pt-10 pb-5 flex items-start justify-between border-b border-[#dadee2]">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-normal text-[#2d2d2d]">{title}</h2>
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A453] bg-[#e6f6ee] px-2.5 py-1 rounded-full animate-fade-in">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> Failed
            </span>
          )}
        </div>
        {description && <p className="text-base text-[#647380] mt-2">{description}</p>}

        {isEditing && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onSave}
              disabled={!canSave || saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2d2d2d] text-white text-sm font-semibold rounded-[4px] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saveStatus === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={onCancel}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#dadee2] text-[#2d2d2d] text-sm font-semibold rounded-[4px] hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 ml-4">
        {!isEditing && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm text-white bg-[#00A453] hover:bg-[#009048] transition-colors mt-1 rounded-[4px] px-3.5 py-1.5 font-semibold shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
        {illustration && <div className="shrink-0 hidden sm:block">{illustration}</div>}
      </div>
    </div>
  );
}

function ServerErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-[4px] px-4 py-3 text-sm text-red-600">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ─── Tag chip (for teaching modes, languages, availability) ──────────────────
function TagChip({ value, onRemove }: { value: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#2d2d2d] rounded-[4px] text-[#2d2d2d]">
      {value}
      {onRemove && (
        <button onClick={onRemove} className="text-[#647380] hover:text-red-500 transition-colors">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState('Personal Information');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── Load profile ─────────────────────────────────────────────────────────
  const loadProfile = async () => {
    if (!accessToken || !user?.role) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError('');
      const res =
        user.role === 'STUDENT'
          ? await profileApi.getStudentProfile(accessToken)
          : await profileApi.getTutorProfile(accessToken);
      if (res.success && res.data) setProfileData(res.data);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadProfile();
  }, [accessToken, user?.role]);

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const sections = isStudent ? STUDENT_SECTIONS : TUTOR_SECTIONS;

  const getInitials = () =>
    (profileData?.name || user.name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const displayName = profileData?.name || user.name || 'Anonymous User';
  const subtitle = isStudent
    ? 'Student'
    : profileData?.verificationStatus === 'VERIFIED'
      ? 'Tutor (verified)'
      : 'Tutor (unverified)';
  const city = profileData?.city || profileData?.location?.city || 'Location not set';

  const illustration =
    activeTab === 'Professional Information' || activeTab === 'Qualifications' ? (
      <IllustrationCV />
    ) : (
      <IllustrationDefault />
    );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1100px] mx-auto px-4 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-9 h-9 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#647380]">Loading profile…</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-[8px] p-6 text-center max-w-md mx-auto mt-12">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-600 mb-3">{loadError}</p>
              <Button size="sm" onClick={loadProfile}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex gap-10 items-start">
              {/* ═══ LEFT SIDEBAR ═══ */}
              <aside className="w-[280px] shrink-0 space-y-6">
                <div className="border border-[#dadee2] rounded-[8px] p-5 bg-white flex items-start gap-4 relative">
                  <div className="h-14 w-14 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center text-lg font-bold text-[#00A453] select-none shrink-0">
                    {getInitials()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#2d2d2d] leading-tight truncate">
                      {displayName}
                    </p>
                    <p className="text-sm text-[#647380] mt-1">{subtitle}</p>
                    <p className="text-sm text-[#647380] mt-0.5">{city}</p>
                  </div>
                </div>

                <nav className="space-y-6">
                  {sections.map((section) => (
                    <div key={section.group}>
                      <p className="text-sm text-[#647380] mb-2 px-3 font-medium">
                        {section.group}
                      </p>
                      <ul>
                        {section.items.map((item) => {
                          const isActive = activeTab === item.id;
                          const isDanger = item.id === 'Danger Zone';
                          return (
                            <li key={item.id}>
                              <button
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full text-left py-2.5 px-3 text-base transition-colors border-l-2 ${
                                  isActive
                                    ? 'border-[#2d2d2d] text-[#2d2d2d] font-semibold'
                                    : isDanger
                                      ? 'border-transparent text-red-500 hover:text-red-700'
                                      : 'border-transparent text-[#2d2d2d] hover:text-[#00A453]'
                                }`}
                              >
                                {item.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>
              </aside>

              {/* ═══ RIGHT PANEL ═══ */}
              <div className="flex-1 min-w-0 border border-[#dadee2] rounded-[8px] bg-white overflow-hidden">
                {isStudent ? (
                  <StudentSections
                    activeTab={activeTab}
                    profileData={profileData}
                    accessToken={accessToken!}
                    user={user}
                    illustration={illustration}
                    onSaved={(updated: any) => {
                      setProfileData(updated);
                      if (updated.name && updated.name !== user.name) {
                        setUser({ ...user, name: updated.name });
                      }
                    }}
                  />
                ) : (
                  <TutorSections
                    activeTab={activeTab}
                    profileData={profileData}
                    accessToken={accessToken!}
                    user={user}
                    illustration={illustration}
                    onSaved={(updated: any) => {
                      setProfileData(updated);
                      if (updated.name && updated.name !== user.name) {
                        setUser({ ...user, name: updated.name });
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SECTIONS
// ─────────────────────────────────────────────────────────────────────────────
function StudentSections({
  activeTab,
  profileData,
  accessToken,
  user,
  illustration,
  onSaved,
}: any) {
  return (
    <>
      {activeTab === 'Personal Information' && (
        <StudentPersonalSection
          profileData={profileData}
          accessToken={accessToken}
          user={user}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Academic Information' && (
        <StudentAcademicSection
          profileData={profileData}
          accessToken={accessToken}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Learning Preferences' && (
        <StudentLearningSection
          profileData={profileData}
          accessToken={accessToken}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Account Settings' && <AccountSettings />}
      {activeTab === 'Security' && <Security user={user} />}
      {activeTab === 'Danger Zone' && <DangerZone />}
    </>
  );
}

function StudentPersonalSection({ profileData, accessToken, user, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ name: '', city: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savedForm = {
    name: profileData?.name || user?.name || '',
    city: profileData?.city || '',
    email: profileData?.email || '',
  };

  const startEdit = () => {
    setForm(savedForm);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const validate = () => {
    const errs = validateStudentPersonal(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    setServerError('');
    try {
      const payload: Record<string, unknown> = {};
      if (form.name !== savedForm.name) payload.name = form.name.trim();
      if (form.city !== savedForm.city) payload.city = form.city.trim();
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        setSaveStatus('idle');
        return;
      }
      const res = await profileApi.updateStudentProfile(payload, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getInitials = () =>
    (form.name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <SectionHeader
        title="Personal Information"
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty && Object.keys(errors).length === 0}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-5">
        {serverError && <ServerErrorBanner message={serverError} />}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center text-xl font-bold text-[#00A453]">
            {isEditing
              ? getInitials()
              : (profileData?.name || user?.name || 'U')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
          </div>
        </div>
        {isEditing ? (
          <>
            <EditField
              label="Full name"
              value={form.name}
              onChange={(v) => {
                setForm((f) => ({ ...f, name: v }));
                setErrors((e) => ({ ...e, name: '' }));
              }}
              error={errors.name}
            />
            <EditField
              label="City"
              value={form.city}
              onChange={(v) => {
                setForm((f) => ({ ...f, city: v }));
                setErrors((e) => ({ ...e, city: '' }));
              }}
              error={errors.city}
              placeholder="e.g. Mumbai"
            />
            <EditField
              label="Email address"
              value={form.email}
              onChange={() => {}}
              disabled
              note="Contact support to change your email address."
            />
            <ReadField
              label="Phone number"
              value={user?.phone}
              note="Your phone number is verified and cannot be changed."
            />
          </>
        ) : (
          <>
            <ReadField label="Full name" value={profileData?.name || user?.name} />
            <ReadField label="City" value={profileData?.city} />
            <ReadField
              label="Phone number"
              value={user?.phone}
              note="Your phone number is verified and cannot be changed."
            />
            <ReadField label="Email address" value={profileData?.email} />
          </>
        )}
      </div>
    </>
  );
}

function StudentAcademicSection({ profileData, accessToken, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ class: '', school: '', preferredLanguage: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savedForm = {
    class: profileData?.class || '',
    school: profileData?.school || '',
    preferredLanguage: profileData?.preferredLanguage || '',
  };

  const startEdit = () => {
    setForm(savedForm);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };
  const cancel = () => {
    setIsEditing(false);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
  };
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const validate = () => {
    const errs = validateStudentAcademic(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    setServerError('');
    try {
      const payload: Record<string, unknown> = {};
      if (form.class !== savedForm.class) payload.class = form.class.trim();
      if (form.school !== savedForm.school) payload.school = form.school.trim();
      if (form.preferredLanguage !== savedForm.preferredLanguage)
        payload.preferredLanguage = form.preferredLanguage.trim();
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }
      const res = await profileApi.updateStudentProfile(payload, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <>
      <SectionHeader
        title="Academic Information"
        description={SECTION_DESC['Academic Information']}
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty && Object.keys(errors).length === 0}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-5">
        {serverError && <ServerErrorBanner message={serverError} />}
        {isEditing ? (
          <>
            <EditField
              label="Class / Grade"
              value={form.class}
              onChange={(v) => {
                setForm((f) => ({ ...f, class: v }));
                setErrors((e) => ({ ...e, class: '' }));
              }}
              error={errors.class}
              placeholder="e.g. Grade 10 / B.Sc"
            />
            <EditField
              label="School / College"
              value={form.school}
              onChange={(v) => {
                setForm((f) => ({ ...f, school: v }));
                setErrors((e) => ({ ...e, school: '' }));
              }}
              error={errors.school}
              placeholder="e.g. Delhi Public School"
            />
            <EditField
              label="Preferred Language"
              value={form.preferredLanguage}
              onChange={(v) => {
                setForm((f) => ({ ...f, preferredLanguage: v }));
                setErrors((e) => ({ ...e, preferredLanguage: '' }));
              }}
              error={errors.preferredLanguage}
              placeholder="e.g. English"
            />
          </>
        ) : (
          <>
            <ReadField label="Class / Grade" value={profileData?.class} />
            <ReadField label="School / College" value={profileData?.school} />
            <ReadField label="Preferred Language" value={profileData?.preferredLanguage} />
          </>
        )}
      </div>
    </>
  );
}

const LEARNING_MODES = ['ONLINE', 'OFFLINE', 'HYBRID'] as const;

function StudentLearningSection({ profileData, accessToken, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  const savedMode = profileData?.learningMode || '';

  const startEdit = () => {
    setSelectedMode(savedMode);
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };
  const cancel = () => {
    setIsEditing(false);
    setServerError('');
    setSaveStatus('idle');
  };
  const isDirty = selectedMode !== savedMode;

  const save = async () => {
    if (!isDirty) {
      setIsEditing(false);
      return;
    }
    setSaveStatus('saving');
    setServerError('');
    try {
      const res = await profileApi.updateStudentProfile(
        { learningMode: selectedMode },
        accessToken
      );
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <>
      <SectionHeader
        title="Learning Preferences"
        description={SECTION_DESC['Learning Preferences']}
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-5">
        {serverError && <ServerErrorBanner message={serverError} />}
        <div>
          <p className="text-sm font-medium text-[#2d2d2d] mb-3">Preferred teaching mode</p>
          {isEditing ? (
            <div className="flex gap-3 flex-wrap">
              {LEARNING_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-5 py-2.5 rounded-[4px] border text-sm font-semibold transition-colors ${
                    selectedMode === mode
                      ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                      : 'border-[#dadee2] text-[#2d2d2d] hover:border-[#2d2d2d]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-base text-[#2d2d2d]">
              {profileData?.learningMode ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#2d2d2d] rounded-[4px] text-sm font-semibold">
                  {profileData.learningMode}
                </span>
              ) : (
                <span className="text-[#b0b8c1] text-sm">Not set</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR SECTIONS
// ─────────────────────────────────────────────────────────────────────────────
function TutorSections({ activeTab, profileData, accessToken, user, illustration, onSaved }: any) {
  return (
    <>
      {activeTab === 'Personal Information' && (
        <TutorPersonalSection
          profileData={profileData}
          accessToken={accessToken}
          user={user}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Professional Information' && (
        <TutorProfessionalSection
          profileData={profileData}
          accessToken={accessToken}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Pricing' && (
        <TutorPricingSection
          profileData={profileData}
          accessToken={accessToken}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Qualifications' && (
        <TutorQualificationsSection
          profileData={profileData}
          accessToken={accessToken}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Availability' && (
        <TutorAvailabilitySection
          profileData={profileData}
          accessToken={accessToken}
          illustration={illustration}
          onSaved={onSaved}
        />
      )}
      {activeTab === 'Verification' && <VerificationSection profileData={profileData} />}
      {activeTab === 'Reviews' && <ReviewsSection profileData={profileData} />}
      {activeTab === 'Account Settings' && <AccountSettings />}
      {activeTab === 'Security' && <Security user={user} />}
      {activeTab === 'Danger Zone' && <DangerZone />}
    </>
  );
}

function TutorPersonalSection({ profileData, accessToken, user, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', locationCity: '', locationArea: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savedForm = {
    name: profileData?.name || user?.name || '',
    email: profileData?.email || '',
    locationCity: profileData?.location?.city || '',
    locationArea: profileData?.location?.area || '',
  };

  const startEdit = () => {
    setForm(savedForm);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };
  const cancel = () => {
    setIsEditing(false);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
  };
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const validate = () => {
    const errs = validateTutorPersonal(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    setServerError('');
    try {
      const payload: Record<string, unknown> = {};
      if (form.name !== savedForm.name) payload.name = form.name.trim();
      if (
        form.locationCity !== savedForm.locationCity ||
        form.locationArea !== savedForm.locationArea
      ) {
        payload.location = { city: form.locationCity.trim(), area: form.locationArea.trim() };
      }
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }
      const res = await profileApi.updateTutorProfile(payload, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getInitials = () =>
    (form.name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <SectionHeader
        title="Personal Information"
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty && Object.keys(errors).length === 0}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-5">
        {serverError && <ServerErrorBanner message={serverError} />}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center text-xl font-bold text-[#00A453]">
            {isEditing
              ? getInitials()
              : (profileData?.name || user?.name || 'U')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
          </div>
        </div>
        {isEditing ? (
          <>
            <EditField
              label="Full name"
              value={form.name}
              onChange={(v) => {
                setForm((f) => ({ ...f, name: v }));
                setErrors((e) => ({ ...e, name: '' }));
              }}
              error={errors.name}
            />
            <EditField
              label="Email address"
              value={form.email}
              onChange={() => {}}
              disabled
              note="Contact support to change your email address."
            />
            <div className="grid grid-cols-2 gap-4">
              <EditField
                label="City"
                value={form.locationCity}
                onChange={(v) => {
                  setForm((f) => ({ ...f, locationCity: v }));
                  setErrors((e) => ({ ...e, locationCity: '' }));
                }}
                error={errors.locationCity}
                placeholder="e.g. Mumbai"
              />
              <EditField
                label="Area"
                value={form.locationArea}
                onChange={(v) => {
                  setForm((f) => ({ ...f, locationArea: v }));
                  setErrors((e) => ({ ...e, locationArea: '' }));
                }}
                error={errors.locationArea}
                placeholder="e.g. Andheri West"
              />
            </div>
            <ReadField
              label="Phone number"
              value={user?.phone}
              note="Your phone number is verified and cannot be changed."
            />
          </>
        ) : (
          <>
            <ReadField label="Full name" value={profileData?.name || user?.name} />
            <ReadField label="Email address" value={profileData?.email} />
            <div className="grid grid-cols-2 gap-4">
              <ReadField label="City" value={profileData?.location?.city} />
              <ReadField label="Area" value={profileData?.location?.area} />
            </div>
            <ReadField
              label="Phone number"
              value={user?.phone}
              note="Your phone number is verified and cannot be changed."
            />
          </>
        )}
      </div>
    </>
  );
}

const TEACHING_MODES = ['ONLINE', 'OFFLINE', 'HYBRID'];
const COMMON_LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Gujarati',
];

function TutorProfessionalSection({ profileData, accessToken, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachingModes, setTeachingModes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savedState = {
    bio: profileData?.bio || '',
    subjects: profileData?.subjects || [],
    teachingModes: profileData?.teachingModes || [],
    languages: profileData?.languages || [],
  };

  const startEdit = () => {
    setBio(savedState.bio);
    setSubjects(savedState.subjects.map((s: any) => ({ ...s })));
    setTeachingModes([...savedState.teachingModes]);
    setLanguages([...savedState.languages]);
    setLangInput('');
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
  };

  const isDirty =
    bio !== savedState.bio ||
    JSON.stringify(subjects) !== JSON.stringify(savedState.subjects) ||
    JSON.stringify(teachingModes) !== JSON.stringify(savedState.teachingModes) ||
    JSON.stringify(languages) !== JSON.stringify(savedState.languages);

  const addSubject = () =>
    setSubjects((s) => [...s, { subject: '', level: '', experienceYears: 0 }]);
  const removeSubject = (i: number) => setSubjects((s) => s.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, key: string, val: any) => {
    setSubjects((s) => s.map((sub, idx) => (idx === i ? { ...sub, [key]: val } : sub)));
    setErrors((e) => {
      const n = { ...e };
      delete n[`${key === 'subject' ? 'subject' : key === 'level' ? 'level' : 'exp'}_${i}`];
      return n;
    });
  };

  const toggleMode = (mode: string) =>
    setTeachingModes((m) => (m.includes(mode) ? m.filter((x) => x !== mode) : [...m, mode]));

  const addLanguage = (lang: string) => {
    const trimmed = lang.trim();
    if (trimmed && !languages.includes(trimmed)) setLanguages((l) => [...l, trimmed]);
    setLangInput('');
  };

  const validate = () => {
    const errs = validateTutorProfessional({ bio, subjects });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    setServerError('');
    try {
      const payload: Record<string, unknown> = {};
      if (bio !== savedState.bio) payload.bio = bio.trim();
      if (JSON.stringify(subjects) !== JSON.stringify(savedState.subjects))
        payload.subjects = subjects.map((s) => ({
          ...s,
          experienceYears: Number(s.experienceYears),
        }));
      if (JSON.stringify(teachingModes) !== JSON.stringify(savedState.teachingModes))
        payload.teachingModes = teachingModes;
      if (JSON.stringify(languages) !== JSON.stringify(savedState.languages))
        payload.languages = languages;
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }
      const res = await profileApi.updateTutorProfile(payload, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <>
      <SectionHeader
        title="Professional Information"
        description={SECTION_DESC['Professional Information']}
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty && Object.keys(errors).length === 0}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-7">
        {serverError && <ServerErrorBanner message={serverError} />}

        {/* Visibility tier (read-only) */}
        <ReadField label="Visibility tier" value={profileData?.visibilityTier || 'FREE TIER'} />

        {/* Bio */}
        <div>
          {isEditing ? (
            <EditTextarea
              label="Bio"
              value={bio}
              onChange={(v) => {
                setBio(v);
                setErrors((e) => ({ ...e, bio: '' }));
              }}
              error={errors.bio}
              placeholder="Tell students about your teaching style, experience, and expertise… (min. 50 characters)"
              rows={4}
            />
          ) : (
            <ReadField label="Bio" value={profileData?.bio} />
          )}
        </div>

        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#2d2d2d]">Subjects and experience</p>
            {isEditing && (
              <button
                onClick={addSubject}
                className="inline-flex items-center gap-1 text-xs text-[#00A453] font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add subject
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-3">
              {subjects.length === 0 && (
                <p className="text-sm text-[#b0b8c1]">No subjects added yet.</p>
              )}
              {subjects.map((sub, i) => (
                <div
                  key={i}
                  className="border border-[#dadee2] rounded-[4px] p-4 space-y-3 relative"
                >
                  <button
                    onClick={() => removeSubject(i)}
                    className="absolute top-3 right-3 text-[#b0b8c1] hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <EditField
                      label="Subject"
                      value={sub.subject}
                      onChange={(v) => updateSubject(i, 'subject', v)}
                      error={errors[`subject_${i}`]}
                      placeholder="e.g. Mathematics"
                    />
                    <EditField
                      label="Level"
                      value={sub.level}
                      onChange={(v) => updateSubject(i, 'level', v)}
                      error={errors[`level_${i}`]}
                      placeholder="e.g. Class 9–12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#2d2d2d] font-medium mb-1.5">
                      Years of experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={sub.experienceYears}
                      onChange={(e) => updateSubject(i, 'experienceYears', e.target.value)}
                      className={`w-32 border rounded-[4px] px-3 py-2 text-sm text-[#2d2d2d] focus:outline-none ${errors[`exp_${i}`] ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'}`}
                    />
                    {errors[`exp_${i}`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`exp_${i}`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(profileData?.subjects || []).length > 0 ? (
                profileData.subjects.map((sub: any, i: number) => (
                  <div key={i} className="border border-[#dadee2] rounded-[4px] px-4 py-3">
                    <p className="text-sm font-semibold text-[#2d2d2d]">{sub.subject}</p>
                    <p className="text-xs text-[#647380]">
                      Level: {sub.level} · {sub.experienceYears} yr exp
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#b0b8c1]">No subjects added yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Teaching modes */}
        <div className="border-t border-[#dadee2] pt-6">
          <p className="text-sm font-semibold text-[#2d2d2d] mb-3">Teaching formats</p>
          {isEditing ? (
            <div className="flex gap-3 flex-wrap">
              {TEACHING_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => toggleMode(mode)}
                  className={`px-5 py-2.5 rounded-[4px] border text-sm font-semibold transition-colors ${
                    teachingModes.includes(mode)
                      ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                      : 'border-[#dadee2] text-[#2d2d2d] hover:border-[#2d2d2d]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profileData?.teachingModes || []).length > 0 ? (
                profileData.teachingModes.map((m: string) => <TagChip key={m} value={m} />)
              ) : (
                <span className="text-sm text-[#b0b8c1]">Not set</span>
              )}
            </div>
          )}
        </div>

        {/* Languages */}
        <div className="border-t border-[#dadee2] pt-6">
          <p className="text-sm font-semibold text-[#2d2d2d] mb-3">Languages</p>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <TagChip
                    key={l}
                    value={l}
                    onRemove={() => setLanguages((ls) => ls.filter((x) => x !== l))}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).map((l) => (
                  <button
                    key={l}
                    onClick={() => addLanguage(l)}
                    className="text-xs px-3 py-1.5 border border-dashed border-[#dadee2] rounded-[4px] text-[#647380] hover:border-[#00A453] hover:text-[#00A453] transition-colors"
                  >
                    + {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLanguage(langInput);
                    }
                  }}
                  placeholder="Type and press Enter to add…"
                  className="border border-[#dadee2] rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:border-[#00A453] flex-1 max-w-xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profileData?.languages || []).length > 0 ? (
                profileData.languages.map((l: string) => <TagChip key={l} value={l} />)
              ) : (
                <span className="text-sm text-[#b0b8c1]">Not set</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function TutorPricingSection({ profileData, accessToken, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ min: '', max: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savedForm = {
    min: String(profileData?.pricing?.min || ''),
    max: String(profileData?.pricing?.max || ''),
  };

  const startEdit = () => {
    setForm(savedForm);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };
  const cancel = () => {
    setIsEditing(false);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
  };
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const validate = () => {
    const errs = validateTutorPricing(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    setServerError('');
    try {
      const payload = { pricing: { min: Number(form.min), max: Number(form.max) } };
      const res = await profileApi.updateTutorProfile(payload, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <>
      <SectionHeader
        title="Pricing and Fees"
        description={SECTION_DESC['Pricing']}
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty && Object.keys(errors).length === 0}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-7">
        {serverError && <ServerErrorBanner message={serverError} />}
        {isEditing ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm text-[#2d2d2d] font-medium">
                Minimum rate (₹/hr)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647380] text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.min}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, min: e.target.value }));
                    setErrors((er) => ({ ...er, min: '' }));
                  }}
                  className={`w-full border rounded-[4px] pl-8 pr-4 py-3 text-base text-[#2d2d2d] focus:outline-none ${errors.min ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'}`}
                  placeholder="500"
                />
              </div>
              {errors.min && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.min}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm text-[#2d2d2d] font-medium">
                Maximum rate (₹/hr)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647380] text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.max}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, max: e.target.value }));
                    setErrors((er) => ({ ...er, max: '' }));
                  }}
                  className={`w-full border rounded-[4px] pl-8 pr-4 py-3 text-base text-[#2d2d2d] focus:outline-none ${errors.max ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'}`}
                  placeholder="2000"
                />
              </div>
              {errors.max && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.max}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <ReadField
              label="Minimum rate (₹/hr)"
              value={profileData?.pricing?.min ? `₹${profileData.pricing.min}` : undefined}
            />
            <ReadField
              label="Maximum rate (₹/hr)"
              value={profileData?.pricing?.max ? `₹${profileData.pricing.max}` : undefined}
            />
          </div>
        )}
      </div>
    </>
  );
}

function TutorQualificationsSection({ profileData, accessToken, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savedQuals = profileData?.qualifications || [];

  const startEdit = () => {
    setQualifications(savedQuals.map((q: any) => ({ ...q })));
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };
  const cancel = () => {
    setIsEditing(false);
    setErrors({});
    setServerError('');
    setSaveStatus('idle');
  };
  const isDirty = JSON.stringify(qualifications) !== JSON.stringify(savedQuals);

  const addQual = () => setQualifications((q) => [...q, { degree: '', institution: '', year: '' }]);
  const removeQual = (i: number) => {
    setQualifications((q) => q.filter((_, idx) => idx !== i));
  };
  const updateQual = (i: number, key: string, val: any) => {
    setQualifications((q) => q.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));
    setErrors((e) => {
      const n = { ...e };
      delete n[`${key}_${i}`];
      return n;
    });
  };

  const validate = () => {
    const errs = validateTutorQualifications(qualifications);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    setServerError('');
    try {
      const payload = {
        qualifications: qualifications.map((q) => ({ ...q, year: Number(q.year) })),
      };
      const res = await profileApi.updateTutorProfile(payload, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <>
      <SectionHeader
        title="Qualifications"
        description={SECTION_DESC['Qualifications']}
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty && Object.keys(errors).length === 0}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7 space-y-4">
        {serverError && <ServerErrorBanner message={serverError} />}
        {isEditing ? (
          <>
            <div className="space-y-3">
              {qualifications.length === 0 && (
                <p className="text-sm text-[#b0b8c1]">No qualifications added.</p>
              )}
              {qualifications.map((q, i) => (
                <div
                  key={i}
                  className="border border-[#dadee2] rounded-[4px] p-4 space-y-3 relative"
                >
                  <button
                    onClick={() => removeQual(i)}
                    className="absolute top-3 right-3 text-[#b0b8c1] hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <EditField
                      label="Degree / Diploma"
                      value={q.degree}
                      onChange={(v) => updateQual(i, 'degree', v)}
                      error={errors[`degree_${i}`]}
                      placeholder="e.g. B.Sc Mathematics"
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm text-[#2d2d2d] font-medium">Year</label>
                      <input
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        value={q.year}
                        onChange={(e) => updateQual(i, 'year', e.target.value)}
                        className={`w-full border rounded-[4px] px-3 py-3 text-sm focus:outline-none ${errors[`year_${i}`] ? 'border-red-400' : 'border-[#dadee2] focus:border-[#00A453]'}`}
                        placeholder={String(new Date().getFullYear())}
                      />
                      {errors[`year_${i}`] && (
                        <p className="text-xs text-red-500">{errors[`year_${i}`]}</p>
                      )}
                    </div>
                  </div>
                  <EditField
                    label="Institution"
                    value={q.institution}
                    onChange={(v) => updateQual(i, 'institution', v)}
                    error={errors[`institution_${i}`]}
                    placeholder="e.g. University of Delhi"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addQual}
              className="inline-flex items-center gap-1.5 text-sm text-[#00A453] font-semibold hover:underline mt-2"
            >
              <Plus className="w-4 h-4" /> Add qualification
            </button>
          </>
        ) : (
          <div className="space-y-3">
            {(profileData?.qualifications || []).length > 0 ? (
              profileData.qualifications.map((q: any, i: number) => (
                <div key={i} className="border border-[#dadee2] rounded-[4px] px-4 py-3">
                  <p className="text-sm font-semibold text-[#2d2d2d]">{q.degree}</p>
                  <p className="text-xs text-[#647380]">
                    {q.institution} · {q.year}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#b0b8c1]">No qualifications added.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const AVAILABILITY_SLOTS = [
  'Mon Morning',
  'Mon Afternoon',
  'Mon Evening',
  'Tue Morning',
  'Tue Afternoon',
  'Tue Evening',
  'Wed Morning',
  'Wed Afternoon',
  'Wed Evening',
  'Thu Morning',
  'Thu Afternoon',
  'Thu Evening',
  'Fri Morning',
  'Fri Afternoon',
  'Fri Evening',
  'Sat Morning',
  'Sat Afternoon',
  'Sat Evening',
  'Sun Morning',
  'Sun Afternoon',
  'Sun Evening',
];

function TutorAvailabilitySection({ profileData, accessToken, illustration, onSaved }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const savedSlots: string[] = profileData?.availability || [];

  const startEdit = () => {
    setSelected([...savedSlots]);
    setServerError('');
    setSaveStatus('idle');
    setIsEditing(true);
  };
  const cancel = () => {
    setIsEditing(false);
    setServerError('');
    setSaveStatus('idle');
  };
  const isDirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...savedSlots].sort());

  const toggleSlot = (slot: string) =>
    setSelected((s) => (s.includes(slot) ? s.filter((x) => x !== slot) : [...s, slot]));

  const save = async () => {
    setSaveStatus('saving');
    setServerError('');
    try {
      const res = await profileApi.updateTutorProfile({ availability: selected }, accessToken);
      if (res.success) {
        onSaved(res.data);
        setIsEditing(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setServerError(err.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['Morning', 'Afternoon', 'Evening'];

  return (
    <>
      <SectionHeader
        title="Availability"
        description={SECTION_DESC['Availability']}
        isEditing={isEditing}
        saveStatus={saveStatus}
        canSave={isDirty}
        onEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        illustration={illustration}
      />
      <div className="px-8 py-7">
        {serverError && <ServerErrorBanner message={serverError} />}
        {isEditing ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm mt-2">
              <thead>
                <tr>
                  <th className="text-left font-medium text-[#647380] pb-3 w-24"></th>
                  {days.map((d) => (
                    <th key={d} className="text-center font-medium text-[#647380] pb-3 px-2">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time) => (
                  <tr key={time}>
                    <td className="text-[#647380] font-medium py-2 pr-4">{time}</td>
                    {days.map((day) => {
                      const slot = `${day} ${time}`;
                      const active = selected.includes(slot);
                      return (
                        <td key={day} className="text-center py-2 px-2">
                          <button
                            onClick={() => toggleSlot(slot)}
                            className={`w-8 h-8 rounded-[4px] border transition-colors ${active ? 'bg-[#00A453] border-[#00A453]' : 'border-[#dadee2] hover:border-[#00A453]'}`}
                          >
                            {active && <Check className="w-4 h-4 text-white mx-auto" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[#b0b8c1] mt-3">
              {selected.length} slot{selected.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {savedSlots.length > 0 ? (
              savedSlots.map((slot) => <TagChip key={slot} value={slot} />)
            ) : (
              <p className="text-sm text-[#b0b8c1]">No availability set.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Read-only sections ───────────────────────────────────────────────────────
function VerificationSection({ profileData }: any) {
  const items = [
    {
      label: 'Phone Verification',
      sub: 'Linked to your mobile account',
      status: 'Verified',
      ok: true as boolean | null,
    },
    {
      label: 'Educational Qualifications',
      sub: 'Admins are auditing degree transcripts',
      status: 'Auditing',
      ok: false as boolean | null,
    },
    {
      label: 'Teaching Experience',
      sub: 'Verify previous work history',
      status: 'Pending',
      ok: null as boolean | null,
    },
  ];
  return (
    <>
      <div className="relative px-8 pt-10 pb-5 flex items-start justify-between border-b border-[#dadee2]">
        <div>
          <h2 className="text-3xl font-normal text-[#2d2d2d]">Verification Status</h2>
          <p className="text-base text-[#647380] mt-2">{SECTION_DESC['Verification']}</p>
        </div>
        <div className="shrink-0 ml-4 hidden sm:block">
          <IllustrationDefault />
        </div>
      </div>
      <div className="px-8 py-7 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border border-[#dadee2] rounded-[4px] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {item.ok === true && <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />}
              {item.ok === false && (
                <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
              )}
              {item.ok === null && (
                <div className="w-4 h-4 rounded-full border-2 border-[#dadee2] shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-[#2d2d2d]">{item.label}</p>
                <p className="text-xs text-[#647380]">{item.sub}</p>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.ok === true ? 'bg-[#e6f6ee] text-[#00A453]' : item.ok === false ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-[#647380]'}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function ReviewsSection({ profileData }: any) {
  return (
    <>
      <div className="relative px-8 pt-10 pb-5 border-b border-[#dadee2]">
        <h2 className="text-3xl font-normal text-[#2d2d2d]">Student Reviews</h2>
        <p className="text-base text-[#647380] mt-2">{SECTION_DESC['Reviews']}</p>
      </div>
      <div className="px-8 py-7 space-y-5">
        <div className="flex items-center gap-6 border border-[#dadee2] rounded-[4px] p-5">
          <div className="text-center pr-6 border-r border-[#dadee2]">
            <span className="text-3xl font-bold text-[#2d2d2d]">
              {profileData?.ratingAvg?.toFixed(1) || '0.0'}
            </span>
            <p className="text-xs text-[#647380] mt-1">Average rating</p>
          </div>
          <div>
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 5 }).map((_: unknown, i: number) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(profileData?.ratingAvg || 0) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                />
              ))}
            </div>
            <p className="text-xs text-[#647380]">
              Based on {profileData?.ratingCount || 0} student reviews
            </p>
          </div>
        </div>
        <p className="text-sm text-[#647380]">
          No reviews yet. Reviews from students will appear here.
        </p>
      </div>
    </>
  );
}

function AccountSettings() {
  const items = [
    {
      id: 'notif',
      label: 'Email Notifications',
      desc: 'Receive alerts for class requests and messages',
    },
    {
      id: 'privacy',
      label: 'Search Visibility',
      desc: 'Allow other users to find your profile in search results',
    },
  ];
  return (
    <>
      <div className="px-8 pt-10 pb-5 border-b border-[#dadee2]">
        <h2 className="text-3xl font-normal text-[#2d2d2d]">Account Settings</h2>
        <p className="text-base text-[#647380] mt-2">{SECTION_DESC['Account Settings']}</p>
      </div>
      <div className="px-8 py-7 space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 pb-5 border-b border-[#dadee2] last:border-0"
          >
            <input
              type="checkbox"
              id={item.id}
              defaultChecked
              className="mt-0.5 h-4 w-4 rounded border-[#dadee2] accent-[#00A453]"
            />
            <div>
              <label
                htmlFor={item.id}
                className="text-sm font-semibold text-[#2d2d2d] block cursor-pointer"
              >
                {item.label}
              </label>
              <p className="text-xs text-[#647380] mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Security({ user }: any) {
  return (
    <>
      <div className="px-8 pt-10 pb-5 border-b border-[#dadee2]">
        <h2 className="text-3xl font-normal text-[#2d2d2d]">Security</h2>
        <p className="text-base text-[#647380] mt-2">{SECTION_DESC['Security']}</p>
      </div>
      <div className="px-8 py-7 space-y-3">
        <div className="border border-[#dadee2] rounded-[4px] px-4 py-3">
          <p className="text-sm font-semibold text-[#2d2d2d]">Active phone number</p>
          <p className="text-xs text-[#647380] mt-0.5">{user?.phone}</p>
        </div>
        <div className="border border-[#dadee2] rounded-[4px] px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-[#2d2d2d]">Active sessions</p>
            <p className="text-xs text-[#647380] mt-0.5">Logged in on 1 device</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e6f6ee] text-[#00A453]">
            Current
          </span>
        </div>
      </div>
    </>
  );
}

function DangerZone() {
  return (
    <>
      <div className="px-8 pt-10 pb-5 border-b border-[#dadee2]">
        <h2 className="text-3xl font-normal text-[#2d2d2d] text-red-600">Danger Zone</h2>
      </div>
      <div className="px-8 py-7">
        <div className="border border-red-200 rounded-[8px] p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-red-600">Delete account</h4>
            <p className="text-xs text-[#647380] mt-1 leading-relaxed">
              This will permanently delete all your data. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-2 border-t border-red-100">
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-[4px] transition-colors">
              Delete account
            </button>
            <button className="px-4 py-2 border border-[#dadee2] text-[#2d2d2d] text-xs font-semibold rounded-[4px] hover:bg-gray-50 transition-colors">
              Deactivate instead
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
