// components/rps/RPSArena.tsx
/**
 * DashBets — RPS Arena
 *
 * Shows the three pick buttons (rock / paper / scissors) and
 * animates the reveal: player choice | VS | house choice.
 *
 * Redesigned alongside Mines to share one visual language:
 *  - Emoji glyphs replaced by the shared line-icon set (rock/paper/
 *    scissors + trophy/loss/tie outcome icons)
 *  - Flatter chrome, hairline borders, calmer glow — reads like a real
 *    sportsbook mini-game instead of a chat mock-up
 *
 * States:
 *  - waiting_pick : glow on all three buttons, ready to pick
 *  - playing      : spinner, locked
 *  - revealing    : both choices shown side-by-side with outcome badge
 *  - idle (game over): frozen last result with outcome icon
 */

import React from 'react';
import type { RPSChoice, RPSOutcome } from '../../lib/api/rpsApi';
import type { RPSPhase } from '../../hooks/useRPS';
import { IconRock, IconPaper, IconScissors, IconTrophy, IconOutcomeLoss, IconOutcomeTie, IconLink } from '../icons/GameIcons';

interface RPSArenaProps {
  phase:         RPSPhase;
  playerChoice:  RPSChoice | null;
  houseChoice:   RPSChoice | null;
  lastOutcome:   RPSOutcome | null;
  winStreak:     number;
  mode:          'single' | 'chain';
  onPick:        (choice: RPSChoice) => void;
  onRevealComplete: () => void;
}

const CHOICES: { choice: RPSChoice; Icon: typeof IconRock; label: string; color: string }[] = [
  { choice: 'rock',     Icon: IconRock,     label: 'Rock',     color: '#6366f1' },
  { choice: 'paper',    Icon: IconPaper,    label: 'Paper',    color: '#06b6d4' },
  { choice: 'scissors', Icon: IconScissors, label: 'Scissors', color: '#8b5cf6' },
];

const OUTCOME_CONFIG: Record<RPSOutcome, { label: string; color: string; bg: string; Icon: typeof IconTrophy }> = {
  win:  { label: 'WIN',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  Icon: IconTrophy },
  lose: { label: 'LOSS', color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: IconOutcomeLoss },
  tie:  { label: 'TIE',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  Icon: IconOutcomeTie },
};

function ChoiceDisplay({ choice, label, isPlayer }: { choice: RPSChoice | null; label: string; isPlayer: boolean }) {
  const cfg = CHOICES.find(c => c.choice === choice);
  const Icon = cfg?.Icon;
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isPlayer ? '#a78bfa' : '#6b7280' }}>
        {label}
      </span>
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500"
        style={{
          background: cfg ? `${cfg.color}16` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${cfg ? cfg.color + '55' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: cfg ? `0 0 18px ${cfg.color}28` : 'none',
          transform: choice ? 'scale(1)' : 'scale(0.85)',
          opacity: choice ? 1 : 0.4,
        }}
      >
        {Icon ? <Icon size={34} strokeWidth={1.5} style={{ color: cfg!.color }} /> : <span className="text-2xl text-gray-600">?</span>}
      </div>
      <span className="text-xs font-bold capitalize" style={{ color: cfg ? '#e5e7eb' : '#374151' }}>
        {choice ? cfg?.label : '—'}
      </span>
    </div>
  );
}

