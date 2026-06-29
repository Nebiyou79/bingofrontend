// components/keno/KenoResult.tsx
/**
 * DashBets — KenoResult (Professional redesign §6.6)
 *
 * Changes from original:
 *  - Win state: CSS-only confetti (20 particles, random colors teal/gold/green,
 *    different animation-delay values per particle)
 *  - Payout count-up: eased step (cubic ease-out: faster start, slow near target)
 *    step = Math.max(1, Math.ceil((target - current) / 10))
 *  - Your picks: ball stagger animation, each ball animates in with
 *    animation-delay: calc(N * 0.04s)
 *  - "Play Again" → "NEW ROUND →" using .btn-cta teal style
 *  - Font: var(--font-display) / var(--font-mono) throughout
 *  - All accent colors → teal var(--accent) (Quick Win §5)
 */
import React, { useEffect, useRef } from 'react';
import type { KenoResult as KenoResultType } from '../../lib/api/kenoApi';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
  accentGlow:'var(--accent-glow,rgba(0,212,170,0.30))',
  gold:      'var(--gold,      #f5c842)',
  gold2:     '#e8a800',
  green:     'var(--green,     #00c853)',
  red:       'var(--red,       #ff4757)',
  surface:   'var(--bg-surface,  #141824)',
  elevated:  'var(--bg-elevated, #1c2132)',
  border:    'var(--border,    rgba(255,255,255,0.07))',
  textPri:   'var(--text-primary,   #e8ecf4)',
  textSec:   'var(--text-secondary, #8b93a7)',
  textMuted: 'var(--text-muted,    #4a5168)',
  mono:      "var(--font-mono, 'JetBrains Mono', monospace)",
  display:   "var(--font-display, 'Barlow Condensed', sans-serif)",
  body:      "var(--font-body, 'DM Sans', sans-serif)",
  rMd:       'var(--r-md, 10px)',
  rLg:       'var(--r-lg, 16px)',
};

// ─── §6.6 Confetti particle config ─────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#00d4aa', '#00ffe7', '#f5c842', '#00c853',
  '#4ade80', '#fbbf24', '#34d399', '#a3e635',
];

const CONFETTI_COUNT = 20;

