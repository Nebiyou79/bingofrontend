// components/keno/KenoTicketBuilder.tsx
/**
 * DashBets — KenoTicketBuilder (Professional redesign §6.2)
 *
 * Changes from original:
 *  - Payout table: header row MATCH | ODDS | MAX WIN; multiplier heatmap coloring;
 *    ×1000+ gets animated shimmer background
 *  - Quick-pick buttons: px-4 py-2, labelled "QP3" / "QP5" etc.
 *  - Bet input: replaced 12-key custom keypad with standard <input type="number">
 *    styled with panel-elevated. MAX / ½ / ×2 modifier row kept above input.
 *  - BET button: teal .btn-cta style; label = "PLACE BET · {spots} SPOTS · {bet} ETB"
 *  - Font: var(--font-display) / var(--font-mono) throughout
 *  - disabled:opacity-35 (Quick Win §4)
 *  - Spinners: teal (Quick Win §7)
 */
import React, { useState, useCallback, useEffect } from 'react';

// ─── Design tokens (CSS-var-first, fallback for environments without globals.css) ─
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
  accentGlow:'var(--accent-glow,rgba(0,212,170,0.30))',
  gold:      'var(--gold,      #f5c842)',
  gold2:     '#e8a800',
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

// ─── Payout table ─────────────────────────────────────────────────────────────
const PAYOUT_TABLE: Record<number, Record<number, number>> = {
  1:  { 1: 3 },
  2:  { 2: 5 },
  3:  { 2: 2,   3: 20 },
  4:  { 2: 1.5, 3: 10,  4: 80 },
  5:  { 3: 3,   4: 20,  5: 200 },
  6:  { 3: 1.5, 4: 5,   5: 50,  6: 1000 },
  7:  { 4: 5,   5: 50,  6: 200, 7: 2000 },
  8:  { 4: 5,   5: 15,  6: 50,  7: 200,  8: 2000 },
  9:  { 4: 2,   5: 10,  6: 30,  7: 100,  8: 500,  9: 2500 },
  10: { 5: 5,   6: 20,  7: 80,  8: 300,  9: 1000, 10: 5000 },
};

/** Returns heatmap color for a multiplier value */
function multColor(mult: number): { color: string; shimmer?: boolean } {
  if (mult >= 1000) return { color: T.gold, shimmer: true };
  if (mult >= 100)  return { color: '#f97316' };     // orange
  if (mult >= 10)   return { color: '#a78bfa' };     // violet
  if (mult >= 5)    return { color: T.textSec };     // secondary
  return { color: T.textMuted };                      // muted
}

function getPayoutRows(spots: number) {
  return Object.entries(PAYOUT_TABLE[spots] ?? {})
    .map(([m, mult]) => ({ match: Number(m), multiplier: mult }))
    .sort((a, b) => b.match - a.match); // highest match first = top of table
}

// /** §6.2 — Max win per spot count for MAX WIN column */
// function maxWinForSpots(spots: number): number {
//   const rows = PAYOUT_TABLE[spots];
//   if (!rows) return 0;
//   return Math.max(...Object.values(rows));
// }

const QUICK_PICKS = [3, 4, 5, 6, 7, 8, 9, 10];

interface Props {
  selected: number[];
  onSelect: (n: number[]) => void;
  onPlace:  (picks: number[], bet: number) => void;
  balance:  number;
  disabled: boolean;
  status:   'betting' | 'drawing' | 'settled';
}

