import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="FindMyTutor Logo" className="h-6 w-6" />
            <span className="text-[#00A453] font-bold text-base tracking-tight">
              FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center w-full max-w-[1440px] mx-auto py-12 px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dadee2] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center">
          <p className="text-xs text-[#647380]">
            &copy; {new Date().getFullYear()} FindMyTutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
