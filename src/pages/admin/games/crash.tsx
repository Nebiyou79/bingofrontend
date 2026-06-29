/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/admin/games/crash.tsx
 * Crash round history + CrashLock panel.
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Table, TR, TD, Pagination,
  Btn, Input, Select, Modal, useToast, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { useCrashLock } from '../../../hooks/useAdmin';

const MODE_OPTS = [
  { value: 'instant', label: 'Instant — always crash at 1.00×' },
  { value: 'capped',  label: 'Capped — crash at or below max multiplier' },
];

// ── Crash Lock Panel ──────────────────────────────────────────────────────────

function CrashLockPanel() {
  const { state, auditLog, loading, busy, enable, disable, refetch } = useCrashLock();
  const { show, Toast } = useToast();
  const [modal, setModal]               = useState(false);
  const [mode, setMode]                 = useState<'instant' | 'capped'>('instant');
  const [maxMultiplier, setMaxMultiplier] = useState('1.5');
  const [gamesLimit, setGamesLimit]     = useState('');
  const [notes, setNotes]               = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [disableModal, setDisableModal] = useState(false);

const handleEnable = async () => {
  if (mode === 'capped' && Number(maxMultiplier) < 1) {
    show('Max multiplier must be ≥ 1.00', 'err'); 
    return;
  }
  
  const payload: any = {
    mode,
    gamesLimit: gamesLimit ? Number(gamesLimit) : null,
    notes,
  };
  
  if (mode === 'capped') {
    payload.maxMultiplier = Number(maxMultiplier);
  }
  
  // DEBUG: Log what we're sending
  console.log('Sending payload:', JSON.stringify(payload));
    // ... rest  
  const res = await enable(payload);
  if (res?.success) { show(res.message, 'ok'); setModal(false); refetch(); }
  else              { show((res as any)?.error ?? 'Failed', 'err'); }
};

  const handleDisable = async () => {
    const res = await disable(disableNotes);
    if (res?.success) { show('Crash lock disabled', 'ok'); setDisableModal(false); refetch(); }
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
          Crash Lock
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
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Mode</p>
              <p className="text-xs font-mono text-amber-400">{state?.mode ?? '—'}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Max Multiplier</p>
              <p className="text-xs font-mono text-gray-400">
                {state?.mode === 'capped' ? `${state.maxMultiplier}×` : '—'}
              </p>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Enable Crash Lock">
        <div className="space-y-4">
          <Select label="Mode" value={mode} onChange={v => setMode(v as any)} options={MODE_OPTS} />
          {mode === 'capped' && (
            <Input label="Max Multiplier (e.g. 1.5)" value={maxMultiplier} onChange={setMaxMultiplier} type="number" placeholder="1.5" />
          )}
          <Input label="Rounds Limit (blank = unlimited)" value={gamesLimit} onChange={setGamesLimit} type="number" placeholder="e.g. 10" />
          <Input label="Notes" value={notes} onChange={setNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy} onClick={handleEnable}>{busy ? 'Enabling…' : 'Enable'}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Crash Lock">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Provably-fair RNG will be restored on the next round.</p>
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

// ── Round history (paginated REST) ─────────────────────────────────────────────

function CrashHistory() {
  const [page, setPage]   = useState(1);
  const [rounds, setRounds]     = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [detail, setDetail]     = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('dashbets_token') ?? '';
    fetch(`/api/games/crash/rounds?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setRounds(d.rounds); setPagination(d.pagination); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('dashbets_token') ?? '';
      const res = await fetch(`/api/games/crash/rounds/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setDetail(d.round);
    } catch (_) {}
    finally { setDetailLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* List */}
      <div className="lg:col-span-2">
        <Card>
          <SectionTitle>Round History</SectionTitle>
          <Table
            cols={['Round #', 'Crash Point', 'Bets', 'Wagered', 'Locked?', 'Date']}
            loading={loading}
            empty="No rounds yet."
          >
            {rounds.map(r => (
              <TR key={r._id} onClick={() => loadDetail(r._id)}>
                <TD><span className="font-bold text-white font-mono">#{r.roundNumber}</span></TD>
                <TD>
                  <span className="font-bold font-mono" style={{
                    color: r.crashPoint <= 1.5 ? '#fca5a5' : r.crashPoint >= 5 ? '#6ee7b7' : '#fde68a'
                  }}>
                    {r.crashPoint?.toFixed(2)}×
                  </span>
                </TD>
                <TD><span className="font-mono text-gray-400">{r.bets?.length ?? 0}</span></TD>
                <TD><span className="font-mono text-amber-400">{fmtETB(r.totalWagered)}</span></TD>
                <TD>
                  {r.crashLocked
                    ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                        LOCKED · {r.crashLockMode}
                      </span>
                    : <span className="text-gray-700 text-[10px]">—</span>
                  }
                </TD>
                <TD>{fmtDate(r.createdAt)}</TD>
              </TR>
            ))}
          </Table>
          <Pagination
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPage={setPage}
          />
        </Card>
      </div>

      {/* Detail */}
      <div>
        <Card style={{ minHeight: 300 }}>
          {detailLoading ? (
            <p className="text-center py-10 text-gray-700 font-mono animate-pulse text-xs">Loading…</p>
          ) : detail ? (
            <>
              <p className="text-xs font-extrabold text-white mb-3" style={{ fontFamily: "'Rajdhani',sans-serif" }}>
                ROUND #{detail.roundNumber}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  ['Crash Point', `${detail.crashPoint?.toFixed(2)}×`],
                  ['Status', detail.status],
                  ['Wagered', fmtETB(detail.totalWagered)],
                  ['Lock Mode', detail.crashLocked ? detail.crashLockMode : 'None'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] text-gray-700 uppercase tracking-widest" style={{ fontFamily: "'Rajdhani',sans-serif" }}>{k}</p>
                    <p className="text-xs font-mono text-amber-400 truncate">{v}</p>
                  </div>
                ))}
              </div>
              {detail.crashLocked && (
                <div className="mb-3 px-2.5 py-2 rounded-lg text-[10px]"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-red-400 font-bold">⚠ Admin-locked round</span>
                  <p className="text-gray-600 mt-0.5">Provably-fair seeds are authentic but outcome was not RNG-derived.</p>
                </div>
              )}
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2" style={{ fontFamily: "'Rajdhani',sans-serif" }}>
                Bets ({detail.bets?.length ?? 0})
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {(detail.bets ?? []).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p className="text-[10px] font-bold text-white">{b.username}</p>
                      <p className="text-[9px] text-gray-700 font-mono">
                        {b.autoCashOut ? `auto @ ${b.autoCashOut}×` : 'manual'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-amber-400">{fmtETB(b.betAmount)}</p>
                      <p className="text-[9px] font-bold font-mono" style={{ color: b.status === 'won' ? '#6ee7b7' : '#6b7280' }}>
                        {b.status === 'won' ? `+${fmtETB(b.payout)}` : b.status}
                      </p>
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
  );
}

const AdminCrash: NextPage = () => (
  <>
    <Head>
      <title>Crash — DashBets Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </Head>
    <AdminLayout title="Crash">
      <CrashLockPanel />
      <CrashHistory />
    </AdminLayout>
  </>
);

export default AdminCrash;
