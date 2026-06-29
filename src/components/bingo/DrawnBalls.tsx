/**
 * components/bingo/DrawnBalls.tsx
 * Shows the last drawn ball large + all previous balls in a scrollable row.
 * Highlights the winning ball with a gold ring when provided.
 * Color-codes by bingo letter: B(1-15)=blue, I(16-30)=green, N(31-45)=yellow,
 * G(46-60)=orange, O(61-75)=red.
 */

import React, { useEffect, useRef } from 'react';

interface DrawnBallsProps {
  drawnBalls: number[];
  /** The ball that triggered the win — rendered with a gold ring. */
  winningBall?: number | null;
}

type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

function getLetter(ball: number): BingoLetter {
  if (ball <= 15) return 'B';
  if (ball <= 30) return 'I';
  if (ball <= 45) return 'N';
  if (ball <= 60) return 'G';
  return 'O';
}

const LETTER_STYLES: Record<BingoLetter, { bg: string; text: string; glow: string }> = {
  B: { bg: 'bg-blue-600',   text: 'text-blue-100',    glow: 'shadow-blue-500/50'   },
  I: { bg: 'bg-green-600',  text: 'text-green-100',   glow: 'shadow-green-500/50'  },
  N: { bg: 'bg-yellow-500', text: 'text-yellow-950',  glow: 'shadow-yellow-400/50' },
  G: { bg: 'bg-orange-500', text: 'text-orange-950',  glow: 'shadow-orange-400/50' },
  O: { bg: 'bg-red-600',    text: 'text-red-100',     glow: 'shadow-red-500/50'    },
};

function BallChip({
  ball,
  size = 'sm',
  isWinning = false,
}: {
  ball: number;
  size?: 'sm' | 'lg';
  isWinning?: boolean;
}) {
  const letter            = getLetter(ball);
  const { bg, text, glow } = LETTER_STYLES[letter];

  const winningRing = isWinning
    ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-800'
    : '';

  if (size === 'lg') {
    return (
      <div
        className={[
          'flex flex-col items-center justify-center rounded-full w-20 h-20',
          'font-black shadow-xl animate-pulse',
          bg, text, `shadow-lg ${glow}`,
          winningRing,
        ].join(' ')}
      >
        <span className="text-xs font-bold opacity-80 -mb-0.5">{letter}</span>
        <span className="text-3xl leading-none">{ball}</span>
        {isWinning && (
          <span className="text-[9px] font-extrabold text-yellow-300 uppercase tracking-widest mt-0.5">
            WIN!
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        'flex-shrink-0 flex flex-col items-center justify-center rounded-full w-9 h-9',
        'font-bold text-xs shadow',
        bg, text,
        winningRing,
      ].join(' ')}
    >
      <span className="text-[8px] font-bold leading-none opacity-80">{letter}</span>
      <span className="text-sm leading-none">{ball}</span>
    </div>
  );
}

/**
 * Displays the most recently drawn ball prominently and all prior balls
 * in a horizontally scrollable strip below.
 */
export function DrawnBalls({ drawnBalls, winningBall }: DrawnBallsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastBall  = drawnBalls[drawnBalls.length - 1];
  const prevBalls = drawnBalls.slice(0, -1).reverse(); // most recent first

  // Auto-scroll to show newest ball
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [drawnBalls.length]);

  if (drawnBalls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-sm font-medium">
          ?
        </div>
        <p className="text-gray-600 text-sm">Waiting for first ball…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Last drawn ball — large with animation */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Last drawn
        </span>
        {lastBall !== undefined && (
          <BallChip
            ball={lastBall}
            size="lg"
            isWinning={winningBall != null && lastBall === winningBall}
          />
        )}
      </div>

      {/* History row */}
      {prevBalls.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 max-w-full px-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {prevBalls.map((ball, i) => (
            <BallChip
              key={`${ball}-${i}`}
              ball={ball}
              size="sm"
              isWinning={winningBall != null && ball === winningBall}
            />
          ))}
        </div>
      )}

      <span className="text-xs text-gray-600">
        {drawnBalls.length} ball{drawnBalls.length !== 1 ? 's' : ''} drawn
      </span>
    </div>
  );
}