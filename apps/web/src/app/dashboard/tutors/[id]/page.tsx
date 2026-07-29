'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { profileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  MapPin,
  MessageSquareText,
  Calendar,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export default function TutorProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  const [tutor, setTutor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tutorId = params.id as string;

  const fetchTutorProfile = useCallback(async () => {
    if (!token || !tutorId) return;
    setLoading(true);
    setError('');
    try {
      const res = await profileApi.getPublicTutorProfile(tutorId, token);
      if (res.success && res.data) {
        setTutor(res.data);
      } else {
        setError(res.error || res.message || 'Tutor profile not found');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load tutor profile');
    } finally {
      setLoading(false);
    }
  }, [token, tutorId]);

  useEffect(() => {
    fetchTutorProfile();
  }, [fetchTutorProfile]);

  return (
    <div className="max-w-[1000px] mx-auto py-6 px-4 sm:px-0 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tutors
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#dadee2] rounded-2xl">
          <div className="w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#647380] font-semibold">Loading profile…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-600">{error}</p>
          <Button size="sm" onClick={() => router.push('/dashboard/tutors')} className="rounded-xl">
            Browse All Tutors
          </Button>
        </div>
      ) : tutor ? (
        <div className="space-y-6">
          {/* Simple Profile Header Card */}
          <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#e6f6ee] border border-[#00A453]/20 overflow-hidden flex items-center justify-center font-black text-xl text-[#00A453] shrink-0">
                {tutor.avatarUrl ? (
                  <img src={tutor.avatarUrl} alt={tutor.name} className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {(tutor.name || 'T')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-[#2d2d2d]">
                    {tutor.name}
                  </h1>
                  {tutor.verified !== false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#647380] font-medium flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 text-[#2d2d2d] font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {tutor.ratingAvg?.toFixed(1) || '5.0'}
                  </span>
                  <span>·</span>
                  <span>{tutor.experience || '5+'} Yrs Experience</span>
                  {tutor.location?.city && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {tutor.location.city}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {(tutor.teachingModes || ['Online', 'Home Tuition']).map((mode: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 text-[#647380] rounded-full"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-150">
              <Link href={`/dashboard/messages?userId=${tutor.userId || tutor._id}`} className="w-full sm:w-auto">
                <Button className="w-full bg-[#00060c] hover:bg-slate-800 text-white font-bold text-xs h-9 px-5 rounded-xl gap-1.5">
                  <MessageSquareText className="w-3.5 h-3.5" /> Message
                </Button>
              </Link>
              <Link href={`/dashboard/messages?userId=${tutor.userId || tutor._id}&book=true`} className="w-full sm:w-auto">
                <Button className="w-full bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs h-9 px-5 rounded-xl gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Book Session
                </Button>
              </Link>
            </div>
          </div>

          {/* Simple Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 columns */}
            <div className="md:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  About
                </h3>
                <p className="text-sm text-[#2d2d2d] leading-relaxed font-medium whitespace-pre-line">
                  {tutor.bio ||
                    `${tutor.name} is an experienced tutor dedicated to providing concept clarity and interactive learning for students.`}
                </p>
              </div>

              {/* Subjects */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Subjects Taught
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(tutor.subjects || ['Mathematics', 'Physics', 'Chemistry']).map(
                    (subj: any, idx: number) => {
                      const subjectName = typeof subj === 'string' ? subj : subj.subject || 'Subject';
                      return (
                        <span
                          key={idx}
                          className="text-xs font-bold px-3 py-1.5 bg-gray-50 border border-gray-150 text-[#2d2d2d] rounded-xl"
                        >
                          {subjectName}
                        </span>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Qualifications */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Qualifications
                </h3>
                <ul className="space-y-2 text-xs text-[#2d2d2d] font-bold">
                  {(tutor.qualifications?.length
                    ? tutor.qualifications
                    : ['B.Tech / M.Sc Degree', 'Certified Educator']
                  ).map((qual: any, idx: number) => {
                    const text = typeof qual === 'string' ? qual : qual.degree || qual.name;
                    return (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-[#00A453] font-black">✓</span> {text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Fee & Demo */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Fee & Trial
                </h3>
                <div className="space-y-1">
                  <div className="text-xl font-black text-[#2d2d2d]">
                    ₹{tutor.hourlyRate || tutor.pricing?.min || 500}
                    <span className="text-xs font-medium text-[#647380]"> / hour</span>
                  </div>
                  {tutor.freeDemo && (
                    <span className="inline-block text-[11px] font-bold text-[#00A453] bg-[#e6f6ee] px-2.5 py-0.5 rounded-full mt-1">
                      Free Demo Session
                    </span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Location
                </h3>
                <div className="text-xs space-y-1 font-medium text-[#2d2d2d]">
                  <p className="font-bold">
                    {tutor.location?.area ? `${tutor.location.area}, ` : ''}
                    {tutor.location?.city || 'Noida'}
                  </p>
                  {tutor.location?.address && (
                    <p className="text-[#647380]">{tutor.location.address}</p>
                  )}
                </div>

                {tutor.location?.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${tutor.location.coordinates.lat},${tutor.location.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block pt-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full text-xs font-bold gap-1 rounded-xl">
                      Get Directions <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
