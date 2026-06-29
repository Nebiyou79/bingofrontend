/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/games/dragon-tower/index.tsx
/**
 * DashBets — Dragon Tower Game Page
 * FIX: HistoryRow key now uses game._id (ObjectId string from MongoDB) with
 *      sessionId as a fallback, resolving the "unique key" React warning.
 *      The publicSession() helper maps session._id → sessionId, but lean()
 *      queries return the raw document so _id may be an ObjectId. We coerce
 *      both to string for safety.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { withAuth }              from '../../hoc/withAuth';
import { useAuthContext }        from '../../context/AuthContext';
import { GamePageWrapper }       from '../../components/games/GamePageWrapper';
import { getGameById }           from '../../config/gameConfig';
import { useDragonTower }        from '../../hooks/useDragonTower';
import { dragonTowerApi }        from '../../lib/api/dragonTowerApi';
import type { DragonTowerSession, Difficulty } from '../../lib/api/dragonTowerApi';
import { DragonTowerBetPanel }   from '../../components/DragonTower/DragonTowerBetPanel';
import { DragonTowerGrid }       from '../../components/DragonTower/DragonTowerGrid';

const HIST_LIMIT = 10;

/** Safely extract a string key from a history session.
 *  publicSession() sets sessionId = session._id (ObjectId).
 *  The history endpoint uses .lean() so the field may come back as an
 *  ObjectId object — String() handles both cases. */
function sessionKey(game: DragonTowerSession): string {
  return String((game as any)._id ?? game.sessionId ?? Math.random());
}

// ── Difficulty badge ────────────────────────────────────────────────────────
function DifficultyBadge({ d }: { d: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    easy:   { bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)',  text: '#34d399' },
    medium: { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)',  text: '#fbbf24' },
    hard:   { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)', text: '#f87171' },
  };
  const c = colors[d] ?? colors.medium;
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '2px 8px',
      borderRadius: '20px', textTransform: 'capitalize',
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>{d}</span>
  );
}

