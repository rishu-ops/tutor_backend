'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces, hyphens, etc.
    let cleaned = phone.replace(/\D/g, '');

    // Strip country code 91 if present at start of a 12-digit number
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.slice(2);
    }

    // Must be exactly 10 digits
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return false;
    }

    // Reject all same digits
    if (/^(\d)\1{9}$/.test(cleaned)) {
      return false;
    }

    // Reject ascending sequence
    if (cleaned === '1234567890') {
      return false;
    }

    // Reject descending sequence
    if (cleaned === '9876543210') {
      return false;
    }

    // Reject alternating patterns
    if (/^(\d\d)\1{4}$/.test(cleaned)) {
      return false;
    }

    // Reject repeated 5-digit pattern
    if (/^(\d{5})\1$/.test(cleaned)) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+91\d{10}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    const fullPhone = cleanPhone.startsWith('+91') ? cleanPhone : `+91${cleanPhone}`;

    const isValidPhone = validatePhoneNumber(fullPhone);
    if (!isValidPhone) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp(fullPhone);
      const devOtp = (res as any).otp;
      const baseUrl = `/auth/verify?phone=${encodeURIComponent(fullPhone)}`;
      const url = devOtp ? `${baseUrl}&code=${encodeURIComponent(devOtp)}` : baseUrl;
      router.push(url);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      {/* Left side: Illustration */}
      <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center text-center space-y-6">
        <div className="relative w-full max-w-[540px] aspect-square rounded-[24px] overflow-hidden">
          <img
            src="/login_illustration.png"
            alt="FindMyTutor Design Illustration"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-[480px] space-y-2">
          <h2 className="text-3xl font-extrabold text-[#00060c] tracking-tight">
            Find the tutor <span className="text-[#00A453]">made for you</span>
          </h2>
          <p className="text-sm text-[#647380] leading-relaxed">
            Browse verified profiles, view teaching history, check hourly rates, and schedule
            sessions with private tutors in your city.
          </p>
        </div>
      </div>

      {/* Right side: Login Card */}
      <div className="col-span-12 lg:col-span-6 w-full max-w-lg mx-auto">
        <div className="p-0 md:p-6">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <span className="text-[#00A453] font-bold text-3xl tracking-tight">
              FindMy<span className="font-extrabold text-[#00060c]">Tutor</span>
            </span>
            <h1 className="text-xl font-bold text-[#00060c] mt-4">Sign in or create account</h1>
            <p className="mt-2 text-sm text-[#647380] leading-relaxed">
              Enter your mobile phone number to verify your identity.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold text-[#647380] mb-2 uppercase tracking-wider"
              >
                Mobile Phone Number
              </label>
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center h-10 px-3.5 bg-[#FAFAFA] border border-[#dadee2] rounded-[12px] text-sm font-semibold text-[#00060c] shrink-0">
                  +91
                </div>
                <div className="flex-1">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your 10-digit number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    error={error}
                    disabled={loading}
                    className="rounded-[12px] h-10 text-sm"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full rounded-[12px] font-bold text-sm h-11"
            >
              Continue
            </Button>
          </form>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-[12px] text-[#647380] leading-relaxed max-w-[320px] mx-auto">
          By continuing, you accept our{' '}
          <Link href="#" className="text-[#00A453] hover:underline font-semibold">
            terms and conditions
          </Link>{' '}
          and our{' '}
          <Link href="#" className="text-[#00A453] hover:underline font-semibold">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
