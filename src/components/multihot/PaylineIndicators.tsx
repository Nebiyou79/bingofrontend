// components/multihot/PaylineIndicators.tsx
// Kept for any external consumers; the inline PaylineColumn in SlotMachine.tsx
// is now the primary renderer. This component remains API-compatible.
'use client';

import React from 'react';

const PAYLINE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

interface Props {
  winningLines: number[];
  side: 'left' | 'right';
}

export default function PaylineIndicators({ winningLines, side }: Props) {
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           5,
      padding:       '4px 0',
      alignItems:    'center',
    }}>
      {[0, 1, 2, 3, 4].map(line => {
        const isWin  = winningLines.includes(line);
        const color  = PAYLINE_COLORS[line];
        return (
          <div
            key={`${side}-${line}`}
            style={{
              width:      24,
              height:     24,
              borderRadius: 6,
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize:   10,
              fontWeight: 900,
              fontFamily: "'Exo 2', sans-serif",
              background: isWin ? color : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${isWin ? color : `${color}22`}`,
              color:      isWin ? '#fff' : `${color}44`,
              boxShadow:  isWin ? `0 0 14px ${color}77` : 'none',
              transform:  isWin ? 'scale(1.12)' : 'scale(1)',
              transition: 'all 0.25s ease',
            }}
          >
            {line + 1}
          </div>
        );
      })}
    </div>
  );
}