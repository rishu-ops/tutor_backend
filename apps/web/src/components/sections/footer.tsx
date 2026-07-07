import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Find a Tutor', href: '/auth/register' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#' },
    { label: 'FAQ', href: '#' },
  ],
  Tutors: [
    { label: 'Become a Tutor', href: '/auth/register' },
    { label: 'Tutor Dashboard', href: '#' },
    { label: 'Resources', href: '#' },
    { label: 'Success Stories', href: '#' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB]">
      <div className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div>
            <Link href="/" className="text-[#0F766E] font-bold text-lg tracking-tight">
              Project Tutor
            </Link>
            <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
              Connecting students with expert tutors across India.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-[#111827] mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B7280]">
            &copy; {new Date().getFullYear()} Project Tutor. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
