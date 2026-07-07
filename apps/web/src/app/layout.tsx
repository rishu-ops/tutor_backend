import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Project Tutor — Find Expert Tutors',
  description:
    'Connect with verified tutors for every subject and every level. Book sessions online or offline, at your pace.',
  keywords: ['tutor', 'online tutoring', 'find a tutor', 'education', 'learning'],
  openGraph: {
    title: 'Project Tutor — Find Expert Tutors',
    description: 'Connect with verified tutors for every subject and every level.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
