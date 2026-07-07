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
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="h-10 w-10 flex items-center justify-center rounded-[6px] bg-[#f0fdfb] border border-[#0F766E]/20 mb-4">
            <Phone className="h-5 w-5 text-[#0F766E]" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">Welcome back</h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            Enter your phone number to receive a verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#111827] mb-1.5">
              Phone number
            </label>
            <div className="flex items-stretch gap-2">
              <div className="flex items-center px-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-[4px] text-sm text-[#6B7280] shrink-0">
                +91
              </div>
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
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Footer text */}
      <p className="mt-4 text-center text-xs text-[#6B7280]">
        By continuing, you agree to our{' '}
        <Link href="#" className="text-[#0F766E] hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" className="text-[#0F766E] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
