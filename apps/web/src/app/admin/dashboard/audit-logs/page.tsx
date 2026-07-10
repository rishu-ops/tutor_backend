'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { Search, Eye, ClipboardList } from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  module: string;
  resourceId?: string | null;
  metadata?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchLogs = async () => {
      try {
        const res = await adminApi.getAuditLogs(token);
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch audit log registry.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.adminName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      (log.ipAddress?.toLowerCase().includes(term) ?? false)
    );
  });

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

      {/* Filter and Search Box */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by administrator name, action, or module..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981] transition-all"
        />
      </div>

      {/* Audit table */}
      <div className="border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Administrator</th>
                <th className="p-4">Operational Module</th>
                <th className="p-4">Action</th>
                <th className="p-4">Client IP</th>
                <th className="p-4 pr-6 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic font-sans">
                    No matching audit operations logged.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/[0.01] transition-colors text-slate-300"
                  >
                    <td className="p-4 pl-6 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-white font-sans font-semibold">{log.adminName}</td>
                    <td className="p-4 text-[#10B981] font-semibold">{log.module}</td>
                    <td className="p-4 font-sans text-white text-xs leading-normal">
                      {log.action}
                    </td>
                    <td className="p-4 text-slate-400">{log.ipAddress || 'unknown'}</td>
                    <td className="p-4 pr-6 text-right">
                      {log.metadata ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer ml-auto flex items-center justify-center"
                          title="View Log Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-[#0A0D18]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[540px] rounded-xl border border-white/10 bg-[#121A2E] p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <ClipboardList className="w-5 h-5 text-[#10B981]" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Operation Payload Inspector
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Audit Event ID: {selectedLog.id}
                </p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="text-xs text-slate-300 leading-normal grid grid-cols-3 gap-y-2 border-b border-white/5 pb-3">
                <span className="text-slate-400 font-semibold uppercase">Admin User:</span>
                <span className="col-span-2 text-white font-sans">{selectedLog.adminName}</span>
                <span className="text-slate-400 font-semibold uppercase">Action:</span>
                <span className="col-span-2 text-white font-sans">{selectedLog.action}</span>
                <span className="text-slate-400 font-semibold uppercase">Timestamp:</span>
                <span className="col-span-2 text-white">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>

              {selectedLog.metadata && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Raw Payload Metadata
                  </label>
                  <pre className="p-4 bg-black/40 border border-white/5 rounded-lg text-[10px] text-emerald-400 overflow-x-auto max-h-[220px] scrollbar-thin">
                    {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="h-10 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
