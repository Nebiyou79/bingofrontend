/**
 * components/spin/LiveFeed.tsx — Premium redesign
 */

import React from 'react';
import { useFeedStore } from '../../stores';

const RESULT_COLORS: Record<string, string> = {
  grand_jp: '#fbbf24', major_jp: '#ef4444', minor_jp: '#f59e0b',
  mini_jp:  '#22c55e', epic: '#ec4899', mega: '#a855f7',
  bonus:    '#3b82f6', '3x': '#3b82f6', '2x': '#22c55e',
  win:      '#22c55e', jackpot: '#fbbf24',
};

function getColor(result: string) {
  return RESULT_COLORS[result?.toLowerCase()] ?? '#22c55e';
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// Placeholder events when feed is empty
const PLACEHOLDER = [
  { id: 'p1', username: 'Abebe12',  payout: 2000, multiplier: 10, result: 'mega',     timestamp: Date.now() - 120000 },
  { id: 'p2', username: 'Selam88',  payout: 500,  multiplier: 5,  result: 'bonus',    timestamp: Date.now() - 300000 },
  { id: 'p3', username: 'Yonas01',  payout: 1000, multiplier: 5,  result: 'bonus',    timestamp: Date.now() - 500000 },
  { id: 'p4', username: 'Hana22',   payout: 250,  multiplier: 2,  result: '2x',       timestamp: Date.now() - 720000 },
  { id: 'p5', username: 'Mikias',   payout: 5200, multiplier: 25, result: 'epic',     timestamp: Date.now() - 960000 },
];

export function LiveFeed() {
  const events  = useFeedStore((s: any) => s.events);
  const display = events.length > 0 ? events.slice(0, 8) : PLACEHOLDER;

  return (
    <div className="space-y-0 -mx-0">
      {display.map((ev: any) => {
        const color = getColor(ev.result);
        return (
          <div
            key={ev.id}
            className="flex items-center justify-between py-2.5 transition-colors"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                style={{
                  background: `${color}15`,
                  border: `1.5px solid ${color}35`,
                  color,
                }}
              >
                {ev.username?.[0]?.toUpperCase() ?? 'P'}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-300 leading-none font-mono">
                  {(ev.username ?? '').slice(0, 10)}{ev.username?.length > 10 ? '…' : ''}
                </p>
                <p className="text-[8px] text-slate-700 font-mono leading-none mt-0.5">
                  {timeAgo(ev.timestamp)}
                </p>
              </div>
            </div>

            {/* Win amount */}
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wide"
                style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}
              >
                {ev.multiplier}×
              </span>
              <span
                className="text-sm font-black tabular-nums"
                style={{ color, fontFamily: "'Rajdhani',sans-serif" }}
              >
                +{(ev.payout ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}