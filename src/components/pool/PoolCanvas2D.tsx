// components/pool/PoolCanvas2D.tsx
// 2D HTML5 canvas pool table — replaces @react-three/fiber entirely.
// Renders a top-down perspective view matching the design in the mockups.
// No WASM, no Three.js, no SSR issues.
//
// Coordinate system:
//   Physics: x ∈ [-1.065, 1.065], z ∈ [-0.535, 0.535]  (metres)
//   Canvas:  0,0 = top-left of the play surface
//   Conversion: physToPixel(x, z) → [px, py]
//
// Shot control:
//   Click/touch sets aim direction from cue ball to pointer.
//   Hold spacebar OR hold pointer to charge power (0→100).
//   Release to fire. While locked (physics in flight) pointer-events disabled.

'use client';

import {
  useRef, useEffect, useCallback, MutableRefObject,
} from 'react';
import {
  TABLE_W_PX, TABLE_H_PX, BALL_PX, POCKET_PX, POCKET_R_PX,
  BALL_COLORS, STRIPE_BALLS, RACK_POSITIONS, physToPixel,
} from '../../lib/pool.constants';
import type { BallPosition } from '../../types/pool';

type BallPosMap = Map<number, BallPosition>;

// ── Canvas padding (cushion area) ─────────────────────────────────────────
const CUSHION  = 40;   // px on each side
const CANVAS_W = TABLE_W_PX + CUSHION * 2;
const CANVAS_H = TABLE_H_PX + CUSHION * 2;

// Convert physics coords → canvas coords (includes cushion offset)
function physToCanvas(x: number, z: number): [number, number] {
  const [px, py] = physToPixel(x, z);
  return [px + CUSHION, py + CUSHION];
}

// Convert rack position [physX, physZ] → canvas [cx, cy]
function rackToCanvas(num: number): [number, number] {
  const rp = RACK_POSITIONS[num];
  if (!rp) return [CUSHION + TABLE_W_PX / 2, CUSHION + TABLE_H_PX / 2];
  return physToCanvas(rp[0], rp[1]);
}

// ── Ball texture cache (canvas-based, generated once) ─────────────────────
const ballImageCache = new Map<number, HTMLCanvasElement>();

function getBallCanvas(num: number): HTMLCanvasElement {
  if (ballImageCache.has(num)) return ballImageCache.get(num)!;

  const size     = BALL_PX * 4; // 4× for retina crispness
  const off      = document.createElement('canvas');
  off.width      = off.height = size;
  const ctx      = off.getContext('2d')!;
  const r        = size / 2;
  const isStripe = STRIPE_BALLS.includes(num);
  const color    = BALL_COLORS[num as keyof typeof BALL_COLORS] ?? '#888';

  // Ball body
  const grad = ctx.createRadialGradient(r * 0.65, r * 0.55, r * 0.05, r, r, r);
  if (num === 0) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#d8d8d0');
  } else if (isStripe) {
    grad.addColorStop(0, '#f5f5f0');
    grad.addColorStop(1, '#d8d8d0');
  } else {
    grad.addColorStop(0, lighten(color, 0.4));
    grad.addColorStop(1, color);
  }

  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Stripe band
  if (isStripe) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(0, r * 0.32, size, r * 1.36);
    ctx.restore();
  }

  // Number circle
  if (num > 0) {
    ctx.beginPath();
    ctx.arc(r, r, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.fillStyle    = '#111';
    ctx.font         = `bold ${size * 0.32}px Arial`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), r, r + 1);
  }

  // Specular
  const spec = ctx.createRadialGradient(r * 0.55, r * 0.45, 0, r * 0.65, r * 0.5, r * 0.4);
  spec.addColorStop(0, 'rgba(255,255,255,0.55)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.fillStyle = spec;
  ctx.fill();

  ballImageCache.set(num, off);
  return off;
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amt));
  const g = Math.min(255, ((n >> 8)  & 0xff) + Math.round(255 * amt));
  const b = Math.min(255, ( n        & 0xff) + Math.round(255 * amt));
  return `rgb(${r},${g},${b})`;
}

// ── Props ─────────────────────────────────────────────────────────────────

