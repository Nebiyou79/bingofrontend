/**
 * components/LoadingScreen.tsx
 * DashBets — premium per-game loading screen.
 *
 * - Marquee banner with chasing bulb lights at the top (brand entry moment).
 * - A circular "medallion" that displays the game's own loading artwork,
 *   ringed by a spinning gradient themed to that game's accent colors.
 * - Falls back to a generic DashBets mark when no game-specific image
 *   is supplied (e.g. the auth/session loader in AppWrapper).
 * - Loads its own fonts via <Head>, since this screen can render before
 *   AppLayout (which normally owns the font <link>) ever mounts.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number; // 0-100
  message?: string;
  /** Name of the game being loaded. Omit for the generic app-level loader. */
  gameName?: string;
  /** Per-game loading artwork (e.g. game.loadingImage from gameConfig). */
  loadingImage?: string;
  /** Per-game theme colors (e.g. game.accentColor / game.secondaryColor). */
  accentColor?: string;
  secondaryColor?: string;
}

const DEFAULT_TIPS = [
  'Set a budget before you play and stick to it.',
  'Every round here is provably fair and independently verifiable.',
  'Check the Rewards tab — bonuses refresh daily.',
  'Climb the VIP ladder for better cashback rates.',
  'You can verify any past round\'s fairness from its history page.',
];

const BULB_COUNT = 14;

export function LoadingScreen({
  isVisible,
  progress = 45,
  message,
  gameName,
  loadingImage,
  accentColor = '#f59e0b',
  secondaryColor = '#d97706',
}: LoadingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(progress);
  const [imgReady, setImgReady] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  // Smoothly track external progress updates
  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  // Preload the per-game medallion artwork
  useEffect(() => {
    setImgReady(false);
    setImgFailed(false);
    if (!loadingImage) return;
    const img = new window.Image();
    img.onload = () => setImgReady(true);
    img.onerror = () => setImgFailed(true);
    img.src = loadingImage;
  }, [loadingImage]);

  // Rotate the tip line
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % DEFAULT_TIPS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  if (!isVisible) return null;

  const showImage = !!loadingImage && imgReady && !imgFailed;
  const title = gameName || 'DashBets Games';
  const clampedProgress = Math.max(0, Math.min(100, Math.round(displayProgress)));

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{ background: '#0a0815', fontFamily: "'Exo 2', sans-serif" }}
      >
        {/* Faint structural grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '56px 56px',
          }}
        />

        {/* Theme-colored ambient glow, driven by the active game's palette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 45% at 50% 28%, ${accentColor}22 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 55% 40% at 50% 100%, ${secondaryColor}18 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-md">
          {/* ── MARQUEE BANNER ─────────────────────────────────────── */}
          <div
            className="relative mb-9 px-6 py-3.5 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: `0 0 24px ${accentColor}1f`,
            }}
          >
            <div className="flex justify-center gap-[3px] mb-2">
              {Array.from({ length: BULB_COUNT }).map((_, i) => (
                <span
                  key={`top-${i}`}
                  className="block w-1 h-1 rounded-full bulb"
                  style={{ background: accentColor, animationDelay: `${i * 0.09}s` }}
                />
              ))}
            </div>
            <p
              className="text-center text-[15px] font-extrabold uppercase tracking-[0.34em] whitespace-nowrap"
              style={{ fontFamily: "'Rajdhani', sans-serif", color: '#f4f4f5' }}
            >
              DashBets
            </p>
            <div className="flex justify-center gap-[3px] mt-2">
              {Array.from({ length: BULB_COUNT }).map((_, i) => (
                <span
                  key={`bot-${i}`}
                  className="block w-1 h-1 rounded-full bulb"
                  style={{ background: secondaryColor, animationDelay: `${i * 0.09 + 0.4}s` }}
                />
              ))}
            </div>
          </div>

          {/* ── MEDALLION (per-game artwork) ──────────────────────── */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-8 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full ring-spin"
              style={{
                background: `conic-gradient(${accentColor}, ${secondaryColor}, transparent 60%, ${accentColor})`,
              }}
            />
            <div className="absolute inset-[3px] rounded-full" style={{ background: '#0a0815' }} />
            <div
              className="absolute inset-[3px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${accentColor}33, transparent 70%)`,
                animation: 'medallionPulse 2.2s ease-in-out infinite',
              }}
            />

            {showImage ? (
              <div
                className="absolute inset-[6px] rounded-full overflow-hidden img-pop"
                style={{
                  border: `1px solid ${accentColor}55`,
                  backgroundImage: `url(${loadingImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: `inset 0 0 24px rgba(0,0,0,0.5)`,
                }}
              />
            ) : (
              <div
                className="absolute inset-[6px] rounded-full flex items-center justify-center text-7xl"
                style={{ border: `1px solid ${accentColor}55`, background: 'rgba(255,255,255,0.02)' }}
              >
                🎰
              </div>
            )}
          </div>

          {/* ── TITLE + MESSAGE ────────────────────────────────────── */}
          <h2
            className="text-xl font-extrabold uppercase tracking-wide text-center mb-1.5"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: '#f4f4f5' }}
          >
            {title}
          </h2>
          <p className="text-gray-400 text-[13px] text-center mb-8 leading-relaxed max-w-[280px]">
            {message || 'Setting up your gaming experience...'}
          </p>

          {/* ── PROGRESS ───────────────────────────────────────────── */}
          <div className="w-full mb-7">
            <div className="flex justify-between mb-2 px-0.5">
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: accentColor, fontFamily: "'DM Mono', monospace" }}
              >
                Loading
              </span>
              <span
                className="text-[10px] tabular-nums"
                style={{ color: accentColor, fontFamily: "'DM Mono', monospace" }}
              >
                {clampedProgress}%
              </span>
            </div>
            <div
              className="relative h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${clampedProgress}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`,
                  boxShadow: `0 0 12px ${accentColor}99`,
                }}
              />
              <div
                className="absolute inset-0 opacity-30 shimmer"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
              />
            </div>
          </div>

          {/* ── TIP ────────────────────────────────────────────────── */}
          <div
            className="px-4 py-2.5 rounded-xl text-center w-full"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p key={tipIndex} className="text-[11px] text-gray-400 leading-relaxed tip-fade">
              <span style={{ color: accentColor }}>★</span> {DEFAULT_TIPS[tipIndex]}
            </p>
          </div>
        </div>

        <style jsx>{`
          .bulb {
            animation: bulbChase 1.6s linear infinite;
            opacity: 0.25;
          }
          @keyframes bulbChase {
            0%, 80% { opacity: 0.25; }
            88% { opacity: 1; }
            100% { opacity: 0.25; }
          }
          .ring-spin {
            animation: ringSpin 3.4s linear infinite;
          }
          @keyframes ringSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes medallionPulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.65; }
          }
          .img-pop {
            animation: imgPop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }
          @keyframes imgPop {
            from { opacity: 0; transform: scale(0.85); }
            to { opacity: 1; transform: scale(1); }
          }
          .shimmer {
            animation: shimmerMove 2s infinite;
          }
          @keyframes shimmerMove {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .tip-fade {
            animation: tipFadeIn 0.4s ease;
          }
          @keyframes tipFadeIn {
            from { opacity: 0; transform: translateY(3px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .bulb, .ring-spin, .shimmer, .tip-fade, .img-pop {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}