// components/plinko/PlinkoBetPanel.tsx
// DashBets — PlinkoBetPanel
//
// CHANGES:
//  - Removed "Amount" label from quick pick section
//  - Professional UI overhaul with clean spacing and typography
//  - Fixed win amount display persistence
//  - Responsive design for mobile and desktop
//  - Clean circular quick amount chips

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { PlinkoRisk, PlinkoRows, PlinkoBetResult } from '../../lib/api/plinkoApi';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_AMOUNTS = [1, 5, 10, 25] as const;

const RISK_OPTIONS: { label: string; value: PlinkoRisk }[] = [
  { label: 'LOW',    value: 'low'    },
  { label: 'MEDIUM', value: 'medium' },
  { label: 'HIGH',   value: 'high'   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function RiskOption({
  label, selected, onSelect, disabled,
}: {
  label: string; value: PlinkoRisk; selected: boolean;
  onSelect: () => void; disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="risk-option"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'none', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '8px 0',
        opacity: disabled ? 0.45 : 1,
        width: '100%',
      }}
    >
      <span style={{
        width: 32, height: 32, flexShrink: 0,
        clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
        background: selected
          ? 'linear-gradient(135deg,#c026d3,#7c3aed)'
          : 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s, box-shadow 0.2s',
        boxShadow: selected ? '0 0 16px rgba(192,38,211,0.6)' : 'none',
      }}>
        {selected && (
          <span style={{
            width: 10, height: 10,
            clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            background: '#fff', display: 'block',
          }} />
        )}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
        color: selected ? '#fff' : 'rgba(255,255,255,0.35)',
        transition: 'color 0.15s',
      }}>
        {label}
      </span>
    </button>
  );
}

