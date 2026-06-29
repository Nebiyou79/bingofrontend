/**
 * hooks/useBallInterpolation.ts
 * DashBets — Binary snapshot decoder + position interpolator.
 *
 * Decodes the compact Int16LE buffers emitted by pool.physics.js
 * encodeSnapshot() and linearly interpolates between packets for smooth
 * 60fps rendering with zero React re-renders.
 *
 * Snapshot binary format (matches pool.physics.js exactly):
 *   Per ball: [id, x*1000, y*1000, z*1000, rx*100, ry*100, rz*100]
 *   Each field = Int16LE (2 bytes) → 14 bytes per ball
 *
 * Returns:
 *   positionsRef            — MutableRefObject<Map<id, BallPos>>
 *                             Read directly in R3F useFrame — no re-renders
 *   registerSnapshotCallback — Feed this function to usePoolGame's
 *                             snapshotCallbackRef.current
 *   onShotSettled           — Call when pool:shot_result arrives to stop loop
 */

import { useRef, useEffect, useCallback, MutableRefObject } from 'react';
import {
  SNAPSHOT_FIELDS,
  SNAPSHOT_BYTES,
  SNAPSHOT_POS_SCALE,
  SNAPSHOT_ROT_SCALE,
} from '../lib/pool.constants';
import type { BallPosition } from '../types/pool';

const BYTES_PER_BALL = SNAPSHOT_FIELDS * SNAPSHOT_BYTES; // 14

type BallPosMap = Map<number, BallPosition>;

/** Decode an ArrayBuffer snapshot into a Map<ballId, BallPosition> */
function decodeSnapshot(buffer: ArrayBuffer | Buffer): BallPosMap {
  const ab =
    buffer instanceof ArrayBuffer
      ? buffer
      : (buffer as Buffer).buffer.slice(
          (buffer as Buffer).byteOffset,
          (buffer as Buffer).byteOffset + (buffer as Buffer).byteLength
        );

  const view  = new DataView(ab as ArrayBuffer);
  const count = Math.floor(view.byteLength / BYTES_PER_BALL);
  const map: BallPosMap = new Map();

  for (let i = 0; i < count; i++) {
    const base = i * BYTES_PER_BALL;
    const id   = view.getInt16(base,      true);
    const x    = view.getInt16(base + 2,  true) / SNAPSHOT_POS_SCALE;
    const y    = view.getInt16(base + 4,  true) / SNAPSHOT_POS_SCALE;
    const z    = view.getInt16(base + 6,  true) / SNAPSHOT_POS_SCALE;
    const rx   = view.getInt16(base + 8,  true) / SNAPSHOT_ROT_SCALE;
    const ry   = view.getInt16(base + 10, true) / SNAPSHOT_ROT_SCALE;
    const rz   = view.getInt16(base + 12, true) / SNAPSHOT_ROT_SCALE;
    map.set(id, { id, x, y, z, rx, ry, rz });
  }
  return map;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBallPos(from: BallPosition, to: BallPosition, t: number): BallPosition {
  return {
    id: to.id,
    x:  lerp(from.x,  to.x,  t),
    y:  lerp(from.y,  to.y,  t),
    z:  lerp(from.z,  to.z,  t),
    rx: lerp(from.rx, to.rx, t),
    ry: lerp(from.ry, to.ry, t),
    rz: lerp(from.rz, to.rz, t),
  };
}

// ── Exported snapshot callback type ──────────────────────────────────────────
// This is the type that snapshotCallbackRef.current in usePoolGame holds.
export type SnapshotCallback = (buffer: ArrayBuffer | Buffer) => void;

export interface UseBallInterpolationReturn {
  /** Read ball positions here in R3F useFrame — no React re-renders */
  positionsRef: MutableRefObject<BallPosMap>;
  /**
   * Assign this to usePoolGame's snapshotCallbackRef.current.
   * Called by usePoolGame's onPhysicsSnapshot handler.
   */
  registerSnapshotCallback: SnapshotCallback;
  /** Call when pool:shot_result arrives (balls have settled) */
  onShotSettled: () => void;
}

export function useBallInterpolation(): UseBallInterpolationReturn {
  const positionsRef   = useRef<BallPosMap>(new Map());
  const fromRef        = useRef<BallPosMap>(new Map());
  const toRef          = useRef<BallPosMap>(new Map());
  const lastSnapTime   = useRef<number>(0);
  const snapInterval   = useRef<number>(1000 / 60);
  const rafHandle      = useRef<number | null>(null);
  const activeRef      = useRef<boolean>(false);

  // ── rAF loop ──────────────────────────────────────────────────────────────

const tick = useCallback((now: number) => {
  if (!activeRef.current) return;
  rafHandle.current = requestAnimationFrame(tick);

  const elapsed = now - lastSnapTime.current;
  const alpha   = Math.min(elapsed / snapInterval.current, 1.0);

  const interpolated: BallPosMap = new Map();
  
  // Fix: Use forEach instead of for...of
  toRef.current.forEach((toPos, id) => {
    const fromPos = fromRef.current.get(id) ?? toPos;
    interpolated.set(id, lerpBallPos(fromPos, toPos, alpha));
  });
  
  positionsRef.current = interpolated;
}, []);

  const startLoop = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current   = true;
    lastSnapTime.current = performance.now();
    rafHandle.current   = requestAnimationFrame(tick);
  }, [tick]);

  const stopLoop = useCallback(() => {
    activeRef.current = false;
    if (rafHandle.current !== null) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = null;
    }
  }, []);

  // ── Snapshot callback ─────────────────────────────────────────────────────
  // This function is assigned to snapshotCallbackRef.current in usePoolGame.

  const registerSnapshotCallback = useCallback<SnapshotCallback>((buffer) => {
    const now     = performance.now();
    const newSnap = decodeSnapshot(buffer as ArrayBuffer);

    // Adaptive interval estimate (EMA)
    if (lastSnapTime.current > 0) {
      const gap = now - lastSnapTime.current;
      snapInterval.current = snapInterval.current * 0.8 + gap * 0.2;
    }

    fromRef.current      = toRef.current;
    toRef.current        = newSnap;
    lastSnapTime.current = now;

    // Immediate update for static frames
    positionsRef.current = newSnap;

    startLoop();
  }, [startLoop]);

  // ── Settle callback ───────────────────────────────────────────────────────

  const onShotSettled = useCallback(() => {
    // Let the loop run one final frame then stop
    setTimeout(stopLoop, 100);
  }, [stopLoop]);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return { positionsRef, registerSnapshotCallback, onShotSettled };
}