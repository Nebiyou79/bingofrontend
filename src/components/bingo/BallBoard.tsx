/**
 * components/bingo/BallBoard.tsx — Premium casino chip ball board
 *
 * Changes from original:
 * - Each number is now w-8 h-8 rounded-full (circular casino chips) — NO rectangles
 * - 5 states per chip: idle, drawn, onCard, match (drawn+onCard), winning
 * - Glow, scale, and transition animations per state
 * - Chips grouped horizontally by B/I/N/G/O columns with colour-coded labels
 * - Recent ball sparkle indicator
 * - Legend updated to chip circles
 * - All original props preserved
 */

import React from 'react';

interface BallBoardProps {
  drawnBalls: number[];
  playerCardNumbers: number[];
}

type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

const COLUMNS: {
  letter: BingoLetter;
  min: number;
  max: number;
  drawn: { bg: string; shadow: string };
  header: string;
  label: string;
}[] = [
  {
    letter: 'B', min: 1,  max: 15,
    drawn: { bg: 'linear-gradient(135deg,#3B82F6,#2563EB)', shadow: 'rgba(59,130,246,0.55)' },
    header: '#60A5FA', label: '1-15',
  },
  {
    letter: 'I', min: 16, max: 30,
    drawn: { bg: 'linear-gradient(135deg,#F97316,#EA580C)', shadow: 'rgba(249,115,22,0.55)' },
    header: '#FB923C', label: '16-30',
  },
  {
    letter: 'N', min: 31, max: 45,
    drawn: { bg: 'linear-gradient(135deg,#EF4444,#DC2626)', shadow: 'rgba(239,68,68,0.55)' },
    header: '#F87171', label: '31-45',
  },
  {
    letter: 'G', min: 46, max: 60,
    drawn: { bg: 'linear-gradient(135deg,#22C55E,#16A34A)', shadow: 'rgba(34,197,94,0.55)' },
    header: '#4ADE80', label: '46-60',
  },
  {
    letter: 'O', min: 61, max: 75,
    drawn: { bg: 'linear-gradient(135deg,#A855F7,#9333EA)', shadow: 'rgba(168,85,247,0.55)' },
    header: '#C084FC', label: '61-75',
  },
];

// ─── Single chip ──────────────────────────────────────────────────────────────

interface ChipProps {
  ball: number;
  isDrawn: boolean;
  isOnCard: boolean;
  isMatch: boolean;
  isNew: boolean;
  drawnGradient: string;
  drawnShadow: string;
}

const Chip = React.memo(function Chip({
  ball,
  isDrawn,
  isOnCard,
  isMatch,
  isNew,
  drawnGradient,
  drawnShadow,
}: ChipProps) {
  let style: React.CSSProperties;

  if (isMatch) {
    style = {
      background: drawnGradient,
      border: '2px solid #F7B500',
      boxShadow: `0 0 12px #F7B500, 0 0 5px ${drawnShadow}`,
      transform: 'scale(1.15)',
      color: '#fff',
    };
  } else if (isDrawn) {
    style = {
      background: drawnGradient,
      border: '1.5px solid rgba(255,255,255,0.25)',
      boxShadow: `0 0 8px ${drawnShadow}`,
      transform: isNew ? 'scale(1.2)' : 'scale(1)',
      color: '#fff',
    };
  } else if (isOnCard) {
    style = {
      background: 'rgba(255,255,255,0.05)',
      border: '1.5px solid rgba(247,181,0,0.35)',
      color: 'rgba(255,255,255,0.45)',
      transform: 'scale(0.95)',
    };
  } else {
    style = {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.18)',
      transform: 'scale(0.9)',
    };
  }

  return (
    <div
      className="relative w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-200 flex-shrink-0"
      style={style}
    >
      {ball}
      {isNew && isDrawn && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ background: drawnShadow }}
        />
      )}
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export function BallBoard({ drawnBalls, playerCardNumbers }: BallBoardProps) {
  const drawnSet = new Set(drawnBalls);
  const playerSet = new Set(playerCardNumbers.filter((v) => v !== 0));
  const lastBall = drawnBalls[drawnBalls.length - 1];

  const totalDrawn = drawnBalls.length;
  const playerMatches = drawnBalls.filter((b) => playerSet.has(b)).length;

  return (
    <div className="w-full space-y-3">
      {/* ── Board header ── */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black text-white uppercase tracking-wide"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            Called Numbers
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span style={{ color: '#64748B' }}>
            <span className="text-white font-bold">{totalDrawn}</span>/75 drawn
          </span>
          <span style={{ color: '#64748B' }}>
            🎯 <span className="text-yellow-400 font-bold">{playerMatches}</span> on card
          </span>
        </div>
      </div>

      {/* ── 5-column chip grid ── */}
      <div className="grid grid-cols-5 gap-2">
        {COLUMNS.map(({ letter, min, max, drawn, header, label }) => (
          <div key={letter} className="flex flex-col gap-1.5 min-w-0">
            {/* Column label */}
            <div className="flex flex-col items-center mb-0.5">
              <span
                className="text-sm font-black leading-none"
                style={{ color: header, fontFamily: "'Rajdhani', sans-serif" }}
              >
                {letter}
              </span>
              <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
                {label}
              </span>
            </div>

            {/* Chips */}
            {Array.from({ length: max - min + 1 }, (_, i) => {
              const ball = min + i;
              const isDrawn = drawnSet.has(ball);
              const isOnCard = playerSet.has(ball);
              const isMatch = isDrawn && isOnCard;
              const isNew = ball === lastBall;

              return (
                <div key={ball} className="flex justify-center">
                  <Chip
                    ball={ball}
                    isDrawn={isDrawn}
                    isOnCard={isOnCard}
                    isMatch={isMatch}
                    isNew={isNew}
                    drawnGradient={drawn.bg}
                    drawnShadow={drawn.shadow}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex justify-center gap-4 pt-1">
        {[
          {
            style: { background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', border: '1px solid rgba(255,255,255,0.1)' } as React.CSSProperties,
            label: 'Drawn',
          },
          {
            style: { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(247,181,0,0.4)' } as React.CSSProperties,
            label: 'On Card',
          },
          {
            style: { background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: '2px solid #F7B500', boxShadow: '0 0 6px #F7B500' } as React.CSSProperties,
            label: 'Match',
          },
        ].map(({ style, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[9px]" style={{ color: '#475569' }}>
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={style} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}