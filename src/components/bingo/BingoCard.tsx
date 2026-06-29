/**
 * components/bingo/BingoCard.tsx — Premium casino-grade bingo ticket card
 *
 * Changes from original:
 * - Cells are now rounded-full (circular chips) — NO squares
 * - Card header: card number + match progress bar + heat badge
 * - Per-state styling: idle glass, matched purple-glow, winning gold-explosion, new pulse
 * - FREE cell rendered as large star reward chip
 * - All original logic preserved: onCellTap, manual mark, winningCells, activePattern
 */

import React, { useEffect, useRef, useState } from 'react';
import type { WinPattern } from '../../lib/api/bingoApi';
import { patternLabel, patternIcon } from '../../lib/api/bingoApi';
import { FourCornersIndicator } from './WinPatternDisplay';

const COLUMNS = ['B', 'I', 'N', 'G', 'O'] as const;

const COLUMN_COLORS: Record<string, string> = {
  B: '#3B82F6',
  I: '#F97316',
  N: '#EF4444',
  G: '#22C55E',
  O: '#A855F7',
};

// ─── Heat badge ───────────────────────────────────────────────────────────────

type HeatLevel = 'HOT' | 'WARM' | 'SAFE';

function getHeatLevel(matchPct: number): HeatLevel {
  if (matchPct >= 0.65) return 'HOT';
  if (matchPct >= 0.4) return 'WARM';
  return 'SAFE';
}

