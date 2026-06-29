/**
 * components/wallet/TransactionList.tsx — Premium Redesign
 * Preserves all original business logic (pagination, filters, expandable rows).
 * New: casino-grade transaction cards with icons, color-coded amounts, animated badges.
 */

import React, { useState } from 'react';
import { Transaction } from '../../types';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionDetail } from './TransactionDetail';

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<Transaction['type'], { label: string; icon: string; iconBg: string }> = {
  deposit:     { label: 'Deposit',       icon: '⬇', iconBg: 'rgba(0,230,118,0.1)'   },
  withdrawal:  { label: 'Withdrawal',    icon: '⬆', iconBg: 'rgba(255,82,82,0.1)'   },
  bingo_entry: { label: 'Bingo Entry',   icon: '🎯', iconBg: 'rgba(124,58,237,0.1)' },
  spin_entry:  { label: 'Spin Entry',    icon: '🎡', iconBg: 'rgba(124,58,237,0.1)' },
  spin_win:    { label: 'Spin Win',      icon: '🏆', iconBg: 'rgba(247,181,0,0.1)'  },
  spin_refund: { label: 'Spin Refund',   icon: '↩',  iconBg: 'rgba(247,181,0,0.1)'  },
};

const STATUS_STYLE: Record<Transaction['status'], { bg: string; border: string; color: string }> = {
  pending:   { bg: 'rgba(247,181,0,0.1)',   border: 'rgba(247,181,0,0.25)',   color: '#F7B500' },
  submitted: { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  color: '#3B82F6' },
  approved:  { bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.25)',   color: '#00E676' },
  rejected:  { bg: 'rgba(255,82,82,0.1)',   border: 'rgba(255,82,82,0.25)',   color: '#FF5252' },
  completed: { bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.25)',   color: '#00E676' },
  expired:   { bg: 'rgba(74,80,104,0.2)',   border: 'rgba(74,80,104,0.4)',    color: '#8890A8' },
};

function amountColor(type: Transaction['type']): string {
  if (type === 'deposit' || type === 'spin_win')    return '#00E676';
  if (type === 'spin_refund')                       return '#F7B500';
  return '#FF5252';
}

function amountSign(type: Transaction['type']): string {
  return (type === 'deposit' || type === 'spin_win' || type === 'spin_refund') ? '+' : '-';
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: '6px', padding: '2px 8px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px',
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const FILTER_TYPES: { value: string; label: string }[] = [
  { value: '',           label: 'All'        },
  { value: 'deposit',    label: 'Deposits'   },
  { value: 'withdrawal', label: 'Withdrawals'},
  { value: 'spin_win',   label: 'Wins'       },
  { value: 'spin_entry', label: 'Entries'    },
];

const STATUS_OPTS: { value: string; label: string }[] = [
  { value: '',          label: 'All Statuses' },
  { value: 'pending',   label: 'Pending'      },
  { value: 'submitted', label: 'Submitted'    },
  { value: 'approved',  label: 'Approved'     },
  { value: 'rejected',  label: 'Rejected'     },
  { value: 'completed', label: 'Completed'    },
  { value: 'expired',   label: 'Expired'      },
];

/** Premium filterable, paginated transaction history. */
export function TransactionList() {
  const { transactions, pagination, loading, error, filters, setFilters, goToPage } = useTransactions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '7px 12px',
    color: '#F0F0F8', fontSize: '12px', fontWeight: 600,
    fontFamily: "'Exo 2', sans-serif",
    outline: 'none', cursor: 'pointer',
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Type pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTER_TYPES.map(f => (
            <button
              key={f.value}
              onClick={() => setFilters({ ...filters, type: f.value as Transaction['type'] | '' })}
              style={{
                padding: '6px 12px',
                background: filters.type === f.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filters.type === f.value ? '#7C3AED' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                color: filters.type === f.value ? '#9F5FFA' : '#8890A8',
                transition: 'all 0.15s',
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <select
          value={filters.status || ''}
          onChange={e => setFilters({ ...filters, status: e.target.value as Transaction['status'] | '' })}
          style={{ ...selectStyle, marginLeft: 'auto' }}
        >
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)',
          borderRadius: '10px', padding: '12px', color: '#FF5252',
          fontSize: '13px', marginBottom: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '68px', background: 'rgba(255,255,255,0.04)',
              borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && transactions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#8890A8' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>No transactions found</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#4A5068' }}>Try changing the filters above</div>
        </div>
      )}

      {/* Transaction rows */}
      {!loading && transactions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {transactions.map(tx => {
            const meta = TYPE_META[tx.type] || { label: tx.type, icon: '•', iconBg: 'rgba(255,255,255,0.05)' };
            const isExpanded = expandedId === tx._id;
            return (
              <div key={tx._id} style={{
                background: '#10121A',
                border: `1px solid ${isExpanded ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                <button
                  onClick={() => toggleRow(tx._id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Icon */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: meta.iconBg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{meta.label}</span>
                      {tx.method && (
                        <span style={{ fontSize: '11px', color: '#4A5068' }}>· {tx.method === 'telebirr' ? 'Telebirr' : 'CBE Birr'}</span>
                      )}
                      <StatusBadge status={tx.status} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#8890A8' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-ET', { dateStyle: 'medium' })}
                      {' · '}
                      {new Date(tx.createdAt).toLocaleTimeString('en-ET', { timeStyle: 'short' })}
                    </div>
                  </div>

                  {/* Amount + chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '14px', fontWeight: 700,
                      color: amountColor(tx.type),
                    }}>
                      {amountSign(tx.type)} ETB {tx.amount.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '12px', color: '#8890A8',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s', display: 'inline-block',
                    }}>▼</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <TransactionDetail transaction={tx} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#8890A8' }}>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <PageBtn disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>← Prev</PageBtn>
            <PageBtn disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>Next →</PageBtn>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
    </div>
  );
}

function PageBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '7px 14px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', cursor: disabled ? 'default' : 'pointer',
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '12px', fontWeight: 600, color: '#F0F0F8',
        opacity: disabled ? 0.4 : 1, transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}