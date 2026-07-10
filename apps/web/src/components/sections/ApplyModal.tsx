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

  // Form states
  const [introduction, setIntroduction] = useState('');
  const [proposedFee, setProposedFee] = useState(defaultBudgetMin.toString());
  const [availableTimings, setAvailableTimings] = useState('');
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
    if (!availableTimings.trim()) {
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
        availableTimings: availableTimings.trim(),
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
    <div className="fixed inset-0 bg-[#00060c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#2d2d2d] flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-[#00A453]" /> Submit Proposal
            </h2>
            <span className="text-xs text-[#647380] font-semibold block mt-0.5">
              Subject: {requirementSubject || requirementCategory} (Budget: ₹{defaultBudgetMin} - ₹
              {defaultBudgetMax}/hr)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {done ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-[#00A453] animate-bounce" />
            <h3 className="text-lg font-extrabold text-[#2d2d2d]">Proposal Sent!</h3>
            <p className="text-xs text-[#647380] max-w-xs mx-auto">
              Your tutoring proposal has been successfully delivered to the student. You will be
              notified when they review it.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-4 text-[#2d2d2d]"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Profile Intro */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#647380] uppercase tracking-wider">
                Introduction / Bio
              </label>
              <textarea
                rows={3}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Prefilled bio details from profile..."
                className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A453] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Proposed Hourly Fee */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#647380] uppercase tracking-wider">
                  Proposed Fee (₹/Hr)
                </label>
                <input
                  type="number"
                  value={proposedFee}
                  onChange={(e) => setProposedFee(e.target.value)}
                  className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A453]"
                />
              </div>

              {/* Timing availability */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#647380] uppercase tracking-wider">
                  Available Timings
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekdays 4-7 PM"
                  value={availableTimings}
                  onChange={(e) => setAvailableTimings(e.target.value)}
                  className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A453]"
                />
              </div>
            </div>

            {/* Demo Class Options */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input
                id="freeDemo"
                type="checkbox"
                checked={freeDemo}
                onChange={(e) => setFreeDemo(e.target.checked)}
                className="w-4 h-4 text-[#00A453] border-gray-300 rounded focus:ring-[#00A453]"
              />
              <label
                htmlFor="freeDemo"
                className="text-xs font-bold text-[#384148] cursor-pointer select-none"
              >
                🙋 I am offering a free 30-minute demo class
              </label>
            </div>

            {/* Personalized Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#647380] uppercase tracking-wider">
                Personalized Message to Student
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain why you are the best fit for this role. List your class benchmarks or relevant success achievements."
                className="w-full text-xs border border-[#dadee2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A453] resize-none"
              />
            </div>

            {/* Submitting CTAs */}
            <div className="pt-3 border-t border-gray-50 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="border-[#dadee2] text-xs font-semibold py-2.5 bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#00060c] hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5"
              >
                {submitting ? 'Sending...' : 'Send Application'}
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
