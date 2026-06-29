// components/slots/SlotsReels.tsx
/**
 * DashBets — Classic Slots Reel Machine
 *
 * Shows 3 spinning reels with CSS animations.
 * When result arrives, reels stop one-by-one revealing the symbols.
 * Win lines glow when payout > 0.
 */

import React, { useEffect, useState, useRef } from 'react';
import type { SlotSymbol } from '../../lib/api/slotsApi';
import type { SlotPhase } from '../../hooks/useSlots';

// ── Symbol config ──────────────────────────────────────────────────────────────
const SYMBOL_CONFIG: Record<SlotSymbol, { emoji: string; color: string; glow: string; label: string }> = {
  cherry:  { emoji: '🍒', color: '#ef4444', glow: 'rgba(239,68,68,0.7)',   label: 'Cherry'  },
  lemon:   { emoji: '🍋', color: '#eab308', glow: 'rgba(234,179,8,0.7)',   label: 'Lemon'   },
  orange:  { emoji: '🍊', color: '#f97316', glow: 'rgba(249,115,22,0.7)',  label: 'Orange'  },
  grape:   { emoji: '🍇', color: '#a855f7', glow: 'rgba(168,85,247,0.7)',  label: 'Grape'   },
  seven:   { emoji: '7️⃣',  color: '#f59e0b', glow: 'rgba(245,158,11,0.9)', label: 'Seven'   },
  wild:    { emoji: '⭐', color: '#fbbf24', glow: 'rgba(251,191,36,1)',    label: 'WILD'    },
};

const ALL_SYMBOLS: SlotSymbol[] = ['cherry', 'lemon', 'orange', 'grape', 'seven', 'wild'];

