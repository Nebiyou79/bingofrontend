// components/cardDraw/BetResults.tsx
/**
 * Bane Games — Card Draw Bet Results
 *
 * Upgrades per UI guide:
 * - Count-up animation from 0 → final net profit value
 * - Stagger-fade-in on each bet row
 * - Win state: animated border shimmer
 * - Loss state: red pulse
 */

import React, { useEffect, useState, useRef } from 'react';
import type { SettledBet, DrawnCard } from '../../lib/api/cardDrawApi';

interface BetResultsProps {
  bets: SettledBet[];
  drawnCard: DrawnCard;
  totalWagered: number;
  totalPayout: number;
  netProfit: number;
}

const suitMap: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};

const getBetDisplayValue = (type: string, value: string): string => {
  if (type === 'exact') {
    const suitChar = value.slice(-1);
    const rank = value.slice(0, -1);
    const sm: Record<string, string> = { H: '♥', D: '♦', C: '♣', S: '♠' };
    return `${rank}${sm[suitChar] || suitChar}`;
  }
  if (type === 'suit') {
    const sdm: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    return sdm[value] || value;
  }
  return value;
};

/* Count-up hook */
function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    const abs = Math.abs(target);
    const sign = Math.sign(target);
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(sign * abs * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, enabled]);

  return value;
}

export function BetResults({ bets, drawnCard, totalWagered, totalPayout, netProfit }: BetResultsProps) {
  const isWin       = netProfit > 0;
  const animatedNet = useCountUp(netProfit, 900, true);
  const resultColor = isWin ? 'var(--green,#00E676)' : 'var(--red,#FF4757)';
  const resultBg    = isWin ? 'rgba(0,230,118,0.07)' : 'rgba(255,71,87,0.07)';
  const resultBorder= isWin ? 'rgba(0,230,118,0.25)' : 'rgba(255,71,87,0.25)';
  const drawnSuit   = suitMap[drawnCard.suit] || drawnCard.suit;

  const fmt = (n: number) => Math.abs(n).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes shimmer-border {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes result-pop {
          0%   { transform: scale(0.88); opacity: 0; }
          65%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); }
        }
        .result-pop { animation: result-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        @keyframes bet-row-in {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>

      {/* ── Round Summary ── */}
      <div
        className="result-pop"
        style={{
          borderRadius: 16,
          padding: '18px 20px',
          textAlign: 'center',
          background: resultBg,
          border: `1px solid ${resultBorder}`,
          boxShadow: isWin ? '0 0 32px rgba(0,230,118,0.12)' : '0 0 24px rgba(255,71,87,0.10)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer sweep on win */}
        {isWin && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
            background: 'linear-gradient(105deg, transparent 30%, rgba(0,230,118,0.08) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-border 2s linear infinite',
          }} />
        )}

        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted,#3F4A5C)', textTransform: 'uppercase' }}>
          Round Result
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 900, fontFamily: "'Rajdhani', sans-serif", color: resultColor, lineHeight: 1 }}>
          {netProfit >= 0 ? '+' : '−'}{fmt(animatedNet)} ETB
        </p>
        <p style={{ margin: 0, fontSize: 12, color: resultColor, fontWeight: 600, letterSpacing: '0.06em' }}>
          {isWin ? '🎉 You won this round!' : '💔 You lost this round.'}
        </p>
      </div>

      {/* ── Bets Breakdown ── */}
      <div style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.22)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <h3 style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#3F4A5C)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Bet Details
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary,#8892A4)' }}>
            Card:{' '}
            <span style={{ fontWeight: 700, color: drawnCard.color === 'red' ? 'var(--suit-red,#F87171)' : 'var(--suit-black,#94A3B8)' }}>
              {drawnCard.rank}{drawnSuit}
            </span>
          </span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {bets.map((bet, i) => {
            const displayValue = getBetDisplayValue(bet.type, bet.value);
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < bets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  animation: `bet-row-in 0.35s ease ${i * 70}ms both`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: bet.isWin ? 'var(--green,#00E676)' : 'var(--red,#FF4757)', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#3F4A5C)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{bet.type}</span>
                    <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text-primary,#F0F0F8)', fontSize: 13 }}>{displayValue}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--gold,#F4B740)',
                    background: 'rgba(244,183,64,0.10)',
                    borderRadius: 5, padding: '2px 6px',
                  }}>
                    {bet.multiplier.toFixed(2)}×
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: bet.isWin ? 'var(--green,#00E676)' : 'var(--red,#FF4757)' }}>
                    {bet.isWin ? '+' : ''}{bet.payout.toLocaleString()} ETB
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted,#3F4A5C)' }}>Stake: {bet.amount.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer totals */}
        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.18)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted,#3F4A5C)' }}>Total</span>
          <div style={{ fontSize: 11, textAlign: 'right' }}>
            <span style={{ color: 'var(--text-secondary,#8892A4)' }}>Wagered: {totalWagered.toLocaleString()} ETB</span>
            <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ color: 'var(--gold,#F4B740)', fontWeight: 700 }}>Payout: {totalPayout.toLocaleString()} ETB</span>
          </div>
        </div>
      </div>
    </div>
  );
}