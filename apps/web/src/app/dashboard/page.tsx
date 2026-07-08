'use client';

import { useAuthStore } from '@/stores/auth-store';
import { MessageSquare, Calendar, Award } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
      <h1 className="text-3xl font-extrabold text-[#00060c]">Welcome, {user?.name || 'User'}!</h1>
      <p className="text-sm text-[#647380] max-w-md mx-auto">
        Your profile has been created. Click on your profile avatar in the top right corner of the
        header to view and manage your profile details.
      </p>
    </div>
  );
}
