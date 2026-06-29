/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/games/blackjack.tsx
 *
 * Blackjack Lite — Premium casino UI matching the green felt reference images.
 * Auth pattern mirrors keno.tsx exactly: useAuthContext → redirect if not authenticated.
 * Game logic via useBlackjack hook.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { GamePageWrapper } from '../../components/games/GamePageWrapper';
import { getGameById } from '../../config/gameConfig';
import { useBlackjack, type BJCard } from '../../hooks/useBlackjack';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD    = '#f5c842';
const GOLD2   = '#c8960c';
const FELT    = '#1a5c38';
const FELT2   = '#154d30';
const DARK    = '#0a0a12';
const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER  = 'rgba(245,200,66,0.15)';

// ── Suit symbols & colors ─────────────────────────────────────────────────────
const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};
const isRed = (suit?: string | null) =>
  suit === 'hearts' || suit === 'diamonds';

// ── Card component ────────────────────────────────────────────────────────────
function PlayingCard({
  card,
  size = 'md',
  animate = false,
}: {
  card: BJCard;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-12 h-16 text-sm',
    md: 'w-16 h-24 text-base',
    lg: 'w-20 h-28 text-lg',
  };

  if (card.hidden) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f35 100%)',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          animation: animate ? 'dealCard 0.3s ease-out' : undefined,
        }}
      >
        {/* Back pattern */}
        <div className="absolute inset-1 rounded opacity-30"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #3b82f6 0, #3b82f6 1px, transparent 0, transparent 50%)', backgroundSize: '6px 6px' }}
        />
        <span className="text-2xl opacity-40">🂠</span>
      </div>
    );
  }

  const suit   = card.suit ?? '';
  const rank   = card.rank ?? card.display?.replace(/[SHDC]$/, '') ?? '';
  const symbol = SUIT_SYMBOLS[suit] ?? card.display?.slice(-1) ?? '';
  const red    = isRed(suit);

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg flex-shrink-0 relative flex flex-col justify-between p-1.5 overflow-hidden`}
      style={{
        background: 'linear-gradient(160deg, #fffef0 0%, #f5f0dc 100%)',
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.8)',
        color: red ? '#cc2200' : '#111',
        animation: animate ? 'dealCard 0.25s ease-out' : undefined,
      }}
    >
      <div className="flex flex-col leading-none">
        <span className="font-black text-xs">{rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl opacity-15 font-black">{symbol}</span>
      </div>
      <div className="flex flex-col leading-none items-end rotate-180">
        <span className="font-black text-xs">{rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ total, bust, blackjack }: { total: number; bust?: boolean; blackjack?: boolean }) {
  const bg = blackjack ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})`
           : bust      ? 'linear-gradient(135deg, #dc2626, #991b1b)'
           : total > 17 ? 'linear-gradient(135deg, #16a34a, #15803d)'
           : 'rgba(0,0,0,0.6)';
  const color = blackjack ? '#000' : '#fff';

  return (
    <div
      className="px-3 py-1 rounded-full text-sm font-black text-center min-w-[48px]"
      style={{ background: bg, color, boxShadow: '0 2px 8px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {blackjack ? 'BJ!' : bust ? 'BUST' : total || '—'}
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  label, icon, onClick, disabled, color = '#374151', textColor = '#fff',
}: {
  label: string; icon: string; onClick: () => void;
  disabled?: boolean; color?: string; textColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-1"
      style={{
        background: disabled ? 'rgba(255,255,255,0.05)' : color,
        color: disabled ? '#4b5563' : textColor,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'}`,
        boxShadow: disabled ? 'none' : '0 4px 16px rgba(0,0,0,0.4)',
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: '0.08em',
        minHeight: 64,
      }}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  );
}

// ── Result overlay ────────────────────────────────────────────────────────────
function ResultOverlay({
  outcome, payout, betAmount, isBlackjack, isBust,
  serverSeed, 
  onPlayAgain,
}: {
  outcome: string | null; payout: number; betAmount: number;
  isBlackjack: boolean; isBust: boolean;
  serverSeed: string | null; serverSeedHash: string | null;
  onPlayAgain: () => void;
}) {
  const isWin  = outcome === 'player_win';
  const isPush = outcome === 'push';
  const profit = payout - betAmount;

  const title = isBlackjack ? '🃏 BLACKJACK!' : isBust ? '💥 BUST!' : isWin ? '🏆 YOU WIN!' : isPush ? '🤝 PUSH' : '😔 DEALER WINS';
  const subtext = isBlackjack ? 'Natural Blackjack!' : isBust ? 'Over 21 — better luck next time' : isWin ? `+${profit.toLocaleString()} ETB profit` : isPush ? 'Bet returned' : `−${betAmount.toLocaleString()} ETB`;

  const glowColor = isWin || isBlackjack ? 'rgba(245,200,66,0.3)' : isPush ? 'rgba(59,130,246,0.3)' : 'rgba(220,38,38,0.3)';
  const badgeBg   = isWin || isBlackjack ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : isPush ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #dc2626, #991b1b)';

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-2xl"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="flex flex-col items-center gap-4 p-8 rounded-2xl border max-w-sm w-full mx-4"
        style={{ background: 'rgba(10,10,18,0.95)', borderColor: BORDER, boxShadow: `0 0 60px ${glowColor}` }}
      >
        {/* Title */}
        <div
          className="px-6 py-2 rounded-full text-xl font-black text-center"
          style={{ background: badgeBg, color: isWin || isBlackjack ? '#000' : '#fff', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em' }}
        >
          {title}
        </div>

        <p className="text-sm font-mono text-gray-400 text-center">{subtext}</p>

        {/* Payout */}
        {(isWin || isBlackjack) && (
          <div className="text-center">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Payout</p>
            <p className="text-4xl font-black" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>
              {payout.toLocaleString()} <span className="text-xl text-gray-500">ETB</span>
            </p>
          </div>
        )}
        {isPush && (
          <div className="text-center">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Returned</p>
            <p className="text-3xl font-black text-blue-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {betAmount.toLocaleString()} ETB
            </p>
          </div>
        )}

        {/* Provably fair */}
        {serverSeed && (
          <div className="w-full rounded-xl p-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">🔒 Provably Fair — Server Seed</p>
            <p className="text-[10px] font-mono text-gray-400 break-all leading-relaxed">{serverSeed}</p>
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-xl text-base font-black tracking-widest transition-all active:scale-95 hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: '#000',
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: '0.1em',
            boxShadow: `0 6px 24px rgba(245,200,66,0.35)`,
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({ session }: { session: {
  _id: string; outcome: string; betAmount: number; payout: number;
  playerTotal: number; dealerTotal: number; createdAt: string;
}}) {
  const isWin  = session.outcome === 'player_win';
  const isPush = session.outcome === 'push';
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-lg border"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: isWin ? '#22c55e' : isPush ? '#3b82f6' : '#ef4444' }}
        />
        <div>
          <p className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {isWin ? 'Win' : isPush ? 'Push' : 'Loss'}
          </p>
          <p className="text-[10px] font-mono text-gray-600">
            Player {session.playerTotal} vs Dealer {session.dealerTotal}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-black"
          style={{ color: isWin ? '#22c55e' : isPush ? '#3b82f6' : '#ef4444', fontFamily: "'Rajdhani', sans-serif" }}
        >
          {isWin ? `+${(session.payout - session.betAmount).toLocaleString()}` : isPush ? '±0' : `−${session.betAmount.toLocaleString()}`} ETB
        </p>
        <p className="text-[10px] font-mono text-gray-600">
          {new Date(session.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const BlackjackPage: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();

  const [balance, setBalance]     = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [tab, setTab]             = useState<'game' | 'history'>('game');
  const [history, setHistory]     = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?next=/games/blackjack');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.balance !== undefined) setBalance(user.balance);
  }, [user?.balance]);

  const handleBalanceUpdate = useCallback((newBalance: number) => {
    setBalance(newBalance);
  }, []);

  const { state, deal, hit, stand, reset, clearError } = useBlackjack(handleBalanceUpdate);

  // Load history when tab switches
  useEffect(() => {
    if (tab === 'history' && history.length === 0) {
      setHistoryLoading(true);
      import('../../lib/api/blackjackApi').then(api =>
        api.getHistory(1, 20).then(res => {
          if (res.success) setHistory((res as any).sessions ?? []);
          setHistoryLoading(false);
        })
      );
    }
  }, [tab, history.length]);

  // Refresh history after game ends
  useEffect(() => {
    if (state.phase === 'result') {
      import('../../lib/api/blackjackApi').then(api =>
        api.getHistory(1, 20).then(res => {
          if (res.success) setHistory((res as any).sessions ?? []);
        })
      );
    }
  }, [state.phase]);

  const handleDeal = useCallback(() => {
    if (betAmount < 1 || betAmount > balance) return;
    deal(betAmount);
  }, [betAmount, balance, deal]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const canHit   = state.phase === 'player_turn' && !state.isLoading;
  const canStand = state.phase === 'player_turn' && !state.isLoading;
  const canDeal  = state.phase === 'idle' && !state.isLoading && betAmount >= 1 && balance >= betAmount;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: DARK }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-yellow-400 border-yellow-400/20 animate-spin" />
      </div>
    );
  }

  return (
    <GamePageWrapper game={getGameById('blackjack')!}>
      <Head><title>Blackjack Lite — DashBets</title></Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Exo+2:wght@400;700;900&display=swap');
        @keyframes dealCard { from { opacity:0; transform:translateY(-20px) scale(0.8); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse-gold { 0%,100% { box-shadow:0 0 20px rgba(245,200,66,0.3); } 50% { box-shadow:0 0 40px rgba(245,200,66,0.6); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="min-h-screen" style={{ background: DARK, fontFamily: "'Exo 2', sans-serif" }}>

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'rgba(0,0,0,0.6)', borderColor: BORDER, backdropFilter: 'blur(10px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}` }}
            >
              <span className="text-gray-400 text-sm">←</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🃏</span>
              <div>
                <h1 className="text-base font-black text-white leading-none" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>
                  BLACKJACK
                </h1>
                <p className="text-[10px] font-mono" style={{ color: GOLD }}>Lite · Hit or Stand</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* VIP level */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: BORDER }}>
              <span className="text-xs">⭐</span>
              <span className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                LV.{user.vipLevel ?? 1}
              </span>
            </div>

            {/* Balance */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ background: 'rgba(245,200,66,0.08)', borderColor: 'rgba(245,200,66,0.25)' }}
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

        {/* ── Main layout ──────────────────────────────────────────────────── */}
        <div className="flex gap-4 p-4 items-start max-w-6xl mx-auto">

          {/* ══ LEFT — Controls ══ */}
          <div className="w-72 flex-shrink-0 space-y-3">

            {/* Bet panel */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: CARD_BG, borderColor: BORDER }}>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Bet Amount</p>

              {/* Bet input */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 border"
                style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <button
                  onClick={() => setBetAmount(v => Math.max(1, v - 50))}
                  disabled={state.phase !== 'idle'}
                  className="w-8 h-8 rounded-lg font-black text-lg transition-all disabled:opacity-30 hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.08)', color: GOLD }}
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={balance}
                  value={betAmount}
                  onChange={e => setBetAmount(Math.max(1, Math.min(balance, Number(e.target.value))))}
                  disabled={state.phase !== 'idle'}
                  className="flex-1 bg-transparent text-center text-xl font-black focus:outline-none disabled:opacity-50"
                  style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}
                />
                <button
                  onClick={() => setBetAmount(v => Math.min(balance, v + 50))}
                  disabled={state.phase !== 'idle'}
                  className="w-8 h-8 rounded-lg font-black text-lg transition-all disabled:opacity-30 hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.08)', color: GOLD }}
                >+</button>
              </div>

              {/* Quick chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 100, 500].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setBetAmount(chip)}
                    disabled={state.phase !== 'idle' || chip > balance}
                    className="py-2 rounded-lg text-xs font-black transition-all hover:opacity-80 disabled:opacity-30"
                    style={{
                      background: betAmount === chip ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : 'rgba(255,255,255,0.06)',
                      color: betAmount === chip ? '#000' : '#9ca3af',
                      border: `1px solid ${betAmount === chip ? GOLD : BORDER}`,
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    {chip >= 1000 ? `${chip/1000}K` : chip}
                  </button>
                ))}
              </div>

              {/* Min/Max */}
              <div className="flex justify-between text-[10px] font-mono text-gray-600">
                <span>MIN BET: 1 ETB</span>
                <span>MAX BET: 10,000 ETB</span>
              </div>
            </div>

            {/* Stats panel */}
            <div className="rounded-2xl border p-4 space-y-2" style={{ background: CARD_BG, borderColor: BORDER }}>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Your Stats</p>
              {[
                { label: 'VIP Level',    value: `LV. ${user.vipLevel ?? 1}`,              icon: '⭐' },
                { label: 'Total Wagered',value: `${(user.totalWagered ?? 0).toLocaleString()} ETB`, icon: '🎯' },
                { label: 'Biggest Win',  value: `${(user.biggestWin ?? 0).toLocaleString()} ETB`,  icon: '🏆' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs text-gray-500 font-mono">{item.label}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Rules card */}
            <div className="rounded-2xl border p-4" style={{ background: CARD_BG, borderColor: BORDER }}>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Table Rules</p>
              <div className="space-y-2">
                {[
                  ['Blackjack Pays', '1:1'],
                  ['Dealer Hits On', '≤ 16'],
                  ['Dealer Stands On', '≥ 17'],
                  ['Push Returns', 'Full Bet'],
                ].map(([rule, val]) => (
                  <div key={rule} className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500 font-mono">{rule}</span>
                    <span className="text-[11px] font-bold" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ CENTER — Table ══ */}
          <div className="flex-1 min-w-0">

            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: BORDER }}>
              {(['game', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                  style={{
                    background: tab === t ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : 'transparent',
                    color: tab === t ? '#000' : '#4b5563',
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  {t === 'game' ? '🃏 Game' : '📋 History'}
                </button>
              ))}
            </div>

            {tab === 'history' ? (
              /* ── History tab ── */
              <div className="rounded-2xl border overflow-hidden" style={{ background: CARD_BG, borderColor: BORDER }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: BORDER, background: 'rgba(245,200,66,0.04)' }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>
                    Recent Sessions
                  </p>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 rounded-full border-2 border-t-yellow-400 border-yellow-400/20 animate-spin" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-center text-gray-600 font-mono text-sm py-8">No sessions yet</p>
                  ) : (
                    history.map((s: any) => <HistoryRow key={s._id} session={s} />)
                  )}
                </div>
              </div>
            ) : (
              /* ── Game table ── */
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse at 50% 40%, ${FELT} 0%, ${FELT2} 60%, #0d3320 100%)`,
                  border: `3px solid ${GOLD2}`,
                  boxShadow: `0 0 60px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.3)`,
                  minHeight: 480,
                }}
              >
                {/* Table felt text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-10">
                  <p className="text-3xl font-black text-yellow-200 tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    BLACKJACK PAYS 1 TO 1
                  </p>
                  <p className="text-xl font-bold text-yellow-200 tracking-widest mt-1">DEALER MUST HIT SOFT 17</p>
                </div>

                {/* Dealer up card label (top left) */}
                {state.phase !== 'idle' && state.dealerCards.length > 0 && (
                  <div
                    className="absolute top-4 left-4 rounded-xl p-2 border"
                    style={{ background: 'rgba(0,0,0,0.7)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
                  >
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Dealer Up Card</p>
                    <p className="text-sm font-black" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>
                      {state.dealerCards[0]?.display ?? '—'}
                    </p>
                  </div>
                )}

                {/* Seed hash badge */}
                {state.serverSeedHash && state.phase !== 'idle' && state.phase !== 'result' && (
                  <div
                    className="absolute top-4 right-4 rounded-xl px-3 py-1.5 border"
                    style={{ background: 'rgba(0,0,0,0.7)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
                  >
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">🔒 Provably Fair</p>
                    <p className="text-[9px] font-mono text-gray-500">{state.serverSeedHash.slice(0, 12)}…</p>
                  </div>
                )}

                {/* ── IDLE: Deal prompt ── */}
                {state.phase === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl mb-2">🃏</p>
                      <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em' }}>
                        BLACKJACK
                      </h2>
                      <p className="text-sm text-gray-400 font-mono mt-1">Beat The Dealer, Win Big</p>
                    </div>
                    <button
                      onClick={handleDeal}
                      disabled={!canDeal}
                      className="px-12 py-4 rounded-2xl text-lg font-black tracking-widest transition-all active:scale-95 disabled:opacity-40"
                      style={{
                        background: canDeal ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : 'rgba(255,255,255,0.06)',
                        color: canDeal ? '#000' : '#4b5563',
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.12em',
                        boxShadow: canDeal ? `0 8px 32px rgba(245,200,66,0.4)` : 'none',
                        animation: canDeal ? 'pulse-gold 2s ease-in-out infinite' : 'none',
                      }}
                    >
                      {state.isLoading ? 'DEALING…' : `DEAL — ${betAmount.toLocaleString()} ETB`}
                    </button>
                    {balance < betAmount && (
                      <p className="text-red-400 text-xs font-mono">Insufficient balance</p>
                    )}
                  </div>
                )}

                {/* ── Active game ── */}
                {(state.phase === 'player_turn' || state.phase === 'dealer_turn') && (
                  <div className="p-6 flex flex-col gap-6" style={{ minHeight: 480 }}>

                    {/* Dealer hand */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400"
                           style={{ fontFamily: "'Rajdhani', sans-serif" }}>Dealer</p>
                        {state.phase === 'dealer_turn' && (
                          <span className="text-[10px] font-mono text-amber-400 animate-pulse">Playing…</span>
                        )}
                      </div>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {state.dealerCards.map((card, i) => (
                          <PlayingCard key={i} card={card} size="md" animate={i > 0} />
                        ))}
                      </div>
                      {state.dealerTotal > 0 && !state.dealerCards.some(c => c.hidden) && (
                        <ScoreBadge total={state.dealerTotal} bust={state.dealerTotal > 21} />
                      )}
                    </div>

                    {/* Divider */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full h-px opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
                    </div>

                    {/* Player hand */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {state.playerCards.map((card, i) => (
                          <PlayingCard key={i} card={card} size="lg" animate={i > 1} />
                        ))}
                      </div>
                      <ScoreBadge
                        total={state.playerTotal}
                        bust={state.playerTotal > 21}
                        blackjack={state.isBlackjack}
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-gray-600">Bet:</span>
                        <span className="text-xs font-black" style={{ color: GOLD, fontFamily: "'Rajdhani', sans-serif" }}>
                          {state.betAmount.toLocaleString()} ETB
                        </span>
                        <span className="text-[10px] font-mono text-gray-600">| Win:</span>
                        <span className="text-xs font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                          {(state.betAmount * 2).toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Result overlay ── */}
                {state.phase === 'result' && (
                  <>
                    {/* Show final hands behind overlay */}
                    <div className="p-6 flex flex-col gap-6 opacity-50">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Dealer</p>
                        <div className="flex gap-2 justify-center flex-wrap">
                          {state.dealerCards.map((card, i) => (
                            <PlayingCard key={i} card={card} size="md" />
                          ))}
                        </div>
                        {state.dealerTotal > 0 && <ScoreBadge total={state.dealerTotal} bust={state.dealerTotal > 21} />}
                      </div>
                      <div className="flex-1" />
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-2 justify-center flex-wrap">
                          {state.playerCards.map((card, i) => (
                            <PlayingCard key={i} card={card} size="lg" />
                          ))}
                        </div>
                        <ScoreBadge total={state.playerTotal} bust={state.isBust} blackjack={state.isBlackjack} />
                      </div>
                    </div>
                    <ResultOverlay
                      outcome={state.outcome}
                      payout={state.payout}
                      betAmount={state.betAmount}
                      isBlackjack={state.isBlackjack}
                      isBust={state.isBust}
                      serverSeed={state.serverSeed}
                      serverSeedHash={state.serverSeedHash}
                      onPlayAgain={handleReset}
                    />
                  </>
                )}
              </div>
            )}

            {/* ── Action buttons ── */}
            {tab === 'game' && (
              <div className="flex gap-2 mt-3">
                <ActionBtn
                  label="HIT"
                  icon="➕"
                  onClick={hit}
                  disabled={!canHit}
                  color="#16a34a"
                />
                <ActionBtn
                  label="STAND"
                  icon="✋"
                  onClick={stand}
                  disabled={!canStand}
                  color="#7c2d12"
                />
                {state.phase === 'idle' && (
                  <ActionBtn
                    label="DEAL"
                    icon="🃏"
                    onClick={handleDeal}
                    disabled={!canDeal}
                    color={GOLD2}
                    textColor="#000"
                  />
                )}
                {state.phase === 'result' && (
                  <ActionBtn
                    label="NEW GAME"
                    icon="🔄"
                    onClick={handleReset}
                    color="#1d4ed8"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </GamePageWrapper>
  );
};

export default BlackjackPage;