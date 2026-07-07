import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle } from 'lucide-react';

const stats = [
  { value: '12,000+', label: 'Students' },
  { value: '2,400+', label: 'Tutors' },
  { value: '94%', label: 'Satisfaction Rate' },
];

const trustPoints = [
  'All tutors background verified',
  'No commitment required',
  'Free first session',
];

export function Hero() {
  return (
    <section className="bg-white border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-6">
            <Badge variant="default">Now available across India</Badge>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-semibold text-[#111827] leading-tight tracking-tight">
            Expert tutors for every
            <br />
            subject, every level.
          </h1>

          {/* Subheadline */}
          <p className="mt-5 text-lg text-[#4B5563] leading-relaxed max-w-xl">
            Connect with verified, experienced tutors online or offline. Book a session in minutes —
            no contracts, no commitments.
          </p>

          {/* Trust points */}
          <ul className="mt-5 flex flex-col gap-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-[#4B5563]">
                <CheckCircle className="h-4 w-4 text-[#0F766E] shrink-0" />
                {point}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-8 flex items-center gap-3 flex-wrap">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="gap-1.5">
                Find a Tutor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="secondary" size="lg">
                Teach on Project Tutor
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 flex flex-wrap gap-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-[#111827]">{stat.value}</p>
              <p className="mt-1 text-sm text-[#6B7280]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
