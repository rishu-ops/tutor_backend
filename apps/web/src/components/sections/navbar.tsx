'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
          <Link
            href="/auth/login"
            onClick={() => sessionStorage.setItem('onboarding-role-intent', 'STUDENT')}
            className="text-sm font-medium text-[#384148] hover:text-[#00060c] transition-colors"
          >
            Find a Tutor
          </Link>
          <Link
            href="/auth/login"
            onClick={() => sessionStorage.setItem('onboarding-role-intent', 'TUTOR')}
            className="text-sm font-medium text-[#384148] hover:text-[#00060c] transition-colors"
          >
            Become a Tutor
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-[#384148] hover:text-[#00060c] transition-colors"
          >
            Community
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-[#384148] hover:text-[#00060c] transition-colors"
          >
            How it Works
          </Link>
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
