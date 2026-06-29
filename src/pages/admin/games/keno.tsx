/**
 * pages/admin/games/keno.tsx
 * Keno round list + KenoLock panel.
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Table, TR, TD, Badge, Select, Pagination,
  Btn, Input, Modal, useToast, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { useAdminKeno, useKenoLock } from '../../../hooks/useAdmin';

const STATUS_OPTS = [
  { value: '',        label: 'All Statuses' },
  { value: 'betting', label: 'Betting'  },
  { value: 'drawing', label: 'Drawing'  },
  { value: 'settled', label: 'Settled'  },
];

const STRATEGY_OPTS = [
  { value: 'minimize_payout', label: 'Minimize Payout — lowest projected payout draw' },
  { value: 'avoid_picks',     label: 'Avoid Picks — avoids most-picked numbers (subtler)' },
];

// ── Keno Lock Panel ───────────────────────────────────────────────────────────

function KenoLockPanel() {
  const { state, auditLog, loading, busy, enable, disable, refetch } = useKenoLock();
  const { show, Toast } = useToast();
  const [modal, setModal]           = useState(false);
  const [strategy, setStrategy]     = useState('minimize_payout');
  const [sampleSize, setSampleSize] = useState('200');
  const [gamesLimit, setGamesLimit] = useState('');
  const [notes, setNotes]           = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [disableModal, setDisableModal] = useState(false);

  const handleEnable = async () => {
    const res = await enable({
      strategy:   strategy as any,
      sampleSize: sampleSize ? Number(sampleSize) : 200,
      gamesLimit: gamesLimit ? Number(gamesLimit) : null,
      notes,
    });
    if (res?.success) { show(res.message, 'ok'); setModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const handleDisable = async () => {
    const res = await disable(disableNotes);
    if (res?.success) { show('Keno lock disabled', 'ok'); setDisableModal(false); refetch(); }
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
          Keno Draw Lock
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
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Strategy</p>
              <p className="text-xs font-mono text-amber-400">{state?.strategy ?? '—'}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Sample Size</p>
              <p className="text-xs font-mono text-gray-400">{state?.sampleSize ?? '—'}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Rounds Remaining</p>
              <p className="text-xs font-bold font-mono" style={{ color: '#c4b5fd' }}>
                {gamesRemaining === null ? '∞' : gamesRemaining}
              </p>
            </div>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Enable Keno Lock">
        <div className="space-y-4">
          <Select label="Strategy" value={strategy} onChange={setStrategy} options={STRATEGY_OPTS} />
          <Input label="Sample Size (50–500, default 200)" value={sampleSize} onChange={setSampleSize} type="number" placeholder="200" />
          <Input label="Rounds Limit (blank = unlimited)" value={gamesLimit} onChange={setGamesLimit} type="number" placeholder="e.g. 5" />
          <Input label="Notes" value={notes} onChange={setNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy} onClick={handleEnable}>{busy ? 'Enabling…' : 'Enable'}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Keno Lock">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Normal random draw will be restored immediately.</p>
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

const AdminKeno: NextPage = () => {
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { rounds, pagination, loading, setParams } = useAdminKeno({ page, limit: 20 });

  const applyFilter = (s: string) => {
    setStatus(s);
    setPage(1);
    setParams({ page: 1, limit: 20, ...(s && { status: s }) });
  };

  const loadDetail = async (roundId: string) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('dashbets_token') ?? '';
      const res = await fetch(`/api/admin/keno/rounds/${roundId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDetail(data);
    } catch (_) {}
    finally { setDetailLoading(false); }
  };

  return (
    <>
      <Head>
        <title>Keno — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Keno">
        <KenoLockPanel />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Round list */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <Select label="Status Filter" value={status} onChange={applyFilter} options={STATUS_OPTS} className="w-48" />
            </Card>
            <Card>
              <SectionTitle>Keno Rounds</SectionTitle>
              <Table cols={['Round #', 'Status', 'Bets', 'Wagered', 'Payout', 'Locked?', 'Opened', 'Settled']} loading={loading} empty="No rounds found.">
                {rounds.map(r => (
                  <TR key={r._id} onClick={() => loadDetail(r._id)}>
                    <TD><span className="font-bold text-white font-mono">#{r.roundNumber}</span></TD>
                    <TD><Badge status={r.status} /></TD>
                    <TD><span className="font-mono text-gray-400">{r.totalBets}</span></TD>
                    <TD><span className="font-mono text-amber-400">{fmtETB(r.totalWagered)}</span></TD>
                    <TD><span className="font-mono text-emerald-400">{fmtETB(r.totalPayout)}</span></TD>
                    <TD>
                      {r.kenoLocked
                        ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                            LOCKED · {r.kenoLockStrategy}
                          </span>
                        : <span className="text-gray-700 text-[10px]">—</span>
                      }
                    </TD>
                    <TD>{fmtDate(r.bettingOpensAt)}</TD>
                    <TD>{r.settledAt ? fmtDate(r.settledAt) : <span className="text-gray-700">—</span>}</TD>
                  </TR>
                ))}
              </Table>
              <Pagination
                page={pagination?.page ?? 1}
                totalPages={pagination?.totalPages ?? 1}
                onPage={p => { setPage(p); setParams(prev => ({ ...prev, page: p })); }}
              />
            </Card>
          </div>

          {/* Round detail */}
          <div>
            <Card style={{ minHeight: 300 }}>
              {detailLoading ? (
                <p className="text-center py-10 text-gray-700 font-mono animate-pulse text-xs">Loading…</p>
              ) : detail ? (
                <>
                  <p className="text-xs font-extrabold text-white mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    ROUND #{detail.round.roundNumber}
                  </p>
                  {detail.round.drawnNumbers?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Drawn Numbers</p>
                      <div className="flex flex-wrap gap-1">
                        {detail.round.drawnNumbers.map((n: number) => (
                          <span key={n} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono"
                            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}>
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.round.kenoLocked && (
                    <div className="mb-3 px-2.5 py-2 rounded-lg text-[10px]"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <span className="text-red-400 font-bold">⚠ Admin-locked draw</span>
                      <span className="text-gray-600 ml-2">strategy: {detail.round.kenoLockStrategy}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    Tickets ({detail.tickets?.length ?? 0})
                  </p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {(detail.tickets ?? []).map((t: any) => (
                      <div key={t._id} className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <p className="text-[10px] font-bold text-white">{t.userId?.username ?? '—'}</p>
                          <p className="text-[9px] text-gray-700 font-mono">{t.pickedNumbers?.join(', ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-amber-400">{fmtETB(t.betAmount)}</p>
                          {t.status === 'settled' && (
                            <p className="text-[9px] font-bold font-mono" style={{ color: t.payout > 0 ? '#6ee7b7' : '#6b7280' }}>
                              {t.payout > 0 ? `+${fmtETB(t.payout)}` : 'Loss'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center py-10 text-gray-700 font-mono text-xs">Click a round to view detail</p>
              )}
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminKeno;
