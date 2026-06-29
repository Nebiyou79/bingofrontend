/**
 * components/wallet/BonusBanner.tsx — Bonus Banner Component
 */

import React from 'react';

interface BonusBannerProps {
  onClaim?: () => void;
}

export function BonusBanner({ onClaim }: BonusBannerProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(247,181,0,0.1), rgba(255,140,0,0.05))',
      border: '1px solid rgba(247,181,0,0.25)',
      borderRadius: '14px', padding: '14px 18px', marginBottom: '24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700 }}>
          <span style={{ color: '#F0F0F8' }}>DEPOSIT NOW & </span>
          <span style={{ color: '#F7B500' }}>GET BONUS! 🎁</span>
        </div>
        <div style={{ fontSize: '12px', color: '#8890A8', marginTop: '3px' }}>
          Get up to 10% bonus on your deposit · Minimum 100 ETB
        </div>
      </div>
      <button
        onClick={onClaim}
        style={{
          background: 'linear-gradient(135deg, #F7B500, #FF8C00)',
          color: '#000', fontWeight: 800, fontSize: '12px',
          padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
          border: 'none', fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.5px',
          whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '16px',
        }}
      >
        CLAIM BONUS →
      </button>
    </div>
  );
}