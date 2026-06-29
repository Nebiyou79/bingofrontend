// components/chicken/ChickenBetPanel.tsx
/**
 * DashBets — Chicken Road Control Bar
 *
 * Rebuilt as a single horizontal bar that sits directly beneath the road
 * widget — matching the real game's layout (bet stepper, difficulty pills
 * with a "chance of collision" caption, lane count, and a big Go / Cash Out
 * button on the right) instead of a vertical sidebar card.
 */

import React, { useState, useMemo } from 'react';
import type { Difficulty } from '../../lib/api/chickenApi';
import type { ChickenSession } from '../../lib/api/chickenApi';

// ── Design tokens — shared with ChickenRoad ─────────────────────────────────────
const C = {
  bar:       '#161D24',
  field:     '#1F2730',
  border:    'rgba(255,255,255,0.08)',
  text:      '#FFFFFF',
  textDim:   'rgba(255,255,255,0.52)',
  textFaint: 'rgba(255,255,255,0.32)',
  green:     '#1FC76A',
  greenDark: '#15A157',
  amber:     '#E8954B',
  amberDark: '#D67E33',
  red:       '#E0495C',
  gold:      '#F2C94C',
};

const MIN_BET      = 1;
const MAX_BET      = 10_000;
const LANE_PRESETS = [5, 6, 7, 8, 9, 10];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; collisionPct: number; houseEdge: number; dangerMin: number; dangerMax: number }> = {
  easy:   { label: 'Easy',   collisionPct: 14, houseEdge: 0.03, dangerMin: 1, dangerMax: 2 },
  medium: { label: 'Medium', collisionPct: 28, houseEdge: 0.04, dangerMin: 2, dangerMax: 3 },
  hard:   { label: 'Hard',   collisionPct: 42, houseEdge: 0.05, dangerMin: 3, dangerMax: 4 },
};

function calcChickenMult(difficulty: Difficulty, laneCount: number, lanesCleared: number): number {
  if (lanesCleared <= 0) return 1.00;
  const { houseEdge, dangerMin, dangerMax } = DIFFICULTY_CONFIG[difficulty];
  const avgDanger = (dangerMin + dangerMax) / 2;
  const safeProb  = Math.max(0.1, 1 - avgDanger / laneCount);
  const prob      = Math.pow(safeProb, lanesCleared);
  return Math.max(1.00, Math.floor((1 / prob) * (1 - houseEdge) * 100) / 100);
}

