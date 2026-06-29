// pages/games/card-draw/index.tsx
/**
 * DashBets — Card Draw Game Page
 *
 * Integrates BetSelector, CardReveal, BetResults, and GameHistory.
 * Uses useCardDraw hook for state machine and API calls.
 * Fetches payout table on mount. Refreshes balance after game settles.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { withAuth } from '../../hoc/withAuth';
import { useAuthContext } from '../../context/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { useCardDraw } from '../../hooks/useCardDraw';
import { getPayoutTable } from '../../lib/api/cardDrawApi';
import type { CardDrawPayoutTableResponse } from '../../lib/api/cardDrawApi';

import { BetSelector } from '../../components/cardDraw/BetSelector';
import { CardReveal } from '../../components/cardDraw/CardReveal';
import { BetResults } from '../../components/cardDraw/BetResults';
import { GameHistory } from '../../components/cardDraw/GameHistory';

const CardDrawPage: NextPage = () => {
  const { loading: authLoading, user, checkAuth } = useAuthContext();
  const authReady = !authLoading;

  const {
    phase,
    lastResult,
    history,
    historyPage,
    historyTotal,
    histLoading,
    error,
    play,
    reset,
    clearError,
    loadHistory,
  } = useCardDraw();

  const [payoutTable, setPayoutTable] = useState<CardDrawPayoutTableResponse['table'] | null>(null);

  // Refresh balance after round settles
  const refreshBalance = useCallback(async () => {
    try {
      await checkAuth();
    } catch { /* non-fatal */ }
  }, [checkAuth]);

  // Fetch payout table on mount
  useEffect(() => {
    if (!authReady) return;
    getPayoutTable().then(res => {
      if (res.success) setPayoutTable(res.table);
    });
  }, [authReady]);

  // Load initial history
  useEffect(() => {
    if (!authReady) return;
    loadHistory(1);
  }, [authReady, loadHistory]);

  // Refresh history and balance when a round settles
  useEffect(() => {
    if (phase === 'result' && lastResult) {
      loadHistory(1);
      refreshBalance();
    }
  }, [phase, lastResult, loadHistory, refreshBalance]);

  // Safety wrapper: never forward empty-string clientSeed to the API
  const handlePlay = useCallback(
    (bets: Parameters<typeof play>[0], clientSeed?: string) =>
      play(bets, clientSeed && clientSeed.trim().length > 0 ? clientSeed.trim() : undefined),
    [play],
  );

  const isRevealing = phase === 'revealing';
  const userBalance = user?.balance ?? 0;

  const histTotalPages = Math.ceil(historyTotal / 10);

  // Handle verify click - open verify modal or navigate
  const handleVerify = (roundId: string) => {
    console.log('Verify round:', roundId);
    // TODO: Implement verify modal similar to Mines page
    alert(`Verify round: ${roundId}\n\nFeature coming soon!`);
  };

  return (
    <AppLayout title="Card Draw">
      <div
        className="min-h-full relative"
        style={{ background: '#080a12', color: '#f0f0f8', fontFamily: "'Exo 2', sans-serif" }}
      >
        {/* Ambient background */}
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
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-700/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-6" style={{ zIndex: 1 }}>
          {/* ── Page header ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🃏</span>
              <h1
                className="text-4xl font-black tracking-tight text-white"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '2px' }}
              >
                CARD DRAW
              </h1>
            </div>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Bet on color, suit, or exact rank. Draw a card and win up to 48x!
            </p>
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mb-8">
            {/* LEFT: Card reveal area */}
            <div className="flex flex-col items-center justify-center gap-4">
              {error && (
                <div
                  className="w-full max-w-md rounded-xl px-4 py-3 text-sm text-center text-red-400"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  {error}
                  <button onClick={clearError} className="ml-2 underline text-xs">Dismiss</button>
                </div>
              )}

              <CardReveal
                card={lastResult?.drawnCard ?? null}
                isRevealing={isRevealing}
              />

              {/* Result details */}
              {phase === 'result' && lastResult && (
                <div className="w-full max-w-md">
                  <BetResults
                    bets={lastResult.bets}
                    drawnCard={lastResult.drawnCard}
                    totalWagered={lastResult.totalWagered}
                    totalPayout={lastResult.totalPayout}
                    netProfit={lastResult.netProfit}
                  />
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={reset}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:text-white"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: '#9ca3af',
                      }}
                    >
                      ↺ Place New Bets
                    </button>
                  </div>
                </div>
              )}

              {/* Skeleton while auth hydrates */}
              {!authReady && (
                <div className="w-full max-w-md flex flex-col items-center gap-4 p-8">
                  <div className="w-48 h-72 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              )}
            </div>

            {/* RIGHT: Bet panel */}
            <div>
              <BetSelector
                onPlay={handlePlay}
                isLoading={isRevealing || !authReady}
                userBalance={userBalance}
                payoutTable={payoutTable}
              />
            </div>
          </div>

          {/* ── Payout Table Info ── */}
          {payoutTable && (
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">
                📊 Payout Table
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {payoutTable.map((entry) => (
                  <div
                    key={entry.type}
                    className="rounded-xl p-3"
                    style={{
                      background: 'rgba(0,0,0,0.20)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase text-purple-400">{entry.type}</span>
                      <span className="text-lg font-black text-amber-400 font-mono">{entry.multiplier}x</span>
                    </div>
                    <p className="text-[10px] text-gray-600">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Provably fair info ── */}
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">
              🔒 Provably Fair
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>
              Each card is drawn using HMAC-SHA256(serverSeed, clientSeed + &apos;:0&#39;) to generate a 
              cryptographically random card index (0-51). The server publishes the SHA-256 hash 
              of the server seed before the round. After the game ends, you can verify the hash 
              to confirm no manipulation occurred.
            </p>
          </div>

          {/* ── Game history ── */}
          <GameHistory
            rounds={history}
            loading={histLoading || !authReady}
            page={historyPage}
            totalPages={histTotalPages}
            total={historyTotal}
            onPageChange={(p) => loadHistory(p)}
            onVerify={handleVerify}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default withAuth(CardDrawPage);