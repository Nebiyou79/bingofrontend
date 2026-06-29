/**
 * components/spin/SpinHistory.tsx — Premium redesign
 *
 * Full outcome badge coverage for all v2 spinEngine types.
 * Filter tabs, CSV export, loading skeletons, pagination.
 */

import React, { useEffect, useState } from 'react';
import { useSpinHistory } from '../../hooks/useSpinData';
import type { SpinBet, SpinOutcome } from '../../lib/api/spinApi';

// ─── Badge config — covers ALL spinEngine v2 outcomes ─────────────────────────

const BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  // Loss
  loss:      { label: 'Loss',      color: '#475569', bg: 'rgba(71,85,105,0.1)',   border: 'rgba(71,85,105,0.22)' },
  // Refund (0.5×)
  refund:    { label: '↩ 0.5×',   color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
  // Break-even (1×)
  even:      { label: '1× Even',  color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.25)' },
  // Multiplier wins
  '2x':      { label: '2× Win',   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.28)' },
  '3x':      { label: '3× Win',   color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.28)' },
  bonus:     { label: '5× Bonus', color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.28)' },
  mega:      { label: '10× Mega', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.28)' },
  epic:      { label: '25× Epic', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.28)' },
  // Jackpots
  mini_jp:   { label: '🎯 Mini',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  minor_jp:  { label: '⭐ Minor', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.3)' },
  major_jp:  { label: '🔥 Major', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
  grand_jp:  { label: '👑 Grand', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.35)' },
  // Legacy
  win:       { label: 'Win',      color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)' },
  jackpot:   { label: '🏆 JP',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)' },
  pending:   { label: 'Pending',  color: '#64748b', bg: 'rgba(100,116,139,0.08)',border: 'rgba(100,116,139,0.2)' },
  error:     { label: 'Error',    color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
};

function ResultBadge({ result }: { result: string }) {
  const key = result.toLowerCase();
  const cfg = BADGE[key] ?? BADGE.loss;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function getMultiplierDisplay(bet: SpinBet): string {
  const r = bet.result.toLowerCase();
  if (r === 'refund')              return '0.5×';
  if (r === 'even')                return '1×';
  if (r === 'loss' || r === 'error' || r === 'pending') return '—';
  if (bet.multiplier > 0)          return `${bet.multiplier}×`;
  return '—';
}

function getPayoutDisplay(bet: SpinBet): { text: string; color: string } {
  const r = bet.result.toLowerCase();
  if (r === 'refund') {
    return { text: `+${Math.floor(bet.betAmount * 0.5).toLocaleString()}`, color: '#f97316' };
  }
  if (bet.payout > 0) {
    return { text: `+${bet.payout.toLocaleString()}`, color: '#22c55e' };
  }
  return { text: '—', color: '#334155' };
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: Array<{ label: string; value: SpinOutcome | 'all' }> = [
  { label: 'All',     value: 'all'      },
  { label: 'Wins',    value: 'win'      },
  { label: 'Jackpot', value: 'mini_jp'  },
  { label: 'Bonus',   value: 'bonus'    },
  { label: 'Loss',    value: 'loss'     },
  { label: 'Refund',  value: 'refund'   },
];

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <div className="grid grid-cols-6 gap-2 px-4 py-3 animate-pulse">
      {[40, 28, 52, 22, 38, 18].map((w, j) => (
        <div key={j} className="h-3 rounded-md"
          style={{
            background: 'rgba(30,41,59,0.7)',
            width: `${w + (idx % 3) * 6}%`,
            animationDelay: `${j * 60}ms`,
          }}/>
      ))}
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(bets: SpinBet[]) {
  const rows = bets.map(b => [
    new Date(b.createdAt).toISOString(),
    b.betAmount, b.result, b.multiplier,
    b.grossWin, b.commission, b.payout, b.status,
  ].join(','));
  const csv  = ['Time,Bet,Result,Multiplier,Gross,Commission,Payout,Status', ...rows].join('\n');
  const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: `spins-${Date.now()}.csv` }).click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SpinHistory() {
  const { bets, pagination, isLoading, page, filters, goToPage, applyFilters } = useSpinHistory(20);

  // ── Hydration guard ─────────────────────────────────────────────────────────
  // React Query can resolve before/after hydration depending on cache state,
  // SSR prefetch, and timing — meaning isLoading/bets.length can differ between
  // the server-rendered HTML and the client's first render pass. When that
  // happens React tries to reconcile a tree with an <svg> (empty state) against
  // one without it (skeleton) and throws a hydration error.
  // Forcing the loading branch until mount guarantees the client's first paint
  // always matches the server's first paint (both show the skeleton); real data
  // swaps in immediately after via a normal client-side re-render, which is
  // hydration-safe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const showLoading = isLoading || !mounted;

  return (
    <div className="space-y-2.5">
      {/* Filter + export row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(({ label, value }) => {
            const active = filters.result === value;
            return (
              <button
                key={value}
                onClick={() => applyFilters({ result: value })}
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                style={active ? {
                  background: 'rgba(124,58,237,0.18)',
                  border: '1px solid rgba(124,58,237,0.45)',
                  color: '#c4b5fd',
                  fontFamily: "'Rajdhani',sans-serif",
                  letterSpacing: '0.06em',
                } : {
                  background: 'rgba(5,4,16,0.7)',
                  border: '1px solid rgba(51,65,85,0.5)',
                  color: '#475569',
                  fontFamily: "'Rajdhani',sans-serif",
                  letterSpacing: '0.06em',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => exportCSV(bets)}
          disabled={bets.length === 0}
          className="px-2.5 py-1 rounded-lg text-[9px] font-mono transition-all disabled:opacity-25"
          style={{
            background: 'rgba(5,4,16,0.7)',
            border: '1px solid rgba(51,65,85,0.5)',
            color: '#475569',
          }}
        >
          ↓ CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(5,4,16,0.82)', border: '1px solid rgba(255,255,255,0.055)' }}>

        {/* Column headers */}
        <div
          className="grid grid-cols-6 gap-2 px-4 py-2.5 text-[8px] font-mono tracking-[0.18em] uppercase"
          style={{
            color: 'rgba(100,116,139,0.6)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <span>Time</span>
          <span className="text-right">Bet</span>
          <span className="text-center">Result</span>
          <span className="text-center">×</span>
          <span className="text-right">Payout</span>
          <span className="text-center">Fair</span>
        </div>

        {/* Rows */}
        {showLoading ? (
          [...Array(6)].map((_, i) => <SkeletonRow key={i} idx={i} />)
        ) : bets.length === 0 ? (
          <div className="py-12 text-center">
<div className="mb-2 opacity-30 flex justify-center">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
</div>            <p className="text-slate-700 text-xs font-mono">No spins match this filter</p>
          </div>
        ) : (
          bets.map((bet, i) => {
            const payout = getPayoutDisplay(bet);
            const mult   = getMultiplierDisplay(bet);
            return (
              <div
                key={bet._id}
                className="grid grid-cols-6 gap-2 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: i < bets.length - 1 ? '1px solid rgba(255,255,255,0.035)' : 'none',
                  background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                }}
              >
                <span className="text-[8px] font-mono self-center" style={{ color: '#334155' }}>
                  {new Date(bet.createdAt).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-right font-mono tabular-nums text-xs self-center"
                  style={{ color: '#64748b' }}>
                  {bet.betAmount.toLocaleString()}
                </span>
                <span className="flex justify-center self-center">
                  <ResultBadge result={bet.result} />
                </span>
                <span className="text-center font-mono text-xs self-center" style={{ color: '#334155' }}>
                  {mult}
                </span>
                <span className="text-right font-mono tabular-nums text-xs self-center font-bold"
                  style={{ color: payout.color }}>
                  {payout.text}
                </span>
                <span className="flex justify-center self-center">
                  {bet.provablyFair != null ? (
                    <span
                      title={bet.provablyFair.verified ? 'Verified' : 'Unverified'}
                      className="text-[10px]"
                      style={{ color: bet.provablyFair.verified ? '#22c55e' : '#1e3a5f' }}
                    >
                      {bet.provablyFair.verified ? '✓' : '○'}
                    </span>
                  ) : (
                    <span className="text-[10px]" style={{ color: '#1e293b' }}>—</span>
                  )}
                </span>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(0,0,0,0.18)',
            }}
          >
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all disabled:opacity-20"
              style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.5)', color: '#94a3b8' }}
            >
              ← Prev
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                const p      = i + 1;
                const active = page === p;
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className="w-7 h-7 rounded-xl text-[10px] font-mono transition-all"
                    style={active ? {
                      background: 'rgba(124,58,237,0.25)',
                      border: '1px solid rgba(124,58,237,0.45)',
                      color: '#c4b5fd',
                    } : {
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid rgba(51,65,85,0.4)',
                      color: '#475569',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              {pagination.totalPages > 7 && (
                <span className="self-center text-[10px] px-1" style={{ color: '#1e293b' }}>…</span>
              )}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all disabled:opacity-20"
              style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.5)', color: '#94a3b8' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {pagination && (
        <p className="text-[8px] text-center font-mono" style={{ color: '#1e293b' }}>
          {pagination.total.toLocaleString()} total spins
        </p>
      )}
    </div>
  );
}