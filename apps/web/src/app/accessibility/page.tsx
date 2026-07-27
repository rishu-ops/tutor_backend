'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function AccessibilityPage() {
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
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-extrabold text-[#00060c] tracking-tight">
              Accessibility
            </h1>
          </div>

          <p className="text-sm text-[#647380] leading-relaxed font-medium">
            FindMyTutor is committed to providing a digitally accessible learning environment for all users, including individuals with disabilities.
          </p>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">Our Commitment</h2>
            <p className="text-sm text-[#647380] leading-relaxed font-medium">
              We aim to design and implement digital resources in line with the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 level AA standards. Our interface supports keyboard navigability, semantic tags, screen-readers, and clear color contrast ratios.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-[#00060c]">Key Features</h2>
            <ul className="list-disc list-inside text-sm text-[#647380] space-y-2.5 font-medium pl-2">
              <li><strong className="text-[#2d2d2d] font-bold">Contrast & Design:</strong> All layouts are crafted to maintain high readability across diverse lighting environments.</li>
              <li><strong className="text-[#2d2d2d] font-bold">Screen Reader Optimization:</strong> Proper HTML5 headings, descriptive aria-labels, and alt tags are mounted on interactive dashboard controls.</li>
              <li><strong className="text-[#2d2d2d] font-bold">Adjustable Controls:</strong> Support for screen zooming, scalable typography layouts, and browser font-resizing rules.</li>
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
