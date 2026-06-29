/**
 * components/spin/JackpotBar.tsx — Premium redesign
 */

import React, { useEffect, useRef, useState } from 'react';
import { useJackpots } from '../../hooks/useSpinData';

const THEME: Record<string, { color: string; bg: string; border: string; glow: string; icon: string }> = {
  mini:  { color: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.18)', glow: 'rgba(16,185,129,0.2)',  icon: '🎯' },
  minor: { color: '#22d3ee', bg: 'rgba(34,211,238,0.06)',  border: 'rgba(34,211,238,0.18)', glow: 'rgba(34,211,238,0.2)',  icon: '⭐' },
  major: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.18)', glow: 'rgba(245,158,11,0.2)',  icon: '🔥' },
  grand: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.22)',  glow: 'rgba(239,68,68,0.28)', icon: '👑' },
};

interface PillProps {
  type: string; name: string; amount: number; isGrand?: boolean;
}

function Pill({ type, name, amount, isGrand }: PillProps) {
  const t         = THEME[type] ?? THEME.mini;
  const prevRef   = useRef(amount);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (amount !== prevRef.current) {
      prevRef.current = amount;
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 700);
      return () => clearTimeout(id);
    }
  }, [amount]);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl px-4 py-3 transition-all duration-300 ${flash ? 'scale-105' : ''}`}
      style={{
        minWidth: isGrand ? 148 : 100,
        background: t.bg,
        border: `1px solid ${t.border}`,
        boxShadow: isGrand ? `0 0 28px ${t.glow}` : 'none',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm leading-none">{t.icon}</span>
        <span
          className="text-[9px] font-black tracking-[0.18em] uppercase"
          style={{ color: t.color, fontFamily: "'Rajdhani',sans-serif" }}
        >
          {name.replace(' Jackpot', '')}
        </span>
      </div>
      <span
        className={`font-black tabular-nums leading-none transition-all duration-200 ${flash ? 'scale-110' : ''}`}
        style={{
          color: t.color,
          fontSize: isGrand ? 20 : 14,
          fontFamily: "'Rajdhani',sans-serif",
          textShadow: isGrand ? `0 0 20px ${t.color}60` : 'none',
        }}
      >
        {amount.toLocaleString('en-ET', { maximumFractionDigits: 0 })}
        <span className="text-[8px] ml-0.5 opacity-55">ETB</span>
      </span>
    </div>
  );
}

export function JackpotBar() {
  const { pools } = useJackpots();
  const ORDER   = ['mini', 'minor', 'major', 'grand'];
  const display = ORDER.map(t => (pools as any[]).find(p => p.type === t)).filter(Boolean);

  if (display.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(168,85,247,0.25))' }}/>
        <span className="text-[8px] tracking-[0.25em] uppercase font-mono"
          style={{ color: 'rgba(168,85,247,0.6)' }}>
          Live Jackpots
        </span>
        <div className="h-px flex-1"
          style={{ background: 'linear-gradient(90deg,rgba(168,85,247,0.25),transparent)' }}/>
      </div>
      <div className="flex items-stretch justify-center gap-2 flex-wrap">
        {display.map((p: any) => (
          <Pill
            key={p.type}
            type={p.type}
            name={p.name ?? p.type}
            amount={p.amount ?? 0}
            isGrand={p.type === 'grand'}
          />
        ))}
      </div>
    </div>
  );
}