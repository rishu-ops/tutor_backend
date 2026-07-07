import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const benefits = [
  'Set your own schedule and rates',
  'Teach online, offline, or both',
  'Receive payments directly and securely',
  'Build your reputation with verified reviews',
  'Access a growing base of motivated students',
  'No subscription fees — only pay on bookings',
];

export function ForTutors() {
  return (
    <section id="for-tutors" className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <p className="text-sm font-medium text-[#0F766E] mb-2">For tutors</p>
            <h2 className="text-3xl font-semibold text-[#111827] tracking-tight">
              Grow your tutoring practice with Project Tutor
            </h2>
            <p className="mt-4 text-[#4B5563] leading-relaxed">
              Join thousands of tutors who have built sustainable teaching practices on our
              platform. We handle the discovery and payments — you focus on teaching.
            </p>

            <ul className="mt-8 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="mt-0.5 h-4 w-4 flex items-center justify-center rounded-[4px] bg-[#f0fdfb] border border-[#0F766E]/20 shrink-0">
                    <Check className="h-2.5 w-2.5 text-[#0F766E]" />
                  </div>
                  <span className="text-sm text-[#4B5563]">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/auth/register">
                <Button variant="primary" size="lg">
                  Start teaching today
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: stats panel */}
          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-8">
            <h3 className="text-sm font-semibold text-[#111827] mb-6 uppercase tracking-wide">
              Tutor statistics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: '2,400+', label: 'Active tutors' },
                { value: '₹800', label: 'Avg. hourly rate' },
                { value: '4.8', label: 'Avg. tutor rating' },
                { value: '15 days', label: 'Avg. time to first booking' },
              ].map((stat) => (
                <div key={stat.label} className="border-l-2 border-[#0F766E] pl-4">
                  <p className="text-2xl font-bold text-[#111827]">{stat.value}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
