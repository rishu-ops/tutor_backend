'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Clock,
  Award,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface TutorProfile {
  _id: string;
  userId: string;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  qualifications: string[];
  subjects: { subject: string; level: string }[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export default function AdminVerificationsPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [profiles, setProfiles] = useState<TutorProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = async () => {
    if (!token) return;
    try {
      const res = await adminApi.getPendingVerifications(token);
      if (res.success) {
        setProfiles(res.data);
        if (res.data.length > 0) {
          setSelectedProfile(res.data[0]);
        } else {
          setSelectedProfile(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending tutor verifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [token]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!token || !selectedProfile) return;
    try {
      const apiCall =
        action === 'approve'
          ? adminApi.approveVerification(selectedProfile._id, token)
          : adminApi.rejectVerification(selectedProfile._id, token);

      const res = await apiCall;
      if (res.success) {
        setProfiles((prev) => prev.filter((p) => p._id !== selectedProfile._id));
        const remaining = profiles.filter((p) => p._id !== selectedProfile._id);
        if (remaining.length > 0) {
          setSelectedProfile(remaining[0]);
        } else {
          setSelectedProfile(null);
        }
      }
    } catch (err: any) {
      alert(err.message || `Failed to ${action} tutor profile validation status.`);
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
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col min-h-0">
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg text-red-200 text-xs shrink-0">
          {error}
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/30 text-[#10B981] flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-white font-semibold">Inbox Clear!</h3>
          <p className="text-slate-400 text-xs mt-1">
            There are no pending tutor verifications currently.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          {/* Left List of Profiles */}
          <div className="w-[340px] border border-white/5 rounded-xl bg-white/[0.01] overflow-y-auto shrink-0 divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] border-b border-white/5 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pending Verification Profiles ({profiles.length})
              </span>
            </div>
            {profiles.map((profile) => (
              <button
                key={profile._id}
                onClick={() => setSelectedProfile(profile)}
                className={`w-full text-left p-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col ${
                  selectedProfile?._id === profile._id
                    ? 'bg-white/[0.03] border-l-2 border-[#10B981]'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                    Tutor Node ID
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider shrink-0 bg-slate-800 px-1 py-0.2 rounded border border-white/5 truncate max-w-[100px]">
                    {profile._id.substring(12)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{profile.bio}</p>
                <div className="flex gap-4 mt-3 text-[10px] font-semibold text-[#10B981] uppercase tracking-wide">
                  <span>₹{profile.hourlyRate}/hr</span>
                  <span className="text-slate-500">|</span>
                  <span>{profile.experienceYears} Years Exp</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right Detail Card */}
          {selectedProfile && (
            <div className="flex-1 border border-white/5 rounded-xl bg-white/[0.01] flex flex-col overflow-hidden min-h-0">
              <div className="p-5 border-b border-white/5 bg-white/[0.02] shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Tutor Validation Preview
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Tutor Profile UUID: {selectedProfile._id}
                  </p>
                </div>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300">
                  {selectedProfile.verificationStatus}
                </span>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Biography */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tutor Biography
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed bg-black/25 p-4 rounded-lg border border-white/5">
                    {selectedProfile.bio}
                  </p>
                </div>

                {/* Experience & Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#10B981]" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        Tutoring Experience
                      </p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {selectedProfile.experienceYears} Years
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <Award className="w-5 h-5 text-[#3B82F6]" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        Compensation Demand
                      </p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        ₹{selectedProfile.hourlyRate}/hour
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subjects & Curriculum */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Expertise Subjects
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.subjects.map((sub, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/40 border border-white/5 text-xs text-slate-200"
                      >
                        <span className="font-semibold text-white">{sub.subject}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-medium bg-slate-900 px-1 py-0.2 rounded">
                          {sub.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Qualifications & Degrees
                  </h4>
                  <div className="space-y-2">
                    {selectedProfile.qualifications.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-slate-300 flex items-center gap-2.5"
                      >
                        <GraduationCap className="w-4 h-4 text-[#10B981]" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0 flex items-center justify-end gap-3.5">
                <button
                  onClick={() => handleAction('reject')}
                  className="h-10 px-5 rounded-lg border border-red-500/20 hover:border-red-500/35 hover:bg-red-950/20 text-red-400 hover:text-red-300 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Profile</span>
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="h-10 px-5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-white font-semibold text-xs shadow-md shadow-[#10B981]/25 hover:shadow-[#10B981]/35 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
