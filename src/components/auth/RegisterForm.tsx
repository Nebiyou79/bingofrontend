/**
 * components/auth/RegisterForm.tsx (Enhanced)
 * Multi-step registration with animations, validation, and premium design
 */

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';

interface FieldErrors {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const PHONE_RE = /^(09|07)\d{8}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Field component
interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: string;
  extra?: React.ReactNode;
}

function Field({ label, type = 'text', value, onChange, placeholder, error: err, icon, extra }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          style={{
            fontFamily: "'DM Mono', monospace",
            paddingLeft: icon ? '2.75rem' : '1rem',
            paddingRight: extra ? '2.75rem' : '1rem',
          }}
        />
        {extra}
      </div>
      {err && (
        <p className="text-red-400 text-xs mt-1.5 font-medium">
          ✗ {err}
        </p>
      )}
    </div>
  );
}

// Step indicator
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all"
            style={{
              background: i < current ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
              color: i < current ? '#fff' : '#6b7280',
              boxShadow: i < current ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none',
            }}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className="h-1 flex-1 rounded-full transition-all"
              style={{
                maxWidth: '40px',
                background: i < current - 1 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Main form
export function RegisterForm() {
  const { register, loading, error } = useAuthContext();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validateStep(stepNum: number): boolean {
    const errs: FieldErrors = {};

    if (stepNum === 1) {
      if (form.username.trim().length < 3) {
        errs.username = 'Username must be at least 3 characters';
      }
      if (!EMAIL_RE.test(form.email)) {
        errs.email = 'Enter a valid email address';
      }
      if (!PHONE_RE.test(form.phone)) {
        errs.phone = 'Phone must be 09xxxxxxxx or 07xxxxxxxx';
      }
    }

    if (stepNum === 2) {
      if (form.password.length < 8) {
        errs.password = 'Password must be at least 8 characters';
      }
      if (form.password !== form.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;
    if (step < 2) setStep(step + 1);
  }

  function handleBack(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;
    try {
      await register(form.username.trim(), form.email, form.phone, form.password);
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
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 mb-4 shadow-lg shadow-amber-900/50">
            <span className="text-xl">🎰</span>
          </div>
          <h1
            className="text-3xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Syne', 'Exo 2', sans-serif" }}
          >
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">DashBets</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Create your gaming account</p>
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

          {/* Step indicator */}
          <StepIndicator current={step} total={2} />

          <form onSubmit={step < 2 ? handleNext : handleSubmit} noValidate className="space-y-5">
            {/* STEP 1: Contact Details */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">
                  Step 1: Your Details
                </h2>

                <Field
                  label="Username"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="e.g. tesfaye21"
                  error={fieldErrors.username}
                  icon="👤"
                />

                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  error={fieldErrors.email}
                  icon="📧"
                />

                <Field
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="09xxxxxxxx"
                  error={fieldErrors.phone}
                  icon="📱"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-bold uppercase tracking-wide transition mt-8"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {/* STEP 2: Security & Password */}
            {step === 2 && (
              <>
                <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">
                  Step 2: Security
                </h2>

                <Field
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 characters"
                  error={fieldErrors.password}
                  icon="🔒"
                  extra={
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-xs"
                    >
                      {showPw ? '🙈' : '👁'}
                    </button>
                  }
                />

                <Field
                  label="Confirm Password"
                  type={showPw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Repeat your password"
                  error={fieldErrors.confirmPassword}
                  icon="🔐"
                />

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 cursor-pointer mt-6 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900/50 accent-amber-400 cursor-pointer mt-1"
                    required
                  />
                  <span className="text-gray-400 text-xs leading-relaxed">
                    I agree to the Terms and Conditions and confirm that I am 18+ years old
                  </span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 rounded-lg font-bold uppercase tracking-wide transition border"
                    style={{
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg font-bold uppercase tracking-wide transition flex items-center justify-center gap-2"
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
                        Creating…
                      </>
                    ) : (
                      <>Create Account 🎉</>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-bold transition">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>🔒 SSL Encrypted • Responsible Gaming • 18+</p>
        </div>
      </div>

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