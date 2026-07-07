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
    <footer className="bg-white border-t border-[#dadee2]">
      <div className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-6 w-6" />
              <span className="text-[#00A453] font-bold text-lg tracking-tight">
                FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#647380] leading-relaxed">
              Connecting students with expert tutors across India.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-[#00060c] mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#647380] hover:text-[#00060c] transition-colors"
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
        <div className="mt-10 pt-6 border-t border-[#dadee2] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#647380]">
            &copy; {new Date().getFullYear()} FindMyTutor. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-xs text-[#647380] hover:text-[#00060c] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-[#647380] hover:text-[#00060c] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
