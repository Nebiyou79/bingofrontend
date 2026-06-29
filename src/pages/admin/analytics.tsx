/**
 * pages/admin/analytics.tsx
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, SectionTitle, StatCard, Btn, Select, fmtETB, fmtNum } from '../../components/admin/AdminUI';
import { useAdminAnalytics } from '../../hooks/useAdmin';

const PERIOD_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
];

// Simple bar chart using SVG
function MiniBar({ data, color, valueKey = 'total', labelKey = '_id' }: {
  data: any[]; color: string; valueKey?: string; labelKey?: string;
}) {
  if (!data?.length) return <p className="text-xs text-gray-700 font-mono py-4 text-center">No data</p>;
  const max = Math.max(...data.map(d => d[valueKey] ?? 0), 1);
  return (
    <div className="flex items-end gap-1 h-20 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max(4, ((d[valueKey] ?? 0) / max) * 72)}px`,
              background: `linear-gradient(180deg, ${color}, ${color}80)`,
              minWidth: 4,
            }}
          />
          <span className="text-[7px] text-gray-700 font-mono truncate w-full text-center">
            {String(d[labelKey] ?? '').slice(-5)}
          </span>
        </div>
      ))}
    </div>
  );
}

const AdminAnalytics: NextPage = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading }   = useAdminAnalytics(period);
  const s = data?.summary;

  return (
    <>
      <Head>
        <title>Analytics — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Analytics">
        {/* Period Selector */}
        <div className="flex gap-2 mb-5">
          {PERIOD_OPTS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: period === p.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${period === p.value ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: period === p.value ? '#c4b5fd' : '#6b7280',
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-20 text-gray-700 font-mono animate-pulse">Loading…</p>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Deposited"     icon="⬇️" value={fmtETB(s?.totalDeposited ?? 0)} accent="#6ee7b7" glow="#10b981" />
              <StatCard label="Withdrawn"     icon="⬆️" value={fmtETB(s?.totalWithdrawn ?? 0)} accent="#fca5a5" glow="#ef4444" />
              <StatCard label="Net Flow"      icon="💱" value={fmtETB(s?.netFlow ?? 0)}         accent="#fde68a" glow="#f59e0b" />
              <StatCard label="Spin Profit"   icon="🎡" value={fmtETB(s?.spinHouseProfit ?? 0)} accent="#c4b5fd" glow="#7c3aed" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <Card>
                <SectionTitle>Daily Deposits</SectionTitle>
                <MiniBar data={data?.charts?.depositsByDay ?? []} color="#10b981" />
              </Card>
              <Card>
                <SectionTitle>Daily Withdrawals</SectionTitle>
                <MiniBar data={data?.charts?.withdrawalsByDay ?? []} color="#ef4444" />
              </Card>
              <Card>
                <SectionTitle>Spin Bets by Day</SectionTitle>
                <MiniBar data={data?.charts?.spinByDay ?? []} color="#7c3aed" valueKey="wagered" />
              </Card>
              <Card>
                <SectionTitle>New Users by Day</SectionTitle>
                <MiniBar data={data?.charts?.newUsersByDay ?? []} color="#f59e0b" valueKey="count" />
              </Card>
            </div>

            {/* Top Users */}
            <Card>
              <SectionTitle>Top 10 Players by Wagered</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['#','Username','Spins','Wagered','Won','P&L'].map(c => (
                        <th key={c} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-gray-600"
                          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topUsers ?? []).map((u: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-2.5 text-gray-700 font-mono">{i + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-white">{u.username}</td>
                        <td className="px-3 py-2.5 text-gray-500 font-mono">{fmtNum(u.spins)}</td>
                        <td className="px-3 py-2.5 text-amber-400 font-mono">{fmtETB(u.wagered)}</td>
                        <td className="px-3 py-2.5 text-emerald-400 font-mono">{fmtETB(u.won)}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: u.net >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                          {u.net >= 0 ? '+' : ''}{fmtETB(u.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminAnalytics;