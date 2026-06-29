// components/giovani/GiovaniReels.tsx
/**
 * DashBets — Giovani Reel Frame (5×3 grid, 25 paylines)
 *
 * Renders the full slot machine: 5 reel columns × 3 rows, ornate
 * gold-and-violet bezel, a REAL scrolling spin animation, staggered left to
 * right like a physical machine, simultaneous multi-line win highlighting,
 * scatter counter, and a full-screen tiered win modal.
 *
 * ── Animation model ──────────────────────────────────────────────────────
 * Two distinct phases, each with its own motion:
 *
 * 1. SPINNING (server call in flight, real grid unknown yet): each reel
 *    plays a CSS @keyframes loop that continuously scrolls a tall strip of
 *    random filler symbols upward, looping seamlessly. This is real,
 *    continuous, GPU-driven motion — not a React state swap — so it never
 *    looks frozen no matter how long the server takes to respond.
 *
 * 2. REVEALING (grid is known): the CSS loop is removed and replaced with a
 *    ONE-SHOT transition that scrolls from the current visual offset to the
 *    exact resting position that shows the real result in the viewport,
 *    decelerating into place (cubic-bezier ease-out). Reels stop staggered
 *    left to right. Because the resting offset is always computed from the
 *    strip's actual layout (filler rows + final rows), the reel can never
 *    settle on the wrong symbols.
 *
 * Palette: near-black void background, signature violet (#a855f7) for the
 * machine's structural bezel and regular line wins, gold (#f59e0b/#fbbf24)
 * reserved for jackpot framing, scatter/bonus, and money figures, cyan
 * (#22d3ee) for the free-spins bonus state.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GiovaniPhase } from '../../hooks/useGiovani';
import type { GiovaniGrid, GiovaniSymbol, WinningLine } from '../../lib/api/giovaniApi';

const SYMBOL_GLYPH: Record<GiovaniSymbol, string> = {
  ten:   '🔟',
  jack:  '🂡',
  queen: '👸',
  king:  '🤴',
  ace:   '♠️',
  gem:   '💎',
  lion:  '🦁',
  crown: '👑',
  chest: '📦',
};

const ALL_SYMBOLS: GiovaniSymbol[] = ['ten', 'jack', 'queen', 'king', 'ace', 'gem', 'lion', 'crown', 'chest'];

function fmt(value: unknown, fallback = '0'): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString();
}

function randomSymbol(): GiovaniSymbol {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}

const REEL_COUNT = 5;
const ROW_COUNT  = 3;
const CELL_PX    = 88;

const FILLER_ROWS = 10;
const STRIP_LENGTH = FILLER_ROWS + ROW_COUNT;
const REST_OFFSET_PX = FILLER_ROWS * CELL_PX;

type WinTier = 'none' | 'win' | 'big' | 'super' | 'jackpot';

function getWinTier(payout: number): WinTier {
  if (payout >= 300) return 'jackpot';
  if (payout >= 100) return 'super';
  if (payout >= 50)  return 'big';
  if (payout > 0)    return 'win';
  return 'none';
}

const TIER_STYLE: Record<WinTier, { label: string; color: string; glow: string; accent: string }> = {
  none:    { label: '',          color: '#d8b4fe', glow: 'rgba(168,85,247,0.40)', accent: '#a855f7' },
  win:     { label: 'WIN',       color: '#e9d5ff', glow: 'rgba(168,85,247,0.50)', accent: '#a855f7' },
  big:     { label: 'BIG WIN',   color: '#fde68a', glow: 'rgba(251,191,36,0.60)', accent: '#fbbf24' },
  super:   { label: 'SUPER WIN', color: '#fed7aa', glow: 'rgba(249,115,22,0.65)', accent: '#fb923c' },
  jackpot: { label: 'JACKPOT',   color: '#fef08a', glow: 'rgba(251,191,36,0.80)', accent: '#fbbf24' },
};

interface GiovaniReelsProps {
  phase:               GiovaniPhase;
  grid:                GiovaniGrid;
  winningLines:        WinningLine[];
  scatterCount:        number;
  payout:              number;
  multiplier:          number;
  winType:             string;
  onRevealComplete:    () => void;
  isFreeSpinBonus:     boolean;
  freeSpinsRemaining:  number;
  totalFreeWin:        number;
}

const REEL_STOP_DELAY_MS = [500, 700, 900, 1100, 1300];
const STOP_TRANSITION_MS = 550;

export function GiovaniReels({
  phase,
  grid,
  winningLines,
  scatterCount,
  payout,
  multiplier,
  winType,
  onRevealComplete,
  isFreeSpinBonus,
  freeSpinsRemaining,
  totalFreeWin,
}: GiovaniReelsProps) {
  const [reelStrips, setReelStrips] = useState<GiovaniSymbol[][]>(
    Array.from({ length: REEL_COUNT }, () => {
      const filler = Array.from({ length: FILLER_ROWS }, randomSymbol);
      return [...filler, 'ten', 'ten', 'ten'] as GiovaniSymbol[];
    }),
  );
  const [reelMotion, setReelMotion] = useState<Array<'looping' | 'settling' | 'rest'>>(
    ['rest', 'rest', 'rest', 'rest', 'rest'],
  );

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isSpinning   = phase === 'spinning' || phase === 'freeSpinning';
  const isRevealing  = phase === 'revealing';
  const isWin        = payout > 0;
  const tier         = getWinTier(payout);
  const isJackpot    = tier === 'jackpot' || winType.includes('CROWN') || winType.startsWith('SCATTER_BONUS');
  const inBonus      = phase === 'freeSpins' || isFreeSpinBonus;

  const allSettled = reelMotion.every(m => m === 'rest');

  const [showWinModal, setShowWinModal] = useState(false);
  const lastCelebratedPayoutKey = useRef<string>('');

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    clearAllTimers();

    if (isSpinning) {
      setShowWinModal(false);
      setReelStrips(
        Array.from({ length: REEL_COUNT }, () =>
          Array.from({ length: STRIP_LENGTH }, randomSymbol),
        ),
      );
      setReelMotion(['looping', 'looping', 'looping', 'looping', 'looping']);
      return clearAllTimers;
    }

    if (isRevealing) {
      setReelStrips(prev => prev.map((_, reelIdx) => {
        const finalCol = grid[reelIdx] ?? ['ten', 'ten', 'ten'];
        const filler = Array.from({ length: FILLER_ROWS }, randomSymbol);
        return [...filler, ...finalCol];
      }));

      REEL_STOP_DELAY_MS.forEach((stopDelay, reelIdx) => {
        const t = setTimeout(() => {
          setReelMotion(prev => {
            const next = [...prev];
            next[reelIdx] = 'settling';
            return next;
          });

          const settleTimer = setTimeout(() => {
            setReelMotion(prev => {
              const next = [...prev];
              next[reelIdx] = 'rest';
              return next;
            });
            if (reelIdx === REEL_STOP_DELAY_MS.length - 1) {
              const finishTimer = setTimeout(onRevealComplete, 300);
              timersRef.current.push(finishTimer);
            }
          }, STOP_TRANSITION_MS);
          timersRef.current.push(settleTimer);
        }, stopDelay);
        timersRef.current.push(t);
      });
    }

    return clearAllTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, JSON.stringify(grid)]);

  const showWinBanner = allSettled && !isRevealing && isWin && phase !== 'spinning';

  useEffect(() => {
    if (!showWinBanner) return;
    const key = `${payout}-${winType}-${winningLines.length}`;
    if (lastCelebratedPayoutKey.current === key) return;
    lastCelebratedPayoutKey.current = key;
    setShowWinModal(true);
  }, [showWinBanner, payout, winType, winningLines.length]);

  const winningCellSet = useMemo(() => {
    if (!showWinBanner) return new Set<string>();
    const set = new Set<string>();
    winningLines.forEach(line => {
      line.cells.forEach(([reel, row]) => set.add(`${reel}-${row}`));
    });
    return set;
  }, [winningLines, showWinBanner]);

  const scatterCellSet = useMemo(() => {
    const set = new Set<string>();
    grid.forEach((col, reel) => col.forEach((sym, row) => {
      if (sym === 'chest') set.add(`${reel}-${row}`);
    }));
    return set;
  }, [grid]);

  const tierStyle = TIER_STYLE[isJackpot ? 'jackpot' : tier];

  const frameGlow = isJackpot
    ? '0 0 0 1px rgba(245,158,11,0.45), 0 28px 70px -20px rgba(245,158,11,0.35)'
    : tier === 'super'
    ? '0 0 0 1px rgba(249,115,22,0.35), 0 26px 65px -20px rgba(249,115,22,0.30)'
    : tier === 'big'
    ? '0 0 0 1px rgba(251,191,36,0.30), 0 25px 62px -20px rgba(251,191,36,0.25)'
    : inBonus
    ? '0 0 0 1px rgba(34,211,238,0.25), 0 24px 60px -20px rgba(34,211,238,0.20)'
    : '0 24px 60px -20px rgba(168,85,247,0.25)';

  return (
    <div className="rounded-3xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, #1a1220 0%, #0a0610 60%, #0a0610 100%)',
        border: '1px solid rgba(245,158,11,0.20)',
        boxShadow: frameGlow,
      }}>

      <div className="h-1" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)' }} />

      {inBonus && (
        <div className="px-5 py-2.5 flex items-center justify-between text-xs font-black"
          style={{ background: 'rgba(34,211,238,0.12)', borderBottom: '1px solid rgba(34,211,238,0.25)', color: '#67e8f9' }}>
          <span className="uppercase tracking-widest">👑 Royal Free Spins · 2× Multiplier</span>
          <span className="font-mono tabular-nums">{freeSpinsRemaining} left · +{fmt(totalFreeWin)} ETB</span>
        </div>
      )}

      <div className="p-4 sm:p-7">
        <div className="rounded-2xl p-3 sm:p-5 relative"
          style={{
            background: 'linear-gradient(180deg, #221730 0%, #0e0815 100%)',
            border: '1px solid rgba(245,158,11,0.30)',
            boxShadow: 'inset 0 2px 24px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {Array.from({ length: REEL_COUNT }).map((_, reelIdx) => {
              const motion = reelMotion[reelIdx];
              const strip  = reelStrips[reelIdx];
              const isMoving = motion !== 'rest';
              const restTransform = `translateY(-${REST_OFFSET_PX}px)`;

              return (
                <div
                  key={reelIdx}
                  className="relative rounded-lg sm:rounded-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, #150c1f, #06040a)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    height: `${ROW_COUNT * CELL_PX}px`,
                  }}>
                  {isMoving && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-4 z-10 pointer-events-none"
                        style={{ background: 'linear-gradient(180deg, #06040a, transparent)' }} />
                      <div className="absolute bottom-0 left-0 right-0 h-4 z-10 pointer-events-none"
                        style={{ background: 'linear-gradient(0deg, #06040a, transparent)' }} />
                    </>
                  )}

                  <div
                    style={
                      motion === 'looping'
                        ? { animation: `giovani-reel-loop-${reelIdx % 3} 0.55s linear infinite` }
                        : motion === 'settling'
                        ? { transform: restTransform, transition: `transform ${STOP_TRANSITION_MS}ms cubic-bezier(0.16, 0.84, 0.32, 1.1)` }
                        : { transform: restTransform, transition: 'none' }
                    }
                  >
                    {strip.map((symbol, idx) => {
                      const rowIdx = idx - FILLER_ROWS;
                      const isRealRow    = rowIdx >= 0;
                      const cellKey      = `${reelIdx}-${rowIdx}`;
                      const onWinLine    = motion === 'rest' && isRealRow && winningCellSet.has(cellKey);
                      const isScatterHit = motion === 'rest' && isRealRow && scatterCellSet.has(cellKey) && scatterCount >= 3 && showWinBanner;
                      const goldRing     = (onWinLine && isJackpot) || isScatterHit;

                      return (
                        <div key={idx}
                          className="relative flex items-center justify-center"
                          style={{
                            height: `${CELL_PX}px`,
                            border: goldRing ? '2px solid #fbbf24' : onWinLine ? '2px solid #a855f7' : '1px solid transparent',
                            boxShadow: goldRing
                              ? '0 0 26px rgba(251,191,36,0.65), inset 0 0 18px rgba(251,191,36,0.18)'
                              : onWinLine
                              ? '0 0 22px rgba(168,85,247,0.55), inset 0 0 16px rgba(168,85,247,0.15)'
                              : 'none',
                          }}>
                          <span className="text-2xl sm:text-4xl select-none" style={{ filter: isMoving ? 'blur(1.5px)' : 'none' }}>
                            {SYMBOL_GLYPH[symbol] ?? '❓'}
                          </span>
                          {(onWinLine || isScatterHit) && (
                            <span className="absolute inset-0 pointer-events-none"
                              style={{
                                background: goldRing
                                  ? 'radial-gradient(circle, rgba(251,191,36,0.22), transparent 70%)'
                                  : 'radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)',
                                animation: 'giovani-pulse 1.1s ease-in-out infinite',
                              }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {showWinBanner && winningLines.length > 0 && (
            <div className="absolute inset-3 sm:inset-5 pointer-events-none">
              {winningLines.slice(0, 3).map((line, i) => (
                <div key={line.lineIndex}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${(16.5 + i * 33) % 100}%`,
                    height: 2,
                    background: isJackpot
                      ? 'linear-gradient(90deg, transparent, #fbbf24, transparent)'
                      : 'linear-gradient(90deg, transparent, #a855f7, transparent)',
                    opacity: 0.5,
                  }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 px-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5b5266' }}>
          <span>25 Paylines</span>
          <span className="flex items-center gap-1.5">
            📦 Scatter: <span className="font-mono" style={{ color: scatterCount >= 3 ? '#fbbf24' : '#5b5266' }}>{scatterCount}/5</span>
          </span>
        </div>

        <div className="mt-3 text-center min-h-[1.5rem] flex items-center justify-center">
          {phase === 'spinning' && (
            <p className="text-sm font-bold animate-pulse" style={{ color: '#7c6f93' }}>Spinning…</p>
          )}
          {phase === 'freeSpinning' && (
            <p className="text-sm font-bold animate-pulse" style={{ color: '#67e8f9' }}>Free spin in progress…</p>
          )}
          {phase === 'freeSpins' && !showWinBanner && (
            <p className="text-sm font-bold" style={{ color: '#67e8f9' }}>
              Ready — tap <strong>Spin Free</strong> to continue ({freeSpinsRemaining} remaining)
            </p>
          )}
          {phase === 'idle' && payout === 0 && (
            <p className="text-xs" style={{ color: '#4b5563' }}>Place your bet and spin to play</p>
          )}
          {phase === 'error' && (
            <p className="text-sm font-bold" style={{ color: '#f87171' }}>Something went wrong — try again</p>
          )}
        </div>
      </div>

      {showWinModal && showWinBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,2,10,0.72)', backdropFilter: 'blur(4px)', animation: 'giovani-modal-fade-in 200ms ease-out' }}
          onClick={() => setShowWinModal(false)}
        >
          <div
            className="relative rounded-3xl px-8 sm:px-14 py-8 sm:py-12 text-center max-w-sm sm:max-w-md w-full"
            style={{
              background: isJackpot
                ? 'linear-gradient(165deg, #2a1a08 0%, #150c1f 70%)'
                : tier === 'super'
                ? 'linear-gradient(165deg, #2a1408 0%, #150c1f 70%)'
                : tier === 'big'
                ? 'linear-gradient(165deg, #261c08 0%, #150c1f 70%)'
                : 'linear-gradient(165deg, #1f1530 0%, #150c1f 70%)',
              border: `2px solid ${tierStyle.accent}`,
              boxShadow: `0 0 0 1px ${tierStyle.glow}, 0 30px 90px -20px ${tierStyle.glow}, 0 0 80px ${tierStyle.glow}`,
              animation: 'giovani-modal-pop 480ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-6 right-6 h-1 rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${tierStyle.accent}, transparent)` }} />

            <p className="text-3xl mb-2">{isJackpot ? '👑' : tier === 'super' ? '🔥' : tier === 'big' ? '✨' : '🎉'}</p>

            <h2
              className="font-black uppercase tracking-widest mb-3"
              style={{
                fontSize: isJackpot || tier === 'super' ? '2rem' : '1.5rem',
                color: tierStyle.color,
                textShadow: `0 0 30px ${tierStyle.glow}`,
              }}
            >
              {isJackpot ? '👑 Royal Jackpot' : tierStyle.label}
            </h2>

            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#a89bb8' }}>
              {winningLines.length} winning line{winningLines.length === 1 ? '' : 's'} · {multiplier}× bet
            </p>

            <p
              className="font-black font-mono tabular-nums mb-6"
              style={{ fontSize: isJackpot || tier === 'super' ? '2.75rem' : '2.25rem', color: '#fbbf24' }}
            >
              +{fmt(payout)} ETB
            </p>

            <button
              onClick={() => setShowWinModal(false)}
              className="px-8 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide transition-transform active:scale-95"
              style={{
                background: `linear-gradient(160deg, ${tierStyle.accent}, ${tierStyle.accent}cc)`,
                color: '#1a1220',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes giovani-reel-loop-0 {
          from { transform: translateY(0); }
          to   { transform: translateY(-${CELL_PX}px); }
        }
        @keyframes giovani-reel-loop-1 {
          from { transform: translateY(0); }
          to   { transform: translateY(-${CELL_PX}px); }
        }
        @keyframes giovani-reel-loop-2 {
          from { transform: translateY(0); }
          to   { transform: translateY(-${CELL_PX}px); }
        }
        @keyframes giovani-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.85; }
        }
        @keyframes giovani-modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes giovani-modal-pop {
          0%   { transform: scale(0.7) translateY(20px); opacity: 0; }
          60%  { transform: scale(1.04) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}