export function KenoTicketBuilder({
  selected,
  onSelect,
  onPlace,
  balance,
  disabled,
  status,
}: Props) {
  const [betStr, setBetStr] = useState('20');

  const bet   = Math.max(0, parseFloat(betStr) || 0);
  const spots = selected.length;
  const rows  = spots >= 1 ? getPayoutRows(spots) : [];
  // const maxWinMult = spots >= 1 ? maxWinForSpots(spots) : 0;
  const canBet = spots >= 1 && bet >= 1 && bet <= balance && !disabled;

  // Listen for repeat events from KenoHistory
  useEffect(() => {
    const h = (e: Event) => {
      const { pickedNumbers, betAmount } = (e as CustomEvent).detail;
      onSelect(pickedNumbers);
      setBetStr(String(betAmount));
    };
    window.addEventListener('keno:repeat_item', h);
    return () => window.removeEventListener('keno:repeat_item', h);
  }, [onSelect]);

  const quickPick = useCallback(
    (n: number) => {
      const pool: number[] = Array.from({ length: 80 }, (_, i) => i + 1);
      const picks: number[] = [];
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(idx, 1)[0]);
      }
      onSelect(picks.sort((a, b) => a - b));
    },
    [onSelect],
  );

  // §6.2 — modifier helpers (keep these, they are genuinely useful)
  const setHalf = () => setBetStr(String(Math.max(1, Math.floor(bet / 2))));
  const setDouble = () => setBetStr(String(Math.min(balance, bet * 2)));
  const setMax  = () => setBetStr(String(balance));
  const setMin  = () => setBetStr('1');

  const betLabel = () => {
    if (status !== 'betting') return status === 'drawing' ? '⏳ DRAWING…' : '⏭ NEXT ROUND';
    if (!canBet) {
      if (spots < 1) return 'PICK NUMBERS FIRST';
      if (bet < 1)   return 'ENTER BET AMOUNT';
      return 'INSUFFICIENT BALANCE';
    }
    return `PLACE BET · ${spots} SPOT${spots !== 1 ? 'S' : ''} · ${bet} ETB`;
  };

  return (
    <>
      <style>{`
        /* §6.2 — shimmer animation for ×1000+ multipliers */
        @keyframes bane-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .bane-shimmer-text {
          background: linear-gradient(90deg, #f5c842 0%, #fff8c0 40%, #f5c842 60%, #e8a800 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: bane-shimmer 2s linear infinite;
        }
      `}</style>

      <div className="space-y-4">

        {/* ── §6.2 Payout table — heatmap multipliers ── */}
        {rows.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: T.rLg,
            }}
          >
            {/* Table header */}
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: T.border, background: 'rgba(0,212,170,0.04)' }}
            >
              <p
                style={{
                  fontFamily: T.display,
                  fontSize: '10px',
                  fontWeight: 700,
                  color: T.accent,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Payout Table · {spots} Spot{spots !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Column header row — §6.2 MATCH | ODDS | MAX WIN */}
            <div
              className="grid grid-cols-3 px-4 py-2 border-b"
              style={{ borderColor: T.border }}
            >
              {['MATCH', 'ODDS', 'MAX WIN'].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: T.body,
                    fontSize: '9px',
                    fontWeight: 600,
                    color: T.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: h === 'MAX WIN' ? 'right' : 'left',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Data rows */}
            <div className="px-4 py-1">
              {rows.map(({ match, multiplier }) => {
                const { color, shimmer } = multColor(multiplier);
                const maxWinAmt = Math.round(bet * multiplier);
                const isTopRow = match === Math.max(...rows.map(r => r.match));
                return (
                  <div
                    key={match}
                    className="grid grid-cols-3 items-center py-2 border-b last:border-0"
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                      background: isTopRow ? 'rgba(0,212,170,0.04)' : 'transparent',
                    }}
                  >
                    {/* Match count */}
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isTopRow ? T.accent : T.textSec,
                      }}
                    >
                      {match}
                    </span>

                    {/* Multiplier — heatmap colored, shimmer if ≥1000× */}
                    <span
                      className={shimmer ? 'bane-shimmer-text' : ''}
                      style={shimmer ? {
                        fontFamily: T.display,
                        fontSize: '13px',
                        fontWeight: 900,
                      } : {
                        fontFamily: T.display,
                        fontSize: '13px',
                        fontWeight: 900,
                        color,
                      }}
                    >
                      ×{multiplier.toLocaleString()}
                    </span>

                    {/* Max win for current bet */}
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isTopRow ? '#4ade80' : T.textMuted,
                        textAlign: 'right',
                      }}
                    >
                      {bet > 0 ? maxWinAmt.toLocaleString() : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── §6.2 Quick Pick — labelled "QP3", "QP5" etc., px-4 py-2 ── */}
        <div>
          <p
            style={{
              fontFamily: T.display,
              fontSize: '10px',
              fontWeight: 700,
              color: T.accent,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Quick Pick
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_PICKS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => quickPick(n)}
                className="transition-all disabled:opacity-35 hover:brightness-110"
                style={{
                  /* §6.2 — px-4 py-2 size */
                  padding: '8px 16px',
                  borderRadius: T.rMd,
                  background: T.elevated,
                  border: `1px solid ${T.border}`,
                  color: T.accent,
                  fontFamily: T.mono,
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {/* §6.2 — labelled "QP3", "QP5" etc. */}
                QP{n}
              </button>
            ))}
            <button
              type="button"
              disabled={disabled || spots === 0}
              onClick={() => onSelect([])}
              className="transition-all disabled:opacity-35 ml-auto"
              style={{
                padding: '8px 16px',
                borderRadius: T.rMd,
                background: 'rgba(255,71,87,0.08)',
                border: '1px solid rgba(255,71,87,0.20)',
                color: 'var(--red, #ff4757)',
                fontFamily: T.mono,
                fontSize: '11px',
                fontWeight: 600,
                cursor: disabled || spots === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── §6.2 Bet Amount — standard input, panel-elevated style ── */}
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.rLg,
            padding: '16px',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              style={{
                fontFamily: T.display,
                fontSize: '10px',
                fontWeight: 700,
                color: T.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Bet Amount
            </p>
            <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
              Balance:{' '}
              <span style={{ color: T.gold, fontWeight: 700 }}>
                {balance.toLocaleString()} ETB
              </span>
            </span>
          </div>

          {/* §6.2 — MAX / ½ / ×2 / MIN modifier row: 2-col on mobile, 4-col on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
            {[
              { label: 'MIN',  fn: setMin },
              { label: '½',    fn: setHalf },
              { label: '×2',   fn: setDouble },
              { label: 'MAX',  fn: setMax, accent: true },
            ].map(({ label, fn, accent }) => (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={fn}
                className="py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-35 hover:brightness-110"
                style={{
                  background: accent ? T.accentDim : T.elevated,
                  border: `1px solid ${accent ? 'rgba(0,212,170,0.30)' : T.border}`,
                  color: accent ? T.accent : T.textSec,
                  fontFamily: T.mono,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* §6.2 — Standard <input type="number"> replacing custom keypad */}
          <div className="relative">
            <input
              type="number"
              min={1}
              max={balance}
              value={betStr}
              disabled={disabled}
              onChange={(e) => {
                const v = e.target.value;
                // Allow empty string while typing
                if (v === '' || v === '-') { setBetStr(''); return; }
                const n = parseFloat(v);
                if (!isNaN(n)) setBetStr(n > 100_000 ? betStr : v);
              }}
              onBlur={() => {
                const n = parseFloat(betStr);
                setBetStr(isNaN(n) || n < 1 ? '1' : String(Math.min(balance, n)));
              }}
              className="w-full focus:outline-none"
              style={{
                background: T.elevated,
                border: `1px solid ${bet > balance || bet < 1 ? 'rgba(255,71,87,0.5)' : T.border}`,
                borderRadius: T.rMd,
                padding: '12px 52px 12px 16px',
                color: T.textPri,
                fontFamily: T.mono,
                fontSize: '20px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ fontFamily: T.body, fontSize: '12px', color: T.textMuted }}
            >
              ETB
            </span>
          </div>

          {/* Validation feedback */}
          {bet > balance && (
            <p style={{ fontFamily: T.mono, fontSize: '10px', color: 'var(--red,#ff4757)', marginTop: '6px' }}>
              Exceeds balance
            </p>
          )}
        </div>

        {/* ── §6.2 BET button — .btn-cta teal style ── */}
        <button
          type="button"
          disabled={!canBet}
          onClick={() => canBet && onPlace(selected, bet)}
          className="w-full relative overflow-hidden focus:outline-none transition-all active:scale-[0.97]"
          style={{
            background: canBet
              ? T.accent
              : T.elevated,
            border: canBet ? 'none' : `1px solid ${T.border}`,
            borderRadius: T.rMd,
            padding: '14px 24px',
            color: canBet ? '#0b0e17' : T.textMuted,
            fontFamily: T.display,
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: canBet ? `0 0 24px var(--accent-glow, rgba(0,212,170,0.30))` : 'none',
            cursor: canBet ? 'pointer' : 'not-allowed',
            opacity: !canBet && status !== 'betting' ? 0.7 : (!canBet ? 0.35 : 1),
          }}
        >
          {/* Shine overlay when active */}
          {canBet && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)',
                borderRadius: T.rMd,
              }}
            />
          )}
          <span className="relative z-10">{betLabel()}</span>
        </button>

        {/* Selection summary */}
        {selected.length > 0 && status === 'betting' && (
          <p
            className="text-center"
            style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}
          >
            Picks:{' '}
            <span style={{ color: T.accent }}>
              {[...selected].sort((a, b) => a - b).join(', ')}
            </span>
          </p>
        )}
      </div>
    </>
  );
}