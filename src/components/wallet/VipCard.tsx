/**
 * components/wallet/VipCard.tsx — VIP Card Component
 */

import React from 'react';

const VIP_LABELS: Record<number, string> = {
  0: 'BRONZE', 1: 'SILVER I', 2: 'SILVER II', 3: 'SILVER III',
  4: 'GOLD I', 5: 'GOLD II', 6: 'GOLD III',
  7: 'PLATINUM I', 8: 'PLATINUM II', 9: 'DIAMOND', 10: 'ELITE',
};

const VIP_THRESHOLDS = [0, 100, 500, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 999999];

interface VipCardProps {
  vipLevel: number;
  vipPoints: number;
}

export function VipCard({ vipLevel, vipPoints }: VipCardProps) {
  const currentThreshold = VIP_THRESHOLDS[vipLevel] || 0;
  const nextThreshold = VIP_THRESHOLDS[vipLevel + 1] || VIP_THRESHOLDS[vipLevel];
  const progress = Math.min(100, ((vipPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
  const nextLabel = VIP_LABELS[vipLevel + 1] || 'MAX';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(247,181,0,0.15), rgba(255,140,0,0.08))',
      border: '1px solid rgba(247,181,0,0.3)',
      borderRadius: '16px', padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #F7B500, #FF8C00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
        }}>👑</div>
        <div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: '#F7B500' }}>
            VIP {VIP_LABELS[vipLevel]}
          </div>
          <div style={{ fontSize: '11px', color: '#8890A8' }}>Next: {nextLabel}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8890A8', marginBottom: '4px' }}>
        <span>XP Progress</span>
        <span>{vipPoints.toLocaleString()} / {nextThreshold.toLocaleString()}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #F7B500, #FF8C00)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
        {[['Cashback', '5%'], ['Bonus', '10%'], ['Level', String(vipLevel)]].map(([l, v]) => (
          <div key={l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: '#8890A8' }}>{l}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: '#F7B500' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}