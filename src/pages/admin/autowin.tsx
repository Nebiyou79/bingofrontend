/**
 * pages/admin/autowin.tsx
 * Enable / disable auto-win for bingo. Shows audit log.
 */

import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Btn, Input, Select, Table, TR, TD,
  Badge, fmtDate, useToast,
} from '../../components/admin/AdminUI';
import { useAutoWin } from '../../hooks/useAdmin';

const STAKE_OPTS = [
  { value: '', label: 'All Stakes' },
  ...[10, 20, 30, 50, 80, 100, 150, 200, 300].map(s => ({ value: String(s), label: `${s} ETB` })),
];

const AdminAutoWin: NextPage = () => {
  const { state, auditLog, loading, busy, enable, disable } = useAutoWin();
  const { show, Toast } = useToast();

  const [cards, setCards]     = useState('');       // comma-separated card numbers
  const [maxDraws, setMaxDraws] = useState('12');
  const [stake, setStake]     = useState('');
  const [resetAfter, setResetAfter] = useState(true);
  const [notes, setNotes]     = useState('');
  const [disableNotes, setDisableNotes] = useState('');

  const handleEnable = async () => {
    const nums = cards.split(',').map(s => parseInt(s.trim())).filter(n => n >= 1 && n <= 200);
    if (!nums.length) { show('Enter at least one card number (1-200)', 'err'); return; }
    const res = await enable({
      targetCardNumbers: nums,
      maxDrawsToWin: Number(maxDraws),
      stakeFilter: stake ? Number(stake) : null,
      resetAfterGame: resetAfter,
      notes,
    });
    show(res.success ? 'Auto-win enabled' : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) { setCards(''); setNotes(''); }
  };

  const handleDisable = async () => {
    const res = await disable(disableNotes || undefined);
    show(res.success ? 'Auto-win disabled' : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) setDisableNotes('');
  };

  const isEnabled = state?.enabled;

  return (
    <>
      <Head>
        <title>Auto-Win — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Auto-Win">
        <Toast />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Current State */}
          <Card style={{ borderColor: isEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)' }}>
            <SectionTitle>Current State</SectionTitle>
            {loading ? (
              <p className="text-gray-700 font-mono animate-pulse text-xs py-4">Loading…</p>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: isEnabled ? '#ef4444' : '#374151', boxShadow: isEnabled ? '0 0 8px #ef4444' : 'none' }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: isEnabled ? '#fca5a5' : '#6b7280', fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {isEnabled ? 'AUTO-WIN ENABLED' : 'DISABLED'}
                  </span>
                </div>

                {isEnabled && (
                  <div className="space-y-2 mb-4">
                    <InfoRow label="Target Cards" value={state.targetCardNumbers?.join(', ') ?? '—'} />
                    <InfoRow label="Max Draws"    value={String(state.maxDrawsToWin)} />
                    <InfoRow label="Stake Filter" value={state.stakeFilter ? `${state.stakeFilter} ETB` : 'All stakes'} />
                    <InfoRow label="Reset After"  value={state.resetAfterGame ? 'Yes' : 'No'} />
                    <InfoRow label="Enabled At"   value={fmtDate(state.enabledAt)} />
                  </div>
                )}

                {isEnabled ? (
                  <>
                    <Input label="Disable Notes" value={disableNotes} onChange={setDisableNotes} placeholder="Reason…" className="mb-3" />
                    <Btn variant="danger" onClick={handleDisable} disabled={busy}>
                      {busy ? 'Disabling…' : '⊘ Disable Auto-Win'}
                    </Btn>
                  </>
                ) : (
                  <p className="text-xs text-gray-600">Configure and enable auto-win using the form →</p>
                )}
              </>
            )}
          </Card>

          {/* Enable Form */}
          <Card>
            <SectionTitle>Enable Auto-Win</SectionTitle>
            <div className="space-y-3">
              <Input
                label="Target Card Numbers (comma-separated)"
                value={cards}
                onChange={setCards}
                placeholder="e.g. 42, 87, 153"
              />
              <Input
                label="Max Draws to Win"
                value={maxDraws}
                onChange={setMaxDraws}
                type="number"
              />
              <Select
                label="Stake Filter"
                value={stake}
                onChange={setStake}
                options={STAKE_OPTS}
              />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-white">Reset After Game</p>
                  <p className="text-[10px] text-gray-600">Auto-disable once applied</p>
                </div>
                <button
                  onClick={() => setResetAfter(r => !r)}
                  className="w-11 h-6 rounded-full transition-all relative"
                  style={{
                    background: resetAfter ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${resetAfter ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                    style={{ left: resetAfter ? 'calc(100% - 22px)' : '2px' }}
                  />
                </button>
              </div>
              <Input label="Notes" value={notes} onChange={setNotes} placeholder="Audit note…" />
              <Btn
                variant="danger"
                onClick={handleEnable}
                disabled={busy || !cards.trim()}
                className="w-full"
              >
                {busy ? 'Enabling…' : '⚡ Enable Auto-Win'}
              </Btn>
            </div>
          </Card>
        </div>

        {/* Audit Log */}
        <Card>
          <SectionTitle>Audit Log</SectionTitle>
          <Table cols={['Admin', 'Action', 'Cards', 'Stake', 'Date', 'Notes']} empty="No audit entries.">
            {auditLog.map((entry: any, i: number) => (
              <TR key={i}>
                <TD><span className="font-bold text-white">{entry.adminUsername}</span></TD>
                <TD>
                  <span
                    className="font-bold text-xs"
                    style={{
                      color: entry.action === 'enabled' ? '#fca5a5' : entry.action === 'disabled' ? '#6ee7b7' : '#fde68a',
                    }}
                  >
                    {entry.action.toUpperCase()}
                  </span>
                </TD>
                <TD>
                  <span className="font-mono text-[10px] text-gray-500">
                    {entry.targetCardNumbers?.join(', ') || '—'}
                  </span>
                </TD>
                <TD>{entry.stakeAmount ? `${entry.stakeAmount} ETB` : 'all'}</TD>
                <TD>{fmtDate(entry.timestamp)}</TD>
                <TD><span className="text-[10px] text-gray-600">{entry.notes || '—'}</span></TD>
              </TR>
            ))}
          </Table>
        </Card>
      </AdminLayout>
    </>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[10px] text-gray-600">{label}</span>
      <span className="text-xs font-mono text-gray-300">{value}</span>
    </div>
  );
}

export default AdminAutoWin;