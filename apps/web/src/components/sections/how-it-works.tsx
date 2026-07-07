const steps = [
  {
    number: '01',
    title: 'Create your account',
    description:
      "Sign up with your phone number. No email required. Verify via OTP and you're in — takes under 60 seconds.",
  },
  {
    number: '02',
    title: 'Find the right tutor',
    description:
      'Browse tutors by subject, level, city, or teaching mode. Filter by availability and price to narrow your search.',
  },
  {
    number: '03',
    title: 'Book and start learning',
    description:
      "Request a session directly. Once confirmed, attend your first class and pay only after it's complete.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        {/* Section header */}
        <div className="max-w-xl mb-12">
          <p className="text-sm font-medium text-[#0F766E] mb-2">Simple process</p>
          <h2 className="text-3xl font-semibold text-[#111827] tracking-tight">
            Get started in three steps
          </h2>
          <p className="mt-3 text-[#4B5563]">
            No complex onboarding. No lengthy setup. Just create your account and start learning.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col">
              {/* Step number */}
              <span className="text-4xl font-bold text-[#E5E7EB] mb-4 leading-none tabular-nums">
                {step.number}
              </span>
              {/* Divider */}
              <div className="h-px w-full bg-[#E5E7EB] mb-5" />
              {/* Content */}
              <h3 className="text-base font-semibold text-[#111827] mb-2">{step.title}</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
