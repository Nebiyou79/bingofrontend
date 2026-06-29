/* eslint-disable react-hooks/rules-of-hooks */
/**
 * components/spin/WinCelebration.tsx
 * Animated win result panel with multiplier pop, payout count-up, confetti trigger.
 */
import React, { useEffect, useRef } from 'react';
import type { SpinResult } from '../../lib/api/spinApi';

interface WinCelebrationProps {
  result: SpinResult;
  onDismiss: () => void;
}

const OUTCOME_CONFIG = {
  legendary: { label: '🏆 LEGENDARY!', grad: 'linear-gradient(90deg,#ca8a04,#f59e0b)', ring: '#fbbf24' },
  ultra:     { label: '👑 ULTRA WIN!',  grad: 'linear-gradient(90deg,#db2777,#ef4444)', ring: '#f472b6' },
  mega:      { label: '💎 MEGA WIN!',   grad: 'linear-gradient(90deg,#7c3aed,#8b5cf6)', ring: '#a855f7' },
  jackpot:   { label: '🏆 JACKPOT!',   grad: 'linear-gradient(90deg,#eab308,#fbbf24)', ring: '#facc15' },
  bonus:     { label: '⭐ BONUS WIN!',  grad: 'linear-gradient(90deg,#4338ca,#6366f1)', ring: '#818cf8' },
  win:       { label: '✅ YOU WON!',    grad: 'linear-gradient(90deg,#15803d,#22c55e)', ring: '#34d399' },
  loss:      { label: '😔 NO WIN',      grad: 'linear-gradient(90deg,#1e293b,#334155)', ring: '#475569' },
  refund:    { label: '⚠️ REFUNDED',   grad: 'linear-gradient(90deg,#92400e,#a16207)', ring: '#f59e0b' },
};

function getConfig(result: string, isWin: boolean) {
  if (!result) return OUTCOME_CONFIG.loss; // Fallback for undefined result
  
  const key = result.toLowerCase() as keyof typeof OUTCOME_CONFIG;
  if (OUTCOME_CONFIG[key]) return OUTCOME_CONFIG[key];
  if (isWin) return OUTCOME_CONFIG.win;
  return OUTCOME_CONFIG.loss;
}

export function WinCelebration({ result, onDismiss }: WinCelebrationProps) {
  // Guard against undefined result
  if (!result || !result.result) {
    return null;
  }

  const isWin    = result.isWin ?? false;
  const isRefund = result.result?.toLowerCase() === 'refund';
  const cfg      = getConfig(result.result, isWin);

  // Count-up animation for payout
  const payoutRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!isWin || !payoutRef.current || !result.netPayout) return;
    const target = result.netPayout;
    let current  = 0;
    const step   = Math.max(1, Math.floor(target / 40));
    const iv = setInterval(() => {
      current = Math.min(current + step, target);
      if (payoutRef.current) {
        payoutRef.current.textContent = `+${current.toLocaleString()}`;
      }
      if (current >= target) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [isWin, result.netPayout]);

  // Auto dismiss after 4s
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: `0 0 0 2px ${cfg.ring}` }}>
      {/* Gradient header bar */}
      <div className="px-4 py-3 text-center" style={{ background: cfg.grad }}>
        <span className="text-sm font-black tracking-widest text-white uppercase drop-shadow-lg">
          {cfg.label}
        </span>
      </div>

      <div className="bg-slate-900/95 backdrop-blur-md px-4 pt-4 pb-5 text-center space-y-3">
        {/* Multiplier badge */}
        {(result.multiplier ?? 0) > 0 && !isRefund && (
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-slate-600">
            <span className="font-black text-lg text-white tabular-nums">
              {result.multiplier}×
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono">MULTIPLIER</span>
          </div>
        )}

        {/* Payout */}
        {isWin && (
          <div className="space-y-1">
            <p className="text-3xl font-black text-emerald-400 tabular-nums">
              <span ref={payoutRef}>+0</span>
              <span className="text-base ml-1 text-emerald-600">ETB</span>
            </p>
            {(result.commission ?? 0) > 0 && (
              <p className="text-[11px] text-slate-500 font-mono">
                Gross {result.grossWin} ETB — Commission {result.commission} ETB
              </p>
            )}
          </div>
        )}

        {!isWin && !isRefund && (
          <p className="text-slate-500 text-sm font-mono">
            Bet: {result.betAmount ?? 0} ETB · Result: LOSS
          </p>
        )}

        {isRefund && (
          <p className="text-amber-400 font-bold">
            {(result.betAmount ?? 0).toLocaleString()} ETB refunded
          </p>
        )}

        {/* New balance */}
        <p className="text-[11px] font-mono text-slate-500">
          Balance: <span className="text-amber-400 font-semibold">{(result.newBalance ?? 0).toLocaleString()} ETB</span>
        </p>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className={`w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all
            ${isWin
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : isRefund
              ? 'bg-amber-700 hover:bg-amber-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
        >
          Spin Again
        </button>

        {/* Progress bar auto-dismiss */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden rounded-b-2xl">
          <div
            className={`h-full ${isWin ? 'bg-emerald-500' : isRefund ? 'bg-amber-500' : 'bg-slate-600'}`}
            style={{ animation: 'shrinkBar 4.2s linear forwards' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrinkBar { from { width: 100% } to { width: 0% } }
      `}</style>
    </div>
  );
}


