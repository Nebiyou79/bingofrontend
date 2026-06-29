/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/games/rps/index.tsx
/**
 * DashBets — Rock Paper Scissors Game Page
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { withAuth }         from '../../hoc/withAuth';
import { useAuthContext }   from '../../context/AuthContext';
import { useRPS }           from '../../hooks/useRPS';
import { getRPSHistory, verifyRPSGame } from '../../lib/api/rpsApi';
import type { RPSGame, RPSMode, RPSChoice } from '../../lib/api/rpsApi';
import { RPSBetPanel }      from '../../components/rps/RPSBetPanel';
import { RPSArena }         from '../../components/rps/RPSArena';
import {
  IconRock, IconPaper, IconScissors, IconLink, IconLock,
  IconTrophy, IconOutcomeTie, IconOutcomeLoss,
} from '../../components/icons/GameIcons';
import { GamePageWrapper } from '@/components/games/GamePageWrapper';
import { getGameById } from '@/config/gameConfig';

const HIST_LIMIT = 10;

const CHOICE_ICON: Record<RPSChoice, typeof IconRock> = { rock: IconRock, paper: IconPaper, scissors: IconScissors };

function ChoiceGlyph({ choice, size = 13 }: { choice: RPSChoice; size?: number }) {
  const Icon = CHOICE_ICON[choice];
  return <Icon size={size} className="inline-block" />;
}

// ── History row ────────────────────────────────────────────────────────────────
function HistoryRow({ game, onVerify }: { game: RPSGame; onVerify: (id: string) => void }) {
  const won  = game.isWin;
  const date = new Date(game.createdAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  const lastRound = game.rounds[game.rounds.length - 1];
  return (
    <tr className="border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <td className="py-2.5 px-3 text-xs font-mono" style={{ color: '#4b5563' }}>{date}</td>
      <td className="py-2.5 px-3 text-sm font-mono" style={{ color: '#9ca3af' }}>{game.betAmount.toLocaleString()} ETB</td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
          style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}>
          {game.mode}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center text-sm text-violet-400">
        {lastRound
          ? <span className="inline-flex items-center gap-1">
              <ChoiceGlyph choice={lastRound.playerChoice} /> vs <ChoiceGlyph choice={lastRound.houseChoice} />
            </span>
          : '—'}
      </td>
      <td className="py-2.5 px-3 text-center text-xs text-gray-500">
        {game.winStreak > 0
          ? <span className="inline-flex items-center gap-1"><IconLink size={11} /> {game.winStreak}</span>
          : '—'}
      </td>
      <td className="py-2.5 px-3 text-right font-mono font-bold">
        <span className={won ? 'text-violet-400' : 'text-red-400'}>
          {won ? `+${game.finalPayout.toLocaleString()}` : '0'} ETB
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: won ? 'rgba(139,92,246,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${won ? 'rgba(139,92,246,0.30)' : 'rgba(239,68,68,0.30)'}`,
            color: won ? '#c4b5fd' : '#f87171',
          }}>
          {won ? 'Won' : game.status === 'tied' ? 'Tied' : 'Lost'}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <button onClick={() => onVerify(game._id)}
          className="text-xs text-violet-400 hover:text-violet-300 underline transition-colors">
          Verify
        </button>
      </td>
    </tr>
  );
}

// ── Verify modal ───────────────────────────────────────────────────────────────
function VerifyModal({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  useEffect(() => {
    verifyRPSGame(gameId)
      .then(res => { setResult(res); setLoading(false); })
      .catch(e  => { setErr(e.message); setLoading(false); });
  }, [gameId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[80vh]"
        style={{ background: '#0d0d1f', border: '1px solid rgba(139,92,246,0.30)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Provably Fair Verification</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">✕</button>
        </div>
        {loading && <div className="text-center py-8 text-gray-500 animate-pulse">Loading…</div>}
        {err     && <p className="text-red-400 text-sm">{err}</p>}
        {result  && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold"
              style={{
                background: result.allVerified ? 'rgba(139,92,246,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${result.allVerified ? 'rgba(139,92,246,0.30)' : 'rgba(239,68,68,0.30)'}`,
                color: result.allVerified ? '#c4b5fd' : '#f87171',
              }}>
              {result.allVerified
                ? <><IconLink size={16} /> All Rounds Verified — Fair</>
                : <><IconOutcomeLoss size={16} /> Verification Failed</>}
            </div>
            {[
              { label: 'Server Seed Hash', value: result.serverSeedHash },
              { label: 'Server Seed',      value: result.serverSeed },
              { label: 'Client Seed',      value: result.clientSeed },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
                <p className="font-mono text-xs text-gray-300 rounded-lg px-3 py-2 break-all" style={{ background: 'rgba(0,0,0,0.35)' }}>
                  {value}
                </p>
              </div>
            ))}
            {result.rounds?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Rounds</p>
                {result.rounds.map((r: any) => (
                  <div key={r.roundNumber}
                    className="flex items-center justify-between py-1.5 text-xs border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-gray-600">Round {r.roundNumber}</span>
                    <span className="font-mono inline-flex items-center gap-1">
                      <ChoiceGlyph choice={r.playerChoice as RPSChoice} /> vs <ChoiceGlyph choice={r.derivedHouse as RPSChoice} />
                    </span>
                    <span className={r.verified ? 'text-emerald-400' : 'text-red-400'}>
                      {r.verified ? <IconCheck size={14} /> : <IconOutcomeLoss size={14} />}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const RPSPage: NextPage = () => {
  const game = getGameById('rps')!; // matches gameConfig.ts id for Rock Paper Scissors
  const { loading: authLoading, user } = useAuthContext();
  const authReady = !authLoading;

  const userBalance = user?.balance ?? 0;

  const {
    phase, mode, gameId, winStreak, potentialPayout, betAmount,
    lastRound, lastOutcome, playerChoice, houseChoice,
    isGameOver, finalPayout, balance, error, config,
    startGame: _startGame, pickChoice, onRevealComplete,
    cashOut, reset, canStartGame, canCashOut, isLoading,
    serverSeedHash, clientSeed,
  } = useRPS(userBalance);

  const [history,        setHistory]       = useState<RPSGame[]>([]);
  const [histLoading,    setHistLoading]    = useState(false);
  const [histPage,       setHistPage]       = useState(1);
  const [histTotal,      setHistTotal]      = useState(0);
  const [histTotalPages, setHistTotalPages] = useState(1);
  const [verifyId,       setVerifyId]       = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number) => {
    setHistLoading(true);
    try {
      const res = await getRPSHistory(page, HIST_LIMIT);
      setHistory(res.games);
      setHistTotal(res.pagination.total);
      setHistTotalPages(res.pagination.pages);
      setHistPage(page);
    } catch { /* non-fatal */ }
    setHistLoading(false);
  }, []);

  useEffect(() => { if (authReady) loadHistory(1); }, [authReady]);

  const startGame = useCallback(async (betAmount: number, m: RPSMode, cs?: string) => {
    await _startGame(betAmount, m, cs);
  }, [_startGame]);

  const rpsState = {
    phase, mode, gameId, betAmount, serverSeedHash, clientSeed,
    winStreak, potentialPayout, lastRound, lastOutcome,
    playerChoice, houseChoice, isGameOver, finalPayout,
    balance: balance ?? userBalance,
    error, config,
  };

  return (
    <GamePageWrapper game={game}>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #060612 0%, #08081a 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)' }}>
              <IconRock size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Rock Paper Scissors</h1>
              <p className="text-xs text-gray-600">Single round or chain up to 102x</p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.20)' }}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Balance</span>
              <span className="text-sm font-black text-white font-mono">{(balance ?? userBalance).toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Main layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

            {/* LEFT: arena */}
            <div className="flex flex-col gap-4">
              {isGameOver && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${lastOutcome === 'win' ? 'rgba(139,92,246,0.30)' : lastOutcome === 'tie' ? 'rgba(251,191,36,0.30)' : 'rgba(239,68,68,0.30)'}`,
                  }}>
                  <span className="text-sm font-bold flex items-center gap-1.5"
                    style={{ color: lastOutcome === 'win' ? '#c4b5fd' : lastOutcome === 'tie' ? '#fbbf24' : '#f87171' }}>
                    {lastOutcome === 'win' ? <><IconTrophy size={15} /> Game Over — You Won!</> :
                     lastOutcome === 'tie' ? <><IconOutcomeTie size={15} /> Game Over — Tied</> :
                                             <><IconOutcomeLoss size={15} /> Game Over — You Lost</>}
                  </span>
                  {finalPayout > 0 && (
                    <span className="font-mono text-xs text-gray-400">+{finalPayout.toLocaleString()} ETB</span>
                  )}
                </div>
              )}

              <RPSArena
                phase={phase}
                playerChoice={playerChoice}
                houseChoice={houseChoice}
                lastOutcome={lastOutcome}
                winStreak={winStreak}
                mode={mode}
                onPick={pickChoice}
                onRevealComplete={() => { onRevealComplete(); if (isGameOver) { loadHistory(1); } }}
              />

              {isGameOver && (
                <button onClick={reset}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:text-white self-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#9ca3af' }}>
                  ↺ New Game
                </button>
              )}
            </div>

            {/* RIGHT: bet panel */}
            <div>
              <RPSBetPanel
                state={rpsState as any}
                userBalance={balance ?? userBalance}
                onStart={startGame}
                onCashOut={cashOut}
                canStartGame={canStartGame}
                canCashOut={canCashOut}
                isLoading={isLoading || !authReady}
              />
            </div>
          </div>

          {/* Provably fair */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <IconLock size={12} /> Provably Fair
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>
              House choices are derived from HMAC-SHA256(serverSeed, clientSeed + &quot;:&ldquo; + nonce) before you pick.
              The server seed hash is committed before each round. After the game, the raw seed is revealed.
              Click <strong className="text-gray-500">Verify</strong> on any game below.
            </p>
          </div>

          {/* History */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">My Games</h2>
              <button onClick={() => loadHistory(histPage)} disabled={!authReady}
                className="text-xs text-violet-500 hover:text-violet-400 transition-colors disabled:opacity-30">
                ↻ Refresh
              </button>
            </div>

            {(!authReady || histLoading) ? (
              <div className="p-8 text-center text-gray-700 text-sm animate-pulse">Loading…</div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center" style={{ color: '#374151' }}>
                <IconRock size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No games yet. Throw your first round!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Date', 'Bet', 'Mode', 'Last Round', 'Streak', 'Payout', 'Result', 'Fair'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider" style={{ color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(g => <HistoryRow key={g._id} game={g} onVerify={setVerifyId} />)}
                  </tbody>
                </table>
              </div>
            )}

            {histTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs" style={{ color: '#374151' }}>Page {histPage} of {histTotalPages} · {histTotal} total</span>
                <div className="flex gap-2">
                  {[{ label: '← Prev', disabled: histPage <= 1, onClick: () => loadHistory(histPage - 1) },
                    { label: 'Next →', disabled: histPage >= histTotalPages, onClick: () => loadHistory(histPage + 1) }].map(btn => (
                    <button key={btn.label} disabled={btn.disabled} onClick={btn.onClick}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-25"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9ca3af' }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      {verifyId && <VerifyModal gameId={verifyId} onClose={() => setVerifyId(null)} />}
    </GamePageWrapper>
  );
};

export default withAuth(RPSPage);