// components/multihot/PaylineHighlighter.tsx
// DashBets — Multi Hot 5 / Bane Wild Edition
// SVG overlay with glowing payline paths and staggered dot reveals
'use client';

import React, { useEffect, useState } from 'react';
import { SYMBOL_HEIGHT } from '../multihot/ReelColumn';

// Payline colors matching LINE_META in SlotMachine
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
const GAP    = 4;

// Flat payline definitions [row*3+col, ...]
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];

// Center of each cell in SVG coords
// SVG width  = 3 * SYMBOL_HEIGHT + 2 * GAP
// Each col occupies SYMBOL_HEIGHT + GAP, center at col*(SYMBOL_HEIGHT+GAP) + SYMBOL_HEIGHT/2
const cx = (col: number) => col * (SYMBOL_HEIGHT + GAP) + SYMBOL_HEIGHT / 2;
const cy = (row: number) => row * SYMBOL_HEIGHT + SYMBOL_HEIGHT / 2;
const toRC = (idx: number) => ({ row: Math.floor(idx / 3), col: idx % 3 });

interface Props {
  winningPaylines: number[];
  isSpinning:      boolean;
}

export default function PaylineHighlighter({ winningPaylines, isSpinning }: Props) {
  const [vis, setVis] = useState(false);

  useEffect(() => {
    if (!isSpinning && winningPaylines.length > 0) {
      const t = setTimeout(() => setVis(true), 140);
      return () => clearTimeout(t);
    }
    setVis(false);
  }, [isSpinning, winningPaylines]);

  const W = 3 * SYMBOL_HEIGHT + 2 * GAP;
  const H = 3 * SYMBOL_HEIGHT;

  if (winningPaylines.length === 0) return null;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      <defs>
        {COLORS.map((c, i) => (
          <React.Fragment key={i}>
            {/* Outer glow blur */}
            <filter id={`glow-outer-${i}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            </filter>
            {/* Tight inner glow */}
            <filter id={`glow-inner-${i}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </React.Fragment>
        ))}
      </defs>

      {winningPaylines.map((li, order) => {
        const pts   = LINES[li];
        const color = COLORS[li] ?? COLORS[0];
        const d     = 'M ' + pts
          .map(idx => { const { row, col } = toRC(idx); return `${cx(col)},${cy(row)}`; })
          .join(' L ');

        return (
          <g key={li}>
            {/* Wide outer glow */}
            <path
              d={d}
              stroke={color}
              strokeWidth={16}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter={`url(#glow-outer-${li})`}
              opacity={vis ? 0.35 : 0}
              style={{ transition: `opacity 0.3s ease ${order * 0.06}s` }}
            />
            {/* Mid glow */}
            <path
              d={d}
              stroke={color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter={`url(#glow-inner-${li})`}
              opacity={vis ? 0.65 : 0}
              style={{ transition: `opacity 0.3s ease ${order * 0.06}s` }}
            />
            {/* Sharp centerline */}
            <path
              d={d}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={vis ? 1 : 0}
              style={{ transition: `opacity 0.25s ease ${order * 0.06}s` }}
            />

            {/* Node dots at each symbol position */}
            {pts.map((idx, di) => {
              const { row, col } = toRC(idx);
              return (
                <React.Fragment key={di}>
                  {/* Dot halo */}
                  <circle
                    cx={cx(col)} cy={cy(row)} r={14}
                    fill={color}
                    opacity={vis ? 0.08 : 0}
                    style={{ transition: `opacity 0.3s ease ${di * 0.08}s` }}
                  />
                  {/* Dot ring */}
                  <circle
                    cx={cx(col)} cy={cy(row)} r={8}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={vis ? 0.7 : 0}
                    style={{ transition: `opacity 0.3s ease ${di * 0.08}s` }}
                  />
                  {/* Dot fill */}
                  <circle
                    cx={cx(col)} cy={cy(row)} r={4}
                    fill={color}
                    opacity={vis ? 0.95 : 0}
                    style={{ transition: `opacity 0.3s ease ${di * 0.08 + 0.04}s` }}
                  />
                </React.Fragment>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}