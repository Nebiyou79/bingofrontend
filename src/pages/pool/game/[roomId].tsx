// pages/pool/game/[roomId].tsx
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, useCallback } from 'react';

import { PoolTable2D }          from '../../../components/pool/PoolTable2D';
import { GameHUD8Ball }         from '../../../components/pool/GameHUD8Ball';
import { GameHUDEthiopian }     from '../../../components/pool/GameHUDEthiopian';
import { GameEndModal }         from '../../../components/pool/GameEndModal';
import { usePoolGame }          from '../../../hooks/usePoolGame';
import { useBallInterpolation } from '../../../hooks/useBallInterpolation';
import { useAuthContext }       from '../../../context/AuthContext';
import { RACK_POSITIONS, BALL_REST_Y } from '../../../lib/pool.constants';
import type { PoolMode }        from '../../../types/pool';

interface PageProps { roomId: string }

const GamePage: NextPage<PageProps> = ({ roomId }) => {
  const router = useRouter();
  const { user, token } = useAuthContext() as any;
  // MongoDB _id — fall back to id
  const myUserId = user?._id ?? user?.id ?? '';

  // ── Session ─────────────────────────────────────────────────────────────
  const [session, setSession] = useState<{
    gameId: string; socketToken: string; mode: PoolMode; stake: number;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('pool_game');
    if (raw) {
      try { setSession(JSON.parse(raw)); return; } catch (_) {}
    }
    // Legacy separate keys
    const gameId      = sessionStorage.getItem('pool_game_id') ?? '';
    const socketToken = sessionStorage.getItem('pool_socket_token') ?? '';
    const mode        = (sessionStorage.getItem('pool_mode') ?? 'eightball') as PoolMode;
    if (gameId) { setSession({ gameId, socketToken, mode, stake: 0 }); }
    else { router.replace('/pool'); }
  }, []); // eslint-disable-line

  // ── Game hook ────────────────────────────────────────────────────────────
  const { gameState, connected, snapshotCallbackRef, sendShot, forfeit, dismissFoul } = usePoolGame({
    gameId:    session?.gameId    ?? '',
    mode:      session?.mode      ?? 'eightball',
    myUserId,
    mainToken: token ?? undefined,
  });

  // ── Ball interpolation ────────────────────────────────────────────────
  const { positionsRef, registerSnapshotCallback, onShotSettled } = useBallInterpolation();

  useEffect(() => { snapshotCallbackRef.current = registerSnapshotCallback; }, [snapshotCallbackRef, registerSnapshotCallback]);
  useEffect(() => { if (gameState.lastShotResult) onShotSettled(); }, [gameState.lastShotResult, onShotSettled]);

  // Seed from game_start
  useEffect(() => {
    if (gameState.ballPositions.length > 0) {
      const m = new Map<number, any>();
      for (const p of gameState.ballPositions) m.set(p.id, p);
      positionsRef.current = m;
    }
  }, [gameState.ballPositions, positionsRef]);

  // Seed rack positions before first snapshot
  useEffect(() => {
    if (positionsRef.current.size === 0) {
      const m = new Map<number, any>();
      Object.entries(RACK_POSITIONS).forEach(([id, [x, z]]) => {
        m.set(Number(id), { id: Number(id), x, y: BALL_REST_Y, z });
      });
      positionsRef.current = m;
    }
  }, []); // eslint-disable-line

  const [power, setPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);

  const handleShot = useCallback((angle: number, pw: number, sx: number, sy: number) => {
    sendShot(angle, pw, sx, sy);
    setPower(0);
    setIsAiming(false);
  }, [sendShot]);

  const handlePowerChange = useCallback((p: number) => {
    setPower(p);
    setIsAiming(p > 0);
  }, []);

  const cleanup = useCallback(() => {
    sessionStorage.removeItem('pool_game');
    sessionStorage.removeItem('pool_game_id');
    sessionStorage.removeItem('pool_socket_token');
    sessionStorage.removeItem('pool_mode');
  }, []);

  const handleCancel = useCallback(() => { cleanup(); router.push('/pool'); }, [cleanup, router]);

  if (!session) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
    </div>
  );

  const stakeAmount = session.stake || gameState.stake;
  const modeLabel   = gameState.mode === 'ethiopian' ? 'Ethiopian Points' : '8-Ball';
  const HUD         = gameState.mode === 'ethiopian' ? GameHUDEthiopian : GameHUD8Ball;

  return (
    <>
      <Head><title>{`${modeLabel} · DashBets`}</title></Head>

      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 h-12 flex items-center justify-between px-4 bg-zinc-900/95 border-b border-zinc-800 z-20 gap-4">
          {/* Left: back + room info */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={handleCancel}
              className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all flex-shrink-0">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-sm flex-shrink-0">
                {gameState.mode === 'ethiopian' ? '⭐' : '🎱'}
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-sm leading-none truncate">{modeLabel}</div>
                <div className="text-zinc-600 text-[11px] truncate">{roomId.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>

          {/* Centre: stake */}
          {stakeAmount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-900/50 rounded-lg px-3 py-1 flex-shrink-0">
              <span className="text-amber-400/70 text-[11px] uppercase tracking-wider">Stake</span>
              <span className="text-amber-400 font-bold text-sm">{stakeAmount} ብር</span>
            </div>
          )}

          {/* Right: connection + game ID */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {session.gameId && (
              <div className="text-zinc-600 text-[11px] hidden sm:block">
                #{session.gameId.slice(-6).toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-zinc-500 text-[11px]">{connected ? 'Live' : 'Reconnecting'}</span>
            </div>
          </div>
        </div>

        {/* ── Main area ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Canvas */}
          <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center p-1.5 min-w-0">
            <div className="w-full h-full">
              <PoolTable2D
                positionsRef={positionsRef}
                ballsOnTable={gameState.status === 'active'
                  ? gameState.ballsOnTable
                  : [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]}
                isMyTurn={gameState.isMyTurn}
                controlsLocked={gameState.controlsLocked}
                onShot={handleShot}
                onPowerChange={handlePowerChange}
              />
            </div>

            {/* Waiting overlay */}
            {(gameState.status === 'waiting' || gameState.waitingFor === 'opponent') && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="text-center bg-zinc-900 border border-zinc-800 rounded-3xl px-10 py-10 shadow-2xl max-w-sm w-full mx-4">
                  <div className="w-16 h-16 mx-auto mb-5 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
                  </div>
                  <h2 className="text-white font-bold text-xl mb-2">Waiting for opponent</h2>
                  <p className="text-zinc-500 text-sm mb-1">{roomId.replace(/_/g, ' ')}</p>
                  {stakeAmount > 0 && <p className="text-amber-400/80 text-sm mb-6">{stakeAmount} ብር reserved</p>}
                  <button onClick={handleCancel}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">
                    Cancel &amp; Leave
                  </button>
                </div>
              </div>
            )}

            {/* Disconnect grace */}
            {gameState.disconnectGrace !== null && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="bg-amber-900/90 border border-amber-700/50 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
                  <p className="text-amber-300 text-sm font-medium">
                    Opponent disconnected — auto-forfeit in <strong>{gameState.disconnectGrace}s</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Reconnecting */}
            {!connected && gameState.status === 'active' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-zinc-600 border-t-amber-500 animate-spin" />
                  <p className="text-zinc-300 text-sm">Reconnecting…</p>
                </div>
              </div>
            )}

            {/* Error toast */}
            {gameState.error && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="bg-red-950/95 border border-red-800/60 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-xl">
                  <p className="text-red-300 text-sm">{gameState.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right HUD ─────────────────────────────────────────────────── */}
          <HUD
            gameState={gameState}
            power={power}
            isAiming={isAiming}
            myUserId={myUserId}
            stake={stakeAmount}
            onForfeit={forfeit}
            onDismissFoul={dismissFoul}
          />
        </div>

        {/* End modal */}
        {gameState.status === 'ended' && gameState.endResult && (
          <GameEndModal gameState={gameState} stake={stakeAmount} />
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const roomId = params?.roomId as string;
  if (!roomId) return { redirect: { destination: '/pool', permanent: false } };
  return { props: { roomId } };
};

export default GamePage;