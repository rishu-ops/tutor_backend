'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  School,
  GraduationCap,
  Languages,
  BookOpen,
  MapPin,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentProfilePage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const studentUserId = resolvedParams.id;

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [studentData, setStudentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchStudentProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/v1/student/profile/${studentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setStudentData(data.data);
        } else {
          setError(data.error || 'Failed to load student profile.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while loading profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentUserId, token, router]);

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name.slice(0, 1).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="border border-gray-200 rounded-3xl p-6 bg-white flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-gray-200 rounded-2xl p-5 bg-white h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-center space-y-4">
        <p className="text-red-600 font-bold">{error || 'Student details not found.'}</p>
        <Link href="/dashboard/requirements/browse">
          <Button className="bg-[#00060c] text-white hover:bg-slate-800 text-sm font-semibold">
            Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const { user: studentUser, profile, activeRequirements = [] } = studentData;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 text-[#2d2d2d] font-sans">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/requirements/browse"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to browse
        </Link>
      </div>

      {/* Main Profile Box */}
      <div className="border border-[#dadee2] rounded-3xl p-6 bg-white shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center font-extrabold text-green-700 text-2xl shrink-0 border border-green-150 shadow-xs">
            {getInitials(studentUser?.name)}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-gray-950 leading-tight">
              {studentUser?.name || 'Anonymous Student'}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-semibold">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {studentUser?.email || 'No email shared'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {studentUser?.phone || 'No phone shared'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* School Name */}
        <div className="border border-[#dadee2] rounded-2xl p-5 bg-white space-y-1 shadow-xs">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-gray-400" /> School Name
          </div>
          <p className="text-sm font-extrabold text-gray-900">
            {profile?.schoolName || 'Not specified'}
          </p>
        </div>

        {/* Grade / Class */}
        <div className="border border-[#dadee2] rounded-2xl p-5 bg-white space-y-1 shadow-xs">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-gray-400" /> Grade / Class
          </div>
          <p className="text-sm font-extrabold text-gray-900">
            {profile?.gradeClass || 'Not specified'}
          </p>
        </div>

        {/* Preferred Language */}
        <div className="border border-[#dadee2] rounded-2xl p-5 bg-white space-y-1 shadow-xs">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-gray-400" /> Preferred Language
          </div>
          <p className="text-sm font-extrabold text-gray-900">
            {profile?.preferredLanguage || 'Not specified'}
          </p>
        </div>

        {/* Learning Mode */}
        <div className="border border-[#dadee2] rounded-2xl p-5 bg-white space-y-1 shadow-xs">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-gray-400" /> Learning Mode
          </div>
          <p className="text-sm font-extrabold text-gray-900">
            {profile?.learningMode || 'Not specified'}
          </p>
        </div>
      </div>

      {/* Active Requirements List */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
          Active Requirements ({activeRequirements.length})
        </h3>

        {activeRequirements.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-400 text-xs font-semibold">
            No active tuition requirements found for this student.
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequirements.map((req: any) => (
              <div
                key={req._id}
                className="border border-[#dadee2] rounded-2xl p-5 bg-white shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-md font-extrabold text-gray-950 leading-tight">
                    {req.curriculum?.subject || req.category}
                  </h4>
                  <span className="inline-flex items-center text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                    ₹{req.budget?.min} - ₹{req.budget?.max}/hr
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{req.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    Format: {req.teachingMode?.join(', ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Location: {req.location?.area || 'N/A'}, {req.location?.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
