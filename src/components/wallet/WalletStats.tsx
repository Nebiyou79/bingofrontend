/**
 * components/wallet/WalletStats.tsx — Wallet Statistics Component
 */

import React from 'react';

interface WalletStatsProps {
  totalWagered: number;
  biggestWin: number;
}

export function WalletStats({ totalWagered, biggestWin }: WalletStatsProps) {
  const stats = [
    { label: 'Total Wagered', value: totalWagered >= 1000 ? `${(totalWagered / 1000).toFixed(0)}K ETB` : `${totalWagered.toLocaleString()} ETB`, color: '#9F5FFA' },
    { label: 'Biggest Win', value: `${biggestWin.toLocaleString()} ETB`, color: '#F7B500' },
    { label: 'Win Streak', value: '🔥 7', color: '#00E676' },
    { label: 'Total Spins', value: '3,241', color: '#3B82F6' },
  ];

  return (
    <div style={{ background: '#10121A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '14px' }}>
        Wallet Stats
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#4A5068', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}