/**
 * components/wallet/WalletHero.tsx
 * Premium hero balance card. Refined stat boxes, cleaner layout, subtle glow.
 */

import React from 'react';

interface WalletHeroProps {
  balance: number;
  bonusBalance: number;
  total: number;
  loading: boolean;
  onRefresh: () => void | Promise<void>;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  vipLevel?: number;
  totalWagered?: number;
}

const VIP_LABELS: Record<number, string> = {
  0: 'BRONZE',
  1: 'SILVER I',  2: 'SILVER II',  3: 'SILVER III',
  4: 'GOLD I',    5: 'GOLD II',    6: 'GOLD III',
  7: 'PLATINUM I', 8: 'PLATINUM II',
  9: 'DIAMOND',   10: 'ELITE',
};

function Skeleton({ w, h }: { w: string; h: string }) {
  return (
    <div style={{
      width: w, height: h,
      background: 'rgba(255,255,255,0.07)',
      borderRadius: '8px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

function StatBox({
  label, value, sub, color, loading,
}: { label: string; value: string; sub?: string; color: string; loading: boolean }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '14px 18px',
    }}>
      <p style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '1.6px',
        textTransform: 'uppercase', color: '#6B7280', marginBottom: '8px',
      }}>
        {label}
      </p>
      {loading
        ? <Skeleton w="110px" h="20px" />
        : <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '17px', fontWeight: 600, color, margin: 0 }}>{value}</p>
      }
      {sub && <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '3px' }}>{sub}</p>}
    </div>
  );
}

export function WalletHero({
  balance, bonusBalance, total, loading, onRefresh,
  onDeposit, onWithdraw, vipLevel = 0,
}: WalletHeroProps) {
  const fmt   = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usd   = (n: number) => `≈ $${(n * 0.0197).toFixed(2)} USD`;
  const vipLabel = VIP_LABELS[vipLevel] ?? 'BRONZE';

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(109,40,217,0.22) 0%, rgba(79,70,229,0.12) 55%, rgba(8,8,12,0.9) 100%)',
      border: '1px solid rgba(124,58,237,0.28)',
      borderRadius: '22px',
      padding: '28px 32px 24px',
      marginBottom: '18px',
      overflow: 'hidden',
    }}>
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '-70px', right: '-70px',
        width: '280px', height: '280px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.30), transparent 68%)',
        animation: 'glow 3.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-50px', left: '30%',
        width: '220px', height: '220px',
        background: 'radial-gradient(circle, rgba(79,70,229,0.15), transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Top row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '24px', position: 'relative', zIndex: 1,
      }}>
        {/* Balance */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <span style={{ fontSize: '15px' }}>👑</span>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '12px', fontWeight: 600, color: '#F59E0B', letterSpacing: '1px',
            }}>
              VIP {vipLabel}
            </span>
          </div>

          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
            textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px',
          }}>
            Total Balance
          </p>

          {loading ? (
            <Skeleton w="260px" h="52px" />
          ) : (
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '52px', fontWeight: 700,
              letterSpacing: '-1px', lineHeight: 1,
              display: 'flex', alignItems: 'baseline', gap: '10px',
            }}>
              {total.toLocaleString('en-ET', { maximumFractionDigits: 0 })}
              <span style={{ fontSize: '20px', color: '#6B7280', fontWeight: 500 }}>ETB</span>
            </div>
          )}

          {!loading && (
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{usd(total)}</p>
          )}

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(0,230,118,0.10)',
            border: '1px solid rgba(0,230,118,0.25)',
            borderRadius: '20px', padding: '3px 12px',
            fontSize: '11px', fontWeight: 700, color: '#00E676',
            marginTop: '12px',
          }}>
            ▲ +2.4% Today
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onDeposit}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '11px 22px',
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                color: '#fff',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px',
                border: 'none', borderRadius: '11px', cursor: 'pointer',
                boxShadow: '0 4px 22px rgba(124,58,237,0.45)',
                transition: 'all 0.2s',
              }}
            >
              ⬇ DEPOSIT
            </button>
            <button
              onClick={onWithdraw}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '11px 22px',
                background: 'rgba(255,255,255,0.06)',
                color: '#E5E7EB',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '11px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ⬆ WITHDRAW
            </button>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              background: 'rgba(255,255,255,0.04)',
              color: '#6B7280',
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '12px', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
              cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
            }}
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', position: 'relative', zIndex: 1 }}>
        <StatBox label="Available"    value={fmt(balance)}      sub={usd(balance)}      color="#00E676" loading={loading} />
        <StatBox label="Bonus / Locked" value={fmt(bonusBalance)} sub={usd(bonusBalance)} color="#A78BFA" loading={loading} />
        <StatBox label="Total Deposited" value="320,000.00"      sub="All Time"          color="#F59E0B" loading={false}   />
      </div>
    </div>
  );
}