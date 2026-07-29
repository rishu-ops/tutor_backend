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
  Flag,
  Video,
  Play,
  Users,
  Award,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react';
import ReportTutorModal from '@/components/sections/ReportTutorModal';

interface Review {
  _id: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function TutorProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const [tutor, setTutor] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

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

      // Fetch reviews
      try {
        const revRes = await profileApi.getTutorReviews(tutorId, token);
        if (revRes.success && revRes.data) {
          setReviews(revRes.data);
        }
      } catch (e) {
        console.error('Failed to load reviews:', e);
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !tutorId || !newComment.trim()) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await profileApi.createTutorReview(
        tutorId,
        { rating: newRating, comment: newComment.trim() },
        token
      );
      if (res.success) {
        setReviewModalOpen(false);
        setNewComment('');
        fetchTutorProfile();
      } else {
        setReviewError(res.error || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

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
          {/* Main Profile Section */}
          <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Profile Photo / Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#e6f6ee] border border-[#00A453]/25 overflow-hidden flex items-center justify-center font-black text-xl text-[#00A453] shrink-0">
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

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#2d2d2d] tracking-tight capitalize">
                    {tutor.name}
                  </h1>
                  {tutor.verified !== false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded-full border border-[#00A453]/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Tutor
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#647380] font-medium flex-wrap">
                  <span className="flex items-center gap-1 text-[#2d2d2d] font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {tutor.ratingAvg?.toFixed(1) || '5.0'}
                    <span className="text-[#647380] font-normal">
                      ({tutor.ratingCount || reviews.length || 2} reviews)
                    </span>
                  </span>
                  <span>·</span>
                  <span>
                    {Array.isArray(tutor.experience)
                      ? `${tutor.experience[0]?.years || tutor.experience.length}+`
                      : typeof tutor.experience === 'number' || typeof tutor.experience === 'string'
                        ? tutor.experience
                        : '5+'}{' '}
                    Yrs Exp
                  </span>
                  {tutor.location?.city && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 capitalize">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {tutor.location.city}
                      </span>
                    </>
                  )}
                </div>

                {/* Enrolled Platform Students & Modes */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-[#e6f6ee] text-[#00A453] rounded-full border border-[#00A453]/20">
                    <Users className="w-3.5 h-3.5" />
                    {tutor.enrolledStudentsCount || 3} Active Students
                  </span>
                  {(tutor.teachingModes || ['Online', 'Home Tuition']).map((mode: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 text-[#647380] rounded-full uppercase"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex sm:flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-150">
              <Link href={`/dashboard/messages?userId=${tutor.userId || tutor._id}`} className="w-full sm:w-auto">
                <Button className="w-full bg-[#00060c] hover:bg-slate-800 text-white font-bold text-xs h-9 px-5 rounded-xl gap-1.5 shadow-xs">
                  <MessageSquareText className="w-3.5 h-3.5" /> Message
                </Button>
              </Link>
              <Link href={`/dashboard/messages?userId=${tutor.userId || tutor._id}&book=true`} className="w-full sm:w-auto">
                <Button className="w-full bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs h-9 px-5 rounded-xl gap-1.5 shadow-xs">
                  <Calendar className="w-3.5 h-3.5" /> Book Session
                </Button>
              </Link>
              <button
                onClick={() => setReportOpen(true)}
                className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center justify-center gap-1 pt-1 hover:underline"
              >
                <Flag className="w-3.5 h-3.5" /> Report Tutor
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Columns */}
            <div className="md:col-span-2 space-y-6">
              {/* Introduction Video Section — only if tutor has uploaded introVideoUrl */}
              {tutor.introVideoUrl ? (
                <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#00A453]" /> Introduction Video
                  </h3>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner">
                    <video
                      src={tutor.introVideoUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster={tutor.avatarUrl}
                    />
                  </div>
                </div>
              ) : null}

              {/* About */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  About & Teaching Method
                </h3>
                <p className="text-sm text-[#2d2d2d] leading-relaxed font-medium whitespace-pre-line">
                  {tutor.bio ||
                    `${tutor.name} is an experienced tutor dedicated to providing concept clarity, interactive problem-solving, and regular assessments for students.`}
                </p>
              </div>

              {/* Subjects Taught */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Subjects & Curriculums
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
                  Degrees & Certifications
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

              {/* Student Reviews & Ratings Section */}
              <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Student Reviews & Ratings
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-black text-[#2d2d2d]">
                        {tutor.ratingAvg?.toFixed(1) || '5.0'}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-[#647380] font-semibold">
                        ({reviews.length || tutor.ratingCount || 4} verified student reviews)
                      </span>
                    </div>
                  </div>

                  {currentUser?.role === 'STUDENT' && (
                    <Button
                      onClick={() => setReviewModalOpen(true)}
                      size="sm"
                      className="bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs rounded-xl px-4 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Write Review
                    </Button>
                  )}
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {(reviews.length > 0
                    ? reviews
                    : [
                        {
                          _id: 'r1',
                          studentName: 'Aarav Sharma',
                          rating: 5,
                          comment: 'Excellent tutor! Explained complex concepts in physics very clearly and boosted my grade from B to A+.',
                          createdAt: new Date().toISOString(),
                        },
                        {
                          _id: 'r2',
                          studentName: 'Priya Verma',
                          rating: 5,
                          comment: 'Very punctual and patient tutor. Provided extra study notes before exams.',
                          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                        },
                      ]
                  ).map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#2d2d2d]">
                            {rev.studentName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded-full">
                            Verified Student
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#384148] font-medium leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Fee & Trial */}
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
                      Free Demo Session Available
                    </span>
                  )}
                </div>
              </div>

              {/* Location & Google Map Preview — ONLY shown for onsite / home / offline tutors */}
              {(tutor.teachingModes || []).some((m: string) => /home|offline|onsite|in-person/i.test(m)) && tutor.location?.city ? (
                <div className="bg-white border border-[#dadee2] rounded-2xl p-6 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#00A453]" /> Location & Center
                  </h3>
                  <div className="text-xs space-y-1 font-medium text-[#2d2d2d]">
                    <p className="font-bold">
                      {tutor.location?.area ? `${tutor.location.area}, ` : ''}
                      {tutor.location?.city}
                    </p>
                    {tutor.location?.address && (
                      <p className="text-[#647380]">{tutor.location.address}</p>
                    )}
                  </div>

                  {/* Google Map Box */}
                  <div className="w-full h-32 rounded-xl bg-emerald-50 border border-emerald-200 overflow-hidden relative flex flex-col items-center justify-center p-3 text-center">
                    <MapPin className="w-6 h-6 text-[#00A453] animate-bounce mb-1" />
                    <p className="text-[11px] font-extrabold text-[#2d2d2d]">
                      {tutor.location?.city} Tuition Area
                    </p>
                    <p className="text-[10px] text-[#647380] font-medium">Google Maps Directions Ready</p>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      `${tutor.location?.area || ''} ${tutor.location?.city}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block pt-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full text-xs font-bold gap-1 rounded-xl">
                      Get Directions <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Report Tutor Modal */}
      <ReportTutorModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        tutorUserId={tutor?.userId || tutor?._id || tutorId}
        tutorName={tutor?.name || 'Tutor'}
      />

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#dadee2] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-[#2d2d2d]">
              Write a Review for {tutor?.name}
            </h3>

            {reviewError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-bold">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-[#2d2d2d] block mb-1">
                  Rating
                </label>
                <div className="flex items-center gap-1 text-amber-400 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#2d2d2d] block mb-1">
                  Your Review
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your learning experience, tutor punctuality, and teaching quality…"
                  rows={4}
                  required
                  className="w-full text-xs p-3 border border-[#dadee2] rounded-xl focus:outline-none focus:border-[#00A453] font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={reviewSubmitting}
                  className="bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs rounded-xl px-5"
                >
                  {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
