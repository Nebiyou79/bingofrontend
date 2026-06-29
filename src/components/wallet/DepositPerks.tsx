/**
 * components/wallet/DepositPerks.tsx — Deposit Perks Component
 */

import React from 'react';

export function DepositPerks() {
  const perks = [
    { icon: '⚡', bg: 'rgba(0,230,118,0.1)', label: 'Instant Processing', sub: 'Most deposits credited instantly' },
    { icon: '🛡', bg: 'rgba(124,58,237,0.1)', label: 'Secure & Encrypted', sub: 'Your data and funds are 100% safe' },
    { icon: '🎁', bg: 'rgba(247,181,0,0.1)', label: 'Get 5% Bonus', sub: 'On every deposit ≥ 100 ETB', right: '+5%', rightColor: '#F7B500' },
    { icon: '💬', bg: 'rgba(59,130,246,0.1)', label: '24/7 Support', sub: "We're here anytime you need us" },
  ];

  return (
    <div style={{ background: '#10121A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '14px' }}>
        Deposit Benefits
      </div>
      {perks.map(p => (
        <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
            {p.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.label}</div>
            <div style={{ fontSize: '11px', color: '#8890A8' }}>{p.sub}</div>
          </div>
          {p.right && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: p.rightColor }}>
              {p.right}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}