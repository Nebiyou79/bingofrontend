// components/multihot/AutoplayModal.tsx
'use client';

import React, { useState } from 'react';
import { AutoplayConfig, BIG_WIN_THRESHOLD } from '@/hooks/useAutoplay';

const SPIN_PRESETS = [10, 25, 50, 75, 0]; // 0 = ∞

interface Props {
  onStart:  (cfg: AutoplayConfig) => void;
  onClose:  () => void;
}

export default function AutoplayModal({ onStart, onClose }: Props) {
  const [spins,       setSpins]       = useState<number>(25);
  const [winTarget,   setWinTarget]   = useState('');
  const [lossLimit,   setLossLimit]   = useState('');
  const [bigWinStop,  setBigWinStop]  = useState(true);

  const handleStart = () => {
    onStart({
      spins,
      stopOnWin:    winTarget  ? Number(winTarget)  : null,
      stopOnLoss:   lossLimit  ? Number(lossLimit)  : null,
      stopOnBigWin: bigWinStop,
    });
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes ap-in {
          from { transform: translateY(32px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 71,
        background: '#0d1117',
        borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(255,255,255,0.07)',
        borderBottom: 'none',
        padding: '0 0 env(safe-area-inset-bottom,16px)',
        animation: 'ap-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        maxWidth: 540,
        margin: '0 auto',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 20px 16px',
        }}>
          <span style={{
            fontFamily: "'Exo 2', sans-serif", fontSize: '1rem',
            fontWeight: 900, color: '#fff', letterSpacing: '0.1em',
          }}>AUTOPLAY</span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', width: 30, height: 30, borderRadius: 8,
              cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Spin count presets ── */}
          <div>
            <label style={labelStyle}>Number of Spins</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {SPIN_PRESETS.map(v => {
                const active = spins === v;
                return (
                  <button
                    key={v}
                    onClick={() => setSpins(v)}
                    style={{
                      flex: 1, height: 44, borderRadius: 10,
                      background:  active ? '#ef4444' : 'rgba(255,255,255,0.04)',
                      border:      active ? 'none' : '1px solid rgba(255,255,255,0.09)',
                      color:       active ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontFamily:  "'Exo 2', sans-serif",
                      fontSize:    v === 0 ? '1.2rem' : '0.95rem',
                      fontWeight:  900,
                      cursor:      'pointer',
                      transition:  'all 0.15s',
                    }}
                  >
                    {v === 0 ? '∞' : v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Spin Till section ── */}
          <div>
            <label style={sectionLabel}>SPIN TILL</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <div style={rowStyle}>
                <span style={rowLabelStyle}>If win reaches or exceeds</span>
                <div style={inputWrapStyle}>
                  <input
                    type="number"
                    placeholder="—"
                    value={winTarget}
                    onChange={e => setWinTarget(e.target.value)}
                    style={inputStyle}
                  />
                  <span style={inputSuffixStyle}>ETB</span>
                </div>
              </div>
              <div style={rowStyle}>
                <span style={rowLabelStyle}>If lose not exceeds</span>
                <div style={inputWrapStyle}>
                  <input
                    type="number"
                    placeholder="—"
                    value={lossLimit}
                    onChange={e => setLossLimit(e.target.value)}
                    style={inputStyle}
                  />
                  <span style={inputSuffixStyle}>ETB</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stop Spin section ── */}
          <div>
            <label style={sectionLabel}>STOP SPIN</label>
            <div style={{ ...rowStyle, marginTop: 8 }}>
              <span style={rowLabelStyle}>
                If I win BIG WIN
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>
                  (≥ ETB {BIG_WIN_THRESHOLD})
                </span>
              </span>
              {/* Toggle */}
              <div
                onClick={() => setBigWinStop(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: bigWinStop ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3, left: bigWinStop ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>

          {/* ── START ── */}
          <button
            onClick={handleStart}
            style={{
              width: '100%', height: 52, borderRadius: 14,
              background: '#ef4444',
              border: 'none',
              color: '#fff', fontFamily: "'Exo 2', sans-serif",
              fontSize: '1rem', fontWeight: 900, letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(239,68,68,0.4)',
              transition: 'all 0.15s',
            }}
          >
            START
          </button>
        </div>
      </div>
    </>
  );
}

// ── micro-styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: "'Exo 2', sans-serif",
  fontSize: 11, fontWeight: 700,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.08em',
};

const sectionLabel: React.CSSProperties = {
  ...labelStyle,
  letterSpacing: '0.12em',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  paddingBottom: 6,
  display: 'block',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', gap: 12,
};

const rowLabelStyle: React.CSSProperties = {
  fontFamily: "'Exo 2', sans-serif",
  fontSize: 13, color: 'rgba(255,255,255,0.65)',
};

const inputWrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, overflow: 'hidden',
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  width: 70, height: 36, background: 'transparent', border: 'none',
  color: '#fff', fontSize: 13, fontWeight: 700,
  textAlign: 'right', paddingRight: 4, paddingLeft: 10,
  outline: 'none', fontFamily: "'Exo 2', sans-serif",
};

const inputSuffixStyle: React.CSSProperties = {
  fontFamily: "'Exo 2', sans-serif",
  fontSize: 10, fontWeight: 700,
  color: 'rgba(255,255,255,0.3)',
  paddingRight: 8,
};