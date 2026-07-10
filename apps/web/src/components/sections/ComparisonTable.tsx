'use client';

import React, { useEffect, useState } from 'react';
import { X, Check, Star, ShieldCheck, Compass } from 'lucide-react';
import { Button } from '../ui/button';
import { applicationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface ComparisonTableProps {
  applicationIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onAccept: (applicationId: string) => void;
  actionLoading?: boolean;
}

export default function ComparisonTable({
  applicationIds,
  isOpen,
  onClose,
  onAccept,
  actionLoading = false,
}: ComparisonTableProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadComparison() {
      if (!applicationIds || applicationIds.length === 0 || !token) return;
      setLoading(true);
      setError('');
      try {
        const res = await applicationApi.compareApplications(applicationIds, token);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || res.message || 'Failed to generate comparison summary.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while comparing profiles.');
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
      loadComparison();
    }
  }, [applicationIds, token, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00060c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#2d2d2d] flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-[#00A453]" /> Compare Candidates
            </h2>
            <span className="text-xs text-[#647380] font-semibold mt-0.5">
              Compare prices, availability, and experience side-by-side to make your choice
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison body */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 text-[#2d2d2d]">
          {loading ? (
            <div className="text-center py-20 text-xs font-semibold text-[#647380] animate-pulse">
              Generating comparative matrices...
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold">
              ⚠️ {error}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-xs font-semibold text-[#647380]">
              No data loaded. Select at least 2 candidates to compare.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3.5 px-4 font-extrabold text-[#647380] uppercase tracking-wider w-1/5">
                    Feature
                  </th>
                  {data.map((col) => (
                    <th
                      key={col.applicationId}
                      className="py-3.5 px-6 font-extrabold text-sm text-[#2d2d2d] text-center border-l border-gray-100"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="truncate max-w-[120px]">{col.tutorName}</span>
                        {col.verified && (
                          <span className="text-[9px] text-[#00A453] bg-[#e6f6ee] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 select-none">
                            <ShieldCheck className="w-3 h-3 shrink-0" /> Verified
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-[#384148]">
                {/* 1. Rating */}
                <tr>
                  <td className="py-4 px-4 text-[#647380] font-bold">Rating</td>
                  {data.map((col) => (
                    <td
                      key={col.applicationId}
                      className="py-4 px-6 text-center border-l border-gray-100"
                    >
                      <div className="flex items-center justify-center gap-0.5 font-bold text-[#2d2d2d]">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        {col.rating}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. Experience */}
                <tr>
                  <td className="py-4 px-4 text-[#647380] font-bold">Experience</td>
                  {data.map((col) => (
                    <td
                      key={col.applicationId}
                      className="py-4 px-6 text-center border-l border-gray-100 font-bold text-[#2d2d2d]"
                    >
                      {col.experience}
                    </td>
                  ))}
                </tr>

                {/* 3. Price Fee */}
                <tr>
                  <td className="py-4 px-4 text-[#647380] font-bold">Hourly Fee</td>
                  {data.map((col) => (
                    <td
                      key={col.applicationId}
                      className="py-4 px-6 text-center border-l border-gray-100 text-[#00A453] font-bold text-sm"
                    >
                      ₹{col.proposedFee} / Hr
                    </td>
                  ))}
                </tr>

                {/* 4. Demo class */}
                <tr>
                  <td className="py-4 px-4 text-[#647380] font-bold">Demo Offered</td>
                  {data.map((col) => (
                    <td
                      key={col.applicationId}
                      className="py-4 px-6 text-center border-l border-gray-100"
                    >
                      {col.freeDemo ? (
                        <span className="text-[#00A453] bg-[#e6f6ee] px-2 py-0.5 rounded font-extrabold">
                          Yes (30m)
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 5. Timings */}
                <tr>
                  <td className="py-4 px-4 text-[#647380] font-bold">Timings</td>
                  {data.map((col) => (
                    <td
                      key={col.applicationId}
                      className="py-4 px-6 text-center border-l border-gray-100 text-[#2d2d2d] leading-relaxed max-w-[150px]"
                    >
                      {col.timings}
                    </td>
                  ))}
                </tr>

                {/* 6. Actions row */}
                <tr>
                  <td className="py-5 px-4 text-[#647380] font-bold">Hiring Action</td>
                  {data.map((col) => (
                    <td
                      key={col.applicationId}
                      className="py-5 px-6 text-center border-l border-gray-100"
                    >
                      <Button
                        disabled={actionLoading}
                        onClick={() => {
                          onAccept(col.applicationId);
                          onClose();
                        }}
                        className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-xs py-2 px-4.5 rounded-lg transition-all shadow-sm w-full"
                      >
                        Accept Tutor
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="border-gray-200 hover:bg-gray-100 text-xs font-semibold py-2.5 px-4 bg-white text-[#2d2d2d]"
          >
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}
