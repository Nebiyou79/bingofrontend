/**
 * components/bingo/MultiCardDeck.tsx — Premium multi-card deck
 *
 * Changes from original:
 * - CardContainer passes showHeader + cardNumber to BingoCard for in-card headers
 * - Winner badge and manual indicator moved into card header (BingoCard handles it)
 * - Tab strip polished with gold winner indicator
 * - Preserved: all layout modes (single / 2-3 scroll / 4-5 tabs), all props
 */

import React, { useState, useRef, useEffect } from 'react';
import { BingoCard } from './BingoCard';
import type { WinPattern } from '../../lib/api/bingoApi';

export interface CardState {
  cardNumber: number;
  card: number[][];
  matchedCells: boolean[][];
  matchedIndices: number[];
  winningCells: boolean[][] | null;
  isActive: boolean;
}

export interface WinnerInfo {
  cardNumber: number;
  userId: string;
  pattern: WinPattern;
  matchedIndices: number[];
  amountWon: number;
}

interface MultiCardDeckProps {
  cards: CardState[];
  drawnBalls: number[];
  activePattern: WinPattern | null;
  winningBall: number | null;
  autoMark: boolean;
  manualMarks: Record<number, Set<number>>;
  onCellTap: (cardNumber: number, cellValue: number) => void;
  winners: WinnerInfo[];
  status?: 'waiting' | 'playing' | 'finished' | 'cancelled' | null;
}

export function MultiCardDeck({
  cards,
  drawnBalls,
  activePattern,
  winningBall,
  autoMark,
  manualMarks,
  onCellTap,
  winners,
  status,
}: MultiCardDeckProps) {
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (cards.length >= 4 && tabRefs.current[activeTab]) {
      tabRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab, cards.length]);

  useEffect(() => { setActiveTab(0); }, [cards.length]);

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center border"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl">🎴</span>
          <p className="text-sm font-semibold" style={{ color: '#64748B' }}>No cards selected yet</p>
          <p className="text-xs" style={{ color: '#374151' }}>Select a card from the grid to get started</p>
        </div>
      </div>
    );
  }

  // ─── Single card ─────────────────────────────────────────────────────────

  if (cards.length === 1) {
    const card = cards[0];
    const isWinner = winners.some((w) => w.cardNumber === card.cardNumber);
    const manualSet = manualMarks[card.cardNumber] || new Set<number>();
    return (
      <div className="max-w-xl mx-auto">
        <CardContainer
          card={card} drawnBalls={drawnBalls} activePattern={activePattern}
          winningBall={winningBall} autoMark={autoMark} manualSet={manualSet}
          onCellTap={(val) => onCellTap(card.cardNumber, val)}
          isWinner={isWinner} status={status}
        />
      </div>
    );
  }

  // ─── 2–3 cards: horizontal scroll ────────────────────────────────────────

  if (cards.length <= 3) {
    return (
      <div className="space-y-3">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 snap-x"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {cards.map((card) => {
            const isWinner = winners.some((w) => w.cardNumber === card.cardNumber);
            const manualSet = manualMarks[card.cardNumber] || new Set<number>();
            return (
              <div key={card.cardNumber} className="flex-shrink-0 w-[280px] snap-center">
                <CardContainer
                  card={card} drawnBalls={drawnBalls} activePattern={activePattern}
                  winningBall={winningBall} autoMark={autoMark} manualSet={manualSet}
                  onCellTap={(val) => onCellTap(card.cardNumber, val)}
                  isWinner={isWinner} status={status} compact
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-1.5">
          {cards.map((_, idx) => (
            <div key={idx} className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: idx === 0 ? '#7C3AED' : 'rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── 4–5 cards: tabs ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {cards.map((card, idx) => {
          const isWinner = winners.some((w) => w.cardNumber === card.cardNumber);
          const isActive = idx === activeTab;
          return (
            <button
              key={card.cardNumber}
              ref={(el) => { tabRefs.current[idx] = el; }}
              onClick={() => setActiveTab(idx)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
              style={{
                background: isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color: isActive ? '#C084FC' : '#64748B',
              }}
            >
              #{card.cardNumber}
              {isWinner && <span className="text-[10px]">🏆</span>}
            </button>
          );
        })}
      </div>

      <div className="max-w-xl mx-auto">
        {cards[activeTab] && (() => {
          const card = cards[activeTab];
          const isWinner = winners.some((w) => w.cardNumber === card.cardNumber);
          const manualSet = manualMarks[card.cardNumber] || new Set<number>();
          return (
            <CardContainer
              card={card} drawnBalls={drawnBalls} activePattern={activePattern}
              winningBall={winningBall} autoMark={autoMark} manualSet={manualSet}
              onCellTap={(val) => onCellTap(card.cardNumber, val)}
              isWinner={isWinner} status={status}
            />
          );
        })()}
      </div>
    </div>
  );
}

// ─── Card container ───────────────────────────────────────────────────────────

interface CardContainerProps {
  card: CardState;
  drawnBalls: number[];
  activePattern: WinPattern | null;
  winningBall: number | null;
  autoMark: boolean;
  manualSet: Set<number>;
  onCellTap: (cellValue: number) => void;
  isWinner: boolean;
  status?: 'waiting' | 'playing' | 'finished' | 'cancelled' | null;
  compact?: boolean;
}

function CardContainer({
  card, drawnBalls, activePattern, winningBall,
  autoMark, manualSet, onCellTap, isWinner, status, compact = false,
}: CardContainerProps) {
  const effectiveMatchedCells = autoMark
    ? card.matchedCells
    : card.card.map((row) => row.map((cell) => cell === 0 || manualSet.has(cell)));

  const remainingCount = card.card.flat().filter((v) => v !== 0).length
    - drawnBalls.filter((b) => card.card.flat().includes(b)).length;

  return (
    <div
      className={[
        'rounded-2xl border overflow-hidden transition-all duration-300',
        isWinner ? 'border-yellow-500/40' : 'border-white/[0.06]',
        compact ? 'scale-[0.97]' : '',
      ].join(' ')}
      style={{
        background: isWinner
          ? 'linear-gradient(135deg, rgba(247,181,0,0.05) 0%, rgba(10,12,20,0.98) 100%)'
          : 'rgba(255,255,255,0.02)',
        boxShadow: isWinner ? '0 0 30px rgba(247,181,0,0.1)' : 'none',
      }}
    >
      {/* Manual mode indicator */}
      {!autoMark && status === 'playing' && (
        <div
          className="w-full px-4 py-1 flex items-center gap-1.5"
          style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.12)' }}
        >
          <span className="text-[9px] text-purple-400 font-mono">✋ MANUAL MARKING MODE</span>
        </div>
      )}

      {/* Card content — header lives INSIDE BingoCard */}
      <div className="p-4 flex justify-center">
        <BingoCard
          card={card.card}
          drawnBalls={autoMark ? drawnBalls : []}
          matchedCells={effectiveMatchedCells}
          winningCells={card.winningCells}
          activePattern={activePattern}
          winningBall={winningBall}
          onCellTap={autoMark ? undefined : onCellTap}
          cardNumber={card.cardNumber}
          showHeader
          isWinner={isWinner}
        />
      </div>

      {/* Card footer */}
      <div className="px-4 pb-3 text-center text-xs" style={{ color: '#475569' }}>
        {isWinner ? (
          <span className="font-black" style={{ color: '#F7B500' }}>🏆 Winning card!</span>
        ) : (
          <span>{remainingCount} number{remainingCount !== 1 ? 's' : ''} remaining</span>
        )}
      </div>
    </div>
  );
}