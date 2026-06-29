/**
 * pages/admin/users/index.tsx
 * Paginated user list with search, suspend/unsuspend, balance adjust.
 */

import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import {
  Card, Table, TR, TD, Badge, Btn, Input, Select, Modal,
  Pagination, fmtETB, fmtDate, useToast,
} from '../../../components/admin/AdminUI';
import { useAdminUsers } from '../../../hooks/useAdmin';
import type { AdminUser } from '../../../lib/api/adminApi';

const SORT_OPTS = [
  { value: 'createdAt',   label: 'Joined' },
  { value: 'balance',     label: 'Balance' },
  { value: 'totalWagered',label: 'Wagered' },
  { value: 'username',    label: 'Username' },
  { value: 'lastLogin',   label: 'Last Login' },
];

const COLS = ['User', 'Role', 'Balance', 'VIP', 'Wagered', 'Status', 'Joined', 'Actions'];

const AdminUsers: NextPage = () => {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder]   = useState('desc');

  const [balModal, setBalModal] = useState<AdminUser | null>(null);
  const [balAmt, setBalAmt]     = useState('');
  const [balType, setBalType]   = useState<'admin_credit' | 'admin_debit'>('admin_credit');
  const [balNotes, setBalNotes] = useState('');

  const { show, Toast } = useToast();

  const { users, pagination, loading, params, setParams, suspend, unsuspend, adjust } =
    useAdminUsers({ page, limit: 30, sortBy, order });

  const applySearch = () => {
    setPage(1);
    setParams({ page: 1, limit: 30, sortBy, order, ...(search && { search }) });
  };

  const handleSuspend = async (u: AdminUser) => {
    const res = await suspend(u._id);
    show(res.success ? `${u.username} suspended` : (res as any).error, res.success ? 'ok' : 'err');
  };

  const handleUnsuspend = async (u: AdminUser) => {
    const res = await unsuspend(u._id);
    show(res.success ? `${u.username} unsuspended` : (res as any).error, res.success ? 'ok' : 'err');
  };

  const handleBalance = async () => {
    if (!balModal || !balAmt) return;
    const res = await adjust(balModal._id, Number(balAmt), balType, balNotes || undefined);
    show(res.success ? res.message : (res as any).error, res.success ? 'ok' : 'err');
    if (res.success) { setBalModal(null); setBalAmt(''); setBalNotes(''); }
  };

  return (
    <>
      <Head>
        <title>Users — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Users">
        <Toast />

        {/* Filters */}
        <Card className="mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <Input
              label="Search"
              value={search}
              onChange={setSearch}
              placeholder="username / email / phone"
              className="w-52"
            />
            <Select
              label="Sort By"
              value={sortBy}
              onChange={v => { setSortBy(v); setParams(p => ({ ...p, sortBy: v })); }}
              options={SORT_OPTS}
              className="w-36"
            />
            <Select
              label="Order"
              value={order}
              onChange={v => { setOrder(v); setParams(p => ({ ...p, order: v })); }}
              options={[{ value: 'desc', label: 'Newest First' }, { value: 'asc', label: 'Oldest First' }]}
              className="w-36"
            />
            <Btn onClick={applySearch} variant="primary" size="sm">Search</Btn>
            <Btn onClick={() => { setSearch(''); setParams({ page: 1, limit: 30, sortBy: 'createdAt', order: 'desc' }); }} variant="ghost" size="sm">
              Clear
            </Btn>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table cols={COLS} loading={loading} empty="No users found.">
            {users.map(u => (
              <TR key={u._id}>
                <TD>
                  <Link href={`/admin/users/${u._id}`}>
                    <span className="font-bold text-white hover:text-purple-300 transition-colors cursor-pointer">
                      {u.username}
                    </span>
                  </Link>
                  <p className="text-[9px] text-gray-700 font-mono mt-0.5">{u.email}</p>
                </TD>
                <TD>
                  <span
                    className="text-[10px] font-bold uppercase"
                    style={{ color: u.role === 'admin' ? '#fde68a' : '#6b7280' }}
                  >
                    {u.role}
                  </span>
                </TD>
                <TD>
                  <span className="font-bold text-emerald-400 font-mono">{fmtETB(u.balance)}</span>
                </TD>
                <TD>
                  <span className="text-xs font-mono text-purple-400">Lv.{u.vipLevel}</span>
                </TD>
                <TD>
                  <span className="text-xs font-mono text-gray-500">{fmtETB(u.totalWagered)}</span>
                </TD>
                <TD>
                  <Badge status={u.isSuspended ? 'suspended' : u.isActive ? 'active' : 'suspended'} />
                </TD>
                <TD>{fmtDate(u.createdAt)}</TD>
                <TD>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/users/${u._id}`}>
                      <Btn size="xs" variant="ghost">View</Btn>
                    </Link>
                    <Btn
                      size="xs" variant="ghost"
                      onClick={() => { setBalModal(u); setBalAmt(''); setBalNotes(''); }}
                    >
                      Bal
                    </Btn>
                    {u.isSuspended ? (
                      <Btn size="xs" variant="success" onClick={() => handleUnsuspend(u)}>Restore</Btn>
                    ) : (
                      u.role !== 'admin' && (
                        <Btn size="xs" variant="danger" onClick={() => handleSuspend(u)}>Suspend</Btn>
                      )
                    )}
                  </div>
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

        {/* Balance Modal */}
        <Modal open={!!balModal} onClose={() => setBalModal(null)} title="Adjust Balance">
          {balModal && (
            <>
              <p className="text-xs text-gray-400 mb-4">
                User: <span className="text-white font-bold">{balModal.username}</span>
                {' '}· Current: <span className="text-emerald-400 font-mono">{fmtETB(balModal.balance)}</span>
              </p>
              <Select
                label="Type"
                value={balType}
                onChange={v => setBalType(v as any)}
                options={[
                  { value: 'admin_credit', label: '+ Credit' },
                  { value: 'admin_debit',  label: '– Debit' },
                ]}
                className="mb-3"
              />
              <Input
                label="Amount (ETB)"
                value={balAmt}
                onChange={setBalAmt}
                type="number"
                placeholder="0"
                className="mb-3"
              />
              <Input
                label="Notes (optional)"
                value={balNotes}
                onChange={setBalNotes}
                placeholder="Reason for adjustment…"
                className="mb-5"
              />
              <div className="flex gap-2 justify-end">
                <Btn variant="ghost" onClick={() => setBalModal(null)}>Cancel</Btn>
                <Btn
                  variant={balType === 'admin_credit' ? 'success' : 'danger'}
                  onClick={handleBalance}
                  disabled={!balAmt || Number(balAmt) <= 0}
                >
                  {balType === 'admin_credit' ? '+ Credit' : '– Debit'} {balAmt ? fmtETB(Number(balAmt)) : ''}
                </Btn>
              </div>
            </>
          )}
        </Modal>
      </AdminLayout>
    </>
  );
};

export default AdminUsers;