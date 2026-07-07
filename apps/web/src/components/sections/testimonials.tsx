import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Priya Sharma',
    role: 'Class 12 Student, Delhi',
    quote:
      'I was struggling with Physics for months. My tutor on FindMyTutor helped me understand concepts from scratch. I went from 55% to 89% in my boards.',
    rating: 5,
  },
  {
    name: 'Rajesh Kumar',
    role: 'Mathematics Tutor',
    quote:
      'FindMyTutor gave me a platform to reach students across my city without spending on marketing. I now have 18 regular students and a stable income.',
    rating: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Parent, Bangalore',
    quote:
      'Finding a reliable tutor for my daughter was always stressful. The verification system and reviews on FindMyTutor made it easy to trust the process.',
    rating: 5,
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Testimonials() {
  return (
    <section className="bg-white border-b border-[#dadee2]">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        {/* Section header */}
        <div className="max-w-xl mb-12">
          <p className="text-sm font-semibold text-[#00A453] mb-2">Testimonials</p>
          <h2 className="text-3xl font-extrabold text-[#00060c] tracking-tight">
            Trusted by students, parents, and tutors
          </h2>
          <p className="mt-3 text-[#384148]">
            Real stories from people using FindMyTutor every day.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 flex flex-col"
            >
              {/* Rating */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-[#4B5563] leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#f0fdfb] border border-[#0F766E]/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#0F766E]">
                    {getInitials(t.name)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111827]">{t.name}</p>
                  <p className="text-xs text-[#6B7280]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
