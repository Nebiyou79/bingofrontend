/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/admin/games/pool.tsx
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, Table, TR, TD, Badge, Select, Pagination, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { useAdminPool } from '../../../hooks/useAdmin';

const STATUS_OPTS = [
  { value: '',          label: 'All Statuses' },
  { value: 'waiting',   label: 'Waiting' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

const MODE_OPTS = [
  { value: '',           label: 'All Modes' },
  { value: 'eightball',  label: '8-Ball' },
  { value: 'ethiopian',  label: 'Ethiopian' },
];

const AdminPool: NextPage = () => {
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [mode, setMode]     = useState('');

  const { games, pagination, loading, setParams } = useAdminPool({ page, limit: 20 });

  const applyFilters = (s: string, m: string) => {
    setPage(1);
    setParams({ page: 1, limit: 20, ...(s && { status: s }), ...(m && { mode: m }) });
  };

  return (
    <>
      <Head>
        <title>Pool Games — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Pool Games">
        <Card className="mb-4">
          <div className="flex gap-3 items-end flex-wrap">
            <Select
              label="Status"
              value={status}
              onChange={s => { setStatus(s); applyFilters(s, mode); }}
              options={STATUS_OPTS}
              className="w-40"
            />
            <Select
              label="Mode"
              value={mode}
              onChange={m => { setMode(m); applyFilters(status, m); }}
              options={MODE_OPTS}
              className="w-36"
            />
          </div>
        </Card>

        <Card>
          <Table
            cols={['Mode', 'Room', 'Stake', 'Status', 'Players', 'Winner', 'End Reason', 'Duration', 'Started', 'Ended']}
            loading={loading}
            empty="No pool games found."
          >
            {games.map(g => (
              <TR key={g._id}>
                <TD>
                  <span
                    className="text-xs font-bold uppercase"
                    style={{
                      color: g.mode === 'eightball' ? '#22d3ee' : '#f59e0b',
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    {g.mode === 'eightball' ? '🎱 8-Ball' : '🟡 Ethiopian'}
                  </span>
                </TD>
                <TD><span className="font-mono text-gray-500">#{g.roomNumber}</span></TD>
                <TD>
                  <span className="font-bold font-mono text-amber-400">
                    {g.stake > 0 ? fmtETB(g.stake) : 'Free'}
                  </span>
                </TD>
                <TD><Badge status={g.status} /></TD>
                <TD>
                  <div className="flex gap-1">
                    {(g.players ?? []).map((p: any, i: number) => (
                      <span key={i} className="text-[10px] font-bold text-white">
                        {p.userId?.username ?? '?'}
                        {i < g.players.length - 1 ? ' vs ' : ''}
                      </span>
                    ))}
                  </div>
                </TD>
                <TD>
                  {g.winner?.username ? (
                    <span className="font-bold text-emerald-400">{g.winner.username}</span>
                  ) : (
                    <span className="text-gray-700">—</span>
                  )}
                </TD>
                <TD>
                  {g.endReason ? (
                    <Badge status={g.endReason} />
                  ) : (
                    <span className="text-gray-700">—</span>
                  )}
                </TD>
                <TD>
                  {g.durationSecs != null ? (
                    <span className="font-mono text-gray-500 text-[10px]">
                      {Math.floor(g.durationSecs / 60)}m {g.durationSecs % 60}s
                    </span>
                  ) : (
                    <span className="text-gray-700">—</span>
                  )}
                </TD>
                <TD>{g.startedAt ? fmtDate(g.startedAt) : <span className="text-gray-700">—</span>}</TD>
                <TD>{g.endedAt   ? fmtDate(g.endedAt)   : <span className="text-gray-700">—</span>}</TD>
              </TR>
            ))}
          </Table>

          <Pagination
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPage={p => { setPage(p); setParams(prev => ({ ...prev, page: p })); }}
          />
        </Card>
      </AdminLayout>
    </>
  );
};

export default AdminPool;