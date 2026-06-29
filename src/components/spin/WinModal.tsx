/**
 * components/spin/WinModal.tsx — Premium redesign
 *
 * Full-screen backdrop, glassmorphism card, count-up payout,
 * gradient headers per outcome type, auto-dismiss bar.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface WinModalResult {
  result: string;
  isWin: boolean;
  netPayout?: number;
  payout?: number;
  grossWin?: number;
  commission?: number;
  multiplier?: number;
  betAmount?: number;
  newBalance?: number;
  isJackpot?: boolean;
  jackpotType?: string;
  jackpotWon?: { type: string; amount: number } | null;
}

interface WinModalProps {
  result: WinModalResult;
  onDismiss: () => void;
}

// ─── Outcome config ───────────────────────────────────────────────────────────

const CFG: Record<string, { label: string; grad: string; accent: string; ring: string; emoji: string }> = {
  loss:      { label: 'No Win',          grad: '135deg,#0f172a,#1e293b',    accent: '#64748b', ring: 'rgba(100,116,139,0.3)',  emoji: '😔' },
  refund:    { label: '0.5× Returned',   grad: '135deg,#431407,#c2410c',    accent: '#f97316', ring: 'rgba(249,115,22,0.5)',   emoji: '↩️' },
  even:      { label: 'Break Even 1×',   grad: '135deg,#083344,#0e7490',    accent: '#06b6d4', ring: 'rgba(6,182,212,0.5)',    emoji: '⚖️' },
  '2x':      { label: 'Double Win!',     grad: '135deg,#052e16,#15803d',    accent: '#22c55e', ring: 'rgba(34,197,94,0.55)',   emoji: '✅' },
  '3x':      { label: 'Triple Win!',     grad: '135deg,#172554,#1d4ed8',    accent: '#3b82f6', ring: 'rgba(59,130,246,0.55)',  emoji: '🎉' },
  bonus:     { label: '5× Bonus Win!',   grad: '135deg,#2e1065,#7c3aed',    accent: '#a855f7', ring: 'rgba(168,85,247,0.6)',   emoji: '⭐' },
  mega:      { label: '10× Mega Win!',   grad: '135deg,#2e1065,#7c3aed',    accent: '#a855f7', ring: 'rgba(168,85,247,0.6)',   emoji: '💎' },
  epic:      { label: '25× Epic Win!',   grad: '135deg,#500724,#be185d',    accent: '#ec4899', ring: 'rgba(236,72,153,0.65)',  emoji: '👑' },
  mini_jp:   { label: 'Mini Jackpot!',   grad: '135deg,#052e16,#15803d',    accent: '#22c55e', ring: 'rgba(34,197,94,0.6)',    emoji: '🎯' },
  minor_jp:  { label: 'Minor Jackpot!',  grad: '135deg,#451a03,#b45309',    accent: '#f59e0b', ring: 'rgba(245,158,11,0.65)',  emoji: '⭐' },
  major_jp:  { label: 'Major Jackpot!',  grad: '135deg,#450a0a,#b91c1c',    accent: '#ef4444', ring: 'rgba(239,68,68,0.65)',   emoji: '🔥' },
  grand_jp:  { label: 'GRAND JACKPOT!',  grad: '135deg,#422006,#d97706',    accent: '#fbbf24', ring: 'rgba(251,191,36,0.75)',  emoji: '👑' },
  // Legacy
  win:       { label: 'You Won!',        grad: '135deg,#052e16,#15803d',    accent: '#22c55e', ring: 'rgba(34,197,94,0.55)',   emoji: '✅' },
  jackpot:   { label: 'Jackpot!',        grad: '135deg,#422006,#d97706',    accent: '#fbbf24', ring: 'rgba(251,191,36,0.7)',   emoji: '🏆' },
};

function getCfg(resultStr: string, isWin: boolean) {
  const key = resultStr.toLowerCase();
  return CFG[key] ?? (isWin ? CFG['2x'] : CFG.loss);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WinModal({ result, onDismiss }: WinModalProps) {
  // Render via a portal straight onto document.body. Without this, the modal's
  // `fixed inset-0` is rendered wherever <WinModal> sits in the component tree
  // (inside the page's layout wrapper). If any ancestor — AppLayout,
  // GamePageWrapper, a sticky header, etc. — sets `transform`, `filter`,
  // `backdrop-filter`, `perspective`, or `contain`, the browser repositions
  // `fixed` children relative to THAT ancestor's box instead of the viewport.
  // That's exactly what produces "centered, but pinned near the bottom" —
  // the modal is centering itself correctly within a shorter/offset box, not
  // within the actual screen. Portaling to document.body sidesteps the whole
  // class of bug regardless of what the layout tree above it does.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasResult  = Boolean(result?.result);
  const netPayout  = Number(result?.netPayout ?? result?.payout ?? 0);
  const grossWin   = Number(result?.grossWin   ?? 0);
  const commission = Number(result?.commission ?? 0);
  const multiplier = Number(result?.multiplier ?? 0);
  const betAmount  = Number(result?.betAmount  ?? 0);
  const newBalance = Number(result?.newBalance ?? 0);
  const isWin      = Boolean(result?.isWin) || netPayout > 0;
  const isRefund   = (result?.result ?? '').toLowerCase() === 'refund';
  const isJackpot  = Boolean(result?.isJackpot) || (result?.result ?? '').toLowerCase().includes('jp');
  const cfg        = getCfg(result?.result ?? 'loss', isWin);

  // Count-up — hooks must run unconditionally (Rules of Hooks), so the guard
  // lives inside the effect body rather than gating the useEffect call itself.
  const payoutRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!hasResult || !payoutRef.current || netPayout <= 0) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(netPayout / 45));
    const iv = setInterval(() => {
      cur = Math.min(cur + step, netPayout);
      if (payoutRef.current) payoutRef.current.textContent = `+${cur.toLocaleString()}`;
      if (cur >= netPayout) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [hasResult, netPayout]);

  // Auto-dismiss
  useEffect(() => {
    if (!hasResult) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [hasResult, onDismiss]);

  if (!hasResult || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          boxShadow: `0 0 80px ${cfg.ring}, 0 0 0 1.5px ${cfg.ring}, 0 32px 64px rgba(0,0,0,0.6)`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="relative py-6 text-center overflow-hidden"
          style={{ background: `linear-gradient(${cfg.grad})` }}
        >
          {/* Shine */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 60%)' }}/>

          <div className="text-4xl mb-1">{cfg.emoji}</div>
          <p className="text-lg font-black tracking-widest text-white uppercase relative z-10"
            style={{
              fontFamily: "'Rajdhani',sans-serif",
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
              letterSpacing: '0.1em',
            }}>
            {cfg.label}
          </p>
        </div>

        {/* Body */}
        <div
          className="px-6 py-6 space-y-5 text-center"
          style={{ background: 'rgba(5,4,16,0.97)', backdropFilter: 'blur(20px)' }}
        >
          {/* Jackpot type tag */}
          {isJackpot && result.jackpotWon && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}40` }}>
              <span className="text-xs font-black font-mono uppercase tracking-widest"
                style={{ color: cfg.accent }}>
                {result.jackpotWon.type?.toUpperCase()} JACKPOT POOL
              </span>
            </div>
          )}

          {/* Multiplier badge */}
          {multiplier > 0 && !isRefund && (
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl"
                style={{ background: `${cfg.accent}10`, border: `1px solid ${cfg.accent}30` }}
              >
                <span className="text-3xl font-black tabular-nums"
                  style={{ color: cfg.accent, fontFamily: "'Rajdhani',sans-serif" }}>
                  {multiplier}×
                </span>
                <div className="text-left">
                  <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Multiplier</p>
                  <p className="text-xs font-bold" style={{ color: cfg.accent }}>
                    {betAmount} → {Math.round(betAmount * multiplier)} ETB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Net payout */}
          {isWin && (
            <div>
              <p className="font-black tabular-nums leading-none"
                style={{
                  color: cfg.accent,
                  fontSize: 56,
                  fontFamily: "'Rajdhani',sans-serif",
                  textShadow: `0 0 40px ${cfg.accent}60`,
                }}>
                <span ref={payoutRef}>+0</span>
                <span className="text-2xl ml-2 opacity-60">ETB</span>
              </p>
              {commission > 0 && (
                <p className="text-[10px] text-slate-600 font-mono mt-1">
                  Gross {grossWin.toLocaleString()} ETB — Fee {commission.toLocaleString()} ETB
                </p>
              )}
            </div>
          )}

          {/* Refund */}
          {isRefund && !isWin && (
            <div>
              <p className="text-3xl font-black text-orange-400 tabular-nums"
                style={{ fontFamily: "'Rajdhani',sans-serif" }}>
                {Math.floor(betAmount * 0.5).toLocaleString()}
                <span className="text-xl ml-1 opacity-60">ETB</span>
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Half your bet returned</p>
            </div>
          )}

          {/* Loss */}
          {!isWin && !isRefund && (
            <p className="text-slate-500 font-mono text-sm py-2">
              Bet {betAmount.toLocaleString()} ETB — No win this time
            </p>
          )}

          {/* New balance */}
          {newBalance > 0 && (
            <div className="py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-0.5">New Balance</p>
              <p className="text-base font-black text-amber-400 tabular-nums font-mono">
                {newBalance.toLocaleString()} ETB
              </p>
            </div>
          )}

          {/* CTA button */}
          <button
            onClick={onDismiss}
            className="w-full py-4 rounded-2xl font-black text-white tracking-widest transition-all active:scale-95"
            style={{
              background: `linear-gradient(${cfg.grad})`,
              fontFamily: "'Rajdhani',sans-serif",
              fontSize: 16,
              letterSpacing: '0.1em',
              boxShadow: `0 6px 28px ${cfg.ring}`,
            }}
          >
            {isWin ? '🎉  SPIN AGAIN' : isRefund ? 'GOT IT' : 'TRY AGAIN'}
          </button>
        </div>

        {/* Countdown shrink bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
          <div className="h-full" style={{
            background: cfg.accent,
            animation: 'wmShrink 6s linear forwards',
          }}/>
        </div>
      </div>

      <style>{`
        @keyframes wmShrink { from { width: 100% } to { width: 0% } }
      `}</style>
    </div>,
    document.body
  );
}