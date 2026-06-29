// components/giovani/GiovaniBetPanel.tsx
/**
 * DashBets — Giovani Bet Control Deck (5×3 grid, 25 paylines)
 *
 * Bottom control panel matching the DashBets mobile UI:
 * - Inline TOTAL BET stepper with WIN display
 * - Quick-bet chip row (1, 2, 5, 10, 20, 50)
 * - MAX BET | SPIN (hold for auto) | AUTO PLAY action row
 * - Collapsible paytable drawer
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GiovaniState } from '../../hooks/useGiovani';

function fmt(value: unknown, fallback = '0'): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString();
}

const LINE_COUNT = 25;
const QUICK_BETS = [1, 2, 5, 10, 20, 50];
const AUTO_SPIN_OPTIONS = [10, 25, 50, 100];

interface GiovaniBetPanelProps {
  state:        GiovaniState;
  userBalance:  number;
  onSpin:       (betAmount: number, clientSeed?: string) => void;
  onFreeSpin:   () => void;
  canSpin:      boolean;
  isSpinning:   boolean;
}

export function GiovaniBetPanel({
  state,
  userBalance,
  onSpin,
  onFreeSpin,
  canSpin,
  isSpinning,
}: GiovaniBetPanelProps) {
  const minBet = state.config?.minBet ?? 1;
  const maxBet = state.config?.maxBet ?? 25_000;

  const [betAmount, setBetAmount] = useState<number>(Math.max(minBet, 10));
  const [showPaytable, setShowPaytable] = useState(false);

  // ── Auto spin ────────────────────────────────────────────────────────────
  const [autoSpinMenuOpen, setAutoSpinMenuOpen] = useState(false);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const autoSpinActive = autoSpinsLeft > 0;
  const autoSpinRef = useRef(autoSpinsLeft);
  autoSpinRef.current = autoSpinsLeft;

  const inBonus = state.phase === 'freeSpins' || state.phase === 'freeSpinning';
  const clampedBalance = Number.isFinite(userBalance) ? userBalance : 0;
  const lineBet = betAmount / LINE_COUNT;
  const currentWin = (state as any)?.lastPayout ?? 0;

  const canAffordBet = betAmount <= clampedBalance;
  const spinDisabled = !canSpin || isSpinning || !canAffordBet || betAmount < minBet || betAmount > maxBet;

  const step = useMemo(() => {
    if (betAmount < 10) return 1;
    if (betAmount < 100) return 5;
    if (betAmount < 1000) return 50;
    return 250;
  }, [betAmount]);

  const clampBet = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    return Math.min(maxBet, Math.max(minBet, rounded));
  };

  // Auto spin loop
  useEffect(() => {
    if (!autoSpinActive) return;
    if (state.phase !== 'idle') return;
    if (!canAffordBet || betAmount < minBet || betAmount > maxBet) {
      setAutoSpinsLeft(0);
      return;
    }
    const t = setTimeout(() => {
      if (autoSpinRef.current <= 0) return;
      setAutoSpinsLeft(c => c - 1);
      onSpin(betAmount);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpinActive, state.phase]);

  const startAutoSpin = (count: number) => {
    setAutoSpinMenuOpen(false);
    setAutoSpinsLeft(count);
  };
  const stopAutoSpin = () => setAutoSpinsLeft(0);

  // ── Shared panel wrapper style ─────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: 'rgba(13, 8, 25, 0.97)',
    borderTop: '1px solid rgba(139, 92, 246, 0.25)',
  };

  if (inBonus) {
    return (
      <div className="px-4 py-4 space-y-3" style={panelStyle}>
        <div className="rounded-2xl px-4 py-3 text-center" style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.30)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#67e8f9' }}>👑 Royal Free Spins</p>
          <p className="text-lg font-black text-white font-mono tabular-nums">{state.freeSpinsRemaining} remaining</p>
        </div>
        <button
          onClick={onFreeSpin}
          disabled={state.phase !== 'freeSpins'}
          className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: 'linear-gradient(160deg, #22d3ee, #0891b2)',
            color: '#06141a',
            boxShadow: '0 8px 24px -8px rgba(34,211,238,0.55)',
          }}>
          {state.phase === 'freeSpinning' ? 'Spinning…' : 'Spin Free'}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-4 space-y-3" style={panelStyle}>

      {/* ── Row 1: TOTAL BET stepper + WIN display ── */}
      <div className="flex items-center gap-3">
        {/* Left: label + stepper */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#6b7280' }}>
            Total Bet
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBetAmount(prev => clampBet(prev - step))}
              disabled={isSpinning || autoSpinActive || betAmount <= minBet}
              className="w-9 h-9 rounded-xl font-black text-xl flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#d1d5db',
              }}>
              −
            </button>
            <div className="flex-1 text-center">
              <span className="font-mono font-black text-xl tabular-nums text-white">{betAmount.toFixed(2)}</span>
              <span className="block text-[9px] font-bold mt-0.5" style={{ color: '#6b7280' }}>
                25 Lines × {lineBet.toFixed(2)} ETB
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBetAmount(prev => clampBet(prev + step))}
              disabled={isSpinning || autoSpinActive || betAmount >= maxBet}
              className="w-9 h-9 rounded-xl font-black text-xl flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#d1d5db',
              }}>
              +
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Right: WIN */}
        <div className="text-right shrink-0">
          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#6b7280' }}>Win</p>
          <p className="font-mono font-black text-xl tabular-nums" style={{ color: currentWin > 0 ? '#a855f7' : '#374151' }}>
            {currentWin > 0 ? `${fmt(currentWin)}` : '0.00'}
          </p>
          <span className="block text-[9px] font-bold mt-0.5" style={{ color: '#374151' }}>ETB</span>
        </div>
      </div>

      {/* ── Row 2: Quick-bet chips ── */}
      <div className="grid grid-cols-6 gap-1.5">
        {QUICK_BETS.map(amt => {
          const isActive = betAmount === amt;
          return (
            <button
              key={amt}
              onClick={() => setBetAmount(clampBet(amt))}
              disabled={isSpinning || autoSpinActive}
              className="py-2 rounded-xl text-xs font-black transition-all disabled:opacity-30 active:scale-95"
              style={{
                background: isActive
                  ? 'linear-gradient(160deg, rgba(168,85,247,0.30), rgba(109,40,217,0.20))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? 'rgba(168,85,247,0.60)' : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? '#e9d5ff' : '#6b7280',
                boxShadow: isActive ? '0 0 12px rgba(168,85,247,0.25)' : 'none',
              }}>
              {amt}
            </button>
          );
        })}
      </div>

      {/* ── Row 3: MAX BET | SPIN | AUTO PLAY ── */}
      {autoSpinActive ? (
        <button
          onClick={stopAutoSpin}
          className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wide transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(160deg, #f87171, #dc2626)',
            color: '#fff',
            boxShadow: '0 10px 28px -10px rgba(220,38,38,0.55)',
          }}>
          Stop Auto · {autoSpinsLeft} left
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* MAX BET */}
          <button
            onClick={() => setBetAmount(clampBet(maxBet))}
            disabled={isSpinning || autoSpinActive}
            className="flex-none px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#a855f7',
              minWidth: '80px',
            }}>
            Max Bet
          </button>

          {/* SPIN — center hero button */}
          <button
            onClick={() => onSpin(betAmount)}
            disabled={spinDisabled}
            className="flex-1 rounded-2xl font-black text-lg uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
            style={{
              background: spinDisabled
                ? 'linear-gradient(160deg, #7c3aed, #6d28d9)'
                : 'linear-gradient(160deg, #c026d3, #a855f7, #7c3aed)',
              color: '#fff',
              boxShadow: spinDisabled ? 'none' : '0 8px 32px -8px rgba(168,85,247,0.70)',
              paddingTop: '14px',
              paddingBottom: '14px',
            }}>
            <span className="block leading-none">
              {isSpinning ? 'Spinning…' : 'SPIN'}
            </span>
            {!isSpinning && (
              <span className="block text-[9px] font-bold tracking-widest mt-1 opacity-60">
                HOLD FOR AUTO
              </span>
            )}
          </button>

          {/* AUTO PLAY */}
          <div className="relative flex-none">
            <button
              onClick={() => setAutoSpinMenuOpen(v => !v)}
              disabled={spinDisabled}
              className="px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: '#a855f7',
                minWidth: '80px',
              }}>
              Auto Play
            </button>
            {autoSpinMenuOpen && (
              <div
                className="absolute right-0 bottom-full mb-2 rounded-2xl p-2 z-20 shadow-2xl"
                style={{
                  background: '#1a0d2e',
                  border: '1px solid rgba(168,85,247,0.35)',
                  minWidth: '130px',
                }}>
                {AUTO_SPIN_OPTIONS.map(count => (
                  <button
                    key={count}
                    onClick={() => startAutoSpin(count)}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-white/5 active:scale-95"
                    style={{ color: '#d1d5db' }}>
                    {count} spins
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!canAffordBet && (
        <p className="text-[11px] font-bold text-center" style={{ color: '#f87171' }}>Exceeds available balance</p>
      )}

      {/* ── Paytable toggle ── */}
      <button
        onClick={() => setShowPaytable(v => !v)}
        className="w-full text-center text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        style={{ color: '#6b7280', background: 'transparent' }}>
        <span style={{ fontSize: '10px' }}>{showPaytable ? '▲' : '▼'}</span>
        {showPaytable ? 'HIDE PAYTABLE' : 'SHOW PAYTABLE'}
      </button>

      {showPaytable && state.config?.paytable && (
        <div className="space-y-1.5 max-h-56 overflow-y-auto rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {state.config.paytable.map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.025)' }}>
              <span style={{ color: '#9ca3af' }}>{row.label}</span>
              <span className="font-mono font-black" style={{ color: '#fbbf24' }}>{row.multiplier}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}