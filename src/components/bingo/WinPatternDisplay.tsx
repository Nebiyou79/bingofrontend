/**
 * components/bingo/WinPatternDisplay.tsx — Premium win pattern display
 * Casino-grade pattern badges with mini grid previews.
 * All exports and props preserved.
 */

import React from 'react';
import type { WinPattern } from '../../lib/api/bingoApi';
import { patternLabel, patternIcon } from '../../lib/api/bingoApi';

const PATTERN_STYLES: Record<WinPattern, { color: string; bg: string; border: string; glow: string }> = {
  horizontal:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.15)' },
  vertical:    { color: '#A855F7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)',  glow: 'rgba(168,85,247,0.15)' },
  diagonal:    { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   glow: 'rgba(34,197,94,0.15)'  },
  fourCorners: { color: '#F7B500', bg: 'rgba(247,181,0,0.1)',   border: 'rgba(247,181,0,0.25)',   glow: 'rgba(247,181,0,0.15)'  },
};

// ─── Mini preview grid ────────────────────────────────────────────────────────

function PatternPreview({ pattern }: { pattern: WinPattern }) {
  const highlighted = new Set<number>();
  switch (pattern) {
    case 'horizontal':  [10, 11, 12, 13, 14].forEach((i) => highlighted.add(i)); break;
    case 'vertical':    [2, 7, 12, 17, 22].forEach((i) => highlighted.add(i));   break;
    case 'diagonal':    [0, 6, 12, 18, 24].forEach((i) => highlighted.add(i));   break;
    case 'fourCorners': [0, 4, 20, 24].forEach((i) => highlighted.add(i));        break;
  }
  const s = PATTERN_STYLES[pattern];
  return (
    <div className="grid grid-cols-5 gap-0.5 w-14 h-14 flex-shrink-0">
      {Array.from({ length: 25 }, (_, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            background: i === 12
              ? 'rgba(124,58,237,0.5)'
              : highlighted.has(i)
              ? s.color
              : 'rgba(255,255,255,0.06)',
            boxShadow: highlighted.has(i) ? `0 0 4px ${s.glow}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─── Four corners overlay ─────────────────────────────────────────────────────

export function FourCornersIndicator({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
        const posClass = {
          'top-left':     '-top-2 -left-2',
          'top-right':    '-top-2 -right-2',
          'bottom-left':  '-bottom-2 -left-2',
          'bottom-right': '-bottom-2 -right-2',
        }[corner];
        return (
          <span
            key={corner}
            className={`absolute ${posClass} w-4 h-4 rounded-full z-10 animate-pulse`}
            style={{
              background: '#F7B500',
              boxShadow: '0 0 8px rgba(247,181,0,0.8)',
              border: '1.5px solid rgba(247,181,0,0.6)',
            }}
          />
        );
      })}
      {children}
    </div>
  );
}

// ─── Pattern badge ────────────────────────────────────────────────────────────

export function PatternBadge({ pattern, active = false }: { pattern: WinPattern; active?: boolean }) {
  const s = PATTERN_STYLES[pattern];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${active ? 'animate-pulse' : ''}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      <span>{patternIcon(pattern)}</span>
      <span>{patternLabel(pattern)}</span>
    </span>
  );
}

// ─── Full display ─────────────────────────────────────────────────────────────

interface WinPatternDisplayProps {
  pattern: WinPattern | null;
  gameActive?: boolean;
  compact?: boolean;
}

export function WinPatternDisplay({ pattern, gameActive = false, compact = false }: WinPatternDisplayProps) {
  if (!pattern) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
      >
        <span>?</span>
        <span>Pattern TBD</span>
      </span>
    );
  }

  if (compact) return <PatternBadge pattern={pattern} active={gameActive} />;

  const s = PATTERN_STYLES[pattern];
  const description = {
    horizontal:  'Complete any full row across the card',
    vertical:    'Complete any full column on the card',
    diagonal:    'Complete either diagonal (corner to corner)',
    fourCorners: 'Mark all four corner squares of the card',
  }[pattern];

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-xl"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `0 4px 20px ${s.glow}`,
      }}
    >
      <PatternPreview pattern={pattern} />
      <div className="flex-1 min-w-0">
        <PatternBadge pattern={pattern} active={gameActive} />
        <p className="text-[10px] text-gray-500 leading-snug mt-1">{description}</p>
      </div>
    </div>
  );
}
