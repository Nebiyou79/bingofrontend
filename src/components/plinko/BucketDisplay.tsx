// components/plinko/BucketDisplay.tsx
// DashBets — BucketDisplay (Plinko X style)
//
// Matches reference screenshots:
//  - Pink→purple gradient buckets (not individual neon colors)
//  - Multiplier shown with "x" suffix, small font
//  - Landed bucket gets white highlight + strong glow
//  - Two rows of bucket labels possible (high/medium/low show different tables)
//  - Tight spacing, rounded pills

'use client';

import React from 'react';
import type { PlinkoRisk, PlinkoRows } from '../../lib/api/plinkoApi';
import { BUCKET_TABLES } from '../../lib/plinkoEngine';

function getBucketBg(index: number, total: number, multiplier: number): string {

  if (multiplier >= 100) return 'linear-gradient(135deg,#ec4899,#be185d)';
  if (multiplier >= 10)  return 'linear-gradient(135deg,#f97316,#c2410c)';
  if (multiplier >= 5)   return 'linear-gradient(135deg,#eab308,#a16207)';
  if (multiplier >= 2)   return 'linear-gradient(135deg,#d946ef,#86198f)';
  if (multiplier >= 1)   return 'linear-gradient(135deg,#8b5cf6,#6d28d9)';
  if (multiplier >= 0.5) return 'linear-gradient(135deg,#6366f1,#4338ca)';
  return                        'linear-gradient(135deg,#4f46e5,#3730a3)';
}

function getLandedStyle(): React.CSSProperties {
  return {
    background: '#ffffff',
    color: '#000000',
    boxShadow: '0 0 18px 4px rgba(255,255,255,0.6), 0 0 35px 8px rgba(200,180,255,0.35)',
    transform: 'scaleY(1.18) scaleX(1.05)',
    fontWeight: 900,
    zIndex: 10,
    position: 'relative',
  };
}

interface BucketDisplayProps {
  rows:         PlinkoRows;
  risk:         PlinkoRisk;
  landedBucket: number | null;
}

const BucketDisplay: React.FC<BucketDisplayProps> = ({ rows, risk, landedBucket }) => {
  const multipliers = (BUCKET_TABLES as Record<number, Record<PlinkoRisk, number[]>>)[rows][risk];
  const total = multipliers.length;

  const fontSize =
    rows === 8  ? 11 :
    rows === 12 ? 9.5 :
                  8.5;

  return (
    <div
      className="flex w-full items-stretch"
      style={{ gap: 2, padding: '0 2px' }}
      role="group"
      aria-label="Plinko bucket multipliers"
    >
      {multipliers.map((mult, i) => {
        const isLanded = landedBucket === i;
        return (
          <div
            key={i}
            role="cell"
            aria-label={`${mult}x${isLanded ? ' — landed' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              padding: '5px 1px',
              transition: 'all 0.15s',
              cursor: 'default',
              minWidth: 0,
              ...(isLanded
                ? getLandedStyle()
                : {
                    background: getBucketBg(i, total, mult),
                    color: '#fff',
                    boxShadow: 'none',
                  }),
            }}
          >
            <span style={{
              fontSize,
              fontWeight: 800,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}>
              {mult}
            </span>
            <span style={{
              fontSize: fontSize - 1.5,
              fontWeight: 700,
              color: isLanded ? '#000' : 'rgba(255,255,255,0.7)',
              lineHeight: 1,
            }}>
              x
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BucketDisplay;