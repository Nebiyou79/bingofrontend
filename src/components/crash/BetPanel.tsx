// components/crash/BetPanel.tsx
'use client';

import { useEffect, useState, useRef, memo } from 'react';
import type { RoundStatus, MyBetState } from '../../hooks/useCrashGame';

const MAX_AUTO      = 200;
const QUICK_AMOUNTS = [1, 10, 100, 500];

interface BetPanelProps {
  index:      0 | 1;
  myBet:      MyBetState | null;
  status:     RoundStatus;
  multiplier: number;
  balance:    number;
  onPlaceBet: (amount: number, autoCashOut: number | null, index: 0 | 1) => void;
  onCashOut:  (index: 0 | 1) => void;
  onRemove?:  () => void;
  error:      string | null;
}

// Bet 1 = toxic green  |  Bet 2 = cyber cyan
const ACCENT  = ['#72FF3B', '#00E5FF'] as const;
const GLOW_RG = ['rgba(114,255,59,0.35)', 'rgba(0,229,255,0.35)'] as const;
const PANEL_BG = [
  'linear-gradient(160deg, rgba(114,255,59,0.06) 0%, rgba(5,7,13,0.0) 60%)',
  'linear-gradient(160deg, rgba(0,229,255,0.06) 0%, rgba(5,7,13,0.0) 60%)',
] as const;

// Animated count-up hook for payout display
function useCountUp(target: number, active: boolean, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!active) { setDisplay(target); return; }
    const start = display;
    const begin = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - begin) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (target - start) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return display;
}