interface PoolCanvas2DProps {
  positionsRef:   MutableRefObject<BallPosMap>;
  ballsOnTable:   number[];
  isMyTurn:       boolean;
  controlsLocked: boolean;
  onShot:         (angle: number, power: number, spinX: number, spinY: number) => void;
  onPowerChange:  (p: number) => void;
  onAimingChange: (a: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export function PoolCanvas2D({
  positionsRef, ballsOnTable, isMyTurn, controlsLocked,
  onShot, onPowerChange, onAimingChange,
}: PoolCanvas2DProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rafRef         = useRef<number | null>(null);
  const aimAngleRef    = useRef<number>(0);   // radians from +X
  const powerRef       = useRef<number>(0);   // 0–100
  const isChargingRef  = useRef<boolean>(false);
  const chargeStartRef = useRef<number>(0);
  const aimingRef      = useRef<boolean>(false);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  // ── Get cue ball canvas position ────────────────────────────────────────

  const getCueBallXY = useCallback((): [number, number] => {
    const pos = positionsRef.current.get(0);
    if (pos) return physToCanvas(pos.x, pos.z);
    return rackToCanvas(0);
  }, [positionsRef]);

  // ── Main draw loop ────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── Background ──────────────────────────────────────────────────────
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // ── Outer rail (wood) ────────────────────────────────────────────────
    const railGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    railGrad.addColorStop(0, '#3d2010');
    railGrad.addColorStop(0.5, '#5c3009');
    railGrad.addColorStop(1, '#3d2010');
    ctx.fillStyle = railGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_W, CANVAS_H, 18);
    ctx.fill();

    // ── Pocket holes (behind felt) ────────────────────────────────────────
    for (const [px, py] of POCKET_PX) {
      const cx = px + CUSHION;
      const cy = py + CUSHION;
      ctx.beginPath();
      ctx.arc(cx, cy, POCKET_R_PX + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
    }

    // ── Felt surface ─────────────────────────────────────────────────────
    const feltGrad = ctx.createRadialGradient(
      CUSHION + TABLE_W_PX / 2, CUSHION + TABLE_H_PX / 2, 50,
      CUSHION + TABLE_W_PX / 2, CUSHION + TABLE_H_PX / 2, TABLE_W_PX / 1.5,
    );
    feltGrad.addColorStop(0, '#1d6b32');
    feltGrad.addColorStop(1, '#145228');
    ctx.fillStyle = feltGrad;
    ctx.fillRect(CUSHION, CUSHION, TABLE_W_PX, TABLE_H_PX);

    // ── Felt markings ────────────────────────────────────────────────────
    // Baulk line
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1;
    const baulkX    = CUSHION + TABLE_W_PX * 0.25;
    ctx.beginPath();
    ctx.moveTo(baulkX, CUSHION);
    ctx.lineTo(baulkX, CUSHION + TABLE_H_PX);
    ctx.stroke();
    // Centre spot
    ctx.beginPath();
    ctx.arc(CUSHION + TABLE_W_PX / 2, CUSHION + TABLE_H_PX / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();

    // ── Cushion rubber (inner edge) ───────────────────────────────────────
    ctx.strokeStyle = '#1a5a28';
    ctx.lineWidth   = 6;
    ctx.strokeRect(CUSHION, CUSHION, TABLE_W_PX, TABLE_H_PX);

    // ── Diamond markers ───────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    const diamondPositions = [
      // Top rail
      [CUSHION + TABLE_W_PX * 0.25, CUSHION - 16],
      [CUSHION + TABLE_W_PX * 0.5,  CUSHION - 16],
      [CUSHION + TABLE_W_PX * 0.75, CUSHION - 16],
      // Bottom rail
      [CUSHION + TABLE_W_PX * 0.25, CUSHION + TABLE_H_PX + 16],
      [CUSHION + TABLE_W_PX * 0.5,  CUSHION + TABLE_H_PX + 16],
      [CUSHION + TABLE_W_PX * 0.75, CUSHION + TABLE_H_PX + 16],
      // Left rail
      [CUSHION - 16, CUSHION + TABLE_H_PX * 0.5],
      // Right rail
      [CUSHION + TABLE_W_PX + 16, CUSHION + TABLE_H_PX * 0.5],
    ];
    for (const [dx, dy] of diamondPositions) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    // ── Pocket rings (brass) ──────────────────────────────────────────────
    for (const [px, py] of POCKET_PX) {
      const cx = px + CUSHION;
      const cy = py + CUSHION;
      // Hole
      ctx.beginPath();
      ctx.arc(cx, cy, POCKET_R_PX, 0, Math.PI * 2);
      ctx.fillStyle = '#080808';
      ctx.fill();
      // Brass ring
      ctx.beginPath();
      ctx.arc(cx, cy, POCKET_R_PX + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#b8922a';
      ctx.lineWidth   = 3;
      ctx.stroke();
    }

    // ── Aim line (only when my turn and not locked) ────────────────────────
    if (isMyTurn && !controlsLocked && aimingRef.current) {
      const [cbx, cby] = getCueBallXY();
      const angle      = aimAngleRef.current;
      const reach      = 350;
      const ex         = cbx + Math.cos(angle) * reach;
      const ey         = cby + Math.sin(angle) * reach;

      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(cbx, cby);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Cue stick (behind cue ball)
      const cueBack   = 90 + (powerRef.current / 100) * 40;
      const sx        = cbx - Math.cos(angle) * cueBack;
      const sy        = cby - Math.sin(angle) * cueBack;
      const butx      = cbx - Math.cos(angle) * (cueBack + 160);
      const buty      = cby - Math.sin(angle) * (cueBack + 160);

      const cueGrad = ctx.createLinearGradient(sx, sy, butx, buty);
      cueGrad.addColorStop(0, '#1a3fa0');  // tip
      cueGrad.addColorStop(0.05, '#d4a456');
      cueGrad.addColorStop(1, '#8B5E1A');  // butt
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(butx, buty);
      ctx.strokeStyle = cueGrad;
      ctx.lineWidth   = 6;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    // ── Balls ─────────────────────────────────────────────────────────────
    const allBalls = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    for (const num of allBalls) {
      if (!ballsOnTable.includes(num)) continue;

      const pos = positionsRef.current.get(num);
      let cx: number, cy: number;
      if (pos) {
        [cx, cy] = physToCanvas(pos.x, pos.z);
      } else {
        [cx, cy] = rackToCanvas(num);
      }

      const bImg = getBallCanvas(num);
      const d    = BALL_PX * 2;
      ctx.drawImage(bImg, cx - BALL_PX, cy - BALL_PX, d, d);

      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + 3, BALL_PX, BALL_PX * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
    }
  }, [positionsRef, ballsOnTable, isMyTurn, controlsLocked, getCueBallXY]);

  // ── RAF render loop ────────────────────────────────────────────────────

  useEffect(() => {
    function loop() {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // ── Canvas resize (HiDPI) ─────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width  = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
  }, []);

  // ── Pointer / aim control ─────────────────────────────────────────────

  const getAngle = useCallback((e: React.PointerEvent | PointerEvent): number => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const px     = (e.clientX - rect.left) * scaleX;
    const py     = (e.clientY - rect.top)  * scaleY;
    const [cbx, cby] = getCueBallXY();
    return Math.atan2(py - cby, px - cbx);
  }, [getCueBallXY]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isMyTurn || controlsLocked) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
    aimAngleRef.current    = getAngle(e);
    aimingRef.current      = true;
    chargeStartRef.current = Date.now();
    isChargingRef.current  = true;
    onAimingChange(true);
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }, [isMyTurn, controlsLocked, getAngle, onAimingChange]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isMyTurn || controlsLocked || !pointerDownRef.current) return;
    aimAngleRef.current = getAngle(e);

