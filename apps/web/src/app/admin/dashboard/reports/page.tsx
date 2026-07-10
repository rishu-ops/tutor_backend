'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { AlertCircle, CheckCircle, Eye, Settings2 } from 'lucide-react';

interface Report {
  _id: string;
  reporterId: string;
  targetType: 'TUTOR' | 'REQUIREMENT';
  targetId: string;
  reason: 'FAKE_TUTOR' | 'FAKE_REQUIREMENT' | 'SPAM' | 'ABUSE' | 'SCAM' | 'HARASSMENT';
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'IGNORED';
  resolution?: string;
  resolvedById?: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusInput, setStatusInput] = useState<'RESOLVED' | 'IGNORED'>('RESOLVED');
  const [resolutionInput, setResolutionInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await adminApi.getReports(token);
      if (res.success) {
        setReports(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReport) return;
    setSubmitLoading(true);

    try {
      const res = await adminApi.resolveReport(
        selectedReport._id,
        {
          status: statusInput,
          resolution: resolutionInput,
        },
        token
      );

      if (res.success) {
        setReports((prev) =>
          prev.map((r) =>
            r._id === selectedReport._id
              ? { ...r, status: statusInput, resolution: resolutionInput }
              : r
          )
        );
        setSelectedReport(null);
        setResolutionInput('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resolve abuse report.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Reports Listing Table */}
      <div className="border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Reported Type</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Reporter User</th>
                <th className="p-4">Date Filed</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    All report queues are clean. No flags found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          className={`w-4 h-4 ${report.status === 'PENDING' ? 'text-amber-400' : 'text-slate-400'}`}
                        />
                        <div>
                          <p className="font-semibold text-white uppercase text-xs">
                            {report.targetType}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                            {report.targetId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-xs font-semibold">
                        {report.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-300">{report.reporterId}</td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                          report.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-300'
                            : report.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-[#10B981]'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="h-8 px-3.5 rounded border border-white/10 hover:bg-white/5 text-xs text-slate-300 hover:text-white cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Sheet modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-[#0A0D18]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[500px] rounded-xl border border-white/10 bg-[#121A2E] p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-2">
              Abuse Flag Resolution
            </h3>

            <div className="space-y-4 my-6 text-xs leading-relaxed text-slate-300 bg-black/35 p-4 rounded-lg border border-white/5">
              <p>
                <strong className="text-white">Reporter:</strong> {selectedReport.reporterId}
              </p>
              <p>
                <strong className="text-white">Target ID:</strong> {selectedReport.targetId} (
                {selectedReport.targetType})
              </p>
              <p>
                <strong className="text-white">Reason:</strong>{' '}
                {selectedReport.reason.replace('_', ' ')}
              </p>
              {selectedReport.description && (
                <p>
                  <strong className="text-white">Explanation:</strong> "{selectedReport.description}
                  "
                </p>
              )}
            </div>

            {selectedReport.status === 'PENDING' ? (
              <form onSubmit={handleResolve} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Moderation Decision
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="RESOLVED" className="bg-[#121A2E]">
                      RESOLVED (Action Taken)
                    </option>
                    <option value="IGNORED" className="bg-[#121A2E]">
                      IGNORED (Dismiss / False Alarm)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Resolution Notes
                  </label>
                  <textarea
                    required
                    placeholder="Enter details about investigation actions or findings..."
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="h-10 px-4 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="h-10 px-5 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {submitLoading ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Submit Decision</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-950/15 border border-emerald-500/10 text-[#10B981] text-xs">
                  <p>
                    <strong className="text-white uppercase">Status:</strong>{' '}
                    {selectedReport.status}
                  </p>
                  <p className="mt-1">
                    <strong className="text-white uppercase">Notes:</strong>{' '}
                    {selectedReport.resolution}
                  </p>
                  <p className="mt-1">
                    <strong className="text-white uppercase">Resolved By Admin:</strong>{' '}
                    {selectedReport.resolvedById}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="h-10 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
