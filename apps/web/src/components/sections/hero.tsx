'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="bg-[#ffffff] border-b border-[#dadee2] py-16 lg:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-[1280px] px-6 flex flex-col items-center text-center relative z-10">
        {/* Main Heading */}
        <h1 className="text-4xl lg:text-5xl font-extrabold text-[#00A453] leading-tight tracking-tight max-w-4xl">
          You deserve a tutor that helps you succeed
        </h1>

        {/* Unified Login Box Wrapper */}
        <div className="mt-12 flex items-center justify-between w-full max-w-5xl gap-8">
          {/* Left Doodle Illustration (Hidden on mobile) */}
          <div className="hidden lg:block w-[280px] shrink-0 opacity-80">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <path
                d="M20 120 C 40 80, 80 80, 100 120"
                stroke="#00060c"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M100 120 C 110 130, 130 130, 140 120" stroke="#00060c" strokeWidth="2" />
              <rect
                x="50"
                y="120"
                width="80"
                height="60"
                rx="4"
                stroke="#00060c"
                strokeWidth="2"
                fill="white"
              />
              <line
                x1="60"
                y1="135"
                x2="120"
                y2="135"
                stroke="#00060c"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="60"
                y1="145"
                x2="100"
                y2="145"
                stroke="#00060c"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="60"
                y1="155"
                x2="110"
                y2="155"
                stroke="#00060c"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Floating heart sketch */}
              <path
                d="M120 40 C 110 30, 95 35, 95 45 C 95 55, 120 70, 120 70 C 120 70, 145 55, 145 45 C 145 35, 130 30, 120 40 Z"
                stroke="#00060c"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="3 3"
              />
            </svg>
          </div>

          {/* Central Access Card (448px width) */}
          <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 w-full max-w-[448px] mx-auto text-center shrink-0">
            {/* Logos / Subtitle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-[#00A453] font-bold text-sm tracking-tight">
                project<span className="font-extrabold text-[#00060c]">tutor</span>
              </span>
              <span className="text-[#647380] text-xs">•</span>
              <span className="text-[#384148] font-semibold text-xs tracking-wider uppercase">
                OTP AUTH
              </span>
            </div>

            {/* Card title */}
            <h2 className="text-xl font-bold text-[#00060c] leading-snug">
              One login to help you learn
            </h2>
            <p className="mt-2 text-sm text-[#384148] max-w-[320px] mx-auto">
              Streamline your education. Find and connect with top verified tutors near you.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 space-y-3">
              <Link href="/auth/login" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold justify-center rounded-[12px]"
                  onClick={() => sessionStorage.setItem('onboarding-role-intent', 'STUDENT')}
                >
                  Continue with phone number
                </Button>
              </Link>

              <Link href="/auth/login" className="block w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full text-sm font-bold justify-center rounded-[12px]"
                  onClick={() => sessionStorage.setItem('onboarding-role-intent', 'TUTOR')}
                >
                  Become a tutor
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Doodle Illustration (Hidden on mobile) */}
          <div className="hidden lg:block w-[280px] shrink-0 opacity-80">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              {/* Sketch of a person surfing/learning */}
              <path d="M40 140 L160 140" stroke="#00060c" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M70 140 L110 90 L120 100 L140 140"
                stroke="#00060c"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="110" cy="70" r="12" stroke="#00060c" strokeWidth="2" fill="white" />
              <path
                d="M120 70 C 135 60, 150 70, 160 65"
                stroke="#00060c"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Floating stars/points */}
              <path
                d="M30 60 L35 70 L45 72 L35 75 L30 85 L25 75 L15 72 L25 70 Z"
                stroke="#00060c"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Bottom statistics row */}
        <div className="mt-16 pt-8 border-t border-[#dadee2] w-full max-w-5xl flex justify-around flex-wrap gap-6">
          {[
            { value: '12,000+', label: 'Students' },
            { value: '2,400+', label: 'Verified Tutors' },
            { value: '94%', label: 'Success Rate' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[#00060c]">{stat.value}</p>
              <p className="text-xs text-[#647380] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
