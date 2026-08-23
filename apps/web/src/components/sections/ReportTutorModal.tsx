'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { reportApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { X, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReportTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorUserId: string;
  tutorName?: string;
}

const REPORT_REASONS = [
  { code: 'ABUSE', label: 'Unprofessional behavior or inappropriate conduct' },
  { code: 'NO_SHOW', label: 'Did not show up for scheduled session / No-show' },
  { code: 'FAKE_TUTOR', label: 'Misleading qualifications or profile information' },
  { code: 'SCAM', label: 'Asked for off-platform payment or suspicious requests' },
  { code: 'HARASSMENT', label: 'Spam, harassment, or unwanted communication' },
  { code: 'OTHER', label: 'Other issue' },
];

export default function ReportTutorModal({
  isOpen,
  onClose,
  tutorUserId,
  tutorName = 'Tutor',
}: ReportTutorModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].code);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !tutorUserId) return;
    setLoading(true);
    setError('');

    try {
      const res = await reportApi.createReport(
        {
          targetType: 'USER',
          targetId: tutorUserId,
          reason: selectedReason,
          description: details.trim(),
        },
        token
      );

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setDetails('');
          onClose();
        }, 2000);
      } else {
        setError(res.error || res.message || 'Failed to submit report.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while submitting the report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dadee2] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#00A453] mx-auto" />
            <h3 className="text-lg font-black text-[#2d2d2d]">Report Submitted</h3>
            <p className="text-xs text-[#647380] font-medium">
              Thank you for keeping our community safe. Our trust & safety team will review this
              report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
              <Flag className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-base font-extrabold text-[#2d2d2d]">Report {tutorName}</h3>
                <p className="text-xs text-[#647380] font-medium">
                  Help us investigate inappropriate behavior or policy violations.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#2d2d2d] block">
                Select Reason for Report
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.code}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      selectedReason === reason.code
                        ? 'border-[#00A453] bg-[#e6f6ee]/60 text-[#2d2d2d]'
                        : 'border-gray-150 bg-gray-50/50 hover:bg-gray-100 text-[#384148]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.code}
                      checked={selectedReason === reason.code}
                      onChange={() => setSelectedReason(reason.code)}
                      className="text-[#00A453] focus:ring-[#00A453]"
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#2d2d2d] block">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any context, dates, or specific incidents…"
                rows={3}
                className="w-full text-xs p-3 border border-[#dadee2] rounded-xl focus:outline-none focus:border-[#00A453] font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl px-5"
              >
                {loading ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
