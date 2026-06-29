/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/games/limbo.tsx
 *
 * Limbo — Deep purple space UI with climbing multiplier animation.
 * Now with proper background image and loading screen.
 * Auth pattern mirrors keno.tsx exactly: useAuthContext → redirect if not authenticated.
 * Socket logic via useLimboSocket hook.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { useLimboSocket, type LimboHistoryEntry } from '../../hooks/useLimboSocket';
import { GamePageWrapper } from '../../components/games/GamePageWrapper';
import { getGameById } from '../../config/gameConfig';

const LIMBO_CONFIG = getGameById('limbo')!;

// ── Design tokens ─────────────────────────────────────────────────────────────
const PURPLE  = '#7c3aed';
const PURPLE2 = '#5b21b6';
const GOLD    = '#f5c842';
const DARK    = '#0d0b1e';
const CARD    = 'rgba(255,255,255,0.04)';
const BORDER  = 'rgba(124,58,237,0.25)';
const BORDER2 = 'rgba(255,255,255,0.08)';

// ── Crash point badge color ───────────────────────────────────────────────────
function crashColor(cp: number) {
  if (cp >= 10)  return { bg: '#7c3aed', text: '#fff', glow: 'rgba(124,58,237,0.5)' };
  if (cp >= 3)   return { bg: '#16a34a', text: '#fff', glow: 'rgba(22,163,74,0.5)' };
  if (cp >= 2)   return { bg: '#0891b2', text: '#fff', glow: 'rgba(8,145,178,0.5)' };
  if (cp >= 1.5) return { bg: '#d97706', text: '#fff', glow: 'rgba(217,119,6,0.5)' };
  return { bg: '#dc2626', text: '#fff', glow: 'rgba(220,38,38,0.5)' };
}

// ── Crash point badge ─────────────────────────────────────────────────────────
function CrashBadge({ cp }: { cp: number }) {
  const c = crashColor(cp);
  return (
    <div
      className="px-2.5 py-1 rounded-lg text-xs font-black flex-shrink-0"
      style={{ background: c.bg, color: c.text, boxShadow: `0 0 8px ${c.glow}`, fontFamily: "'Rajdhani', sans-serif" }}
    >
      {cp.toFixed(2)}×
    </div>
  );
}

