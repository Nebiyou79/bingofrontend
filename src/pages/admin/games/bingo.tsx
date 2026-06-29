/**
 * pages/admin/games/bingo.tsx
 * Bingo room list + Auto-Win lock panel.
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Table, TR, TD, Badge, Select, Pagination,
  Btn, Input, Modal, useToast, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { useAdminBingo, useAutoWin } from '../../../hooks/useAdmin';

const STATUS_OPTS = [
  { value: '',          label: 'All Statuses' },
  { value: 'waiting',   label: 'Waiting'   },
  { value: 'playing',   label: 'Playing'   },
  { value: 'finished',  label: 'Finished'  },
  { value: 'cancelled', label: 'Cancelled' },
];

// ── Auto-Win lock panel ───────────────────────────────────────────────────────

function AutoWinPanel() {
  const { state, auditLog, loading, busy, enable, disable, refetch } = useAutoWin();
  const { show, Toast } = useToast();
  const [modal, setModal]         = useState(false);
  const [cardNums, setCardNums]   = useState('');
  const [gamesLimit, setGamesLimit] = useState('');
  const [maxDraws, setMaxDraws]   = useState('');
  const [notes, setNotes]         = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [disableModal, setDisableModal] = useState(false);

  const handleEnable = async () => {
    const nums = cardNums.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (!nums.length) { show('Enter at least one card number', 'err'); return; }
    const res = await enable({
      targetCardNumbers: nums,
      gamesLimit:  gamesLimit ? Number(gamesLimit)  : null,
      maxDrawsToWin: maxDraws ? Number(maxDraws)    : null,
      notes,
    });
    if (res?.success) { show(res.message, 'ok'); setModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const handleDisable = async () => {
    const res = await disable(disableNotes);
    if (res?.success) { show('Auto-win disabled', 'ok'); setDisableModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const isOn = state?.enabled;
  const gamesRemaining = state?.gamesLimit
    ? Math.max(0, state.gamesLimit - (state.gamesPlayed ?? 0))
    : null;

  return (
    <>
      <Toast />
      <Card className="mb-5">
        <SectionTitle action={
          isOn
            ? <Btn variant="danger" size="xs" disabled={busy} onClick={() => setDisableModal(true)}>
                {busy ? 'Working…' : 'Disable Auto-Win'}
              </Btn>
            : <Btn variant="primary" size="xs" disabled={busy} onClick={() => setModal(true)}>
                Enable Auto-Win
              </Btn>
        }>
          Auto-Win Lock
        </SectionTitle>

        {loading ? (
          <p className="text-xs text-gray-700 animate-pulse">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Status pill */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Status</p>
              <span className="text-xs font-bold" style={{ color: isOn ? '#6ee7b7' : '#6b7280' }}>
                {isOn ? '● ACTIVE' : '○ OFF'}
              </span>
            </div>
            {/* Target numbers */}
            <div className="rounded-xl p-3 col-span-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Target Card Numbers</p>
              <p className="text-xs font-mono text-amber-400">
                {state?.targetCardNumbers?.length ? state.targetCardNumbers.join(', ') : '—'}
              </p>
            </div>
            {/* Games remaining */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Games Remaining</p>
              <p className="text-xs font-bold font-mono" style={{ color: '#c4b5fd' }}>
                {gamesRemaining === null ? '∞' : gamesRemaining}
              </p>
            </div>
          </div>
        )}

        {/* Audit log */}
        {auditLog.length > 0 && (
          <>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Audit Log</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {auditLog.slice(0, 5).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="font-bold" style={{ color: e.action === 'enabled' ? '#6ee7b7' : '#fca5a5' }}>
                    {e.action?.toUpperCase()}
                  </span>
                  <span className="text-gray-600 font-mono">{e.adminUsername}</span>
                  <span className="text-gray-700">{fmtDate(e.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Enable modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Enable Auto-Win">
        <div className="space-y-4">
          <Input label="Target Card Numbers (comma-separated)" value={cardNums} onChange={setCardNums} placeholder="e.g. 12, 34, 67" />
          <Input label="Max Draws to Win (optional)" value={maxDraws} onChange={setMaxDraws} type="number" placeholder="e.g. 45" />
          <Input label="Games Limit (blank = unlimited)" value={gamesLimit} onChange={setGamesLimit} type="number" placeholder="e.g. 10" />
          <Input label="Notes" value={notes} onChange={setNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy} onClick={handleEnable}>{busy ? 'Enabling…' : 'Enable'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Disable modal */}
      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Auto-Win">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Auto-win will be turned off immediately and normal RNG restored.</p>
          <Input label="Notes (optional)" value={disableNotes} onChange={setDisableNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setDisableModal(false)}>Cancel</Btn>
            <Btn variant="danger" disabled={busy} onClick={handleDisable}>{busy ? 'Disabling…' : 'Disable'}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminBingo: NextPage = () => {
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const { rooms, pagination, loading, setParams } = useAdminBingo({ page, limit: 20 });

  const applyFilter = (s: string) => {
    setStatus(s);
    setPage(1);
    setParams({ page: 1, limit: 20, ...(s && { status: s }) });
  };

  return (
    <>
      <Head>
        <title>Bingo — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Bingo">
        <AutoWinPanel />

        <Card className="mb-4">
          <Select label="Status Filter" value={status} onChange={applyFilter} options={STATUS_OPTS} className="w-48" />
        </Card>

        <Card>
          <SectionTitle>Bingo Rooms</SectionTitle>
          <Table cols={['Stake', 'Room #', 'Status', 'Players', 'Pool', 'Pattern', 'Created', 'Ended']} loading={loading} empty="No rooms found.">
            {rooms.map(r => (
              <TR key={r._id}>
                <TD><span className="font-bold text-amber-400 font-mono">{fmtETB(r.stakeAmount)}</span></TD>
                <TD><span className="font-mono text-gray-400">#{r.roomNumber}</span></TD>
                <TD><Badge status={r.status} /></TD>
                <TD>
                  <span className="font-bold text-white">{r.playerCount}</span>
                  <span className="text-gray-700"> / 200</span>
                </TD>
                <TD><span className="font-mono text-emerald-400">{fmtETB(r.jackpotPool)}</span></TD>
                <TD>{r.activePattern ?? <span className="text-gray-700">—</span>}</TD>
                <TD>{fmtDate(r.createdAt)}</TD>
                <TD>{r.gameEndedAt ? fmtDate(r.gameEndedAt) : <span className="text-gray-700">—</span>}</TD>
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

export default AdminBingo;
