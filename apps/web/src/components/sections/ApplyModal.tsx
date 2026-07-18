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
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00060c]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              Submit Proposal
            </h2>
            <span className="text-xs text-gray-500 font-semibold block mt-0.5">
              Subject: {requirementSubject || requirementCategory} (Budget: ₹{defaultBudgetMin} - ₹
              {defaultBudgetMax}/hr)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {done ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-[#00A453] animate-bounce" />
            <h3 className="text-base font-bold text-gray-900">Proposal Sent!</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Your tutoring proposal has been successfully delivered to the student. You will be
              notified when they review it.
            </p>
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
