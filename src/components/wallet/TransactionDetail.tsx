/**
 * components/wallet/TransactionDetail.tsx — Premium Redesign
 * Expanded inline detail panel. All original fields preserved.
 * New: glassmorphism styling, receipt preview, status timeline hints.
 */

import React from 'react';
import { Transaction } from '../../types';

interface TransactionDetailProps {
  transaction: Transaction;
}

const STATUS_STYLE: Record<Transaction['status'], { bg: string; border: string; color: string }> = {
  pending:   { bg: 'rgba(247,181,0,0.1)',   border: 'rgba(247,181,0,0.25)',   color: '#F7B500' },
  submitted: { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  color: '#3B82F6' },
  approved:  { bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.25)',   color: '#00E676' },
  rejected:  { bg: 'rgba(255,82,82,0.1)',   border: 'rgba(255,82,82,0.25)',   color: '#FF5252' },
  completed: { bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.25)',   color: '#00E676' },
  expired:   { bg: 'rgba(74,80,104,0.2)',   border: 'rgba(74,80,104,0.4)',    color: '#8890A8' },
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  pending:   'Pending Review',
  submitted: 'Proof Submitted',
  approved:  'Approved',
  rejected:  'Rejected',
  completed: 'Completed',
  expired:   'Expired',
};

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4A5068', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '13px', color: '#D0D4E8', wordBreak: 'break-all',
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Exo 2', sans-serif",
      }}>
        {value}
      </div>
    </div>
  );
}

/** Full transaction detail panel rendered inside an expanded row. */
export function TransactionDetail({ transaction: tx }: TransactionDetailProps) {
  const fmt = (iso: string) => new Date(iso).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' });
  const s = STATUS_STYLE[tx.status];

  return (
    <div style={{ paddingTop: '14px' }}>
      {/* Status banner */}
      <div style={{
        background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: '10px', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '14px' }}>
          {tx.status === 'completed' || tx.status === 'approved' ? '✓'
          : tx.status === 'rejected' || tx.status === 'expired' ? '✗'
          : '⏳'}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{STATUS_LABEL[tx.status]}</span>
        {tx.processedAt && (
          <span style={{ fontSize: '11px', color: '#8890A8', marginLeft: 'auto' }}>
            Processed {fmt(tx.processedAt)}
          </span>
        )}
      </div>

      {/* Grid of details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: '14px' }}>
        <DetailRow label="Transaction ID" value={tx._id} mono />
        <DetailRow label="Type" value={tx.type.replace(/_/g, ' ')} />
        <DetailRow label="Amount" value={`ETB ${tx.amount.toLocaleString()}`} mono />
        <DetailRow
          label="Status"
          value={
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: s.bg, border: `1px solid ${s.border}`, color: s.color,
              borderRadius: '6px', padding: '2px 8px',
              fontSize: '11px', fontWeight: 700,
            }}>
              {STATUS_LABEL[tx.status]}
            </span>
          }
        />
        {tx.method && (
          <DetailRow label="Method" value={tx.method === 'telebirr' ? '📱 Telebirr' : '🏦 CBE Birr'} />
        )}
        {tx.reference && <DetailRow label="Reference" value={tx.reference} mono />}
        {tx.agentPhone && <DetailRow label="Agent Phone" value={tx.agentPhone} mono />}
        {tx.agentName && <DetailRow label="Agent Name" value={tx.agentName} />}
        <DetailRow label="Created" value={fmt(tx.createdAt)} />
        {tx.expiresAt && <DetailRow label="Expires" value={fmt(tx.expiresAt)} />}
        {tx.description && <DetailRow label="Description" value={tx.description} />}
      </div>

      {/* Receipt preview */}
      {tx.receiptUrl && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4A5068', marginBottom: '8px' }}>
            Receipt
          </div>
          {tx.receiptUrl.match(/\.(png|jpg|jpeg|webp)$/i) ? (
            <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={tx.receiptUrl}
                alt="Receipt"
                style={{
                  maxHeight: '160px', borderRadius: '10px', objectFit: 'contain',
                  border: '1px solid rgba(255,255,255,0.1)', display: 'block',
                  transition: 'border-color 0.2s',
                }}
              />
            </a>
          ) : (
            <a
              href={tx.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9F5FFA', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📎 View Receipt →
            </a>
          )}
        </div>
      )}

      {/* Withdrawal cancel hint */}
      {tx.status === 'pending' && tx.type === 'withdrawal' && (
        <div style={{
          marginTop: '12px', fontSize: '11px', color: '#8890A8',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px', padding: '10px',
        }}>
          Need to cancel? Contact support and reference your transaction ID.
        </div>
      )}
    </div>
  );
}