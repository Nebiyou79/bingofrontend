/**
 * components/wallet/BalanceCard.tsx
 * Displays the user's wallet balances with a refresh button and skeleton state.
 */

import React from 'react';

interface BalanceCardProps {
  balance: number;
  bonusBalance: number;
  total: number;
  loading: boolean;
  onRefresh: () => void | Promise<void>;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-700 rounded ${className}`} />;
}

/** Shows total, withdrawable, and bonus balances in ETB. */
export function BalanceCard({ balance, bonusBalance, total, loading, onRefresh }: BalanceCardProps) {
  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Total Balance</p>
          {loading ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <p className="text-4xl font-bold text-white tracking-tight">
              ETB <span className="font-mono">{fmt(total)}</span>
            </p>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition text-gray-400 hover:text-white"
          aria-label="Refresh balance"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Withdrawable</p>
          {loading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <p className="text-lg font-semibold text-green-400 font-mono">{fmt(balance)}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">ETB</p>
        </div>
        <div className="bg-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bonus / Locked</p>
          {loading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <p className="text-lg font-semibold text-purple-400 font-mono">{fmt(bonusBalance)}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">ETB</p>
        </div>
      </div>
    </div>
  );
}