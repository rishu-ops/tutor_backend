'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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
  const defaultCode = searchParams.get('code') || '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState(defaultCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const autoVerifyAttempted = useRef(false);

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
            const intent = sessionStorage.getItem('onboarding-role-intent');
            sessionStorage.removeItem('onboarding-role-intent');

            if (intent === 'STUDENT') {
              router.push('/onboarding/student');
            } else if (intent === 'TUTOR') {
              router.push('/onboarding/tutor');
            } else {
              router.push(ROUTES.ONBOARDING);
            }
          } else {
            // Already onboarded -> clear intent and go to dashboard
            sessionStorage.removeItem('onboarding-role-intent');
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

  // Auto-submit pre-filled OTP in dev
  useEffect(() => {
    if (defaultCode.length === 6 && !autoVerifyAttempted.current) {
      autoVerifyAttempted.current = true;
      handleVerify(defaultCode);
    }
  }, [defaultCode, handleVerify]);

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
    <div className="w-full max-w-sm mx-auto">
      {/* Card */}
      <div className="bg-white border border-[#dadee2] rounded-[12px] p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-[#00A453] font-bold text-xl tracking-tight">
            project<span className="font-extrabold text-[#00060c]">tutor</span>
          </span>
          <h1 className="text-xl font-bold text-[#00060c] mt-4">Verify your phone</h1>
          <p className="mt-1.5 text-sm text-[#384148]">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-[#00060c]">{maskedPhone}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-4">
          <OtpInput value={otp} onChange={handleOtpChange} disabled={loading} error={error} />

          {defaultCode && (
            <div className="bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/20 rounded-[8px] p-3 text-xs text-center font-medium mt-3">
              Dev Mode: Simulated OTP detected:{' '}
              <span className="font-bold underline tracking-wider">{defaultCode}</span>
            </div>
          )}

          {loading && <p className="text-sm text-[#647380] text-center">Verifying...</p>}
        </div>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-[#647380]">
              Resend code in{' '}
              <span className="font-medium text-[#00060c] tabular-nums">{resendCooldown}s</span>
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              loading={resending}
              className="text-[#00A453] hover:text-[#008f47]"
            >
              <RotateCw className="h-3.5 w-3.5 animate-spin-hover" />
              Resend code
            </Button>
          )}
        </div>
      </div>

      {/* Back link */}
      <p className="mt-4 text-center text-xs text-[#647380]">
        Wrong number?{' '}
        <button
          onClick={() => router.push(ROUTES.AUTH_LOGIN)}
          className="text-[#00A453] hover:underline font-semibold cursor-pointer"
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
