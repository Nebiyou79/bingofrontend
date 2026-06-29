

import React from 'react';
import { useSpinHistory, type HistoryFilters } from '../hooks/useSpinData';
import type { SpinBet, SpinOutcome } from '../lib/api/spinApi';


const BADGE_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  // Loss outcomes - NO multiplier
  loss:      { label: 'Loss',    color: '#475569', bg: 'rgba(71,85,105,0.08)', border: 'rgba(71,85,105,0.2)' },
  '0x':      { label: 'Loss',    color: '#475569', bg: 'rgba(71,85,105,0.08)', border: 'rgba(71,85,105,0.2)' },
  
  // Refund - special case (0.5x)
  refund:    { label: '↩ Refund', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  '0.5x':    { label: '↩ Refund', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  
  // Even / break-even (1x)
  even:      { label: '1× Even',  color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)' },
  '1x':      { label: '1× Even',  color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)' },
  
  // Win outcomes
  '2x':      { label: '2× Win',   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)' },
  '3x':      { label: '3× Win',   color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)' },
  bonus:     { label: '5× Bonus', color: '#a855f7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.25)' },
  mega:      { label: '10× Mega', color: '#ec4899', bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.25)' },
  epic:      { label: '25× Epic', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)' },
  
  // Jackpots
  mini_jp:   { label: 'MINI JP',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
  minor_jp:  { label: 'MINOR JP', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  major_jp:  { label: 'MAJOR JP', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
  grand_jp:  { label: 'GRAND JP', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  
  // Legacy aliases
  win:       { label: 'Win',      color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)' },
  jackpot:   { label: 'JACKPOT!', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  
  // Pending / error states
  pending:   { label: 'Pending',  color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
  error:     { label: 'Error',    color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
};

function ResultBadge({ result }: { result: string }) {
  const key = result.toLowerCase();
  const cfg = BADGE_CFG[key] ?? BADGE_CFG.loss;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const TABS: Array<{ label: string; value: SpinOutcome | 'all' }> = [
  { label: 'All',     value: 'all'     },
  { label: 'Wins',    value: 'win'     },
  { label: 'Bonus',   value: 'bonus'   },
  { label: 'Jackpot', value: 'jackpot' },
  { label: 'Loss',    value: 'loss'    },
  { label: 'Refund',  value: 'refund'  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow({ i }: { i: number }) {
  return (
    <div className="grid grid-cols-6 gap-2 px-4 py-3 animate-pulse">
      {[45, 30, 55, 25, 40, 20].map((w, j) => (
        <div
          key={j}
          className="h-3 rounded"
          style={{
            background: 'rgba(30,41,59,0.8)',
            width: `${w + (i % 3) * 5}%`,
            animationDelay: `${j * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(bets: SpinBet[]) {
  const rows = bets.map((b) =>
    [
      new Date(b.createdAt).toISOString(),
      b.betAmount, b.result, b.multiplier,
      b.grossWin, b.commission, b.payout, b.status,
    ].join(',')
  );
  const csv  = ['Time,Bet,Result,Multiplier,Gross,Commission,Payout,Status', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `spins-${Date.now()}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helper to determine if multiplier should be shown ───────────────────────

function getDisplayMultiplier(bet: SpinBet): string {
  const result = bet.result.toLowerCase();
  
  // Refund always shows 0.5x
  if (result === 'refund' || result === '0.5x') {
    return '0.5×';
  }
  
  // Loss or error shows —
  if (result === 'loss' || result === 'error' || result === 'pending') {
    return '—';
  }
  
  // Even/break-even shows 1x even if multiplier is 0
  if (result === 'even' || result === '1x') {
    return '1×';
  }
  
  // Actual wins show their multiplier
  if (bet.multiplier > 0) {
    return `${bet.multiplier}×`;
  }
  
  return '—';
}

function getDisplayPayout(bet: SpinBet): { text: string; color: string } {
  const result = bet.result.toLowerCase();
  
  // Refund: show half the bet amount
  if (result === 'refund' || result === '0.5x') {
    const refundAmount = bet.betAmount * 0.5;
    return { text: `+${refundAmount.toLocaleString()}`, color: '#f59e0b' };
  }
  
  // Actual win: show net payout
  if (bet.payout > 0) {
    return { text: `+${bet.payout.toLocaleString()}`, color: '#22c55e' };
  }
  
  // Loss/error: show —
  return { text: '—', color: '#475569' };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SpinHistory() {
  const { bets, pagination, isLoading, page, filters, goToPage, applyFilters } = useSpinHistory(20);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {TABS.map(({ label, value }) => {
            const active = filters.result === value;
            return (
              <button
                key={value}
                onClick={() => applyFilters({ result: value })}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all"
                style={active ? {
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.5)',
                  color: '#818cf8',
                } : {
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(30,41,59,0.8)',
                  color: '#475569',
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
          className="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all disabled:opacity-30"
          style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(30,41,59,0.8)',
            color: '#475569',
          }}
        >
          ↓ CSV
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(30,41,59,0.8)' }}
      >
        {/* Column headers */}
        <div
          className="grid grid-cols-6 gap-2 px-4 py-2.5 text-[9px] font-mono tracking-widest text-slate-600 uppercase"
          style={{ borderBottom: '1px solid rgba(30,41,59,0.8)', background: 'rgba(2,6,23,0.6)' }}
        >
          <span>Time</span>
          <span className="text-right">Bet</span>
          <span className="text-center">Result</span>
          <span className="text-center">×</span>
          <span className="text-right">Payout</span>
          <span className="text-center">Fair</span>
        </div>

        {/* Rows */}
        {isLoading ? (
          [...Array(6)].map((_, i) => <SkeletonRow key={i} i={i} />)
        ) : bets.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-slate-700 text-xs font-mono">No spins match this filter</p>
          </div>
        ) : (
          bets.map((bet, i) => {
            const payoutDisplay = getDisplayPayout(bet);
            const multiplierDisplay = getDisplayMultiplier(bet);
            
            return (
              <div
                key={bet._id}
                className="grid grid-cols-6 gap-2 px-4 py-2.5 transition-colors hover:bg-slate-900/20"
                style={{
                  borderBottom: i < bets.length - 1 ? '1px solid rgba(15,23,42,0.8)' : 'none',
                  background: i % 2 === 1 ? 'rgba(15,23,42,0.3)' : 'transparent',
                }}
              >
                <span className="text-[9px] font-mono text-slate-600 self-center">
                  {new Date(bet.createdAt).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' })}
                </span>

                <span className="text-right font-mono tabular-nums text-slate-400 text-xs self-center">
                  {bet.betAmount.toLocaleString()}
                </span>

                <span className="flex justify-center self-center">
                  <ResultBadge result={bet.result} />
                </span>

                <span className="text-center font-mono text-xs self-center" style={{ color: '#475569' }}>
                  {multiplierDisplay}
                </span>

                <span
                  className="text-right font-mono tabular-nums text-xs self-center font-bold"
                  style={{ color: payoutDisplay.color }}
                >
                  {payoutDisplay.text}
                </span>

                <span className="flex justify-center self-center">
                  {bet.provablyFair != null ? (
                    <span
                      title={bet.provablyFair.verified ? 'Verified' : 'Not yet verified'}
                      className="text-[10px]"
                      style={{ color: bet.provablyFair.verified ? '#22c55e' : '#334155' }}
                    >
                      {bet.provablyFair.verified ? '✓' : '○'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-800">—</span>
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
            style={{ borderTop: '1px solid rgba(30,41,59,0.8)', background: 'rgba(2,6,23,0.5)' }}
          >
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all disabled:opacity-25"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)', color: '#94a3b8' }}
            >
              ← Prev
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                const p = i + 1;
                const active = page === p;
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className="w-7 h-7 rounded-lg text-[10px] font-mono transition-all"
                    style={active ? {
                      background: 'rgba(99,102,241,0.3)',
                      border: '1px solid rgba(99,102,241,0.5)',
                      color: '#a5b4fc',
                    } : {
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid rgba(30,41,59,0.6)',
                      color: '#475569',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              {pagination.totalPages > 7 && (
                <span className="text-slate-700 self-center text-[10px] px-1">…</span>
              )}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all disabled:opacity-25"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)', color: '#94a3b8' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {pagination && (
        <p className="text-[9px] text-slate-700 font-mono text-center">
          {pagination.total.toLocaleString()} total spins
        </p>
      )}
    </div>
  );
}