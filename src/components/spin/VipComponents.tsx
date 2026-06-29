/**
 * components/spin/VipComponents.tsx — Premium redesign
 */

import React from 'react';

const VIP_COLORS = [
  '#cd7f32','#94a3b8','#f59e0b','#06b6d4',
  '#a855f7','#ec4899','#ef4444','#f97316','#22c55e','#facc15',
];
const VIP_NAMES = [
  'Bronze','Silver','Gold','Platinum','Diamond',
  'Elite','Master','Grand Master','Legend','Supreme',
];
const VIP_THRESHOLDS = [0,100,500,2000,5000,10000,25000,50000,100000,250000];
const VIP_BENEFITS = [
  '2× VIP points on every bet',
  '3× VIP points + 1% commission off',
  '5× VIP points + 3% commission off',
  'VIP Wheel access + 5% off commission',
  '10× VIP points + 8% off commission',
  'Mega Wheel access + 10% off commission',
  '15× VIP points + 15% off commission',
  '20× VIP points + 20% off commission',
  '25× VIP points + 30% off commission',
  '50× VIP points + 50% off commission — MAX',
];

// ─── Small badge for header ───────────────────────────────────────────────────

export function VipBadge({ level }: { level: number }) {
  const color = VIP_COLORS[level] ?? '#facc15';
  const name  = VIP_NAMES[level]  ?? 'Supreme';
  return (
    <div
      title={`VIP ${name}`}
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
      style={{ border: `2px solid ${color}`, color, background: `${color}15` }}
    >
      {level}
    </div>
  );
}

// ─── Full progress bar ────────────────────────────────────────────────────────

interface VipProgressBarProps {
  vipLevel:     number;
  vipPoints?:   number;
  totalWagered?: number;
}

export function VipProgressBar({ vipLevel, vipPoints = 0, totalWagered = 0 }: VipProgressBarProps) {
  const color      = VIP_COLORS[vipLevel]      ?? '#facc15';
  const name       = VIP_NAMES[vipLevel]       ?? 'Supreme';
  const nextName   = VIP_NAMES[vipLevel + 1];
  const floor      = VIP_THRESHOLDS[vipLevel]     ?? 0;
  const nextFloor  = VIP_THRESHOLDS[vipLevel + 1] ?? null;
  const pct        = nextFloor
    ? Math.min(100, Math.max(0, ((totalWagered - floor) / (nextFloor - floor)) * 100))
    : 100;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: `linear-gradient(135deg, ${color}08 0%, rgba(5,4,16,0.85) 100%)`,
        border: `1px solid ${color}20`,
      }}
    >
      {/* Row: badge + level name + next level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base"
            style={{ background: `${color}18`, border: `2px solid ${color}60`, color }}
          >
            {vipLevel}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest"
              style={{ color, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.1em' }}>
              {name}
            </p>
            <p className="text-[9px] text-slate-600 font-mono">
              {vipPoints.toLocaleString()} XP
            </p>
          </div>
        </div>

        {nextName && (
          <div className="text-right">
            <p className="text-[8px] text-slate-700 font-mono uppercase tracking-widest">Next</p>
            <p className="text-[10px] text-slate-400 font-mono">{nextName}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: `${color}12` }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}70, ${color})`,
              boxShadow: `0 0 10px ${color}55`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[8px] font-mono text-slate-700">
          <span>{totalWagered.toLocaleString()} ETB wagered</span>
          {nextFloor && <span>{nextFloor.toLocaleString()} ETB to {nextName}</span>}
        </div>
      </div>

      {/* Current benefit */}
      <div
        className="rounded-xl px-3 py-2 text-[9px] font-mono text-center"
        style={{
          background: `${color}08`,
          border: `1px solid ${color}20`,
          color: `${color}cc`,
        }}
      >
        {VIP_BENEFITS[vipLevel] ?? 'Maximum VIP benefits active'}
      </div>
    </div>
  );
}