function AmountChip({
  amount, selected, onSelect, disabled,
}: {
  amount: number; selected: boolean; onSelect: () => void; disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="amount-chip"
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: selected ? 'linear-gradient(135deg, #7c3aed, #a21caf)' : 'rgba(255,255,255,0.05)',
        border: selected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: selected ? '0 0 20px rgba(168,85,247,0.5)' : 'none',
        color: selected ? '#fff' : 'rgba(255,255,255,0.6)',
        fontSize: 16, fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.45 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {amount}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface PlinkoBetPanelProps {
  betAmount:         number;
  rows:              PlinkoRows;
  risk:              PlinkoRisk;
  onBetAmountChange: (v: number) => void;
  onRowsChange:      (v: PlinkoRows) => void;
  onRiskChange:      (v: PlinkoRisk) => void;
  onDrop:            () => void;
  isDropping:        boolean;
  lastResult:        PlinkoBetResult | null;
  error:             string | null;
  balance:           number;
  minBet?:           number;
  maxBet?:           number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const PlinkoBetPanel: React.FC<PlinkoBetPanelProps> = ({
  betAmount, rows, risk,
  onBetAmountChange, onRowsChange, onRiskChange, onDrop,
  isDropping, lastResult, error, balance,
  minBet = 1, maxBet = 10_000,
}) => {
  const [holding, setHolding]       = useState(false);
  const [inputVal, setInputVal]     = useState('');
  const [editingAmt, setEditingAmt] = useState(false);
  const [displayWin, setDisplayWin] = useState<number>(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const canDrop = !isDropping && betAmount >= minBet && betAmount <= maxBet && balance >= betAmount;

  // Persist win amount across animations
  useEffect(() => {
    if (lastResult) {
      const win = lastResult.isWin ? +(lastResult.payout - lastResult.betAmount).toFixed(2) : 0;
      setDisplayWin(win);
    }
  }, [lastResult]);

  const startHold = () => {
    if (!canDrop) return;
    onDrop();
    setHolding(true);
    holdTimer.current = setInterval(() => onDrop(), 700);
  };
  const stopHold = () => {
    setHolding(false);
    if (holdTimer.current) { clearInterval(holdTimer.current); holdTimer.current = null; }
  };

  const dec = () => onBetAmountChange(Math.max(minBet, +(betAmount - 1).toFixed(2)));
  const inc = () => onBetAmountChange(Math.min(maxBet, +(betAmount + 1).toFixed(2)));

  const handleAmtBlur = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v)) onBetAmountChange(Math.min(maxBet, Math.max(minBet, +v.toFixed(2))));
    setEditingAmt(false);
  };

  const panelBg = '#0a0f2c';
  const borderFaint = '1px solid rgba(255,255,255,0.06)';

  return (
    <div style={{ 
      background: panelBg, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      
      {/* ── Row Selector ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '16px 20px 12px',
        borderBottom: borderFaint,
      }}>
        {([8, 12, 16] as PlinkoRows[]).map(r => (
          <button
            key={r} type="button"
            disabled={isDropping}
            onClick={() => onRowsChange(r)}
            style={{
              padding: '8px 24px', borderRadius: 24, border: 'none',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
              cursor: isDropping ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background: rows === r ? 'linear-gradient(135deg,#6d28d9,#a21caf)' : 'rgba(255,255,255,0.05)',
              color: rows === r ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: rows === r ? '0 0 14px rgba(139,92,246,0.4)' : 'none',
            }}
          >
            {r} rows
          </button>
        ))}
      </div>

      {/* ── Main Layout: Risk | Drop Button | Quick Amounts ────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 16px',
        gap: 12,
      }}>
        {/* LEFT — Risk Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            color: 'rgba(168,85,247,0.8)', marginBottom: 6, textTransform: 'uppercase',
          }}>
            Risk
          </span>
          {RISK_OPTIONS.map(opt => (
            <RiskOption
              key={opt.value} label={opt.label} value={opt.value}
              selected={risk === opt.value}
              onSelect={() => onRiskChange(opt.value)}
              disabled={isDropping}
            />
          ))}
        </div>

        {/* CENTER — Drop Button & Amount Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1 }}>
          {/* Drop Button Ring */}
          <div style={{
            width: 140, height: 140,
            borderRadius: '50%',
            padding: 3,
            background: (isDropping || holding)
              ? 'conic-gradient(from 0deg,#7c3aed,#a21caf,#6d28d9,#7c3aed)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
            animation: (isDropping || holding) ? 'plinko-ring-spin 1.4s linear infinite' : 'none',
          }}>
            <button
              type="button"
              disabled={!canDrop}
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: canDrop
                  ? 'radial-gradient(circle at 35% 35%,#2d3580,#131860)'
                  : 'rgba(20,24,60,0.8)',
                border: 'none',
                cursor: canDrop ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                color: canDrop ? '#fff' : 'rgba(255,255,255,0.2)',
                transition: 'transform 0.1s',
                transform: (isDropping || holding) && canDrop ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="14" stroke={canDrop ? '#818cf8' : 'rgba(255,255,255,0.12)'} strokeWidth="2.5" fill="none"/>
                <path d="M20 6 L20 14" stroke={canDrop ? '#818cf8' : 'rgba(255,255,255,0.12)'} strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 14 L20 8 L26 14" stroke={canDrop ? '#818cf8' : 'rgba(255,255,255,0.12)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em' }}>DROP</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>HOLD TO MULTI</span>
            </button>
          </div>

          {/* Amount Adjuster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button" disabled={isDropping} onClick={dec}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 20, fontWeight: 400,
                cursor: isDropping ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>

            <div style={{ textAlign: 'center', minWidth: 75 }}>
              {editingAmt ? (
                <input
                  autoFocus
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onBlur={handleAmtBlur}
                  onKeyDown={e => e.key === 'Enter' && handleAmtBlur()}
                  style={{
                    width: 75, textAlign: 'center', fontSize: 20, fontWeight: 900,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(99,102,241,0.6)',
                    borderRadius: 8, color: '#fff', outline: 'none', padding: '3px 0',
                  }}
                />
              ) : (
                <div
                  style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2, cursor: 'text' }}
                  onClick={() => { setInputVal(betAmount.toFixed(2)); setEditingAmt(true); }}
                >
                  {betAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 2 }}>ETB</div>
            </div>

            <button
              type="button" disabled={isDropping} onClick={inc}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg,#10b981,#059669)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#fff', fontSize: 20, fontWeight: 400,
                cursor: isDropping ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(16,185,129,0.3)',
              }}
            >+</button>
          </div>
        </div>

        {/* RIGHT — Quick Amounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', flex: 1 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase',
          }}>
            Quick Pick
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_AMOUNTS.map(amt => (
              <AmountChip
                key={amt}
                amount={amt}
                selected={betAmount === amt}
                onSelect={() => onBetAmountChange(amt)}
                disabled={isDropping}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Error Display ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          margin: '0 16px 12px', padding: '10px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#fca5a5', fontSize: 12, fontWeight: 600, textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* ── Total Bet Bar ──────────────────────────────────────────────────── */}
      <div style={{
        margin: '0 16px 16px', padding: '10px 20px', borderRadius: 30,
        background: 'rgba(255,255,255,0.03)', border: borderFaint,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
      }}>
        <span>TOTAL BET</span>
        <span style={{ color: '#a78bfa', fontWeight: 800 }}>{betAmount.toFixed(2)} ETB</span>
        <span>×</span>
        <span style={{ color: '#fff', fontWeight: 800 }}>{betAmount.toFixed(2)} ETB</span>
      </div>

      {/* ── Footer: Balance & Win ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderTop: borderFaint,
        background: 'rgba(0,0,0,0.3)',
        marginTop: 'auto',
        padding: '12px 0',
      }}>
        {/* Balance */}
        <div style={{ flex: 1, textAlign: 'center', borderRight: borderFaint }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 3 }}>
            Balance
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#a78bfa', fontFamily: 'monospace' }}>
            {balance.toFixed(2)}
          </div>
        </div>

        {/* Win */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 3 }}>
            Win
          </div>
          <div style={{
            fontSize: 15, fontWeight: 900, fontFamily: 'monospace',
            color: displayWin > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)',
            transition: 'color 0.3s',
          }}>
            {displayWin > 0 ? `+${displayWin.toFixed(2)}` : '0.00'}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes plinko-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .risk-option:hover:not(:disabled) span:first-child {
          background: rgba(192,38,211,0.15) !important;
        }
        .amount-chip:hover:not(:disabled) {
          transform: scale(1.05);
          background: rgba(255,255,255,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default PlinkoBetPanel;