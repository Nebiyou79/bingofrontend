// pages/games/hilo.tsx
/**
 * DashBets — Hi-Lo Card Game
 *
 * Design: Deep navy/black base, crimson + ivory card-table aesthetic.
 * Signature element: the oversized playing card that flips on each reveal.
 *
 * Layout:
 *   Centre column (max-w-lg): card display, prediction buttons, cashout bar
 *   Right panel  (w-72):      bet entry (idle) / session stats (playing) / history
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Responsive helper ────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { useHilo } from '../../hooks/useHilo';
import { AppLayout } from '../../components/layout/AppLayout';
import type { HiloCard, HiloOdds } from '../../lib/api/hiloApi';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#080c14';
const SURFACE = 'rgba(255,255,255,0.04)';
const BORDER  = 'rgba(255,255,255,0.08)';
const CRIMSON = '#c0392b';
const IVORY   = '#f5f0e8';
const GOLD    = '#f5c842';
const GREEN   = '#22c55e';
const FONT    = "'Rajdhani', sans-serif";

// ─── Suit symbols & colors ────────────────────────────────────────────────────
const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};
const suitColor = (suit: string) =>
  suit === 'hearts' || suit === 'diamonds' ? CRIMSON : '#1a1a2e';

// ─── Playing Card component ───────────────────────────────────────────────────
function PlayingCard({
  card, size = 'lg', dimmed = false, animate = false,
}: {
  card: HiloCard; size?: 'sm' | 'md' | 'lg'; dimmed?: boolean; animate?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const sym = SUIT_SYMBOL[card.suit] ?? '?';
  const col = suitColor(card.suit);

  useEffect(() => {
    if (animate) {
      setFlipped(false);
      const t = setTimeout(() => setFlipped(true), 80);
      return () => clearTimeout(t);
    } else {
      setFlipped(true);
    }
  }, [card.index, animate]);

  const dims = {
    sm: { w: 56, h: 80,  rank: 18, suit: 22 },
    md: { w: 80, h: 112, rank: 24, suit: 30 },
    lg: { w: 140, h: 196, rank: 36, suit: 52 },
  }[size];

  return (
    <div
      style={{
        width: dims.w, height: dims.h,
        perspective: 600,
        opacity: dimmed ? 0.35 : 1,
        transition: 'opacity 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
          transform: flipped ? 'rotateY(0deg)' : 'rotateY(90deg)',
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            background: IVORY,
            borderRadius: 10,
            border: `2px solid rgba(255,255,255,0.9)`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '6px 8px',
            color: col,
          }}
        >
          {/* Top-left rank + suit */}
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: dims.rank, fontWeight: 900, fontFamily: FONT }}>{card.rank}</div>
            <div style={{ fontSize: dims.suit * 0.6, marginTop: -2 }}>{sym}</div>
          </div>
          {/* Centre suit */}
          <div style={{ textAlign: 'center', fontSize: dims.suit, lineHeight: 1 }}>{sym}</div>
          {/* Bottom-right (rotated) */}
          <div style={{ lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
            <div style={{ fontSize: dims.rank, fontWeight: 900, fontFamily: FONT }}>{card.rank}</div>
            <div style={{ fontSize: dims.suit * 0.6, marginTop: -2 }}>{sym}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card back ────────────────────────────────────────────────────────────────
function CardBack({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: [56,80], md: [80,112], lg: [140,196] }[size];
  return (
    <div style={{
      width: dims[0], height: dims[1], borderRadius: 10,
      border: `2px solid rgba(255,255,255,0.15)`,
      background: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: '80%', height: '80%', borderRadius: 6,
        border: '2px solid rgba(255,255,255,0.12)',
        background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)',
      }} />
    </div>
  );
}

// ─── Multiplier badge ─────────────────────────────────────────────────────────
function MultiplierBadge({ value }: { value: number }) {
  const glow = value >= 5 ? GOLD : value >= 2 ? '#f97316' : GREEN;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${glow}18`,
      border: `1px solid ${glow}40`,
      borderRadius: 8, padding: '4px 10px',
    }}>
      <span style={{ fontSize: 11, color: glow, fontFamily: FONT, fontWeight: 700, letterSpacing: '0.05em' }}>
        MULTIPLIER
      </span>
      <span style={{ fontSize: 22, color: glow, fontFamily: FONT, fontWeight: 900, lineHeight: 1 }}>
        ×{value.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Prediction button ────────────────────────────────────────────────────────
function PredictionBtn({
  label, icon, multiplier, probability, prediction, disabled, onClick,
}: {
  label: string; icon: string; multiplier: number; probability: number;
  prediction: 'higher' | 'lower' | 'equal'; disabled: boolean;
  onClick: () => void;
}) {
  const pct = Math.round(probability * 100);
  const accent = prediction === 'higher' ? GREEN
    : prediction === 'lower'  ? CRIMSON
    : GOLD;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, minWidth: 0,
        background: `${accent}12`,
        border: `1.5px solid ${accent}30`,
        borderRadius: 14, padding: '14px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = `${accent}22`;
      }}
      onMouseLeave={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = `${accent}12`;
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 900, color: accent, fontFamily: FONT, letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
          {pct}%
        </span>
        {multiplier > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: accent, fontFamily: FONT,
            background: `${accent}20`, borderRadius: 4, padding: '1px 5px',
          }}>
            ×{multiplier.toFixed(2)}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Card history strip ───────────────────────────────────────────────────────
function CardHistoryStrip({ cards }: { cards: HiloCard[] }) {
  if (cards.length === 0) return null;
  const visible = cards.slice(-7);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', padding: '4px 0' }}>
      {visible.map((c, i) => (
        <PlayingCard
          key={`${c.index}-${i}`}
          card={c}
          size="sm"
          dimmed={i < visible.length - 1}
        />
      ))}
      {cards.length > 7 && (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT, flexShrink: 0 }}>
          +{cards.length - 7} more
        </span>
      )}
    </div>
  );
}

// ─── Result overlay ───────────────────────────────────────────────────────────
function ResultOverlay({
  won, payout, multiplier, stepCount, betAmount, onPlayAgain,
  lostOn, // ADD THIS PROP
}: {
  won: boolean; payout: number; multiplier: number; stepCount: number;
  betAmount: number; onPlayAgain: () => void;
  lostOn?: HiloCard; // ADD THIS
}) {
  const accent = won ? GREEN : CRIMSON;
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 20,
      background: `rgba(8,12,20,0.92)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, zIndex: 10,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{ fontSize: 52 }}>{won ? '🎉' : '💀'}</div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 28, fontWeight: 900, color: accent, fontFamily: FONT, letterSpacing: '0.1em', margin: 0 }}>
          {won ? 'CASHED OUT' : 'BUST'}
        </p>
        {won ? (
          <p style={{ fontSize: 36, fontWeight: 900, color: GOLD, fontFamily: FONT, margin: 0 }}>
            +{payout.toLocaleString()} ETB
          </p>
        ) : (
          <>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, margin: 0 }}>
              −{betAmount.toLocaleString()} ETB
            </p>
            {/* SHOW THE LOSING CARD */}
            {lostOn && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: FONT, letterSpacing: '0.1em' }}>
                  CARD DRAWN
                </span>
                <PlayingCard card={lostOn} size="md" />
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
        <span>{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>×{multiplier.toFixed(2)} peak</span>
      </div>
      <button
        onClick={onPlayAgain}
        style={{
          marginTop: 8, padding: '12px 32px', borderRadius: 12,
          background: `linear-gradient(135deg, ${GOLD}, #e8a800)`,
          color: BG, fontFamily: FONT, fontWeight: 900, fontSize: 16,
          letterSpacing: '0.08em', border: 'none', cursor: 'pointer',
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}

// ─── Bet entry panel ──────────────────────────────────────────────────────────
function BetEntryPanel({
  balance, onStart, loading,
}: {
  balance: number; onStart: (amount: number) => void; loading: boolean;
}) {
  const [amount, setAmount] = useState(50);
  const PRESETS = [10, 25, 50, 100, 250, 500];
  const canPlay = amount >= 1 && amount <= balance && !loading;

  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24,
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, letterSpacing: '0.1em', margin: '0 0 12px' }}>
        BET AMOUNT
      </p>

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: FONT,
              cursor: 'pointer', transition: 'all 0.15s',
              background: amount === p ? `${GOLD}20` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${amount === p ? `${GOLD}60` : BORDER}`,
              color: amount === p ? GOLD : 'rgba(255,255,255,0.5)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)', borderRadius: 10,
        border: `1px solid ${BORDER}`, padding: '10px 14px', marginBottom: 16,
      }}>
        <input
          type="number" min={1} max={balance} value={amount}
          onChange={e => setAmount(Math.max(1, Math.min(balance, Number(e.target.value))))}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: IVORY, fontSize: 22, fontWeight: 900, fontFamily: FONT,
          }}
        />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>ETB</span>
      </div>

      {/* Balance */}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT, margin: '0 0 16px' }}>
        Balance: {balance.toLocaleString()} ETB
      </p>

      <button
        onClick={() => onStart(amount)}
        disabled={!canPlay}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12,
          background: canPlay ? `linear-gradient(135deg, ${GOLD}, #e8a800)` : 'rgba(255,255,255,0.06)',
          color: canPlay ? BG : '#4b5563',
          fontFamily: FONT, fontWeight: 900, fontSize: 16, letterSpacing: '0.1em',
          border: 'none', cursor: canPlay ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'STARTING…' : 'DEAL CARD'}
      </button>
    </div>
  );
}

