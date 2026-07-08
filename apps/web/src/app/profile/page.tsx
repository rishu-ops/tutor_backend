'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, AlertCircle, CheckCircle2, Clock, Star } from 'lucide-react';
import DashboardLayout from '../dashboard/layout';
import { useAuthStore } from '@/stores/auth-store';
import { profileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

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

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, value, note }: { label: string; value?: string; note?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[#2d2d2d] font-medium">{label}</label>
      <input
        type="text"
        value={value || ''}
        readOnly
        className="w-full border border-[#dadee2] rounded-[4px] px-4 py-3 text-base text-[#2d2d2d] bg-white focus:outline-none cursor-default"
      />
      {note && <p className="text-sm text-[#647380]">{note}</p>}
    </div>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 border border-[#2d2d2d] text-[#2d2d2d] text-sm font-semibold rounded-[4px] hover:bg-gray-50 transition-colors">
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [activeTab, setActiveTab] = useState('Personal Information');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!accessToken || !user?.role) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res =
          user.role === 'STUDENT'
            ? await profileApi.getStudentProfile(accessToken)
            : await profileApi.getTutorProfile(accessToken);
        if (res.success && res.data) setProfileData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1100px] mx-auto px-4 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-9 h-9 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#647380]">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-[8px] p-6 text-center max-w-md mx-auto mt-12">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-600 mb-3">{error}</p>
              <Button size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex gap-10 items-start">
              {/* ═══ LEFT SIDEBAR ═══ */}
              <aside className="w-[280px] shrink-0 space-y-6">
                {/* Mini profile card */}
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
                  <button className="absolute top-4 right-4 text-[#647380] hover:text-[#2d2d2d] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* Categorised nav */}
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
                {/* Header with illustration */}
                <div className="relative px-8 pt-10 pb-5 flex items-start justify-between border-b border-[#dadee2]">
                  <div>
                    <h2 className="text-3xl font-normal text-[#2d2d2d]">{activeTab}</h2>
                    {SECTION_DESC[activeTab] && (
                      <p className="text-base text-[#647380] mt-2">{SECTION_DESC[activeTab]}</p>
                    )}
                  </div>
                  <div className="shrink-0 ml-4 hidden sm:block">{illustration}</div>
                </div>

                {/* Content */}
                <div className="px-8 py-7 space-y-8">
                  {/* Personal Information */}
                  {activeTab === 'Personal Information' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center text-xl font-bold text-[#00A453]">
                            {getInitials()}
                          </div>
                          <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white border border-[#dadee2] shadow-sm flex items-center justify-center hover:bg-gray-50">
                            <Pencil className="w-3 h-3 text-[#647380]" />
                          </button>
                        </div>
                      </div>
                      <Field label="First name" value={displayName.split(' ')[0]} />
                      <Field label="Last name" value={displayName.split(' ').slice(1).join(' ')} />
                      <Field
                        label="Phone number"
                        value={user.phone || ''}
                        note="Your phone number is verified and cannot be changed."
                      />
                      <Field label="Email address" value={profileData?.email || ''} />
                      <Field label="City" value={city} />
                    </div>
                  )}

                  {/* Academic Information */}
                  {activeTab === 'Academic Information' && isStudent && (
                    <div className="space-y-5">
                      <Field label="Class / Grade" value={profileData?.class || ''} />
                      <Field label="School / College" value={profileData?.school || ''} />
                      <Field
                        label="Preferred Language"
                        value={profileData?.preferredLanguage || ''}
                      />
                    </div>
                  )}

                  {/* Learning Preferences */}
                  {activeTab === 'Learning Preferences' && isStudent && (
                    <div className="space-y-7">
                      <div>
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                          Preferred teaching mode
                        </p>
                        <AddButton
                          label={
                            profileData?.learningMode
                              ? `Mode: ${profileData.learningMode}`
                              : 'Add teaching mode'
                          }
                        />
                      </div>
                      <div className="border-t border-[#dadee2] pt-6">
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                          Preferred schedule
                        </p>
                        <AddButton label="Add preferred schedule" />
                      </div>
                    </div>
                  )}

                  {/* Professional Information */}
                  {activeTab === 'Professional Information' && !isStudent && (
                    <div className="space-y-7">
                      <Field
                        label="Visibility tier"
                        value={profileData?.visibilityTier || 'FREE TIER'}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                          Subjects and experience
                        </p>
                        {profileData?.subjects?.length > 0 ? (
                          <div className="space-y-3">
                            {profileData.subjects.map((sub: any, i: number) => (
                              <div
                                key={i}
                                className="border border-[#dadee2] rounded-[4px] px-4 py-3"
                              >
                                <p className="text-sm font-semibold text-[#2d2d2d]">
                                  {sub.subject}
                                </p>
                                <p className="text-xs text-[#647380]">
                                  Level: {sub.level} · {sub.experienceYears} yr exp
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <AddButton label="Add subject" />
                        )}
                      </div>
                      <div className="border-t border-[#dadee2] pt-6">
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                          Teaching formats
                        </p>
                        {profileData?.teachingModes?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profileData.teachingModes.map((m: string) => (
                              <span
                                key={m}
                                className="text-xs px-3 py-1.5 border border-[#2d2d2d] rounded-[4px] text-[#2d2d2d]"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <AddButton label="Add teaching format" />
                        )}
                      </div>
                      <div className="border-t border-[#dadee2] pt-6">
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">Languages</p>
                        {profileData?.languages?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profileData.languages.map((l: string) => (
                              <span
                                key={l}
                                className="text-xs px-3 py-1.5 border border-[#dadee2] rounded-[4px] text-[#2d2d2d]"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <AddButton label="Add language" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  {activeTab === 'Pricing' && !isStudent && (
                    <div className="space-y-7">
                      <div>
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                          Minimum hourly rate
                        </p>
                        <AddButton
                          label={
                            profileData?.pricing?.min
                              ? `Rs.${profileData.pricing.min}/hr`
                              : 'Add minimum rate'
                          }
                        />
                      </div>
                      <div className="border-t border-[#dadee2] pt-6">
                        <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                          Maximum hourly rate
                        </p>
                        <AddButton
                          label={
                            profileData?.pricing?.max
                              ? `Rs.${profileData.pricing.max}/hr`
                              : 'Add maximum rate'
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Qualifications */}
                  {activeTab === 'Qualifications' && !isStudent && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-[#2d2d2d]">Degrees and diplomas</p>
                      {profileData?.qualifications?.length > 0 ? (
                        <div className="space-y-3">
                          {profileData.qualifications.map((q: any, i: number) => (
                            <div
                              key={i}
                              className="border border-[#dadee2] rounded-[4px] px-4 py-3"
                            >
                              <p className="text-sm font-semibold text-[#2d2d2d]">{q.degree}</p>
                              <p className="text-xs text-[#647380]">
                                {q.institution} · {q.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <AddButton label="Add qualification" />
                      )}
                    </div>
                  )}

                  {/* Availability */}
                  {activeTab === 'Availability' && !isStudent && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-[#2d2d2d]">Available slots</p>
                      {profileData?.availability?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.availability.map((slot: string) => (
                            <span
                              key={slot}
                              className="text-xs px-3 py-1.5 border border-[#dadee2] rounded-[4px] text-[#2d2d2d]"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <AddButton label="Add availability slot" />
                      )}
                    </div>
                  )}

                  {/* Verification */}
                  {activeTab === 'Verification' && !isStudent && (
                    <div className="space-y-3">
                      {[
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
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between border border-[#dadee2] rounded-[4px] px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            {item.ok === true && (
                              <CheckCircle2 className="w-4 h-4 text-[#00A453] shrink-0" />
                            )}
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
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              item.ok === true
                                ? 'bg-[#e6f6ee] text-[#00A453]'
                                : item.ok === false
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-gray-100 text-[#647380]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reviews */}
                  {activeTab === 'Reviews' && !isStudent && (
                    <div className="space-y-5">
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
                  )}

                  {/* Account Settings */}
                  {activeTab === 'Account Settings' && (
                    <div className="space-y-6">
                      {[
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
                      ].map((item) => (
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
                  )}

                  {/* Security */}
                  {activeTab === 'Security' && (
                    <div className="space-y-3">
                      <div className="border border-[#dadee2] rounded-[4px] px-4 py-3">
                        <p className="text-sm font-semibold text-[#2d2d2d]">Active phone number</p>
                        <p className="text-xs text-[#647380] mt-0.5">{user.phone}</p>
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
                  )}

                  {/* Danger Zone */}
                  {activeTab === 'Danger Zone' && (
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
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
