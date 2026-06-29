// components/keno/KenoTimer.tsx
/**
 * KenoTimer — premium gold countdown clock + draw progress bar.
 * Used inside the "Next Draw" right-panel card.
 */
import React from 'react';

const GOLD  = '#f5c842';
const GOLD2 = '#e8a800';

interface KenoTimerProps {
  secondsLeft: number;
  status:      'betting' | 'drawing' | 'settled';
  ballIndex:   number;
  totalBalls:  number;
  roundNumber: number;
}

export function KenoTimer({
  secondsLeft,
  status,
  ballIndex,
  totalBalls,
  roundNumber,
}: KenoTimerProps) {
  const mm       = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss       = String(secondsLeft % 60).padStart(2, '0');
  const isUrgent = status === 'betting' && secondsLeft <= 10;
  const pct      = status === 'drawing'
    ? Math.min(100, (ballIndex / totalBalls) * 100)
    : 0;

  return (
    <div className="flex flex-col items-center gap-3 w-full">

      {/* Round badge */}
      <div className="flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: GOLD }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(245,200,66,0.6)', fontFamily: "'Rajdhani', sans-serif" }}
        >
          Round {String(roundNumber).padStart(7, '0')}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: GOLD }}
        />
      </div>

      {/* ── BETTING: big flip-clock digits ── */}
      {status === 'betting' && (
        <div className={`flex items-center gap-1 ${isUrgent ? 'animate-pulse' : ''}`}>
          {[mm, ss].map((val, i) => (
            <React.Fragment key={i}>
              {i === 1 && (
                <span
                  className="text-3xl font-black font-mono pb-1"
                  style={{ color: isUrgent ? '#ef4444' : 'rgba(245,200,66,0.5)' }}
                >
                  :
                </span>
              )}
              <div
                className="relative flex items-center justify-center w-16 h-20 rounded-2xl font-mono font-black text-4xl tabular-nums"
                style={{
                  background: isUrgent
                    ? 'rgba(239,68,68,0.1)'
                    : 'rgba(245,200,66,0.06)',
                  border: isUrgent
                    ? '1px solid rgba(239,68,68,0.3)'
                    : `1px solid rgba(245,200,66,0.15)`,
                  color: isUrgent ? '#ef4444' : GOLD,
                  boxShadow: isUrgent
                    ? '0 0 20px rgba(239,68,68,0.2)'
                    : `0 0 20px rgba(245,200,66,0.15)`,
                  fontFamily: "'Rajdhani', sans-serif",
                  textShadow: `0 0 30px ${isUrgent ? 'rgba(239,68,68,0.6)' : 'rgba(245,200,66,0.5)'}`,
                }}
              >
                {val}
                {/* Center divider line */}
                <div
                  className="absolute left-0 right-0 top-1/2 h-px"
                  style={{ background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(245,200,66,0.1)' }}
                />
                {/* Top shine */}
                <div
                  className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── DRAWING: animated progress ── */}
      {status === 'drawing' && (
        <div className="w-full space-y-3">
          {/* Ball counter */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-black uppercase tracking-wider"
              style={{ color: '#f97316', fontFamily: "'Rajdhani', sans-serif" }}
            >
              ⚡ Drawing Live
            </span>
            <span
              className="text-sm font-bold font-mono tabular-nums"
              style={{ color: GOLD }}
            >
              {ballIndex} / {totalBalls}
            </span>
          </div>
          {/* Progress bar */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, #f97316, ${GOLD})`,
                boxShadow: '0 0 8px rgba(249,115,22,0.6)',
              }}
            />
          </div>
          {/* Animated drawing indicator */}
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{
                  background: '#f97316',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── SETTLED ── */}
      {status === 'settled' && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#22c55e', background: 'rgba(34,197,94,0.1)' }}
          >
            <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
              <path
                d="M1.5 6.5L5.5 10.5L14 2"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: '#22c55e', fontFamily: "'Rajdhani', sans-serif" }}
          >
            Round Settled
          </span>
          <span className="text-[10px] text-gray-600 font-mono">Next round starting…</span>
        </div>
      )}

      {/* Status label */}
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          color: isUrgent
            ? '#ef4444'
            : status === 'betting'
            ? 'rgba(245,200,66,0.6)'
            : status === 'drawing'
            ? '#f97316'
            : '#22c55e',
        }}
      >
        {status === 'betting'
          ? isUrgent ? '⚡ Bets Closing!' : 'Bets Open'
          : status === 'drawing'
          ? 'Live Draw'
          : 'Settled'}
      </span>
    </div>
  );
}
