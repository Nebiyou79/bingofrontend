/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/admin/jackpots.tsx
 */

import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, Btn, Input, Modal, fmtETB, fmtDate, useToast } from '../../components/admin/AdminUI';
import { useAdminJackpots } from '../../hooks/useAdmin';

const JP_META: Record<string, { color: string; emoji: string }> = {
  grand: { color: '#ef4444', emoji: '👑' },
  major: { color: '#f59e0b', emoji: '💎' },
  minor: { color: '#22d3ee', emoji: '⭐' },
  mini:  { color: '#10b981', emoji: '🍀' },
};

export const AdminJackpots: NextPage = () => {
  const { jackpots, loading, busy, seed, reset, toggle } = useAdminJackpots();
  const { show, Toast } = useToast();
  const [seedModal, setSeedModal] = useState<string | null>(null);
  const [seedAmt, setSeedAmt]     = useState('');

  const handleSeed = async () => {
    if (!seedModal) return;
    const res = await seed(seedModal, Number(seedAmt));
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) { setSeedModal(null); setSeedAmt(''); }
  };

  const handleReset = async (type: string) => {
    const res = await reset(type);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
  };

  const handleToggle = async (type: string, current: boolean) => {
    const res = await toggle(type, !current);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
  };

  return (
    <>
      <Head>
        <title>Jackpots — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Jackpots">
        <Toast />
        {loading ? (
          <p className="text-center py-20 text-gray-700 font-mono animate-pulse">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {jackpots.map(jp => {
              const meta = JP_META[jp.type] ?? { color: '#7c3aed', emoji: '🏆' };
              return (
                <Card key={jp.type} style={{ borderColor: `${meta.color}25` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-extrabold uppercase"
                        style={{ color: meta.color, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em' }}
                      >
                        {jp.type}
                      </p>
                      <p className="text-[10px] text-gray-600">{jp.name}</p>
                    </div>
                    <div
                      className="text-[10px] px-2 py-1 rounded-full font-bold"
                      style={{
                        background: jp.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: jp.isActive ? '#6ee7b7' : '#fca5a5',
                      }}
                    >
                      {jp.isActive ? 'ACTIVE' : 'OFF'}
                    </div>
                  </div>

                  <p
                    className="text-3xl font-extrabold text-white font-mono tabular-nums mb-1"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {fmtETB(jp.amount)}
                  </p>
                  <p className="text-[10px] text-gray-600 mb-4">
                    Seed: {fmtETB(jp.seedAmount)} · Increment: {(jp.incrementRate * 100).toFixed(0)}% · Winners: {jp.winners}
                  </p>
                  {jp.lastWonAt && (
                    <p className="text-[10px] text-gray-700 mb-4 font-mono">Last won {fmtDate(jp.lastWonAt)}</p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Btn
                      size="xs" variant="primary"
                      disabled={busy === jp.type}
                      onClick={() => { setSeedModal(jp.type); setSeedAmt(String(jp.seedAmount)); }}
                    >
                      🌱 Seed Amount
                    </Btn>
                    <Btn
                      size="xs" variant="ghost"
                      disabled={busy === jp.type}
                      onClick={() => handleReset(jp.type)}
                    >
                      ↺ Reset to Seed
                    </Btn>
                    <Btn
                      size="xs"
                      variant={jp.isActive ? 'danger' : 'success'}
                      disabled={busy === jp.type}
                      onClick={() => handleToggle(jp.type, jp.isActive)}
                    >
                      {jp.isActive ? '⊘ Deactivate' : '✓ Activate'}
                    </Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Modal open={!!seedModal} onClose={() => setSeedModal(null)} title="Set Jackpot Amount">
          <p className="text-xs text-gray-400 mb-4 capitalize">
            Jackpot: <span className="text-white font-bold">{seedModal}</span>
          </p>
          <Input label="New Amount (ETB)" value={seedAmt} onChange={setSeedAmt} type="number" placeholder="0" className="mb-5" />
          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" onClick={() => setSeedModal(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSeed} disabled={!seedAmt || Number(seedAmt) <= 0}>
              Set Amount
            </Btn>
          </div>
        </Modal>
      </AdminLayout>
    </>
  );
};

export default AdminJackpots;


// // ─────────────────────────────────────────────────────────────────────────────
// // pages/admin/settings.tsx (export at bottom for single-file convenience)
// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * Re-export this component from pages/admin/settings.tsx
//  */
// export { AdminSettingsPage } from './settings-export';