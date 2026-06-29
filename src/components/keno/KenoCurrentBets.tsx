// components/keno/KenoCurrentBets.tsx
/**
 * DashBets — KenoCurrentBets (Professional redesign §6.4)
 *
 * Changes from original:
 *  - Number balls: radial-gradient 3D ball style matching KenoBoard (with highlight dot)
 *  - Live hit counter badge: green hit-flash animation (1 flash per hit) instead of animate-pulse
 *  - Match progress bar: h-2 (was h-1); segmented tick marks per pick position
 *  - Font: var(--font-display) / var(--font-mono) throughout
 *  - disabled:opacity-35 (Quick Win §4)
 *  - Teal accent replaces gold as primary interactive color (Quick Win §5)
 */
import React, { useRef, useEffect } from 'react';
import type { KenoTicket } from '../../hooks/useKenoSocket';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
  gold:      'var(--gold,      #f5c842)',
  gold2:     '#e8a800',
  green:     'var(--green,     #00c853)',
  greenDim:  'var(--green-dim, rgba(0,200,83,0.12))',
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

interface Props {
  tickets:    KenoTicket[];
  drawnSoFar: number[];
  status:     'betting' | 'drawing' | 'settled';
}

// ─── §6.4 — 3D number ball matching KenoBoard style ───────────────────────────
function NumberBall({ n, state }: { n: number; state: 'match' | 'drawn' | 'idle' }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-xs font-black relative overflow-hidden transition-all duration-200"
      style={{
        width: '32px',
        height: '32px',
        fontFamily: T.mono,
        fontVariantNumeric: 'tabular-nums',
        ...(state === 'match' ? {
          background: 'radial-gradient(circle at 35% 35%, #22c55e, #16a34a)',
          border: '2px solid #4ade80',
          color: '#fff',
          boxShadow: '0 0 10px rgba(34,197,94,0.5)',
        } : state === 'drawn' ? {
          background: 'radial-gradient(circle at 35% 35%, rgba(120,40,10,0.95), rgba(80,20,5,0.9))',
          border: '1px solid rgba(154,52,18,0.4)',
          color: '#fb923c',
        } : {
          background: T.elevated,
          border: `1px solid ${T.border}`,
          color: T.textMuted,
        }),
      }}
    >
      {/* §6.4 — 3D highlight dot top-left (same as KenoBoard selected state) */}
      {(state === 'match' || state === 'drawn') && (
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

// ─── §6.4 — Hit flash badge (replaces animate-pulse) ──────────────────────────
function HitBadge({ count, prevCount }: { count: number; prevCount: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (count > prevCount && ref.current) {
      ref.current.classList.remove('bane-hit-flash');
      // Force reflow
      void ref.current.offsetWidth;
      ref.current.classList.add('bane-hit-flash');
    }
  }, [count, prevCount]);

  return (
    <span
      ref={ref}
      className="px-2 py-0.5 rounded-full text-[10px] font-black"
      style={{
        background: 'rgba(0,200,83,0.15)',
        border: '1px solid rgba(0,200,83,0.35)',
        color: T.green,
        fontFamily: T.display,
      }}
    >
      {count} Hit{count !== 1 ? 's' : ''}!
    </span>
  );
}

// ─── §6.4 — Segmented match progress bar ──────────────────────────────────────
function MatchBar({
  hitCount,
  totalPicks,
  isWin,
}: {
  hitCount: number;
  totalPicks: number;
  isWin: boolean;
}) {
  const pct = totalPicks > 0 ? Math.round((hitCount / totalPicks) * 100) : 0;

  return (
    <div>
      <div
        className="flex justify-between mb-1.5"
        style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted }}
      >
        <span>
          {hitCount} / {totalPicks} matched
        </span>
        <span>{pct}%</span>
      </div>

      {/* §6.4 — h-2 bar (was h-1) with segment tick marks */}
      <div className="relative" style={{ height: '8px' }}>
        {/* Track */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: T.elevated }}
        >
          {/* Fill */}
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isWin
                ? 'linear-gradient(90deg, #00c853, #4ade80)'
                : `linear-gradient(90deg, ${T.accent}, #00ffe7)`,
            }}
          />
        </div>

        {/* §6.4 — segment tick marks: one per expected pick position */}
        {totalPicks > 1 && Array.from({ length: totalPicks - 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${((i + 1) / totalPicks) * 100}%`,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function KenoCurrentBets({ tickets, drawnSoFar, status }: Props) {
  const drawnSet     = new Set(drawnSoFar);
  const totalWagered = tickets.reduce((s, t) => s + t.betAmount, 0);
  const totalWon     = tickets.filter((t) => t.isWin).reduce((s, t) => s + t.payout, 0);

  // Track previous hit counts for flash animation
  const prevHitsRef = useRef<Record<string, number>>({});

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: T.accentDim, border: `1px solid rgba(0,212,170,0.20)` }}
        >
          🎯
        </div>
        <div className="text-center">
          <p
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: T.accent, fontFamily: T.display }}
          >
            No Active Bets
          </p>
          <p style={{ fontFamily: T.mono, fontSize: '11px', color: T.textMuted, marginTop: '4px' }}>
            Pick numbers and place your bet for this round.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* §6.4 — hit-flash: bright green flash, 1 cycle, replaces animate-pulse */
        @keyframes bane-hit-flash {
          0%   { background: rgba(0,200,83,0.15); box-shadow: none; }
          30%  { background: rgba(0,200,83,0.45); box-shadow: 0 0 12px rgba(0,200,83,0.6); }
          100% { background: rgba(0,200,83,0.15); box-shadow: none; }
        }
        .bane-hit-flash {
          animation: bane-hit-flash 0.5s ease-out forwards;
        }
      `}</style>

      <div className="space-y-4">

        {/* Summary bar */}
        <div
          className="grid grid-cols-3 gap-3 rounded-xl p-3"
          style={{
            background: T.accentDim,
            border: `1px solid rgba(0,212,170,0.15)`,
            borderRadius: T.rMd,
          }}
        >
          {[
            { label: 'Tickets', value: String(tickets.length), color: T.accent },
            { label: 'Staked',  value: `${totalWagered} ETB`,  color: T.textPri },
            { label: 'Won',     value: totalWon > 0 ? `+${totalWon} ETB` : '—', color: totalWon > 0 ? T.green : T.textMuted },
          ].map(({ label, value, color }, idx) => (
            <div
              key={label}
              className="text-center"
              style={idx === 1 ? { borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, padding: '0 4px' } : {}}
            >
              <p style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </p>
              <p
                className="text-xl font-black"
                style={{ color, fontFamily: T.display }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Ticket cards */}
        {tickets.map((ticket, i) => {
          const liveMatches = ticket.pickedNumbers.filter((n) => drawnSet.has(n));
          const isSettled   = ticket.status === 'settled';
          const isWin       = isSettled && ticket.isWin;
          const hitCount    = isSettled ? ticket.matchCount : liveMatches.length;
          const ticketKey   = ticket._id ?? String(i);
          const prevHits    = prevHitsRef.current[ticketKey] ?? 0;

          // Update ref for next render
          if (!isSettled) {
            prevHitsRef.current[ticketKey] = hitCount;
          }

          return (
            <div
              key={ticketKey}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={
                isWin ? {
                  background: 'linear-gradient(135deg, rgba(0,200,83,0.08), rgba(20,24,36,0.98))',
                  border: '1px solid rgba(0,200,83,0.25)',
                  boxShadow: '0 0 20px rgba(0,200,83,0.06)',
                  borderRadius: T.rLg,
                } : isSettled ? {
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.rLg,
                } : {
                  background: T.surface,
                  border: `1px solid rgba(0,212,170,0.15)`,
                  borderRadius: T.rLg,
                }
              }
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: isWin ? 'rgba(0,200,83,0.15)' : T.border }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: T.accentDim,
                      border: `1px solid rgba(0,212,170,0.20)`,
                      color: T.accent,
                      fontFamily: T.display,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: T.textMuted, fontFamily: T.display }}
                  >
                    Ticket #{i + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
                    Bet{' '}
                    <span style={{ color: T.textPri, fontWeight: 700 }}>{ticket.betAmount}</span>{' '}
                    ETB
                  </span>

                  {/* §6.4 — hit-flash badge (replaces animate-pulse) */}
                  {!isSettled && status === 'drawing' && liveMatches.length > 0 && (
                    <HitBadge count={liveMatches.length} prevCount={prevHits} />
                  )}

                  {/* Settled badges */}
                  {isWin && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      style={{
                        background: 'rgba(0,200,83,0.15)',
                        border: '1px solid rgba(0,200,83,0.30)',
                        color: T.green,
                        fontFamily: T.display,
                      }}
                    >
                      WIN +{ticket.payout} ETB
                    </span>
                  )}
                  {isSettled && !isWin && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{
                        background: T.elevated,
                        color: T.textMuted,
                        fontFamily: T.mono,
                      }}
                    >
                      Loss
                    </span>
                  )}
                </div>
              </div>

              {/* Number grid */}
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {ticket.pickedNumbers.map((n) => {
                  const isDrawn   = drawnSet.has(n);
                  const isMatched = isSettled
                    ? ticket.matches.includes(n)
                    : status === 'drawing' && isDrawn;
                  return (
                    <NumberBall
                      key={n}
                      n={n}
                      state={isMatched ? 'match' : isDrawn ? 'drawn' : 'idle'}
                    />
                  );
                })}
              </div>

              {/* §6.4 — segmented progress bar + win detail */}
              {(isSettled || (status === 'drawing' && liveMatches.length > 0)) && (
                <div className="px-4 pb-3 space-y-2">
                  <MatchBar
                    hitCount={hitCount}
                    totalPicks={ticket.pickedNumbers.length}
                    isWin={isWin}
                  />

                  {isWin && (
                    <div
                      className="flex items-center justify-between pt-1 border-t"
                      style={{ borderColor: 'rgba(0,200,83,0.10)' }}
                    >
                      <div className="flex items-center gap-3" style={{ fontFamily: T.mono, fontSize: '10px' }}>
                        <span style={{ color: T.textMuted }}>
                          Matches:{' '}
                          <span style={{ color: T.green, fontWeight: 700 }}>{ticket.matchCount}</span>
                        </span>
                        <span style={{ color: T.textMuted }}>
                          Multiplier:{' '}
                          <span style={{ color: T.gold, fontWeight: 700 }}>×{ticket.multiplier}</span>
                        </span>
                      </div>
                      <span
                        className="text-sm font-black"
                        style={{ color: '#4ade80', fontFamily: T.display }}
                      >
                        +{ticket.payout} ETB
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}