'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function HelpCenterPage() {
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
            <HelpCircle className="w-8 h-8" />
            <h1 className="text-3xl font-extrabold text-[#00060c] tracking-tight">
              Help Center
            </h1>
          </div>

          <p className="text-sm text-[#647380] leading-relaxed font-medium">
            Need help? Explore frequently asked questions and get in touch with our customer success team.
          </p>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#2d2d2d]">How do I request a tutor?</h3>
                <p className="text-xs text-[#647380] leading-relaxed font-medium">
                  Go to your student dashboard, select "Post Requirement", fill out your subject, class level, location, and hourly budget range, and wait for matching tutors to submit proposals.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#2d2d2d]">How do I apply to tutoring requests?</h3>
                <p className="text-xs text-[#647380] leading-relaxed font-medium">
                  Log in as a tutor, navigate to "Browse open requests", search matching listings, and select "Apply now" to submit your customized proposal.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#2d2d2d]">What are verification standards?</h3>
                <p className="text-xs text-[#647380] leading-relaxed font-medium">
                  We verify phone numbers, degrees transcripts, and video introductions to ensure high trust. Verified profiles receive priority rankings in student searches.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-lg font-bold text-[#00060c]">Contact Support</h2>
            <p className="text-sm text-[#647380] leading-relaxed font-medium">
              If you have billing queries or technical difficulties, drop us a line at{' '}
              <a href="mailto:support@findmytutor.com" className="text-[#00A453] font-bold hover:underline">
                support@findmytutor.com
              </a>{' '}
              and our support staff will assist you within 24 hours.
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
