'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCheck,
  Trash2,
  CalendarCheck,
  FileText,
  UserCheck,
  Clock,
  ExternalLink,
  AlertCircle,
  XCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsCenterPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        setError(data.error || 'Failed to retrieve notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure loading notifications.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    setError('');
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setSuccess('All notifications marked as read.');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'Failed to update notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Network failure marking notifications as read.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!token || !confirm('Are you sure you want to clear all your notifications?')) return;
    setError('');
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
        setSuccess('All notifications cleared successfully.');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'Failed to clear notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Network failure clearing notifications.');
    }
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'BOOKING_REQUESTED':
      case 'BOOKING_RESCHEDULED':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_COMPLETED':
        return <CalendarCheck className="w-5 h-5 text-emerald-500" />;
      case 'BOOKING_DECLINED':
      case 'BOOKING_CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'TUTOR_APPLIED':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'APPLICATION_ACCEPTED':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-[#00A453]" />;
    }
  };

  const getActionLink = (notif: any) => {
    const type = notif.type;
    const data = notif.data || {};
    if (type && type.startsWith('BOOKING')) {
      return '/dashboard/bookings';
    }
    if (type === 'TUTOR_APPLIED') {
      return '/dashboard/requirements';
    }
    if (type === 'APPLICATION_ACCEPTED') {
      return '/dashboard/messages';
    }
    return null;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 min-h-[calc(100vh-100px)] font-sans text-[#2d2d2d] bg-[#FAFAFA]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-950 flex items-center gap-2">
            <Bell className="w-7 h-7 text-[#00A453]" /> Notification Center
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Keep track of application views, lesson updates, and system approvals.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllRead}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4 text-[#00A453]" /> Mark All Read
              </Button>
            )}
            <Button
              onClick={handleClearAll}
              variant="secondary"
              className="border border-red-100 hover:bg-red-50 text-red-600 font-bold text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="p-5 bg-white border border-[#dadee2] rounded-3xl animate-pulse flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-150 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-150 rounded w-1/4" />
                <div className="h-3 bg-gray-150 rounded w-3/4" />
                <div className="h-2.5 bg-gray-150 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#dadee2] rounded-3xl p-12 text-center text-gray-400 font-semibold space-y-2 mt-8 max-w-lg mx-auto">
          <Bell className="w-10 h-10 mx-auto text-gray-300 animate-bounce" />
          <p className="text-gray-800 font-bold text-sm">All caught up!</p>
          <p className="text-xs text-gray-500 font-normal">
            No new activity logs on your dashboard notifications center for now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const hasLink = getActionLink(notif);
            return (
              <div
                key={notif._id}
                className={`p-5 bg-white border border-[#dadee2] rounded-3xl shadow-xs hover:border-gray-300 transition-all flex items-start gap-4 relative group ${
                  !notif.read ? 'border-l-[3.5px] border-l-[#00A453]' : ''
                }`}
              >
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 shrink-0 flex items-center justify-center">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-950 block">
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 bg-[#00A453] rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    {notif.content}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-gray-450 font-bold">
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    {hasLink && (
                      <Link
                        href={hasLink}
                        className="text-[10px] text-[#00A453] font-extrabold hover:underline flex items-center gap-0.5"
                      >
                        Action <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className="p-1.5 text-[#00A453] hover:bg-green-50 rounded-xl transition-colors text-[10px] font-bold border border-green-100 flex items-center gap-0.5"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-50 flex items-center"
                    title="Delete notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
