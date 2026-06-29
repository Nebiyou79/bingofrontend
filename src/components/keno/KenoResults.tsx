// components/keno/KenoResults.tsx
/**
 * DashBets — KenoResults (Professional redesign §6.5 / Quick Wins)
 *
 * Changes from original:
 *  - DrawnBall: 3D highlight dot added (matches KenoBoard style)
 *  - Ball colors: 4 bands (red/amber/purple/cyan) using 20-number ranges
 *  - Font: var(--font-display) / var(--font-mono) throughout
 *  - Teal accent replaces gold for interactive elements (Quick Win §5)
 *  - Stats row styled with panel-elevated mini-cards
 *  - Loading skeletons match teal accent dim background
 *  - Settled badge uses teal instead of green outline
 */
import React from 'react';
import type { KenoHistoryRound } from '../../hooks/useKenoSocket';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
  gold:      'var(--gold,      #f5c842)',
  green:     'var(--green,     #00c853)',
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

// ─── Ball palette — 4 bands of 20 numbers ─────────────────────────────────────
const BALL_PALETTE = [
  { bg: '#dc2626', border: '#ef4444', glow: 'rgba(220,38,38,0.45)' },   // 1–20
  { bg: '#d97706', border: '#f59e0b', glow: 'rgba(217,119,6,0.45)'  },  // 21–40
  { bg: '#7c3aed', border: '#a855f7', glow: 'rgba(124,58,237,0.45)' },  // 41–60
  { bg: '#0891b2', border: '#22d3ee', glow: 'rgba(8,145,178,0.45)'  },  // 61–80
];

function ballColor(n: number) {
  return BALL_PALETTE[Math.min(Math.floor((n - 1) / 20), 3)];
}

// ─── §6.5 — 3D ball with highlight dot ────────────────────────────────────────
function DrawnBall({ n }: { n: number }) {
  const c = ballColor(n);
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black text-white relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${c.bg}ee, ${c.bg}88)`,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
        fontFamily: T.mono,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {/* 3D highlight dot — same pattern as KenoBoard */}
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
      <span className="relative z-10">{n}</span>
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function KenoResults({
  rounds,
  loading,
}: {
  rounds:  KenoHistoryRound[];
  loading: boolean;
}) {
  if (loading && !rounds.length) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl animate-pulse"
            style={{
              background: T.accentDim,
              border: `1px solid rgba(0,212,170,0.08)`,
              borderRadius: T.rLg,
            }}
          />
        ))}
      </div>
    );
  }

  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center py-12 gap-3">
        <span className="text-3xl">🔢</span>
        <p
          style={{
            fontFamily: T.display,
            fontSize: '13px',
            fontWeight: 700,
            color: T.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          No Results Yet
        </p>
        <p style={{ fontFamily: T.mono, fontSize: '11px', color: T.textMuted }}>
          Completed rounds will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rounds.map((round) => (
        <div
          key={round._id}
          className="rounded-2xl overflow-hidden"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.rLg,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: T.border }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: T.accentDim,
                  border: `1px solid rgba(0,212,170,0.18)`,
                }}
              >
                <span
                  style={{
                    fontFamily: T.display,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: T.accent,
                  }}
                >
                  #{round.roundNumber}
                </span>
              </div>
              <span
                style={{
                  fontFamily: T.display,
                  fontSize: '13px',
                  fontWeight: 700,
                  color: T.textPri,
                }}
              >
                Round {round.roundNumber}
              </span>
            </div>

            {/* Settled badge — teal instead of original green outline */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: T.accent }}
              >
                <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                  <path
                    d="M1 3l2 2 3-4"
                    stroke={T.accent}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: T.display,
                  fontSize: '10px',
                  fontWeight: 700,
                  color: T.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Settled
              </span>
            </div>
          </div>

          {/* Drawn numbers sorted asc (this is the results list view — sorted is fine here) */}
          <div className="px-4 pt-3 flex flex-wrap gap-1.5">
            {[...round.drawnNumbers].sort((a, b) => a - b).map((n) => (
              <DrawnBall key={n} n={n} />
            ))}
          </div>

          {/* Stats row — §6.5: panel-elevated mini-cards */}
          <div
            className="grid grid-cols-3 gap-2 px-4 pb-4 pt-3"
          >
            {[
              { label: 'Bets',    value: String(round.totalBets) },
              { label: 'Wagered', value: `${round.totalWagered} ETB` },
              { label: 'Paid',    value: `${round.totalPayout} ETB` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg px-2 py-2 text-center"
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
                    letterSpacing: '0.08em',
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: T.display,
                    fontSize: '13px',
                    fontWeight: 700,
                    color: T.textPri,
                    marginTop: '2px',
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}