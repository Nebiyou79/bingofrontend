/**
 * pages/admin/games/spin.tsx
 * Spin bet history + SpinLock panel.
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Table, TR, TD, Pagination,
  Btn, Input, Modal, useToast, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { useSpinLock } from '../../../hooks/useAdmin';

// ── Spin Lock Panel ───────────────────────────────────────────────────────────

function SpinLockPanel() {
  const { state, auditLog, loading, busy, enable, disable, refetch } = useSpinLock();
  const { show, Toast } = useToast();
  const [modal, setModal]               = useState(false);
  const [notes, setNotes]               = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [disableModal, setDisableModal] = useState(false);

  const handleEnable = async () => {
    const res = await enable({ notes });
    if (res?.success) { show(res.message, 'ok'); setModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const handleDisable = async () => {
    const res = await disable(disableNotes);
    if (res?.success) { show('Spin lock disabled', 'ok'); setDisableModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const isOn = state?.enabled;

  return (
    <>
      <Toast />
      <Card className="mb-5">
        <SectionTitle action={
          isOn
            ? <Btn variant="danger" size="xs" disabled={busy} onClick={() => setDisableModal(true)}>
                {busy ? 'Working…' : 'Disable Lock'}
              </Btn>
            : <Btn variant="primary" size="xs" disabled={busy} onClick={() => setModal(true)}>
                Enable Lock
              </Btn>
        }>
          Spin Lock
        </SectionTitle>

        {loading ? (
          <p className="text-xs text-gray-700 animate-pulse">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Status</p>
              <span className="text-xs font-bold" style={{ color: isOn ? '#6ee7b7' : '#6b7280' }}>
                {isOn ? '● ACTIVE — All spins losing' : '○ OFF'}
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Enabled At</p>
              <p className="text-xs font-mono text-gray-400">{state?.enabledAt ? fmtDate(state.enabledAt) : '—'}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Games Played (locked)</p>
              <p className="text-xs font-bold font-mono" style={{ color: '#c4b5fd' }}>{state?.gamesPlayed ?? 0}</p>
            </div>
          </div>
        )}

        {isOn && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-[10px] text-gray-500"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            All spin results are being forced to a loss or refund. No wins will be paid until this lock is disabled.
          </div>
        )}

        {auditLog.length > 0 && (
          <>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Audit Log</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {auditLog.slice(0, 5).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="font-bold" style={{ color: e.action === 'enabled' ? '#6ee7b7' : '#fca5a5' }}>{e.action?.toUpperCase()}</span>
                  <span className="text-gray-500 font-mono">{e.adminUsername}</span>
                  <span className="text-gray-700">{fmtDate(e.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Enable Spin Lock">
        <div className="space-y-4">
          <div className="px-3 py-2.5 rounded-xl text-[10px] text-gray-500"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            When enabled, every spin result will be forced to a loss or refund. This takes effect on the very next spin.
          </div>
          <Input label="Notes" value={notes} onChange={setNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy} onClick={handleEnable}>{busy ? 'Enabling…' : 'Enable'}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Spin Lock">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Normal spin outcomes will be restored immediately.</p>
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

// ── Spin history ──────────────────────────────────────────────────────────────

function SpinHistory() {
  const [page, setPage]             = useState(1);
  const [spins, setSpins]           = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading]       = useState(true);

  React.useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('dashbets_token') ?? '';
    fetch(`/api/games/spin/bets?page=${page}&limit=25`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setSpins(d.bets ?? d.spins ?? []); setPagination(d.pagination); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card>
      <SectionTitle>Recent Spins</SectionTitle>
      <Table
        cols={['User', 'Bet', 'Result', 'Multiplier', 'Payout', 'Locked?', 'Date']}
        loading={loading}
        empty="No spins yet."
      >
        {spins.map(s => (
          <TR key={s._id}>
            <TD><span className="font-bold text-white text-[10px]">{s.userId?.username ?? '—'}</span></TD>
            <TD><span className="font-mono text-amber-400">{fmtETB(s.betAmount)}</span></TD>
            <TD><span className="font-mono text-gray-400 capitalize text-[10px]">{s.outcome ?? s.result ?? '—'}</span></TD>
            <TD><span className="font-mono text-gray-300">{s.multiplier != null ? `${s.multiplier}×` : '—'}</span></TD>
            <TD>
              <span className="font-mono font-bold" style={{ color: (s.payout ?? 0) > s.betAmount ? '#6ee7b7' : '#6b7280' }}>
                {fmtETB(s.payout ?? 0)}
              </span>
            </TD>
            <TD>
              {s.spinLocked
                ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>LOCKED</span>
                : <span className="text-gray-700 text-[10px]">—</span>
              }
            </TD>
            <TD>{fmtDate(s.createdAt)}</TD>
          </TR>
        ))}
      </Table>
      <Pagination
        page={pagination?.page ?? 1}
        totalPages={pagination?.totalPages ?? 1}
        onPage={setPage}
      />
    </Card>
  );
}

const AdminSpin: NextPage = () => (
  <>
    <Head>
      <title>Spin — DashBets Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </Head>
    <AdminLayout title="Spin">
      <SpinLockPanel />
      <SpinHistory />
    </AdminLayout>
  </>
);

export default AdminSpin;
