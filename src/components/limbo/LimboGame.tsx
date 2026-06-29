// components/limbo/LimboGame.tsx
'use client';

import { useState } from 'react';
import { useLimboSocket } from '@/hooks/useLimboSocket';

function counterTone(multiplier: number) {
  if (multiplier < 1.5) return 'text-emerald-400';
  if (multiplier < 3)   return 'text-amber-400';
  if (multiplier < 10)  return 'text-orange-500';
  return 'text-rose-500';
}

export default function LimboGame() {
  const {
    connected, phase, secondsLeft, multiplier,
    lastSettled, history, myBetStatus, balance, error,
    canBet, placeBet,
  } = useLimboSocket();

  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(2.0);

  const resultLabel =
    myBetStatus === 'won'  ? 'You won!' :
    myBetStatus === 'lost' ? 'No hit this round' :
    null;

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-950/40 to-zinc-950 p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Limbo</h2>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          {balance != null && <span>Balance: <span className="font-medium text-zinc-200">{balance.toFixed(2)} ETB</span></span>}
        </div>
      </div>

      {/* Climbing counter */}
      <div className="mb-8 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/30 py-10">
        <span
          className={`font-mono text-5xl font-bold tabular-nums transition-colors duration-200 ${counterTone(multiplier)}`}
        >
          {multiplier.toFixed(2)}x
        </span>

        {phase === 'betting' && (
          <span className="mt-3 text-sm text-zinc-400">Betting closes in {secondsLeft}s</span>
        )}
        {phase === 'running' && (
          <span className="mt-3 text-sm text-zinc-400">Climbing…</span>
        )}
        {phase === 'settled' && lastSettled && (
          <span className="mt-3 text-sm text-zinc-400">
            Crashed at {lastSettled.crashPoint.toFixed(2)}x
            {resultLabel && <span className={`ml-2 font-semibold ${myBetStatus === 'won' ? 'text-emerald-400' : 'text-rose-400'}`}>{resultLabel}</span>}
          </span>
        )}
      </div>

      {error && <p className="mb-4 text-center text-sm text-rose-400">{error}</p>}

      {/* Bet controls */}
      <div className="mb-8 flex flex-wrap items-end justify-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-zinc-500">Bet amount</label>
          <input
            type="number"
            min={1}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            disabled={!canBet}
            className="w-28 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-center text-zinc-100 outline-none focus:border-indigo-400 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-zinc-500">Target multiplier</label>
          <input
            type="number"
            min={1.01}
            max={1000}
            step={0.01}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            disabled={!canBet}
            className="w-28 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-center text-zinc-100 outline-none focus:border-indigo-400 disabled:opacity-50"
          />
        </div>

        <button
          onClick={() => placeBet(betAmount, target)}
          disabled={!canBet || betAmount < 1 || target < 1.01 || target > 1000}
          className="rounded-lg bg-indigo-500 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {myBetStatus === 'none' ? 'Place bet' : 'Bet placed'}
        </button>
      </div>

      {/* Win chance preview (1% house edge baked into the formula) */}
      {canBet && target >= 1.01 && (
        <p className="mb-6 text-center text-xs text-zinc-500">
          Win chance ≈ {((0.99 / target) * 100).toFixed(2)}% · Payout if it hits: {(betAmount * target).toFixed(2)} ETB
        </p>
      )}

      {/* Round history strip */}
      {history.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Recent rounds</p>
          <div className="flex flex-wrap gap-2">
            {history.map((r) => (
              <span
                key={r.roundId}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  r.crashPoint >= 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
                title={`Round #${r.roundNumber}`}
              >
                {r.crashPoint.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
