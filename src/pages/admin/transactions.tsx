/**
 * pages/admin/transactions.tsx
 * Full transaction list with filters, approve/reject actions, and pagination.
 */

import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Card, Table, TR, TD, Badge, Btn, Input, Select, Modal,
  Pagination, fmtETB, fmtDate, useToast,
} from '../../components/admin/AdminUI';
import { useAdminTransactions } from '../../hooks/useAdmin';
import type { Transaction } from '../../lib/api/adminApi';

const TYPE_OPTS = [
  { value: '', label: 'All Types' },
  { value: 'deposit',         label: 'Deposit' },
  { value: 'withdrawal',      label: 'Withdrawal' },
  { value: 'bingo_entry',     label: 'Bingo Entry' },
  { value: 'bingo_win',       label: 'Bingo Win' },
  { value: 'spin_bet',        label: 'Spin Bet' },
  { value: 'spin_win',        label: 'Spin Win' },
  { value: 'keno_bet',        label: 'Keno Bet' },
  { value: 'keno_win',        label: 'Keno Win' },
  { value: 'pool_entry',      label: 'Pool Entry' },
  { value: 'pool_win',        label: 'Pool Win' },
  { value: 'admin_credit',    label: 'Admin Credit' },
  { value: 'admin_debit',     label: 'Admin Debit' },
  { value: 'withdrawal_refund', label: 'Withdrawal Refund' },
];

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved',  label: 'Approved' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

const COLS = ['User', 'Type', 'Amount', 'Method', 'Status', 'Reference', 'Date', 'Actions'];

const AdminTransactions: NextPage = () => {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [type, setType]         = useState('');
  const [status, setStatus]     = useState('');
  const [rejectModal, setRejectModal] = useState<Transaction | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { show, Toast } = useToast();

  const { transactions, pagination, loading, actionLoading, params, setParams, approve, reject } =
    useAdminTransactions({ page, limit: 30 });

  const applyFilters = () => {
    setPage(1);
    setParams({ page: 1, limit: 30, ...(search && { search }), ...(type && { type }), ...(status && { status }) });
  };

  const handleApprove = async (tx: Transaction) => {
    const res = await approve(tx);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    const res = await reject(rejectModal, rejectNotes);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
    setRejectModal(null);
    setRejectNotes('');
  };

  const canAction = (tx: Transaction) =>
    (tx.type === 'deposit' && tx.status === 'submitted') ||
    (tx.type === 'withdrawal' && tx.status === 'pending');

  return (
    <>
      <Head>
        <title>Transactions — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Transactions">
        <Toast />

        {/* Filters */}
        <Card className="mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <Input
              label="Search user"
              value={search}
              onChange={setSearch}
              placeholder="username / email / phone"
              className="w-48"
            />
            <Select label="Type"   value={type}   onChange={setType}   options={TYPE_OPTS}   className="w-40" />
            <Select label="Status" value={status} onChange={setStatus} options={STATUS_OPTS} className="w-36" />
            <Btn onClick={applyFilters} variant="primary" size="sm">Apply</Btn>
            <Btn onClick={() => { setSearch(''); setType(''); setStatus(''); setParams({ page: 1, limit: 30 }); }} variant="ghost" size="sm">
              Clear
            </Btn>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table cols={COLS} loading={loading} empty="No transactions found.">
            {transactions.map(tx => (
              <TR key={tx._id}>
                <TD>
                  <span className="font-semibold text-white">
                    {(tx.userId as any)?.username ?? '—'}
                  </span>
                  <p className="text-[9px] text-gray-700 font-mono mt-0.5">
                    {(tx.userId as any)?.email ?? ''}
                  </p>
                </TD>
                <TD><Badge status={tx.type} /></TD>
                <TD>
                  <span
                    className="font-bold font-mono tabular-nums"
                    style={{ color: tx.amount > 0 ? '#6ee7b7' : '#fca5a5' }}
                  >
                    {tx.amount > 0 ? '+' : ''}{fmtETB(tx.amount)}
                  </span>
                </TD>
                <TD>{tx.method ?? '—'}</TD>
                <TD><Badge status={tx.status} /></TD>
                <TD>
                  <span className="font-mono text-[10px] text-gray-600">
                    {tx.reference ?? '—'}
                  </span>
                </TD>
                <TD>{fmtDate(tx.createdAt)}</TD>
                <TD>
                  {canAction(tx) ? (
                    <div className="flex gap-1.5">
                      <Btn
                        size="xs" variant="success"
                        disabled={actionLoading === tx._id}
                        onClick={() => handleApprove(tx)}
                      >
                        ✓ Approve
                      </Btn>
                      <Btn
                        size="xs" variant="danger"
                        disabled={actionLoading === tx._id}
                        onClick={() => { setRejectModal(tx); setRejectNotes(''); }}
                      >
                        ✗ Reject
                      </Btn>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-700">—</span>
                  )}
                </TD>
              </TR>
            ))}
          </Table>

          <Pagination
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPage={p => { setPage(p); setParams(prev => ({ ...prev, page: p })); }}
          />
        </Card>

        {/* Reject Modal */}
        <Modal
          open={!!rejectModal}
          onClose={() => setRejectModal(null)}
          title="Reject Transaction"
        >
          {rejectModal && (
            <>
              <div
                className="rounded-xl px-4 py-3 mb-4 text-xs text-gray-400"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="font-bold text-white mb-1">{(rejectModal.userId as any)?.username}</p>
                <p>{rejectModal.type} · {fmtETB(rejectModal.amount)} · {rejectModal.method}</p>
              </div>
              <Input
                label="Rejection Reason (optional)"
                value={rejectNotes}
                onChange={setRejectNotes}
                placeholder="Enter reason for rejection…"
                className="mb-4"
              />
              <div className="flex gap-2 justify-end">
                <Btn variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Btn>
                <Btn variant="danger" onClick={handleRejectConfirm}>Confirm Reject</Btn>
              </div>
            </>
          )}
        </Modal>
      </AdminLayout>
    </>
  );
};

export default AdminTransactions;