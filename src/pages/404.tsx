/**
 * pages/404.tsx
 * DashBets custom 404 page with premium styling
 */

import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const NotFoundPage: NextPage = () => {
  // Use state to handle the random number client-side only
  const [recoveryOdds, setRecoveryOdds] = useState<number | null>(null);

  useEffect(() => {
    // Generate random number only on the client
    setRecoveryOdds(Math.floor(Math.random() * 100) + 1);
  }, []);

  return (
    <>
      <Head>
        <title>404 — Page Not Found · DashBets</title>
      </Head>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
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
              background: 'radial-gradient(circle, #ef4444, transparent)',
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

        <div className="relative z-10 flex flex-col items-center max-w-2xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/50 group-hover:shadow-amber-900 transition">
              <span className="text-lg">🎰</span>
            </div>
            <span
              className="text-lg font-extrabold text-gray-300 group-hover:text-white transition tracking-tight"
              style={{ fontFamily: "'Syne', 'Exo 2', sans-serif" }}
            >
              DashBets
            </span>
          </Link>

          {/* 404 Display */}
          <div className="relative mb-8 animate-scale-in">
            <p
              className="text-7xl sm:text-8xl lg:text-9xl font-extrabold text-transparent leading-none select-none"
              style={{
                WebkitTextStroke: '2px rgba(245, 158, 11, 0.25)',
                fontFamily: "'Syne', 'Exo 2', sans-serif",
              }}
            >
              404
            </p>
            <span className="absolute inset-0 flex items-center justify-center text-6xl sm:text-7xl pointer-events-none select-none">
              🎡
            </span>
          </div>

          {/* Text */}
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
            style={{ fontFamily: "'Syne', 'Exo 2', sans-serif" }}
          >
            The wheel landed on LOSS.
          </h1>
          <p className="text-gray-400 max-w-sm leading-relaxed mb-10">
            This page doesn&apos;t exist — but your next big win might be just one spin away. Let&apos;s get you back in the game!
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Link
              href="/"
              className="flex-1 text-center px-6 py-3 rounded-lg text-sm font-extrabold transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              🏠 Go Home
            </Link>
            <Link
              href="/games/spin"
              className="flex-1 text-center px-6 py-3 rounded-lg text-sm font-extrabold border transition-all hover:scale-105 active:scale-95"
              style={{
                borderColor: 'rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
              }}
            >
              🎡 Spin Instead
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-10 flex flex-wrap gap-4 sm:gap-6 justify-center text-xs font-mono text-gray-500 px-4">
            <Link href="/dashboard" className="hover:text-amber-400 transition">
              Dashboard
            </Link>
            <Link href="/games" className="hover:text-amber-400 transition">
              Games
            </Link>
            <Link href="/wallet" className="hover:text-amber-400 transition">
              Wallet
            </Link>
            <Link href="/support" className="hover:text-amber-400 transition">
              Support
            </Link>
          </div>

          {/* Footer Easter egg - Fixed hydration issue */}
          <p className="mt-16 text-[10px] text-gray-700 font-mono">
            Error Code: 404 SPIN_LOST_EQUILIBRIUM • Your odds of recovery: {recoveryOdds ?? '---'}%
          </p>
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
    </>
  );
};

export default NotFoundPage;