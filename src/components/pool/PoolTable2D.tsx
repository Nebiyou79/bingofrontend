// components/pool/PoolTable2D.tsx
/**
 * Professional 2D pool table renderer.
 * Pure HTML Canvas — no Three.js, no WASM, works everywhere.
 * Draws top-down view with realistic table, balls, aim guide, and cue stick.
 */
'use client';

import React, { useRef, useEffect, useCallback, MutableRefObject } from 'react';
import { BALL_COLORS, BALL_RADIUS, TABLE_HX, TABLE_HZ, POCKET_POSITIONS, STRIPE_BALLS } from '../../lib/pool.constants';

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const CW = 1060;  // canvas width
const CH = 560;   // canvas height

// Table drawing area (inside canvas)
const PAD   = 52;   // outer rail padding
const TL    = PAD;          // table left
const TT    = PAD;          // table top
const TW    = CW - PAD * 2; // table width
const TH    = CH - PAD * 2; // table height
const SX    = TW / (TABLE_HX * 2); // physics → canvas X scale
const SZ    = TH / (TABLE_HZ * 2); // physics → canvas Z scale
const BPX   = Math.min(SX, SZ) * BALL_RADIUS * 1.8; // ball pixel radius
const PPX   = 22; // pocket pixel radius

// Colours
const C = {
  rail:       '#1a0f08',
  railInner:  '#2d1a0d',
  cushion:    '#0d2e14',
  felt:       '#1e6b32',
  feltDark:   '#185728',
  feltLine:   '#1a5c2a',
  pocketHole: '#050505',
  pocketRim:  '#b8962e',
  diamondDot: 'rgba(255,255,255,0.25)',
  aimLine:    'rgba(255,255,255,0.5)',
  aimDot:     'rgba(255,255,255,0.7)',
};

// Pocket snapping (absorb ball near pocket edge)

function physToCanvas(px: number, pz: number): [number, number] {
  return [TL + (px + TABLE_HX) * SX, TT + (pz + TABLE_HZ) * SZ];
}

