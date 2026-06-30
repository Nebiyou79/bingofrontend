'use client';
// components/games/SlotMachine.tsx

/**
 * DashBets — Classic Slot Machine UI
 *
 * Uses useSlots hook. Reel animation: CSS keyframe spin on each column,
 * staggered stop delays per reel (reel 0 stops first, reel 2 last).
 *
 * Symbol map: emoji render via CSS class names → easy to swap for image sprites.
 *
 * Free spin bonus:
 *   - After WILD×3, banner appears.
 *   - "Spin Free" button calls playNextFreeSpin() for each of 5 free spins.
 *   - Total accumulated free-win shown at end.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSlots, SlotPhase }                 from '../hooks/useSlots';
import { SlotSymbol }                          from '../lib/api/slotsApi';

// ─── Symbol display ───────────────────────────────────────────────────────────

const SYMBOL_EMOJI: Record<SlotSymbol, string> = {
  cherry:  '🍒',
  lemon:   '🍋',
  orange:  '🍊',
  grape:   '🍇',
  seven:   '7️⃣',
  wild:    '🃏',
};

const SYMBOL_COLOR: Record<SlotSymbol, string> = {
  cherry:  'text-red-400',
  lemon:   'text-yellow-300',
  orange:  'text-orange-400',
  grape:   'text-purple-400',
  seven:   'text-emerald-400',
  wild:    'text-amber-300',
};

// ─── Reel strip: shows 3 symbols, middle is the result ───────────────────────

interface ReelProps {
  symbol:      SlotSymbol;
  isSpinning:  boolean;
  stopDelay:   number;   // ms — stagger each reel
  isWinReel:   boolean;
}

function Reel({ symbol, isSpinning, stopDelay, isWinReel }: ReelProps) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isSpinning) {
      setAnimating(true);
    } else {
      const t = setTimeout(() => setAnimating(false), stopDelay);
      return () => clearTimeout(t);
    }
  }, [isSpinning, stopDelay]);

  // Fake strip items for blur effect during spin
  const stripSymbols: SlotSymbol[] = ['cherry', 'lemon', 'orange', 'grape', 'seven', 'wild', symbol];

  return (
    <div
      className={[
        'relative w-24 h-24 rounded-xl overflow-hidden border-2 bg-[#0d1117] flex items-center justify-center',
        isWinReel
          ? 'border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.55)]'
          : 'border-white/10',
      ].join(' ')}
    >
      {/* Spinning strip */}
      {animating ? (
        <div className="flex flex-col animate-[reelSpin_0.08s_linear_infinite] select-none">
          {stripSymbols.map((s, i) => (
            <span key={i} className={`text-4xl leading-none py-1 text-center ${SYMBOL_COLOR[s]}`}>
              {SYMBOL_EMOJI[s]}
            </span>
          ))}
        </div>
      ) : (
        <span className={`text-5xl select-none ${SYMBOL_COLOR[symbol]}`}>
          {SYMBOL_EMOJI[symbol]}
        </span>
      )}

      {/* Win glow overlay */}
      {isWinReel && !animating && (
        <div className="absolute inset-0 rounded-xl bg-amber-400/10 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SlotMachineProps {
  initialBalance: number;
}

export default function SlotMachine({ initialBalance }: SlotMachineProps) {
  const {
    phase,
    reels,
    lastResult,
    freeSpinsRemaining,
    totalFreeWin,
    balance,
    error,
    config,
    isSpinning,
    canSpin,
    spin,
    onRevealComplete,
    playNextFreeSpin,
    reset,
  } = useSlots(initialBalance);

  const [betAmount, setBetAmount]   = useState(100);
  const [clientSeed, setClientSeed] = useState('');
  const revealTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-signal reveal complete after animation
  useEffect(() => {
    if (phase === 'revealing') {
      revealTimerRef.current = setTimeout(onRevealComplete, 1800);
    }
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [phase, onRevealComplete]);

  const winningLineSet = new Set(lastResult?.winningLine ?? []);
  const isRevealPhase  = phase === 'revealing' || phase === 'freeSpins' || phase === 'idle';

  const handleSpin = () => {
    if (!canSpin) return;
    spin(betAmount, clientSeed || undefined);
  };

  const quickBets = [50, 100, 500, 1000, 5000];

  return (
    <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center p-4 font-sans">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-amber-400 tracking-widest uppercase">Classic Slots</h1>
        <p className="text-white/40 text-sm mt-1">Provably Fair · RTP 96.5%</p>
      </div>

      {/* Balance */}
      <div className="mb-4 bg-white/5 border border-white/10 rounded-xl px-6 py-2 text-center">
        <span className="text-white/50 text-xs uppercase tracking-widest">Balance</span>
        <p className="text-2xl font-bold text-amber-300">
          {balance != null ? `${balance.toLocaleString()} ETB` : '—'}
        </p>
      </div>

      {/* Slot Machine Cabinet */}
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-sm">

        {/* Reels */}
        <div className="flex gap-3 justify-center mb-6">
          {([0, 1, 2] as const).map(i => (
            <Reel
              key={i}
              symbol={reels[i] ?? 'cherry'}
              isSpinning={isSpinning}
              stopDelay={400 + i * 300}   // stagger: 400ms, 700ms, 1000ms
              isWinReel={isRevealPhase && winningLineSet.has(i)}
            />
          ))}
        </div>

        {/* Win / result banner */}
        {phase !== 'idle' && phase !== 'spinning' && lastResult && (
          <div className={[
            'mb-4 rounded-xl px-4 py-3 text-center transition-all',
            lastResult.isWin
              ? 'bg-amber-500/20 border border-amber-500/40'
              : 'bg-white/5 border border-white/10',
          ].join(' ')}>
            {lastResult.isWin ? (
              <>
                <p className="text-amber-300 font-bold text-lg">
                  +{lastResult.payout.toLocaleString()} ETB
                </p>
                <p className="text-white/50 text-xs">{lastResult.winType.replace(/_/g, ' ')} · {lastResult.multiplier}×</p>
              </>
            ) : (
              <p className="text-white/40 text-sm">No win this time</p>
            )}
          </div>
        )}

        {/* Free spin bonus banner */}
        {phase === 'freeSpins' && (
          <div className="mb-4 rounded-xl bg-purple-500/20 border border-purple-400/40 px-4 py-3 text-center">
            <p className="text-purple-300 font-bold">🎉 FREE SPINS BONUS!</p>
            <p className="text-white/50 text-sm">{freeSpinsRemaining} free spins remaining</p>
            {totalFreeWin > 0 && (
              <p className="text-amber-300 text-sm font-semibold mt-1">
                Accumulated: +{totalFreeWin.toLocaleString()} ETB
              </p>
            )}
            <button
              onClick={playNextFreeSpin}
              className="mt-3 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Spin Free!
            </button>
          </div>
        )}

        {/* Bet amount */}
        <div className="mb-3">
          <label className="text-white/40 text-xs uppercase tracking-widest block mb-1">Bet (ETB)</label>
          <input
            type="number"
            min={config?.minBet ?? 1}
            max={config?.maxBet ?? 10000}
            value={betAmount}
            onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {/* Quick bets */}
        <div className="flex gap-1.5 mb-4">
          {quickBets.map(b => (
            <button
              key={b}
              onClick={() => setBetAmount(b)}
              className={[
                'flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium',
                betAmount === b
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20',
              ].join(' ')}
            >
              {b >= 1000 ? `${b / 1000}K` : b}
            </button>
          ))}
        </div>

        {/* Optional client seed */}
        <div className="mb-4">
          <label className="text-white/40 text-xs uppercase tracking-widest block mb-1">
            Client Seed <span className="normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={clientSeed}
            onChange={e => setClientSeed(e.target.value)}
            placeholder="Your custom seed…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {/* Spin button */}
        {phase !== 'freeSpins' && (
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className={[
              'w-full py-3 rounded-xl font-bold text-lg tracking-wider uppercase transition-all',
              canSpin
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_28px_rgba(245,158,11,0.5)]'
                : 'bg-white/10 text-white/30 cursor-not-allowed',
            ].join(' ')}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Spinning…
              </span>
            ) : 'Spin'}
          </button>
        )}

        {/* Error */}
        {phase === 'error' && error && (
          <div className="mt-3 bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-2 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={reset} className="text-red-300 text-xs underline mt-1">Dismiss</button>
          </div>
        )}
      </div>

      {/* Paytable */}
      {config && (
        <div className="mt-6 w-full max-w-sm">
          <h2 className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Paytable</h2>
          <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
            {config.paytable.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-white/70 text-sm">{row.label}</span>
                <span className="text-amber-400 font-bold text-sm">{row.multiplier}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global keyframe injection */}
      <style>{`
        @keyframes reelSpin {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
}
