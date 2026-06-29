// components/crash/CrashHistory.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { HistoryEntry } from '../../hooks/useCrashGame';

interface CrashHistoryProps {
  history: HistoryEntry[];
}

interface ChipTheme {
  color: string;
  bg: string;
  border: string;
  glow: string;
  label: string;
}

function chipTheme(cp: number): ChipTheme {
  if (cp >= 100) return {
    color: '#A855F7', bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)',
    glow: '0 0 12px rgba(168,85,247,0.6), 0 0 24px rgba(168,85,247,0.3)',
    label: '★ LEGEND',
  };
  if (cp >= 25) return {
    color: '#FFD700', bg: 'rgba(255,215,0,0.14)', border: 'rgba(255,215,0,0.4)',
    glow: '0 0 10px rgba(255,215,0,0.55), 0 0 20px rgba(255,215,0,0.25)',
    label: '',
  };
  if (cp >= 10) return {
    color: '#00E5FF', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.35)',
    glow: '0 0 8px rgba(0,229,255,0.5)',
    label: '',
  };
  if (cp >= 2) return {
    color: '#72FF3B', bg: 'rgba(114,255,59,0.10)', border: 'rgba(114,255,59,0.30)',
    glow: '0 0 6px rgba(114,255,59,0.4)',
    label: '',
  };
  if (cp >= 1.5) return {
    color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.20)',
    glow: 'none',
    label: '',
  };
  return {
    color: '#FF4655', bg: 'rgba(255,70,85,0.10)', border: 'rgba(255,70,85,0.28)',
    glow: 'none',
    label: '',
  };
}

const MAX_VISIBLE = 24;

export function CrashHistory({ history }: CrashHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible   = history.slice(0, MAX_VISIBLE);

  // Auto-scroll to show newest chip when history updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [history.length]);

  return (
    <>
      <style>{`
        @keyframes chip-in {
          from { opacity: 0; transform: scale(0.7) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .zh-chip {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          animation: chip-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .zh-chip:hover {
          transform: scale(1.12) translateY(-1px) !important;
        }
        .zh-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="relative"
        style={{
          height: 40,
          background: 'rgba(5,7,13,0.95)',
          borderBottom: '1px solid rgba(114,255,59,0.08)',
        }}
      >
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #05070D, transparent)' }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #05070D, transparent)' }}
        />

        <div
          ref={scrollRef}
          className="zh-scroll flex items-center gap-1.5 px-4 h-full"
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
        >
          {visible.length === 0 ? (
            <span
              style={{
                color: 'rgba(255,255,255,0.18)',
                fontSize: 11,
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              No rounds yet
            </span>
          ) : (
            visible.map((entry, i) => {
              const theme = chipTheme(entry.crashPoint);
              const isNewest = i === 0;
              const isLegend = entry.crashPoint >= 100;

              return (
                <span
                  key={entry._id ?? i}
                  className="zh-chip flex-shrink-0 flex items-center gap-1"
                  title={`Round #${entry.roundNumber}`}
                  style={{
                    padding: isLegend ? '3px 10px' : '3px 8px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    cursor: 'default',
                    whiteSpace: 'nowrap',
                    color: theme.color,
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    boxShadow: isNewest ? theme.glow : 'none',
                    outline: isNewest ? `1px solid ${theme.border}` : 'none',
                    outlineOffset: 2,
                    animationDelay: isNewest ? '0ms' : `${Math.min(i * 20, 200)}ms`,
                  }}
                >
                  {isLegend && <span style={{ fontSize: 9 }}>★</span>}
                  {entry.crashPoint.toFixed(2)}x
                  {isLegend && <span style={{ fontSize: 9 }}>★</span>}
                </span>
              );
            })
          )}

          {history.length > MAX_VISIBLE && (
            <span
              className="flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13, paddingRight: 8 }}
            >
              •••
            </span>
          )}
        </div>
      </div>
    </>
  );
}