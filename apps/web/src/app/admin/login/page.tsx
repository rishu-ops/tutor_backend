'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAdminAuth } = useAdminAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await adminApi.login({ email, password });
      if (res.success && res.accessToken && res.refreshToken && res.user) {
        setAdminAuth(res.user, res.accessToken, res.refreshToken);
        router.replace('/admin/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-radial from-[#121A2E] to-[#0A0D18] p-4 text-[#E2E8F0] font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.06),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.04),transparent_40%)]" />

      <div className="relative w-full max-w-[440px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#10B981]/25 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#FAFAFA]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Administrative Node</h1>
          <p className="text-sm text-slate-400">Sign in to control platform configurations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/25 text-red-200 text-xs flex items-center gap-2 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@tutor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] disabled:from-slate-700 disabled:to-slate-800 text-white font-semibold text-sm rounded-lg shadow-md shadow-[#10B981]/20 hover:shadow-[#10B981]/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-8"
          >
            {loading ? (
              <span className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
