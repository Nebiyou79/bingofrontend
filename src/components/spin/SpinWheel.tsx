/**
 * components/spin/SpinWheel.tsx  v4.0  — DEFINITIVE FIX
 *
 * STATE MACHINE (3 states only):
 *
 *   IDLE      → wheel is completely static. No animation.
 *   SPINNING  → continuous fast rotation (API call in progress).
 *               Triggered when isSpinning prop goes true.
 *   LANDING   → decelerating animation that stops on stopAngle.
 *               Triggered when isSpinning goes false AND stopAngle is set.
 *               After animation completes → back to IDLE.
 *
 * KEY FIXES vs previous version:
 *   1. Uses SVG transform="rotate(deg, cx, cy)" ATTRIBUTE (not CSS style).
 *      This is the only reliable cross-browser way to rotate SVG around a
 *      centre point. CSS transform-origin + Framer Motion had coordinate bugs.
 *   2. Wheel is COMPLETELY STATIC in IDLE. No setInterval running.
 *   3. Spinning phase: setInterval accelerates wheel. RAF not used.
 *   4. Landing phase: single RAF loop with easeOutCubic. stopAll() called
 *      synchronously before reading rotDeg.current — no race condition.
 *   5. stopAngle math uses (360 - stopAngle) % 360 normalised correctly.
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';

// ─── 16 segment styles (index matches spinEngine WHEEL_SEGMENTS) ──────────────

const SEG_FILLS = [
  '#1e293b','#0f172a','#7c2d12','#1a2035',
  '#164e63','#0f172a','#14532d','#1e293b',
  '#1e3a8a','#164e63','#3b0764','#0f172a',
  '#4c1d95','#881337','#14532d','#713f12',
];
const SEG_TEXTS = [
  '#475569','#374151','#fdba74','#374151',
  '#67e8f9','#374151','#86efac','#374151',
  '#93c5fd','#67e8f9','#d8b4fe','#374151',
  '#c4b5fd','#fda4af','#4ade80','#fcd34d',
];
const SEG_LABELS = [
  'LOSE','LOSE','0.5×','LOSE',
  '1×',  'LOSE','2×',  'LOSE',
  '3×',  '1×',  '5×',  'LOSE',
  '10×', '25×', 'MINI','JP 🏆',
];

const SEG_COUNT = 16;
const DEG_EACH  = 360 / SEG_COUNT; // 22.5°
const SIZE      = 360;
const CX        = SIZE / 2;  // 180
const CY        = SIZE / 2;  // 180
const OUTER_R   = SIZE / 2 - 6;
const INNER_R   = OUTER_R * 0.20;
const RING_COLOR = '#7c3aed';

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const s  = polar(cx, cy, r, a1);
  const e  = polar(cx, cy, r, a2);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${cx.toFixed(1)},${cy.toFixed(1)} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${lg} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SpinWheelProps {
  isSpinning: boolean;
  stopAngle: number | null;
  isWinner?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpinWheel({ isSpinning, stopAngle, isWinner = false }: SpinWheelProps) {
  const groupRef = useRef<SVGGElement>(null);
  const rotDeg   = useRef(0);
  const rafId    = useRef<number | null>(null);
  const spinIv   = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStop = useRef<number | null>(null);

  // Apply rotation via SVG attribute — most reliable for SVG rotation
  const setRot = useCallback((deg: number) => {
    rotDeg.current = deg;
    if (groupRef.current) {
      groupRef.current.setAttribute('transform', `rotate(${deg}, ${CX}, ${CY})`);
    }
  }, []);

  const stopAll = useCallback(() => {
    if (spinIv.current) { clearInterval(spinIv.current); spinIv.current = null; }
    if (rafId.current)  { cancelAnimationFrame(rafId.current); rafId.current = null; }
  }, []);

  // ── SPINNING phase ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSpinning) return;
    stopAll();
    let speed = 0;
    spinIv.current = setInterval(() => {
      speed = Math.min(speed + 0.6, 14);
      setRot(rotDeg.current + speed);
    }, 16);
    return stopAll;
  }, [isSpinning, setRot, stopAll]);

  // ── LANDING phase ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSpinning)         return;
    if (stopAngle === null) return;
    if (stopAngle === prevStop.current) return;
    prevStop.current = stopAngle;

    // Kill spinner first — read rotDeg AFTER killing interval
    stopAll();
    const startRot = rotDeg.current;

    // Where is the wheel's "0 mark" right now (normalised to 0-360)
    const current0    = ((startRot % 360) + 360) % 360;
    // Where we want the wheel's 0 mark to be so that stopAngle is at the top
    const wantedMark  = (360 - stopAngle % 360 + 360) % 360;
    // Extra clockwise rotation needed
    let delta = (wantedMark - current0 + 360) % 360;
    if (delta < 10) delta += 360; // ensure always moves forward

    const targetRot = startRot + 5 * 360 + delta;
    const duration  = 4200;
    const t0        = performance.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      setRot(startRot + (targetRot - startRot) * easeOut(t));
      if (t < 1) {
        rafId.current = requestAnimationFrame(frame);
      } else {
        setRot(targetRot);
        rafId.current = null;
      }
    };
    rafId.current = requestAnimationFrame(frame);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [isSpinning, stopAngle, setRot, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  // Ring dots
  const dots = useMemo(() => Array.from({ length: 32 }, (_, i) => {
    const p = polar(CX, CY, OUTER_R + 12, (i / 32) * 360);
    return { ...p, big: i % 4 === 0 };
  }), []);

  return (
    <div className="relative flex items-center justify-center select-none w-full">
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: 'min(100%, 420px)', height: 'min(100%, 420px)',
          aspectRatio: '1 / 1',
          background: `radial-gradient(circle, ${RING_COLOR}12 0%, transparent 68%)`,
          boxShadow: `0 0 ${isSpinning ? 44 : 18}px ${isSpinning ? 14 : 6}px ${RING_COLOR}48`,
          transition: 'box-shadow 0.4s',
        }}
      />

      {/* viewBox stays fixed at SIZE so all internal polar()/segPath() math is
          unaffected; the rendered box scales responsively via CSS so the wheel
          shrinks to fit narrow (mobile) viewports instead of forcing 360px of
          width on every screen regardless of size. */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          overflow: 'visible',
          filter: 'drop-shadow(0 6px 28px rgba(0,0,0,0.8))',
          width: 'min(86vw, 300px)',
          height: 'min(86vw, 300px)',
          maxWidth: SIZE,
          maxHeight: SIZE,
        }}
        aria-label="Spin wheel">
        <defs>
          <radialGradient id="swHub" cx="38%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#4c3d9e"/>
            <stop offset="100%" stopColor="#0a0820"/>
          </radialGradient>
          <filter id="swNeedle">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.9"/>
          </filter>
        </defs>

        {/* Static outer rings + dots */}
        <circle cx={CX} cy={CY} r={OUTER_R+14} fill="none" stroke={`${RING_COLOR}25`} strokeWidth={1.5}/>
        <circle cx={CX} cy={CY} r={OUTER_R+3}  fill="none" stroke={RING_COLOR}        strokeWidth={4} opacity={0.6}/>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.big ? 3 : 1.6}
            fill={d.big ? RING_COLOR : `${RING_COLOR}50`}/>
        ))}

        {/* ROTATING GROUP — SVG attribute rotation, no CSS */}
        <g ref={groupRef} transform={`rotate(0, ${CX}, ${CY})`}>
          {SEG_LABELS.map((label, i) => {
            const a1  = i * DEG_EACH;
            const a2  = a1 + DEG_EACH;
            const mid = a1 + DEG_EACH / 2;
            const lp  = polar(CX, CY, OUTER_R * 0.67, mid);
            return (
              <g key={i}>
                <path d={segPath(CX, CY, OUTER_R - 1, a1 + 0.5, a2 - 0.5)}
                  fill={SEG_FILLS[i] ?? '#1e293b'} stroke="#05040e" strokeWidth={2}/>
                <text x={lp.x.toFixed(2)} y={lp.y.toFixed(2)}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={label.length > 4 ? 8 : 10} fontWeight="900"
                  fontFamily="'DM Mono','Courier New',monospace"
                  fill={SEG_TEXTS[i] ?? '#64748b'}
                  transform={`rotate(${mid.toFixed(2)}, ${lp.x.toFixed(2)}, ${lp.y.toFixed(2)})`}>
                  {label}
                </text>
              </g>
            );
          })}

          {/* Dividers */}
          {Array.from({ length: SEG_COUNT }, (_, i) => {
            const a = i * DEG_EACH;
            const inner = polar(CX, CY, INNER_R + 2, a);
            const outer = polar(CX, CY, OUTER_R - 1, a);
            return <line key={i} x1={inner.x.toFixed(2)} y1={inner.y.toFixed(2)}
              x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)} stroke="#05040e" strokeWidth={2}/>;
          })}

          {/* Hub */}
          <circle cx={CX} cy={CY} r={INNER_R+8} fill="#05040e" stroke={RING_COLOR} strokeWidth={2.5}/>
          <circle cx={CX} cy={CY} r={INNER_R+4} fill="url(#swHub)"/>
          <circle cx={CX} cy={CY} r={INNER_R}   fill="#100d30"/>
          <text x={CX} y={CY+1} textAnchor="middle" dominantBaseline="central"
            fontSize={INNER_R * 0.85} fontWeight="900"
            fontFamily="'Syne','Arial Black',sans-serif"
            fill={RING_COLOR} opacity={0.9}>S</text>
        </g>

        {/* Static needle — always on top */}
        <polygon points={`${CX-12},3 ${CX+12},3 ${CX+4},46 ${CX-4},46`}
          fill="#f59e0b" stroke="#05040e" strokeWidth={2} strokeLinejoin="round"
          filter="url(#swNeedle)"/>
        <circle cx={CX} cy={3} r={8}   fill="#fbbf24" stroke="#05040e" strokeWidth={2}/>
        <circle cx={CX} cy={3} r={3.5} fill="#f59e0b"/>
      </svg>

      {isSpinning && (
        <div className="absolute flex items-center justify-center rounded-full pointer-events-none"
          style={{ width: INNER_R*5, height: INNER_R*5,
            background: 'rgba(5,4,20,0.6)', backdropFilter: 'blur(3px)' }}>
          <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse"
            style={{ color: RING_COLOR }}>Spinning…</span>
        </div>
      )}
    </div>
  );
}