/**
 * components/wallet/QuickActions.tsx — Quick Actions Component
 */

import React from 'react';

interface QuickActionsProps {
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export function QuickActions({ onDeposit, onWithdraw }: QuickActionsProps) {
  const actions = [
    { icon: '⬇', label: 'Deposit', sub: 'Add funds', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', onClick: onDeposit },
    { icon: '⬆', label: 'Withdraw', sub: 'Cash out', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.25)', onClick: onWithdraw },
    { icon: '🎁', label: 'Rewards', sub: 'View bonuses', bg: 'rgba(247,181,0,0.1)', border: 'rgba(247,181,0,0.25)', onClick: undefined },
    { icon: '👥', label: 'Referrals', sub: 'Invite & earn', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', onClick: undefined },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px' }}>Quick Actions</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {actions.map(a => (
          <div
            key={a.label}
            onClick={a.onClick}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px', padding: '16px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.25s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: a.bg, border: `1px solid ${a.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px' }}>
              {a.icon}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px' }}>{a.label}</div>
            <div style={{ fontSize: '10px', color: '#8890A8', marginTop: '3px' }}>{a.sub}</div>
          </div>
        ))}
      </div>
    </>
  );
}