'use client';

import { useAuthStore } from '@/stores/auth-store';
import { MessageSquare, Calendar, Award } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#00060c]">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-sm text-[#647380] mt-0.5">
          Here is what is happening with your learning journey.
        </p>
      </div>

      {/* Grid of info blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Classes */}
        <div className="bg-white border border-[#dadee2] rounded-[8px] p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-blue-50 text-[#004fcb]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#00060c]">Classes</h3>
              <p className="text-xs text-[#647380] mt-0.5">No upcoming classes scheduled</p>
            </div>
          </div>
        </div>

        {/* Card 2: Messages */}
        <div className="bg-white border border-[#dadee2] rounded-[8px] p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-[#e6f6ee] text-[#00A453]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#00060c]">Discussions</h3>
              <p className="text-xs text-[#647380] mt-0.5">0 new messages in your boards</p>
            </div>
          </div>
        </div>

        {/* Card 3: Status */}
        <div className="bg-white border border-[#dadee2] rounded-[8px] p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-[8px] bg-amber-50 text-amber-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#00060c]">Account Status</h3>
              <p className="text-xs text-[#647380] mt-0.5">Profile Completed Successfully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 text-center max-w-xl mx-auto mt-8">
        <h2 className="text-lg font-bold text-[#00060c]">More features coming soon</h2>
        <p className="text-sm text-[#647380] mt-2 max-w-md mx-auto leading-relaxed">
          We are wrapping up the matches engine and class booking scheduler. You will be able to
          search verified tutors and request sessions directly next week!
        </p>
      </div>
    </div>
  );
}
