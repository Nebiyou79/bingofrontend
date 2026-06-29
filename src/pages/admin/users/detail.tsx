/**
 * pages/admin/users/[id].tsx
 * User detail: profile, stats, recent transactions, suspend/balance actions.
 */

import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, SectionTitle, Badge, Btn, Input, Select, Modal,
  Table, TR, TD, fmtETB, fmtDate, useToast,
} from '../../../components/admin/AdminUI';
import { useAdminUser } from '../../../hooks/useAdmin';

const AdminUserDetail: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;

  const { user, recentTx, stats, loading, error, suspend, unsuspend, adjust } = useAdminUser(id ?? '');
  const { show, Toast } = useToast();

  const [balModal, setBalModal]   = useState(false);
  const [balAmt, setBalAmt]       = useState('');
  const [balType, setBalType]     = useState<'admin_credit' | 'admin_debit'>('admin_credit');
  const [balNotes, setBalNotes]   = useState('');
  const [suspModal, setSuspModal] = useState(false);
  const [suspReason, setSuspReason] = useState('');

  const handleSuspend = async () => {
    const res = await suspend(suspReason || undefined);
    show(res.success ? 'User suspended' : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) setSuspModal(false);
  };

  const handleUnsuspend = async () => {
    const res = await unsuspend();
    show(res.success ? 'User restored' : (res as any).error, res.success ? 'ok' : 'err');
  };

  const handleBalance = async () => {
    const res = await adjust(Number(balAmt), balType, balNotes || undefined);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) { setBalModal(false); setBalAmt(''); setBalNotes(''); }
  };

  if (loading) return (
    <AdminLayout title="User Detail">
      <p className="text-center py-20 text-gray-700 font-mono animate-pulse">Loading…</p>
    </AdminLayout>
  );

  if (error || !user) return (
    <AdminLayout title="User Detail">
      <p className="text-center py-20 text-red-500 font-mono">{error ?? 'User not found'}</p>
    </AdminLayout>
  );

  const vipColors = ['#6b7280','#10b981','#22d3ee','#7c3aed','#f59e0b','#ef4444'];
  const vipColor = vipColors[Math.min(user.vipLevel, vipColors.length - 1)];

  return (
    <>
      <Head>
        <title>{user.username} — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title={user.username}>
        <Toast />

        {/* Profile Header */}
        <Card className="mb-5">
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-lg font-extrabold text-white"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {user.username}
                </h2>
                <Badge status={user.isSuspended ? 'suspended' : user.isActive ? 'active' : 'suspended'} />
                {user.role === 'admin' && <Badge status="approved" />}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${vipColor}20`, color: vipColor }}
                >
                  VIP {user.vipLevel}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-0.5">{user.email} · {user.phone}</p>
              <p className="text-[10px] text-gray-700 font-mono mt-0.5">
                Joined {fmtDate(user.createdAt)} · Last login {user.lastLogin ? fmtDate(user.lastLogin) : 'never'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Btn onClick={() => { setBalModal(true); setBalAmt(''); setBalNotes(''); }} variant="ghost" size="sm">
                💰 Adjust Balance
              </Btn>
              {user.isSuspended ? (
                <Btn onClick={handleUnsuspend} variant="success" size="sm">✓ Restore</Btn>
              ) : user.role !== 'admin' ? (
                <Btn onClick={() => setSuspModal(true)} variant="danger" size="sm">⊘ Suspend</Btn>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left */}
          <div className="space-y-4">
            {/* Financial */}
            <Card>
              <SectionTitle>Financial</SectionTitle>
              <InfoRow label="Balance"      value={fmtETB(user.balance)}      accent="#6ee7b7" />
              <InfoRow label="Bonus Balance" value={fmtETB(user.bonusBalance)} accent="#fde68a" />
              <InfoRow label="Total Wagered" value={fmtETB(user.totalWagered)} />
              <InfoRow label="Biggest Win"   value={fmtETB(user.biggestWin)}  accent="#c4b5fd" />
            </Card>

            {/* VIP */}
            <Card>
              <SectionTitle>VIP / Stats</SectionTitle>
              <InfoRow label="VIP Level"   value={`Level ${user.vipLevel}`} accent={vipColor} />
              <InfoRow label="VIP Points"  value={(user.vipPoints ?? 0).toLocaleString()} />
              <InfoRow label="Total Spins" value={(user.totalSpins ?? 0).toLocaleString()} />
            </Card>

            {/* Game Stats */}
            {stats && (
              <Card>
                <SectionTitle>Lifetime Game Stats</SectionTitle>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}>Spin</p>
                <InfoRow label="Spins"   value={(stats.spin.spins ?? 0).toLocaleString()} />
                <InfoRow label="Wagered" value={fmtETB(stats.spin.wagered ?? 0)} />
                <InfoRow label="Won"     value={fmtETB(stats.spin.won ?? 0)} accent="#6ee7b7" />
                <div className="my-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}>Keno</p>
                <InfoRow label="Bets"    value={(stats.keno.bets ?? 0).toLocaleString()} />
                <InfoRow label="Wagered" value={fmtETB(stats.keno.wagered ?? 0)} />
                <InfoRow label="Won"     value={fmtETB(stats.keno.won ?? 0)} accent="#6ee7b7" />
              </Card>
            )}
          </div>

          {/* Right: recent transactions */}
          <div className="lg:col-span-2">
            <Card>
              <SectionTitle>Recent Transactions (10)</SectionTitle>
              <Table
                cols={['Type', 'Amount', 'Status', 'Method', 'Date']}
                empty="No transactions."
              >
                {recentTx.map(tx => (
                  <TR key={tx._id}>
                    <TD><Badge status={tx.type} /></TD>
                    <TD>
                      <span
                        className="font-bold font-mono tabular-nums"
                        style={{ color: tx.amount > 0 ? '#6ee7b7' : '#fca5a5' }}
                      >
                        {tx.amount > 0 ? '+' : ''}{fmtETB(tx.amount)}
                      </span>
                    </TD>
                    <TD><Badge status={tx.status} /></TD>
                    <TD>{tx.method ?? '—'}</TD>
                    <TD>{fmtDate(tx.createdAt)}</TD>
                  </TR>
                ))}
              </Table>
            </Card>
          </div>
        </div>

        {/* Balance Modal */}
        <Modal open={balModal} onClose={() => setBalModal(false)} title="Adjust Balance">
          <p className="text-xs text-gray-400 mb-4">
            Current balance: <span className="text-emerald-400 font-bold font-mono">{fmtETB(user.balance)}</span>
          </p>
          <Select
            label="Type"
            value={balType}
            onChange={v => setBalType(v as any)}
            options={[{ value: 'admin_credit', label: '+ Credit' }, { value: 'admin_debit', label: '– Debit' }]}
            className="mb-3"
          />
          <Input label="Amount (ETB)" value={balAmt} onChange={setBalAmt} type="number" placeholder="0" className="mb-3" />
          <Input label="Notes" value={balNotes} onChange={setBalNotes} placeholder="Reason…" className="mb-5" />
          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" onClick={() => setBalModal(false)}>Cancel</Btn>
            <Btn
              variant={balType === 'admin_credit' ? 'success' : 'danger'}
              onClick={handleBalance}
              disabled={!balAmt || Number(balAmt) <= 0}
            >
              Confirm
            </Btn>
          </div>
        </Modal>

        {/* Suspend Modal */}
        <Modal open={suspModal} onClose={() => setSuspModal(false)} title="Suspend User">
          <p className="text-xs text-gray-400 mb-4">
            Suspending <span className="text-white font-bold">{user.username}</span> will prevent them from logging in.
          </p>
          <Input label="Reason (optional)" value={suspReason} onChange={setSuspReason} placeholder="Reason for suspension…" className="mb-5" />
          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" onClick={() => setSuspModal(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleSuspend}>Confirm Suspend</Btn>
          </div>
        </Modal>
      </AdminLayout>
    </>
  );
};

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <span className="text-[10px] text-gray-600">{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color: accent ?? '#9ca3af' }}>{value}</span>
    </div>
  );
}

export default AdminUserDetail;