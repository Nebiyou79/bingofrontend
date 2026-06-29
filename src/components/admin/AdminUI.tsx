/**
 * components/admin/AdminUI.tsx
 * Shared primitives used across every admin page.
 */

import React, { useState } from 'react';

// ── Glass Card ─────────────────────────────────────────────────────────────────
export function Card({
  children, className = '', style = {},
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section Heading ────────────────────────────────────────────────────────────
export function SectionTitle({
  children, action,
}: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {children}
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, icon, accent = '#7c3aed', glow = '#7c3aed',
}: {
  label: string; value: string | number; sub?: string;
  icon: string; accent?: string; glow?: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: `0 4px 30px ${glow}10`,
      }}
    >
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-15"
        style={{ background: `radial-gradient(circle, ${glow}, transparent)` }}
      />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}>{label}</p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
          style={{ background: `${glow}15`, border: `1px solid ${glow}25` }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-2xl font-extrabold text-white tabular-nums"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] mt-1" style={{ color: accent }}>{sub}</p>}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved:   { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7' },
  completed:  { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7' },
  active:     { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7' },
  waiting:    { bg: 'rgba(245,158,11,0.15)',  text: '#fde68a' },
  pending:    { bg: 'rgba(245,158,11,0.15)',  text: '#fde68a' },
  submitted:  { bg: 'rgba(99,102,241,0.2)',   text: '#a5b4fc' },
  betting:    { bg: 'rgba(99,102,241,0.2)',   text: '#a5b4fc' },
  drawing:    { bg: 'rgba(34,211,238,0.15)',  text: '#67e8f9' },
  playing:    { bg: 'rgba(34,211,238,0.15)',  text: '#67e8f9' },
  rejected:   { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
  suspended:  { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
  settled:    { bg: 'rgba(107,114,128,0.2)',  text: '#9ca3af' },
  finished:   { bg: 'rgba(107,114,128,0.2)',  text: '#9ca3af' },
  completed_pool: { bg: 'rgba(107,114,128,0.2)', text: '#9ca3af' },
};

export function Badge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: 'rgba(255,255,255,0.07)', text: '#9ca3af' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({
  cols, children, loading = false, empty = 'No data.',
}: {
  cols: string[];
  children?: React.ReactNode;
  loading?: boolean;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {cols.map(c => (
              <th
                key={c}
                className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-gray-600"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9 }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={cols.length} className="py-10 text-center text-gray-700 font-mono animate-pulse">
                Loading…
              </td>
            </tr>
          ) : React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={cols.length} className="py-10 text-center text-gray-700 font-mono">
                {empty}
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-3 text-gray-400 ${className}`}>{children}</td>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-[10px] text-gray-700 font-mono">Page {page} / {totalPages}</p>
      <div className="flex gap-1.5">
        <PagBtn disabled={page <= 1}        onClick={() => onPage(1)}>«</PagBtn>
        <PagBtn disabled={page <= 1}        onClick={() => onPage(page - 1)}>‹</PagBtn>
        <PagBtn disabled={page >= totalPages} onClick={() => onPage(page + 1)}>›</PagBtn>
        <PagBtn disabled={page >= totalPages} onClick={() => onPage(totalPages)}>»</PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
      style={{
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(124,58,237,0.2)',
        color: disabled ? '#374151' : '#c4b5fd',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.3)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'danger' | 'ghost' | 'success';
const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
  danger:  { background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' },
  ghost:   { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' },
  success: { background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)' },
};

export function Btn({
  children, onClick, variant = 'primary', disabled = false, size = 'sm', className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const pad = { xs: 'px-2 py-1 text-[10px]', sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm' }[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-bold transition-all hover:opacity-90 active:scale-95 ${pad} ${className}`}
      style={{
        ...BTN_STYLES[variant],
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label, value, onChange, type = 'text', placeholder = '', className = '',
}: {
  label?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-gray-700 outline-none focus:ring-1 focus:ring-purple-500/50"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'Exo 2', sans-serif",
        }}
      />
    </div>
  );
}

export function Select({
  label, value, onChange, options, className = '',
}: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-purple-500/50"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#1a1528' }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg,#1a1528,#141020)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-sm font-extrabold text-white"
            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}
          >
            {title.toUpperCase()}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors text-lg">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const show = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const Toast = () => toast ? (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold shadow-2xl"
      style={{
        background: toast.type === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
        color: toast.type === 'ok' ? '#6ee7b7' : '#fca5a5',
        backdropFilter: 'blur(8px)',
      }}
    >
      {toast.type === 'ok' ? '✓ ' : '✗ '}{toast.msg}
    </div>
  ) : null;
  return { show, Toast };
}

// ── fmt helpers ───────────────────────────────────────────────────────────────
export const fmtETB  = (n: number) => `${(n ?? 0).toLocaleString()} ETB`;
export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const fmtNum  = (n: number) => (n ?? 0).toLocaleString();