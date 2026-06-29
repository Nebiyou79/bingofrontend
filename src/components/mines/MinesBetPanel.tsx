// components/mines/MinesBetPanel.tsx
/**
 * DashBets — Mines Bet Panel
 *
 * Redesigned to match the conventions of real betting platforms
 * (Stake / Roobet / BC.Game style) rather than a generic dashboard card:
 *  1. Bet input now has ½ / 2x stepper buttons beside the quick chips —
 *     the single most recognizable "real sportsbook" affordance
 *  2. All emoji glyphs replaced with the shared line-icon set
 *  3. Mine-count selector keeps the live "first gem" multiplier preview
 *  4. Flatter, calmer chrome: hairline borders instead of heavy glow,
 *     consistent spacing scale, tabular numerals for all stats
 */

import React, { useState, useMemo } from 'react';
import { MinesGameState } from '../../lib/api/minesApi';
import { IconBomb, IconGem, IconCoin, IconTrophy, IconOutcomeLoss, IconLock, IconChevron } from '../icons/GameIcons';

// ── Constants ──────────────────────────────────────────────────────────────────

const BET_CHIPS    = [10, 50, 100, 500, 1_000, 5_000];
const MINE_PRESETS = [1, 3, 5, 10, 15, 20, 24];
const MIN_BET      = 1;
const MAX_BET      = 10_000;
const GRID_SIZE    = 25;
const HOUSE_EDGE   = 0.04;

