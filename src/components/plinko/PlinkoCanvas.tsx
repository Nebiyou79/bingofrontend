// components/plinko/PlinkoCanvas.tsx
// DashBets — PlinkoCanvas (Plinko X style)
//
// Visual changes to match reference screenshots:
//  - Deep underwater dark-blue/indigo background (matches PlinkoX)
//  - Pegs: small (r=4), soft purple/blue glow, uniform color
//  - Ball: can be red (1x), orange (5x), or blue (10x) based on multiplier tier
//  - Multiple balls can be in flight simultaneously (separate activePaths array)
//  - Subtle triangle guide, NO row labels
//  - Drop tube remains at top center
//  - Buckets still handled by BucketDisplay below canvas

'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { BallStep, PlinkoRisk, PlinkoRows } from '../../lib/api/plinkoApi';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_WIDTH  = 620;
const CANVAS_HEIGHT = 480;
const PEG_RADIUS    = 4;
const BALL_RADIUS   = 8;
const MS_PER_ROW    = 80;
const PAD_X         = 24;
const TOP_PAD       = 44;

// Ball colors by multiplier tier (matches reference)
function getBallColor(multiplier: number | null): { core: string; glow: string } {
  if (!multiplier || multiplier < 2)  return { core: '#ef4444', glow: '#dc2626' };
  if (multiplier < 5)                 return { core: '#f97316', glow: '#ea580c' };
  return                                     { core: '#3b82f6', glow: '#2563eb' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry
// ─────────────────────────────────────────────────────────────────────────────

interface BoardGeometry {
  pegPositions:  { x: number; y: number }[][];
  bucketCenters: number[];
  bottomY:       number;
  xGap:          number;
  yGap:          number;
}

function buildGeometry(rows: number): BoardGeometry {
  const boardW = CANVAS_WIDTH - PAD_X * 2;
  const boardH = CANVAS_HEIGHT - TOP_PAD - 16;
  const yGap   = boardH / (rows + 1);
  const xGap   = boardW / (rows + 2);

  const pegPositions: { x: number; y: number }[][] = [];

  for (let row = 0; row < rows; row++) {
    const pegsInRow = row + 2;
    const rowWidth  = (pegsInRow - 1) * xGap;
    const xStart    = PAD_X + (boardW - rowWidth) / 2;
    const y         = TOP_PAD + (row + 1) * yGap;
    const rowPegs: { x: number; y: number }[] = [];
    for (let col = 0; col < pegsInRow; col++) {
      rowPegs.push({ x: xStart + col * xGap, y });
    }
    pegPositions.push(rowPegs);
  }

  const bucketCount   = rows + 1;
  const bottomRow     = pegPositions[rows - 1];
  const bucketCenters: number[] = [];
  const leftEdge      = bottomRow[0].x - xGap / 2;
  const bWidth        = xGap;
  for (let b = 0; b < bucketCount; b++) {
    bucketCenters.push(leftEdge + b * bWidth + bWidth / 2);
  }

  const bottomY = CANVAS_HEIGHT - 10;

  return { pegPositions, bucketCenters, bottomY, xGap, yGap };
}

// ─────────────────────────────────────────────────────────────────────────────
// Waypoints
// ─────────────────────────────────────────────────────────────────────────────

function pathToWaypoints(
  path: BallStep[],
  geometry: BoardGeometry,
): { x: number; y: number }[] {
  const { pegPositions, bucketCenters, bottomY, xGap, yGap } = geometry;
  const rows = path.length;

  const startX = CANVAS_WIDTH / 2;
  const waypoints: { x: number; y: number }[] = [
    { x: startX, y: TOP_PAD - 8 },
  ];

  let col = 0;
  for (let row = 0; row < rows; row++) {
    if (path[row] === 'R') col++;
    const peg     = pegPositions[row][col];
    const leftPeg = pegPositions[row][Math.max(col - 1, 0)];
    const midX    = path[row] === 'R'
      ? peg.x - xGap / 2
      : leftPeg.x + xGap / 2;
    const midY = peg.y + yGap * 0.42;
    waypoints.push({ x: midX, y: midY });
  }

  waypoints.push({ x: bucketCenters[col], y: bottomY });
  return waypoints;
}

// ─────────────────────────────────────────────────────────────────────────────
// Draw
// ─────────────────────────────────────────────────────────────────────────────

function drawBoard(ctx: CanvasRenderingContext2D, rows: PlinkoRows, geometry: BoardGeometry) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background — deep underwater indigo/navy (matches reference)
  const bg = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  bg.addColorStop(0,   '#050c2e');
  bg.addColorStop(0.4, '#08123d');
  bg.addColorStop(1,   '#050c2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const { pegPositions } = geometry;

  // ── Drop tube ────────────────────────────────────────────────────────────
  const tubeX = CANVAS_WIDTH / 2;
  const tubeW = 18;
  const tubeH = TOP_PAD - 4;

  const tubeGrad = ctx.createLinearGradient(tubeX - tubeW / 2, 0, tubeX + tubeW / 2, 0);
  tubeGrad.addColorStop(0,   'rgba(99,102,241,0.1)');
  tubeGrad.addColorStop(0.5, 'rgba(99,102,241,0.28)');
  tubeGrad.addColorStop(1,   'rgba(99,102,241,0.1)');

  ctx.save();
  ctx.fillStyle = tubeGrad;
  ctx.strokeStyle = 'rgba(99,102,241,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tubeX - tubeW / 2, 2, tubeW, tubeH, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── Triangle guide ───────────────────────────────────────────────────────
  if (pegPositions.length > 0) {
    const topRow    = pegPositions[0];
    const bottomRow = pegPositions[rows - 1];
    const apexX     = (topRow[0].x + topRow[1].x) / 2;
    const leftX     = bottomRow[0].x - PEG_RADIUS * 3;
    const rightX    = bottomRow[bottomRow.length - 1].x + PEG_RADIUS * 3;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(apexX, topRow[0].y - PEG_RADIUS * 3);
    ctx.lineTo(leftX, bottomRow[0].y + PEG_RADIUS * 3);
    ctx.lineTo(rightX, bottomRow[0].y + PEG_RADIUS * 3);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(99,102,241,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // ── Pegs ─────────────────────────────────────────────────────────────────
  for (let row = 0; row < pegPositions.length; row++) {
    for (let col = 0; col < pegPositions[row].length; col++) {
      const peg = pegPositions[row][col];

      // Soft glow
      ctx.save();
      const glow = ctx.createRadialGradient(peg.x, peg.y, PEG_RADIUS, peg.x, peg.y, PEG_RADIUS * 3.5);
      glow.addColorStop(0,   'rgba(130,120,255,0.3)');
      glow.addColorStop(1,   'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Peg core — soft periwinkle/lavender, matching reference
      ctx.save();
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle   = '#7c78d8';
      ctx.shadowColor = '#a5a0ff';
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.restore();

      // Specular
      ctx.save();
      ctx.beginPath();
      ctx.arc(peg.x - 1.2, peg.y - 1.4, PEG_RADIUS * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  multiplier: number | null,
) {
  const { core, glow } = getBallColor(multiplier);

  // Outer halo
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, BALL_RADIUS, x, y, BALL_RADIUS * 3.2);
  halo.addColorStop(0,   core + '44');
  halo.addColorStop(1,   'transparent');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ball body
  ctx.save();
  const grad = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, BALL_RADIUS);
  grad.addColorStop(0,    '#FFFFFF');
  grad.addColorStop(0.3,  core + 'cc');
  grad.addColorStop(1,    glow);
  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle   = grad;
  ctx.shadowColor = core;
  ctx.shadowBlur  = 16;
  ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface PlinkoCanvasProps {
  rows:           PlinkoRows;
  risk:           PlinkoRisk;
  activePath:     BallStep[] | null;
  landedBucket:   number | null;
  onAnimationEnd: () => void;
  multiplier?:    number | null;
}

const PlinkoCanvas = forwardRef<HTMLCanvasElement, PlinkoCanvasProps>(
  function PlinkoCanvas(
    { rows, risk, activePath, landedBucket, onAnimationEnd, multiplier = null },
    forwardedRef,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number | null>(null);

    useImperativeHandle(forwardedRef, () => canvasRef.current!);

    const redrawBoard = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawBoard(ctx, rows, buildGeometry(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, risk, landedBucket]);

    useEffect(() => { redrawBoard(); }, [redrawBoard]);

    useEffect(() => {
      if (!activePath || activePath.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const geometry      = buildGeometry(rows);
      const waypoints     = pathToWaypoints(activePath, geometry);
      const totalSegments = waypoints.length - 1;
      const totalDuration = totalSegments * MS_PER_ROW;

      drawBoard(ctx, rows, geometry);

      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (startTime === null) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const t       = Math.min(elapsed / totalDuration, 1);

        const rawSeg   = elapsed / MS_PER_ROW;
        const segIndex = Math.min(Math.floor(rawSeg), totalSegments - 1);
        const segT     = rawSeg - segIndex;

        const from = waypoints[segIndex];
        const to   = waypoints[segIndex + 1];

        const ease = segT < 0.5
          ? 2 * segT * segT
          : -1 + (4 - 2 * segT) * segT;

        const bx = from.x + (to.x - from.x) * ease;
        const by = from.y + (to.y - from.y) * ease;

        drawBoard(ctx, rows, geometry);
        drawBall(ctx, bx, by, multiplier);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          drawBoard(ctx, rows, geometry);
          onAnimationEnd();
          rafRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(animate);

      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePath]);

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full"
        style={{
          background: '#050c2e',
          display: 'block',
          maxWidth: CANVAS_WIDTH,
        }}
      />
    );
  },
);

export default PlinkoCanvas;