// ── Multiplier display with animation ────────────────────────────────────────
function MultiplierDisplay({
  phase, crashPoint, targetMultiplier, lastResult,
}: {
  phase: string; crashPoint: number | null; targetMultiplier: number;
  lastResult: any;
}) {
  const animRef      = useRef<number | null>(null);
  const [display, setDisplay] = useState(1.00);
  const startTimeRef = useRef<number>(0);

  // Animate climb when revealing
  useEffect(() => {
    if (phase === 'revealing' && crashPoint) {
      startTimeRef.current = performance.now();
      const duration = Math.min(1500, Math.log(crashPoint + 1) * 600);

      const animate = (now: number) => {
        const elapsed  = now - startTimeRef.current;
        const progress = Math.min(1, elapsed / duration);
        // Ease-out curve so it slows near the end
        const eased    = 1 - Math.pow(1 - progress, 2);
        const current  = 1 + (crashPoint - 1) * eased;
        setDisplay(Math.max(1, current));
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setDisplay(crashPoint);
        }
      };
      animRef.current = requestAnimationFrame(animate);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }

    if (phase === 'betting') {
      setDisplay(1.00);
    }
  }, [phase, crashPoint]);

  const isWin  = lastResult?.isWin && phase === 'result';
  const isLoss = lastResult && !lastResult.isWin && phase === 'result';

  const numColor = isWin ? '#22c55e' : isLoss ? '#ef4444' : GOLD;
  const showResult = phase === 'result' || phase === 'revealing';

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {/* Big multiplier number */}
      <div
        className="text-5xl sm:text-6xl md:text-7xl font-black tabular-nums leading-none transition-colors"
        style={{
          color: numColor,
          fontFamily: "'Rajdhani', sans-serif",
          textShadow: `0 0 40px ${numColor}60`,
          letterSpacing: '-0.02em',
        }}
      >
        {showResult && crashPoint
          ? `${(display).toFixed(2)}×`
          : phase === 'betting'
          ? `${targetMultiplier.toFixed(2)}×`
          : '—'}
      </div>

      {/* Sub-label */}
      <div
        className="text-sm font-bold uppercase tracking-widest"
        style={{
          color: phase === 'betting' ? 'rgba(255,255,255,0.3)'
               : isWin ? '#22c55e' : isLoss ? '#ef4444' : GOLD,
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        {phase === 'betting'   ? 'TARGET MULTIPLIER'
       : phase === 'revealing' ? 'CRASH POINT'
       : isWin  ? '🏆 WIN!'
       : isLoss ? '💥 CRASHED!'
       : 'RESULT'}
      </div>

      {/* Win/loss payout badge */}
      {phase === 'result' && lastResult && (
        <div
          className="px-5 py-2 rounded-full text-sm font-black"
          style={{
            background: isWin ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.1)',
            border: `1px solid ${isWin ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`,
            color: isWin ? '#22c55e' : '#ef4444',
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {isWin
            ? `+${lastResult.payout.toLocaleString()} ETB`
            : `−${lastResult.betAmount.toLocaleString()} ETB`}
        </div>
      )}
    </div>
  );
}

// ── Countdown bar ─────────────────────────────────────────────────────────────
function CountdownBar({ msLeft, total = 3000 }: { msLeft: number; total?: number }) {
  const pct     = Math.min(100, (msLeft / total) * 100);
  const urgent  = msLeft < 1000 && msLeft > 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          Betting closes in
        </span>
        <span
          className={`text-xs font-black ${urgent ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          {(msLeft / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: urgent
              ? 'linear-gradient(90deg, #dc2626, #ef4444)'
              : `linear-gradient(90deg, ${PURPLE2}, ${PURPLE})`,
          }}
        />
      </div>
    </div>
  );
}

// ── Target input ──────────────────────────────────────────────────────────────
function TargetInput({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const presets = [1.5, 2, 3, 5, 10, 100];

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
        Target Multiplier
      </label>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
        style={{ background: 'rgba(0,0,0,0.3)', borderColor: disabled ? BORDER2 : BORDER }}
      >
        <button
          onClick={() => onChange(Math.max(1.01, parseFloat((value - 0.5).toFixed(2))))}
          disabled={disabled}
          className="w-8 h-8 rounded-lg font-black text-lg transition-all disabled:opacity-30"
          style={{ background: `rgba(124,58,237,0.2)`, color: PURPLE }}
        >−</button>
        <input
          type="number"
          min={1.01}
          max={1000}
          step={0.1}
          value={value}
          onChange={e => onChange(Math.max(1.01, Math.min(1000, parseFloat(e.target.value) || 1.01)))}
          disabled={disabled}
          className="flex-1 bg-transparent text-center text-2xl font-black focus:outline-none disabled:opacity-50"
          style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}
        />
        <span className="text-lg font-black" style={{ color: GOLD }}>×</span>
        <button
          onClick={() => onChange(Math.min(1000, parseFloat((value + 0.5).toFixed(2))))}
          disabled={disabled}
          className="w-8 h-8 rounded-lg font-black text-lg transition-all disabled:opacity-30"
          style={{ background: `rgba(124,58,237,0.2)`, color: PURPLE }}
        >+</button>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            disabled={disabled}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-30 hover:opacity-80"
            style={{
              background: value === p ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.06)',
              color: value === p ? '#fff' : '#6b7280',
              border: `1px solid ${value === p ? PURPLE : BORDER2}`,
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            {p}×
          </button>
        ))}
      </div>
    </div>
  );
}

// ── History entry ─────────────────────────────────────────────────────────────
function HistoryEntry({ entry }: { entry: LimboHistoryEntry }) {
  const won = entry.isWin;
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-lg border"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: BORDER2 }}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: won ? '#22c55e' : '#ef4444' }} />
        <div>
          <p className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Target: {entry.target.toFixed(2)}×
          </p>
          <p className="text-[10px] font-mono text-gray-600">
            Crash: {entry.crashPoint.toFixed(2)}× · Round #{entry.roundNumber}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-black"
          style={{ color: won ? '#22c55e' : '#ef4444', fontFamily: "'Rajdhani', sans-serif" }}
        >
          {won ? `+${(entry.payout - entry.betAmount).toLocaleString()}` : `−${entry.betAmount.toLocaleString()}`} ETB
        </p>
        <p className="text-[10px] font-mono text-gray-600">
          Bet: {entry.betAmount.toLocaleString()} ETB
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const LimboPage: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();

  const [balance, setBalance] = useState(0);
  const [tab, setTab]         = useState<'game' | 'history'>('game');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?next=/games/limbo');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.balance !== undefined) setBalance(user.balance);
  }, [user?.balance]);

  const handleBalanceUpdate = useCallback((nb: number) => setBalance(nb), []);

  const token = typeof window !== 'undefined' ? localStorage.getItem('dashbets_token') : null;
  
  const {
    state, winChance, potentialPayout,
    placeBet, setTarget, setBetAmount, clearError,
  } = useLimboSocket(isAuthenticated ? token : null, handleBalanceUpdate);

  const canBet = state.phase === 'betting' && !state.hasBet && state.connected;

  const handlePlaceBet = useCallback(() => {
    if (!canBet) return;
    placeBet(state.betAmount, state.targetMultiplier);
  }, [canBet, placeBet, state.betAmount, state.targetMultiplier]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: DARK }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-purple-400 border-purple-400/20 animate-spin" />
      </div>
    );
  }

  return (
    <GamePageWrapper game={LIMBO_CONFIG} loadingDuration={2500}>
      <Head><title>Limbo — DashBets</title></Head>
      
      <style jsx global>{`
        @keyframes starFloat { 
          0%,100% { opacity: 0.3; transform: translateY(0); } 
          50% { opacity: 0.6; transform: translateY(-4px); } 
        }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(8px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes glow { 
          0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); } 
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.6); } 
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div 
        className="min-h-screen relative" 
        style={{ 
          background: 'transparent',
          fontFamily: "'Exo 2', sans-serif" 
        }}
      >
        {/* Stars background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.2)',
                top:  `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                animation: `starFloat ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* ── Top bar ─────────────────────────────────────────────────────── */}
          <div
            className="relative flex items-center justify-between px-4 py-3 border-b"
            style={{ background: 'rgba(13,11,30,0.8)', borderColor: BORDER, backdropFilter: 'blur(10px)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER2}` }}
              >
                <span className="text-gray-400 text-sm">←</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <div>
                  <h1 className="text-base font-black text-white leading-none" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em' }}>
                    LIMBO
                  </h1>
                  <p className="text-[10px] font-mono" style={{ color: PURPLE }}>
                    {state.connected ? '● Live' : '○ Connecting…'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Round number */}
              {state.roundNumber && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{ background: CARD, borderColor: BORDER }}>
                  <span className="text-[9px] font-mono text-gray-500">ROUND</span>
                  <span className="text-xs font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    #{state.roundNumber}
                  </span>
                </div>
              )}

              {/* Balance */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.3)' }}
              >
                <span className="text-base">🪙</span>
                <div>
                  <p className="text-[9px] font-mono text-gray-500 leading-none">BALANCE</p>
                  <p className="text-sm font-black leading-none" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>
                    {balance.toLocaleString()} ETB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Error banner ─────────────────────────────────────────────────── */}
          {state.error && (
            <div
              className="flex items-center justify-between gap-3 mx-4 mt-3 rounded-xl px-4 py-3 border"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <p className="text-red-300 text-sm font-mono">{state.error}</p>
              <button onClick={clearError} className="text-red-500 hover:text-red-300 text-lg">✕</button>
            </div>
          )}

          {/* ── Main 3-column layout ─────────────────────────────────────────── */}
          <div className="relative flex flex-col lg:flex-row gap-3 lg:gap-4 p-3 sm:p-4 max-w-6xl mx-auto">

            {/* ══ LEFT — Controls ══ */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-3 order-2 lg:order-1">
              {/* How to play */}
              <div className="rounded-2xl border p-4 space-y-3" style={{ background: CARD, borderColor: BORDER }}>
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: PURPLE }}>How To Play</p>
                {[
                  { icon: '🎯', text: 'Set your target multiplier before the round starts.' },
                  { icon: '⏱️', text: 'Place your bet during the 3-second betting window.' },
                  { icon: '🚀', text: 'If crash point ≥ your target — you win!' },
                  { icon: '💥', text: 'If crash point < target — you lose your bet.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Win probability */}
              <div
                className="rounded-2xl border p-4 space-y-3"
                style={{ background: 'rgba(124,58,237,0.06)', borderColor: BORDER }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: PURPLE }}>Win Chance</p>
                <div className="text-center">
                  <p
                    className="text-4xl font-black"
                    style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {winChance.toFixed(2)}%
                  </p>
                  <p className="text-[10px] font-mono text-gray-600 mt-1">
                    at {state.targetMultiplier.toFixed(2)}× target
                  </p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${winChance}%`,
                      background: `linear-gradient(90deg, ${PURPLE2}, ${PURPLE})`,
                    }}
                  />
                </div>
              </div>

              {/* Potential win */}
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ background: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.2)' }}
              >
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Potential Win</p>
                <p className="text-3xl font-black" style={{ color: '#22c55e', fontFamily: "'Rajdhani', sans-serif" }}>
                  {potentialPayout.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono text-gray-600">ETB at {state.targetMultiplier.toFixed(2)}×</p>
              </div>

              {/* Provably fair */}
              {state.serverSeedHash && (
                <div className="rounded-2xl border p-3 space-y-1" style={{ background: CARD, borderColor: BORDER2 }}>
                  <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">🔒 Provably Fair</p>
                  <p className="text-[9px] font-mono text-gray-500 break-all">{state.serverSeedHash.slice(0, 24)}…</p>
                  {state.serverSeed && (
                    <>
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-1">Revealed Seed</p>
                      <p className="text-[9px] font-mono text-green-500 break-all">{state.serverSeed.slice(0, 24)}…</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ══ CENTER — Game display ══ */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 rounded-xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: BORDER }}>
                {(['game', 'history'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                    style={{
                      background: tab === t ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'transparent',
                      color: tab === t ? '#fff' : '#4b5563',
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    {t === 'game' ? '🚀 Game' : '📋 History'}
                  </button>
                ))}
              </div>

              {tab === 'history' ? (
                <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: BORDER, background: 'rgba(124,58,237,0.06)' }}>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: PURPLE, fontFamily: "'Rajdhani', sans-serif" }}>
                      My Bet History
                    </p>
                  </div>
                  <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                    {state.history.length === 0 ? (
                      <p className="text-center text-gray-600 font-mono text-sm py-8">No bets yet — place a bet to get started!</p>
                    ) : (
                      state.history.map((entry, i) => (
                        <HistoryEntry key={`${entry.roundNumber}-${i}`} entry={entry} />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Main multiplier display */}
                  <div
                    className="rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden"
                    style={{
                      background: `radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.12) 0%, rgba(13,11,30,0.95) 70%)`,
                      borderColor: BORDER,
                      minHeight: 280,
                      boxShadow: `0 0 60px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    }}
                  >
                    {/* Phase status */}
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest"
                      style={{
                        background: state.phase === 'betting'   ? 'rgba(22,163,74,0.15)'
                                  : state.phase === 'revealing' ? 'rgba(124,58,237,0.15)'
                                  : 'rgba(245,200,66,0.1)',
                        borderColor: state.phase === 'betting'   ? 'rgba(34,197,94,0.3)'
                                   : state.phase === 'revealing' ? 'rgba(124,58,237,0.3)'
                                   : 'rgba(245,200,66,0.2)',
                        color: state.phase === 'betting'   ? '#22c55e'
                             : state.phase === 'revealing' ? PURPLE
                             : GOLD,
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      {state.phase === 'betting'   ? '🟢 BETTING OPEN'
                     : state.phase === 'revealing' ? '🚀 REVEALING'
                     : state.phase === 'result'    ? (state.lastResult?.isWin ? '✅ WIN' : '❌ LOSS')
                     : '⏳ WAITING'}
                    </div>

                    {/* Bet count */}
                    {state.betCountInRound > 0 && (
                      <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600">
                        👥 {state.betCountInRound} bet{state.betCountInRound !== 1 ? 's' : ''}
                      </div>
                    )}

                    <MultiplierDisplay
                      phase={state.phase}
                      crashPoint={state.crashPoint}
                      targetMultiplier={state.targetMultiplier}
                      lastResult={state.lastResult}
                    />

                    {/* Betting countdown */}
                    {state.phase === 'betting' && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <CountdownBar msLeft={state.bettingClosesIn} total={3000} />
                      </div>
                    )}

                    {/* Already bet badge */}
                    {state.hasBet && state.phase === 'betting' && (
                      <div
                        className="absolute bottom-12 px-4 py-1.5 rounded-full text-xs font-black"
                        style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        ✓ BET PLACED — Waiting for draw…
                      </div>
                    )}
                  </div>

                  {/* Recent crash points */}
                  {state.history.length > 0 && (
                    <div className="rounded-xl border p-3" style={{ background: CARD, borderColor: BORDER2 }}>
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2">Recent Multipliers</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {state.history.slice(0, 12).map((h, i) => (
                          <CrashBadge key={i} cp={h.crashPoint} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bet controls */}
                  <div
                    className="rounded-2xl border p-4 space-y-4"
                    style={{ background: CARD, borderColor: BORDER }}
                  >
                    {/* Target multiplier */}
                    <TargetInput
                      value={state.targetMultiplier}
                      onChange={setTarget}
                      disabled={!canBet}
                    />

                    {/* Bet amount */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Bet Amount</label>
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
                        style={{ background: 'rgba(0,0,0,0.3)', borderColor: canBet ? BORDER : BORDER2 }}
                      >
                        <button
                          onClick={() => setBetAmount(state.betAmount - 10)}
                          disabled={!canBet}
                          className="w-8 h-8 rounded-lg font-black text-lg disabled:opacity-30"
                          style={{ background: 'rgba(124,58,237,0.15)', color: PURPLE }}
                        >−</button>
                        <input
                          type="number"
                          min={1}
                          max={balance}
                          value={state.betAmount}
                          onChange={e => setBetAmount(Number(e.target.value))}
                          disabled={!canBet}
                          className="flex-1 bg-transparent text-center text-xl font-black focus:outline-none disabled:opacity-50"
                          style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}
                        />
                        <span className="text-xs font-mono text-gray-500">ETB</span>
                        <button
                          onClick={() => setBetAmount(state.betAmount + 10)}
                          disabled={!canBet}
                          className="w-8 h-8 rounded-lg font-black text-lg disabled:opacity-30"
                          style={{ background: 'rgba(124,58,237,0.15)', color: PURPLE }}
                        >+</button>
                      </div>

                      {/* Quick amounts */}
                      <div className="flex gap-1.5">
                        {[10, 50, 100, 500, 1000].map(v => (
                          <button
                            key={v}
                            onClick={() => setBetAmount(v)}
                            disabled={!canBet || v > balance}
                            className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-30"
                            style={{
                              background: state.betAmount === v ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.06)',
                              color: state.betAmount === v ? '#fff' : '#6b7280',
                              border: `1px solid ${state.betAmount === v ? PURPLE : BORDER2}`,
                              fontFamily: "'Rajdhani', sans-serif",
                            }}
                          >
                            {v >= 1000 ? `${v/1000}K` : v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Place bet button */}
                    <button
                      onClick={handlePlaceBet}
                      disabled={!canBet}
                      className="w-full py-4 rounded-2xl text-lg font-black tracking-widest transition-all active:scale-95 disabled:opacity-40"
                      style={{
                        background: canBet
                          ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`
                          : 'rgba(255,255,255,0.06)',
                        color: canBet ? '#fff' : '#4b5563',
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.1em',
                        boxShadow: canBet ? `0 6px 24px rgba(124,58,237,0.4)` : 'none',
                        animation: canBet ? 'glow 2s ease-in-out infinite' : 'none',
                      }}
                    >
                      {state.hasBet        ? '✓ BET PLACED'
                     : !state.connected    ? 'CONNECTING…'
                     : state.phase !== 'betting' ? 'WAIT FOR NEXT ROUND'
                     : `BET ${state.betAmount.toLocaleString()} ETB @ ${state.targetMultiplier.toFixed(2)}×`}
                    </button>

                    {/* Balance check */}
                    {state.betAmount > balance && (
                      <p className="text-center text-red-400 text-xs font-mono">
                        Insufficient balance
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ══ RIGHT — Live bets & stats ══ */}
            <div className="w-56 flex-shrink-0 space-y-3">
              {/* Live bets count */}
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ background: CARD, borderColor: BORDER }}
              >
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Players This Round</p>
                <p className="text-4xl font-black" style={{ color: PURPLE, fontFamily: "'Rajdhani', sans-serif" }}>
                  {state.betCountInRound}
                </p>
                <p className="text-[10px] font-mono text-gray-600">active bets</p>
              </div>

              {/* Recent rounds list */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: BORDER, background: 'rgba(124,58,237,0.06)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: PURPLE, fontFamily: "'Rajdhani', sans-serif" }}>
                    Recent Rounds
                  </p>
                </div>
                <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                  {state.history.length === 0 ? (
                    <p className="text-center text-gray-600 font-mono text-xs py-4">No rounds yet</p>
                  ) : (
                    state.history.slice(0, 15).map((h, i) => {
                      const c = crashColor(h.crashPoint);
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-gray-600">#{h.roundNumber}</span>
                          <div
                            className="px-2 py-0.5 rounded text-[10px] font-black"
                            style={{ background: c.bg, color: c.text, fontFamily: "'Rajdhani', sans-serif" }}
                          >
                            {h.crashPoint.toFixed(2)}×
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="rounded-2xl border p-4 space-y-2" style={{ background: CARD, borderColor: BORDER }}>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Your Stats</p>
                {(() => {
                  const wins   = state.history.filter(h => h.isWin).length;
                  const total  = state.history.length;
                  const profit = state.history.reduce((s, h) => s + (h.isWin ? h.payout - h.betAmount : -h.betAmount), 0);
                  return [
                    { label: 'Rounds',   value: total },
                    { label: 'Wins',     value: wins },
                    { label: 'Win Rate', value: total > 0 ? `${Math.round((wins/total)*100)}%` : '—' },
                    { label: 'P/L',      value: `${profit >= 0 ? '+' : ''}${profit.toLocaleString()} ETB`, color: profit >= 0 ? '#22c55e' : '#ef4444' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-600">{item.label}</span>
                      <span
                        className="text-xs font-black"
                        style={{ color: item.color ?? GOLD, fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ));
                })()}
              </div>

              {/* RTP info */}
              <div
                className="rounded-2xl border p-4 space-y-2"
                style={{ background: 'rgba(245,200,66,0.04)', borderColor: 'rgba(245,200,66,0.15)' }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: GOLD }}>Game Info</p>
                {[
                  ['RTP',       '99.00%'],
                  ['House Edge','1.00%'],
                  ['Min Bet',   '1 ETB'],
                  ['Max Target','1,000×'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-[10px] font-mono text-gray-600">{k}</span>
                    <span className="text-[10px] font-black" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GamePageWrapper>
  );
};

export default LimboPage;