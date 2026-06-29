// pages/games/mines/index.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { NextPage } from 'next';
import { withAuth } from '../../../hoc/withAuth';
import { useAuthContext } from '../../../context/AuthContext';
import { AppLayout } from '../../../components/layout/AppLayout';
import { useMinesGame } from '../../../hooks/useMinesGame';
import {
  getHistory,
  verifyGame,
  MinesGameState,
} from '../../../lib/api/minesApi';
import { MinesGrid }       from '../../../components/mines/MinesGrid';
import { MinesBetPanel }   from '../../../components/mines/MinesBetPanel';
import { MultiplierTable } from '../../../components/mines/MultiplierTable';
import { IconBomb, IconGem, IconLock, IconTrophy, IconBolt, IconCheck, IconOutcomeLoss } from '../../../components/icons/GameIcons';

const HIST_LIMIT = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function HistoryRow({
  game,
  onVerify,
}: {
  game:     MinesGameState;
  onVerify: (id: string) => void;
}) {
  const won  = game.status === 'won';
  const date = new Date(game.createdAt).toLocaleString('en-ET', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  
  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <td className="py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-mono whitespace-nowrap" style={{ color: '#4b5563' }}>{date}</td>
      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm font-mono whitespace-nowrap" style={{ color: '#9ca3af' }}>
        {game.betAmount.toLocaleString()}
      </td>
      <td className="py-2 px-2 sm:px-3 text-center text-xs sm:text-sm text-red-400">
        <span className="flex items-center justify-center gap-1">
          <IconBomb size={12} /> {game.mineCount}
        </span>
      </td>
      <td className="py-2 px-2 sm:px-3 text-center text-xs sm:text-sm text-blue-400">
        <span className="flex items-center justify-center gap-1">
          <IconGem size={12} /> {game.revealedTiles.length}
        </span>
      </td>
      <td className="py-2 px-2 sm:px-3 text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
        <span className={won ? 'text-emerald-400' : 'text-red-400'}>
          {won ? `+${game.payout.toLocaleString()}` : '0'} ETB
        </span>
      </td>
      <td className="py-2 px-2 sm:px-3 text-center">
        <span
          className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: won ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${won ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
            color:  won ? '#34d399' : '#f87171',
          }}
        >
          {won ? 'Won' : 'Lost'}
        </span>
      </td>
      <td className="py-2 px-2 sm:px-3 text-center">
        <button
          onClick={() => onVerify(game._id)}
          className="text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 underline transition-colors"
        >
          Verify
        </button>
      </td>
    </tr>
  );
}

