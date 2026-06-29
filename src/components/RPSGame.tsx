'use client';
// components/games/RPSGame.tsx

/**
 * DashBets — Rock Paper Scissors Game UI
 *
 * Handles both single and chain modes via useRPS hook.
 * Chain mode shows streak counter, live multiplier, and a Cash Out button.
 * Win/loss reveal uses a brief CSS transition before advancing to next pick.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRPS }                                            from '../../hooks/useRPS';
import { RPSChoice, RPSMode }                               from '../../lib/api/rpsApi';

// ─── Choice icons ─────────────────────────────────────────────────────────────

const CHOICE_EMOJI: Record<RPSChoice, string> = {
  rock:     '🪨',
  paper:    '📄',
  scissors: '✂️',
};

const CHOICE_LABEL: Record<RPSChoice, string> = {
  rock:     'Rock',
  paper:    'Paper',
  scissors: 'Scissors',
};

const OUTCOME_CONFIG = {
  win:  { label: 'You Win!',  color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
  lose: { label: 'You Lose', color: 'text-red-400',     bg: 'bg-red-500/20 border-red-500/40' },
  tie:  { label: 'Tie!',     color: 'text-yellow-300',  bg: 'bg-yellow-500/20 border-yellow-500/40' },
};

// ─── Streak display ───────────────────────────────────────────────────────────

function StreakDots({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={[
            'w-3 h-3 rounded-full border transition-all duration-300',
            i < current
              ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
              : 'bg-white/5 border-white/15',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ─── Choice button ────────────────────────────────────────────────────────────

interface ChoiceBtnProps {
  choice:    RPSChoice;
  selected:  boolean;
  revealed:  boolean;          // game over / revealing phase
  isHouse:   boolean;
  disabled:  boolean;
  onClick:   () => void;
}

function ChoiceBtn({ choice, selected, revealed, isHouse, disabled, onClick }: ChoiceBtnProps) {
  const isHighlighted = selected || (revealed && isHouse);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl border-2 transition-all duration-200 w-24',
        isHighlighted && selected  ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_14px_rgba(251,191,36,0.4)]' : '',
        isHighlighted && isHouse   ? 'border-blue-400  bg-blue-500/15  shadow-[0_0_14px_rgba(96,165,250,0.4)]'  : '',
        !isHighlighted             ? 'border-white/10  bg-white/5 hover:border-white/25 hover:bg-white/10'      : '',
        disabled && !isHighlighted ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className="text-3xl">{CHOICE_EMOJI[choice]}</span>
      <span className="text-xs text-white/60 font-medium">{CHOICE_LABEL[choice]}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RPSGameProps {
  initialBalance: number;
}

export default function RPSGame({ initialBalance }: RPSGameProps) {
  const rps = useRPS(initialBalance);
  const {
    phase, mode, betAmount: activeBet, winStreak, potentialPayout,
    lastOutcome, playerChoice, houseChoice, isGameOver, finalPayout,
    balance, error, config,
    canStartGame, canPick, canCashOut, isLoading,
    startGame, pickChoice, onRevealComplete, cashOut, reset,
  } = rps;

  const [selectedMode, setSelectedMode]   = useState<RPSMode>('single');
  const [betInput, setBetInput]           = useState(100);
  const [clientSeed, setClientSeed]       = useState('');
  const revealTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance after revealing outcome
  useEffect(() => {
    if (phase === 'revealing') {
      revealTimerRef.current = setTimeout(onRevealComplete, 1600);
    }
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [phase, onRevealComplete]);

  const handleStart = useCallback(() => {
    startGame(betInput, selectedMode, clientSeed || undefined);
  }, [startGame, betInput, selectedMode, clientSeed]);

  const handlePick = useCallback((choice: RPSChoice) => {
    if (!canPick) return;
    pickChoice(choice);
  }, [canPick, pickChoice]);

  const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
  const quickBets = [50, 100, 500, 1000, 2500];

  const showReveal = phase === 'revealing' || (phase === 'waiting_pick' && lastOutcome != null) || (canStartGame && isGameOver);

  return (
    <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center p-4 font-sans">

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-amber-400 tracking-widest uppercase">Rock Paper Scissors</h1>
        <p className="text-white/40 text-sm mt-1">Provably Fair · RTP 97%</p>
      </div>

      {/* Balance */}
      <div className="mb-4 bg-white/5 border border-white/10 rounded-xl px-6 py-2 text-center">
        <span className="text-white/50 text-xs uppercase tracking-widest">Balance</span>
        <p className="text-2xl font-bold text-amber-300">
          {balance != null ? `${balance.toLocaleString()} ETB` : '—'}
        </p>
      </div>

      {/* Main card */}
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-sm">

        {/* ── SETUP SCREEN ── */}
        {canStartGame && !isGameOver && (
          <>
            {/* Mode selector */}
            <div className="mb-4">
              <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Mode</label>
              <div className="flex gap-2">
                {(['single', 'chain'] as RPSMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMode(m)}
                    className={[
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize',
                      selectedMode === m
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20',
                    ].join(' ')}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {selectedMode === 'chain' && (
                <p className="text-white/35 text-xs mt-2 leading-relaxed">
                  Win up to {config?.maxChain ?? 7}× rounds in a row. Cash out anytime or lose it all.
                </p>
              )}
            </div>

            {/* Bet */}
            <div className="mb-3">
              <label className="text-white/40 text-xs uppercase tracking-widest block mb-1">Bet (ETB)</label>
              <input
                type="number"
                min={config?.minBet ?? 1}
                max={config?.maxBet ?? 5000}
                value={betInput}
                onChange={e => setBetInput(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <div className="flex gap-1.5 mb-4">
              {quickBets.map(b => (
                <button
                  key={b}
                  onClick={() => setBetInput(b)}
                  className={[
                    'flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium',
                    betInput === b
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20',
                  ].join(' ')}
                >
                  {b >= 1000 ? `${b / 1000}K` : b}
                </button>
              ))}
            </div>

            {/* Client seed */}
            <div className="mb-4">
              <label className="text-white/40 text-xs uppercase tracking-widest block mb-1">
                Client Seed <span className="normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={clientSeed}
                onChange={e => setClientSeed(e.target.value)}
                placeholder="Your custom seed…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Start */}
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-lg uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting…' : 'Play'}
            </button>
          </>
        )}

        {/* ── GAME OVER SCREEN ── */}
        {canStartGame && isGameOver && (
          <div className="text-center">
            <p className={`text-2xl font-bold mb-1 ${finalPayout > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {finalPayout > 0 ? `+${finalPayout.toLocaleString()} ETB` : 'Better luck next time!'}
            </p>
            {winStreak > 0 && (
              <p className="text-white/40 text-sm mb-4">{winStreak} win streak</p>
            )}
            <button
              onClick={reset}
              className="w-full py-3 rounded-xl font-bold text-lg uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition-all"
            >
              Play Again
            </button>
          </div>
        )}

        {/* ── ACTIVE GAME SCREEN ── */}
        {!canStartGame && !isGameOver && (
          <>
            {/* Chain streak header */}
            {mode === 'chain' && (
              <div className="mb-4 text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Win Streak</p>
                <StreakDots current={winStreak} max={config?.maxChain ?? 7} />
                {winStreak > 0 && (
                  <p className="text-amber-300 font-bold text-lg mt-2">
                    {config?.chainMultipliers[winStreak]?.toFixed(2) ?? '—'}× · {potentialPayout.toLocaleString()} ETB
                  </p>
                )}
              </div>
            )}

            {/* Last round reveal */}
            {showReveal && lastOutcome && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-center ${OUTCOME_CONFIG[lastOutcome].bg}`}>
                <p className={`font-bold text-lg ${OUTCOME_CONFIG[lastOutcome].color}`}>
                  {OUTCOME_CONFIG[lastOutcome].label}
                </p>
                {playerChoice && houseChoice && (
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="text-center">
                      <p className="text-white/40 text-xs">You</p>
                      <p className="text-2xl">{CHOICE_EMOJI[playerChoice]}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/40 text-xs">House</p>
                      <p className="text-2xl">{CHOICE_EMOJI[houseChoice]}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Choice buttons */}
            <div className="mb-5">
              <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-3">
                {phase === 'playing' || phase === 'revealing' ? 'Resolving…' : 'Your Pick'}
              </p>
              <div className="flex gap-2 justify-center">
                {choices.map(c => (
                  <ChoiceBtn
                    key={c}
                    choice={c}
                    selected={playerChoice === c}
                    revealed={phase === 'revealing'}
                    isHouse={houseChoice === c}
                    disabled={!canPick || isLoading}
                    onClick={() => handlePick(c)}
                  />
                ))}
              </div>
            </div>

            {/* Cash out (chain only) */}
            {mode === 'chain' && winStreak > 0 && (
              <button
                onClick={cashOut}
                disabled={!canCashOut || isLoading}
                className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-wider border-2 border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                💰 Cash Out {potentialPayout.toLocaleString()} ETB
              </button>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mt-3 flex justify-center">
                <svg className="animate-spin h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            )}
          </>
        )}

        {/* Error */}
        {phase === 'error' && error && (
          <div className="mt-3 bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-2 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={reset} className="text-red-300 text-xs underline mt-1">Dismiss</button>
          </div>
        )}
      </div>

      {/* Chain multiplier table */}
      {config && selectedMode === 'chain' && canStartGame && !isGameOver && (
        <div className="mt-6 w-full max-w-sm">
          <h2 className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Chain Multipliers</h2>
          <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
            {config.chainMultipliers.slice(1).map((mult, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-white/50 text-sm">
                  {'🏅'.repeat(Math.min(i + 1, 5))} {i + 1} win{i > 0 ? 's' : ''}
                  {i + 1 === config.maxChain ? ' 🏆 MAX' : ''}
                </span>
                <span className="text-amber-400 font-bold">{mult.toFixed(2)}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