// ── Reel strip (spinning animation) ───────────────────────────────────────────
function ReelStrip({ symbol, isSpinning, stopDelay, isWinReel }: {
  symbol: SlotSymbol;
  isSpinning: boolean;
  stopDelay: number;
  isWinReel: boolean;
}) {
  const [displayed, setDisplayed] = useState<SlotSymbol>(symbol);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSpinning) {
      let i = 0;
      intervalRef.current = setInterval(() => {
        setDisplayed(ALL_SYMBOLS[i % ALL_SYMBOLS.length] as SlotSymbol);
        i++;
      }, 80);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeout(() => setDisplayed(symbol), stopDelay);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isSpinning, symbol, stopDelay]);

  const cfg = SYMBOL_CONFIG[displayed];

  return (
    <div
      className="relative flex items-center justify-center rounded-2xl transition-all duration-300"
      style={{
        width: '100px', height: '100px',
        background: isWinReel
          ? `radial-gradient(circle, ${cfg.glow}30 0%, rgba(0,0,0,0.60) 100%)`
          : 'rgba(0,0,0,0.60)',
        border: `2px solid ${isWinReel ? cfg.color + '80' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isWinReel ? `0 0 24px ${cfg.glow}, 0 0 8px ${cfg.glow}` : 'none',
        transform: isSpinning ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      <span
        className="text-5xl leading-none select-none transition-all duration-150"
        style={{
          filter: isWinReel ? `drop-shadow(0 0 12px ${cfg.glow})` : 'none',
          transform: isSpinning ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        {cfg.emoji}
      </span>
      {isWinReel && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse"
          style={{ background: `radial-gradient(circle, ${cfg.glow}15 0%, transparent 70%)` }} />
      )}
    </div>
  );
}

// ── Win line overlay ───────────────────────────────────────────────────────────
function WinBadge({ winType, payout, multiplier }: { winType: string; payout: number; multiplier: number }) {
  if (payout <= 0) return null;
  return (
    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce-in z-20">
      <div
        className="px-5 py-2.5 rounded-xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.30) 0%, rgba(126,34,206,0.20) 100%)',
          border: '1px solid rgba(168,85,247,0.60)',
          boxShadow: '0 0 24px rgba(168,85,247,0.40)',
        }}
      >
        <p className="text-xs font-black text-purple-300 uppercase tracking-widest">{winType || 'WIN'}</p>
        <p className="text-xl font-black text-white font-mono">+{payout.toLocaleString()} ETB</p>
        <p className="text-[10px] text-purple-400 font-mono">{multiplier.toFixed(2)}x multiplier</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface SlotsReelsProps {
  phase:          SlotPhase;
  reels:          SlotSymbol[];
  winningLine:    number[];
  payout:         number;
  multiplier:     number;
  winType:        string;
  onRevealComplete: () => void;
  isFreeSpinBonus?: boolean;
  freeSpinsRemaining?: number;
  totalFreeWin?:  number;
}

export function SlotsReels({
  phase, reels, winningLine, payout, multiplier, winType, onRevealComplete,
  isFreeSpinBonus, freeSpinsRemaining, totalFreeWin,
}: SlotsReelsProps) {
  const isSpinning = phase === 'spinning' || phase === 'freeSpinning';
  const isRevealing = phase === 'revealing';
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    if (isRevealing && payout > 0) {
      const t = setTimeout(() => setShowWin(true), 600);
      return () => clearTimeout(t);
    }
    setShowWin(false);
  }, [isRevealing, payout]);

  // Auto-advance from revealing after a delay
  useEffect(() => {
    if (isRevealing) {
      const delay = payout > 0 ? 2200 : 900;
      const t = setTimeout(() => onRevealComplete(), delay);
      return () => clearTimeout(t);
    }
  }, [isRevealing, payout, onRevealComplete]);

  return (
    <>
      <style>{`
        @keyframes bounce-in {
          0%   { transform: translateX(-50%) scale(0.5); opacity: 0; }
          70%  { transform: translateX(-50%) scale(1.1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes reel-glow {
          0%,100% { box-shadow: 0 0 8px rgba(168,85,247,0.5); }
          50%      { box-shadow: 0 0 24px rgba(168,85,247,0.9); }
        }
        .animate-bounce-in  { animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .animate-reel-glow  { animation: reel-glow 1s ease-in-out infinite; }

        .slots-bg {
          background-color: #100812;
          background-image:
            radial-gradient(circle at 50% 0%, rgba(168,85,247,0.08) 0%, transparent 70%);
        }
      `}</style>

      <div
        className="slots-bg rounded-2xl border-2 w-full overflow-hidden"
        style={{ border: '2px solid rgba(168,85,247,0.25)', boxShadow: '0 0 40px rgba(168,85,247,0.06)' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">🎰 Classic Slots</p>
          <div className="flex items-center gap-2">
            {isFreeSpinBonus && (
              <span className="text-[10px] font-black text-amber-400 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)' }}>
                ⭐ FREE SPIN
              </span>
            )}
            <span className="text-[10px] font-bold text-gray-600">96.5% RTP</span>
          </div>
        </div>

        {/* Machine body */}
        <div className="flex flex-col items-center py-10 px-5 relative">
          {/* Machine frame */}
          <div
            className="rounded-3xl p-6 relative"
            style={{
              background: 'linear-gradient(180deg, #1a0a25 0%, #0d0618 100%)',
              border: '3px solid rgba(168,85,247,0.35)',
              boxShadow: '0 0 60px rgba(168,85,247,0.15), inset 0 0 30px rgba(0,0,0,0.50)',
            }}
          >
            {/* Payline indicator */}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.60), transparent)',
                boxShadow: '0 0 8px rgba(168,85,247,0.50)',
              }}
            />

            {/* Reels */}
            <div className="flex gap-3 relative z-10">
              {[0, 1, 2].map(i => (
                <ReelStrip
                  key={i}
                  symbol={reels[i] ?? 'cherry'}
                  isSpinning={isSpinning}
                  stopDelay={i * 200}
                  isWinReel={!isSpinning && winningLine.includes(i) && payout > 0}
                />
              ))}
            </div>

            {/* Win badge */}
            {showWin && isRevealing && (
              <WinBadge winType={winType} payout={payout} multiplier={multiplier} />
            )}
          </div>

          {/* Spacer for win badge */}
          {showWin && <div style={{ height: '52px' }} />}
        </div>

        {/* Symbol legend */}
        <div className="px-5 pb-4">
          <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-2">Symbols</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SYMBOLS.map(sym => {
              const cfg = SYMBOL_CONFIG[sym];
              return (
                <div key={sym} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm">{cfg.emoji}</span>
                  <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Free spins total accumulator */}
        {isFreeSpinBonus && (totalFreeWin ?? 0) > 0 && (
          <div className="px-5 pb-5">
            <div className="rounded-xl px-4 py-2.5 flex items-center justify-between"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span className="text-xs font-bold text-amber-500">Free Spins Total</span>
              <span className="font-mono text-sm font-black text-amber-400">+{(totalFreeWin ?? 0).toLocaleString()} ETB</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
