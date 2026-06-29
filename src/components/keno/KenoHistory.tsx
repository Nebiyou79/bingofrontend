// components/keno/KenoHistory.tsx
/**
 * DashBets — KenoHistory (Professional redesign §6.5)
 *
 * Changes from original:
 *  - Left color-bar: 4px wide absolute strip — green if won, red if all-loss,
 *    muted if no participation; positioned on left edge of each row card
 *  - Drawn numbers: shown in DRAW ORDER (not sorted asc) with tiny draw-order
 *    index number beneath each ball — more exciting, matches real Keno sites
 *  - Repeat button: full-width secondary button at bottom of expanded section
 *    (was small icon in header)
 *  - Font: var(--font-display) / var(--font-mono) throughout
 *  - Teal accent replaces gold as interactive color (Quick Win §5)
 *  - disabled:opacity-35 (Quick Win §4)
 */
import React, { useState } from 'react';
import type { KenoHistoryRound } from '../../hooks/useKenoSocket';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
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

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── §6.5 — Ball in draw order with draw index label beneath ──────────────────
function DrawnBallOrdered({ n, drawIndex }: { n: number; drawIndex: number }) {
  const palette = [
    { bg: '#dc2626', border: '#ef4444' },  // 1–20  red
    { bg: '#d97706', border: '#f59e0b' },  // 21–40 amber
    { bg: '#7c3aed', border: '#a855f7' },  // 41–60 purple
    { bg: '#0891b2', border: '#22d3ee' },  // 61–80 cyan
  ];
  const c = palette[Math.min(Math.floor((n - 1) / 20), 3)];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black text-white relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${c.bg}ee, ${c.bg}88)`,
          border: `2px solid ${c.border}`,
          fontFamily: T.mono,
        }}
      >
        {/* 3D highlight dot */}
        <span
          className="absolute"
          style={{
            top: '2px',
            left: '3px',
            width: '4px',
            height: '2px',
            borderRadius: '99px',
            background: 'rgba(255,255,255,0.55)',
          }}
        />
        <span className="relative z-10">{n}</span>
      </span>
      {/* §6.5 — tiny draw order index beneath each ball */}
      <span
        style={{
          fontFamily: T.mono,
          fontSize: '8px',
          color: T.textMuted,
          lineHeight: 1,
        }}
      >
        #{drawIndex + 1}
      </span>
    </div>
  );
}

// ─── Mini ball for ticket picks (expanded section) ─────────────────────────────
function TicketPickBall({ n, hit }: { n: number; hit: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black relative overflow-hidden"
      style={{
        fontFamily: T.mono,
        ...(hit ? {
          background: '#16a34a',
          border: '2px solid #4ade80',
          color: '#fff',
        } : {
          background: T.elevated,
          border: `1px solid ${T.border}`,
          color: T.textMuted,
        }),
      }}
    >
      {hit && (
        <span
          className="absolute"
          style={{
            top: '2px',
            left: '3px',
            width: '4px',
            height: '2px',
            borderRadius: '99px',
            background: 'rgba(255,255,255,0.55)',
          }}
        />
      )}
      <span className="relative z-10">{n}</span>
    </span>
  );
}

// ─── §6.5 — Left color-bar helper ─────────────────────────────────────────────
function leftBarColor(won: number, staked: number, hasMe: boolean): string {
  if (!hasMe)    return T.textMuted;
  if (won > 0)   return T.green;
  if (staked > 0) return T.red;
  return T.textMuted;
}

interface Props {
  rounds:       KenoHistoryRound[];
  pagination:   { page: number; totalPages: number; total: number } | null;
  loading:      boolean;
  onPageChange: (p: number) => void;
  onRepeat:     (id: string) => void;
}

export function KenoHistory({ rounds, pagination, loading, onPageChange, onRepeat }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading && !rounds.length) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl animate-pulse"
            style={{ background: T.accentDim, border: `1px solid rgba(0,212,170,0.08)` }}
          />
        ))}
      </div>
    );
  }

  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center py-12 gap-3">
        <span className="text-3xl">📋</span>
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
          No History Yet
        </p>
        <p style={{ fontFamily: T.mono, fontSize: '11px', color: T.textMuted }}>
          Your past rounds will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rounds.map((round) => {
        const won    = round.myTickets.reduce((s, t) => s + t.payout, 0);
        const staked = round.myTickets.reduce((s, t) => s + t.betAmount, 0);
        const hasMe  = round.myTickets.length > 0;
        const isOpen = expanded === round._id;
        const barColor = leftBarColor(won, staked, hasMe);

        return (
          <div
            key={round._id}
            className="rounded-2xl overflow-hidden transition-all duration-200 relative"
            style={{
              background: won > 0 ? 'rgba(0,200,83,0.04)' : T.surface,
              border: won > 0
                ? '1px solid rgba(0,200,83,0.18)'
                : `1px solid ${T.border}`,
              borderRadius: T.rLg,
            }}
          >
            {/* §6.5 — Left color-bar (4px absolute strip) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '4px',
                background: barColor,
                borderRadius: `${T.rLg} 0 0 ${T.rLg}`,
                opacity: hasMe ? 1 : 0.3,
              }}
            />

            {/* Summary row (with 4px left padding offset for the bar) */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : round._id)}
              className="w-full flex items-center justify-between text-left transition-colors hover:brightness-110 focus:outline-none"
              style={{ padding: '12px 16px 12px 20px' }}
            >
              <div className="flex items-center gap-3">
                {/* Round badge */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{
                    background: T.accentDim,
                    border: `1px solid rgba(0,212,170,0.15)`,
                    color: T.accent,
                    fontFamily: T.display,
                  }}
                >
                  #{round.roundNumber}
                </div>

                <div>
                  <p
                    style={{
                      fontFamily: T.display,
                      fontSize: '14px',
                      fontWeight: 700,
                      color: T.textPri,
                      lineHeight: 1,
                    }}
                  >
                    Round {round.roundNumber}
                  </p>
                  <p style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted, marginTop: '2px' }}>
                    {fmt(round.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Win/loss badge */}
                {hasMe && won > 0 && (
                  <span
                    style={{
                      fontFamily: T.display,
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: 'rgba(0,200,83,0.12)',
                      border: '1px solid rgba(0,200,83,0.25)',
                      color: T.green,
                    }}
                  >
                    +{won} ETB
                  </span>
                )}
                {hasMe && won === 0 && (
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: T.elevated,
                      color: T.textMuted,
                    }}
                  >
                    No win
                  </span>
                )}

                {/* Chevron */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke={T.accent}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeOpacity="0.5"
                  />
                </svg>
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div
                className="space-y-4 border-t"
                style={{ borderColor: T.border, padding: '12px 12px 16px 20px' }}
              >
                {/* My tickets */}
                {round.myTickets.length > 0 && (
                  <div className="space-y-2">
                    <p
                      style={{
                        fontFamily: T.display,
                        fontSize: '10px',
                        fontWeight: 700,
                        color: T.accent,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      My Tickets · Staked {staked} ETB
                    </p>
                    {round.myTickets.map((t, ti) => (
                      <div
                        key={t._id ?? ti}
                        className="rounded-xl px-3 py-2.5"
                        style={
                          t.isWin ? {
                            background: 'rgba(0,200,83,0.06)',
                            border: '1px solid rgba(0,200,83,0.18)',
                            borderRadius: T.rMd,
                          } : {
                            background: T.elevated,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.rMd,
                          }
                        }
                      >
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {t.pickedNumbers.map((n) => (
                            <TicketPickBall key={n} n={n} hit={t.matches.includes(n)} />
                          ))}
                        </div>
                        <div
                          className="flex justify-between"
                          style={{ fontFamily: T.mono, fontSize: '10px' }}
                        >
                          <span style={{ color: T.textMuted }}>
                            Bet{' '}
                            <span style={{ color: T.textPri }}>{t.betAmount} ETB</span>
                            {' · '}
                            {t.matchCount} matched
                          </span>
                          {t.isWin ? (
                            <span style={{ fontWeight: 700, color: '#4ade80' }}>
                              Win {t.payout} ETB
                            </span>
                          ) : (
                            <span style={{ color: T.textMuted }}>No win</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* §6.5 — Drawn numbers in DRAW ORDER with index labels */}
                {round.drawnNumbers.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: T.display,
                        fontSize: '10px',
                        fontWeight: 700,
                        color: T.accent,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '10px',
                      }}
                    >
                      Draw Order
                    </p>
                    {/* Draw order — NOT sorted, shown as drawn */}
                    <div className="flex flex-wrap gap-2">
                      {round.drawnNumbers.map((n, drawIndex) => (
                        <DrawnBallOrdered key={n} n={n} drawIndex={drawIndex} />
                      ))}
                    </div>
                  </div>
                )}

                {/* §6.5 — Full-width repeat button at bottom of expanded section */}
                {hasMe && (
                  <button
                    type="button"
                    onClick={() => onRepeat(round._id)}
                    className="w-full flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none"
                    style={{
                      padding: '10px 16px',
                      borderRadius: T.rMd,
                      background: T.accentDim,
                      border: `1px solid rgba(0,212,170,0.25)`,
                      color: T.accent,
                      fontFamily: T.display,
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>↺</span>
                    Repeat Bets from This Round
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="transition-all disabled:opacity-35 hover:brightness-110 focus:outline-none"
            style={{
              padding: '8px 16px',
              borderRadius: T.rMd,
              background: T.accentDim,
              border: `1px solid rgba(0,212,170,0.20)`,
              color: T.accent,
              fontFamily: T.display,
              fontSize: '12px',
              fontWeight: 700,
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="transition-all disabled:opacity-35 hover:brightness-110 focus:outline-none"
            style={{
              padding: '8px 16px',
              borderRadius: T.rMd,
              background: T.accentDim,
              border: `1px solid rgba(0,212,170,0.20)`,
              color: T.accent,
              fontFamily: T.display,
              fontSize: '12px',
              fontWeight: 700,
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}