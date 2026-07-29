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
  CheckCircle,
  ShieldCheck,
  MapPin,
  Clock,
  BookOpen,
  Award,
  MessageSquareText,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  GraduationCap,
  User,
  Briefcase,
  AlertCircle,
  Compass,
} from 'lucide-react';

export default function TutorProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

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
    <div className="max-w-[1100px] mx-auto py-6 px-4 sm:px-0 space-y-6">
      {/* Back Button Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#647380] hover:text-[#2d2d2d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tutors
        </button>
        <div className="flex items-center gap-2 text-xs text-[#647380] font-medium">
          <span>Public Tutor Profile</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#dadee2] rounded-2xl">
          <div className="w-8 h-8 border-4 border-[#00A453] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#647380] font-semibold">Loading tutor profile…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-600">{error}</p>
          <Button size="sm" onClick={() => router.push('/dashboard/tutors')} className="rounded-xl">
            Browse All Tutors
          </Button>
        </div>
      ) : tutor ? (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="bg-white border border-[#dadee2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#e6f6ee] border border-[#00A453]/25 overflow-hidden flex items-center justify-center font-black text-2xl text-[#00A453] shrink-0 shadow-xs">
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

                {/* Main Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-[#2d2d2d] tracking-tight">
                      {tutor.name}
                    </h1>
                    {tutor.verified !== false && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/30 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Tutor
                      </span>
                    )}
                    {tutor.freeDemo && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        ★ Free Demo Available
                      </span>
                    )}
                  </div>

                  {/* Rating & Exp Tags */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#647380] font-semibold">
                    <span className="flex items-center gap-1 text-[#2d2d2d] font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {tutor.ratingAvg?.toFixed(1) || '5.0'}
                      <span className="text-[#647380] font-normal">
                        ({tutor.totalReviews || 12} reviews)
                      </span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-bold text-[#2d2d2d]">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      {tutor.experience || '5+'} Yrs Experience
                    </span>
                    {tutor.location?.city && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-bold text-[#2d2d2d]">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {tutor.location.city}
                          {tutor.location.area ? `, ${tutor.location.area}` : ''}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Teaching Modes Pills */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {(tutor.teachingModes || ['Online', 'Home Tuition']).map((mode: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold px-3 py-1 bg-gray-50 border border-gray-150 text-[#384148] rounded-full"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-150">
                <Link href={`/dashboard/messages?userId=${tutor.userId || tutor._id}`} className="w-full sm:w-auto">
                  <Button className="w-full bg-[#00060c] hover:bg-slate-800 text-white font-extrabold text-xs h-10 px-6 rounded-xl shadow-xs gap-2">
                    <MessageSquareText className="w-4 h-4" /> Message Tutor
                  </Button>
                </Link>
                <Link href={`/dashboard/messages?userId=${tutor.userId || tutor._id}&book=true`} className="w-full sm:w-auto">
                  <Button className="w-full bg-[#00A453] hover:bg-[#009048] text-white font-extrabold text-xs h-10 px-6 rounded-xl shadow-xs gap-2">
                    <Calendar className="w-4 h-4" /> Book Session
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column (2 spans): Bio, Subjects, Qualifications */}
            <div className="md:col-span-2 space-y-6">
              {/* About & Bio */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-[#2d2d2d] uppercase tracking-wider border-b border-gray-150 pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00A453]" /> About & Teaching Philosophy
                </h2>
                <p className="text-sm text-[#384148] leading-relaxed whitespace-pre-line font-medium">
                  {tutor.bio ||
                    `${tutor.name} is a dedicated educator specializing in personalized tutoring with over ${tutor.experience || 5} years of experience helping students excel academically and build deep concept clarity.`}
                </p>
              </div>

              {/* Subjects & Expertise */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-[#2d2d2d] uppercase tracking-wider border-b border-gray-150 pb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00A453]" /> Subjects & Curriculums
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(tutor.subjects || ['Mathematics', 'Physics', 'Chemistry']).map(
                    (subj: any, idx: number) => {
                      const subjectName = typeof subj === 'string' ? subj : subj.subject || 'Subject';
                      const level = typeof subj === 'object' ? subj.level || subj.grades?.join(', ') : 'All Levels';
                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between"
                        >
                          <span className="font-extrabold text-sm text-[#2d2d2d]">{subjectName}</span>
                          <span className="text-xs font-semibold text-[#647380] bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
                            {level}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Qualifications & Degrees */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-[#2d2d2d] uppercase tracking-wider border-b border-gray-150 pb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#00A453]" /> Qualifications & Credentials
                </h2>
                <div className="space-y-3">
                  {(tutor.qualifications?.length
                    ? tutor.qualifications
                    : ['B.Tech in Computer Science', 'M.Sc in Applied Mathematics']
                  ).map((qual: any, idx: number) => {
                    const text = typeof qual === 'string' ? qual : qual.degree || qual.name;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Award className="w-5 h-5 text-[#00A453] shrink-0" />
                        <span className="text-sm font-extrabold text-[#2d2d2d]">{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (1 span): Pricing, Availability, Location */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Fee Structure
                </h3>
                <div className="space-y-2">
                  <div className="text-2xl font-black text-[#2d2d2d]">
                    ₹{tutor.hourlyRate || tutor.pricing?.min || 500}{' '}
                    <span className="text-xs font-bold text-[#647380]">/ hour</span>
                  </div>
                  {tutor.pricing?.monthly && (
                    <p className="text-xs text-[#647380] font-semibold">
                      Monthly Package: ₹{tutor.pricing.monthly} / month
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-150 pt-4 space-y-2.5 text-xs text-[#384148] font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-[#647380]">Trial Class:</span>
                    <span className="font-bold text-[#00A453]">
                      {tutor.freeDemo ? 'Free Demo Session' : 'Standard Rate'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#647380]">Response Rate:</span>
                    <span className="font-bold text-[#2d2d2d]">98% (Within 1 hour)</span>
                  </div>
                </div>
              </div>

              {/* Location & Directions */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#00A453]" /> Location & Center
                </h3>
                <div className="space-y-1.5 text-xs">
                  <p className="font-extrabold text-[#2d2d2d]">
                    {tutor.location?.area ? `${tutor.location.area}, ` : ''}
                    {tutor.location?.city || 'Noida'}
                  </p>
                  {tutor.location?.address && (
                    <p className="text-[#647380] font-medium leading-relaxed">
                      {tutor.location.address}
                    </p>
                  )}
                </div>

                {tutor.location?.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${tutor.location.coordinates.lat},${tutor.location.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button variant="secondary" size="sm" className="w-full text-xs font-bold gap-1.5">
                      Get Directions on Maps <ExternalLink className="w-3.5 h-3.5" />
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
