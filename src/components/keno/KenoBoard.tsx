// components/keno/KenoBoard.tsx
/**
 * Keno 80-number board — Professional redesign (DashBets UI Guide §6.1)
 *
 * Changes from original:
 *  - gap: 5px → 4px (tighter grid)
 *  - Cell size: min-w-[28px] max-w-[44px] added (responsive overflow fix)
 *  - `latest` state: bane-ball-pop keyframe (scale 1→1.3→1.1→1) replaces static scale(1.25)
 *  - `selected` state: 3D white highlight dot (top-left <span> overlay)
 *  - `match` state: green ring ripple animation on reveal
 *  - Number font: var(--font-mono) / JetBrains Mono for crisp tabular numbers
 *  - Loading spinner: border-t-[var(--accent)] teal (Quick Win §7)
 *  - disabled:opacity-35 (Quick Win §4)
 */
import React, { useCallback } from 'react';

interface KenoBoardProps {
  selected:   number[];
  drawn:      number[];
  latestBall: number | null;
  onToggle:   (n: number) => void;
  disabled:   boolean;
  maxSpots?:  number;
}

const ALL = Array.from({ length: 80 }, (_, i) => i + 1);

type CellState = 'latest' | 'match' | 'drawn' | 'selected' | 'idle';

function getState(
  n: number,
  selected: number[],
  drawn: number[],
  latest: number | null,
): CellState {
  if (n === latest)                              return 'latest';
  if (drawn.includes(n) && selected.includes(n)) return 'match';
  if (drawn.includes(n))                         return 'drawn';
  if (selected.includes(n))                      return 'selected';
  return 'idle';
}

function getCellStyle(state: CellState): React.CSSProperties {
  switch (state) {
    case 'latest':
      return {
        background: 'radial-gradient(circle at 35% 35%, #fb923c, #ea580c)',
        border: '2px solid #fdba74',
        color: '#fff',
        zIndex: 10,
        boxShadow: '0 0 18px rgba(249,115,22,0.8), inset 0 1px 0 rgba(255,255,255,0.3)',
        animation: 'bane-ball-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      };
    case 'match':
      return {
        background: 'radial-gradient(circle at 35% 35%, #22c55e, #16a34a)',
        border: '2px solid #4ade80',
        color: '#fff',
        boxShadow: '0 0 14px rgba(34,197,94,0.7), inset 0 1px 0 rgba(255,255,255,0.25)',
        animation: 'bane-match-reveal 0.35s ease forwards',
      };
    case 'drawn':
      return {
        background: 'radial-gradient(circle at 35% 35%, rgba(120,40,10,0.95), rgba(80,20,5,0.9))',
        border: '1px solid rgba(154,52,18,0.4)',
        color: '#fb923c',
        opacity: 0.8,
      };
    case 'selected':
      return {
        background: 'radial-gradient(circle at 35% 35%, #f5c842, #e8a800)',
        border: '2px solid rgba(245,200,66,0.7)',
        color: '#0e0b14',
        boxShadow: '0 0 14px rgba(245,200,66,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
        fontWeight: 900,
      };
    default: // idle
      return {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: '#d1d5db',
      };
  }
}

export function KenoBoard({
  selected,
  drawn,
  latestBall,
  onToggle,
  disabled,
  maxSpots = 10,
}: KenoBoardProps) {
  const atMax = selected.length >= maxSpots;

  const handleKey = useCallback(
    (e: React.KeyboardEvent, n: number) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onToggle(n);
      }
    },
    [onToggle],
  );

  return (
    <>
      <style>{`
        /* §6.1 — ball-pop: scales 1→1.3→1.1→1 over 400ms (more dramatic than static 1.25) */
        @keyframes bane-ball-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.3); }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* §6.1 — match reveal: quick grow-in when ball is confirmed a hit */
        @keyframes bane-match-reveal {
          0%   { transform: scale(0.85); opacity: 0.6; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* §6.1 — ring ripple: green circle expands + fades out from matched cell */
        @keyframes bane-ring-ripple {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* §6.1 — selected highlight dot pulses gently */
        @keyframes bane-dot-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.9; }
        }

        .keno-cell {
          /* §6.1 — min/max width for responsive overflow fix */
          min-width: 28px;
          max-width: 44px;
        }
      `}</style>

      <div
        className="grid gap-[4px]"
        style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        role="group"
        aria-label="Keno number grid 1–80"
      >
        {ALL.map((n) => {
          const state    = getState(n, selected, drawn, latestBall);
          const isLocked = disabled || (atMax && state === 'idle');
          const cellStyle = getCellStyle(state);

          return (
            <button
              key={n}
              type="button"
              onClick={() => !isLocked && onToggle(n)}
              onKeyDown={(e) => !isLocked && handleKey(e, n)}
              disabled={isLocked && state !== 'selected'}
              aria-pressed={state === 'selected' || state === 'match'}
              aria-label={`Number ${n}`}
              className={[
                'keno-cell aspect-square flex items-center justify-center rounded-lg',
                'font-bold select-none',
                'transition-all duration-100',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#00d4aa)]',
                'relative overflow-visible',
                /* §6.1 — disabled:opacity-35 (Quick Win §4) */
                isLocked && state === 'idle'
                  ? 'cursor-default opacity-35'
                  : 'cursor-pointer hover:brightness-110',
              ].join(' ')}
              style={{
                ...cellStyle,
                /* §6.1 — JetBrains Mono for crisp tabular numbers */
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '11px',
              }}
            >
              {/* 3D shine overlay — all ball states */}
              <span
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%)',
                }}
              />

              {/* §6.1 — 3D highlight dot (top-left) for selected state */}
              {state === 'selected' && (
                <span
                  className="absolute"
                  style={{
                    top: '3px',
                    left: '4px',
                    width: '5px',
                    height: '3px',
                    borderRadius: '99px',
                    background: 'rgba(255,255,255,0.65)',
                    animation: 'bane-dot-pulse 2s ease-in-out infinite',
                  }}
                />
              )}

              {/* §6.1 — green ring ripple overlay on match */}
              {state === 'match' && (
                <span
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    border: '2px solid rgba(74,222,128,0.8)',
                    animation: 'bane-ring-ripple 0.5s ease-out forwards',
                  }}
                />
              )}

              {/* Bottom indicator dot for selected */}
              {state === 'selected' && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'rgba(14,11,20,0.5)' }}
                />
              )}

              <span className="relative z-10">{n}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}