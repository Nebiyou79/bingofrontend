/**
 * pages/wallet.tsx — DashBets Wallet Page
 * Wrapped in AppLayout. Refined UI system throughout.
 */

import React, { useState } from 'react';
import type { NextPage } from 'next';
import { withAuth } from '../hoc/withAuth';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/layout/AppLayout';
import { WalletHero } from '../components/wallet/WalletHero';
import { QuickActions } from '../components/wallet/QuickActions';
import { DepositFlow } from '../components/wallet/DepositFlow';
import { WithdrawalForm } from '../components/wallet/WithdrawalForm';
import { TransactionList } from '../components/wallet/TransactionList';
import { VipCard } from '../components/wallet/VipCard';
import { WalletStats } from '../components/wallet/WalletStats';
import { DepositPerks } from '../components/wallet/DepositPerks';
import { BonusBanner } from '../components/wallet/BonusBanner';

export type WalletTab = 'deposit' | 'withdraw' | 'history';

const TABS: { id: WalletTab; label: string; icon: string; dot?: boolean }[] = [
  { id: 'deposit',  label: 'Deposit',  icon: '⬇', dot: true  },
  { id: 'withdraw', label: 'Withdraw', icon: '⬆'             },
  { id: 'history',  label: 'History',  icon: '📋'             },
];

const WalletPage: NextPage = () => {
  const { balance, bonusBalance, total, loading, refetch } = useWallet();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>('deposit');

  const handleSuccess = async () => { await refetch(); };

  return (
    <AppLayout title="Wallet">
      <div
        className="relative min-h-full"
        style={{ background: '#08080C', color: '#F0F0F8', fontFamily: "'Exo 2', sans-serif" }}
      >
        {/* Ambient background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-100px', left: '10%',
            width: '480px', height: '480px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.10), transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-80px', right: '5%',
            width: '360px', height: '360px',
            background: 'radial-gradient(circle, rgba(79,70,229,0.07), transparent 70%)',
          }} />
        </div>

        <div className="relative" style={{ zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 48px' }}>

          {/* ── Page header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '22px' }}>💰</span>
                <h1 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '26px', fontWeight: 700, letterSpacing: '1.5px', margin: 0,
                }}>
                  WALLET
                </h1>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                Manage your ETB balance · Deposits credited instantly
              </p>
            </div>

            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(247,181,0,0.08)',
                border: '1px solid rgba(247,181,0,0.2)',
                borderRadius: '24px', padding: '7px 16px',
              }}>
                <span style={{ fontSize: '15px' }}>👑</span>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '13px', fontWeight: 600, color: '#F7B500', letterSpacing: '0.8px',
                }}>
                  VIP {user.vipLevel ? `LEVEL ${user.vipLevel}` : 'BRONZE'}
                </span>
              </div>
            )}
          </div>

          {/* ── Hero ── */}
          <WalletHero
            balance={balance}
            bonusBalance={bonusBalance}
            total={total}
            loading={loading}
            onRefresh={refetch}
            vipLevel={user?.vipLevel}
            totalWagered={user?.totalWagered}
            onDeposit={() => setActiveTab('deposit')}
            onWithdraw={() => setActiveTab('withdraw')}
          />

          {/* ── Bonus banner ── */}
          <BonusBanner onClaim={() => setActiveTab('deposit')} />

          {/* ── Quick actions ── */}
          <QuickActions
            onDeposit={() => setActiveTab('deposit')}
            onWithdraw={() => setActiveTab('withdraw')}
          />

          {/* ── Main content grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

            {/* Left: Tab panel */}
            <div style={{
              background: 'rgba(16,18,26,0.95)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
            }}>
              {/* Tab bar */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                padding: '0 4px',
              }}>
                {TABS.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '7px', padding: '15px 8px',
                        background: 'transparent', border: 'none',
                        borderBottom: active ? '2px solid #7C3AED' : '2px solid transparent',
                        color: active ? '#C4B5FD' : '#6B7280',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px', fontWeight: 700, letterSpacing: '0.4px',
                        cursor: 'pointer', transition: 'all 0.18s',
                        marginBottom: '-1px',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{tab.icon}</span>
                      {tab.label}
                      {tab.dot && !active && (
                        <span style={{
                          display: 'inline-block', width: '6px', height: '6px',
                          background: '#EF4444', borderRadius: '50%',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div style={{ padding: '28px' }}>
                {activeTab === 'deposit'  && <DepositFlow onSuccess={handleSuccess} />}
                {activeTab === 'withdraw' && <WithdrawalForm availableBalance={balance} onSuccess={handleSuccess} />}
                {activeTab === 'history'  && <TransactionList />}
              </div>
            </div>

            {/* Right: sidebar panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <VipCard vipLevel={user?.vipLevel ?? 0} vipPoints={user?.vipPoints ?? 0} />
              <WalletStats totalWagered={user?.totalWagered ?? 0} biggestWin={user?.biggestWin ?? 0} />
              <DepositPerks />
            </div>
          </div>
        </div>
      </div>

      {/* Global font + keyframes injected once at page level */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes glow  { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
      `}</style>
    </AppLayout>
  );
};

export default withAuth(WalletPage);