export const BetPanel = memo(function BetPanel({
  index, myBet, status, multiplier, balance,
  onPlaceBet, onCashOut, onRemove, error,
}: BetPanelProps) {
  const accent  = ACCENT[index];
  const glowRg  = GLOW_RG[index];

  const [tab,         setTab]         = useState<'Bet' | 'Auto'>('Bet');
  const [betAmt,      setBetAmt]      = useState(index === 0 ? 16 : 5);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoAt,      setAutoAt]      = useState(2.0);
  const [placing,     setPlacing]     = useState(false);
  const [wonFlash,    setWonFlash]    = useState(false);
  const [shinePos,    setShinePos]    = useState(-1);

  const canBet     = status === 'waiting' && !myBet;
  const canCashOut = status === 'running'  && myBet?.status === 'active';
  const hasBet     = !!myBet;
  const liveValue  = canCashOut ? myBet!.amount * multiplier : 0;
  const liveCount  = useCountUp(liveValue, canCashOut);

  // Won flash
  useEffect(() => {
    if (myBet?.status === 'won') {
      setWonFlash(true);
      const t = setTimeout(() => setWonFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [myBet?.status]);

  // Shine sweep on CTA hover
  const triggerShine = () => {
    setShinePos(0);
    setTimeout(() => setShinePos(-1), 700);
  };

  const dec  = () => setBetAmt((v) => Math.max(1, +(v - 1).toFixed(2)));
  const inc  = () => setBetAmt((v) => Math.min(10_000, +(v + 1).toFixed(2)));
  const half = () => setBetAmt((v) => Math.max(1, +(v / 2).toFixed(2)));
  const dbl  = () => setBetAmt((v) => Math.min(10_000, +(v * 2).toFixed(2)));

  const handleBet = () => {
    if (!canBet || betAmt < 1 || betAmt > balance) return;
    const auto = (tab === 'Auto' && autoEnabled) ? autoAt : null;
    if (auto !== null && (isNaN(auto) || auto < 1.01)) return;
    setPlacing(true);
    onPlaceBet(betAmt, auto, index);
    setTimeout(() => setPlacing(false), 900);
  };

  return (
    <>
      <style>{`
        @keyframes bp-cashout-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,140,0,0); }
          50%      { box-shadow: 0 0 20px 4px rgba(255,140,0,0.35); }
        }
        @keyframes bp-won-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(114,255,59,0); }
          40%      { box-shadow: 0 0 32px 6px rgba(114,255,59,0.45); }
        }
        @keyframes bp-bet-idle {
          0%,100% { box-shadow: 0 4px 24px rgba(114,255,59,0.30); }
          50%      { box-shadow: 0 4px 36px rgba(114,255,59,0.55); }
        }
        @keyframes bp-shine {
          from { left: -80px; }
          to   { left: calc(100% + 80px); }
        }
        @keyframes bp-placed-in {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bp-win-in {
          0%   { opacity: 0; transform: scale(0.85); }
          60%  { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bp-live-tick {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
        .bp-quick:hover { background: rgba(255,255,255,0.14) !important; color: #fff !important; }
        .bp-quick.active-quick { color: ${accent}; background: ${accent}18 !important; border-color: ${accent}40 !important; }
      `}</style>

      <div
        style={{
          background: `rgba(11,16,32,0.92)`,
          backgroundImage: PANEL_BG[index],
          border: wonFlash
            ? `1px solid ${accent}`
            : `1px solid rgba(255,255,255,0.08)`,
          borderRadius: 18,
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
          boxShadow: wonFlash
            ? `0 0 0 0 transparent, inset 0 1px 0 rgba(255,255,255,0.08)`
            : `inset 0 1px 0 rgba(255,255,255,0.06)`,
          animation: wonFlash ? 'bp-won-glow 1.2s ease' : 'none',
          transition: 'border-color 0.3s',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Bet label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: accent,
                boxShadow: `0 0 8px ${accent}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11, fontWeight: 800,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: accent,
              }}
            >
              Bet {index + 1}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Segmented tab switcher */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 24,
                padding: '3px',
                gap: 2,
              }}
            >
              {(['Bet', 'Auto'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    position: 'relative', zIndex: 1,
                    padding: '4px 14px',
                    borderRadius: 20,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: tab === t ? 700 : 400,
                    background: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.18s',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Remove second panel */}
            {index === 1 && onRemove && (
              <button
                onClick={onRemove}
                style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 15, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && index === 0 && (
          <div
            style={{
              margin: '10px 14px 0',
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(255,70,85,0.09)',
              border: '1px solid rgba(255,70,85,0.28)',
              color: '#FF4655',
              fontSize: 11,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Auto cashout config (Auto tab) ─────────────────────── */}
        {tab === 'Auto' && (
          <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
                userSelect: 'none', flexShrink: 0,
              }}
            >
              <input
                type="checkbox"
                checked={autoEnabled}
                onChange={(e) => setAutoEnabled(e.target.checked)}
                style={{ accentColor: accent, width: 14, height: 14 }}
              />
              Auto cash out at
            </label>
            {autoEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={autoAt}
                  onChange={(e) => setAutoAt(parseFloat(e.target.value) || 2)}
                  min={1.01} max={MAX_AUTO} step={0.1}
                  style={{
                    width: 68, padding: '5px 8px',
                    borderRadius: 8,
                    border: `1px solid rgba(255,255,255,0.12)`,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff', fontSize: 13,
                    fontFamily: "'Courier New', monospace", outline: 'none',
                  }}
                />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 13 }}>x</span>
              </div>
            )}
          </div>
        )}

        {/* ── Outcome feedback: WON ──────────────────────────────── */}
        {myBet?.status === 'won' && (
          <div
            style={{
              margin: '10px 14px 0',
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(114,255,59,0.07)',
              border: '1px solid rgba(114,255,59,0.22)',
              textAlign: 'center',
              animation: 'bp-win-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#72FF3B', marginBottom: 6,
              }}
            >
              ☣ OUTBREAK SURVIVED ☣
            </div>
            <div
              style={{
                color: '#72FF3B', fontWeight: 900, fontSize: 26,
                fontFamily: "'Courier New', monospace",
                textShadow: '0 0 20px rgba(114,255,59,0.7)',
              }}
            >
              +{myBet.payout.toFixed(2)}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>ETB</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace', marginTop: 3 }}>
              @ {myBet.cashedOutAt?.toFixed(2)}x
            </div>
          </div>
        )}

        {/* ── Outcome feedback: LOST ─────────────────────────────── */}
        {myBet?.status === 'lost' && status === 'crashed' && (
          <div
            style={{
              margin: '10px 14px 0',
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(255,70,85,0.06)',
              border: '1px solid rgba(255,70,85,0.16)',
              textAlign: 'center',
              animation: 'bp-placed-in 0.3s ease both',
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(255,70,85,0.6)', marginBottom: 3,
              }}
            >
              ☣ INFECTED
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 14 }}>
              −{myBet.amount.toFixed(2)} ETB
            </div>
          </div>
        )}

        {/* ── Placed / waiting state ─────────────────────────────── */}
        {hasBet && status === 'waiting' && myBet?.status === 'active' && (
          <div
            style={{
              margin: '10px 14px 0',
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${accent}28`,
              textAlign: 'center',
              animation: 'bp-placed-in 0.3s ease both',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>
              BET LOCKED IN
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontFamily: 'monospace', fontSize: 19, marginTop: 2 }}>
              {myBet.amount.toFixed(2)}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>ETB</span>
            </div>
            {myBet.autoCashOut && (
              <div style={{ color: '#FFD700', fontSize: 11, fontFamily: 'monospace', marginTop: 3 }}>
                ⚡ Auto @ {myBet.autoCashOut}x
              </div>
            )}
          </div>
        )}

        {/* ── Bet Amount section ────────────────────────────────── */}
        <div style={{ padding: '12px 14px 6px' }}>
          <div
            style={{
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', marginBottom: 8,
            }}
          >
            BET AMOUNT
          </div>

          {/* Amount row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* − */}
            <button
              onClick={dec}
              disabled={!canBet}
              style={{
                width: 38, height: 46, borderRadius: 11, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: canBet ? '#fff' : 'rgba(255,255,255,0.2)',
                fontSize: 22, lineHeight: 1,
                cursor: canBet ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => canBet && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
            >
              −
            </button>

            {/* Amount display */}
            <div
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.055)',
                border: `1px solid rgba(255,255,255,0.10)`,
                borderRadius: 11, padding: '0 14px', height: 46,
              }}
            >
              <span style={{ color: accent, fontSize: 13, opacity: 0.7 }}>☣</span>
              <span
                style={{
                  color: '#fff', fontWeight: 800,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 18, flex: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {betAmt.toFixed(2)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.1em' }}>ETB</span>
            </div>

            {/* + */}
            <button
              onClick={inc}
              disabled={!canBet}
              style={{
                width: 38, height: 46, borderRadius: 11, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: canBet ? '#fff' : 'rgba(255,255,255,0.2)',
                fontSize: 22, lineHeight: 1,
                cursor: canBet ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => canBet && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
            >
              +
            </button>
          </div>

          {/* Quick amounts + ½ 2× */}
          {canBet && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, marginTop: 8 }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  className={`bp-quick${betAmt === amt ? ' active-quick' : ''}`}
                  onClick={() => setBetAmt(amt)}
                  style={{
                    padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    background: betAmt === amt ? `${accent}18` : 'rgba(255,255,255,0.05)',
                    color: betAmt === amt ? accent : 'rgba(255,255,255,0.4)',
                    fontSize: 11, fontFamily: 'monospace',
                    transition: 'all 0.12s',
                  }}
                >
                  {amt}
                </button>
              ))}
              <button
                className="bp-quick"
                onClick={half}
                style={{
                  padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 11, transition: 'all 0.12s',
                }}
              >
                ½
              </button>
              <button
                className="bp-quick"
                onClick={dbl}
                style={{
                  padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 11, transition: 'all 0.12s',
                }}
              >
                2×
              </button>
            </div>
          )}
        </div>

        {/* ── Auto cash out row (Bet tab) ───────────────────────── */}
        {tab === 'Bet' && canBet && (
          <div style={{ padding: '4px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                flexShrink: 0,
              }}
            >
              Auto Cash Out
            </span>
            <div
              style={{
                flex: 1, display: 'flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '4px 10px', gap: 8,
              }}
            >
              <span style={{ fontFamily: 'monospace', color: '#FFD700', fontWeight: 700, fontSize: 13 }}>
                {autoAt.toFixed(2)}x
              </span>
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                <button
                  onClick={() => setAutoAt((v) => Math.max(1.01, +(v - 0.5).toFixed(1)))}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 16 }}
                >−</button>
                <button
                  onClick={() => setAutoAt((v) => Math.min(MAX_AUTO, +(v + 0.5).toFixed(1)))}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 16 }}
                >+</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Primary CTA ───────────────────────────────────────── */}
        <div style={{ padding: '4px 14px 12px' }}>

          {/* PLACE BET */}
          {canBet && (
            <button
              onClick={handleBet}
              onMouseEnter={triggerShine}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.975)'; }}
              onMouseUp={(e)   => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              disabled={placing || betAmt < 1 || betAmt > balance}
              style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', padding: '15px 0',
                borderRadius: 13, border: 'none',
                cursor: placing ? 'default' : 'pointer',
                background: placing
                  ? 'rgba(114,255,59,0.45)'
                  : index === 0
                  ? 'linear-gradient(180deg, #80FF45 0%, #55DD18 60%, #3DB812 100%)'
                  : 'linear-gradient(180deg, #1AEFFF 0%, #00C8E0 60%, #009FB3 100%)',
                color: '#05070D',
                fontWeight: 900, fontSize: 15,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                boxShadow: `0 4px 24px ${glowRg}`,
                animation: !placing ? 'bp-bet-idle 2.5s ease-in-out infinite' : 'none',
                transition: 'transform 0.1s, opacity 0.15s',
                opacity: betAmt > balance ? 0.45 : 1,
                lineHeight: 1.3,
              }}
            >
              {/* Shine sweep */}
              {shinePos >= 0 && (
                <span
                  style={{
                    position: 'absolute', top: 0, bottom: 0, width: 60,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                    pointerEvents: 'none',
                    animation: 'bp-shine 0.6s ease forwards',
                  }}
                />
              )}
              <div>{placing ? '☣ Locking in…' : 'PLACE BET'}</div>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, marginTop: 1 }}>
                {status === 'waiting' ? 'This round' : 'Next round'}
              </div>
            </button>
          )}

          {/* CASH OUT */}
          {canCashOut && (
            <button
              onClick={() => onCashOut(index)}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.975)'; }}
              onMouseUp={(e)   => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', padding: '13px 0',
                borderRadius: 13, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(180deg, #FF9A00 0%, #FF6B00 100%)',
                color: '#fff',
                fontWeight: 900, fontSize: 15,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                boxShadow: '0 4px 24px rgba(255,140,0,0.40)',
                animation: 'bp-cashout-pulse 0.9s ease-in-out infinite',
                transition: 'transform 0.1s',
                lineHeight: 1.3,
              }}
            >
              <div>CASH OUT</div>
              <div
                style={{
                  fontSize: 15, fontFamily: "'Courier New', monospace",
                  fontWeight: 900, marginTop: 2,
                  animation: 'bp-live-tick 0.4s ease-in-out infinite',
                }}
              >
                {liveCount.toFixed(2)} ETB
              </div>
            </button>
          )}

          {/* Inactive state */}
          {!canBet && !canCashOut && (
            <div
              style={{
                width: '100%', padding: '15px 0',
                borderRadius: 13,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.18)',
                fontSize: 12, lineHeight: 1.4,
              }}
            >
              {status === 'running' && !hasBet && (
                <>
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3 }}>
                    BETTING CLOSED
                  </div>
                  <div style={{ opacity: 0.5, fontSize: 10 }}>Watch the outbreak spread</div>
                </>
              )}
              {status === 'crashed' && (
                <>
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3 }}>
                    ROUND ENDED
                  </div>
                  <div style={{ opacity: 0.5, fontSize: 10 }}>Next outbreak incoming…</div>
                </>
              )}
              {(status === 'idle') && (
                <div style={{ opacity: 0.4, fontSize: 10 }}>Connecting…</div>
              )}
            </div>
          )}
        </div>

        {/* ── Balance strip ────────────────────────────────────────── */}
        <div
          style={{
            padding: '7px 16px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
            <span style={{ color: '#72FF3B', fontSize: 10 }}>☣</span>
            Provably Fair
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{balance.toLocaleString()}</span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.18)' }}>ETB</span>
          </div>
        </div>
      </div>
    </>
  );
});