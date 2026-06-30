// components/pool/hud/GameHUD8Ball.tsx
'use client';

import { useState, useEffect } from 'react';
import { SOLID_BALLS, STRIPE_BALLS, BALL_COLORS } from '../../lib/pool.constants';
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

function BallDot({ number, pocketed }: { number: number; pocketed: boolean }) {
  const color    = (BALL_COLORS as Record<number,string>)[number] ?? '#888';
  const isStripe = number >= 9 && number <= 15;
  return (
    <div
      title={`Ball ${number}`}
      className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0 ${pocketed ? 'opacity-20 scale-90' : 'opacity-100'}`}
      style={{
        background: isStripe ? '#F0EDE8' : color,
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: pocketed ? 'none' : '0 1px 4px rgba(0,0,0,0.5)',
      }}
    >
      {isStripe && (
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center pointer-events-none">
          <div className="w-full h-2.5" style={{ backgroundColor: color }} />
        </div>
      )}
      <span className="relative z-10 text-[8px] font-bold select-none"
        style={{ color: isStripe ? color : '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
        {number}
      </span>
    </div>
  );
}

function PowerBar({ power, visible }: { power: number; visible: boolean }) {
  const pct   = power;
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e';
  return (
    <div className={`flex flex-col items-center gap-1 transition-all duration-150 ${visible ? 'opacity-100' : 'opacity-40'}`}>
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">Power</span>
      <div className="relative w-3 h-36 bg-zinc-800 rounded-full overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75"
          style={{ height: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
        {/* Tick marks */}
        {[25, 50, 75].map(t => (
          <div key={t} className="absolute left-0 right-0 h-px bg-zinc-700"
            style={{ bottom: `${t}%` }} />
        ))}
      </div>
      <span className="text-white font-bold text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

export function GameHUD8Ball({ gameState, power, isAiming, myUserId, stake, onForfeit, onDismissFoul }: Props) {
  const { isMyTurn, myGroup, opponentGroup, ballsOnTable, tableOpen,
          foulMessage, foulVisible, controlsLocked, endResult, players,
           } = gameState;

  const me       = players.find(p => p.userId === myUserId);
  const opponent = players.find(p => p.userId !== myUserId);
  const myName   = me?.username ?? 'You';
  const oppName  = opponent?.username ?? 'Opponent';

  const myBalls  = myGroup === 'solids' ? SOLID_BALLS : myGroup === 'stripes' ? STRIPE_BALLS : [];
  const oppBalls = opponentGroup === 'solids' ? SOLID_BALLS : opponentGroup === 'stripes' ? STRIPE_BALLS : [];

  const myCleared  = myBalls.filter(b => !ballsOnTable.includes(b)).length;
  const oppCleared = oppBalls.filter(b => !ballsOnTable.includes(b)).length;
  const myAllDone  = myBalls.length > 0 && myCleared === myBalls.length;

  const [showForfeit, setShowForfeit] = useState(false);
  const [matchSecs,   setMatchSecs]   = useState(0);

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

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const prizePot = stake > 0
    ? (stake * 2) - (stake === 20 ? 5 : stake === 50 ? 10 : stake === 100 ? 20 : 0)
    : 0;

  return (
    <div className="w-[264px] flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Player panels ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 space-y-2 p-3">

        {/* Me */}
        <div className={`rounded-2xl p-3 border transition-all duration-300 ${
          isMyTurn ? 'bg-emerald-950/50 border-emerald-700/70' : 'bg-zinc-800/50 border-zinc-700/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow">
              {myName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm leading-none truncate">{myName}</div>
              <div className="text-zinc-500 text-[11px] mt-0.5">
                {myGroup ? myGroup.charAt(0).toUpperCase() + myGroup.slice(1) : tableOpen ? 'Open table' : '—'}
              </div>
            </div>
            {isMyTurn && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px] font-semibold">Your turn</span>
              </div>
            )}
          </div>
          {myGroup ? (
            <div className="flex gap-1 flex-wrap">
              {myBalls.map(n => <BallDot key={n} number={n} pocketed={!ballsOnTable.includes(n)} />)}
            </div>
          ) : (
            <div className="text-zinc-600 text-[11px]">Group not yet assigned</div>
          )}
        </div>

        {/* Opponent */}
        <div className={`rounded-2xl p-3 border transition-all duration-300 ${
          !isMyTurn && gameState.status === 'active' ? 'bg-amber-950/30 border-amber-700/60' : 'bg-zinc-800/50 border-zinc-700/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow">
              {oppName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm leading-none truncate">{oppName}</div>
              <div className="text-zinc-500 text-[11px] mt-0.5">
                {opponentGroup ? opponentGroup.charAt(0).toUpperCase() + opponentGroup.slice(1) : tableOpen ? 'Open table' : '—'}
              </div>
            </div>
            {!isMyTurn && gameState.status === 'active' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-[11px] font-semibold">Their turn</span>
              </div>
            )}
          </div>
          {opponentGroup ? (
            <div className="flex gap-1 flex-wrap">
              {oppBalls.map(n => <BallDot key={n} number={n} pocketed={!ballsOnTable.includes(n)} />)}
            </div>
          ) : (
            <div className="text-zinc-600 text-[11px]">Group not yet assigned</div>
          )}
        </div>
      </div>

      {/* ── Turn instruction ──────────────────────────────────────────────── */}
      {gameState.status === 'active' && (
        <div className="flex-shrink-0 mx-3 mb-2">
          <div className={`rounded-xl px-3 py-2 text-center text-xs font-medium transition-all ${
            isMyTurn ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60' : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50'
          }`}>
            {isMyTurn
              ? tableOpen     ? '🎯 Hit any ball first'
              : myAllDone    ? '🎱 Pot the 8-ball to win!'
              :                `Pot your ${myGroup}`
              : `${oppName} is shooting…`}
          </div>
        </div>
      )}

      {/* ── Fouls ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-1.5">Fouls</div>
          {foulVisible && foulMessage ? (
            <button onClick={onDismissFoul} className="flex items-start gap-2 text-left w-full group">
              <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">⚠</span>
              <span className="text-red-300 text-xs leading-snug group-hover:text-red-200 transition-colors">{foulMessage}</span>
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

      {/* ── Pocketed tracker ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Pocketed</div>
          <div className="space-y-1.5">
            {[
              { label: 'You', count: myCleared, total: 7, color: 'bg-emerald-500' },
              { label: 'Opponent', count: oppCleared, total: 7, color: 'bg-amber-500' },
            ].map(({ label, count, total, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs w-14 flex-shrink-0">{label}</span>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-500 ${i < count ? color : 'bg-zinc-700'}`} />
                  ))}
                </div>
                <span className="text-zinc-500 text-[10px] tabular-nums w-6 text-right">{count}/7</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats + power ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2 flex gap-2">
        <div className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 space-y-1.5 min-w-0">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">Match</div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-zinc-500 text-xs">Time</span>
            <span className="text-zinc-300 text-xs font-mono">{fmtTime(matchSecs)}</span>
          </div>
          {prizePot > 0 && (
            <div className="flex items-center justify-between gap-1">
              <span className="text-zinc-500 text-xs">Prize pot</span>
              <span className="text-amber-400 text-xs font-bold">{prizePot} ብር</span>
            </div>
          )}
          {controlsLocked && !endResult && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-zinc-500 text-[10px]">Balls moving…</span>
            </div>
          )}
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 flex flex-col items-center flex-shrink-0">
          <PowerBar power={power} visible={isAiming && isMyTurn} />
        </div>
      </div>

      {/* ── Game rules ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-3 mb-2">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Eight Ball</div>
          <ul className="space-y-1">
            {[
              'Pot all your balls (Solids or Stripes)',
              'Then pot the 8-ball',
              'Foul = Opponent ball in hand',
            ].map(r => (
              <li key={r} className="text-zinc-400 text-[11px] flex items-start gap-1.5">
                <span className="text-zinc-600 flex-shrink-0 mt-0.5">•</span>{r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Spacer ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0" />

      {/* ── Forfeit ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-800">
        {!showForfeit ? (
          <button onClick={() => setShowForfeit(true)}
            className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-500/80 text-sm font-medium hover:bg-red-950/30 hover:text-red-400 hover:border-red-800/60 transition-all flex items-center justify-center gap-2">
            <span>🏳</span> Forfeit Match
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs text-center">Concede and lose your stake?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowForfeit(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition-colors">
                Cancel
              </button>
              <button onClick={() => { onForfeit(); setShowForfeit(false); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">
                Forfeit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}