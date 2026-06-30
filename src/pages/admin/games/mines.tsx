/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/admin/games/mines.tsx
 * Mines game history + MinesLock panel.
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Table, TR, TD, Badge, Pagination,
  Btn, Input, Select, Modal, useToast, fmtETB, fmtDate,
} from '../../../components/admin/AdminUI';
import { useMinesLock } from '../../../hooks/useAdmin';

const STRATEGY_OPTS = [
  { value: 'front_load',   label: 'Front Load — mines at lowest tile indices (most aggressive)' },
  { value: 'high_index',   label: 'High Index — mines at highest tile indices (subtler)' },
  { value: 'random_dense', label: 'Random Dense — normal random + extra hidden mines' },
];

// ── Mines Lock Panel ──────────────────────────────────────────────────────────

function MinesLockPanel() {
  const { state, auditLog, loading, busy, enable, disable, refetch } = useMinesLock();
  const { show, Toast } = useToast();
  const [modal, setModal]               = useState(false);
  const [strategy, setStrategy]         = useState('front_load');
  const [extraMines, setExtraMines]     = useState('2');
  const [gamesLimit, setGamesLimit]     = useState('');
  const [notes, setNotes]               = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [disableModal, setDisableModal] = useState(false);

  const handleEnable = async () => {
    const res = await enable({
      strategy: strategy as any,
      extraMines: strategy === 'random_dense' ? Number(extraMines) : undefined,
      gamesLimit: gamesLimit ? Number(gamesLimit) : null,
      notes,
    });
    if (res?.success) { show(res.message, 'ok'); setModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const handleDisable = async () => {
    const res = await disable(disableNotes);
    if (res?.success) { show('Mines lock disabled', 'ok'); setDisableModal(false); refetch(); }
    else              { show((res as any)?.error ?? 'Failed', 'err'); }
  };

  const isOn = state?.enabled;
  const gamesRemaining = state?.gamesLimit != null
    ? Math.max(0, state.gamesLimit - (state.gamesPlayed ?? 0))
    : null;

  const strategyDesc: Record<string, string> = {
    front_load:   'Mines placed at the lowest tile indices. Players clicking top-left hit mines immediately.',
    high_index:   'Mines placed at the highest tile indices. Players feel safe early, then bust deep in.',
    random_dense: `Random placement with ${state?.extraMines ?? 2} extra hidden mines beyond the displayed count.`,
  };

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
          Mines Lock
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
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Extra Mines</p>
              <p className="text-xs font-mono text-gray-400">
                {state?.strategy === 'random_dense' ? `+${state.extraMines}` : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Games Remaining</p>
              <p className="text-xs font-bold font-mono" style={{ color: '#c4b5fd' }}>
                {gamesRemaining === null ? '∞' : gamesRemaining}
              </p>
            </div>
          </div>
        )}

        {isOn && state?.strategy && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-[10px] text-gray-500"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            {strategyDesc[state.strategy]}
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

      <Modal open={modal} onClose={() => setModal(false)} title="Enable Mines Lock">
        <div className="space-y-4">
          <Select label="Strategy" value={strategy} onChange={setStrategy} options={STRATEGY_OPTS} />
          {strategy === 'random_dense' && (
            <Input
              label="Extra Mines (added on top of player's selection, default 2)"
              value={extraMines} onChange={setExtraMines} type="number" placeholder="2"
            />
          )}
          <Input label="Games Limit (blank = unlimited)" value={gamesLimit} onChange={setGamesLimit} type="number" placeholder="e.g. 50" />
          <Input label="Notes" value={notes} onChange={setNotes} placeholder="Reason…" />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy} onClick={handleEnable}>{busy ? 'Enabling…' : 'Enable'}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Mines Lock">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Provably-fair mine placement will be restored on the next game.</p>
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

// ── Game history ──────────────────────────────────────────────────────────────

function MinesHistory() {
  const [page, setPage]             = useState(1);
  const [games, setGames]           = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading]       = useState(true);

  React.useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('dashbets_token') ?? '';
    fetch(`/api/games/mines/games?page=${page}&limit=25`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setGames(d.games); setPagination(d.pagination); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card>
      <SectionTitle>Recent Games</SectionTitle>
      <Table
        cols={['User', 'Mines', 'Bet', 'Reveals', 'Multiplier', 'Payout', 'Status', 'Locked?', 'Date']}
        loading={loading}
        empty="No games yet."
      >
        {games.map(g => (
          <TR key={g._id}>
            <TD><span className="font-bold text-white text-[10px]">{g.userId?.username ?? '—'}</span></TD>
            <TD><span className="font-mono text-gray-400">{g.mineCount}</span></TD>
            <TD><span className="font-mono text-amber-400">{fmtETB(g.betAmount)}</span></TD>
            <TD><span className="font-mono text-gray-400">{g.revealedCount ?? 0}</span></TD>
            <TD><span className="font-mono text-gray-300">{g.multiplier != null ? `${g.multiplier}×` : '—'}</span></TD>
            <TD>
              <span className="font-mono font-bold" style={{ color: g.payout > g.betAmount ? '#6ee7b7' : '#6b7280' }}>
                {fmtETB(g.payout ?? 0)}
              </span>
            </TD>
            <TD><Badge status={g.status} /></TD>
            <TD>
              {g.minesLocked
                ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                    LOCKED · {g.minesLockStrategy}
                  </span>
                : <span className="text-gray-700 text-[10px]">—</span>
              }
            </TD>
            <TD>{fmtDate(g.createdAt)}</TD>
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

const AdminMines: NextPage = () => (
  <>
    <Head>
      <title>Mines — DashBets Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </Head>
    <AdminLayout title="Mines">
      <MinesLockPanel />
      <MinesHistory />
    </AdminLayout>
  </>
);

export default AdminMines;
