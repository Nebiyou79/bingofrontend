/**
 * components/auth/LoginForm.tsx (Enhanced)
 * Premium login form with animated background, gradient elements, and smooth interactions
 */

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';

export function LoginForm() {
  const { login, loading, error } = useAuthContext();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    if (!identifier.trim()) errs.identifier = 'Email or phone is required';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(identifier.trim(), password);
      router.replace('/dashboard');
    } catch {
      // error already set in useAuth
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0814 0%, #1a1625 100%)' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #f59e0b, transparent)',
            top: '-200px',
            right: '-200px',
            animation: 'float 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #a855f7, transparent)',
            bottom: '-200px',
            left: '-200px',
            animation: 'float 20s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 mb-4 shadow-lg shadow-amber-900/50">
            <span className="text-xl">🎰</span>
          </div>
          <h1
            className="text-3xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Syne', 'Exo 2', sans-serif" }}
          >
            Dash<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">Bets</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Welcome back to the action</p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl shadow-2xl p-8 border backdrop-blur-xl"
          style={{
            background: 'rgba(15, 12, 26, 0.6)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.1)',
          }}
        >
          {/* API-level error */}
          {error && (
            <div
              className="mb-6 rounded-lg px-4 py-3 border animate-slide-down"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                Phone or Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  📧
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="09xxxxxxxx or you@email.com"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />
              </div>
              {fieldErrors.identifier && (
                <p className="text-red-400 text-xs mt-1.5 font-medium">
                  ✗ {fieldErrors.identifier}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  🔒
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 pl-10 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-xs font-medium"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1.5 font-medium">
                  ✗ {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900/50 accent-amber-400 cursor-pointer"
                  defaultChecked
                />
                <span className="text-gray-400">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-amber-400 hover:text-amber-300 font-medium transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold uppercase tracking-wide transition flex items-center justify-center gap-2 mt-8"
              style={{
                background: loading
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.5), rgba(217, 119, 6, 0.5))'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: loading
                  ? 'none'
                  : '0 0 20px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900/80 text-gray-500">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-amber-400 hover:text-amber-300 font-bold transition"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>🔒 Secure login • SSL encrypted • Responsible Gaming</p>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-30px) scale(1.1);
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}