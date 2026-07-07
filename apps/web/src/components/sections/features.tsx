import {
  ShieldCheck,
  CalendarClock,
  BookOpen,
  CreditCard,
  BarChart2,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Verified Tutors',
    description:
      'Every tutor is background-checked and credential-verified before joining the platform.',
  },
  {
    icon: CalendarClock,
    title: 'Flexible Scheduling',
    description:
      'Book sessions that fit your routine — mornings, evenings, weekends, or whenever works best.',
  },
  {
    icon: BookOpen,
    title: 'Direct Booking',
    description:
      'No middlemen. Directly connect with tutors, negotiate, and confirm your session in minutes.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description:
      'Pay only after confirming your session. Funds are held securely until the session is complete.',
  },
  {
    icon: BarChart2,
    title: 'Progress Tracking',
    description: 'Track attendance, session notes, and student progress all in one place.',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'Access your dashboard from any device — desktop, tablet, or mobile browser.',
  },
];

export function Features() {
  return (
    <section id="features" className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        {/* Section header */}
        <div className="max-w-xl mb-12">
          <p className="text-sm font-medium text-[#0F766E] mb-2">Platform features</p>
          <h2 className="text-3xl font-semibold text-[#111827] tracking-tight">
            Everything you need to learn or teach effectively
          </h2>
          <p className="mt-3 text-[#4B5563]">
            Built for students who want results and tutors who want to grow their practice.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-[#E5E7EB] rounded-[6px] p-5"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-[4px] bg-[#f0fdfb] mb-4">
                  <Icon className="h-4 w-4 text-[#0F766E]" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827] mb-1.5">{feature.title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
