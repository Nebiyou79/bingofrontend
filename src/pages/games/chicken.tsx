/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/games/chicken/index.tsx
/**
 * DashBets — Chicken Road Game Page
 * Mirrors mines/index.tsx structure exactly:
 *  - withAuth HOC + GamePageWrapper (themed loading screen + AppLayout)
 *  - useAuthContext for balance
 *  - refreshBalance after every game event
 *  - History table + provably fair verify modal
 *
 * Visual language matches Plinko: flat dark panels, hairline borders,
 * a single accent color doing the talking instead of stacked gradients.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { withAuth }         from '../../hoc/withAuth';
import { useAuthContext }   from '../../context/AuthContext';
import { GamePageWrapper }  from '../../components/games/GamePageWrapper';
import { getGameById }      from '../../config/gameConfig';
import { useChicken }       from '../../hooks/useChicken';
import { chickenApi }       from '../../lib/api/chickenApi';
import type { ChickenSession, Difficulty } from '../../lib/api/chickenApi';
import { ChickenBetPanel }  from '../../components/chicken/ChickenBetPanel';
import { ChickenRoad }      from '../../components/chicken/ChickenRoad';

const HIST_LIMIT = 10;

// ─── Design tokens — shared with Plinko ────────────────────────────────────────
const PAGE_BG   = '#0B0F14';
const HEADER_BG = '#0E1319';
const PANEL_BG  = '#141A21';
const PANEL_ALT = '#1B232C';
const BORDER    = 'rgba(255,255,255,0.07)';
const TEXT_FAINT = 'rgba(255,255,255,0.30)';
const TEXT_DIM   = 'rgba(255,255,255,0.52)';
const GREEN  = '#15D06A';
const RED    = '#E0495C';
const AMBER  = '#E8954B';

const DIFFICULTY_COLOR: Record<Difficulty, string> = { easy: GREEN, medium: AMBER, hard: RED };

// ── Small inline icons (no emoji-as-UI-symbols) ─────────────────────────────────
function ShieldIcon({ color = TEXT_FAINT, size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7L12 2z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckCircleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" opacity="0.4" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XCircleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" opacity="0.4" />
      <path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── History row ────────────────────────────────────────────────────────────────
function HistoryRow({ game, onVerify }: { game: ChickenSession; onVerify: (id: string) => void }) {
  const won  = game.status === 'won' || game.status === 'cashed_out';
  const date = new Date(game.createdAt ?? '').toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  const diffColor = DIFFICULTY_COLOR[game.difficulty];
  return (
    <tr className="transition-colors" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td className="py-2.5 px-3 text-xs font-mono" style={{ color: TEXT_FAINT }}>{date}</td>
      <td className="py-2.5 px-3 text-sm font-mono" style={{ color: TEXT_DIM }}>{game.betAmount.toLocaleString()} ETB</td>
      <td className="py-2.5 px-3 text-center text-sm">
        <span className="text-xs font-bold px-2 py-0.5 rounded-md capitalize"
          style={{ background: `${diffColor}1A`, border: `1px solid ${diffColor}40`, color: diffColor }}>
          {game.difficulty}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center text-sm" style={{ color: TEXT_DIM }}>{game.crossedLanes.length}/{game.laneCount}</td>
      <td className="py-2.5 px-3 text-right font-mono font-bold">
        <span style={{ color: won ? GREEN : RED }}>
          {won ? `+${game.payout.toLocaleString()}` : '0'} ETB
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-xs font-bold px-2 py-0.5 rounded-md"
          style={{
            background: won ? `${GREEN}1A` : `${RED}1A`,
            border: `1px solid ${won ? `${GREEN}40` : `${RED}40`}`,
            color: won ? GREEN : RED,
          }}>
          {won ? 'Won' : 'Lost'}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <button onClick={() => onVerify(game.sessionId)}
          className="text-xs font-semibold underline transition-colors"
          style={{ color: GREEN }}>
          Verify
        </button>
      </td>
    </tr>
  );
}

// ── Verify modal ───────────────────────────────────────────────────────────────
function VerifyModal({ sessionId, token, onClose }: { sessionId: string; token: string; onClose: () => void }) {
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  useEffect(() => {
    chickenApi.verify(token, sessionId).then(res => {
      if (res.success) setResult(res);
      else setErr((res as any).error);
      setLoading(false);
    });
  }, [sessionId, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="rounded-xl p-6 max-w-lg w-full"
        style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Provably Fair Verification</h3>
          <button onClick={onClose} className="text-lg" style={{ color: TEXT_DIM }}>✕</button>
        </div>
        {loading && <div className="text-center py-8 text-sm animate-pulse" style={{ color: TEXT_FAINT }}>Loading…</div>}
        {err     && <p className="text-sm" style={{ color: RED }}>{err}</p>}
        {result  && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold"
              style={{
                background: result.valid ? `${GREEN}1A` : `${RED}1A`,
                border: `1px solid ${result.valid ? `${GREEN}40` : `${RED}40`}`,
                color: result.valid ? GREEN : RED,
              }}>
              {result.valid ? <CheckCircleIcon color={GREEN} /> : <XCircleIcon color={RED} />}
              {result.valid ? 'Game Verified — Fair' : 'Verification Failed'}
            </div>
            {[
              { label: 'Server Seed Hash', value: result.serverSeedHash },
              { label: 'Server Seed',      value: result.serverSeed },
              { label: 'Client Seed',      value: result.clientSeed },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: TEXT_FAINT }}>{label}</p>
                <p className="font-mono text-xs rounded-lg px-3 py-2 break-all" style={{ background: PANEL_ALT, color: TEXT_DIM, border: `1px solid ${BORDER}` }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const ChickenPage: NextPage = () => {
  const game = getGameById('chicken-road')!; // matches gameConfig.ts id for Chicken Road
  const { loading: authLoading, user, token, checkAuth } = useAuthContext();
  const authReady = !authLoading;

  const refreshBalance = useCallback(async () => {
    try { await checkAuth(); } catch { /* non-fatal */ }
  }, [checkAuth]);

  const {
    session,
    loading,
    error,
    lastResult,
    start:   _start,
    reveal:  _reveal,
    cashout: _cashout,
    reset,
  } = useChicken({ token: token ?? '', onBalanceUpdate: refreshBalance });

  const [isShaking, setIsShaking] = useState(false);

  // Shake on loss
  useEffect(() => {
    if (lastResult?.outcome === 'lost') {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 700);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  const startGame = useCallback(async (betAmount: number, difficulty: Difficulty, laneCount: number) => {
    await _start(betAmount, difficulty, laneCount);
    await refreshBalance();
  }, [_start, refreshBalance]);

  const crossLane = useCallback(async () => {
    await _reveal();
    if (lastResult?.outcome !== 'lost') await refreshBalance();
  }, [_reveal, lastResult, refreshBalance]);

  const cashOut = useCallback(async () => {
    await _cashout();
    await refreshBalance();
  }, [_cashout, refreshBalance]);

  // History
  const [history,        setHistory]        = useState<ChickenSession[]>([]);
  const [histLoading,    setHistLoading]     = useState(false);
  const [histPage,       setHistPage]        = useState(1);
  const [histTotal,      setHistTotal]       = useState(0);
  const [histTotalPages, setHistTotalPages]  = useState(1);
  const [verifyId,       setVerifyId]        = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number) => {
    if (!token) return;
    setHistLoading(true);
    const res = await chickenApi.getHistory(token, page, HIST_LIMIT);
    if (res.success) {
      setHistory(res.sessions);
      setHistTotal(res.pagination.total);
      setHistTotalPages(res.pagination.totalPages);
      setHistPage(page);
    }
    setHistLoading(false);
  }, [token]);

  useEffect(() => { if (authReady && token) loadHistory(1); }, [authReady, token]);

  const userBalance = user?.balance ?? 0;
  const isDisabled  = loading || session?.status !== 'active';

  const statusColor = !session ? TEXT_DIM
    : session.status === 'active' ? GREEN
    : session.status === 'lost'   ? RED
    : AMBER;
  const statusLabel = session
    ? session.status === 'active' ? 'In progress'
    : session.status === 'lost'   ? 'Hit an obstacle'
    : 'Cashed out'
    : '';

  return (
    <GamePageWrapper game={game}>
      <div className="min-h-screen text-white overflow-x-hidden" style={{ background: PAGE_BG }}>
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-6 py-3 border-b" style={{ borderColor: BORDER, background: HEADER_BG }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight" style={{ color: GREEN }}>DashBets</span>
            <span className="text-white/15">/</span>
            <span className="text-base font-semibold text-white">Chicken Road</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg" style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }}>
              <span className="text-white/40 text-[11px] font-semibold">Balance</span>
              <span className="text-sm font-bold font-mono" style={{ color: GREEN }}>{userBalance.toLocaleString()} ETB</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: TEXT_FAINT }}>
              <ShieldIcon />
              Provably Fair
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

          {/* Subtitle row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }}>
              🐔
            </div>
            <p className="text-sm" style={{ color: TEXT_DIM }}>Cross the road, lane by lane, without hitting an obstacle.</p>
          </div>

          {/* Game status banner */}
          {session && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg"
              style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: statusColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                {statusLabel}
              </span>
              <span className="font-mono text-xs" style={{ color: TEXT_FAINT }}>{session.currentMultiplier.toFixed(2)}x</span>
            </div>
          )}

          {/* Main game widget — road + control bar share one border, reading as a single embedded game */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <ChickenRoad
              session={session}
              layout={lastResult?.layout}
              onCross={crossLane}
              disabled={isDisabled}
              isShaking={isShaking}
            />
            <ChickenBetPanel
              session={session}
              isLoading={loading || !authReady}
              error={error}
              userBalance={userBalance}
              onStart={startGame}
              onCashOut={cashOut}
            />
          </div>

          {/* New game button */}
          {session && session.status !== 'active' && (
            <div className="flex justify-center">
              <button onClick={reset}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: PANEL_ALT, border: `1px solid ${BORDER}`, color: TEXT_DIM }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = TEXT_DIM; }}
              >
                New game
              </button>
            </div>
          )}

          {/* Provably fair info */}
          <div className="rounded-xl p-5 flex items-start gap-3" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
            <ShieldIcon color={TEXT_DIM} size={16} />
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEXT_DIM }}>Provably Fair</h2>
              <p className="text-xs leading-relaxed" style={{ color: TEXT_FAINT }}>
                Each round uses HMAC-SHA256(serverSeed, clientSeed) to place obstacles in lanes before you pick.
                The server seed hash is committed before the round. After the round ends, the raw seed is revealed — verify the hash yourself.
                Click <strong style={{ color: TEXT_DIM }}>Verify</strong> on any finished game below.
              </p>
            </div>
          </div>

          {/* History */}
          <div className="rounded-xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>My Games</h2>
              <button onClick={() => loadHistory(histPage)} disabled={!authReady}
                className="text-xs font-semibold transition-colors disabled:opacity-30"
                style={{ color: GREEN }}>
                Refresh
              </button>
            </div>

            {(!authReady || histLoading) ? (
              <div className="p-8 text-center text-sm animate-pulse" style={{ color: TEXT_FAINT }}>Loading…</div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center" style={{ color: TEXT_FAINT }}>
                <p className="text-3xl mb-3 opacity-50">🐔</p>
                <p className="text-sm">No games yet. Start your first round above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Date', 'Bet', 'Difficulty', 'Lanes', 'Payout', 'Result', 'Fair'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: TEXT_FAINT }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(g => <HistoryRow key={g.sessionId} game={g} onVerify={setVerifyId} />)}
                  </tbody>
                </table>
              </div>
            )}

            {histTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="text-xs" style={{ color: TEXT_FAINT }}>Page {histPage} of {histTotalPages} · {histTotal} total</span>
                <div className="flex gap-2">
                  {[{ label: 'Prev', disabled: histPage <= 1, onClick: () => loadHistory(histPage - 1) },
                    { label: 'Next', disabled: histPage >= histTotalPages, onClick: () => loadHistory(histPage + 1) }].map(btn => (
                    <button key={btn.label} disabled={btn.disabled} onClick={btn.onClick}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-25"
                      style={{ background: PANEL_ALT, border: `1px solid ${BORDER}`, color: TEXT_DIM }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      {verifyId && token && <VerifyModal sessionId={verifyId} token={token} onClose={() => setVerifyId(null)} />}
    </GamePageWrapper>
  );
};

export default withAuth(ChickenPage);