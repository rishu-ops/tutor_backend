'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { applicationApi, profileApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface ApplyModalProps {
  requirementId: string;
  requirementSubject: string;
  requirementCategory: string;
  defaultBudgetMin: number;
  defaultBudgetMax: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({
  requirementId,
  requirementSubject,
  requirementCategory,
  defaultBudgetMin,
  defaultBudgetMax,
  isOpen,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const token = useAuthStore((s) => s.accessToken);

  const [introduction, setIntroduction] = useState('');
  const [proposedFee, setProposedFee] = useState(defaultBudgetMin.toString());
  const [selectedDay, setSelectedDay] = useState('Weekdays (Mon-Fri)');
  const [startTime, setStartTime] = useState('4:00 PM');
  const [endTime, setEndTime] = useState('7:00 PM');
  const [freeDemo, setFreeDemo] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch bio on mount to prefill introduction
  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        const res = await profileApi.getTutorProfile(token);
        if (res.success && res.data) {
          setIntroduction(res.data.bio || '');
        }
      } catch (e) {
        console.error('Failed to load profile for prefill:', e);
      }
    }
    if (isOpen) {
      loadProfile();
    }
  }, [token, isOpen]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!introduction.trim()) {
      setError('Introduction is required');
      return;
    }
    if (!proposedFee || Number(proposedFee) <= 0) {
      setError('Please propose a positive hourly fee');
      return;
    }
    const finalTimings = `${selectedDay}, ${startTime} - ${endTime}`;
    if (!finalTimings.trim()) {
      setError('Please state your available timings');
      return;
    }
    if (!message.trim()) {
      setError('Personalized message is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        introduction: introduction.trim(),
        proposedFee: Number(proposedFee),
        availableTimings: finalTimings,
        freeDemo,
        message: message.trim(),
      };

      const res = await applicationApi.applyToRequirement(requirementId, payload, token);
      if (res.success) {
        setDone(true);
        onSuccess();
      } else {
        setError(res.error || res.message || 'Failed to submit proposal.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while submitting proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    setDone(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00060c]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn border border-[#dadee2]">
        {/* Modal Header */}
        {!done && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#FAFAFA]">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                Submit Proposal
              </h2>
              <span className="text-xs text-gray-500 font-semibold block mt-0.5">
                Subject: {requirementSubject || requirementCategory} (Budget: ₹{defaultBudgetMin} -
                ₹{defaultBudgetMax}/hr)
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal Content */}
        {done ? (
          <div className="relative overflow-hidden p-8 text-center flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-[#F0FBF6] via-white to-white">
            {/* Background ambient lighting effects */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#00A453]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-[#00A453]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Icon Badge */}
            <div className="relative">
              <div className="w-20 h-20 bg-[#e6f6ee] border-2 border-[#00A453]/30 rounded-full flex items-center justify-center mx-auto shadow-inner relative z-10">
                <CheckCircle2 className="w-10 h-10 text-[#00A453]" />
              </div>
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse z-20" />
              <Award className="w-5 h-5 text-[#00A453] absolute -bottom-1 -left-1 z-20" />
            </div>

            {/* Main Header Text */}
            <div className="space-y-2 max-w-sm">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#00A453] bg-[#e6f6ee] border border-[#b2e2cb] px-3 py-1 rounded-full inline-block">
                Proposal Delivered 🎉
              </span>
              <h3 className="text-xl font-extrabold text-[#1b4332] tracking-tight">
                Congratulations!
              </h3>
              <p className="text-xs text-[#647380] leading-relaxed font-medium">
                Your tutoring application for{' '}
                <strong className="text-[#2d2d2d] font-extrabold">
                  {requirementSubject || requirementCategory}
                </strong>{' '}
                has been delivered directly to the student.
              </p>
            </div>

            {/* Proposal Summary Chips */}
            <div className="w-full bg-[#FAFAFA] border border-[#dadee2] rounded-2xl p-4 space-y-2 text-left">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Proposal Highlights
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-[#2d2d2d] flex items-center gap-1 shadow-2xs">
                  <span>Proposed Rate:</span>
                  <span className="text-[#00A453]">₹{proposedFee}/hr</span>
                </div>
                {freeDemo && (
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-emerald-700 flex items-center gap-1">
                    <span>Free Demo Class Offered</span>
                  </div>
                )}
                <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-medium text-gray-600 truncate max-w-full">
                  📅 {selectedDay}, {startTime} - {endTime}
                </div>
              </div>
            </div>

            {/* Next Steps Hint */}
            <p className="text-[11px] text-[#647380] italic">
              💡 You will receive a real-time notification as soon as the student accepts your
              proposal!
            </p>

            {/* Action CTAs */}
            <div className="pt-2 w-full flex items-center justify-center gap-3">
              <Button
                onClick={handleFinishSuccess}
                className="w-full bg-[#00A453] hover:bg-[#008A45] text-white font-extrabold text-xs h-11 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Awesome, Got It!
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-4 text-gray-700"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-650 rounded-lg p-3 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Profile Intro */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Introduction / Bio
              </label>
              <textarea
                rows={3}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Prefilled bio details from profile..."
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Proposed Hourly Fee */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Proposed Fee (₹/Hr)
              </label>
              <input
                type="number"
                value={proposedFee}
                onChange={(e) => setProposedFee(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all"
              />
            </div>

            {/* Timing selection selectors */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">Available Timings</label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Day Select */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Day Preference
                  </span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all cursor-pointer"
                  >
                    <option value="Weekdays (Mon-Fri)">Weekdays (Mon-Fri)</option>
                    <option value="Weekends (Sat-Sun)">Weekends (Sat-Sun)</option>
                    <option value="Everyday">Everyday</option>
                    <option value="Mondays">Mondays</option>
                    <option value="Tuesdays">Tuesdays</option>
                    <option value="Wednesdays">Wednesdays</option>
                    <option value="Thursdays">Thursdays</option>
                    <option value="Fridays">Fridays</option>
                    <option value="Saturdays">Saturdays</option>
                    <option value="Sundays">Sundays</option>
                  </select>
                </div>

                {/* Start Time Select */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Start Time
                  </span>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all cursor-pointer"
                  >
                    {[
                      '8:00 AM',
                      '9:00 AM',
                      '10:00 AM',
                      '11:00 AM',
                      '12:00 PM',
                      '1:00 PM',
                      '2:00 PM',
                      '3:00 PM',
                      '4:00 PM',
                      '5:00 PM',
                      '6:00 PM',
                      '7:00 PM',
                      '8:00 PM',
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Time Select */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    End Time
                  </span>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all cursor-pointer"
                  >
                    {[
                      '9:00 AM',
                      '10:00 AM',
                      '11:00 AM',
                      '12:00 PM',
                      '1:00 PM',
                      '2:00 PM',
                      '3:00 PM',
                      '4:00 PM',
                      '5:00 PM',
                      '6:00 PM',
                      '7:00 PM',
                      '8:00 PM',
                      '9:00 PM',
                      '10:00 PM',
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Demo Class Options */}
            <div className="flex items-center gap-2 py-1 select-none">
              <input
                id="freeDemo"
                type="checkbox"
                checked={freeDemo}
                onChange={(e) => setFreeDemo(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
              />
              <label
                htmlFor="freeDemo"
                className="text-xs font-semibold text-gray-700 cursor-pointer"
              >
                🙋 I am offering a free 30-minute demo class
              </label>
            </div>

            {/* Personalized Message */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Personalized Message to Student
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain why you are the best fit for this role. List your class benchmarks or relevant success achievements."
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Submitting CTAs */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 border border-gray-300 rounded-lg text-xs font-semibold text-gray-750 bg-white hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-4 bg-[#00A453] hover:bg-[#008f47] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Application'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
