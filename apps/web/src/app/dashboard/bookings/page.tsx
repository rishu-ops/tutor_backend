'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  User,
  Wifi,
  Home,
  LayoutGrid,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Booking {
  _id: string;
  requirementId: string;
  studentUserId: string;
  tutorUserId: string;
  scheduledAt: string;
  duration: number;
  sessionMode: 'ONLINE' | 'ONSITE' | 'HYBRID';
  isFirstSession: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  meetingLink?: string;
  location?: string;
  declineReason?: string;
  rescheduledFrom?: string;
  rescheduleRequestedBy?: string;
  otherParty: { id: string; name: string; role: string; email?: string; phone?: string };
}

function formatDT(dt: string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-50 text-red-600 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting Confirmation',
  ACCEPTED: 'Confirmed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export default function BookingsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isTutor = user?.role === 'TUTOR';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  // Action states
  const [actingId, setActingId] = useState<string | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const action = async (
    id: string,
    status: string,
    opts?: { meetingLink?: string; declineReason?: string }
  ) => {
    if (!token) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/v1/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, ...opts }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...data.data } : b)));
      }
    } catch {}
    setActingId(null);
    setShowDeclineModal(null);
    setShowAcceptModal(null);
    setDeclineReason('');
    setMeetingLink('');
  };

  const reschedule = async (id: string) => {
    if (!token || !rescheduleDate || !rescheduleTime) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/v1/bookings/${id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          scheduledAt: new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...data.data } : b)));
      }
    } catch {}
    setActingId(null);
    setShowRescheduleModal(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      new Date(b.scheduledAt) >= now && !['CANCELLED', 'DECLINED', 'COMPLETED'].includes(b.status)
  );
  const past = bookings.filter(
    (b) =>
      new Date(b.scheduledAt) < now || ['CANCELLED', 'DECLINED', 'COMPLETED'].includes(b.status)
  );
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTutor
              ? 'Review and manage class requests from your students.'
              : 'Request trial classes and track your scheduled sessions here.'}
          </p>
        </div>
        {!isTutor && (
          <Link
            href="/dashboard/messages"
            className="text-xs font-bold bg-[#00A453] text-white px-4 py-2 rounded-xl hover:bg-[#008A45] transition-colors"
          >
            Request a Session →
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#00A453] animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
          <Calendar className="w-10 h-10 text-gray-200" />
          <p className="text-sm font-bold text-gray-400">
            {tab === 'upcoming'
              ? 'No sessions scheduled yet.'
              : 'No completed or past sessions found.'}
          </p>
          {tab === 'upcoming' && !isTutor && (
            <p className="text-sm text-gray-400">
              Open a conversation in{' '}
              <Link href="/dashboard/messages" className="text-[#00A453] font-bold hover:underline">
                Messages
              </Link>{' '}
              to request a trial class from a tutor.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((b) => {
            const { date, time } = formatDT(b.scheduledAt);
            const isActing = actingId === b._id;
            const sessionLabel = b.isFirstSession ? 'Trial Class' : 'Regular Session';
            const ModeIcon =
              b.sessionMode === 'ONLINE' ? Wifi : b.sessionMode === 'ONSITE' ? Home : LayoutGrid;
            return (
              <div
                key={b._id}
                className="bg-white border border-[#dadee2] hover:border-[#00A453] hover:shadow-md rounded-2xl p-6 space-y-4 flex flex-col justify-between transition-all duration-200 animate-fadeIn"
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Session type badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                        b.isFirstSession
                          ? 'bg-purple-50 text-purple-700 border-purple-200/50'
                          : 'bg-blue-50 text-blue-700 border-blue-200/50'
                      }`}
                    >
                      {b.isFirstSession ? '✦ Trial Class' : 'Regular Session'}
                    </span>
                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${STATUS_STYLES[b.status]}`}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#647380] font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {date}
                  </span>
                </div>

                {/* Profile metadata */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e6f6ee] border border-[#00A453]/15 flex items-center justify-center shrink-0 shadow-xs">
                      <span className="text-xs font-bold text-[#00A453]">
                        {getInitials(b.otherParty.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-950 leading-none">
                        {b.otherParty.name}
                      </h3>
                      <p className="text-[10px] text-[#647380] font-bold uppercase mt-1">
                        {b.otherParty.role}
                      </p>
                    </div>
                  </div>

                  {/* Time & Mode pills */}
                  <div className="flex items-center gap-2 text-[11px] text-[#647380] flex-wrap">
                    <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {time} · {b.duration} mins
                    </span>
                    <span className="text-gray-300 font-normal">·</span>
                    <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1 flex items-center gap-1.5">
                      <ModeIcon className="w-3.5 h-3.5 text-gray-400" />
                      {b.sessionMode}
                    </span>
                    {b.location && b.sessionMode !== 'ONLINE' && (
                      <>
                        <span className="text-gray-300 font-normal">·</span>
                        <span className="font-bold bg-gray-50 border border-gray-150 rounded-full px-3 py-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {b.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Decline reason */}
                {b.status === 'DECLINED' && b.declineReason && (
                  <div className="p-4 bg-red-50 border border-red-150 rounded-xl space-y-1">
                    <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">
                      Decline Reason
                    </span>
                    <p className="text-xs text-red-600 leading-relaxed font-semibold">
                      {b.declineReason}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {b.notes && (
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                    <span className="text-[10px] text-[#647380] font-bold uppercase tracking-wider block">
                      Notes & Specifications
                    </span>
                    <p className="text-xs text-[#4c5a67] leading-relaxed font-semibold whitespace-pre-line">
                      {b.notes}
                    </p>
                  </div>
                )}

                {/* Rescheduled from banner */}
                {b.rescheduledFrom && b.status === 'PENDING' && (
                  <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] font-bold text-amber-700 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Rescheduled from {formatDT(b.rescheduledFrom).date} ·{' '}
                    {formatDT(b.rescheduledFrom).time}
                  </div>
                )}

                {/* Action buttons strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-gray-150">
                  <div className="flex items-center gap-2">
                    {/* Meeting link (ONLINE, ACCEPTED) */}
                    {b.status === 'ACCEPTED' && b.sessionMode !== 'ONSITE' && b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-[#00A453] bg-[#e6f6ee] border border-[#00A453]/25 rounded-full px-3.5 py-1.5 hover:bg-[#d8f1e5] transition-all shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" /> Join meeting room
                      </a>
                    )}
                    {b.status === 'ACCEPTED' && b.sessionMode !== 'ONSITE' && !b.meetingLink && (
                      <span className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200/40 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Link pending from tutor
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* TUTOR actions on PENDING */}
                    {isTutor && b.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => {
                            if (b.sessionMode === 'ONSITE') {
                              action(b._id, 'ACCEPTED');
                            } else {
                              setShowAcceptModal(b._id);
                            }
                          }}
                          disabled={isActing}
                          variant="primary"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isActing ? 'Accepting...' : 'Accept'}
                        </Button>
                        <Button
                          onClick={() => setShowDeclineModal(b._id)}
                          disabled={isActing}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50/50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </Button>
                      </>
                    )}

                    {/* TUTOR actions on ACCEPTED */}
                    {isTutor && b.status === 'ACCEPTED' && (
                      <>
                        <Button
                          onClick={() => action(b._id, 'COMPLETED')}
                          disabled={isActing}
                          variant="primary"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isActing ? '...' : 'Mark Complete'}
                        </Button>
                        <Button
                          onClick={() => setShowRescheduleModal(b._id)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                        </Button>
                      </>
                    )}

                    {/* STUDENT actions on PENDING */}
                    {!isTutor && b.status === 'PENDING' && (
                      <Button
                        onClick={() => action(b._id, 'CANCELLED')}
                        disabled={isActing}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50/50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {isActing ? 'Cancelling...' : 'Cancel Request'}
                      </Button>
                    )}

                    {/* STUDENT actions on ACCEPTED */}
                    {!isTutor && b.status === 'ACCEPTED' && (
                      <>
                        <Button
                          onClick={() => action(b._id, 'CANCELLED')}
                          disabled={isActing}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50/50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => setShowRescheduleModal(b._id)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Propose New Time
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Accept (online) — add meeting link */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Accept Session</h3>
            <p className="text-xs text-gray-500">
              Optionally add a meeting link (Google Meet, Zoom, etc.) for the student.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">
                Meeting Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  action(showAcceptModal, 'ACCEPTED', { meetingLink: meetingLink || undefined })
                }
                className="flex-1 bg-[#00A453] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#008A45] transition-colors"
              >
                Confirm Accept
              </button>
              <button
                onClick={() => {
                  setShowAcceptModal(null);
                  setMeetingLink('');
                }}
                className="px-4 border border-gray-200 text-gray-500 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline — add reason */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Decline Session</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">
                Reason (optional — shown to student)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Not available on this date, please propose another time."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-300 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  action(showDeclineModal, 'DECLINED', {
                    declineReason: declineReason || undefined,
                  })
                }
                className="flex-1 bg-red-500 text-white text-xs font-bold py-2 rounded-xl hover:bg-red-600 transition-colors"
              >
                Decline Session
              </button>
              <button
                onClick={() => {
                  setShowDeclineModal(null);
                  setDeclineReason('');
                }}
                className="px-4 border border-gray-200 text-gray-500 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Propose New Time</h3>
            <p className="text-xs text-gray-500">
              The other party will need to confirm the new time.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => reschedule(showRescheduleModal)}
                disabled={!rescheduleDate || !rescheduleTime}
                className="flex-1 bg-[#00A453] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#008A45] transition-colors disabled:opacity-50"
              >
                Send Proposal
              </button>
              <button
                onClick={() => {
                  setShowRescheduleModal(null);
                  setRescheduleDate('');
                  setRescheduleTime('');
                }}
                className="px-4 border border-gray-200 text-gray-500 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