/**
 * components/vip/VipProgress.tsx
 * VIP level progress bar with next-level benefits preview.
 */
interface VipProgressProps {
  vipLevel: number;
  vipPoints?: number; // Make optional with default
  totalWagered?: number; // Make optional with default
}

const VIP_THRESHOLDS = [0, 100, 500, 2000, 5000, 10000, 25000, 50000, 100000, 250000];
const VIP_NAMES      = ['Bronze','Silver','Gold','Platinum','Diamond','Elite','Master','Grand Master','Legend','Supreme'];
const VIP_COLORS     = [
  '#cd7f32','#94a3b8','#f59e0b','#06b6d4','#a855f7','#ec4899','#ef4444','#f97316','#22c55e','#facc15'
];
const VIP_BENEFITS = [
  '2× VIP points',
  '3× VIP points + 1% commission off',
  '5× VIP points + 3% commission off',
  'VIP Wheel access + 5% commission off',
  '10× VIP points + 8% commission off',
  'Mega Wheel access + 10% commission off',
  '15× VIP points + 15% commission off',
  '20× VIP points + 20% commission off',
  '25× VIP points + 30% commission off',
  '50× VIP points + 50% commission off',
];

export function VipProgress({ vipLevel, vipPoints = 0, totalWagered = 0 }: VipProgressProps) {
  const currentThreshold = VIP_THRESHOLDS[vipLevel] ?? 0;
  const nextThreshold    = VIP_THRESHOLDS[vipLevel + 1] ?? null;
  const progress         = nextThreshold
    ? Math.min(100, ((totalWagered - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;
  const color            = VIP_COLORS[vipLevel] ?? '#facc15';
  const name             = VIP_NAMES[vipLevel]  ?? 'Supreme';
  const nextName         = VIP_NAMES[vipLevel + 1];

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 p-4 space-y-3">
      {/* Level badge row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: `${color}30`, border: `2px solid ${color}`, color }}
          >
            {vipLevel}
          </div>
          <div>
            <p className="text-xs font-mono tracking-widest uppercase" style={{ color }}>
              {name}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {vipPoints.toLocaleString()} pts
            </p>
          </div>
        </div>

        {nextName && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-mono">Next</p>
            <p className="text-xs text-slate-300 font-mono">{nextName}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>

      {/* Progress label */}
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>{totalWagered.toLocaleString()} ETB wagered</span>
        {nextThreshold && (
          <span>{nextThreshold.toLocaleString()} ETB to {nextName}</span>
        )}
      </div>

      {/* Current benefit */}
      <div
        className="rounded-lg px-3 py-2 text-[11px] font-mono"
        style={{ background: `${color}10`, border: `1px solid ${color}30`, color }}
      >
        {VIP_BENEFITS[vipLevel] ?? 'Maximum VIP benefits active'}
      </div>
    </div>
  );
}


/**
 * components/spin/LiveFeed.tsx
 * Real-time scrolling feed of big wins from all players.
 */
import { useFeedStore } from '../../stores';

export function LiveFeed() {
  const events = useFeedStore((s) => s.events);

  if (events.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <p className="text-[10px] font-mono text-slate-600 text-center uppercase tracking-widest">
          No recent big wins yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Live Wins</span>
      </div>
      <div className="divide-y divide-slate-800/50 max-h-48 overflow-y-auto">
        {events.slice(0, 15).map((ev) => (
          <div key={ev.id} className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                {ev.username[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {ev.username.slice(0, 8)}{ev.username.length > 8 ? '…' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-600">{ev.multiplier}×</span>
              <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                +{ev.payout.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}