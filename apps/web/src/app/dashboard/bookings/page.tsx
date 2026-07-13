'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  PlusCircle,
  Edit2,
  Video,
  FileText,
  MapPin,
  CalendarCheck,
} from 'lucide-react';

export default function BookingsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: string;
    title: string;
    desc: string;
  } | null>(null);

  // Reschedule modal state
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch bookings.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch bookings due to a network error.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!token) return;
    setError('');
    setSuccessMsg('');
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/v1/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Booking status updated to ${status.toLowerCase()} successfully!`);
        fetchBookings();
      } else {
        setError(data.error || 'Failed to update booking status.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error updating booking.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rescheduleBookingId || !newDate || !newTime) return;
    setError('');
    setSuccessMsg('');
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}`);
      const res = await fetch(`/api/v1/bookings/${rescheduleBookingId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduledAt }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Booking rescheduled successfully!');
        setRescheduleBookingId(null);
        setNewDate('');
        setNewTime('');
        fetchBookings();
      } else {
        setError(data.error || 'Failed to reschedule booking.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error rescheduling booking.');
    }
  };

  // Grouping bookings
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'ACCEPTED' && new Date(b.scheduledAt).getTime() > Date.now()
  );
  const pastClosedBookings = bookings.filter(
    (b) =>
      b.status === 'COMPLETED' ||
      b.status === 'CANCELLED' ||
      b.status === 'REJECTED' ||
      ((b.status === 'ACCEPTED' || b.status === 'PENDING') &&
        new Date(b.scheduledAt).getTime() <= Date.now())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 min-h-[calc(100vh-100px)] font-sans text-[#2d2d2d] bg-[#FAFAFA]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-950 flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[#00A453]" /> Scheduled Classes & Demos
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Track upcoming lesson schedules, request slot updates, or access demo lecture booking
            logs.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-[#00A453] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold">Loading your booking planner...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Pending Bookings Accordion/Section */}
          {pendingBookings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Pending Approvals ({pendingBookings.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingBookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/50 inline-block">
                          {b.type} Session
                        </span>
                        <h3 className="text-sm font-extrabold text-gray-900">
                          {user?.role === 'STUDENT' ? 'Tutor: ' : 'Student: '}
                          {b.otherParty.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(b.scheduledAt).toLocaleDateString([], {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(b.scheduledAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          ({b.duration} mins)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-700">
                        Rate: ₹{b.fee || 0}/hr
                      </span>
                    </div>

                    {b.notes && (
                      <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-150 font-medium italic">
                        "{b.notes}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {user?.role === 'TUTOR' ? (
                        <>
                          <Button
                            onClick={() => handleUpdateStatus(b._id, 'ACCEPTED')}
                            disabled={updatingId === b._id}
                            className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-xs h-9 rounded-xl flex-1 flex items-center justify-center gap-1.5"
                          >
                            {updatingId === b._id ? 'Accepting...' : 'Accept Session'}
                          </Button>
                          <Button
                            onClick={() =>
                              setConfirmAction({
                                id: b._id,
                                status: 'REJECTED',
                                title: 'Decline Class Booking',
                                desc: 'Are you sure you want to decline this scheduled class proposal? This action is permanent and will notify the student.',
                              })
                            }
                            disabled={updatingId === b._id}
                            variant="secondary"
                            className="border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs h-9 rounded-xl flex-1 flex items-center justify-center gap-1.5"
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => setRescheduleBookingId(b._id)}
                            disabled={updatingId === b._id}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs h-9 rounded-xl flex-1 flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Reschedule
                          </Button>
                          <Button
                            onClick={() =>
                              setConfirmAction({
                                id: b._id,
                                status: 'CANCELLED',
                                title: 'Cancel Class Request',
                                desc: 'Are you sure you want to cancel this scheduled class request? This action is permanent.',
                              })
                            }
                            disabled={updatingId === b._id}
                            variant="secondary"
                            className="border border-gray-250 text-gray-500 hover:bg-gray-50 font-bold text-xs h-9 rounded-xl flex-1 flex items-center justify-center gap-1.5"
                          >
                            Cancel Request
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Upcoming Accepted Bookings */}
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Upcoming Classes (
              {upcomingBookings.length})
            </h2>
            {upcomingBookings.length === 0 ? (
              <div className="bg-white border border-[#dadee2] rounded-3xl p-8 text-center text-xs text-gray-400 font-semibold space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-gray-800 font-bold">No upcoming classes scheduled</p>
                <p className="text-[11px] text-gray-500 font-normal">
                  Go to Messages to book a demo slot with accepted tutors.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-white border border-[#dadee2] rounded-3xl p-5 shadow-sm space-y-4 hover:border-emerald-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/50 inline-block">
                          {b.type} Scheduled
                        </span>
                        <h3 className="text-sm font-extrabold text-gray-900">
                          {user?.role === 'STUDENT' ? 'Tutor: ' : 'Student: '}
                          {b.otherParty.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(b.scheduledAt).toLocaleDateString([], {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(b.scheduledAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          ({b.duration} mins)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-700">
                        Rate: ₹{b.fee || 0}/hr
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50/50 px-2.5 py-1 rounded-xl">
                        <Video className="w-3.5 h-3.5 text-emerald-500" /> Online Meeting Link
                      </div>
                      <div className="flex items-center gap-2">
                        {user?.role === 'TUTOR' && (
                          <Button
                            onClick={() =>
                              setConfirmAction({
                                id: b._id,
                                status: 'COMPLETED',
                                title: 'Mark Class Completed',
                                desc: 'Are you sure you want to log this class session as completed? Doing so will close the booking loop.',
                              })
                            }
                            disabled={updatingId === b._id}
                            className="bg-[#00060c] hover:bg-slate-800 text-white font-bold text-xs h-8 px-3 rounded-lg"
                          >
                            {updatingId === b._id ? 'Saving...' : 'Mark Completed'}
                          </Button>
                        )}
                        <Button
                          onClick={() => setRescheduleBookingId(b._id)}
                          disabled={updatingId === b._id}
                          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs h-8 px-3 rounded-lg"
                        >
                          Reschedule
                        </Button>
                        <Button
                          onClick={() =>
                            setConfirmAction({
                              id: b._id,
                              status: 'CANCELLED',
                              title: 'Cancel Class Booking',
                              desc: 'Are you sure you want to cancel this scheduled class? This action cannot be undone and will notify the other party.',
                            })
                          }
                          disabled={updatingId === b._id}
                          className="bg-white border border-red-200 hover:bg-red-50 text-red-655 font-bold text-xs h-8 px-3 rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Past & Closed Log Bookings */}
          {pastClosedBookings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-400" /> Past & Closed Log (
                {pastClosedBookings.length})
              </h2>
              <div className="bg-white border border-[#dadee2] rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-extrabold uppercase border-b border-gray-200">
                        <th className="p-4">Party</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pastClosedBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900">
                            {b.otherParty.name}
                            <span className="text-[10px] text-gray-400 block font-normal capitalize">
                              {b.otherParty.role.toLowerCase()}
                            </span>
                          </td>
                          <td className="p-4 font-semibold">{b.type}</td>
                          <td className="p-4 text-gray-600 font-medium">
                            {new Date(b.scheduledAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            ·{' '}
                            {new Date(b.scheduledAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusStyle(
                                b.status
                              )}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-gray-900">₹{b.fee || 0}/hr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal dialog */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 bg-[#00060c]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#dadee2] rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-extrabold text-gray-950">Reschedule Class Slot</h3>
              <button
                onClick={() => setRescheduleBookingId(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Select Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-gray-50 border border-[#dadee2] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Select Time</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-gray-50 border border-[#dadee2] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-xs h-10 rounded-xl flex-1"
                >
                  Save Reschedule
                </Button>
                <Button
                  type="button"
                  onClick={() => setRescheduleBookingId(null)}
                  variant="secondary"
                  className="border border-gray-250 text-gray-700 hover:bg-gray-50 font-bold text-xs h-10 rounded-xl px-4"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-[#00060c]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#dadee2] rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4 animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-extrabold text-gray-950">{confirmAction.title}</h3>
              <button
                onClick={() => setConfirmAction(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              {confirmAction.desc}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => {
                  handleUpdateStatus(confirmAction.id, confirmAction.status);
                  setConfirmAction(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-10 rounded-xl flex-1"
              >
                Confirm
              </Button>
              <Button
                type="button"
                onClick={() => setConfirmAction(null)}
                variant="secondary"
                className="border border-gray-250 text-gray-700 hover:bg-gray-50 font-bold text-xs h-10 rounded-xl px-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