function VerifyModal({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  const [result, setResult] = useState<{
    verified: boolean; serverSeed: string; clientSeed: string;
    minePositions: number[]; serverSeedHash: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  useEffect(() => {
    verifyGame(gameId).then(res => {
      if (res.success) {
        setResult({
          verified:      res.verified,
          serverSeed:    res.game.serverSeed,
          clientSeed:    res.game.clientSeed,
          minePositions: res.game.minePositions,
          serverSeedHash: res.game.serverSeedHash,
        });
      } else {
        setErr(res.error);
      }
      setLoading(false);
    });
  }, [gameId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl mx-2"
        style={{ background: '#13152a', border: '1px solid rgba(108,99,255,0.30)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white">Provably Fair Verification</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg sm:text-xl p-1">✕</button>
        </div>
        {loading && <div className="text-center py-8 text-gray-500 animate-pulse text-sm">Loading…</div>}
        {err     && <p className="text-red-400 text-xs sm:text-sm">{err}</p>}
        {result  && (
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm"
              style={{
                background: result.verified ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${result.verified ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
                color:  result.verified ? '#34d399' : '#f87171',
              }}
            >
              {result.verified
                ? <><IconCheck size={14} /> Game Verified — Fair</>
                : <><IconOutcomeLoss size={14} /> Verification Failed</>}
            </div>
            {[
              { label: 'Server Seed Hash', value: result.serverSeedHash },
              { label: 'Server Seed',      value: result.serverSeed },
              { label: 'Client Seed',      value: result.clientSeed },
              { label: 'Mine Positions',   value: result.minePositions.join(', ') },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
                <p
                  className="font-mono text-[10px] sm:text-xs text-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 break-all"
                  style={{ background: 'rgba(0,0,0,0.35)' }}
                >
                  {value}
                </p>
              </div>
            ))}
            <p className="text-[8px] sm:text-[10px] text-gray-700 pt-1">
              HMAC-SHA256(serverSeed, clientSeed) → Fisher-Yates mine placement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const MinesPage: NextPage = () => {
  const { loading: authLoading, user, checkAuth } = useAuthContext();
  const authReady = !authLoading;

  const refreshBalance = useCallback(async () => {
    try {
      await checkAuth();
    } catch {
      // Non-fatal
    }
  }, [checkAuth]);

  const {
    gameState,
    tileStates,
    isLoading,
    isRevealing,
    error,
    potentialPayout,
    canCashOut,
    startGame:    _startGame,
    revealTile:   _revealTile,
    cashOut:      _cashOut,
    resetGame,
  } = useMinesGame(authReady);

  const startGame = useCallback(async (
    betAmount:   number,
    mineCount:   number,
    clientSeed?: string,
  ) => {
    await _startGame(betAmount, mineCount, clientSeed);
    await refreshBalance();
  }, [_startGame, refreshBalance]);

  const prevGameStatus = useRef<string | null>(null);
  const revealTile = useCallback(async (tileIndex: number) => {
    await _revealTile(tileIndex);
  }, [_revealTile]);

  const cashOut = useCallback(async () => {
    await _cashOut();
    await refreshBalance();
  }, [_cashOut, refreshBalance]);

  useEffect(() => {
    if (gameState?.status === 'lost' && prevGameStatus.current === 'active') {
      refreshBalance();
    }
    prevGameStatus.current = gameState?.status ?? null;
  }, [gameState?.status, refreshBalance]);

  const [tileMultipliers, setTileMultipliers] = useState<Record<number, number>>({});
  const prevRevealedRef = useRef<number[]>([]);

  useEffect(() => {
    if (!gameState) { setTileMultipliers({}); prevRevealedRef.current = []; return; }
    const prev    = new Set(prevRevealedRef.current);
    const current = gameState.revealedTiles;
    const newTiles = current.filter(t => !prev.has(t));
    if (newTiles.length > 0) {
      setTileMultipliers(old => {
        const next = { ...old };
        newTiles.forEach(t => { next[t] = gameState.currentMultiplier; });
        return next;
      });
    }
    prevRevealedRef.current = current;
  }, [gameState?.revealedTiles, gameState?.currentMultiplier]);

  useEffect(() => {
    if (!gameState) { setTileMultipliers({}); prevRevealedRef.current = []; }
  }, [gameState]);

  const [isShaking, setIsShaking] = useState(false);
  const shakeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeStatus = useRef<string | null>(null);

  useEffect(() => {
    if (gameState?.status === 'lost' && shakeStatus.current === 'active') {
      setIsShaking(true);
      shakeTimer.current = setTimeout(() => setIsShaking(false), 500);
    }
    shakeStatus.current = gameState?.status ?? null;
    return () => { if (shakeTimer.current) clearTimeout(shakeTimer.current); };
  }, [gameState?.status]);

  const [history,     setHistory]     = useState<MinesGameState[]>([]);
  const [histPage,    setHistPage]    = useState(1);
  const [histTotal,   setHistTotal]   = useState(0);
  const [histLoading, setHistLoading] = useState(false);

  const loadHistory = useCallback(async (page: number) => {
    setHistLoading(true);
    try {
      const res = await getHistory(page, HIST_LIMIT);
      if (res.success) {
        setHistory(res.games);
        setHistTotal(res.pagination.total);
        setHistPage(page);
      }
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { if (!authReady) return; loadHistory(1); }, [authReady, loadHistory]);
  useEffect(() => {
    if (!authReady) return;
    if (gameState?.status === 'won' || gameState?.status === 'lost') loadHistory(1);
  }, [authReady, gameState?.status, loadHistory]);

  const [verifyId, setVerifyId] = useState<string | null>(null);

  const mineCount      = gameState?.mineCount            ?? 3;
  const currentReveals = gameState?.revealedTiles.length ?? 0;
  const betAmount      = gameState?.betAmount            ?? 100;
  const disabled =
    !authReady || isLoading || isRevealing ||
    (!!gameState && gameState.status !== 'active');

  const histTotalPages = Math.ceil(histTotal / HIST_LIMIT);

  const userBalance = user?.balance ?? 0;
  const todayProfit = history
    .filter(g => new Date(g.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, g) =>
      sum + (g.status === 'won' ? g.payout - g.betAmount : -g.betAmount), 0);
  const lastWin = history.find(g => g.status === 'won')?.payout ?? 0;

  return (
    <AppLayout title="Mines">
      <div
        className="min-h-full relative"
        style={{ background: '#080a12', color: '#f0f0f8', fontFamily: "'Exo 2', sans-serif" }}
      >
        {/* Circuit board ambient background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            zIndex: 0,
          }}
        />
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-0 left-1/3 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-700/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-700/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6" style={{ zIndex: 1 }}>

          {/* ── Page header ── */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <IconBomb size={22} className="sm:w-[28px] sm:h-[28px] text-orange-400" />
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '2px' }}
              >
                MINES
              </h1>
            </div>
            <p className="text-xs sm:text-sm" style={{ color: '#6b7280' }}>
              Reveal gems, avoid mines. Cash out before you blow up.
            </p>
          </div>

          {/* ── Main grid ── */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 mb-6 sm:mb-8">

            {/* LEFT: grid */}
            <div className="flex flex-col items-center gap-3 sm:gap-4 order-1 lg:order-none">

              {/* Status bar */}
              {gameState && (
                <div className="w-full max-w-[350px] sm:max-w-[420px] md:max-w-[520px]">
                  <div
                    className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold"
                    style={{
                      background: gameState.status === 'active'
                        ? 'rgba(108,99,255,0.12)'
                        : gameState.status === 'won'
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${
                        gameState.status === 'active' ? 'rgba(108,99,255,0.30)'
                        : gameState.status === 'won'  ? 'rgba(16,185,129,0.30)'
                        : 'rgba(239,68,68,0.30)'
                      }`,
                      color: gameState.status === 'active' ? '#a5b4fc'
                        : gameState.status === 'won' ? '#34d399'
                        : '#f87171',
                    }}
                  >
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      {gameState.status === 'active' && <><IconBolt size={12} className="sm:w-[14px] sm:h-[14px]" /> In Progress</>}
                      {gameState.status === 'won'    && <><IconTrophy size={12} className="sm:w-[14px] sm:h-[14px]" /> Cashed Out</>}
                      {gameState.status === 'lost'   && <><IconBomb size={12} className="sm:w-[14px] sm:h-[14px]" /> Mine Hit!</>}
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs">
                      {gameState.currentMultiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              )}

              {/* Grid skeleton while auth hydrates */}
              {(!authReady || isLoading) && !gameState ? (
                <div
                  className="rounded-xl sm:rounded-2xl p-3 sm:p-4 w-full max-w-[350px] sm:max-w-[420px] md:max-w-[520px]"
                  style={{ background: '#0e1020', border: '2px solid rgba(59,130,246,0.15)' }}
                >
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-lg sm:rounded-2xl animate-pulse"
                        style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)' }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <MinesGrid
                  tileStates={tileStates}
                  revealedTiles={gameState?.revealedTiles ?? []}
                  tileMultipliers={tileMultipliers}
                  onTileClick={revealTile}
                  disabled={disabled}
                  isShaking={isShaking}
                />
              )}

              {/* New game button */}
              {gameState && gameState.status !== 'active' && (
                <button
                  onClick={resetGame}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all hover:text-white active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#9ca3af',
                  }}
                >
                  ↺ New Game
                </button>
              )}
            </div>

            {/* RIGHT: bet panel + payout table - Stack on mobile, side on desktop */}
            <div className="flex flex-col gap-3 sm:gap-4 order-2 lg:order-none">
              {/* Mobile: Show bet panel first */}
              <div className="lg:hidden">
                <MinesBetPanel
                  gameState={gameState}
                  potentialPayout={potentialPayout}
                  canCashOut={canCashOut}
                  isLoading={isLoading || !authReady}
                  isRevealing={isRevealing}
                  error={error}
                  userBalance={userBalance}
                  todayProfit={todayProfit}
                  lastWin={lastWin}
                  onStart={startGame}
                  onCashOut={cashOut}
                />
              </div>
              
              {/* Desktop bet panel */}
              <div className="hidden lg:block">
                <MinesBetPanel
                  gameState={gameState}
                  potentialPayout={potentialPayout}
                  canCashOut={canCashOut}
                  isLoading={isLoading || !authReady}
                  isRevealing={isRevealing}
                  error={error}
                  userBalance={userBalance}
                  todayProfit={todayProfit}
                  lastWin={lastWin}
                  onStart={startGame}
                  onCashOut={cashOut}
                />
              </div>
              
              <MultiplierTable
                mineCount={mineCount}
                betAmount={betAmount}
                currentReveals={currentReveals}
              />
            </div>
          </div>

          {/* ── Provably fair info ── */}
          <div
            className="rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <h2 className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
              <IconLock size={10} className="sm:w-[12px] sm:h-[12px]" /> Provably Fair
            </h2>
            <p className="text-[10px] sm:text-xs leading-relaxed" style={{ color: '#4b5563' }}>
              Each game uses HMAC-SHA256(serverSeed, clientSeed) to deterministically place mines.
              The server publishes the SHA-256 hash of the server seed before the game starts.
              After the game ends the raw seed is revealed — verify the hash yourself to confirm no manipulation.
              Click <strong className="text-gray-500">Verify</strong> on any finished game below.
            </p>
          </div>

          {/* ── Game history ── */}
          <div
            className="rounded-xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <h2 className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                My Games
              </h2>
              <button
                onClick={() => loadHistory(histPage)}
                disabled={!authReady}
                className="text-[10px] sm:text-xs text-purple-500 hover:text-purple-400 transition-colors disabled:opacity-30"
              >
                ↻ Refresh
              </button>
            </div>

            {(!authReady || histLoading) ? (
              <div className="p-6 sm:p-8 text-center text-gray-700 text-xs sm:text-sm animate-pulse">Loading…</div>
            ) : history.length === 0 ? (
              <div className="p-8 sm:p-10 text-center" style={{ color: '#374151' }}>
                <IconBomb size={28} className="sm:w-[36px] sm:h-[36px] mx-auto mb-2 sm:mb-3 opacity-40" />
                <p className="text-xs sm:text-sm">No games yet. Start your first round above!</p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="block sm:hidden">
                  {history.map(g => (
                    <div
                      key={g._id}
                      className="p-3 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono" style={{ color: '#4b5563' }}>
                          {new Date(g.createdAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: g.status === 'won' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            border: `1px solid ${g.status === 'won' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
                            color: g.status === 'won' ? '#34d399' : '#f87171',
                          }}
                        >
                          {g.status === 'won' ? 'Won' : 'Lost'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span style={{ color: '#9ca3af' }}>Bet: {g.betAmount.toLocaleString()} ETB</span>
                        <span className="font-bold" style={{ color: g.status === 'won' ? '#34d399' : '#f87171' }}>
                          {g.status === 'won' ? `+${g.payout.toLocaleString()}` : '0'} ETB
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3 text-[10px]">
                          <span className="text-red-400 flex items-center gap-1">
                            <IconBomb size={10} />{g.mineCount}
                          </span>
                          <span className="text-blue-400 flex items-center gap-1">
                            <IconGem size={10} />{g.revealedTiles.length}
                          </span>
                        </div>
                        <button
                          onClick={() => setVerifyId(g._id)}
                          className="text-[10px] text-purple-400 underline"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Date', 'Bet', 'Mines', 'Gems', 'Payout', 'Result', 'Fair'].map(h => (
                          <th
                            key={h}
                            className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider"
                            style={{ color: '#374151' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(g => (
                        <HistoryRow key={g._id} game={g} onVerify={setVerifyId} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {histTotalPages > 1 && (
              <div
                className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-[10px] sm:text-xs" style={{ color: '#374151' }}>
                  Page {histPage} of {histTotalPages} · {histTotal} total
                </span>
                <div className="flex gap-1.5 sm:gap-2">
                  {[
                    { label: '←', disabled: histPage <= 1,             onClick: () => loadHistory(histPage - 1) },
                    { label: '→', disabled: histPage >= histTotalPages, onClick: () => loadHistory(histPage + 1) },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      disabled={btn.disabled}
                      onClick={btn.onClick}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-25 active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: '#9ca3af',
                      }}
                    >
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
    </AppLayout>
  );
};

export default withAuth(MinesPage);