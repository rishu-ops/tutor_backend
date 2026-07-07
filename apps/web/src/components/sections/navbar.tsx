import Link from 'next/link';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Community', href: '#features' },
  { label: 'Find a Tutor', href: '/auth/login' },
  { label: 'Become a Tutor', href: '/auth/register' },
  { label: 'How it Works', href: '#how-it-works' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#dadee2]">
      <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-[#00A453] font-bold text-xl tracking-tight low-case">
            project<span className="font-extrabold text-[#00060c]">tutor</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#384148] hover:text-[#00060c] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="dark" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
