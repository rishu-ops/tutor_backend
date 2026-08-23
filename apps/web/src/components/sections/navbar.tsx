'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_LINKS: { href: string; label: string; roleIntent?: 'STUDENT' | 'TUTOR' }[] = [
  { href: '/auth/login', label: 'Find a Tutor', roleIntent: 'STUDENT' },
  { href: '/auth/login', label: 'Become a Tutor', roleIntent: 'TUTOR' },
  { href: '#features', label: 'Community' },
  { href: '#how-it-works', label: 'How it Works' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (roleIntent?: 'STUDENT' | 'TUTOR') => {
    if (roleIntent) sessionStorage.setItem('onboarding-role-intent', roleIntent);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#dadee2]">
      <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-7 w-7" />
          <span className="text-[#00A453] font-bold text-xl tracking-tight">
            FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
          </span>
        </Link>

        {/* Nav Links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => handleNavClick(link.roleIntent)}
              className="text-sm font-medium text-[#384148] hover:text-[#00060c] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA (desktop) + menu toggle (mobile) */}
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden md:block">
            <Button variant="dark" size="sm">
              Sign in
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="md:hidden p-2 -mr-2 text-[#00060c] rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A453] focus-visible:ring-offset-2"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[#dadee2] bg-white px-6 py-4 flex flex-col gap-1 animate-fadeIn">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => handleNavClick(link.roleIntent)}
              className="text-sm font-medium text-[#384148] hover:text-[#00060c] py-2.5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="mt-2">
            <Button variant="dark" size="sm" className="w-full">
              Sign in
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
}
