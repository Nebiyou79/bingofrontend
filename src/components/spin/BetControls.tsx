/**
 * components/spin/BetControls.tsx — Premium redesign
 */

import React from 'react';

export const VALID_BETS = [1, 2, 5, 10, 20, 50, 100, 250, 500, 1000] as const;
export type ValidBet = typeof VALID_BETS[number];

const CHIP: Record<number, { bg: string; border: string; text: string; shadow: string }> = {
  1:    { bg: '#1e293b', border: '#334155', text: '#94a3b8', shadow: 'transparent' },
  2:    { bg: '#1e293b', border: '#334155', text: '#94a3b8', shadow: 'transparent' },
  5:    { bg: '#3b0a0a', border: '#dc2626', text: '#fca5a5', shadow: 'rgba(220,38,38,0.3)' },
  10:   { bg: '#0f1e40', border: '#2563eb', text: '#93c5fd', shadow: 'rgba(37,99,235,0.3)' },
  20:   { bg: '#052513', border: '#16a34a', text: '#86efac', shadow: 'rgba(22,163,74,0.3)' },
  50:   { bg: '#200d55', border: '#7c3aed', text: '#c4b5fd', shadow: 'rgba(124,58,237,0.3)' },
  100:  { bg: '#321203', border: '#d97706', text: '#fcd34d', shadow: 'rgba(217,119,6,0.35)' },
  250:  { bg: '#2d0e04', border: '#ea580c', text: '#fdba74', shadow: 'rgba(234,88,12,0.3)' },
  500:  { bg: '#36051c', border: '#db2777', text: '#f9a8d4', shadow: 'rgba(219,39,119,0.3)' },
  1000: { bg: '#2c1502', border: '#ca8a04', text: '#fde047', shadow: 'rgba(202,138,4,0.4)' },
};

interface BetControlsProps {
  selected: number;
  balance: number;
  autoSpin: boolean;
  turboMode: boolean;
  disabled: boolean;
  onSelect:   (v: number) => void;
  onAutoSpin: (v: boolean) => void;
  onTurbo:    (v: boolean) => void;
}

export function BetControls({
  selected, balance, autoSpin, turboMode, disabled,
  onSelect, onAutoSpin, onTurbo,
}: BetControlsProps) {
  const dbl = () => {
    const n = (VALID_BETS as readonly number[]).find(b => b >= selected * 2);
    if (n) onSelect(Math.min(n, 1000));
  };
  const hlf = () => {
    const n = [...VALID_BETS].reverse().find(b => b <= selected / 2);
    if (n) onSelect(n);
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[9px] font-mono tracking-[0.18em] uppercase"
          style={{ color: 'rgba(100,116,139,0.7)' }}>
          Select Bet
        </span>
        <span className="text-[9px] font-mono" style={{ color: 'rgba(100,116,139,0.6)' }}>
          Balance:{' '}
          <span className="font-bold" style={{ color: '#fbbf24' }}>
            {balance.toLocaleString()} ETB
          </span>
        </span>
      </div>

      {/* Chip grid */}
      <div className="flex flex-wrap justify-center gap-2">
        {VALID_BETS.map(amount => {
          const sel      = selected === amount;
          const canAfford = balance >= amount;
          const c         = CHIP[amount] ?? CHIP[10];

          return (
            <button
              key={amount}
              onClick={() => onSelect(amount)}
              disabled={disabled}
              aria-pressed={sel}
              aria-label={`Bet ${amount} ETB`}
              className="relative flex flex-col items-center justify-center rounded-full transition-all duration-120 focus:outline-none"
              style={{
                width: 52,
                height: 52,
                background: c.bg,
                border: `2.5px solid ${sel ? c.border : `${c.border}45`}`,
                boxShadow: sel ? `0 0 20px ${c.shadow}, 0 0 0 1px ${c.border}30, inset 0 1px 0 rgba(255,255,255,0.07)` : 'none',
                transform: sel ? 'scale(1.16)' : canAfford ? 'scale(1)' : 'scale(0.92)',
                opacity: disabled ? 0.38 : canAfford ? 1 : 0.2,
                cursor: disabled || !canAfford ? 'not-allowed' : 'pointer',
              }}
            >
              {/* Inner ring */}
              <div className="absolute rounded-full pointer-events-none"
                style={{ inset: 5, border: `1px solid ${c.border}18` }}/>
              {/* Amount */}
              <span className="relative z-10 font-black leading-none"
                style={{ fontSize: 13, color: c.text, fontFamily: "'Rajdhani',sans-serif" }}>
                {amount >= 1000 ? `${amount / 1000}K` : amount}
              </span>
              <span className="relative z-10 font-mono leading-none mt-0.5"
                style={{ fontSize: 7, color: `${c.text}65` }}>
                ETB
              </span>
              {/* Selected ping */}
              {sel && (
                <span className="absolute rounded-full animate-ping"
                  style={{
                    top: -3, right: -3,
                    width: 10, height: 10,
                    background: c.border,
                    opacity: 0.65,
                  }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* Modifiers row */}
      <div className="flex items-center gap-2">
        {/* ½ / 2× */}
        <div className="flex gap-1.5">
          {[
            { label: '½',  fn: hlf, dis: disabled || selected <= VALID_BETS[0] },
            { label: '2×', fn: dbl, dis: disabled || selected >= VALID_BETS[VALID_BETS.length - 1] },
          ].map(({ label, fn, dis }) => (
            <button key={label} onClick={fn} disabled={dis}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all disabled:opacity-20"
              style={{
                background: 'rgba(15,23,42,0.7)',
                border: '1px solid rgba(51,65,85,0.6)',
                color: '#94a3b8',
                fontFamily: "'Rajdhani',sans-serif",
                letterSpacing: '0.04em',
              }}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Auto */}
        <button
          onClick={() => onAutoSpin(!autoSpin)}
          disabled={disabled}
          aria-pressed={autoSpin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-25"
          style={autoSpin ? {
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.4)',
            color: '#22c55e',
          } : {
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(51,65,85,0.5)',
            color: '#475569',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ background: autoSpin ? '#22c55e' : '#334155' }}/>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.04em' }}>Auto</span>
        </button>

        {/* Turbo */}
        <button
          onClick={() => onTurbo(!turboMode)}
          disabled={disabled}
          aria-pressed={turboMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-25"
          style={turboMode ? {
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.4)',
            color: '#fbbf24',
          } : {
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(51,65,85,0.5)',
            color: '#475569',
          }}
        >
          <span className="text-sm leading-none">⚡</span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.04em' }}>Turbo</span>
        </button>
      </div>
    </div>
  );
}