// components/mines/MultiplierTable.tsx
/**
 * DashBets — Mines Multiplier Table
 *
 * Matches the redesigned game UI:
 *   - Same panel chrome language as the bet panel (flat dark card,
 *     thin hairline borders, no heavy glow)
 *   - Gem / mine count rendered with the shared icon set instead of emoji
 *   - Current reveal row highlighted with a left accent bar, like a
 *     live-odds row on a real sportsbook ticket
 *
 * The table is computed entirely client-side using the same hypergeometric
 * formula as minesEngine.js, so it always matches the backend exactly and
 * there is no need to fetch /api/games/mines/multiplier-table on every
 * mine-count change. The API fetch still happens once on mount as a sanity
 * check; if it fails the client-side calculation is used as fallback.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { getMultiplierTable, MultiplierRow } from '../../lib/api/minesApi';
import { IconGem, IconBomb } from '../icons/GameIcons';

// ── Client-side multiplier calculation (mirrors minesEngine.js exactly) ────────

const GRID_SIZE  = 25;
const HOUSE_EDGE = 0.04;

function calcMult(mineCount: number, reveals: number): number {
  if (reveals <= 0) return 1.00;
  const safe = GRID_SIZE - mineCount;
  if (safe <= 0 || reveals > safe) return 1.00;
  let prob = 1;
  for (let r = 0; r < reveals; r++) {
    prob *= (safe - r) / (GRID_SIZE - r);
  }
  return Math.max(1.00, Math.floor((1 / prob) * (1 - HOUSE_EDGE) * 100) / 100);
}

function buildClientTable(mineCount: number): MultiplierRow[] {
  const safe = GRID_SIZE - mineCount;
  return Array.from({ length: safe }, (_, i) => ({
    reveals:    i + 1,
    multiplier: calcMult(mineCount, i + 1),
  }));
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface MultiplierTableProps {
  mineCount:      number;
  betAmount:      number;
  currentReveals: number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MultiplierTable({ mineCount, betAmount, currentReveals }: MultiplierTableProps) {
  // Use API-fetched table as source of truth; fall back to client calc if fetch fails
  const [apiTable,  setApiTable]  = useState<Record<number, MultiplierRow[]>>({});
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMultiplierTable().then(res => {
      if (cancelled) return;
      if (res.success) setApiTable(res.table);
      setFetchDone(true);
    }).catch(() => setFetchDone(true));
    return () => { cancelled = true; };
  }, []);

  // Prefer API data; fall back to client calculation
  const rows = useMemo<MultiplierRow[]>(() => {
    if (fetchDone && apiTable[mineCount]) return apiTable[mineCount];
    return buildClientTable(mineCount);
  }, [apiTable, fetchDone, mineCount]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#11132238', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Payout Table
        </p>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
          style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <IconBomb size={12} className="text-orange-400" />
          <span className="text-xs font-bold text-orange-300 font-mono">{mineCount}</span>
        </div>
      </div>

      {/* ── Column headers ── */}
      <div
        className="grid grid-cols-3 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span>Gems</span>
        <span className="text-right">Mult</span>
        <span className="text-right">Payout</span>
      </div>

      {/* ── Rows ── */}
      <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
        {rows.map(row => {
          const isPast    = row.reveals < currentReveals;
          const isCurrent = row.reveals === currentReveals && currentReveals > 0;
          const payout    = Math.floor(betAmount * row.multiplier);

          return (
            <div
              key={row.reveals}
              className="grid grid-cols-3 items-center px-4 py-2 text-xs transition-all"
              style={{
                background: isCurrent ? 'rgba(59,130,246,0.10)' : 'transparent',
                borderLeft: isCurrent ? '2px solid #3b82f6' : '2px solid transparent',
                opacity: isPast ? 0.32 : 1,
                borderBottom: '1px solid rgba(255,255,255,0.025)',
              }}
            >
              {/* Gems column */}
              <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                <IconGem size={13} className="text-blue-400" />
                ×{row.reveals}
              </span>

              {/* Multiplier column */}
              <span
                className="text-right font-bold font-mono"
                style={{ color: isCurrent ? '#93c5fd' : '#fbbf24' }}
              >
                {row.multiplier.toFixed(2)}x
              </span>

              {/* Payout column */}
              <span className="text-right font-mono text-gray-500">
                {payout >= 10_000
                  ? `${(payout / 1_000).toFixed(0)}K`
                  : payout >= 1_000
                  ? `${(payout / 1_000).toFixed(1)}K`
                  : payout.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div
        className="px-4 py-2.5 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-[10px] text-gray-600">
          4% house edge · Provably fair
        </p>
      </div>
    </div>
  );
}