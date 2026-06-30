/**
 * pages/games/bingo/result.tsx — Premium casino result screen
 * Win: confetti, animated counter, trophy hero, winner profile
 * Lose: elegant neutral, premium dark — not depressing
 * All logic preserved; pure UI upgrade.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { BingoCard } from '../../../components/bingo/BingoCard';
import { patternLabel } from '../../../lib/api/bingoApi';
import type { WinPattern } from '../../../lib/api/bingoApi';

interface BingoResult {
  won: boolean;
  jackpotPool: number;
  prizePerCard: number;
  winnerName: string;
  winnerMaskedPhone: string;
  winnerCard: number[][];
  winnerCardNumber: number;
  winnerMatchedIndices: number[];
  myCard: number[][];
  myCardNumber: number;
  myMatchedCells: boolean[][];
  stakeAmount: number;
  pattern: WinPattern | null;
}

function isValidGrid(card: unknown): card is number[][] {
  return (
    Array.isArray(card) &&
    card.length === 5 &&
    card.every((row) => Array.isArray(row) && row.length === 5)
  );
}

// ─── Animated count-up ────────────────────────────────────────────────────────

function AnimatedNumber({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    startRef.current = start;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return <>{current.toLocaleString()}</>;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F7B500', '#7C3AED', '#00E676', '#FF5252', '#fff', '#4F46E5'];
    const particles: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rotation: number; rotationSpeed: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotationSpeed;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ opacity: 0.8 }}
    />
  );
}

// ─── Win pattern mini display ─────────────────────────────────────────────────

function PatternMini({ pattern }: { pattern: WinPattern }) {
  const highlighted = new Set<number>();
  switch (pattern) {
    case 'horizontal': [10, 11, 12, 13, 14].forEach((i) => highlighted.add(i)); break;
    case 'vertical':   [2, 7, 12, 17, 22].forEach((i) => highlighted.add(i)); break;
    case 'diagonal':   [0, 6, 12, 18, 24].forEach((i) => highlighted.add(i)); break;
    case 'fourCorners': [0, 4, 20, 24].forEach((i) => highlighted.add(i)); break;
  }
  return (
    <div className="grid grid-cols-5 gap-0.5 w-12 h-12">
      {Array.from({ length: 25 }, (_, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            background: i === 12
              ? 'rgba(124,58,237,0.5)'
              : highlighted.has(i)
              ? '#F7B500'
              : 'rgba(255,255,255,0.08)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BingoResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<BingoResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bingoResult');
      if (raw) { setResult(JSON.parse(raw)); setMounted(true); }
      else router.replace('/games/bingo');
    } catch {
      router.replace('/games/bingo');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080C' }}>
        <div className="w-8 h-8 border-2 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
      </div>
    );
  }

  const {
    won, jackpotPool, prizePerCard, winnerName, winnerMaskedPhone,
    winnerCard, winnerCardNumber, winnerMatchedIndices,
    myCard, myCardNumber, myMatchedCells, pattern, stakeAmount,
  } = result;

  const winningCells = winnerMatchedIndices.length > 0
    ? (() => {
        const set = new Set(winnerMatchedIndices);
        return Array.from({ length: 5 }, (_, r) =>
          Array.from({ length: 5 }, (__, c) => set.has(r * 5 + c))
        );
      })()
    : null;

  const profit = prizePerCard - stakeAmount;

  return (
    <>
      <Head><title>{won ? '🏆 You Won!' : 'Game Result'} — DashBets Bingo</title></Head>

      <div
        className="min-h-screen text-white flex flex-col"
        style={{ background: '#08080C', fontFamily: "'Exo 2', sans-serif" }}
      >
        {/* Confetti on win */}
        {won && mounted && <Confetti />}

        {/* Subtle background gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: won
              ? 'radial-gradient(ellipse at 50% 0%, rgba(247,181,0,0.08) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-20 flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

            {/* ── HERO ── */}
            <div className="text-center space-y-3 py-6">
              <div
                className="text-8xl mx-auto"
                style={{ filter: won ? 'drop-shadow(0 0 30px rgba(247,181,0,0.5))' : 'none' }}
              >
                {won ? '🏆' : '🎱'}
              </div>
              <h1
                className="text-5xl font-black leading-none"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.08em',
                  color: won ? '#F7B500' : '#fff',
                  textShadow: won ? '0 0 40px rgba(247,181,0,0.4)' : 'none',
                }}
              >
                {won ? 'YOU WON!' : 'GAME OVER'}
              </h1>
              {won && (
                <p className="text-sm text-gray-400">Congratulations! You are a winner ⭐</p>
              )}
            </div>

            {/* ── PRIZE CARD (win only) ── */}
            {won && (
              <div
                className="rounded-2xl p-6 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(247,181,0,0.12) 0%, rgba(16,18,26,0.95) 100%)',
                  border: '1px solid rgba(247,181,0,0.3)',
                  boxShadow: '0 8px 40px rgba(247,181,0,0.1)',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(247,181,0,0.06) 0%, transparent 70%)' }}
                />
                <p className="text-xs text-yellow-700 uppercase tracking-widest font-mono mb-2 relative">You Won</p>
                <p
                  className="text-5xl font-black relative"
                  style={{ color: '#F7B500', fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <AnimatedNumber target={prizePerCard} />
                  <span className="text-2xl ml-2 opacity-70">ETB</span>
                </p>
                {profit > 0 && (
                  <p className="text-sm font-bold mt-2 relative" style={{ color: '#00E676' }}>
                    +{profit.toLocaleString()} ETB profit
                  </p>
                )}
              </div>
            )}

            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Pool', value: `${jackpotPool.toLocaleString()} ETB`, color: '#F7B500' },
                { label: 'Prize/Card', value: `${prizePerCard.toLocaleString()} ETB`, color: won ? '#00E676' : '#94A3B8' },
                { label: 'Your Stake', value: `${stakeAmount.toLocaleString()} ETB`, color: '#94A3B8' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest font-mono mb-1">{s.label}</p>
                  <p className="text-sm font-black" style={{ color: s.color, fontFamily: "'Rajdhani', sans-serif" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── WINNER PROFILE ── */}
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: won
                    ? 'linear-gradient(135deg, rgba(247,181,0,0.3), rgba(124,58,237,0.2))'
                    : 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))',
                  border: won ? '2px solid rgba(247,181,0,0.4)' : '2px solid rgba(124,58,237,0.3)',
                }}
              >
                {won ? '👑' : '🤖'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-black text-white truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {winnerName}
                  </p>
                  {won && (
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(247,181,0,0.2)', color: '#F7B500', border: '1px solid rgba(247,181,0,0.3)' }}
                    >
                      WINNER
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono" style={{ color: '#475569' }}>{winnerMaskedPhone}</p>
              </div>
              {prizePerCard > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black" style={{ color: '#F7B500', fontFamily: "'Rajdhani', sans-serif" }}>
                    {prizePerCard.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase font-mono">ETB</p>
                </div>
              )}
            </div>

            {/* ── WIN PATTERN ── */}
            {pattern && (
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <PatternMini pattern={pattern} />
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest font-mono mb-1">Winning Pattern</p>
                  <p className="font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {patternLabel(pattern)}
                  </p>
                </div>
              </div>
            )}

            {/* ── WINNING CARD ── */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: won ? 'rgba(247,181,0,0.03)' : 'rgba(255,255,255,0.02)',
                borderColor: won ? 'rgba(247,181,0,0.2)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: won ? '#F7B500' : '#94A3B8' }}>
                  {won ? `Your Winning Card — #${winnerCardNumber}` : `Your Card — #${myCardNumber}`}
                </p>
                {won && (
                  <span className="text-[9px] font-bold" style={{ color: '#00E676' }}>✓ Verified</span>
                )}
              </div>
              <div className="p-5 flex justify-center">
                {won ? (
                  isValidGrid(winnerCard) ? (
                    <BingoCard
                      card={winnerCard}
                      drawnBalls={[]}
                      winningCells={winningCells}
                      activePattern={pattern}
                    />
                  ) : (
                    <p className="text-gray-600 text-sm py-8">Card data unavailable</p>
                  )
                ) : (
                  isValidGrid(myCard) ? (
                    <BingoCard
                      card={myCard}
                      drawnBalls={[]}
                      matchedCells={myMatchedCells}
                      activePattern={pattern}
                    />
                  ) : (
                    <p className="text-gray-600 text-sm py-8">Card data unavailable</p>
                  )
                )}
              </div>
            </div>

            {/* ── CTA BUTTONS ── */}
            <div className="space-y-2.5 pb-4">
              <button
                onClick={() => {
                  sessionStorage.removeItem('bingoResult');
                  router.push('/games/bingo');
                }}
                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.99] flex items-center justify-center gap-3"
                style={{
                  background: won
                    ? 'linear-gradient(135deg, #F7B500, #d97706)'
                    : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  color: won ? '#000' : '#fff',
                  boxShadow: won ? '0 6px 30px rgba(247,181,0,0.35)' : '0 6px 30px rgba(124,58,237,0.35)',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.08em',
                }}
              >
                <span className="text-xl">🎱</span>
                PLAY AGAIN
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}
              >
                Back to Dashboard
              </button>

              {won && (
                <button
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)', color: '#00E676' }}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'I won on DashBets!', text: `I just won ${prizePerCard.toLocaleString()} ETB playing Bingo on DashBets!` });
                    }
                  }}
                >
                  <span>🔗</span>
                  Share Your Win
                </button>
              )}
            </div>

            {/* Promo banner for losers */}
            {!won && (
              <div
                className="rounded-2xl p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(79,70,229,0.06) 100%)',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                <p className="text-sm font-black text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  🔥 You&apos;re on fire!
                </p>
                <p className="text-xs text-gray-400">Keep playing to win bigger jackpots. Your next win is closer than you think.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
