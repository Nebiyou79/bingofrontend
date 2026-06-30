/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/admin/games/plinko.tsx
 * Plinko bet history + PlinkoLock panel.
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Table, TR, TD, Pagination,
  Btn, Input, Select, Modal, useToast, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { usePlinkoLock } from '../../../hooks/useAdmin';

const SPREAD_OPTS = [
  { value: '0', label: '0 — exact centre bucket only (most aggressive)' },
  { value: '1', label: '1 — centre ± 1 bucket' },
  { value: '2', label: '2 — centre ± 2 buckets (subtlest)' },
];

// ── Plinko Lock Panel ─────────────────────────────────────────────────────────

function PlinkoLockPanel() {
  const { state, auditLog, loading, busy, enable, disable, refetch } = usePlinkoLock();
  const { show, Toast } = useToast();
  const [modal, setModal]               = useState(false);
  const [centerSpread, setCenterSpread] = useState('1');
  const [gamesLimit, setGamesLimit]     = useState('');
  const [notes, setNotes]               = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [disableModal, setDisableModal] = useState(false);

  const handleEnable = async () => {
    const res = await enable({
      centerSpread: Number(centerSpread) as 0 | 1 | 2,
      gamesLimit:   gamesLimit ? Number(gamesLimit) : null,
      notes,
    });
    if (res?.success) { show(res.message, 'ok'); setModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const handleDisable = async () => {
    const res = await disable(disableNotes);
    if (res?.success) { show('Plinko lock disabled', 'ok'); setDisableModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const isOn = state?.enabled;
  const gamesRemaining = state?.gamesLimit != null
    ? Math.max(0, state.gamesLimit - (state.gamesPlayed ?? 0))
    : null;

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
          Plinko Ball-Path Lock
        </SectionTitle>

        {loading ? (
          <p className="text-xs text-gray-700 animate-pulse">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Status</p>
              <span className="text-xs font-bold" style={{ color: isOn ? '#6ee7b7' : '#6b7280' }}>
                {isOn ? '● ACTIVE' : '○ OFF'}
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Center Spread</p>
              <p className="text-xs font-mono text-amber-400">
                {state?.centerSpread != null ? `±${state.centerSpread} buckets` : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Games Played</p>
              <p className="text-xs font-mono text-gray-400">{state?.gamesPlayed ?? 0}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Games Remaining</p>
              <p className="text-xs font-bold font-mono" style={{ color: '#c4b5fd' }}>
                {gamesRemaining === null ? '∞' : gamesRemaining}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {isOn && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-[10px] text-gray-500"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            Ball paths are being steered toward the centre low-payout buckets.
            Players`` provably-fair seeds are authentic — the path algorithm selects from constrained buckets.
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

      <Modal open={modal} onClose={() => setModal(false)} title="Enable Plinko Lock">
        <div className="space-y-4">
          <Select label="Center Spread" value={centerSpread} onChange={setCenterSpread} options={SPREAD_OPTS} />
          <Input label="Games Limit (blank = unlimited)" value={gamesLimit} onChange={setGamesLimit} type="number" placeholder="e.g. 20" />
          <Input label="Notes" value={notes} onChange={setNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy} onClick={handleEnable}>{busy ? 'Enabling…' : 'Enable'}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Plinko Lock">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">All subsequent drops will use normal provably-fair RNG.</p>
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

// ── Bet history ───────────────────────────────────────────────────────────────

function PlinkoHistory() {
  const [page, setPage]             = useState(1);
  const [bets, setBets]             = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading]       = useState(true);

  React.useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('dashbets_token') ?? '';
    fetch(`/api/games/plinko/bets?page=${page}&limit=25`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setBets(d.bets); setPagination(d.pagination); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card>
      <SectionTitle>Recent Bets</SectionTitle>
      <Table
        cols={['User', 'Rows', 'Risk', 'Bet', 'Bucket', 'Multiplier', 'Payout', 'Locked?', 'Date']}
        loading={loading}
        empty="No bets yet."
      >
        {bets.map(b => (
          <TR key={b._id}>
            <TD><span className="font-bold text-white text-[10px]">{b.userId?.username ?? '—'}</span></TD>
            <TD><span className="font-mono text-gray-400">{b.rows}</span></TD>
            <TD><span className="font-mono text-gray-400 capitalize">{b.risk}</span></TD>
            <TD><span className="font-mono text-amber-400">{fmtETB(b.betAmount)}</span></TD>
            <TD><span className="font-mono text-gray-400">{b.bucketIndex ?? '—'}</span></TD>
            <TD><span className="font-mono text-gray-300">{b.multiplier != null ? `${b.multiplier}×` : '—'}</span></TD>
            <TD>
              <span className="font-mono font-bold" style={{ color: b.payout > b.betAmount ? '#6ee7b7' : '#6b7280' }}>
                {fmtETB(b.payout)}
              </span>
            </TD>
            <TD>
              {b.plinkoLocked
                ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>LOCKED</span>
                : <span className="text-gray-700 text-[10px]">—</span>
              }
            </TD>
            <TD>{fmtDate(b.createdAt)}</TD>
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

const AdminPlinko: NextPage = () => (
  <>
    <Head>
      <title>Plinko — DashBets Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </Head>
    <AdminLayout title="Plinko">
      <PlinkoLockPanel />
      <PlinkoHistory />
    </AdminLayout>
  </>
);

export default AdminPlinko;