function Confetti() {
  const particles = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const color  = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left   = `${5 + Math.random() * 90}%`;
    const delay  = `${(i * 0.11).toFixed(2)}s`;
    const dur    = `${0.9 + Math.random() * 0.7}s`;
    const size   = `${4 + Math.floor(Math.random() * 5)}px`;
    const rotate = `${Math.floor(Math.random() * 360)}deg`;
    const drift  = `${-40 + Math.floor(Math.random() * 80)}px`;
    return { color, left, delay, dur, size, rotate, drift, i };
  });

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
      style={{ borderRadius: T.rLg }}
    >
      {particles.map(({ color, left, delay, dur, size, rotate, drift, i }) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-10px',
            left,
            width: size,
            height: size,
            background: color,
            borderRadius: i % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${rotate})`,
            animation: `bane-confetti-fall ${dur} ease-in ${delay} both`,
            '--drift': drift,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Pick ball with stagger-in ─────────────────────────────────────────────────
function PickBall({ n, hit, index }: { n: number; hit: boolean; index: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black relative overflow-hidden"
      style={{
        fontFamily: T.mono,
        fontVariantNumeric: 'tabular-nums',
        /* §6.6 — stagger: each ball animates in at 0.04s intervals */
        animation: `bane-ball-stagger-in 0.35s cubic-bezier(0.34,1.56,0.64,1) ${(index * 0.04).toFixed(2)}s both`,
        ...(hit ? {
          background: 'radial-gradient(circle at 35% 35%, #22c55e, #16a34a)',
          border: '2px solid #4ade80',
          color: '#fff',
          boxShadow: '0 0 8px rgba(34,197,94,0.5)',
        } : {
          background: T.elevated,
          border: `1px solid ${T.border}`,
          color: T.textMuted,
        }),
      }}
    >
      {/* 3D highlight dot for hit balls */}
      {hit && (
        <span
          className="absolute"
          style={{
            top: '3px',
            left: '4px',
            width: '5px',
            height: '3px',
            borderRadius: '99px',
            background: 'rgba(255,255,255,0.55)',
          }}
        />
      )}
      <span className="relative z-10">{n}</span>
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface KenoResultProps {
  result:          KenoResultType;
  selectedNumbers: number[];
  onDismiss:       () => void;
}

export function KenoResult({ result, selectedNumbers, onDismiss }: KenoResultProps) {
  const { isWin, payout, matchCount, matches, newBalance, matchRatio } = result;
  const matchPct  = Math.round((matchRatio ?? 0) * 100);
  const payoutRef = useRef<HTMLSpanElement>(null);

  // §6.6 — eased count-up: step = ceil((target - current) / 10) for ease-out feel
  useEffect(() => {
    if (!isWin || !payoutRef.current || !payout) return;
    const target = payout;
    let current  = 0;
    const tick = () => {
      // Cubic ease-out: big steps early, small steps near target
      const step = Math.max(1, Math.ceil((target - current) / 10));
      current = Math.min(current + step, target);
      if (payoutRef.current) {
        payoutRef.current.textContent = `+${current.toLocaleString()}`;
      }
      if (current < target) {
        requestAnimationFrame(tick);
      }
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isWin, payout]);

  return (
    <>
      <style>{`
        /* §6.6 — confetti particle fall */
        @keyframes bane-confetti-fall {
          0%   { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
          80%  { opacity: 1; }
          100% {
            transform: translateY(320px) rotate(480deg) translateX(var(--drift, 0px));
            opacity: 0;
          }
        }

        /* §6.6 — ball stagger-in for picks reveal */
        @keyframes bane-ball-stagger-in {
          0%   { opacity: 0; transform: scale(0.5) translateY(6px); }
          60%  { transform: scale(1.15) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Result card slide-up on mount */
        @keyframes bane-result-in {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .bane-result-card {
          animation: bane-result-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
      `}</style>

      <div
        className="bane-result-card rounded-2xl overflow-hidden relative"
        style={          isWin ? {
            background: `linear-gradient(160deg, rgba(0,200,83,0.10), ${T.surface} 60%)`,
            border: '1px solid rgba(0,200,83,0.30)',
            boxShadow: '0 0 40px rgba(0,200,83,0.10)',
            borderRadius: T.rLg,
          } : {
            background: `linear-gradient(160deg, rgba(255,71,87,0.08), ${T.surface} 60%)`,
            border: `1px solid rgba(255,71,87,0.20)`,
            borderRadius: T.rLg,
          }
        }
      >
        {/* §6.6 — confetti (win only) */}
        {isWin && <Confetti />}

        {/* Header band */}
        <div
          className="px-5 py-3 text-center relative z-10"
          style={
            isWin ? {
              background: `linear-gradient(135deg, ${T.accent}, #00ffe7)`,
            } : {
              background: 'rgba(255,71,87,0.15)',
            }
          }
        >
          <span
            style={{
              fontFamily: T.display,
              fontSize: '16px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: isWin ? '#0b0e17' : '#fca5a5',
            }}
          >
            {isWin ? '🏆 YOU WIN!' : '😔 Better Luck Next Time'}
          </span>
        </div>

        <div className="px-5 py-4 space-y-4 relative z-10">

          {/* §6.6 — Payout count-up (eased) */}
          {isWin && (
            <div className="text-center">
              <p
                style={{
                  fontFamily: T.mono,
                  fontSize: '10px',
                  color: T.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}
              >
                Payout
              </p>
              <p
                style={{
                  fontFamily: T.display,
                  fontSize: '48px',
                  fontWeight: 900,
                  color: '#4ade80',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span ref={payoutRef}>+0</span>
                <span style={{ fontSize: '22px', marginLeft: '8px', color: '#16a34a' }}>ETB</span>
              </p>
            </div>
          )}

          {/* Match stats */}
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: T.elevated,
              border: `1px solid ${T.border}`,
              borderRadius: T.rMd,
            }}
          >
            <p
              style={{
                fontFamily: T.mono,
                fontSize: '9px',
                color: T.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '4px',
              }}
            >
              Numbers Matched
            </p>
            <p
              style={{
                fontFamily: T.display,
                fontSize: '36px',
                fontWeight: 900,
                color: isWin ? T.accent : T.textMuted,
                lineHeight: 1,
              }}
            >
              {matchCount}{' '}
              <span style={{ fontSize: '20px', color: T.textMuted }}>
                / {selectedNumbers.length}
              </span>
            </p>
          </div>

          {/* Match ratio progress bar */}
          <div>
            <div
              className="flex justify-between mb-1.5"
              style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}
            >
              <span>Match ratio</span>
              <span>{matchPct}%</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: T.elevated }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, matchPct)}%`,
                  background: isWin
                    ? `linear-gradient(90deg, ${T.accent}, #00ffe7)`
                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
                }}
              />
            </div>
          </div>

          {/* §6.6 — Your picks with stagger-in animation */}
          {selectedNumbers.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: T.display,
                  fontSize: '10px',
                  fontWeight: 700,
                  color: T.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                }}
              >
                Your Picks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNumbers.map((n, idx) => (
                  <PickBall
                    key={n}
                    n={n}
                    hit={matches.includes(n)}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* New balance */}
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{
              background: T.elevated,
              border: `1px solid ${T.border}`,
              borderRadius: T.rMd,
            }}
          >
            <span
              style={{
                fontFamily: T.mono,
                fontSize: '10px',
                color: T.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              New Balance
            </span>
            <span
              style={{
                fontFamily: T.display,
                fontSize: '18px',
                fontWeight: 900,
                color: T.gold,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {(newBalance ?? 0).toLocaleString()}{' '}
              <span style={{ fontSize: '13px', color: T.gold2 }}>ETB</span>
            </span>
          </div>

          {/* §6.6 — "NEW ROUND →" using .btn-cta teal */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full relative overflow-hidden focus:outline-none transition-all active:scale-[0.97] hover:brightness-105"
            style={{
              background: T.accent,
              border: 'none',
              borderRadius: T.rMd,
              padding: '14px 24px',
              color: '#0b0e17',
              fontFamily: T.display,
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: `0 6px 24px ${T.accentGlow}`,
              cursor: 'pointer',
            }}
          >
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)',
                borderRadius: T.rMd,
              }}
            />
            <span className="relative z-10">NEW ROUND →</span>
          </button>
        </div>
      </div>
    </>
  );
}