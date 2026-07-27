'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AboutPage() {
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
            <BookOpen className="w-8 h-8" />
            <h1 className="text-3xl font-extrabold text-[#00060c] tracking-tight">
              About FindMyTutor
            </h1>
          </div>

          <p className="text-sm text-[#647380] leading-relaxed font-medium">
            FindMyTutor is a premium pair-matching marketplace designed to help students connect with expert, verified educators for real-time private lessons.
          </p>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">Our Mission</h2>
            <p className="text-sm text-[#647380] leading-relaxed font-medium">
              We believe quality learning is built on personalized interactions. Our platform streamlines finding, scheduling, and learning with qualified local or online tutors through rigorous identity verification, availability grids, and transparent pricing structures.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">Key Pillars</h2>
            <ul className="list-disc list-inside text-sm text-[#647380] space-y-2.5 font-medium pl-2">
              <li><strong className="text-[#2d2d2d] font-bold">Rigorous Verification:</strong> We perform manual checks and transcript audits for tutor qualifications and experience.</li>
              <li><strong className="text-[#2d2d2d] font-bold">Structured Matching:</strong> Using alignment scoring metrics, we identify matches matching board, class level, subject, and hourly budget parameters.</li>
              <li><strong className="text-[#2d2d2d] font-bold">Seamless Communication:</strong> Real-time messaging and class booking keep parents, students, and tutors in direct sync.</li>
            </ul>
          </div>

          <div className="pt-6 border-t border-[#dadee2] text-xs text-[#8c9ba5] font-semibold">
            findmyTutor Corporation © 2026
          </div>
        </div>
      </main>
    </div>
  );
}