export function RPSArena({
  phase, playerChoice, houseChoice, lastOutcome, winStreak, mode, onPick, onRevealComplete,
}: RPSArenaProps) {
  const canPick   = phase === 'waiting_pick';
  const revealing = phase === 'revealing';
  const spinning  = phase === 'playing' || phase === 'starting';

  return (
    <>
      <style>{`
        @keyframes choice-appear {
          0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes vs-pulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%     { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes streak-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
        }
        .choice-appear  { animation: choice-appear 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .vs-pulse       { animation: vs-pulse 1.4s ease-in-out infinite; }
        .streak-pop     { animation: streak-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        .arena-bg {
          background-color: #0b0c1a;
          background-image:
            radial-gradient(circle at 30% 40%, rgba(139,92,246,0.05) 0%, transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(99,102,241,0.035) 0%, transparent 60%);
        }
      `}</style>

      <div
        className="arena-bg rounded-2xl w-full overflow-hidden"
        style={{ border: '1px solid rgba(139,92,246,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <IconRock size={12} className="text-violet-500" /> RPS Arena
          </p>
          {mode === 'chain' && winStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full streak-pop"
              style={{ background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(139,92,246,0.40)' }}>
              <IconLink size={12} className="text-violet-400" />
              <span className="text-xs font-bold text-violet-400">{winStreak} streak</span>
            </div>
          )}
        </div>

        {/* Reveal zone */}
        {(revealing || (phase === 'idle' && playerChoice && houseChoice)) && (
          <div className="flex items-center justify-center gap-6 py-8 px-5">
            <ChoiceDisplay choice={playerChoice} label="You" isPlayer />
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest vs-pulse">VS</span>
              {lastOutcome && (
                <div
                  className="px-4 py-2 rounded-xl choice-appear flex items-center gap-1.5"
                  style={{
                    background: OUTCOME_CONFIG[lastOutcome].bg,
                    border: `1px solid ${OUTCOME_CONFIG[lastOutcome].color}45`,
                  }}
                >
                  {(() => {
                    const Icon = OUTCOME_CONFIG[lastOutcome].Icon;
                    return <Icon size={14} style={{ color: OUTCOME_CONFIG[lastOutcome].color }} />;
                  })()}
                  <p className="text-sm font-bold" style={{ color: OUTCOME_CONFIG[lastOutcome].color }}>
                    {OUTCOME_CONFIG[lastOutcome].label}
                  </p>
                </div>
              )}
            </div>
            <ChoiceDisplay choice={houseChoice} label="House" isPlayer={false} />
          </div>
        )}

        {/* Spinner */}
        {spinning && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-3"
              style={{ borderColor: 'rgba(139,92,246,0.18)', borderTopColor: '#8b5cf6' }} />
            <p className="text-xs font-semibold text-gray-500">Revealing outcome…</p>
          </div>
        )}

        {/* Pick buttons */}
        {(canPick || (!revealing && !spinning && !playerChoice)) && (
          <div className="px-5 py-6">
            {canPick && (
              <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Choose your move</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {CHOICES.map(({ choice, Icon, label, color }) => (
                <button
                  key={choice}
                  onClick={() => canPick && onPick(choice)}
                  disabled={!canPick}
                  className="flex flex-col items-center gap-2 py-5 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: canPick ? `${color}0f` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${canPick ? color + '38' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!canPick) return;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${color}35`;
                    (e.currentTarget as HTMLElement).style.borderColor = color + '70';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.borderColor = color + '38';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <Icon size={30} strokeWidth={1.4} style={{ color: canPick ? color : '#4b5563' }} />
                  <span className="text-xs font-bold" style={{ color: canPick ? '#d1d5db' : '#4b5563' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reveal: continue / reset prompt */}
        {revealing && (
          <div className="px-5 pb-6 flex justify-center">
            <button
              onClick={onRevealComplete}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(139,92,246,0.40)', color: '#c4b5fd' }}
            >
              {lastOutcome === 'win' && mode === 'chain' ? 'Next Round →' :
               lastOutcome === 'tie'                     ? 'Replay →' :
                                                           '→ Continue'}
            </button>
          </div>
        )}

        {/* No session */}
        {phase === 'idle' && !playerChoice && (
          <div className="flex flex-col items-center justify-center py-14 text-gray-600">
            <IconRock size={40} strokeWidth={1.3} className="mb-3 opacity-30" />
            <p className="text-sm">Set your bet and start a round!</p>
          </div>
        )}
      </div>
    </>
  );
}