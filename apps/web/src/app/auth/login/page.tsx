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

    setLoading(true);
    try {
      await authApi.sendOtp(fullPhone);
      router.push(`/auth/verify?phone=${encodeURIComponent(fullPhone)}`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Card */}
      <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <span className="text-[#00A453] font-bold text-xl tracking-tight">
            project<span className="font-extrabold text-[#00060c]">tutor</span>
          </span>
          <h1 className="text-xl font-bold text-[#00060c] mt-4">Sign in or create account</h1>
          <p className="mt-1.5 text-sm text-[#384148]">
            Enter your phone number to receive a verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-[#2d2d2d] mb-1.5">
              Phone number
            </label>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center h-10 px-3 bg-[#FAFAFA] border border-[#dadee2] rounded-[12px] text-sm font-semibold text-[#647380] shrink-0">
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
                  className="rounded-[12px] h-10"
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
            className="w-full rounded-[12px]"
          >
            Continue
          </Button>
        </form>
      </div>

      {/* Footer text */}
      <p className="mt-4 text-center text-xs text-[#647380] leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="#" className="text-[#00A453] hover:underline font-semibold">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" className="text-[#00A453] hover:underline font-semibold">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
