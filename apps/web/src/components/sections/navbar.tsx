import Link from 'next/link';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'For Tutors', href: '#for-tutors' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-[1280px] px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-[#0F766E] font-bold text-lg tracking-tight">Project Tutor</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#4B5563] hover:text-[#111827] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