const HEAT_STYLES: Record<HeatLevel, { bg: string; border: string; color: string; icon: string }> = {
  HOT:  { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   color: '#EF4444', icon: '🔥' },
  WARM: { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.4)',  color: '#F97316', icon: '🔥' },
  SAFE: { bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)',  color: '#60A5FA', icon: '🛡' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BingoCardProps {
  card: number[][];
  drawnBalls: number[];
  matchedCells?: boolean[][];
  winningCells?: boolean[][] | null;
  activePattern?: WinPattern | null;
  winningBall?: number | null;
  onCellTap?: (cellValue: number) => void;
  cardNumber?: number;
  /** If provided, renders the full card header (card# + progress + heat) */
  showHeader?: boolean;
  isWinner?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BingoCard({
  card,
  drawnBalls,
  matchedCells,
  winningCells,
  activePattern,
  winningBall,
  onCellTap,
  cardNumber,
  showHeader = false,
  isWinner = false,
}: BingoCardProps) {
  if (!card || !Array.isArray(card) || !card.every((row) => Array.isArray(row))) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        Invalid card data.
      </div>
    );
  }
  if (card.length !== 5 || !card.every((row) => row.length === 5)) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        Card must be exactly 5×5.
      </div>
    );
  }

  const drawnSet = new Set(drawnBalls);
  const prevDrawnRef = useRef<Set<number>>(new Set());
  const [newlyMarked, setNewlyMarked] = useState<Set<number>>(new Set());

  useEffect(() => {
    const prev = prevDrawnRef.current;
    const fresh = new Set<number>();
    for (const ball of drawnBalls) {
      if (!prev.has(ball)) fresh.add(ball);
    }
    if (fresh.size > 0) {
      setNewlyMarked(fresh);
      const t = setTimeout(() => setNewlyMarked(new Set()), 700);
      prevDrawnRef.current = new Set(drawnBalls);
      return () => clearTimeout(t);
    }
    prevDrawnRef.current = new Set(drawnBalls);
  }, [drawnBalls]);

  // Progress calculation for header
  const totalCells = card.flat().filter((v) => v !== 0).length;
  const matchedCount = matchedCells
    ? matchedCells.flat().filter(Boolean).length
    : drawnBalls.filter((b) => card.flat().includes(b)).length;
  const matchPct = totalCells > 0 ? matchedCount / totalCells : 0;
  const heat = getHeatLevel(matchPct);
  const hs = HEAT_STYLES[heat];

  const gridContent = (
    <div className="w-full" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      {/* ── Card header ── */}
      {showHeader && (
        <div className="mb-3 space-y-2">
          {/* Row 1: card number + heat badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-black"
                style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif" }}
              >
                CARD #{cardNumber}
              </span>
              {isWinner && (
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(247,181,0,0.2)', color: '#F7B500', border: '1px solid rgba(247,181,0,0.3)' }}
                >
                  🏆 WINNER
                </span>
              )}
            </div>
            <span
              className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: hs.bg, border: `1px solid ${hs.border}`, color: hs.color }}
            >
              {hs.icon} {heat}
            </span>
          </div>

          {/* Row 2: pattern + matched */}
          {activePattern && (
            <div className="flex items-center justify-between text-[10px]">
              <span style={{ color: '#64748B' }}>
                PATTERN: <span style={{ color: '#C084FC' }}>{patternLabel(activePattern)}</span>
              </span>
              <span style={{ color: '#64748B' }}>
                MATCHED:{' '}
                <span className="font-black" style={{ color: '#C084FC' }}>
                  {matchedCount}
                </span>
                <span style={{ color: '#475569' }}>/{totalCells}</span>
              </span>
            </div>
          )}

          {/* Row 3: progress bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(matchPct * 100)}%`,
                background: isWinner
                  ? 'linear-gradient(90deg, #F7B500, #d97706)'
                  : 'linear-gradient(90deg, #7C3AED, #A855F7)',
                boxShadow: isWinner
                  ? '0 0 8px rgba(247,181,0,0.5)'
                  : '0 0 8px rgba(124,58,237,0.5)',
              }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-[9px] font-mono" style={{ color: '#475569' }}>
              {Math.round(matchPct * 100)}% complete
            </span>
          </div>
        </div>
      )}

      {/* ── Column headers ── */}
      <div className="grid grid-cols-5 mb-2">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="flex items-center justify-center h-8 text-base font-black tracking-widest"
            style={{ color: COLUMN_COLORS[col] }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* ── Cell grid ── */}
      <div className="grid grid-cols-5 gap-1.5">
        {card.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isFree = cell === 0;
            const isMarked = isFree
              ? true
              : matchedCells
              ? matchedCells[rowIdx]?.[colIdx] === true
              : drawnSet.has(cell);
            const isNew = newlyMarked.has(cell);
            const isWinCell = winningCells?.[rowIdx]?.[colIdx] === true;
            const isWinBall = winningBall != null && cell === winningBall;
            const isTappable = !isFree && !isWinCell && !isMarked && onCellTap !== undefined;

            let cellStyle: React.CSSProperties = {};
            let outerClass =
              'relative flex items-center justify-center rounded-full font-black transition-all duration-300 select-none ';
            // Uniform size for cells
            const sizeClass = 'w-11 h-11 text-xs ';

            if (isFree) {
              cellStyle = {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(79,70,229,0.4))',
                border: '2px solid rgba(124,58,237,0.6)',
                boxShadow: '0 0 12px rgba(124,58,237,0.35)',
              };
            } else if (isWinCell) {
              cellStyle = {
                background: 'linear-gradient(135deg, #F7B500, #d97706)',
                border: '2px solid rgba(247,181,0,0.9)',
                boxShadow: '0 0 24px rgba(247,181,0,0.7), 0 0 8px rgba(247,181,0,0.9)',
                transform: 'scale(1.15)',
                zIndex: 1,
                color: '#000',
              };
            } else if (isMarked && !isFree) {
              cellStyle = {
                background: isNew
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(109,40,217,0.7))'
                  : 'linear-gradient(135deg, rgba(124,58,237,0.55), rgba(79,70,229,0.45))',
                border: '1.5px solid rgba(124,58,237,0.55)',
                boxShadow: isNew
                  ? '0 0 22px rgba(124,58,237,0.7)'
                  : '0 0 10px rgba(124,58,237,0.3)',
                transform: isNew ? 'scale(1.12)' : 'scale(1)',
                color: '#fff',
              };
            } else {
              // idle glass chip
              cellStyle = {
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                color: '#64748B',
              };
              if (isTappable) {
                outerClass += 'cursor-pointer hover:scale-110 hover:border-purple-500/40 hover:bg-purple-600/15 active:scale-95 ';
              }
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={outerClass + sizeClass}
                style={cellStyle}
                onClick={() => isTappable && onCellTap?.(cell)}
              >
                {isFree ? (
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[7px] font-black opacity-60 uppercase tracking-widest">FREE</span>
                    <span className="text-lg leading-none">⭐</span>
                  </div>
                ) : (
                  <>
                    <span className={`${isWinBall ? 'scale-110' : ''} transition-transform`}>
                      {cell}
                    </span>
                    {isMarked && !isWinCell && (
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[9px] pointer-events-none"
                        style={{ color: 'rgba(167,139,250,0.25)' }}
                      >
                        ✓
                      </span>
                    )}
                    {isTappable && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400/60 animate-pulse" />
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (activePattern === 'fourCorners') {
    return <FourCornersIndicator>{gridContent}</FourCornersIndicator>;
  }

  return gridContent;
}