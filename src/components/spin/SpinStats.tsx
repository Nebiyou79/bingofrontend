/**
 * components/spin/SpinStats.tsx
 * Compact horizontal card showing today's session statistics.
 */

import React from 'react';
import type { TodayStats } from '../../lib/api/spinApi';

interface SpinStatsProps {
  stats: TodayStats;
}

interface StatItem {
  label: string;
  value: string;
  className?: string;
}

/**
 * Displays today's totals: spins, win rate, bet, won, and net P&L.
 * Net P&L is coloured green (profit) or red (loss).
 */
export function SpinStats({ stats }: SpinStatsProps) {
  const winRate =
    stats.totalSpins > 0
      ? Math.round((stats.wins / stats.totalSpins) * 100)
      : 0;

  const pnlPositive = stats.netPnl >= 0;

  const items: StatItem[] = [
    {
      label: 'Spins Today',
      value: stats.totalSpins.toString(),
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      className: winRate >= 50 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Total Bet',
      value: `${stats.totalBet.toLocaleString()} ETB`,
    },
    {
      label: 'Total Won',
      value: `${stats.totalWon.toLocaleString()} ETB`,
      className: 'text-green-400',
    },
    {
      label: 'Net P&L',
      value: `${pnlPositive ? '+' : ''}${stats.netPnl.toLocaleString()} ETB`,
      className: pnlPositive ? 'text-green-400' : 'text-red-400',
    },
  ];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 px-4 py-3">
      <p className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-3 text-center">
        Today`s Session
      </p>
      <div className="grid grid-cols-5 gap-2 text-center">
        {items.map(({ label, value, className }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                className ?? 'text-gray-100'
              }`}
            >
              {value}
            </span>
            <span className="text-xs text-gray-500 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
