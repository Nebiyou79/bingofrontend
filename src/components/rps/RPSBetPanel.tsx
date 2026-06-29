// components/rps/RPSBetPanel.tsx
/**
 * DashBets — RPS Bet Panel
 * Controls: mode (single/chain), bet amount, client seed override.
 * Shows chain streak progress and live payout when in-game.
 *
 * Redesigned alongside Mines to share one visual language:
 *  - ½ / 2x bet stepper next to the amount field (standard sportsbook affordance)
 *  - Emoji glyphs replaced with the shared line-icon set
 *  - Flatter chrome, hairline borders instead of heavy glow
 */

import React, { useState, useMemo } from 'react';
import type { RPSMode } from '../../lib/api/rpsApi';
import type { RPSState } from '../../hooks/useRPS';
import { IconRock, IconBolt, IconLink, IconTrophy, IconOutcomeLoss, IconOutcomeTie, IconCoin, IconLock, IconChevron } from '../icons/GameIcons';

const BET_CHIPS = [10, 50, 100, 500, 1_000, 5_000];
const MIN_BET   = 1;
const MAX_BET   = 10_000;

const CHAIN_MULTS = [1.94, 3.76, 7.29, 14.13, 27.38, 53.07, 102.85];

interface RPSBetPanelProps {
  state:       RPSState;
  userBalance: number;
  todayProfit?: number;
  lastWin?:    number;
  onStart:     (betAmount: number, mode: RPSMode, clientSeed?: string) => void;
  onCashOut:   () => void;
  canStartGame: boolean;
  canCashOut:  boolean;
  isLoading:   boolean;
}