// ── History row ─────────────────────────────────────────────────────────────
function HistoryRow({ game, onVerify }: { game: DragonTowerSession; onVerify: (id: string) => void }) {
  const won  = game.status === 'won' || game.status === 'cashed_out';
  const date = new Date(game.createdAt ?? '').toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  const sid  = String((game as any)._id ?? game.sessionId ?? '');

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'monospace', color: '#4b5563' }}>{date}</td>
      <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af' }}>
        {game.betAmount.toLocaleString()} ETB
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
        <DifficultyBadge d={game.difficulty} />
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
        🏰 {game.revealedRows.length}/{game.rows}
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}>
        <span style={{ color: won ? '#fbbf24' : '#f87171' }}>
          {won ? `+${game.payout.toLocaleString()}` : '0'} ETB
        </span>
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
          background: won ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)',
          border: `1px solid ${won ? 'rgba(245,158,11,0.28)' : 'rgba(239,68,68,0.28)'}`,
          color: won ? '#fbbf24' : '#f87171',
        }}>
          {won ? 'Won' : 'Lost'}
        </span>
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
        {sid && (
          <button
            onClick={() => onVerify(sid)}
            style={{
              fontSize: '11px', color: '#f59e0b', background: 'none',
              border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0,
            }}
          >
            Verify
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Verify modal ─────────────────────────────────────────────────────────────
function VerifyModal({ sessionId, token, onClose }: { sessionId: string; token: string; onClose: () => void }) {
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  useEffect(() => {
    dragonTowerApi.verify(token, sessionId).then(res => {
      if (res.success) setResult(res);
      else             setErr((res as any).error);
      setLoading(false);
    });
  }, [sessionId, token]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        style={{ borderRadius: '20px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.80)', background: '#0d0d09', border: '1px solid rgba(255,255,255,0.10)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#f3f4f6', fontWeight: 800, fontSize: '16px', margin: 0 }}>🔒 Provably Fair</h3>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563', fontSize: '13px' }}>Verifying…</div>}
        {err     && <p style={{ color: '#f87171', fontSize: '13px' }}>{err}</p>}
        {result  && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
              background: result.valid ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${result.valid ? 'rgba(52,211,153,0.30)' : 'rgba(239,68,68,0.30)'}`,
              color: result.valid ? '#34d399' : '#f87171',
            }}>
              {result.valid ? '✓ Verified — Game was fair' : '✗ Verification failed'}
            </div>
            {[
              { label: 'Server Seed Hash', value: result.serverSeedHash },
              { label: 'Server Seed',      value: result.serverSeed },
              { label: 'Client Seed',      value: result.clientSeed },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '6px' }}>{label}</p>
                <p style={{
                  fontFamily: 'monospace', fontSize: '11px', color: '#d1d5db',
                  background: 'rgba(0,0,0,0.40)', padding: '8px 12px', borderRadius: '8px',
                  wordBreak: 'break-all', margin: 0, border: '1px solid rgba(255,255,255,0.06)',
                }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status bar above the grid ─────────────────────────────────────────────────
function StatusBar({ session }: { session: DragonTowerSession }) {
  const isActive = session.status === 'active';
  const isLost   = session.status === 'lost';

  const color  = isActive ? '#fbbf24' : isLost ? '#f87171' : '#34d399';
  const border = isActive ? 'rgba(245,158,11,0.28)' : isLost ? 'rgba(239,68,68,0.28)' : 'rgba(52,211,153,0.28)';
  const bg     = isActive ? 'rgba(245,158,11,0.06)' : isLost ? 'rgba(239,68,68,0.06)' : 'rgba(52,211,153,0.06)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderRadius: '12px', width: '100%', maxWidth: '440px',
      background: bg, border: `1px solid ${border}`,
    }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color }}>
        {isActive && '🎮 Climbing…'}
        {isLost   && '🔥 Dragon got you!'}
        {!isActive && !isLost && '🏆 Tower Cleared!'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
          Floor {session.currentRow}/{session.rows}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'monospace' }}>
          {session.currentMultiplier.toFixed(2)}x
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const DragonTowerPage: NextPage = () => {
  const game = getGameById('dragon-tower')!; // matches gameConfig.ts id for Dragon Tower
  const { loading: authLoading, user, token, checkAuth } = useAuthContext();
  const authReady = !authLoading;

  const refreshBalance = useCallback(async () => {
    try { await checkAuth(); } catch { /* non-fatal */ }
  }, [checkAuth]);

  const {
    session, loading, error, lastResult,
    start: _start, reveal: _reveal, cashout: _cashout, reset,
  } = useDragonTower({ token: token ?? '', onBalanceUpdate: refreshBalance });

  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (lastResult?.outcome === 'lost') {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 700);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  const startGame = useCallback(async (betAmount: number, difficulty: Difficulty, rows?: number) => {
    await _start(betAmount, difficulty, rows);
    await refreshBalance();
  }, [_start, refreshBalance]);

  const pickEgg = useCallback(async (col: number) => {
    await _reveal(col);
    await refreshBalance();
  }, [_reveal, refreshBalance]);

  const cashOut = useCallback(async () => {
    await _cashout();
    await refreshBalance();
  }, [_cashout, refreshBalance]);

  const [history,        setHistory]        = useState<DragonTowerSession[]>([]);
  const [histLoading,    setHistLoading]     = useState(false);
  const [histPage,       setHistPage]        = useState(1);
  const [histTotal,      setHistTotal]       = useState(0);
  const [histTotalPages, setHistTotalPages]  = useState(1);
  const [verifyId,       setVerifyId]        = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number) => {
    if (!token) return;
    setHistLoading(true);
    const res = await dragonTowerApi.getHistory(token, page, HIST_LIMIT);
    if (res.success) {
      setHistory(res.sessions);
      setHistTotal(res.pagination.total);
      setHistTotalPages(res.pagination.totalPages);
      setHistPage(page);
    }
    setHistLoading(false);
  }, [token]);

  useEffect(() => { if (authReady && token) loadHistory(1); }, [authReady, token, loadHistory]);

  // Refresh history when a round ends
  useEffect(() => {
    if (lastResult && token) loadHistory(1);
  }, [lastResult, token, loadHistory]);

  const userBalance = user?.balance ?? 0;
  const isDisabled  = loading || session?.status !== 'active';

  return (
    <GamePageWrapper game={game}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #080700 0%, #0d0d09 50%, #0a0900 100%)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', fontSize: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
            }}>🐉</div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#f3f4f6', margin: 0, letterSpacing: '-0.02em' }}>Dragon Tower</h1>
              <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>Pick safe eggs to climb floors and multiply your bet</p>
            </div>
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Balance</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#f3f4f6', fontFamily: 'monospace' }}>
                {userBalance.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* ── Main game area ───────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: '20px',
            alignItems: 'start',
          }}
            className="dt-grid"
          >
            {/* LEFT — grid */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              {session && <StatusBar session={session} />}

              <DragonTowerGrid
                session={session}
                layout={lastResult?.layout}
                onPick={pickEgg}
                disabled={isDisabled}
                isShaking={isShaking}
              />

              {session && session.status !== 'active' && (
                <button
                  onClick={reset}
                  style={{
                    padding: '10px 28px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                    color: '#9ca3af', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#f3f4f6';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  ↺ New Game
                </button>
              )}
            </div>

            {/* RIGHT — bet panel */}
            <div>
              <DragonTowerBetPanel
                session={session}
                isLoading={loading || !authReady}
                error={error}
                userBalance={userBalance}
                onStart={startGame}
                onCashOut={cashOut}
              />
            </div>
          </div>

          {/* ── Provably fair info ───────────────────────────────────────── */}
          <div style={{
            padding: '16px 20px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>🔒</span>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 6px' }}>
                Provably Fair
              </p>
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                Dragon positions are generated with HMAC-SHA256(serverSeed, clientSeed) before the round starts.
                The server seed hash is committed upfront — after the game ends the raw seed is revealed so you can verify every outcome independently.
                Click <strong style={{ color: '#4b5563' }}>Verify</strong> on any finished game below.
              </p>
            </div>
          </div>

          {/* ── History table ────────────────────────────────────────────── */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                My Games
              </span>
              <button
                onClick={() => loadHistory(histPage)}
                disabled={!authReady || histLoading}
                style={{
                  fontSize: '12px', color: '#f59e0b', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 600, opacity: (!authReady || histLoading) ? 0.35 : 1,
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {(!authReady || histLoading) ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#374151', fontSize: '13px' }}>Loading…</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '64px 0', textAlign: 'center', color: '#374151' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🐉</p>
                <p style={{ fontSize: '13px' }}>No climbs yet — start your first round above!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Date', 'Bet', 'Difficulty', 'Floors', 'Payout', 'Result', 'Fair'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.10em', color: '#374151',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* FIX: key uses sessionKey() which handles both _id and sessionId */}
                    {history.map(g => (
                      <HistoryRow key={sessionKey(g)} game={g} onVerify={setVerifyId} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {histTotalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '11px', color: '#374151' }}>
                  Page {histPage} of {histTotalPages} · {histTotal} total
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '← Prev', disabled: histPage <= 1,            onClick: () => loadHistory(histPage - 1) },
                    { label: 'Next →', disabled: histPage >= histTotalPages, onClick: () => loadHistory(histPage + 1) },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      disabled={btn.disabled}
                      onClick={btn.onClick}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                        cursor: btn.disabled ? 'not-allowed' : 'pointer', opacity: btn.disabled ? 0.25 : 1,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9ca3af', transition: 'all 0.15s',
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

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .dt-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {verifyId && token && (
        <VerifyModal sessionId={verifyId} token={token} onClose={() => setVerifyId(null)} />
      )}
    </GamePageWrapper>
  );
};

export default withAuth(DragonTowerPage);