// pages/plinko/index.tsx (or app/plinko/page.tsx)
// DashBets — Plinko X Page
//
// FIX: balance initialised from useAuthContext() and re-synced via useEffect
//      whenever auth.user changes (async auth restore was causing 0.00 balance).
//
// CLEANUP: B+ badge removed. Responsive: stacked on mobile, sidebar on desktop.
// ADDED: Professional layout with proper spacing and visual hierarchy

'use client';

import React, { useState, useEffect, useRef } from 'react';
import PlinkoCanvas   from '../../../components/plinko/PlinkoCanvas';
import BucketDisplay  from '../../../components/plinko/BucketDisplay';
import PlinkoBetPanel from '../../../components/plinko/PlinkoBetPanel';
import { usePlinkoGame }  from '../../../hooks/usePlinkoGame';
import { useAuthContext } from '../../../context/AuthContext';

// ── How to Play modal ────────────────────────────────────────────────────────

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0f1832, #1a1145)',
          borderRadius: 20,
          border: '1px solid rgba(99,102,241,0.25)',
          maxWidth: 520, width: '100%', maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '0.08em' }}>
            HOW TO PLAY
          </span>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(168,85,247,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 20, fontWeight: 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>×</button>
        </div>

        <div style={{ padding: '8px 12px 24px' }}>
          {[
            { n: '01', text: 'Choose your bet amount, pick a risk level, then press HOLD & DROP. Keep holding to drop multiple balls continuously.' },
            { n: '02', text: 'The ball bounces through pegs and lands in a bucket. Each bucket has a multiplier — the further from center, the higher the reward.' },
            { n: '03', text: 'Low risk: many medium wins. Medium risk: balanced. High risk: rare but huge payouts up to 1000× your bet.' },
            { n: '04', text: 'All outcomes are provably fair using HMAC-SHA256. You can verify any result using the bet ID after the drop.' },
          ].map(s => (
            <div key={s.n} style={{
              margin: '12px 16px 0',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ 
                color: '#a78bfa', fontWeight: 900, fontSize: 15, 
                minWidth: 28, paddingTop: 1 
              }}>{s.n}</span>
              <span style={{ 
                color: 'rgba(255,255,255,0.78)', fontSize: 13, 
                lineHeight: 1.6, fontWeight: 400 
              }}>{s.text}</span>
            </div>
          ))}
          <div style={{ padding: '24px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '12px 40px', borderRadius: 28,
              background: 'linear-gradient(135deg,#7c3aed,#a21caf)',
              border: 'none', color: '#fff', fontWeight: 800, fontSize: 15,
              cursor: 'pointer', boxShadow: '0 0 24px rgba(168,85,247,0.4)',
              letterSpacing: '0.04em',
            }}>GOT IT</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlinkoPage() {
  // ── Auth — use context so balance is always in sync with auth restore ──────
  const auth = useAuthContext();

  // Local balance state seeded from auth; re-synced when auth.user changes
  const [balance, setBalance] = useState<number>(auth.user?.balance ?? 0);
  useEffect(() => {
    if (auth.user?.balance !== undefined) {
      setBalance(auth.user.balance);
    }
  }, [auth.user?.balance]);

  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    form, isDropping, activePath, lastResult,
    landedBucket, currentMultiplier, error,
    setBetAmount, setRows, setRisk, placeBet, onAnimationEnd,
  } = usePlinkoGame(setBalance);

  return (
    <div style={{ 
      minHeight: '100dvh', 
      background: 'linear-gradient(180deg, #060c26 0%, #0a1038 100%)',
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      
      {/* ── Top Navigation Bar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ 
            fontWeight: 900, fontSize: 24, letterSpacing: '-0.02em', 
            color: '#fff',
            display: 'flex', alignItems: 'baseline', gap: 2
          }}>
            p<span style={{ color: '#a855f7' }}>linko</span>
            <span style={{ 
              color: '#ef4444', fontStyle: 'italic', fontSize: 14, 
              fontWeight: 700, marginLeft: 2 
            }}>X</span>
          </span>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4ade80', display: 'block',
              boxShadow: '0 0 8px #4ade80',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Online</span>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)', fontSize: 15,
              fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(168,85,247,0.2)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >?</button>
        </div>
      </div>

      {/* ── Main Game Area ──────────────────────────────────────────────────── */}
      <div className="plinko-body" style={{ flex: 1, minHeight: 0 }}>

        {/* Left / main column — Canvas & Buckets */}
        <div className="plinko-main" style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ 
            padding: '20px 20px 0',
            width: '100%', maxWidth: 660,
          }}>
            <PlinkoCanvas
              ref={canvasRef}
              rows={form.rows}
              risk={form.risk}
              activePath={activePath}
              landedBucket={landedBucket}
              onAnimationEnd={onAnimationEnd}
              multiplier={currentMultiplier}
            />
            <div style={{ padding: '4px 2px 0' }}>
              <BucketDisplay
                rows={form.rows}
                risk={form.risk}
                landedBucket={landedBucket}
              />
            </div>
          </div>
        </div>

        {/* Right / control column */}
        <div className="plinko-panel" style={{
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(10px)',
        }}>
          <PlinkoBetPanel
            betAmount={form.betAmount}
            rows={form.rows}
            risk={form.risk}
            onBetAmountChange={setBetAmount}
            onRowsChange={setRows}
            onRiskChange={setRisk}
            onDrop={placeBet}
            isDropping={isDropping}
            lastResult={lastResult}
            error={error}
            balance={balance}
          />
        </div>
      </div>

      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}

      <style>{`
        .plinko-body {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .plinko-main {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          padding: 16px;
        }
        .plinko-panel {
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .plinko-body {
            flex-direction: row;
            align-items: stretch;
          }
          .plinko-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .plinko-panel {
            width: 380px;
            border-left: 1px solid rgba(255,255,255,0.08);
            overflow-y: auto;
            box-shadow: -4px 0 20px rgba(0,0,0,0.3);
          }
        }
        @media (max-width: 767px) {
          .plinko-main {
            padding: 8px;
          }
          .plinko-panel {
            max-height: 60vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}