// components/multihot/WinTierPopup.tsx
'use client';

import React, { useEffect, useState } from 'react';

// ── Tier definitions ─────────────────────────────────────────────────────────
export const WIN_TIERS = {
  jackpot:   { min: 500, label: 'JACKPOT',   color: '#ffd700', glow: 'rgba(255,215,0,0.7)',   coins: 10 },
  superWin:  { min: 200, label: 'SUPER WIN', color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', coins: 7  },
  bigWin:    { min: 50,  label: 'BIG WIN',   color: '#ef4444', glow: 'rgba(239,68,68,0.6)',   coins: 5  },
} as const;

export type WinTier = keyof typeof WIN_TIERS;

export function getTier(amount: number): WinTier | null {
  if (amount >= WIN_TIERS.jackpot.min)  return 'jackpot';
  if (amount >= WIN_TIERS.superWin.min) return 'superWin';
  if (amount >= WIN_TIERS.bigWin.min)   return 'bigWin';
  return null;
}

interface Props {
  amount:   number;
  tier:     WinTier;
  onDone:   () => void;
}

const AUTO_DISMISS_MS = 4000;

export default function WinTierPopup({ amount, tier, onDone }: Props) {
  const cfg = WIN_TIERS[tier];
  const [leaving, setLeaving] = useState(false);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDone, 500);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(onDone, 500);
  };

  return (
    <>
      <style>{`
        @keyframes wt-bg-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wt-bg-out { from { opacity: 1; } to { opacity: 0; } }

        @keyframes wt-label-in {
          0%   { opacity: 0; transform: scale(0.5) translateY(20px); }
          60%  { opacity: 1; transform: scale(1.08) translateY(-4px); }
          100% {             transform: scale(1)    translateY(0); }
        }
        @keyframes wt-amount-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wt-label-pulse {
          0%,100% { text-shadow: 0 0 30px var(--wt-glow), 0 0 60px var(--wt-glow); }
          50%     { text-shadow: 0 0 60px var(--wt-glow), 0 0 120px var(--wt-glow), 0 0 4px rgba(255,255,255,0.8); }
        }
        @keyframes wt-coin {
          0%   { opacity: 1; transform: translateY(0)    rotate(0deg)   scale(1); }
          100% { opacity: 0; transform: translateY(110px) rotate(540deg) scale(0.5); }
        }
        @keyframes wt-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes wt-out {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.06); }
        }
        @keyframes wt-ray-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Full-screen backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: leaving ? 'wt-bg-out 0.5s ease forwards' : 'wt-bg-in 0.3s ease both',
          cursor: 'pointer',
        }}
      >
        {/* Content wrapper — stops click propagation so internal taps don't dismiss */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 16,
            animation: leaving ? 'wt-out 0.5s ease forwards' : 'none',
          }}
        >
          {/* Spinning rays behind the label */}
          <div style={{
            position: 'absolute',
            width: 340, height: 340,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundImage: `repeating-conic-gradient(${cfg.color}08 0deg, transparent 4deg, transparent 18deg, ${cfg.color}05 22deg)`,
            borderRadius: '50%',
            animation: 'wt-ray-spin 12s linear infinite',
            pointerEvents: 'none',
          }} />

          {/* Ambient glow orb */}
          <div style={{
            position: 'absolute',
            width: 260, height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            opacity: 0.35,
            pointerEvents: 'none',
          }} />

          {/* Coins */}
          {Array.from({ length: cfg.coins }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: -10,
                left: `${6 + i * (88 / (cfg.coins - 1))}%`,
                fontSize: tier === 'jackpot' ? '2rem' : '1.5rem',
                animation: `wt-coin ${0.6 + (i % 3) * 0.22}s ease-in ${i * 0.11}s both`,
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >💰</div>
          ))}

          {/* Tier label */}
          <div
            style={{
              fontFamily:    "'Exo 2', sans-serif",
              fontSize:      tier === 'jackpot' ? '4rem' : tier === 'superWin' ? '3.2rem' : '2.8rem',
              fontWeight:    900,
              letterSpacing: '0.12em',
              color:         cfg.color,
              // shimmer effect
              background:    `linear-gradient(90deg, ${cfg.color} 0%, #fff 40%, ${cfg.color} 60%, #fff 80%, ${cfg.color} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `wt-label-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both,
                           wt-shimmer 2.4s linear 0.5s infinite,
                           wt-label-pulse 1.6s ease-in-out 0.5s infinite`,
              // CSS variable for pulse keyframe
              ['--wt-glow' as string]: cfg.glow,
              textAlign: 'center',
              zIndex: 3,
              position: 'relative',
            }}
          >
            {cfg.label}
          </div>

          {/* Amount */}
          <div
            style={{
              fontFamily:    "'Exo 2', sans-serif",
              fontSize:      '2.4rem',
              fontWeight:    900,
              color:         '#fff',
              textShadow:    `0 0 30px ${cfg.glow}`,
              animation:     'wt-amount-in 0.45s ease 0.4s both',
              letterSpacing: '0.04em',
              zIndex: 3,
              position: 'relative',
            }}
          >
            ETB {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Tap to continue hint */}
          <div style={{
            fontFamily:    "'Exo 2', sans-serif",
            fontSize:      11,
            color:         'rgba(255,255,255,0.25)',
            letterSpacing: '0.1em',
            animation:     'wt-amount-in 0.4s ease 1s both',
            zIndex: 3,
            position: 'relative',
          }}>
            tap anywhere to continue
          </div>
        </div>
      </div>
    </>
  );
}