export function RPSBetPanel({
  state, userBalance, todayProfit = 0, lastWin = 0,
  onStart, onCashOut, canStartGame, canCashOut, isLoading,
}: RPSBetPanelProps) {
  const [betInput,    setBetInput]    = useState<string>('100');
  const [mode,        setMode]        = useState<RPSMode>('single');
  const [clientSeed,  setClientSeed]  = useState<string>('');
  const [activeChip,  setActiveChip]  = useState<number | null>(null);
  const [showSeed,    setShowSeed]    = useState(false);

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

  const setBet = (n: number) => {
    setActiveChip(null);
    setBetInput(String(Math.max(MIN_BET, Math.min(MAX_BET, Math.floor(n)))));
  };

  const isIdle       = canStartGame;
  const isActive     = !isIdle && state.gameId !== null;
  const showGameOver = state.isGameOver && state.phase === 'idle';
  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const winStreak       = state.winStreak;
  const potentialPayout = state.potentialPayout;
  const chainMult       = CHAIN_MULTS[Math.min(winStreak, CHAIN_MULTS.length - 1)] ?? 1;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #13152a 0%, #0e1020 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Balance card */}
      <div className="p-4 m-3 rounded-xl relative overflow-hidden"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div className="flex items-start justify-between mb-3 relative z-10">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Balance</p>
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <span className="text-white text-[11px] font-black">D</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3 relative z-10">
          <span className="font-black text-white leading-none tabular-nums" style={{ fontSize: '26px', letterSpacing: '-0.5px' }}>
            {fmt(userBalance)}
          </span>
          <span className="text-gray-400 text-sm font-bold">ETB</span>
        </div>
        <div className="grid grid-cols-2 gap-2 relative z-10">
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.30)' }}>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Today`s Profit</p>
            <p className={`text-sm font-bold font-mono tabular-nums ${todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.30)' }}>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Last Win</p>
            <p className="text-sm font-bold font-mono tabular-nums text-violet-400">{lastWin.toLocaleString()} ETB</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div className="mx-3 mb-2 rounded-xl px-4 py-2.5 text-sm text-red-400 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <IconOutcomeLoss size={15} />
          {state.error}
        </div>
      )}

      {/* Game over recap */}
      {showGameOver && state.finalPayout > 0 && (
        <div className="mx-3 mb-2 rounded-xl px-4 py-3 text-center"
          style={{
            background: state.lastOutcome === 'win' ? 'rgba(139,92,246,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${state.lastOutcome === 'win' ? 'rgba(139,92,246,0.30)' : 'rgba(239,68,68,0.30)'}`,
          }}>
          <p className="text-xs font-bold flex items-center justify-center gap-1.5" style={{ color: state.lastOutcome === 'win' ? '#c4b5fd' : '#f87171' }}>
            {state.lastOutcome === 'win'
              ? <><IconTrophy size={13} /> You Won</>
              : state.lastOutcome === 'tie'
                ? <><IconOutcomeTie size={13} /> Tied</>
                : <><IconOutcomeLoss size={13} /> You Lost</>}
          </p>
          {state.finalPayout > 0 && (
            <p className="text-xs text-gray-400 mt-1 font-mono tabular-nums">+{state.finalPayout.toLocaleString()} ETB</p>
          )}
        </div>
      )}

      <div className="px-4 pb-4 space-y-4">

        {/* Mode selector */}
        {isIdle && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Game Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {(['single', 'chain'] as RPSMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1"
                  style={{
                    background: mode === m ? 'rgba(139,92,246,0.16)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${mode === m ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.10)'}`,
                    color: mode === m ? '#c4b5fd' : '#6b7280',
                  }}>
                  {m === 'single' ? <IconBolt size={18} /> : <IconLink size={18} />}
                  <span className="capitalize">{m}</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-60">
                    {m === 'single' ? '1.94x win' : 'up to 102x'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bet input */}
        {isIdle && (
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bet Amount</label>
            <div
              className="flex items-stretch rounded-xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.40)', border: `1px solid ${betError ? 'rgba(239,68,68,0.50)' : 'rgba(255,255,255,0.10)'}` }}
            >
              <input
                type="number" value={betInput}
                onChange={e => { setBetInput(e.target.value); setActiveChip(null); }}
                className="flex-1 bg-transparent text-white font-mono font-black text-xl px-4 py-3 outline-none w-0 tabular-nums"
                min={MIN_BET} max={MAX_BET}
              />
              <div className="flex items-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={() => setBet(parsedBet / 2)}
                  className="px-3 h-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  ½
                </button>
                <button type="button" onClick={() => setBet(parsedBet * 2)}
                  className="px-3 h-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                  2x
                </button>
                <span className="px-4 text-sm font-bold text-gray-500 flex items-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                  ETB
                </span>
              </div>
            </div>
            {betError && <p className="text-[10px] text-red-400">{betError}</p>}
            <div className="flex flex-wrap gap-1.5">
              {BET_CHIPS.map(v => (
                <button key={v} onClick={() => { setBetInput(String(v)); setActiveChip(v); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={{
                    background: activeChip === v ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeChip === v ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.10)'}`,
                    color: activeChip === v ? '#c4b5fd' : '#9ca3af',
                  }}>
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Client seed override */}
        {isIdle && (
          <div className="space-y-1">
            <button onClick={() => setShowSeed(s => !s)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors">
              <IconLock size={12} />
              Provably Fair Settings
              <IconChevron size={12} direction={showSeed ? 'up' : 'down'} />
            </button>
            {showSeed && (
              <input
                type="text" value={clientSeed} placeholder="Leave empty for auto-generated"
                onChange={e => setClientSeed(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm font-mono text-gray-300 outline-none"
                style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.10)' }}
              />
            )}
          </div>
        )}

        {/* Chain progress */}
        {isActive && mode === 'chain' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Win Streak</label>
              <span className="text-sm font-bold text-violet-400 flex items-center gap-1">
                {winStreak} <IconLink size={12} />
              </span>
            </div>
            <div className="flex gap-1">
              {CHAIN_MULTS.map((m, i) => (
                <div key={i}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    background: i < winStreak
                      ? `linear-gradient(90deg, #7c3aed, #8b5cf6)`
                      : 'rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Multiplier</p>
                <p className="text-sm font-bold font-mono tabular-nums text-violet-400">{chainMult.toFixed(2)}x</p>
              </div>
              <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Potential</p>
                <p className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                  {potentialPayout > 0 ? `${potentialPayout.toLocaleString()} ETB` : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Single mode: last result */}
        {isActive && mode === 'single' && state.lastOutcome && (
          <div className="rounded-xl px-4 py-3 text-center"
            style={{
              background: state.lastOutcome === 'win' ? 'rgba(139,92,246,0.10)' : 'rgba(239,68,68,0.10)',
              border: `1px solid ${state.lastOutcome === 'win' ? 'rgba(139,92,246,0.30)' : 'rgba(239,68,68,0.30)'}`,
            }}>
            <p className="text-xs font-bold flex items-center justify-center gap-1.5" style={{ color: state.lastOutcome === 'win' ? '#c4b5fd' : '#f87171' }}>
              {state.lastOutcome === 'win'
                ? <><IconTrophy size={13} /> Win</>
                : state.lastOutcome === 'tie'
                  ? <><IconOutcomeTie size={13} /> Tie</>
                  : <><IconOutcomeLoss size={13} /> Loss</>}
            </p>
          </div>
        )}

        {/* CTA */}
        {isIdle ? (
          <button
            onClick={() => { if (!betError && !isLoading) onStart(parsedBet, mode, clientSeed || undefined); }}
            disabled={!!betError || isLoading}
            className="w-full rounded-xl font-black text-base tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex flex-col items-center justify-center py-3.5 gap-0.5"
            style={{
              background: isLoading ? 'rgba(139,92,246,0.40)' : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 150%)',
              boxShadow: '0 4px 18px rgba(139,92,246,0.35)',
              color: '#fff',
            }}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Starting…
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2"><IconRock size={16} /> Play RPS</span>
                <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
                  {mode === 'single' ? 'Single Round' : 'Chain Mode'}
                </span>
              </>
            )}
          </button>
        ) : canCashOut ? (
          <button
            onClick={() => { if (!isLoading) onCashOut(); }}
            disabled={isLoading}
            className="w-full rounded-xl font-black text-base tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex flex-col items-center justify-center py-3.5 gap-0.5"
            style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', boxShadow: '0 4px 18px rgba(245,158,11,0.30)', color: '#fff' }}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Cashing out…
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2"><IconCoin size={16} /> Cash Out Chain</span>
                <span className="text-sm font-bold font-mono tabular-nums text-amber-100">
                  {potentialPayout.toLocaleString()} ETB · {chainMult.toFixed(2)}x
                </span>
              </>
            )}
          </button>
        ) : null}

        {isActive && state.serverSeedHash && (
          <p className="text-center text-[10px] text-gray-600">
            Seed: <span className="font-mono">{state.serverSeedHash.slice(0, 14)}…</span>
          </p>
        )}
      </div>
    </div>
  );
}