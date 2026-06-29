/**
 * components/bingo/CurrentBallDisplay.tsx
 * §2.4 — Large current ball + small previous-ball history strip.
 */

import React from 'react';

type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

function getLetter(ball: number): BingoLetter {
  if (ball <= 15) return 'B';
  if (ball <= 30) return 'I';
  if (ball <= 45) return 'N';
  if (ball <= 60) return 'G';
  return 'O';
}

const LETTER_STYLES: Record<BingoLetter, { bg: string; text: string }> = {
  B: { bg: 'bg-blue-500',   text: 'text-white' },
  I: { bg: 'bg-orange-400', text: 'text-white' },
  N: { bg: 'bg-red-500',    text: 'text-white' },
  G: { bg: 'bg-green-500',  text: 'text-white' },
  O: { bg: 'bg-red-400',    text: 'text-white' },
};

interface CurrentBallDisplayProps {
  drawnBalls: number[];
  winningBall?: number | null;
}

export function CurrentBallDisplay({ drawnBalls, winningBall }: CurrentBallDisplayProps) {
  const lastBall  = drawnBalls[drawnBalls.length - 1];
  const prevBalls = drawnBalls.slice(-5, -1).reverse();

  if (drawnBalls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-600 flex items-center justify-center text-gray-600 text-2xl font-black">
          ?
        </div>
        <p className="text-xs text-gray-600">Waiting for draw…</p>
      </div>
    );
  }

  const letter     = getLetter(lastBall);
  const { bg, text } = LETTER_STYLES[letter];
  const isWin      = winningBall != null && lastBall === winningBall;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Large current ball */}
      <div
        className={[
          'w-20 h-20 rounded-full flex flex-col items-center justify-center font-black shadow-xl',
          bg, text,
          isWin ? 'ring-4 ring-yellow-400 scale-110' : 'animate-pulse',
        ].join(' ')}
      >
        <span className="text-xs font-bold opacity-80 -mb-0.5">{letter}</span>
        <span className="text-3xl leading-none">{lastBall}</span>
      </div>

      {/* Previous balls strip */}
      {prevBalls.length > 0 && (
        <div className="flex gap-1.5 items-center">
          {prevBalls.map((ball, i) => {
            const l = getLetter(ball);
            const s = LETTER_STYLES[l];
            return (
              <div
                key={`${ball}-${i}`}
                className={[
                  'w-8 h-8 rounded-full flex flex-col items-center justify-center font-bold text-[9px]',
                  s.bg, s.text,
                  winningBall === ball ? 'ring-2 ring-yellow-300' : '',
                ].join(' ')}
              >
                <span className="leading-none opacity-70">{l}</span>
                <span className="text-xs leading-none">{ball}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