// ─── Session stats panel ──────────────────────────────────────────────────────
function SessionStatsPanel({
  betAmount, multiplier, potentialPayout, stepCount, onCashout, disabled,
}: {
  betAmount: number; multiplier: number; potentialPayout: number;
  stepCount: number; onCashout: () => void; disabled: boolean;
}) {
  const profit = potentialPayout - betAmount;
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'WAGER',      value: `${betAmount.toLocaleString()} ETB`, color: 'rgba(255,255,255,0.6)' },
          { label: 'MULTIPLIER', value: `×${multiplier.toFixed(2)}`,         color: multiplier >= 2 ? GOLD : GREEN },
          { label: 'CASHOUT',    value: `${potentialPayout.toLocaleString()} ETB`, color: GREEN },
          { label: 'PROFIT',     value: `+${profit.toLocaleString()} ETB`,   color: profit > 0 ? GREEN : 'rgba(255,255,255,0.4)' },
          { label: 'STEPS',      value: String(stepCount),                   color: 'rgba(255,255,255,0.5)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: FONT, letterSpacing: '0.1em' }}>
              {label}
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color, fontFamily: FONT }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onCashout}
        disabled={disabled || stepCount === 0}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12,
          background: !disabled && stepCount > 0
            ? `linear-gradient(135deg, ${GREEN}, #16a34a)`
            : 'rgba(255,255,255,0.06)',
          color: !disabled && stepCount > 0 ? '#fff' : '#4b5563',
          fontFamily: FONT, fontWeight: 900, fontSize: 16, letterSpacing: '0.06em',
          border: 'none', cursor: !disabled && stepCount > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          boxShadow: !disabled && stepCount > 0 ? `0 4px 20px ${GREEN}40` : 'none',
        }}
      >
        CASH OUT {stepCount > 0 ? `${potentialPayout.toLocaleString()} ETB` : ''}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const HiloPage: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login?next=/games/hilo');
  }, [authLoading, isAuthenticated, router]);

  const {
    phase, session, result, error,
    lastCard, startGame, guess, skip, cashout, reset, clearError,
  } = useHilo();

  const [balance, setBalance] = useState(user?.balance ?? 0);
  useEffect(() => { if (user?.balance !== undefined) setBalance(user.balance); }, [user?.balance]);

  // Capture betAmount before session clears on loss/cashout
  const savedBetAmount = useRef<number>(0);
  useEffect(() => {
    if (session?.betAmount) savedBetAmount.current = session.betAmount;
  }, [session?.betAmount]);

  // After cashout/loss, sync balance from result
  useEffect(() => {
    if (phase === 'won' && result) setBalance(b => b + result.payout - savedBetAmount.current);
  }, [phase]);

  const isIdle      = phase === 'idle';
  const isPlaying   = phase === 'playing';
  const isResolving = phase === 'resolving';
  const isOver      = phase === 'won' || phase === 'lost';

  const isMobile = useWindowWidth() < 768;

  const handleStart = useCallback(async (amount: number) => {
    setBalance(b => b - amount);
    await startGame(amount);
  }, [startGame]);

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <AppLayout title="Hi-Lo">
      <>
        <Head><title>Hi-Lo — DashBets</title></Head>

        <div style={{ minHeight: '100vh', background: BG, padding: isMobile ? '12px 12px' : '20px 16px', fontFamily: FONT }}>
          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            }}>
              <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
              <button onClick={clearError} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: isMobile ? 12 : 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: isMobile ? 22 : 28 }}>🃏</span>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 900, color: IVORY, letterSpacing: '0.1em' }}>
                  HI-LO
                </h1>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>
                  PREDICT · MULTIPLY · CASH OUT
                </p>
              </div>
            </div>
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10,
              padding: isMobile ? '6px 10px' : '8px 16px', textAlign: 'right',
            }}>
              <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>BALANCE</p>
              <p style={{ margin: 0, fontSize: isMobile ? 14 : 18, fontWeight: 900, color: GOLD }}>{balance.toLocaleString()} ETB</p>
            </div>
          </div>

          {/* Main layout — single column on mobile, side-by-side on desktop */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 20,
            alignItems: 'flex-start',
            maxWidth: 960,
            margin: '0 auto',
          }}>

            {/* On mobile: bet/stats panel renders FIRST (top), then game area below */}
            {isMobile && (
              <div style={{ width: '100%' }}>
                {isIdle && (
                  <BetEntryPanel balance={balance} onStart={handleStart} loading={isResolving} />
                )}
                {(isPlaying || isResolving) && session && (
                  <SessionStatsPanel
                    betAmount={session.betAmount}
                    multiplier={session.multiplier}
                    potentialPayout={session.potentialPayout}
                    stepCount={session.stepCount}
                    onCashout={cashout}
                    disabled={isResolving}
                  />
                )}
                {isOver && (
                  <div style={{
                    background: SURFACE, border: `1px solid ${BORDER}`,
                    borderRadius: 20, padding: 20, textAlign: 'center',
                  }}>
                    <p style={{ margin: '0 0 14px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                      ROUND OVER
                    </p>
                    <button
                      onClick={reset}
                      style={{
                        width: '100%', padding: '13px 0', borderRadius: 12,
                        background: `linear-gradient(135deg, ${GOLD}, #e8a800)`,
                        color: BG, fontFamily: FONT, fontWeight: 900, fontSize: 15,
                        letterSpacing: '0.08em', border: 'none', cursor: 'pointer',
                      }}
                    >
                      NEW ROUND
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Centre: game area ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Card arena */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(10,18,40,0.9), rgba(8,12,20,0.95))',
                border: `1px solid ${BORDER}`, borderRadius: 20,
                padding: isMobile ? '20px 16px' : '32px 24px', marginBottom: 16,
                position: 'relative', overflow: 'hidden',
                minHeight: isMobile ? 280 : 320,
              }}>
                {/* Felt texture hint */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.005) 0px, rgba(255,255,255,0.005) 1px, transparent 1px, transparent 40px)',
                  pointerEvents: 'none',
                }} />

                {isIdle && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 20, padding: '20px 0',
                  }}>
                    <div style={{ display: 'flex', gap: -8 }}>
                      {['AS','KH','QD','JC'].map((d, i) => (
                        <div key={d} style={{ transform: `rotate(${(i - 1.5) * 8}deg) translateY(${Math.abs(i-1.5)*4}px)`, marginLeft: i > 0 ? -20 : 0 }}>
                          <PlayingCard
                            card={{ index: i, rank: d.slice(0,-1), suit: ['spades','hearts','diamonds','clubs'][i], value: i+1, display: d, color: ['black','red','red','black'][i] as 'red'|'black' }}
                            size="md"
                          />
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                      Set your wager and deal a card to begin
                    </p>
                  </div>
                )}

                {(isPlaying || isResolving || isOver) && session && (
                  <>
                    {/* Multiplier */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                      <MultiplierBadge value={session.multiplier} />
                    </div>

                    {/* Current card */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
                      <PlayingCard card={session.currentCard} size={isMobile ? 'md' : 'lg'} animate={true} />
                    </div>

                    {/* Card history */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CardHistoryStrip cards={session.cardHistory} />
                    </div>
                  </>
                )}

                {isOver && result && (
                  <ResultOverlay
                    won={phase === 'won'}
                    payout={result.payout}
                    multiplier={result.multiplier}
                    stepCount={result.stepCount}
                    betAmount={session?.betAmount ?? savedBetAmount.current}
                    onPlayAgain={reset}
                    lostOn={result.lostOn}
                  />
                )}
              </div>

              {/* Prediction buttons */}
              {(isPlaying || isResolving) && session && (
                <div style={{
                  background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20,
                  padding: 16, marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <PredictionBtn
                      label="HIGHER" icon="⬆️"
                      multiplier={session.odds.higher.multiplier}
                      probability={session.odds.higher.probability}
                      prediction="higher" disabled={isResolving}
                      onClick={() => guess('higher')}
                    />
                    <PredictionBtn
                      label="EQUAL" icon="↔️"
                      multiplier={session.odds.equal.multiplier}
                      probability={session.odds.equal.probability}
                      prediction="equal" disabled={isResolving}
                      onClick={() => guess('equal')}
                    />
                    <PredictionBtn
                      label="LOWER" icon="⬇️"
                      multiplier={session.odds.lower.multiplier}
                      probability={session.odds.lower.probability}
                      prediction="lower" disabled={isResolving}
                      onClick={() => guess('lower')}
                    />
                  </div>
                  <button
                    onClick={skip}
                    disabled={isResolving}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                      color: 'rgba(255,255,255,0.4)', fontFamily: FONT, fontWeight: 700,
                      fontSize: 13, letterSpacing: '0.06em', cursor: isResolving ? 'not-allowed' : 'pointer',
                      opacity: isResolving ? 0.5 : 1, transition: 'all 0.15s',
                    }}
                  >
                    SKIP THIS CARD
                  </button>
                </div>
              )}

              {/* How to play */}
              {isIdle && (
                <div style={{
                  background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px',
                }}>
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>HOW TO PLAY</p>
                  {[
                    ['Deal', 'Place a wager to reveal the first card.'],
                    ['Predict', 'Guess if the next card will be Higher, Lower, or Equal.'],
                    ['Multiply', 'Each correct guess builds your multiplier.'],
                    ['Cash Out', 'Bank your winnings any time — or go bust.'],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: GOLD, fontFamily: FONT, minWidth: 60 }}>{title}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div> {/* end centre flex:1 column */}

            {/* ── Right panel — desktop only ── */}
            {!isMobile && (
              <div style={{ width: 260, flexShrink: 0 }}>
                {isIdle && (
                  <BetEntryPanel balance={balance} onStart={handleStart} loading={isResolving} />
                )}
                {(isPlaying || isResolving) && session && (
                  <SessionStatsPanel
                    betAmount={session.betAmount}
                    multiplier={session.multiplier}
                    potentialPayout={session.potentialPayout}
                    stepCount={session.stepCount}
                    onCashout={cashout}
                    disabled={isResolving}
                  />
                )}
                {isOver && (
                  <div style={{
                    background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, textAlign: 'center',
                  }}>
                    <p style={{ margin: '0 0 16px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                      ROUND OVER
                    </p>
                    <button
                      onClick={reset}
                      style={{
                        width: '100%', padding: '13px 0', borderRadius: 12,
                        background: `linear-gradient(135deg, ${GOLD}, #e8a800)`,
                        color: BG, fontFamily: FONT, fontWeight: 900, fontSize: 15,
                        letterSpacing: '0.08em', border: 'none', cursor: 'pointer',
                      }}
                    >
                      NEW ROUND
                    </button>
                  </div>
                )}

                {/* Payout reference */}
                <div style={{
                  marginTop: 16, background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 16, padding: '16px 20px',
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>EXAMPLE MULTIPLIERS</p>
                  {[
                    { label: 'Ace → Higher', mult: '×12.62', note: '96% chance' },
                    { label: '7  → Higher',  mult: '×1.92',  note: '48% chance' },
                    { label: '7  → Equal',   mult: '×12.25', note: '6% chance'  },
                    { label: 'King → Lower', mult: '×12.62', note: '96% chance' },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', borderBottom: `1px solid ${BORDER}`,
                    }}>
                      <div>
                        <span style={{ fontSize: 12, color: IVORY, fontFamily: FONT }}>{row.label}</span>
                        <br />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{row.note}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: GREEN, fontFamily: FONT }}>{row.mult}</span>
                    </div>
                  ))}
                </div>
              </div>
            )} {/* end !isMobile desktop panel */}

            {/* Mobile: Example Multipliers at the bottom */}
            {isMobile && (
              <div style={{
                width: '100%', background: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: '16px 20px',
              }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>EXAMPLE MULTIPLIERS</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    { label: 'Ace → Higher', mult: '×12.62', note: '96%' },
                    { label: '7 → Higher',   mult: '×1.92',  note: '48%' },
                    { label: '7 → Equal',    mult: '×12.25', note: '6%'  },
                    { label: 'King → Lower', mult: '×12.62', note: '96%' },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 4px', borderBottom: `1px solid ${BORDER}`,
                    }}>
                      <div>
                        <span style={{ fontSize: 11, color: IVORY, fontFamily: FONT }}>{row.label}</span>
                        <br />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{row.note} chance</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: GREEN, fontFamily: FONT, marginLeft: 8 }}>{row.mult}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div> {/* end main flex row */}
        </div> {/* end page background */}
      </>
    </AppLayout>
  );
};

export default HiloPage;