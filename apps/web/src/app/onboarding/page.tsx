'use client';

import Link from 'next/link';
import { BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingChoicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center gap-2">
          <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-7 w-7" />
          <span className="text-[#00A453] font-bold text-xl tracking-tight">
            FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
          </span>
        </div>
      </header>

      {/* Main Choice Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm text-center">
            {/* Title */}
            <h1 className="text-2xl font-extrabold text-[#00060c]">Welcome to FindMyTutor</h1>
            <p className="mt-2 text-sm text-[#647380] max-w-sm mx-auto">
              Please choose how you would like to use the platform to complete your profile setup.
            </p>

            {/* Choices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Choice 1: Find a Tutor */}
              <div className="border border-[#dadee2] rounded-[12px] p-6 flex flex-col justify-between items-center text-center">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#e6f6ee] text-[#00A453] mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-[#00060c] mb-1">I want to learn</h2>
                <p className="text-xs text-[#647380] mb-6 min-h-[40px]">
                  Find verified tutors, schedule classes, and track your progress.
                </p>
                <Link href="/onboarding/student" className="w-full">
                  <Button
                    variant="primary"
                    className="w-full text-xs font-bold rounded-[12px] h-[40px]"
                  >
                    Find a Tutor
                  </Button>
                </Link>
              </div>

              {/* Choice 2: Teach */}
              <div className="border border-[#dadee2] rounded-[12px] p-6 flex flex-col justify-between items-center text-center">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-50 text-[#004fcb] mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-[#00060c] mb-1">I want to teach</h2>
                <p className="text-xs text-[#647380] mb-6 min-h-[40px]">
                  Create your tutor profile, set rates, and find local or online students.
                </p>
                <Link href="/onboarding/tutor" className="w-full">
                  <Button
                    variant="secondary"
                    className="w-full text-xs font-bold rounded-[12px] h-[40px]"
                  >
                    Teach on FindMyTutor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center">
          <p className="text-xs text-[#647380]">
            &copy; {new Date().getFullYear()} FindMyTutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
