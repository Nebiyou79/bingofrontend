/* eslint-disable @typescript-eslint/no-explicit-any */
// components/cardDraw/GameHistory.tsx
/**
 * Bane Games — Card Draw Game History
 *
 * Upgrades per UI guide:
 * - Mobile: table replaced by stacked history cards
 * - Desktop: table retained, improved typography
 * - Verify opens an inline modal (not alert())
 * - Shimmer skeleton loader
 * - Smooth row entrance animation
 */

import React, { useState } from 'react';
import type { CardDrawRound } from '../../lib/api/cardDrawApi';

interface GameHistoryProps {
  rounds: CardDrawRound[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onVerify: (roundId: string) => void;
}

const suitMap: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};

/* ── Verify Modal ── */
function VerifyModal({ round, onClose }: { round: CardDrawRound; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const fields: { label: string; value: string; key: string }[] = [
    { label: 'Round ID',          value: round._id,                              key: 'id' },
    { label: 'Server Seed Hash',  value: (round as any).serverSeedHash ?? 'N/A', key: 'hash' },
    { label: 'Client Seed',       value: (round as any).clientSeed ?? 'N/A',     key: 'seed' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(6,6,10,0.80)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          borderRadius: 20,
          background: 'var(--bg-elevated,#161622)',
          border: '1px solid rgba(108,60,225,0.30)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Rajdhani', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: 2, color: '#F0F0F8' }}>
              🔒 VERIFY ROUND
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted,#3F4A5C)', letterSpacing: '0.06em' }}>
              Confirm provably fair outcome
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '6px 10px', color: '#8892A4', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.key} style={{ background: 'rgba(0,0,0,0.30)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#3F4A5C)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {f.label}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#F0F0F8', flex: 1, wordBreak: 'break-all' }}>
                  {f.value}
                </span>
                <button
                  onClick={() => copy(f.value, f.key)}
                  style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                    background: copied === f.key ? 'rgba(0,230,118,0.15)' : 'rgba(108,60,225,0.15)',
                    border: `1px solid ${copied === f.key ? 'rgba(0,230,118,0.35)' : 'rgba(108,60,225,0.35)'}`,
                    color: copied === f.key ? 'var(--green,#00E676)' : 'var(--brand-light,#9B6EFF)',
                  }}
                >
                  {copied === f.key ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ margin: '16px 0 0', fontSize: 11, color: 'var(--text-muted,#3F4A5C)', lineHeight: 1.6, textAlign: 'center' }}>
          Hash the server seed to match the published hash. Use HMAC-SHA256 with client seed to reproduce the outcome.
        </p>
      </div>
    </div>
  );
}

/* ── Skeleton row ── */
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {[120, 80, 48, 80, 80, 56, 48].map((w, i) => (
        <td key={i} style={{ padding: '12px 12px' }}>
          <div style={{ height: 14, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'skel-wave 1.5s ease infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.06) 75%)' }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Desktop table row ── */
function HistoryRow({ round, onVerify, index }: { round: CardDrawRound; onVerify: (id: string) => void; index: number }) {
  const won        = round.netProfit > 0;
  const date       = new Date(round.createdAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  const suitSymbol = suitMap[round.drawnCard.suit] || round.drawnCard.suit;
  const cardColor  = round.drawnCard.color === 'red' ? 'var(--suit-red,#F87171)' : 'var(--suit-black,#94A3B8)';

  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        animation: `row-in 0.3s ease ${index * 40}ms both`,
      }}
    >
      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted,#3F4A5C)', fontFamily: "'JetBrains Mono', monospace" }}>{date}</td>
      <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary,#8892A4)' }}>
        {round.totalWagered.toLocaleString()} ETB
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: cardColor, fontFamily: "'JetBrains Mono', monospace" }}>
          {round.drawnCard.rank}{suitSymbol}
        </span>
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--gold,#F4B740)', fontWeight: 700 }}>
        {round.totalPayout.toLocaleString()} ETB
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: round.netProfit >= 0 ? 'var(--green,#00E676)' : 'var(--red,#FF4757)' }}>
        {round.netProfit >= 0 ? '+' : ''}{round.netProfit.toLocaleString()} ETB
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 9999, letterSpacing: '0.06em',
          background: won ? 'rgba(0,230,118,0.10)' : 'rgba(255,71,87,0.10)',
          border: `1px solid ${won ? 'rgba(0,230,118,0.28)' : 'rgba(255,71,87,0.28)'}`,
          color: won ? 'var(--green,#00E676)' : 'var(--red,#FF4757)',
        }}>
          {won ? 'Won' : 'Lost'}
        </span>
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        <button onClick={() => onVerify(round._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--brand-light,#9B6EFF)', textDecoration: 'underline', fontWeight: 600 }}>
          Verify
        </button>
      </td>
    </tr>
  );
}

