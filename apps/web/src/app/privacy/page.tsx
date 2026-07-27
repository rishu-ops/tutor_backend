'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#2d2d2d] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-7 w-7" />
            <span className="text-[#00A453] font-bold text-xl tracking-tight">
              FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
            </span>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs h-9">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-16 px-6">
        <div className="w-full max-w-2xl bg-white border border-[#dadee2] rounded-[8px] p-10 space-y-6">
          <div className="flex items-center gap-3 text-[#00A453] pb-4 border-b border-[#dadee2]">
            <ShieldCheck className="w-8 h-8" />
            <h1 className="text-3xl font-extrabold text-[#00060c] tracking-tight">
              Privacy & Terms
            </h1>
          </div>

          <p className="text-sm text-[#647380] leading-relaxed font-medium">
            Welcome to FindMyTutor. Your trust is essential. Read our policies regarding user profiles, chat communications, and data storage.
          </p>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">1. Privacy Policy Summary</h2>
            <p className="text-sm text-[#647380] leading-relaxed font-medium">
              We collect profile information (e.g. name, location, qualifications, and biography summaries) and communication histories inside chat rooms. Profile details are only visible to logged-in students and tutors who align with matching parameters. We do not sell or lease your identity credentials.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">2. Terms of Service Summary</h2>
            <p className="text-sm text-[#647380] leading-relaxed font-medium">
              By using our service, you commit to honest representation of educational credentials and background. Submitting false certificates or fraudulent videos will lead to permanent profile bans and verification status cancellations. All tuition payments, booking policies, and scheduling matches are managed at student-tutor discretion.
            </p>
          </div>

          <div className="pt-6 border-t border-[#dadee2] text-xs text-[#8c9ba5] font-semibold">
            findmyTutor Corporation © 2026
          </div>
        </div>
      </main>
    </div>
  );
}
