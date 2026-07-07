'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/constants';

const RESEND_COOLDOWN = 30;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  // Redirect if no phone
  useEffect(() => {
    if (!phone) {
      router.replace(ROUTES.AUTH_LOGIN);
    }
  }, [phone, router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-submit when 6 digits entered
  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length !== 6 || loading) return;
      setError('');
      setLoading(true);

      try {
        const result = await authApi.verifyOtp(phone, code);
        if (result.data) {
          setAuth(result.data.user, result.data.accessToken, result.data.refreshToken);

          // Redirect based on role
          if (!result.data.user.role) {
            router.push(ROUTES.ONBOARDING);
          } else {
            router.push(ROUTES.DASHBOARD);
          }
        }
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr.message || 'Invalid OTP. Please try again.');
        setOtp('');
      } finally {
        setLoading(false);
      }
    },
    [phone, loading, setAuth, router]
  );

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError('');
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      await authApi.sendOtp(phone);
      setResendCooldown(RESEND_COOLDOWN);
      setOtp('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = phone ? phone.slice(0, 4) + '****' + phone.slice(-2) : '';

  return (
    <div>
      {/* Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto h-10 w-10 flex items-center justify-center rounded-[6px] bg-[#f0fdfb] border border-[#0F766E]/20 mb-4">
            <ShieldCheck className="h-5 w-5 text-[#0F766E]" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">Verify your phone</h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-[#111827]">{maskedPhone}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-4">
          <OtpInput value={otp} onChange={handleOtpChange} disabled={loading} error={error} />

          {loading && <p className="text-sm text-[#6B7280] text-center">Verifying...</p>}
        </div>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-[#6B7280]">
              Resend code in{' '}
              <span className="font-medium text-[#111827] tabular-nums">{resendCooldown}s</span>
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              loading={resending}
              className="text-[#0F766E]"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Resend code
            </Button>
          )}
        </div>
      </div>

      {/* Back link */}
      <p className="mt-4 text-center text-xs text-[#6B7280]">
        Wrong number?{' '}
        <button
          onClick={() => router.push(ROUTES.AUTH_LOGIN)}
          className="text-[#0F766E] hover:underline cursor-pointer"
        >
          Go back
        </button>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#6B7280]">Loading...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