// ── Multiplier calculation (mirrors minesEngine — client-side preview) ─────────
function calcMultiplier(mineCount: number, reveals: number): number {
  if (reveals <= 0) return 1.00;
  const safeTiles = GRID_SIZE - mineCount;
  if (safeTiles <= 0 || reveals > safeTiles) return 1.00;
  let prob = 1;
  for (let r = 0; r < reveals; r++) {
    prob *= (safeTiles - r) / (GRID_SIZE - r);
  }
  return Math.max(1.00, Math.floor((1 / prob) * (1 - HOUSE_EDGE) * 100) / 100);
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface MinesBetPanelProps {
  gameState:       MinesGameState | null;
  potentialPayout: number;
  canCashOut:      boolean;
  isLoading:       boolean;
  isRevealing:     boolean;
  error:           string | null;
  userBalance:     number;
  todayProfit?:    number;
  lastWin?:        number;
  onStart:         (betAmount: number, mineCount: number, clientSeed?: string) => void;
  onCashOut:       () => void;
}

// ── Stat row (active game) ─────────────────────────────────────────────────────

function StatRow({ label, value, valueColor = 'text-white' }: {
  label: string; value: string; valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold font-mono tabular-nums ${valueColor}`}>{value}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MinesBetPanel({
  gameState,
  canCashOut,
  isLoading,
  isRevealing,
  error,
  userBalance,
  todayProfit = 0,
  lastWin = 0,
  onStart,
  onCashOut,
}: MinesBetPanelProps) {
  const [betInput,   setBetInput]   = useState<string>('100');
  const [mineCount,  setMineCount]  = useState<number>(3);
  const [clientSeed, setClientSeed] = useState<string>('');
  const [showSeed,   setShowSeed]   = useState<boolean>(false);
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const isActive   = !!gameState && gameState.status === 'active';
  const isGameOver = !!gameState && gameState.status !== 'active';
  const isBusy     = isLoading || isRevealing;

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

  // First-gem multiplier preview — updates live with mine count selector
  const firstGemMult = useMemo(() => calcMultiplier(mineCount, 1), [mineCount]);
  const firstGemPayout = useMemo(
    () => Math.floor(parsedBet * firstGemMult),
    [parsedBet, firstGemMult]
  );

  // Active game display
  const currentMult     = gameState?.currentMultiplier ?? 1;
  const nextMult        = gameState?.nextMultiplier    ?? null;
  const currentPayout   = gameState
    ? Math.floor(gameState.betAmount * currentMult).toLocaleString()
    : '—';
  const nextMultDisplay = nextMult != null ? `${nextMult.toFixed(2)}x` : '—';

  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #13152a 0%, #0e1020 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
    >

      {/* ── Balance card ──────────────────────────────────────────────────── */}
      <div
        className="p-4 m-3 rounded-xl relative overflow-hidden"
        style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)' }}
      >
        <div className="flex items-start justify-between mb-3 relative z-10">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Your Balance
          </p>
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
            <p className="text-sm font-bold font-mono tabular-nums text-amber-400">
              {lastWin.toLocaleString()} ETB
            </p>
          </div>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mb-2 rounded-xl px-4 py-2.5 text-sm text-red-400 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <IconOutcomeLoss size={15} />
          {error}
        </div>
      )}

      {/* ── Game-over result ─────────────────────────────────────────────────── */}
      {isGameOver && (
        <div
          className="mx-3 mb-2 rounded-xl px-4 py-3 text-center"
          style={{
            background: gameState!.status === 'won' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${gameState!.status === 'won' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400 flex items-center justify-center gap-1.5">
            {gameState!.status === 'won'
              ? <><IconTrophy size={13} className="text-emerald-400" /> Cashed Out</>
              : <><IconBomb size={13} className="text-red-400" /> Mine Hit</>}
          </p>
          <p className={`text-2xl font-black font-mono tabular-nums ${gameState!.status === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
            {gameState!.status === 'won'
              ? `+${gameState!.payout.toLocaleString()} ETB`
              : '0 ETB'}
          </p>
          {gameState!.status === 'won' && (
            <p className="text-xs text-emerald-500 mt-0.5">
              {gameState!.currentMultiplier.toFixed(2)}x multiplier
            </p>
          )}
        </div>
      )}

      <div className="px-4 pb-4 space-y-4">

        {/* ── BET CONTROLS label ───────────────────────────────────────────── */}
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-1">
          Bet Controls
        </p>

        {/* ── Active game: live stats ──────────────────────────────────────── */}
        {isActive && (
          <div
            className="rounded-xl p-3 space-y-1"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <StatRow
              label="Multiplier"
              value={`${currentMult.toFixed(2)}x`}
              valueColor={currentMult > 1 ? 'text-emerald-400' : 'text-gray-400'}
            />
            <StatRow label="Next Gem" value={nextMultDisplay} valueColor="text-blue-400" />
            <StatRow label="Payout" value={`${currentPayout} ETB`} valueColor="text-amber-400" />
          </div>
        )}

        {/* ── Bet amount (pre-game) ────────────────────────────────────────── */}
        {!isActive && (
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Bet Amount (ETB)
            </label>
            <div
              className="flex items-stretch rounded-xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.40)', border: `1px solid ${betError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)'}` }}
            >
              <input
                type="number"
                value={betInput}
                onChange={e => { setBetInput(e.target.value); setActiveChip(null); }}
                min={MIN_BET}
                max={MAX_BET}
                className="flex-1 bg-transparent text-white text-xl font-black font-mono tabular-nums px-4 py-3 outline-none w-0"
                placeholder="100"
              />
              <div className="flex items-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setBet(parsedBet / 2)}
                  className="px-3 h-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  ½
                </button>
                <button
                  type="button"
                  onClick={() => setBet(parsedBet * 2)}
                  className="px-3 h-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                >
                  2x
                </button>
                <span
                  className="px-4 text-sm font-bold text-gray-500 flex items-center"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                >
                  ETB
                </span>
              </div>
            </div>
            {betError && <p className="text-xs text-red-400">{betError}</p>}

            {/* Quick-pick chips */}
            <div className="flex flex-wrap gap-1.5">
              {BET_CHIPS.map(v => (
                <button
                  key={v}
                  onClick={() => { setActiveChip(v); setBetInput(String(v)); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={{
                    background: activeChip === v ? 'rgba(108,99,255,0.20)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${activeChip === v ? 'rgba(108,99,255,0.60)' : 'rgba(255,255,255,0.10)'}`,
                    color: activeChip === v ? '#a5b4fc' : '#9ca3af',
                  }}
                >
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Mine count selector ──────────────────────────────────────────── */}
        {!isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mines
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-indigo-400 font-mono tabular-nums">{mineCount}</span>
                {/* Live first-gem multiplier preview — KEY FEATURE */}
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md font-mono tabular-nums flex items-center gap-1"
                  style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
                >
                  1st gem {firstGemMult.toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-1.5">
              {MINE_PRESETS.map(m => (
                <button
                  key={m}
                  onClick={() => setMineCount(m)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: mineCount === m ? 'rgba(108,99,255,0.20)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${mineCount === m ? 'rgba(108,99,255,0.60)' : 'rgba(255,255,255,0.10)'}`,
                    color: mineCount === m ? '#a5b4fc' : '#9ca3af',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Slider */}
            <style>{`
              .mines-slider {
                -webkit-appearance: none;
                appearance: none;
                height: 4px;
                border-radius: 999px;
                background: linear-gradient(90deg, #6366f1 0%, #6366f1 ${(mineCount - 1) / 23 * 100}%, rgba(255,255,255,0.10) ${(mineCount - 1) / 23 * 100}%, rgba(255,255,255,0.10) 100%);
              }
              .mines-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px; height: 16px;
                border-radius: 50%;
                background: #fff;
                border: 3px solid #6366f1;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(0,0,0,0.4);
              }
              .mines-slider::-moz-range-thumb {
                width: 16px; height: 16px;
                border-radius: 50%;
                background: #fff;
                border: 3px solid #6366f1;
                cursor: pointer;
              }
            `}</style>
            <input
              type="range"
              min={1}
              max={24}
              value={mineCount}
              onChange={e => setMineCount(Number(e.target.value))}
              className="w-full mines-slider"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>1 mine · easy</span>
              <span>24 mines · extreme</span>
            </div>

            {/* First gem payout preview */}
            <div
              className="rounded-lg px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-xs text-gray-500">If 1st gem safe →</span>
              <span className="text-sm font-bold font-mono tabular-nums text-amber-400">
                +{firstGemPayout.toLocaleString()} ETB
              </span>
            </div>
          </div>
        )}

        {/* ── Active game: mines / revealed badges ─────────────────────────── */}
        {isActive && (
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Mines</span>
              <span className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <IconBomb size={14} /> {gameState!.mineCount}
              </span>
            </div>
            <div
              className="flex-1 flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Revealed</span>
              <span className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                <IconGem size={14} /> {gameState!.revealedTiles.length}
              </span>
            </div>
          </div>
        )}

        {/* ── Provably fair seed (collapsed) ──────────────────────────────── */}
        {!isActive && (
          <div>
            <button
              onClick={() => setShowSeed(s => !s)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              <IconLock size={12} />
              Provably Fair Settings
              <IconChevron size={12} direction={showSeed ? 'up' : 'down'} />
            </button>
            {showSeed && (
              <div className="mt-2 space-y-1">
                <label className="block text-xs text-gray-600">Client Seed (optional)</label>
                <input
                  type="text"
                  value={clientSeed}
                  onChange={e => setClientSeed(e.target.value)}
                  placeholder="Leave blank to use your user ID"
                  className="w-full rounded-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                  style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.10)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Start / Cash Out button ──────────────────────────────────────── */}
        {!isActive ? (
          <button
            onClick={() => {
              if (!betError && !isBusy) onStart(parsedBet, mineCount, clientSeed.trim() || undefined);
            }}
            disabled={!!betError || isBusy}
            className="w-full rounded-xl font-black text-base tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex flex-col items-center justify-center py-3.5 gap-0.5"
            style={{
              background: isBusy ? 'rgba(108,99,255,0.40)' : 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
              boxShadow: '0 4px 18px rgba(79,70,229,0.35)',
              color: '#fff',
            }}
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Starting…
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2"><IconBomb size={16} /> Start Game</span>
                <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
                  Bet {parsedBet.toLocaleString()} ETB
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => { if (canCashOut && !isBusy) onCashOut(); }}
            disabled={!canCashOut || isBusy}
            className="w-full rounded-xl font-black text-base tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex flex-col items-center justify-center py-3.5 gap-0.5"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', boxShadow: '0 4px 18px rgba(16,185,129,0.30)', color: '#fff' }}
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Processing…
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2"><IconCoin size={16} /> Cash Out</span>
                <span className="text-sm font-bold font-mono tabular-nums text-emerald-100">
                  {currentPayout} ETB · {currentMult.toFixed(2)}x
                </span>
              </>
            )}
          </button>
        )}

        {/* Seed hash line while active */}
        {isActive && (
          <p className="text-center text-[10px] text-gray-600">
            Bet: <span className="text-gray-500 font-mono">{gameState!.betAmount.toLocaleString()} ETB</span>
            {' · '}
            <span className="font-mono">{gameState!.serverSeedHash.slice(0, 14)}…</span>
          </p>
        )}

      </div>
    </div>
  );
}