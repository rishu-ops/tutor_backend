'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Star,
  GraduationCap,
  MapPin,
  Briefcase,
  Languages,
  Clock,
  ShieldCheck,
  Check,
  Ban,
} from 'lucide-react';
import { Button } from '../ui/button';
import { profileApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface TutorPreviewDrawerProps {
  tutorUserId: string;
  isOpen: boolean;
  onClose: () => void;
  status?: string;
  onAccept?: () => void;
  onReject?: () => void;
  actionLoading?: boolean;
}

export default function TutorPreviewDrawer({
  tutorUserId,
  isOpen,
  onClose,
  status,
  onAccept,
  onReject,
  actionLoading = false,
}: TutorPreviewDrawerProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPublicProfile() {
      if (!tutorUserId || !token) return;
      setLoading(true);
      setError('');
      try {
        const res = await profileApi.getPublicTutorProfile(tutorUserId, token);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.error || res.message || 'Failed to fetch public profile.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while loading profile.');
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
      loadPublicProfile();
    }
  }, [tutorUserId, token, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#00060c]/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click-outside backdrop closer */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#647380] font-extrabold uppercase tracking-wider block">
              Tutor Profile Profile Deck
            </span>
            <h2 className="text-base font-extrabold text-[#2d2d2d] flex items-center gap-1 mt-0.5">
              {profile?.name || 'Loading Profile...'}
              <ShieldCheck className="w-4 h-4 text-[#00A453] fill-[#e6f6ee]" />
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#2d2d2d]">
          {loading ? (
            <div className="space-y-4 py-12 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3.5 bg-gray-100 rounded w-full" />
              <div className="h-3.5 bg-gray-100 rounded w-5/6" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold">
              ⚠️ {error}
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Rating and Rates Summary */}
              <div className="grid grid-cols-3 gap-4 border border-gray-100 p-4 rounded-xl bg-gray-50/50 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#647380] font-bold uppercase tracking-wider block">
                    Rating
                  </span>
                  <span className="text-sm font-extrabold text-[#2d2d2d] flex items-center justify-center gap-0.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {profile.ratingAvg || '5.0'}
                  </span>
                </div>
                <div className="space-y-1 border-x border-gray-100">
                  <span className="text-[9px] text-[#647380] font-bold uppercase tracking-wider block">
                    Rates
                  </span>
                  <span className="text-xs font-extrabold text-[#2d2d2d] block mt-1">
                    ₹{profile.pricing?.min} - ₹{profile.pricing?.max} / Hr
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#647380] font-bold uppercase tracking-wider block">
                    Completed
                  </span>
                  <span className="text-[10px] bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/25 px-2 py-0.5 rounded font-extrabold inline-block mt-0.5">
                    Verified
                  </span>
                </div>
              </div>

              {/* Bio summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-[#647380] uppercase tracking-wider">
                  Biography
                </h3>
                <p className="text-xs text-[#384148] leading-relaxed whitespace-pre-line border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  {profile.bio || 'This tutor has not completed their biography pitch yet.'}
                </p>
              </div>

              {/* Taught Subjects */}
              {profile.subjects && profile.subjects.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#647380] uppercase tracking-wider">
                    Expertise Subjects
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.subjects.map((sub: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-1 bg-gray-100 text-[#2d2d2d] border border-gray-200 rounded"
                      >
                        {sub.subject} ({sub.level})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {profile.qualifications && profile.qualifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#647380] uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-4.5 h-4.5 text-gray-400" /> Qualifications
                  </h3>
                  <div className="space-y-2">
                    {profile.qualifications.map((q: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center text-xs font-semibold"
                      >
                        <div>
                          <span className="text-[#2d2d2d] block">{q.degree}</span>
                          <span className="text-[#647380] text-[10px] block mt-0.5">
                            {q.institution}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#647380] bg-white border border-gray-200 px-2 py-0.5 rounded">
                          {q.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teaching details */}
              <div className="border-t border-gray-100 pt-5 space-y-4 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-[#647380]">Teaching Modes</span>
                  <span className="text-[#2d2d2d] font-bold">
                    {profile.teachingModes?.join(' · ') || 'None selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#647380]">Languages spoken</span>
                  <span className="text-[#2d2d2d] font-bold">
                    {profile.languages?.join(', ') || 'None selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#647380]">Preferred schedule</span>
                  <span className="text-[#2d2d2d] font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {profile.availability?.join(' · ') || 'Not Configured'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Sticky Actions Footer */}
        {profile &&
          status &&
          (status === 'SENT' || status === 'VIEWED' || status === 'SHORTLISTED') &&
          (onAccept || onReject) && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                disabled={actionLoading}
                onClick={onReject}
                variant="secondary"
                className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs font-bold py-2.5 px-4 bg-white rounded-lg flex items-center gap-1.5 shadow-none"
              >
                <Ban className="w-3.5 h-3.5" /> Reject Proposal
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={onAccept}
                className="bg-[#00A453] hover:bg-[#009048] text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Accept Tutor
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
