// components/keno/KenoBetSelector.tsx
/**
 * DashBets — KenoBetSelector (Professional redesign §6.3)
 *
 * Changes from original:
 *  - Chip height minimum 40px (touch target standard)
 *  - MAX WIN badge displayed next to selected chip value
 *  - Font: var(--font-display) / var(--font-mono) throughout
 *  - Teal accent active state replaces gold gradient (Quick Win §5)
 *  - Shared .chip pattern: bg-elevated border, teal on active
 *  - disabled:opacity-35 (Quick Win §4)
 */

import React from 'react';
import { VALID_BETS, PAYOUT_MAP } from '../../lib/kenoConstants';
import type { ValidBet } from '../../lib/kenoConstants';

export { VALID_BETS };
export type { ValidBet };

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
  green:     'var(--green,     #00c853)',
  surface:   'var(--bg-surface,  #141824)',
  elevated:  'var(--bg-elevated, #1c2132)',
  border:    'var(--border,    rgba(255,255,255,0.07))',
  textPri:   'var(--text-primary,   #e8ecf4)',
  textSec:   'var(--text-secondary, #8b93a7)',
  textMuted: 'var(--text-muted,    #4a5168)',
  mono:      "var(--font-mono, 'JetBrains Mono', monospace)",
  display:   "var(--font-display, 'Barlow Condensed', sans-serif)",
  rMd:       'var(--r-md, 10px)',
  rLg:       'var(--r-lg, 16px)',
};

interface KenoBetSelectorProps {
  selected:  number;
  onSelect:  (amount: number) => void;
  balance:   number;
  disabled:  boolean;
}

export function KenoBetSelector({
  selected,
  onSelect,
  balance,
  disabled,
}: KenoBetSelectorProps) {
  const maxWin = PAYOUT_MAP[selected as ValidBet] ?? '—';

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.rLg,
      }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
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
          Bet Amount
        </p>

        {/* §6.3 — MAX WIN badge next to selected value */}
        {selected > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: 'rgba(0,200,83,0.10)',
              border: '1px solid rgba(0,200,83,0.22)',
            }}
          >
            <span style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MAX WIN
            </span>
            <span
              style={{
                fontFamily: T.display,
                fontSize: '12px',
                fontWeight: 700,
                color: T.green,
              }}
            >
              {maxWin} ETB
            </span>
          </div>
        )}
      </div>

      {/* Chip grid — §6.3: min-height 40px for touch targets */}
      <div
        className="grid grid-cols-5 gap-2"
        role="group"
        aria-label="Select bet amount"
      >
        {VALID_BETS.map((bet) => {
          const isActive     = selected === bet;
          const isAffordable = balance >= bet;
          const isClickable  = !disabled && isAffordable;

          return (
            <button
              key={bet}
              type="button"
              onClick={() => isClickable && onSelect(bet)}
              disabled={disabled || !isAffordable}
              aria-pressed={isActive}
              aria-label={`Bet ${bet} ETB`}
              className={[
                'flex flex-col items-center justify-center rounded-xl',
                'transition-all duration-150 relative overflow-hidden',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#00d4aa)]',
                isClickable
                  ? 'hover:brightness-110 cursor-pointer'
                  : 'cursor-not-allowed opacity-35',
              ].join(' ')}
              style={{
                /* §6.3 — minimum 40px height for touch target */
                minHeight: '40px',
                padding: '8px 4px',
                ...(isActive ? {
                  background: T.accentDim,
                  border: `1px solid rgba(0,212,170,0.50)`,
                  boxShadow: `0 0 12px rgba(0,212,170,0.20)`,
                } : {
                  background: T.elevated,
                  border: `1px solid ${T.border}`,
                }),
              }}
            >
              {/* Active shine overlay */}
              {isActive && (
                <span
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,170,0.15) 0%, transparent 55%)',
                  }}
                />
              )}

              {/* Bet amount */}
              <span
                className="text-sm font-black relative z-10"
                style={{
                  fontFamily: T.display,
                  color: isActive ? T.accent : T.textSec,
                }}
              >
                {bet}
              </span>

              {/* Max payout preview */}
              <span
                className="relative z-10 mt-0.5"
                style={{
                  fontFamily: T.mono,
                  fontSize: '9px',
                  color: isActive ? 'rgba(0,212,170,0.65)' : T.textMuted,
                }}
              >
                →{PAYOUT_MAP[bet as ValidBet]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected amount + max win footer */}
      <div className="flex items-center justify-between pt-1">
        <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
          Selected:{' '}
          <span style={{ color: T.textPri, fontWeight: 600 }}>{selected} ETB</span>
        </span>
        <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
          Max win:{' '}
          <span style={{ color: T.green, fontWeight: 700 }}>
            {maxWin} ETB
          </span>
        </span>
      </div>
    </div>
  );
}