    // Power from hold duration (0→3s = 0→100%)
    const held = (Date.now() - chargeStartRef.current) / 3000;
    const pct  = Math.min(100, Math.round(held * 100));
    powerRef.current = pct;
    onPowerChange(pct);
  }, [isMyTurn, controlsLocked, getAngle, onPowerChange]);

  const onPointerUp = useCallback(() => {
    if (!isMyTurn || controlsLocked || !pointerDownRef.current) return;

    const finalPower = powerRef.current;
    aimingRef.current     = false;
    isChargingRef.current = false;
    powerRef.current      = 0;
    pointerDownRef.current = null;
    onAimingChange(false);
    onPowerChange(0);

    if (finalPower < 2) return; // too light — ignore
    onShot(aimAngleRef.current, finalPower, 0, 0);
  }, [isMyTurn, controlsLocked, onShot, onAimingChange, onPowerChange]);

  // ── Power charge via pointer hold ─────────────────────────────────────

  useEffect(() => {
    if (!isChargingRef.current) return;
    const interval = setInterval(() => {
      if (!isChargingRef.current) { clearInterval(interval); return; }
      const held = (Date.now() - chargeStartRef.current) / 3000;
      const pct  = Math.min(100, Math.round(held * 100));
      powerRef.current = pct;
      onPowerChange(pct);
    }, 50);
    return () => clearInterval(interval);
  });

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`block max-w-full rounded-xl shadow-2xl ${
        isMyTurn && !controlsLocked ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{ touchAction: 'none', maxHeight: '70vh', objectFit: 'contain' }}
    />
  );
}