// ── Small bits ───────────────────────────────────────────────────────────────
function ChevronStepper({ onUp, onDown, disabled }: { onUp: () => void; onDown: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col border-l shrink-0" style={{ borderColor: C.border }}>
      <button type="button" onClick={onUp} disabled={disabled}
        className="flex-1 w-8 flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" onClick={onDown} disabled={disabled}
        className="flex-1 w-8 flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ color: C.textDim }}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChickenBetPanelProps {
  session:     ChickenSession | null;
  isLoading:   boolean;
  error:       string | null;
  userBalance: number;
  onStart:     (betAmount: number, difficulty: Difficulty, laneCount: number) => void;
  onCashOut:   () => void;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ChickenBetPanel({ session, isLoading, error, userBalance, onStart, onCashOut }: ChickenBetPanelProps) {
  const [betInput,   setBetInput]   = useState('100');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [laneCount,  setLaneCount]  = useState(7);

  const isActive = !!session && session.status === 'active';

  const parsedBet = useMemo(() => {
    const n = Number(betInput);
    return Number.isFinite(n) ? Math.max(MIN_BET, Math.min(MAX_BET, n)) : MIN_BET;
  }, [betInput]);

  const betError = useMemo(() => {
    const n = Number(betInput);
    if (!Number.isFinite(n) || n < MIN_BET) return `Min ${MIN_BET}`;
    if (n > MAX_BET) return `Max ${MAX_BET.toLocaleString()}`;
    if (n > userBalance) return 'Low balance';
    return null;
  }, [betInput, userBalance]);

  const setBet = (v: number) => setBetInput(String(Math.max(MIN_BET, Math.min(MAX_BET, Math.floor(v)))));

  const firstLaneMult   = useMemo(() => calcChickenMult(difficulty, laneCount, 1), [difficulty, laneCount]);
  const currentMult     = session?.currentMultiplier ?? 1;
  const currentPayout   = session ? Math.floor(session.betAmount * currentMult) : 0;
  const canStart         = !betError && !isLoading;

  return (
    <div className="w-full" style={{ background: C.bar, borderTop: `1px solid ${C.border}` }}>

      {error && (
        <div className="px-4 pt-3">
          <p className="text-xs text-center rounded-lg py-2 px-3" style={{ color: C.red, background: 'rgba(224,73,92,0.08)', border: `1px solid rgba(224,73,92,0.2)` }}>{error}</p>
        </div>
      )}

      {!isActive ? (
        // ── Idle control bar ──────────────────────────────────────────────
        <div className="flex flex-wrap items-end gap-3 p-4">

          {/* Bet amount */}
          <div className="min-w-0" style={{ flex: '1 1 150px' }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Bet Amount</label>
              {betError && <span className="text-[10px]" style={{ color: C.red }}>{betError}</span>}
            </div>
            <div className="flex items-stretch h-11 rounded-lg overflow-hidden" style={{ border: `1px solid ${betError ? C.red : C.border}`, background: C.field }}>
              <input
                type="number"
                value={betInput}
                onChange={e => setBetInput(e.target.value)}
                className="flex-1 min-w-0 px-3 text-sm font-mono font-semibold outline-none bg-transparent"
                style={{ color: C.text }}
              />
              <span className="self-center pr-2 text-[10px] font-semibold shrink-0" style={{ color: C.textFaint }}>ETB</span>
              <ChevronStepper onUp={() => setBet(parsedBet * 2)} onDown={() => setBet(parsedBet / 2)} />
            </div>
          </div>

          {/* Difficulty */}
          <div className="min-w-0" style={{ flex: '2 1 220px' }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Difficulty</label>
              <span className="text-[10px]" style={{ color: C.textFaint }}>Chance of collision: {DIFFICULTY_CONFIG[difficulty].collisionPct}%</span>
            </div>
            <div className="grid h-11 rounded-lg p-1 gap-1" style={{ background: C.field, border: `1px solid ${C.border}`, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => {
                const active = difficulty === d;
                return (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className="min-w-0 rounded-md text-[12px] font-semibold transition-colors truncate"
                    style={active ? { background: C.green, color: '#06210F' } : { color: C.textDim }}>
                    {DIFFICULTY_CONFIG[d].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lanes */}
          <div className="min-w-0" style={{ flex: '2 1 260px' }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Lanes</label>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(242,201,76,0.1)', color: C.gold }}>1st lane {firstLaneMult.toFixed(2)}x</span>
            </div>
            <div className="grid h-11 gap-1" style={{ gridTemplateColumns: `repeat(${LANE_PRESETS.length}, minmax(0, 1fr))` }}>
              {LANE_PRESETS.map(l => (
                <button key={l} type="button" onClick={() => setLaneCount(l)}
                  className="min-w-0 rounded-md text-[12px] font-semibold transition-colors"
                  style={laneCount === l ? { background: C.green, color: '#06210F' } : { background: C.field, border: `1px solid ${C.border}`, color: C.textDim }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Go button */}
          <div style={{ flex: '1 1 140px' }}>
            <button
              type="button"
              onClick={() => { if (canStart) onStart(parsedBet, difficulty, laneCount); }}
              disabled={!canStart}
              className="w-full h-11 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
              style={canStart ? { background: C.green, color: '#06210F' } : { background: C.field, color: C.textFaint, cursor: 'not-allowed' }}
              onMouseEnter={e => { if (canStart) e.currentTarget.style.background = C.greenDark; }}
              onMouseLeave={e => { if (canStart) e.currentTarget.style.background = C.green; }}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : 'Go'}
            </button>
          </div>
        </div>
      ) : (
        // ── Active control bar ────────────────────────────────────────────
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex flex-wrap gap-2" style={{ flex: '1 1 260px' }}>
            {[
              { label: 'Bet',     value: `${session!.betAmount.toLocaleString()} ETB` },
              { label: 'Lane',    value: `${session!.currentLane + 1}/${session!.laneCount}` },
              { label: 'Mult',    value: `${currentMult.toFixed(2)}x`, color: C.gold },
              { label: 'Payout',  value: `${currentPayout.toLocaleString()} ETB`, color: C.green },
            ].map(s => (
              <div key={s.label} className="min-w-0 flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ background: C.field, border: `1px solid ${C.border}` }}>
                <span className="text-[10px] font-semibold uppercase" style={{ color: C.textFaint }}>{s.label}</span>
                <span className="text-xs font-bold font-mono truncate" style={{ color: s.color ?? C.text }}>{s.value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { if (!isLoading) onCashOut(); }}
            disabled={isLoading || session!.crossedLanes.length === 0}
            className="h-11 px-6 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: C.amber, color: '#2A1700', flex: '1 1 160px' }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = C.amberDark; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = C.amber; }}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : `Cash out · ${currentPayout.toLocaleString()} ETB`}
          </button>
        </div>
      )}
    </div>
  );
}