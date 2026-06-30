/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/games/slots/index.tsx
/**
 * DashBets — Classic Slots Game Page
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { withAuth }         from '../../hoc/withAuth';
import { useAuthContext }   from '../../context/AuthContext';
import { AppLayout }        from '../../components/layout/AppLayout';
import { useSlots }         from '../../hooks/useSlots';
import { getSlotHistory, verifySlotSpin } from '../../lib/api/slotsApi';
import type { SlotSpin, SlotSymbol } from '../../lib/api/slotsApi';
import { SlotsBetPanel }    from '../../components/slots/SlotsBetPanel';
import { SlotsReels }       from '../../components/slots/SlotsReels';

const HIST_LIMIT = 10;

const SYMBOL_EMOJI: Record<SlotSymbol, string> = {
  cherry: '🍒', lemon: '🍋', orange: '🍊', grape: '🍇', seven: '7️⃣', wild: '⭐',
};

// ── History row ────────────────────────────────────────────────────────────────
function HistoryRow({ spin, onVerify }: { spin: SlotSpin; onVerify: (id: string) => void }) {
  const date = new Date(spin.createdAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  return (
    <tr className="border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <td className="py-2.5 px-3 text-xs font-mono" style={{ color: '#4b5563' }}>{date}</td>
      <td className="py-2.5 px-3 text-sm font-mono" style={{ color: '#9ca3af' }}>{spin.betAmount.toLocaleString()} ETB</td>
      <td className="py-2.5 px-3 text-center text-base">
        {spin.reels.map((s, i) => <span key={i}>{SYMBOL_EMOJI[s]}</span>)}
      </td>
      <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-500">{spin.winType || '—'}</td>
      <td className="py-2.5 px-3 text-center text-xs">
        {spin.triggeredFreeSpins && (
          <span className="text-amber-400 font-bold">⭐ ×{spin.freeSpinsAwarded}</span>
        )}
        {spin.isFreeSpinBonus && (
          <span className="text-amber-500 font-bold text-[10px]">FREE</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-right font-mono font-bold">
        <span className={spin.isWin ? 'text-purple-400' : 'text-red-400'}>
          {spin.isWin ? `+${spin.payout.toLocaleString()}` : '0'} ETB
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: spin.isWin ? 'rgba(168,85,247,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${spin.isWin ? 'rgba(168,85,247,0.30)' : 'rgba(239,68,68,0.30)'}`,
            color: spin.isWin ? '#d8b4fe' : '#f87171',
          }}>
          {spin.isWin ? 'Win' : 'Loss'}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <button onClick={() => onVerify(spin._id)}
          className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors">
          Verify
        </button>
      </td>
    </tr>
  );
}

// ── Verify modal ───────────────────────────────────────────────────────────────
function VerifyModal({ spinId, onClose }: { spinId: string; onClose: () => void }) {
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  useEffect(() => {
    verifySlotSpin(spinId)
      .then(res => { setResult(res); setLoading(false); })
      .catch(e  => { setErr(e.message); setLoading(false); });
  }, [spinId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        style={{ background: '#100812', border: '1px solid rgba(168,85,247,0.30)' }}
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
                background: result.verified ? 'rgba(168,85,247,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${result.verified ? 'rgba(168,85,247,0.30)' : 'rgba(239,68,68,0.30)'}`,
                color: result.verified ? '#d8b4fe' : '#f87171',
              }}>
              {result.verified ? '✓ Spin Verified — Fair' : '✗ Verification Failed'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Stored Reels</p>
                <p className="font-mono text-gray-300 text-lg">
                  {result.storedReels?.map((s: SlotSymbol) => SYMBOL_EMOJI[s]).join(' ')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Derived Reels</p>
                <p className="font-mono text-gray-300 text-lg">
                  {result.derivedReels?.map((s: SlotSymbol) => SYMBOL_EMOJI[s]).join(' ')}
                </p>
              </div>
            </div>
            {[
              { label: 'Server Seed Hash', value: result.serverSeedHash },
              { label: 'Server Seed',      value: result.serverSeed },
              { label: 'Client Seed',      value: result.clientSeed },
              { label: 'Nonce',            value: String(result.nonce) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
                <p className="font-mono text-xs text-gray-300 rounded-lg px-3 py-2 break-all" style={{ background: 'rgba(0,0,0,0.35)' }}>
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
const SlotsPage: NextPage = () => {
  const { loading: authLoading, user } = useAuthContext();
  const authReady = !authLoading;
  const userBalance = user?.balance ?? 0;

  const {
    phase, reels, lastResult, lastFreeResult,
    freeSpinsRemaining, freeSpinsSessionId, totalFreeWin,
    balance, error, config,
    spin: _spin, onRevealComplete, playNextFreeSpin,
    isSpinning, canSpin,
  } = useSlots(userBalance);

  const slotsState = {
    phase, reels, lastResult, lastFreeResult,
    freeSpinsRemaining, freeSpinsSessionId, totalFreeWin,
    balance, error, config,
  };

  const [history,        setHistory]       = useState<SlotSpin[]>([]);
  const [histLoading,    setHistLoading]    = useState(false);
  const [histPage,       setHistPage]       = useState(1);
  const [histTotal,      setHistTotal]      = useState(0);
  const [histTotalPages, setHistTotalPages] = useState(1);
  const [verifyId,       setVerifyId]       = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number) => {
    setHistLoading(true);
    try {
      const res = await getSlotHistory(page, HIST_LIMIT);
      setHistory(res.spins);
      setHistTotal(res.pagination.total);
      setHistTotalPages(res.pagination.pages);
      setHistPage(page);
    } catch { /* non-fatal */ }
    setHistLoading(false);
  }, []);

  useEffect(() => { if (authReady) loadHistory(1); }, [authReady]);

  const handleRevealComplete = useCallback(() => {
    onRevealComplete();
    // Refresh history after a paid spin settles
    if (lastResult) setTimeout(() => loadHistory(1), 500);
  }, [onRevealComplete, lastResult, loadHistory]);

  const activeResult = lastFreeResult ?? lastResult;

  return (
    <AppLayout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #060412 0%, #100812 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.30)' }}>
              🎰
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Classic Slots</h1>
              <p className="text-xs text-gray-600">96.5% RTP · Wild substitution · Free spins bonus</p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.20)' }}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Balance</span>
              <span className="text-sm font-black text-white font-mono">{(balance ?? userBalance).toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
              {error}
            </div>
          )}

          {/* Main layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

            {/* LEFT: slot machine */}
            <SlotsReels
              phase={phase}
              reels={reels}
              winningLine={activeResult?.winningLine ?? []}
              payout={activeResult?.payout ?? 0}
              multiplier={activeResult?.multiplier ?? 1}
              winType={activeResult?.winType ?? ''}
              onRevealComplete={handleRevealComplete}
              isFreeSpinBonus={activeResult && 'isFreeSpinBonus' in activeResult ? true : false}
              freeSpinsRemaining={freeSpinsRemaining}
              totalFreeWin={totalFreeWin}
            />

            {/* RIGHT: bet panel */}
            <SlotsBetPanel
              state={slotsState as any}
              userBalance={balance ?? userBalance}
              onSpin={(betAmount, clientSeed) => _spin(betAmount, clientSeed)}
              onFreeSpin={playNextFreeSpin}
              canSpin={canSpin}
              isSpinning={isSpinning}
            />
          </div>

          {/* Provably fair */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">🔒 Provably Fair</h2>
            <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>
              Each spin uses HMAC-SHA256(serverSeed, clientSeed + &quot;:&quot; + nonce) to derive reel stops.
              The server seed hash is committed before you spin. After the spin, the raw seed is revealed.
              The nonce increments each spin so you can verify the complete history.
              Click <strong className="text-gray-500">Verify</strong> on any spin below.
            </p>
          </div>

          {/* History */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">My Spins</h2>
              <button onClick={() => loadHistory(histPage)} disabled={!authReady}
                className="text-xs text-purple-500 hover:text-purple-400 transition-colors disabled:opacity-30">
                ↻ Refresh
              </button>
            </div>

            {(!authReady || histLoading) ? (
              <div className="p-8 text-center text-gray-700 text-sm animate-pulse">Loading…</div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center" style={{ color: '#374151' }}>
                <p className="text-4xl mb-3">🎰</p>
                <p className="text-sm">No spins yet. Pull the lever!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Date', 'Bet', 'Reels', 'Win Type', 'Bonus', 'Payout', 'Result', 'Fair'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider" style={{ color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(s => <HistoryRow key={s._id} spin={s} onVerify={setVerifyId} />)}
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
      {verifyId && <VerifyModal spinId={verifyId} onClose={() => setVerifyId(null)} />}
    </AppLayout>
  );
};

export default withAuth(SlotsPage);