/* ── Mobile card ── */
function HistoryCard({ round, onVerify, index }: { round: CardDrawRound; onVerify: (id: string) => void; index: number }) {
  const won        = round.netProfit > 0;
  const date       = new Date(round.createdAt).toLocaleString('en-ET', { dateStyle: 'short', timeStyle: 'short' });
  const suitSymbol = suitMap[round.drawnCard.suit] || round.drawnCard.suit;

  return (
    <div style={{
      borderRadius: 12, padding: '12px 14px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      animation: `row-in 0.3s ease ${index * 50}ms both`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Card badge */}
      <div style={{
        width: 44, height: 56, borderRadius: 8, flexShrink: 0,
        background: 'rgba(255,255,255,0.95)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, fontFamily: "'Rajdhani', sans-serif", color: round.drawnCard.color === 'red' ? '#DC2626' : '#1a1a1a', lineHeight: 1 }}>
          {round.drawnCard.rank}
        </span>
        <span style={{ fontSize: 16, color: round.drawnCard.color === 'red' ? '#DC2626' : '#1a1a1a', lineHeight: 1 }}>
          {suitSymbol}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: won ? 'var(--green,#00E676)' : 'var(--red,#FF4757)' }}>
            {round.netProfit >= 0 ? '+' : ''}{round.netProfit.toLocaleString()} ETB
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999,
            background: won ? 'rgba(0,230,118,0.10)' : 'rgba(255,71,87,0.10)',
            border: `1px solid ${won ? 'rgba(0,230,118,0.28)' : 'rgba(255,71,87,0.28)'}`,
            color: won ? 'var(--green,#00E676)' : 'var(--red,#FF4757)',
          }}>
            {won ? '✓ Won' : '✗ Lost'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted,#3F4A5C)' }}>
            Wagered: <span style={{ color: 'var(--text-secondary,#8892A4)', fontWeight: 600 }}>{round.totalWagered.toLocaleString()}</span>
            {' · '}
            Payout: <span style={{ color: 'var(--gold,#F4B740)', fontWeight: 600 }}>{round.totalPayout.toLocaleString()}</span>
          </span>
          <button onClick={() => onVerify(round._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--brand-light,#9B6EFF)', textDecoration: 'underline', padding: 0 }}>
            Verify
          </button>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-muted,#3F4A5C)' }}>{date}</p>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function GameHistory({ rounds, loading, page, totalPages, total, onPageChange, onVerify }: GameHistoryProps) {
  const [verifyRound, setVerifyRound] = useState<CardDrawRound | null>(null);

  const handleVerify = (id: string) => {
    const round = rounds.find(r => r._id === id) ?? null;
    if (round) setVerifyRound(round);
    else onVerify(id); // fallback to parent handler
  };

  return (
    <>
      <style>{`
        @keyframes row-in {
          from { transform: translateY(6px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes skel-wave {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, fontSize: 10, fontWeight: 900, color: 'var(--text-muted,#3F4A5C)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            My Games
          </h2>
          {total > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted,#3F4A5C)' }}>{total} total</span>
          )}
        </div>

        {loading ? (
          /* ── Skeletons ── */
          <>
            {/* Desktop skeleton */}
            <div className="hidden md:block overflow-x-auto">
              <table style={{ width: '100%' }}>
                <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
              </table>
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'skel-wave 1.5s ease infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)' }} />
              ))}
            </div>
          </>
        ) : rounds.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🃏</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted,#3F4A5C)', margin: 0 }}>No games yet. Start your first round above!</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div style={{ overflowX: 'auto' }} className="hidden md:block">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Date', 'Wagered', 'Card', 'Payout', 'Net', 'Result', 'Fair'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: 'var(--text-muted,#3F4A5C)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((r, i) => <HistoryRow key={r._id} round={r} onVerify={handleVerify} index={i} />)}
                </tbody>
              </table>
            </div>

            {/* Mobile card stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }} className="md:hidden">
              {rounds.map((r, i) => <HistoryCard key={r._id} round={r} onVerify={handleVerify} index={i} />)}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted,#3F4A5C)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ label: '← Prev', dir: -1, disabled: page <= 1 }, { label: 'Next →', dir: 1, disabled: page >= totalPages }].map(({ label, dir, disabled }) => (
                <button
                  key={label}
                  disabled={disabled}
                  onClick={() => onPageChange(page + dir)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.25 : 1, transition: 'all 0.15s',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'var(--text-secondary,#8892A4)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verify modal */}
      {verifyRound && <VerifyModal round={verifyRound} onClose={() => setVerifyRound(null)} />}
    </>
  );
}