function drawBallCanvas(
  ctx: CanvasRenderingContext2D, num: number,
  cx: number, cy: number, r: number, alpha: number
) {
  if (alpha < 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const color    = (BALL_COLORS as Record<number, string>)[num] ?? '#fff';
  const isStripe = STRIPE_BALLS.includes(num);
  const isCue    = num === 0;

  // Drop shadow
  ctx.shadowColor   = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur    = 7;
  ctx.shadowOffsetX = 2.5;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);

  if (isCue) {
    ctx.fillStyle = '#F5F5F0';
    ctx.fill();
  } else if (isStripe) {
    ctx.fillStyle = '#F0EDE8';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(cx - r, cy - r * 0.44, r * 2, r * 0.88);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (!isCue) {
    // White number circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.43, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font      = `bold ${Math.round(r * 0.75)}px Georgia, serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), cx, cy + 0.5);
  }

  // Specular
  const g = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.32, 0, cx, cy, r);
  g.addColorStop(0, 'rgba(255,255,255,0.48)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.restore();
}

interface BallState { id: number; x: number; y: number; z: number }

interface PoolTable2DProps {
  positionsRef:   MutableRefObject<Map<number, BallState>>;
  ballsOnTable:   number[];
  isMyTurn:       boolean;
  controlsLocked: boolean;
  onShot:         (angle: number, power: number, spinX: number, spinY: number) => void;
  onPowerChange:  (p: number) => void;
}

export function PoolTable2D({ positionsRef, ballsOnTable, isMyTurn, controlsLocked, onShot, onPowerChange }: PoolTable2DProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const aimAngle   = useRef(Math.PI);
  const pullback   = useRef(0);
  const isDragging = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });
  const shotFired  = useRef(false);
  const opacities  = useRef<Record<number, number>>({});

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);

    // ── Outer rail ───────────────────────────────────────────────────────────
    const rr = 16;
    ctx.fillStyle = C.rail;
    ctx.beginPath();
    ctx.roundRect(TL - 38, TT - 38, TW + 76, TH + 76, rr + 6);
    ctx.fill();

    // Rail wood grain highlight
    ctx.strokeStyle = 'rgba(255,220,150,0.07)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(TL - 36, TT - 36, TW + 72, TH + 72, rr + 4);
    ctx.stroke();

    // ── Inner cushion rail ───────────────────────────────────────────────────
    ctx.fillStyle = C.railInner;
    ctx.beginPath();
    ctx.roundRect(TL - 20, TT - 20, TW + 40, TH + 40, rr);
    ctx.fill();

    // ── Cushion (rubber) ─────────────────────────────────────────────────────
    ctx.fillStyle = C.cushion;
    ctx.beginPath();
    ctx.roundRect(TL - 8, TT - 8, TW + 16, TH + 16, 6);
    ctx.fill();

    // ── Felt surface ─────────────────────────────────────────────────────────
    ctx.fillStyle = C.felt;
    ctx.fillRect(TL, TT, TW, TH);

    // Subtle felt texture
    ctx.strokeStyle = C.feltLine;
    ctx.lineWidth   = 0.5;
    ctx.globalAlpha = 0.08;
    for (let y = TT; y < TT + TH; y += 10) {
      ctx.beginPath(); ctx.moveTo(TL, y); ctx.lineTo(TL + TW, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Head string ──────────────────────────────────────────────────────────
    const [hsx] = physToCanvas(-TABLE_HX * 0.38, 0);
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(hsx, TT); ctx.lineTo(hsx, TT + TH); ctx.stroke();
    ctx.setLineDash([]);

    // ── Centre spot ──────────────────────────────────────────────────────────
    const [csx, csy] = physToCanvas(0, 0);
    ctx.beginPath(); ctx.arc(csx, csy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fill();

    // ── Diamond markers ──────────────────────────────────────────────────────
    const dFracs = [-0.5, 0, 0.5];
    for (const f of dFracs) {
      const [dx] = physToCanvas(f * TABLE_HX * 1.4, 0);
      ctx.beginPath(); ctx.arc(dx, TT - 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = C.diamondDot; ctx.fill();
      ctx.beginPath(); ctx.arc(dx, TT + TH + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      const [, dz] = physToCanvas(0, f * TABLE_HZ * 1.4);
      ctx.beginPath(); ctx.arc(TL - 12, dz, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(TL + TW + 12, dz, 3, 0, Math.PI * 2); ctx.fill();
    }

    // ── Pockets ───────────────────────────────────────────────────────────────
    for (const [px, pz] of POCKET_POSITIONS) {
      const [pcx, pcy] = physToCanvas(px as number, pz as number);
      ctx.beginPath(); ctx.arc(pcx, pcy, PPX + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fill();
      ctx.beginPath(); ctx.arc(pcx, pcy, PPX, 0, Math.PI * 2);
      ctx.fillStyle = C.pocketHole; ctx.fill();
      ctx.beginPath(); ctx.arc(pcx, pcy, PPX + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = C.pocketRim; ctx.lineWidth = 3.5; ctx.stroke();
    }

    // ── Aim guide & cue stick ─────────────────────────────────────────────────
    const cueBallPos = positionsRef.current.get(0);
    if (isMyTurn && !controlsLocked && cueBallPos) {
      const [cbx, cby] = physToCanvas(cueBallPos.x, cueBallPos.z);
      const angle      = aimAngle.current;

      // Ghost ball preview
      const ghostDist = 110;
      const gx = cbx + Math.cos(angle) * ghostDist;
      const gy = cby + Math.sin(angle) * ghostDist;
      ctx.beginPath(); ctx.arc(gx, gy, BPX * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();

      // Aim line
      ctx.setLineDash([6, 10]);
      ctx.strokeStyle = C.aimLine;
      ctx.lineWidth   = 1.5;
      const aimEndDist = 300;
      ctx.beginPath();
      ctx.moveTo(cbx, cby);
      ctx.lineTo(cbx + Math.cos(angle) * aimEndDist, cby + Math.sin(angle) * aimEndDist);
      ctx.stroke();
      ctx.setLineDash([]);

      // Aim endpoint dot
      ctx.beginPath();
      ctx.arc(cbx + Math.cos(angle) * aimEndDist, cby + Math.sin(angle) * aimEndDist, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.aimDot; ctx.fill();

      // Cue stick
      const pullPx   = pullback.current * 70;
      const tipDist  = BPX + 5 + pullPx;
      const cueLen   = 200;
      const tipX     = cbx - Math.cos(angle) * tipDist;
      const tipY     = cby - Math.sin(angle) * tipDist;
      const buttX    = tipX - Math.cos(angle) * cueLen;
      const buttY    = tipY - Math.sin(angle) * cueLen;

      const cg = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
      cg.addColorStop(0,    '#2255AA'); // tip (blue chalk)
      cg.addColorStop(0.04, '#d4a456'); // near tip (maple)
      cg.addColorStop(0.7,  '#c49040');
      cg.addColorStop(1,    '#7a3e10'); // butt (dark wood)

      ctx.strokeStyle  = cg;
      ctx.lineWidth    = 5.5;
      ctx.lineCap      = 'round';
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(buttX, buttY); ctx.stroke();
      ctx.lineCap = 'butt';

      // Cue tip circle
      ctx.beginPath(); ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2255AA'; ctx.fill();
    }

    // ── Balls ─────────────────────────────────────────────────────────────────
    const allBalls = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    for (const num of allBalls) {
      const pos = positionsRef.current.get(num);
      if (!pos) continue;
      const onTable = num === 0 || ballsOnTable.includes(num);
      const target  = onTable ? 1 : 0;
      const cur     = opacities.current[num] ?? 1;
      opacities.current[num] = cur + (target - cur) * 0.09;
      const [bx, by] = physToCanvas(pos.x, pos.z);
      if (bx < TL - BPX * 3 || bx > TL + TW + BPX * 3) continue;
      if (by < TT - BPX * 3 || by > TT + TH + BPX * 3) continue;
      drawBallCanvas(ctx, num, bx, by, BPX, opacities.current[num]);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [positionsRef, ballsOnTable, isMyTurn, controlsLocked]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // ── Pointer input ─────────────────────────────────────────────────────────
  const getPos = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top)  * (CH / rect.height),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isMyTurn || controlsLocked) return;
    isDragging.current = true;
    shotFired.current  = false;
    dragStart.current  = getPos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isMyTurn, controlsLocked, getPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !isMyTurn || controlsLocked) return;
    const pos = getPos(e);
    const dx  = pos.x - dragStart.current.x;
    const dy  = pos.y - dragStart.current.y;
    aimAngle.current += dx * 0.007;
    pullback.current  = Math.max(0, Math.min(1, pullback.current - dy * 0.005));
    dragStart.current = pos;
    onPowerChange(Math.round(pullback.current * 100));
  }, [isMyTurn, controlsLocked, getPos, onPowerChange]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current || !isMyTurn || controlsLocked || shotFired.current) return;
    isDragging.current = false;
    const power = Math.round(pullback.current * 100);
    if (power < 2) { pullback.current = 0; onPowerChange(0); return; }
    shotFired.current  = true;
    onShot(aimAngle.current, power, 0, 0);
    pullback.current = 0;
    onPowerChange(0);
  }, [isMyTurn, controlsLocked, onShot, onPowerChange]);

  useEffect(() => { if (!controlsLocked) shotFired.current = false; }, [controlsLocked]);

  return (
    <canvas
      ref={canvasRef}
      width={CW} height={CH}
      className="w-full h-full select-none"
      style={{ cursor: isMyTurn && !controlsLocked ? 'crosshair' : 'default', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}