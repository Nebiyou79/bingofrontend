/**
 * pages/admin/index.tsx
 * Admin dashboard — overview stats, pending actions, live games, jackpots.
 */

import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useAuthContext } from '../../context/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, StatCard, SectionTitle, Badge, fmtETB, fmtDate, useToast } from '../../components/admin/AdminUI';
import { usePendingTransactions, useAdminDashboard } from '../../hooks/useAdmin';
import * as api from '../../lib/api/adminApi';

// ── Pending Transaction Row ───────────────────────────────────────────────────
function PendingRow({
  tx,
  onApprove,
  onReject,
  busy,
}: {
  tx: any;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const isDeposit = tx.type === 'deposit';
  return (
    <div
      className="flex items-center gap-4 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-white truncate">
            {tx.userId?.username ?? '—'}
          </span>
          <Badge status={tx.type} />
        </div>
        <p className="text-[10px] text-gray-600 font-mono">
          {fmtETB(tx.amount)} · {tx.method ?? '—'} · {fmtDate(tx.createdAt)}
        </p>
        {tx.reference && (
          <p className="text-[10px] text-gray-700 font-mono mt-0.5">ref: {tx.reference}</p>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          disabled={busy}
          onClick={onApprove}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'rgba(16,185,129,0.2)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#6ee7b7',
            opacity: busy ? 0.4 : 1,
          }}
        >
          ✓ OK
        </button>
        <button
          disabled={busy}
          onClick={onReject}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            opacity: busy ? 0.4 : 1,
          }}
        >
          ✗ Reject
        </button>
      </div>
    </div>
  );
}

// ── Jackpot Row ───────────────────────────────────────────────────────────────
const JP_COLORS: Record<string, string> = {
  grand: '#ef4444', major: '#f59e0b', minor: '#22d3ee', mini: '#10b981',
};

function JackpotRow({ jp }: { jp: any }) {
  const color = JP_COLORS[jp.type] ?? '#7c3aed';
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-xl mb-2 last:mb-0"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}25`,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span
          className="text-xs font-bold uppercase"
          style={{ color, fontFamily: "'Rajdhani', sans-serif" }}
        >
          {jp.type}
        </span>
        {!jp.isActive && (
          <span className="text-[9px] text-gray-700 font-mono">(off)</span>
        )}
      </div>
      <span className="text-sm font-bold text-white font-mono tabular-nums">
        {fmtETB(jp.amount)}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const AdminDashboard: NextPage = () => {
  const { user } = useAuthContext();
  const { data: dash, loading: dashLoading, refetch } = useAdminDashboard();
  const { transactions: pending, loading: pendingLoading, actionLoading, approve, reject } = usePendingTransactions();
  const { show, Toast } = useToast();

  if (!user || user.role !== 'admin') return null;

  const d = dash;

  const handleApprove = async (tx: any) => {
    const res = await approve(tx);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) refetch();
  };
  const handleReject = async (tx: any) => {
    const res = await reject(tx);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) refetch();
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard — DashBets</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Dashboard">
        <Toast />

        {/* ── Stat Grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Users" icon="👥"
            value={dashLoading ? '…' : (d?.users.total ?? 0).toLocaleString()}
            sub={`+${d?.users.newToday ?? 0} today`}
            accent="#c4b5fd" glow="#7c3aed"
          />
          <StatCard
            label="Pending Actions" icon="🔔"
            value={dashLoading ? '…' : (d?.pendingActions.total ?? 0)}
            sub={`${d?.pendingActions.deposits ?? 0} deposits · ${d?.pendingActions.withdrawals ?? 0} withdrawals`}
            accent="#fde68a" glow="#f59e0b"
          />
          <StatCard
            label="Revenue This Month" icon="💰"
            value={dashLoading ? '…' : fmtETB(d?.revenue.houseMonth ?? 0)}
            sub={`${fmtETB(d?.revenue.houseToday ?? 0)} today`}
            accent="#6ee7b7" glow="#10b981"
          />
          <StatCard
            label="Net Flow (Month)" icon="📈"
            value={dashLoading ? '…' : fmtETB(d?.financials.netFlow ?? 0)}
            sub={`${fmtETB(d?.financials.depositsThisMonth.total ?? 0)} in · ${fmtETB(d?.financials.withdrawalsThisMonth.total ?? 0)} out`}
            accent="#67e8f9" glow="#22d3ee"
          />
        </div>

        {/* ── Game Stats ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'SPIN',  data: d?.games.spin,  icon: '🎡', color: '#7c3aed' },
            { label: 'KENO',  data: d?.games.keno,  icon: '🔢', color: '#f59e0b' },
            { label: 'BINGO', data: d?.games.bingo, icon: '🎱', color: '#10b981' },
          ].map(({ label, data, icon, color }) => (
            <Card key={label}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{icon}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color, fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {label} (Month)
                </span>
              </div>
              {dashLoading ? (
                <p className="text-gray-700 font-mono animate-pulse text-xs">Loading…</p>
              ) : data ? (
                <div className="space-y-1.5">
                  <Row label="Bets / Entries" value={(data as any).bets?.toLocaleString() ?? (data as any).entries?.toLocaleString() ?? '—'} />
                  <Row label="Wagered" value={fmtETB((data as any).wagered ?? 0)} />
                  {(data as any).paid != null && <Row label="Paid Out" value={fmtETB((data as any).paid)} />}
                  {(data as any).houseEdge != null && <Row label="House Profit" value={fmtETB((data as any).houseEdge)} accent={color} />}
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        {/* ── Bottom Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pending Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <SectionTitle action={
                <Link href="/admin/transactions" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-mono">
                  View all →
                </Link>
              }>
                Pending Approval
              </SectionTitle>
              {pendingLoading ? (
                <p className="text-center py-8 text-gray-700 font-mono animate-pulse text-xs">Loading…</p>
              ) : pending.length === 0 ? (
                <p className="text-center py-8 text-gray-700 font-mono text-xs">✓ No pending transactions</p>
              ) : (
                pending.slice(0, 8).map(tx => (
                  <PendingRow
                    key={tx._id} tx={tx}
                    busy={actionLoading === tx._id}
                    onApprove={() => handleApprove(tx)}
                    onReject={() => handleReject(tx)}
                  />
                ))
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Live Games */}
            <Card>
              <SectionTitle>Live Games</SectionTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <span className="text-xs text-gray-400">🎱 Bingo Rooms</span>
                  <span className="text-sm font-bold text-indigo-300 font-mono">
                    {d?.liveGames.bingoRooms ?? '—'} active
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-xs text-gray-400">🔢 Keno Round</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    {d?.liveGames.kenoRound ? `#${d.liveGames.kenoRound.roundNumber}` : 'none'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Jackpots */}
            <Card>
              <SectionTitle action={
                <Link href="/admin/jackpots" className="text-[10px] text-purple-400 hover:text-purple-300 font-mono">
                  Manage →
                </Link>
              }>
                Jackpots
              </SectionTitle>
              {dashLoading ? (
                <p className="text-center text-gray-700 font-mono animate-pulse text-xs py-4">Loading…</p>
              ) : (d?.jackpots ?? []).map((jp: any) => (
                <JackpotRow key={jp.type} jp={jp} />
              ))}
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-600">{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color: accent ?? '#9ca3af' }}>{value}</span>
    </div>
  );
}

export default AdminDashboard;