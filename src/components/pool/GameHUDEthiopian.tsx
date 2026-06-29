// components/pool/hud/GameHUDEthiopian.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ETHIOPIAN_BALLS, BALL_COLORS } from '../../lib/pool.constants';
import type { PoolGameState } from '../../types/pool';

interface Props {
  gameState:     PoolGameState;
  power:         number;
  isAiming:      boolean;
  myUserId:      string;
  stake:         number;
  onForfeit:     () => void;
  onDismissFoul: () => void;
}

function PowerBar({ power, visible }: { power: number; visible: boolean }) {
  const color = power > 80 ? '#ef4444' : power > 50 ? '#f59e0b' : '#22c55e';
  return (
    <div className={`flex flex-col items-center gap-1 transition-all duration-150 ${visible ? 'opacity-100' : 'opacity-40'}`}>
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">Power</span>
      <div className="relative w-3 h-28 bg-zinc-800 rounded-full overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75"
          style={{ height: `${power}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
        {[25,50,75].map(t => (
          <div key={t} className="absolute left-0 right-0 h-px bg-zinc-700" style={{ bottom: `${t}%` }} />
        ))}
      </div>
      <span className="text-white font-bold text-xs tabular-nums">{power}%</span>
    </div>
  );
}

export function GameHUDEthiopian({ gameState, power, isAiming, myUserId, stake, onForfeit, onDismissFoul }: Props) {
  const { isMyTurn, scores, currentTarget, ballsOnTable, foulMessage,
          foulVisible, controlsLocked, endResult, players, turnOrder, lastShotResult } = gameState;

  const me       = players.find(p => p.userId === myUserId);
  const opponent = players.find(p => p.userId !== myUserId);
  const myName   = me?.username ?? 'You';
  const oppName  = opponent?.username ?? 'Opponent';
  const mySlot   = turnOrder[0]?.userId === myUserId ? 'p1' : 'p2';
  const oppSlot  = mySlot === 'p1' ? 'p2' : 'p1';
  const myScore  = scores[mySlot as 'p1'|'p2'];
  const oppScore = scores[oppSlot as 'p1'|'p2'];

  const [showForfeit, setShowForfeit] = useState(false);
  const [matchSecs,   setMatchSecs]   = useState(0);
  const [deltaAnim,   setDeltaAnim]   = useState<{val: number; positive: boolean} | null>(null);
  const deltaTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (gameState.status !== 'active') return;
    const t = setInterval(() => setMatchSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [gameState.status]);

  useEffect(() => {
    if (!foulVisible) return;
    const t = setTimeout(onDismissFoul, 4500);
    return () => clearTimeout(t);
  }, [foulVisible, onDismissFoul]);

  useEffect(() => {
    if (lastShotResult?.scoreDelta && lastShotResult.scoreDelta !== 0) {
      const wasMyShot = lastShotResult.nextTurnUserId !== myUserId;
      if (wasMyShot) {
        setDeltaAnim({ val: lastShotResult.scoreDelta, positive: lastShotResult.scoreDelta > 0 });
        clearTimeout(deltaTimer.current);
        deltaTimer.current = setTimeout(() => setDeltaAnim(null), 1800);
      }
    }
  }, [lastShotResult, myUserId]);

  const totalBalls   = ETHIOPIAN_BALLS.length;
  const clearedCount = ETHIOPIAN_BALLS.filter(b => !ballsOnTable.includes(b)).length;
  const progressPct  = (clearedCount / totalBalls) * 100;
  const fmtTime      = (s: number) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const prizePot = stake > 0
    ? (stake * 2) - (stake === 20 ? 5 : stake === 50 ? 10 : stake === 100 ? 20 : 0)
    : 0;

  return (
    <div className="w-[264px] flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Score panels ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 space-y-2 p-3">
        {/* Me */}
        <div className={`rounded-2xl p-3 border transition-all ${isMyTurn ? 'bg-emerald-950/50 border-emerald-700/70' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow">
              {myName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{myName}</div>
            </div>
            {isMyTurn && <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>Your turn</span>}
          </div>
          <div className="relative flex items-baseline gap-1.5">
            <span className="text-white font-black text-3xl tabular-nums leading-none">{myScore}</span>
            <span className="text-zinc-500 text-sm">pts</span>
            {deltaAnim && (
              <span className={`absolute -top-5 left-0 font-black text-lg animate-bounce ${deltaAnim.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltaAnim.positive ? `+${deltaAnim.val}` : deltaAnim.val}
              </span>
            )}
          </div>
        </div>

        {/* Opponent */}
        <div className={`rounded-2xl p-3 border transition-all ${!isMyTurn && gameState.status === 'active' ? 'bg-amber-950/30 border-amber-700/60' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow">
              {oppName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{oppName}</div>
            </div>
            {!isMyTurn && gameState.status === 'active' && <span className="flex items-center gap-1 text-amber-400 text-[11px] font-semibold flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>Their turn</span>}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white/80 font-black text-3xl tabular-nums leading-none">{oppScore}</span>
            <span className="text-zinc-500 text-sm">pts</span>
          </div>
        </div>
      </div>

      {/* ── Current target ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Current Target</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-base shadow-lg ring-2 ring-white/15 flex-shrink-0"
              style={{ backgroundColor: (BALL_COLORS as Record<number,string>)[currentTarget] ?? '#888' }}>
              {currentTarget}
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Ball {currentTarget}</div>
              <div className="text-zinc-500 text-xs">Hit this ball first</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sequence progress ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">Sequence</span>
            <span className="text-zinc-500 text-[10px]">{clearedCount}/{totalBalls}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-700 rounded-full mb-2.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {ETHIOPIAN_BALLS.map(n => {
              const cleared  = !ballsOnTable.includes(n);
              const isTarget = n === currentTarget;
              return (
                <div key={n}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white transition-all duration-500 ${cleared ? 'opacity-15 scale-75' : 'opacity-100'} ${isTarget ? 'ring-2 ring-white/60 scale-110 shadow-lg' : ''}`}
                  style={{ backgroundColor: (BALL_COLORS as Record<number,string>)[n] ?? '#888', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  {n}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Fouls ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-1.5">Fouls</div>
          {foulVisible && foulMessage ? (
            <button onClick={onDismissFoul} className="flex items-start gap-2 text-left w-full">
              <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">⚠</span>
              <span className="text-red-300 text-xs leading-snug">{foulMessage}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#22c55e" strokeWidth="1.5"/>
                <path d="M3.5 6l2 2 3-3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-zinc-400 text-xs">No fouls</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats + power ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2 flex gap-2">
        <div className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 space-y-1.5 min-w-0">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">Match</div>
          <div className="flex justify-between"><span className="text-zinc-500 text-xs">Time</span><span className="text-zinc-300 text-xs font-mono">{fmtTime(matchSecs)}</span></div>
          {prizePot > 0 && <div className="flex justify-between"><span className="text-zinc-500 text-xs">Prize</span><span className="text-amber-400 text-xs font-bold">{prizePot} ብር</span></div>}
          {controlsLocked && !endResult && (
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"/><span className="text-zinc-500 text-[10px]">Moving…</span></div>
          )}
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 flex flex-col items-center flex-shrink-0">
          <PowerBar power={power} visible={isAiming && isMyTurn} />
        </div>
      </div>

      <div className="flex-1 min-h-0" />

      {/* ── Forfeit ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-800">
        {!showForfeit ? (
          <button onClick={() => setShowForfeit(true)}
            className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-500/80 text-sm font-medium hover:bg-red-950/30 hover:border-red-800/60 hover:text-red-400 transition-all flex items-center justify-center gap-2">
            <span>🏳</span> Forfeit Match
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs text-center">Concede and lose your stake?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowForfeit(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition-colors">Cancel</button>
              <button onClick={() => { onForfeit(); setShowForfeit(false); }} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">Forfeit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}