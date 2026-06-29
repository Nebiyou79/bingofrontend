/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/games/giovani/index.tsx
/**
 * DashBets — Giovani Game Page (5×3 grid, 25 paylines)
 *
 * Royal-themed video slot. Visual language blends DashBets' signature
 * deep-violet-on-void palette with a gold "Hold and Win" jackpot ladder
 * and ornate royal symbol set (crown, lion, gem, chest, court cards),
 * rendered on a full 5-reel x 3-row grid with 25 simultaneous paylines.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { withAuth } from '../../hoc/withAuth';
import { useAuthContext } from '../../context/AuthContext';
import { GamePageWrapper } from '../../components/games/GamePageWrapper';
import { getGameById } from '../../config/gameConfig';
import { useGiovani } from '../../hooks/useGiovani';
import { getGiovaniHistory, verifyGiovaniSpin } from '../../lib/api/giovaniApi';
import type { GiovaniSpinRecord, GiovaniSymbol } from '../../lib/api/giovaniApi';
import { GiovaniBetPanel } from '../../components/giovani/GiovaniBetPanel';
import { GiovaniReels } from '../../components/giovani/GiovaniReels';

// Import all icons for the history grid
import {
  TenIcon,
  JackIcon,
  QueenIcon,
  KingIcon,
  AceIcon,
  GemIcon,
  LionIcon,
  CrownIcon,
  ChestIcon,
} from '../../components/giovani/icons';

const HIST_LIMIT = 10;

// Map symbols to icon components for history grid
const SYMBOL_ICON: Record<GiovaniSymbol, React.ComponentType<{ className?: string; size?: number }>> = {
  ten: TenIcon,
  jack: JackIcon,
  queen: QueenIcon,
  king: KingIcon,
  ace: AceIcon,
  gem: GemIcon,
  lion: LionIcon,
  crown: CrownIcon,
  chest: ChestIcon,
};

// Gold "Hold and Win" jackpot ladder — purely presentational (no backend
// jackpot pool exists yet). Update these once a real jackpot endpoint is wired up.
const JACKPOT_TIERS = [
  { label: 'Grand', amount: 125_000, glow: '#f59e0b' },
  { label: 'Major', amount: 25_000, glow: '#a855f7' },
  { label: 'Minor', amount: 2_500, glow: '#22d3ee' },
  { label: 'Mini', amount: 1_000, glow: '#4ade80' },
];

function fmt(value: unknown, fallback = '0'): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString();
}

// ── Mini grid preview for the history table ────────────────────────────────────
function GridPreview({ grid }: { grid: GiovaniSymbol[][] }) {
  if (!grid || grid.length === 0) return <span>—</span>;
  return (
    <div className="inline-grid grid-cols-5 gap-0.5">
      {grid.map((col, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {col.map((sym, j) => {
            const IconComponent = SYMBOL_ICON[sym];
            return IconComponent ? (
              <IconComponent key={j} className="w-4 h-4" size={16} />
            ) : (
              <span key={j} className="text-[10px] leading-none">❓</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── History row ────────────────────────────────────────────────────────────────
function HistoryRow({ spin, onVerify }: { spin: GiovaniSpinRecord; onVerify: (id: string) => void }) {
  const date = new Date(spin.createdAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  return (
    <tr className="border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <td className="py-2.5 px-3 text-xs font-mono" style={{ color: '#4b5563' }}>{date}</td>
      <td className="py-2.5 px-3 text-sm font-mono" style={{ color: '#9ca3af' }}>{fmt(spin.betAmount)} ETB</td>
      <td className="py-2.5 px-3 text-center"><GridPreview grid={spin.grid} /></td>
      <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-500">
        {spin.winningLines?.length > 0 ? `${spin.winningLines.length} line${spin.winningLines.length === 1 ? '' : 's'}` : '—'}
      </td>
      <td className="py-2.5 px-3 text-center text-xs">
        {spin.triggeredFreeSpins && (
          <span className="font-bold" style={{ color: '#f59e0b' }}>👑 ×{spin.freeSpinsAwarded}</span>
        )}
        {spin.isFreeSpinBonus && (
          <span className="font-bold text-[10px]" style={{ color: '#fbbf24' }}>FREE</span>
        )}
        {spin.scatterCount >= 3 && !spin.triggeredFreeSpins && (
          <span className="font-bold text-[10px]" style={{ color: '#67e8f9' }}>📦×{spin.scatterCount}</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-right font-mono font-bold">
        <span className={spin.isWin ? 'text-purple-400' : 'text-red-400'}>
          {spin.isWin ? `+${fmt(spin.payout)}` : '0'} ETB
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
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    verifyGiovaniSpin(spinId)
      .then(res => { setResult(res); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
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
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {result && (
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
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Stored Grid</p>
                <GridPreview grid={result.storedGrid} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Derived Grid</p>
                <GridPreview grid={result.derivedGrid} />
              </div>
            </div>
            {[
              { label: 'Server Seed Hash', value: result.serverSeedHash },
              { label: 'Server Seed', value: result.serverSeed },
              { label: 'Client Seed', value: result.clientSeed },
              { label: 'Nonce', value: String(result.nonce) },
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
const GiovaniPage: NextPage = () => {
  const game = getGameById('giovani')!; // matches gameConfig.ts id for Giovani
  const { loading: authLoading, user } = useAuthContext();
  const authReady = !authLoading;
  const userBalance = user?.balance ?? 0;

  const {
    phase, grid, lastResult, lastFreeResult,
    freeSpinsRemaining, freeSpinsSessionId, totalFreeWin,
    balance, error, config,
    spin: _spin, onRevealComplete, playNextFreeSpin,
    isSpinning, canSpin,
  } = useGiovani(userBalance);

  const giovaniState = {
    phase, grid, lastResult, lastFreeResult,
    freeSpinsRemaining, freeSpinsSessionId, totalFreeWin,
    balance, error, config,
  };

  const [history, setHistory] = useState<GiovaniSpinRecord[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histTotalPages, setHistTotalPages] = useState(1);
  const [verifyId, setVerifyId] = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number) => {
    setHistLoading(true);
    try {
      const res = await getGiovaniHistory(page, HIST_LIMIT);
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
    <GamePageWrapper game={game}>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0612 0%, #140a1c 45%, #0a0612 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* Header card — game info + balance */}
          <div className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(160deg, rgba(139,92,246,0.12), rgba(245,158,11,0.06))',
              border: '1px solid rgba(139,92,246,0.22)',
            }}>
            {/* Game icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{
                background: 'linear-gradient(160deg, rgba(245,158,11,0.25), rgba(168,85,247,0.15))',
                border: '2px solid rgba(245,158,11,0.45)',
                boxShadow: '0 0 28px rgba(245,158,11,0.25)',
              }}>
              👑
            </div>

            {/* Game details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black tracking-tight text-white leading-none">GIOVANI</h1>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(168,85,247,0.25)', border: '1px solid rgba(168,85,247,0.45)', color: '#d8b4fe' }}>
                  VIP
                </span>
              </div>
              <p className="text-[10px] mb-2" style={{ color: '#6b7280' }}>
                96.5% RTP · 5 Reels · 25 Paylines · Free Spins Bonus
              </p>
              {/* XP progress bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-400">23</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: '#6b7280' }}>72%</span>
              </div>
            </div>

            {/* Balance + wallet */}
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#6b7280' }}>Balance</p>
              <p className="text-lg font-black text-white font-mono tabular-nums leading-none">{fmt(balance ?? userBalance)}</p>
              <p className="text-[9px] font-bold mb-2" style={{ color: '#6b7280' }}>ETB</p>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(160deg, #7c3aed, #a855f7)',
                  color: '#fff',
                }}>
                <span>💳</span> Wallet
              </button>
            </div>
          </div>

          {/* Jackpot Pools */}
          <div className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(245,158,11,0.18)',
            }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">👑</span>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#fbbf24' }}>Jackpot Pools</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase tracking-wide font-bold" style={{ color: '#4b5563' }}>Updates in</span>
                <span className="text-[10px] font-black font-mono tabular-nums px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.40)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.06)' }}>
                  00:42:15
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {JACKPOT_TIERS.map(tier => (
                <div key={tier.label} className="rounded-xl px-2 py-3 text-center"
                  style={{
                    background: `linear-gradient(160deg, ${tier.glow}15, rgba(255,255,255,0.01))`,
                    border: `1px solid ${tier.glow}30`,
                  }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: tier.glow }}>{tier.label}</p>
                  <p className="text-sm font-black text-white font-mono tabular-nums leading-tight">
                    {tier.amount >= 1000 ? `${(tier.amount / 1000).toFixed(0)},000` : fmt(tier.amount)}
                  </p>
                  <p className="text-[8px] font-bold mt-0.5" style={{ color: '#374151' }}>ETB</p>
                  <div className="text-base mt-1">
                    {tier.label === 'Grand' ? '🪙' : tier.label === 'Major' ? '💜' : tier.label === 'Minor' ? '💙' : '💚'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="text-base">⚠️</span> {error}
            </div>
          )}

          {/* Main layout — reels full width, bet panel below */}
          <div className="space-y-0">

            {/* Slot machine */}
            <GiovaniReels
              phase={phase}
              grid={grid}
              winningLines={activeResult?.winningLines ?? []}
              scatterCount={activeResult?.scatterCount ?? 0}
              payout={activeResult?.payout ?? 0}
              multiplier={activeResult?.multiplier ?? 1}
              winType={activeResult?.winType ?? ''}
              onRevealComplete={handleRevealComplete}
              isFreeSpinBonus={activeResult && 'isFreeSpinBonus' in activeResult ? true : false}
              freeSpinsRemaining={freeSpinsRemaining}
              totalFreeWin={totalFreeWin}
            />

            {/* Bet panel — bottom control deck */}
            <GiovaniBetPanel
              state={giovaniState as any}
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
              Each of the 15 grid cells is derived independently from HMAC-SHA256(serverSeed, clientSeed + ":" + nonce + ":" + reel + ":" + row).
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
                <p className="text-4xl mb-3">👑</p>
                <p className="text-sm">No spins yet. Pull the lever!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Date', 'Bet', 'Grid', 'Lines Hit', 'Bonus', 'Payout', 'Result', 'Fair'].map(h => (
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
    </GamePageWrapper>
  );
};

export default withAuth(GiovaniPage);