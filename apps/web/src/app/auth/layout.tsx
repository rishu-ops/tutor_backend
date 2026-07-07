import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 h-14 flex items-center">
          <Link href="/" className="text-[#0F766E] font-bold text-lg tracking-tight">
            Project Tutor
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center">
          <p className="text-xs text-[#6B7280]">
            &copy; {new Date().getFullYear()} Project Tutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
