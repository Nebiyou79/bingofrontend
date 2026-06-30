// components/slots/SlotsBetPanel.tsx
/**
 * DashBets — Classic Slots Bet Panel
 * Controls: bet amount, auto-spin toggle, spin/free-spin button.
 * Mirrors MinesBetPanel pattern.
 */

import React, { useState, useMemo } from 'react';
import type { SlotsState } from '../../hooks/useSlots';
import type { SlotConfig } from '../../lib/api/slotsApi';

const BET_CHIPS = [10, 50, 100, 500, 1_000, 5_000];
const MIN_BET   = 1;
const MAX_BET   = 10_000;

interface SlotsBetPanelProps {
  state:        SlotsState;
  userBalance:  number;
  todayProfit?: number;
  lastWin?:     number;
  onSpin:       (betAmount: number, clientSeed?: string) => void;
  onFreeSpin:   () => void;
  canSpin:      boolean;
  isSpinning:   boolean;
}

export function SlotsBetPanel({
  state, userBalance, todayProfit = 0, lastWin = 0,
  onSpin, onFreeSpin, canSpin, isSpinning,
}: SlotsBetPanelProps) {
  const [betInput,   setBetInput]   = useState<string>('100');
  const [clientSeed, setClientSeed] = useState<string>('');
  const [showSeed,   setShowSeed]   = useState(false);
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const parsedBet = useMemo(() => {
    const n = Number(betInput);
    return Number.isFinite(n) ? Math.max(MIN_BET, Math.min(MAX_BET, n)) : MIN_BET;
  }, [betInput]);

  const betError = useMemo(() => {
    const n = Number(betInput);
    if (!Number.isFinite(n) || n < MIN_BET) return `Min ${MIN_BET} ETB`;
    if (n > MAX_BET) return `Max ${MAX_BET.toLocaleString()} ETB`;
    return null;
  }, [betInput]);

  const isFreeSpins  = state.phase === 'freeSpins' || state.phase === 'freeSpinning';
  const lastResult   = state.lastResult;
  const lastFree     = state.lastFreeResult;
  const isWin        = lastResult?.isWin || lastFree?.isWin;
  const payout       = lastResult?.payout ?? lastFree?.payout ?? 0;
  const winType      = lastResult?.winType ?? lastFree?.winType ?? '';
  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const config: SlotConfig | null = state.config;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(160deg, #1a0a1f 0%, #100812 100%)', border: '1px solid rgba(168,85,247,0.25)' }}
    >
      {/* Balance card */}
      <div className="p-4 m-3 rounded-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(126,34,206,0.10) 100%)', border: '1px solid rgba(168,85,247,0.40)' }}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between mb-3 relative z-10">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Balance</p>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-700 flex items-center justify-center text-sm">🎰</div>
        </div>
        <div className="flex items-baseline gap-2 mb-3 relative z-10">
          <span className="font-black text-white leading-none" style={{ fontSize: '28px', fontFamily: "'Rajdhani', sans-serif" }}>
            {fmt(state.balance ?? userBalance)}
          </span>
          <span className="text-gray-400 text-sm font-bold">ETB</span>
        </div>
        <div className="grid grid-cols-2 gap-2 relative z-10">
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.30)' }}>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Today`s Profit</p>
            <p className={`text-sm font-bold font-mono ${todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.30)' }}>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Last Win</p>
            <p className="text-sm font-bold font-mono text-purple-400">{lastWin.toLocaleString()} ETB</p>
          </div>
        </div>
      </div>

      {/* Last result banner */}
      {(lastResult || lastFree) && (
        <div className="mx-3 mb-2 rounded-xl px-4 py-2.5"
          style={{
            background: isWin ? 'rgba(168,85,247,0.10)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isWin ? 'rgba(168,85,247,0.30)' : 'rgba(255,255,255,0.06)'}`,
          }}>
          {isWin ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-purple-400">🎉 {winType || 'WIN!'}</span>
              <span className="font-mono text-sm font-bold text-emerald-400">+{payout.toLocaleString()} ETB</span>
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center">No match this spin</p>
          )}
        </div>
      )}

      {/* Free spins banner */}
      {isFreeSpins && (
        <div className="mx-3 mb-2 rounded-xl px-4 py-3 text-center"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)' }}>
          <p className="text-sm font-black text-amber-400">⭐ FREE SPINS ACTIVE</p>
          <p className="text-xs text-amber-500 mt-0.5 font-mono">
            {state.freeSpinsRemaining} remaining · +{state.totalFreeWin.toLocaleString()} ETB earned
          </p>
        </div>
      )}

      <div className="px-4 pb-4 space-y-4">

        {/* Bet input */}
        {!isFreeSpins && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bet Amount</label>
              {betError && <span className="text-[10px] text-red-400">{betError}</span>}
            </div>
            <div className="relative">
              <input
                type="number" value={betInput}
                onChange={e => { setBetInput(e.target.value); setActiveChip(null); }}
                className="w-full rounded-xl px-4 py-3 pr-16 text-white font-mono font-bold text-lg outline-none"
                style={{ background: 'rgba(0,0,0,0.40)', border: `1px solid ${betError ? 'rgba(239,68,68,0.50)' : 'rgba(168,85,247,0.25)'}` }}
                min={MIN_BET} max={MAX_BET}
                disabled={isSpinning}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">ETB</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {BET_CHIPS.map(v => (
                <button key={v} onClick={() => { setBetInput(String(v)); setActiveChip(v); }}
                  disabled={isSpinning}
                  className="py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                  style={{
                    background: activeChip === v ? 'rgba(168,85,247,0.20)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${activeChip === v ? 'rgba(168,85,247,0.60)' : 'rgba(255,255,255,0.10)'}`,
                    color: activeChip === v ? '#d8b4fe' : '#9ca3af',
                  }}>
                  {v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Client seed */}
        {!isFreeSpins && (
          <div className="space-y-1">
            <button onClick={() => setShowSeed(s => !s)}
              className="text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest transition-colors">
              {showSeed ? '▾' : '▸'} Custom Client Seed
            </button>
            {showSeed && (
              <input
                type="text" value={clientSeed} placeholder="Auto-generated if empty"
                onChange={e => setClientSeed(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm font-mono text-gray-300 outline-none"
                style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(168,85,247,0.20)' }}
                disabled={isSpinning}
              />
            )}
          </div>
        )}

        {/* Paytable preview */}
        {config && !isFreeSpins && (
          <div className="rounded-xl overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-3 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              Paytable Preview
            </p>
            <div className="px-3 py-2 space-y-1 max-h-[140px] overflow-y-auto">
              {config.paytable.slice(0, 6).map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-500">{row.combination.join(' ')}</span>
                  <span className="font-bold font-mono text-amber-400">{row.multiplier}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spin / Free Spin button */}
        {isFreeSpins ? (
          <button
            onClick={onFreeSpin}
            disabled={isSpinning || state.freeSpinsRemaining <= 0}
            className="w-full rounded-xl font-black text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex flex-col items-center justify-center py-4 gap-0.5"
            style={{
              background: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 150%)',
              boxShadow: '0 4px 24px rgba(245,158,11,0.40)',
              color: '#fff',
            }}>
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Spinning…
              </span>
            ) : (
              <>
                <span>⭐ Free Spin</span>
                <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
                  {state.freeSpinsRemaining} remaining
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => { if (!betError && !isSpinning && canSpin) onSpin(parsedBet, clientSeed || undefined); }}
            disabled={!!betError || isSpinning || !canSpin}
            className="w-full rounded-xl font-black text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex flex-col items-center justify-center py-4 gap-0.5"
            style={{
              background: isSpinning ? 'rgba(168,85,247,0.40)' : 'linear-gradient(135deg, #7e22ce 0%, #9333ea 50%, #a855f7 150%)',
              boxShadow: '0 4px 24px rgba(168,85,247,0.40)',
              color: '#fff',
            }}>
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Spinning…
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2"><span>🎰</span> Spin</span>
                <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
                  {parsedBet.toLocaleString()} ETB
                </span>
              </>
            )}
          </button>
        )}

        {lastResult?.serverSeedHash && (
          <p className="text-center text-[10px] text-gray-700">
            Seed: <span className="font-mono">{lastResult.serverSeedHash.slice(0, 14)}…</span>
          </p>
        )}
      </div>
    </div>
  );
}
