// components/chicken/ChickenRoad.tsx
/**
 * DashBets — Chicken Road Game Widget
 *
 * v4 — animation & gameplay-feel pass. Everything here is presentational;
 * no game math or backend calls changed (I don't have access to those).
 * What's new:
 *
 *  - The chicken now HOPS between lanes (arc + squash/stretch + a dust
 *    poof on landing) instead of just sliding.
 *  - The current lane gets a visible highlight strip + a bouncing "tap
 *    here" chevron — before this, the clickable area was invisible and
 *    the only cue was the green badge floating above it.
 *  - Clearing a lane fires a small green spark burst off the badge.
 *  - Crashing now shakes the WHOLE board (not just an invisible button),
 *    freezes all ambient traffic for a beat, and flashes the full surface
 *    — a proper "freeze-frame" hit instead of a local flicker.
 *  - Cashing out or clearing the board fires a short confetti burst.
 *  - While waiting on the server after a click, the chicken gets a subtle
 *    "thinking" pulse instead of sitting dead still.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { ChickenSession, Difficulty } from '../../lib/api/chickenApi';

export type LaneState = 'pending' | 'current' | 'safe' | 'blocked' | 'revealed';

interface ChickenRoadProps {
  session:           ChickenSession | null;
  layout?:           boolean[];
  onCross:           () => void;
  disabled:          boolean;
  isShaking:         boolean;
  previewDifficulty: Difficulty;
  previewLaneCount:  number;
}

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  roadTop:    '#1B2129',
  roadBottom: '#10141A',
  divider:    'rgba(255,255,255,0.07)',
  badgeBg:    '#2A323C',
  badgeText:  'rgba(255,255,255,0.78)',
  green:      '#1FC76A',
  red:        '#E0495C',
  gold:       '#F2C94C',
  textDim:    'rgba(255,255,255,0.55)',
};

const CAR_COLORS     = ['#E0495C', '#3B82F6', '#E8954B', '#9CA3AF'];
const CONFETTI_COLORS = ['#1FC76A', '#F2C94C', '#3B82F6', '#E0495C', '#FFFFFF'];

function laneSeed(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const DIFFICULTY_RISK: Record<Difficulty, { houseEdge: number; dangerMin: number; dangerMax: number }> = {
  easy:   { houseEdge: 0.03, dangerMin: 1, dangerMax: 2 },
  medium: { houseEdge: 0.04, dangerMin: 2, dangerMax: 3 },
  hard:   { houseEdge: 0.05, dangerMin: 3, dangerMax: 4 },
};
function estimateMultiplier(difficulty: Difficulty, laneCount: number, lanesCleared: number): number {
  if (lanesCleared <= 0) return 1.0;
  const { houseEdge, dangerMin, dangerMax } = DIFFICULTY_RISK[difficulty];
  const avgDanger = (dangerMin + dangerMax) / 2;
  const safeProb  = Math.max(0.1, 1 - avgDanger / laneCount);
  const prob      = Math.pow(safeProb, lanesCleared);
  return Math.max(1.0, Math.floor((1 / prob) * (1 - houseEdge) * 100) / 100);
}

// ── Vector icons ─────────────────────────────────────────────────────────────
function ChickenIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 28 32" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}>
      <rect x="9.5" y="25.5" width="2" height="5.5" rx="1" fill="#E8954B" />
      <rect x="15.5" y="25.5" width="2" height="5.5" rx="1" fill="#E8954B" />
      <ellipse cx="14" cy="18" rx="9.5" ry="10" fill="#FAF7EF" />
      <path d="M6 13 Q4 18 7.5 23" stroke="rgba(0,0,0,0.07)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="15" cy="7" r="5.4" fill="#FAF7EF" />
      <path d="M10.5 2.3 Q11.5 -1 13 1.8 Q14.3 -1.6 15.7 1.6 Q17 -1 18 2.6" fill="#E0495C" />
      <ellipse cx="18.3" cy="9.6" rx="1.5" ry="2" fill="#E0495C" />
      <path d="M19.4 6.6 L23.5 7.4 L19.4 8.6 Z" fill="#F2994A" />
      <circle cx="16.2" cy="6" r="1" fill="#1A1A1A" />
    </svg>
  );
}

function CarIcon({ color, size = 30 }: { color: string; size?: number }) {
  const w = size, h = size * 0.5;
  return (
    <svg width={w} height={h} viewBox="0 0 44 22" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.45))' }}>
      <rect x="2" y="8" width="40" height="10" rx="5" fill={color} />
      <rect x="13" y="3" width="18" height="9" rx="3" fill={color} />
      <rect x="16" y="5" width="12" height="5" rx="1.5" fill="rgba(255,255,255,0.5)" />
      <rect x="6" y="16" width="6" height="4" rx="2" fill="#15191E" />
      <rect x="32" y="16" width="6" height="4" rx="2" fill="#15191E" />
      <circle cx="4" cy="13" r="1.3" fill="#FFE9A8" />
      <circle cx="40" cy="13" r="1.3" fill="#B23A47" />
    </svg>
  );
}

// ── Mini header ────────────────────────────────────────────────────────────
function RoadHeader({ multiplier }: { multiplier: number | null }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="relative flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-black tracking-tight text-white">CHICKEN</span>
        <span className="text-base font-black tracking-tight" style={{ color: C.green }}>ROAD</span>
      </div>
      <div className="flex items-center gap-2">
        {multiplier != null && (
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full" style={{ background: 'rgba(31,199,106,0.12)', border: `1px solid rgba(31,199,106,0.3)`, color: C.green }}>
            {multiplier.toFixed(2)}x
          </span>
        )}
        <button
          onClick={() => setShowHelp(v => !v)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: C.textDim }}
        >
          How to play?
        </button>
      </div>

      {showHelp && (
        <div
          className="absolute right-4 top-12 z-30 w-64 rounded-lg p-3 text-[11px] leading-relaxed shadow-xl"
          style={{ background: '#1B232C', border: `1px solid ${C.divider}`, color: C.textDim }}
        >
          Pick a bet, difficulty and lane count, then press <strong style={{ color: C.green }}>Go</strong>.
          Each lane you clear raises your multiplier — cash out any time, or keep pushing for the
          gold lane at the end. Hit traffic and you lose the bet.
        </div>
      )}
    </div>
  );
}

// ── Ambient traffic ──────────────────────────────────────────────────────────
function AmbientCar({ laneIndex, yielding, frozen }: { laneIndex: number; yielding: boolean; frozen: boolean }) {
  const color    = CAR_COLORS[Math.floor(laneSeed(laneIndex, 1) * CAR_COLORS.length)];
  const duration = 2.8 + laneSeed(laneIndex, 3) * 2.2;
  const delay    = laneSeed(laneIndex, 4) * -duration;
  const reverse  = laneSeed(laneIndex, 5) > 0.5;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className={reverse ? 'ambient-car-reverse' : 'ambient-car-forward'}
        style={{
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationPlayState: (yielding || frozen) ? 'paused' : 'running',
          filter: yielding ? 'brightness(1.2)' : undefined,
        }}
      >
        <div style={{ transform: reverse ? 'scaleX(-1)' : undefined }}>
          <CarIcon color={color} size={26} />
        </div>
      </div>
    </div>
  );
}

function KillerCar({ laneIndex }: { laneIndex: number }) {
  const fromLeft = laneSeed(laneIndex, 9) > 0.5;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className={fromLeft ? 'killer-car-from-left' : 'killer-car-from-right'}
        style={{ transform: fromLeft ? undefined : 'scaleX(-1)' }}
      >
        <CarIcon color="#E0495C" size={32} />
      </div>
    </div>
  );
}

// ── Spark burst — plays once when a badge freshly mounts as 'safe' ─────────────
function SparkBurst() {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <div className="absolute inset-0">
      {angles.map(a => {
        const rad = (a * Math.PI) / 180;
        const dx  = Math.round(Math.cos(rad) * 16);
        const dy  = Math.round(Math.sin(rad) * 16);
        return (
          <span
            key={a}
            className="spark"
            style={{ '--dx': `${dx}px`, '--dy': `${dy}px` } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// ── Multiplier bubble ────────────────────────────────────────────────────────
function MultiplierBubble({ state, multiplier, isFinal }: { state: LaneState; multiplier: number; isFinal: boolean }) {
  if (state === 'blocked') {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm animate-bad-pop" style={{ background: 'rgba(224,73,92,0.18)', border: `1.5px solid ${C.red}` }}>
        ✕
      </div>
    );
  }

  if (state === 'safe') {
    return (
      <div className="relative w-10 h-10 rounded-full flex flex-col items-center justify-center animate-bubble-pop" style={{ background: 'rgba(31,199,106,0.16)', border: `1.5px solid ${C.green}` }}>
        <SparkBurst />
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="relative z-10">
          <path d="M5 13l4.5 4.5L19 8" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[8px] font-bold font-mono leading-none mt-0.5 relative z-10" style={{ color: C.green }}>{multiplier.toFixed(2)}x</span>
      </div>
    );
  }

  if (state === 'current') {
    return (
      <div className="relative w-11 h-11 rounded-full flex items-center justify-center font-bold text-[11px] font-mono animate-pulse-ring" style={{ background: C.green, color: '#06210F' }}>
        {multiplier.toFixed(2)}x
      </div>
    );
  }

  if (isFinal) {
    return (
      <div className="relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-px h-16 light-beam" />
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[11px] font-mono relative z-10 animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, #FFE9A8 0%, #F2C94C 70%)', color: '#3A2600' }}>
          {multiplier.toFixed(2)}x
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[10px] font-mono"
      style={{
        background: state === 'revealed' ? 'rgba(232,149,75,0.12)' : C.badgeBg,
        border: state === 'revealed' ? '1px solid rgba(232,149,75,0.35)' : '1px solid rgba(255,255,255,0.06)',
        color: state === 'revealed' ? '#E8954B' : C.badgeText,
      }}
    >
      {multiplier.toFixed(2)}x
    </div>
  );
}

// ── Confetti — short celebration burst on win / cash out ────────────────────────
function ConfettiBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {Array.from({ length: 16 }).map((_, i) => {
        const seed  = laneSeed(i, 77);
        const left  = 6 + seed * 88;
        const delay = (laneSeed(i, 91) * 0.35).toFixed(2);
        const dur   = (0.7 + laneSeed(i, 13) * 0.5).toFixed(2);
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s`, background: color }}
          />
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ChickenRoad({ session, layout, onCross, disabled, isShaking, previewDifficulty, previewLaneCount }: ChickenRoadProps) {
  const isActive = !!session && session.status === 'active';

  const laneCount   = isActive ? session!.laneCount  : previewLaneCount;
  const difficulty  = isActive ? session!.difficulty : previewDifficulty;
  const currentLane = session?.currentLane ?? 0;
  const crossedLanes = session?.crossedLanes ?? [];
  const cols         = laneCount + 1;

  const lanes: LaneState[] = Array.from({ length: laneCount }, (_, i) => {
    const crossed = crossedLanes.find(c => c.lane === i);
    if (crossed) return crossed.wasBlocked ? 'blocked' : 'safe';
    if (isActive && i === currentLane) return 'current';
    if (!isActive && session && layout && i >= crossedLanes.length) return 'revealed';
    return 'pending';
  });

  const chickenCol     = isActive ? currentLane + 1 : crossedLanes.length;
  const chickenLeftPct = session ? (chickenCol + 0.5) / cols * 100 : (0.5 / cols) * 100;

  // Waiting on a server response (clicked, result not back yet) — give the
  // chicken a "thinking" pulse instead of sitting frozen.
  const isThinking = isActive && disabled;

  // Short confetti beat the moment a round resolves into a win/cash-out.
  const [celebrate, setCelebrate] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = session?.status;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if ((status === 'won' || status === 'cashed_out') && prev !== status) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1100);
      return () => clearTimeout(t);
    }
  }, [session?.status]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(31,199,106,0.45); }
          50%     { box-shadow: 0 0 0 6px rgba(31,199,106,0); }
        }
        .animate-pulse-ring { animation: pulse-ring 1.6s ease-in-out infinite; }

        @keyframes glow-pulse {
          0%,100% { filter: drop-shadow(0 0 6px rgba(242,201,76,0.6)); }
          50%     { filter: drop-shadow(0 0 14px rgba(242,201,76,0.9)); }
        }
        .animate-glow-pulse { animation: glow-pulse 1.8s ease-in-out infinite; }

        .light-beam {
          background: linear-gradient(to bottom, rgba(242,201,76,0.55), transparent);
          filter: blur(2px);
        }

        @keyframes bubble-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bubble-pop { animation: bubble-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        @keyframes bad-pop {
          0%   { transform: scale(0.5) rotate(-8deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-bad-pop { animation: bad-pop 0.3s ease-out forwards; }

        @keyframes spark-burst {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes spark-travel {
          0%   { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
        }
        .spark {
          position: absolute; top: 50%; left: 50%; width: 4px; height: 4px;
          margin-top: -2px; margin-left: -2px; border-radius: 50%; background: ${C.green};
          animation: spark-travel 0.5s ease-out forwards;
        }

        @keyframes confetti-fall {
          0%   { transform: translateY(-8px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(380deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute; top: 0; width: 6px; height: 6px; border-radius: 1px;
          animation-name: confetti-fall; animation-timing-function: ease-in; animation-fill-mode: forwards;
        }

        @keyframes drive-forward {
          0%   { transform: translateX(-260%); opacity: 0; }
          8%   { opacity: 1; } 92% { opacity: 1; }
          100% { transform: translateX(260%); opacity: 0; }
        }
        @keyframes drive-reverse {
          0%   { transform: translateX(260%) scaleX(-1); opacity: 0; }
          8%   { opacity: 1; } 92% { opacity: 1; }
          100% { transform: translateX(-260%) scaleX(-1); opacity: 0; }
        }
        .ambient-car-forward { position:absolute; top:50%; left:50%; margin-top:-9px; margin-left:-13px; animation-name: drive-forward; animation-timing-function: linear; animation-iteration-count: infinite; }
        .ambient-car-reverse { position:absolute; top:50%; left:50%; margin-top:-9px; margin-left:-13px; animation-name: drive-reverse; animation-timing-function: linear; animation-iteration-count: infinite; }

        @keyframes board-shake {
          0%,100% { transform: translateX(0); }
          15%     { transform: translateX(-7px) rotate(-0.4deg); }
          30%     { transform: translateX(6px) rotate(0.4deg); }
          45%     { transform: translateX(-5px); }
          60%     { transform: translateX(4px); }
          75%     { transform: translateX(-2px); }
        }
        .animate-board-shake { animation: board-shake 0.5s ease-in-out; }

        @keyframes killer-drive-from-left {
          0%   { transform: translateX(-220%); }
          70%  { transform: translateX(6%); }
          100% { transform: translateX(0%); }
        }
        @keyframes killer-drive-from-right {
          0%   { transform: scaleX(-1) translateX(-220%); }
          70%  { transform: scaleX(-1) translateX(6%); }
          100% { transform: scaleX(-1) translateX(0%); }
        }
        .killer-car-from-left  { display:inline-block; animation: killer-drive-from-left 0.5s cubic-bezier(0.22,0.8,0.34,1) forwards; }
        .killer-car-from-right { display:inline-block; animation: killer-drive-from-right 0.5s cubic-bezier(0.22,0.8,0.34,1) forwards; }

        @keyframes crash-flash {
          0% { opacity: 0; } 15% { opacity: 0.8; } 100% { opacity: 0; }
        }
        .crash-flash {
          position: absolute; inset: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(224,73,92,0.4) 45%, transparent 75%);
          animation: crash-flash 0.55s ease-out 0.4s forwards;
          opacity: 0;
        }
        @keyframes board-flash {
          0% { opacity: 0; } 18% { opacity: 0.5; } 100% { opacity: 0; }
        }
        .board-flash {
          position: absolute; inset: 0; background: #E0495C; mix-blend-mode: screen;
          animation: board-flash 0.45s ease-out forwards; pointer-events: none; z-index: 25;
        }

        @keyframes chicken-hop {
          0%   { transform: translateY(0) scale(1,1); }
          30%  { transform: translateY(-14px) scale(0.95,1.08); }
          55%  { transform: translateY(-14px) scale(1.05,0.95); }
          100% { transform: translateY(0) scale(1,1); }
        }
        .chicken-hop { animation: chicken-hop 0.45s cubic-bezier(0.33,1,0.68,1); }

        @keyframes dust-poof {
          0%   { transform: scale(0.3); opacity: 0; }
          40%  { opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .dust-poof {
          position: absolute; left: 50%; bottom: -2px; width: 18px; height: 7px;
          margin-left: -9px; border-radius: 50%; background: rgba(255,255,255,0.5);
          animation: dust-poof 0.4s ease-out 0.32s forwards; opacity: 0;
        }

        @keyframes anticipate {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.08); }
        }
        .chicken-anticipate { animation: anticipate 0.55s ease-in-out infinite; }

        @keyframes tap-hint {
          0%,100% { transform: translateY(0); opacity: 0.9; }
          50%     { transform: translateY(4px); opacity: 0.4; }
        }
        .tap-hint { animation: tap-hint 1.1s ease-in-out infinite; }
      `}</style>

      <div className="relative rounded-t-2xl overflow-hidden">
        <RoadHeader multiplier={isActive ? (session?.currentMultiplier ?? null) : null} />
        {celebrate && <ConfettiBurst />}

        <div
          className={`relative w-full ${isShaking ? 'animate-board-shake' : ''}`}
          style={{ height: '180px', background: `linear-gradient(to bottom, ${C.roadTop}, ${C.roadBottom})` }}
        >
          {isShaking && <div className="board-flash" />}

          {/* Lane divider lines + start curb */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            <div style={{ borderRight: `2px dashed rgba(255,255,255,0.15)`, background: 'rgba(255,255,255,0.02)' }} />
            {Array.from({ length: laneCount }).map((_, i) => (
              <div key={i} style={{ borderRight: i < laneCount - 1 ? `1px dashed ${C.divider}` : undefined }} />
            ))}
          </div>

          {/* Current-lane highlight strip — makes the clickable area visible */}
          {isActive && !disabled && (
            <div
              className="absolute inset-y-0 pointer-events-none"
              style={{
                left: `${(currentLane + 1) * (100 / cols)}%`,
                width: `${100 / cols}%`,
                background: 'linear-gradient(to bottom, rgba(31,199,106,0.12), transparent 75%)',
              }}
            />
          )}

          {/* Obstacles + ambient traffic */}
          {lanes.map((state, i) => {
            const leftPct  = ((i + 1 + 0.5) / cols) * 100;
            const widthPct = (1 / cols) * 100;
            const showCar    = state === 'pending' || state === 'current' || state === 'safe';
            const isYielding = state === 'current' || state === 'safe';
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: `${leftPct}%`, top: '62%', width: `${widthPct}%`, height: '34px', marginLeft: `-${widthPct / 2}%`, marginTop: '-17px' }}
              >
                {showCar && <AmbientCar laneIndex={i} yielding={isYielding} frozen={isShaking} />}
                {state === 'blocked' && (
                  <>
                    <div className="crash-flash" />
                    <KillerCar laneIndex={i} />
                  </>
                )}
              </div>
            );
          })}

          {/* Multiplier bubbles — keyed by state so transitions (current→safe,
              current→blocked) remount cleanly and replay their pop/spark animation */}
          {lanes.map((state, i) => {
            const leftPct     = ((i + 1 + 0.5) / cols) * 100;
            const crossedMult = crossedLanes.find(c => c.lane === i)?.multiplier;
            const displayMult = crossedMult ?? estimateMultiplier(difficulty, laneCount, i + 1);
            return (
              <div key={`${i}-${state}`} className="absolute" style={{ left: `${leftPct}%`, top: '18px', transform: 'translateX(-50%)' }}>
                <MultiplierBubble state={state} multiplier={displayMult} isFinal={i === laneCount - 1} />
              </div>
            );
          })}

          {/* Chicken — hops between lanes, dust poof on landing, pulses while
              waiting on the server */}
          <div
            className="absolute bottom-2 flex flex-col items-center pointer-events-none z-20"
            style={{ left: `${chickenLeftPct}%`, transform: 'translateX(-50%)', transition: 'left 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {isActive && !disabled && (
              <span className="tap-hint mb-1">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            )}
            <div key={chickenCol} className="relative">
              <div className="dust-poof" />
              <div className={`chicken-hop ${isThinking ? 'chicken-anticipate' : ''}`}>
                <ChickenIcon size={30} />
              </div>
            </div>
          </div>

          {/* Click target for the current lane */}
          {isActive && !disabled && (
            <button
              aria-label={`Cross lane ${currentLane + 1}`}
              onClick={onCross}
              className="absolute inset-y-0 transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1FC76A]"
              style={{ left: `${(currentLane + 1) * (100 / cols)}%`, width: `${100 / cols}%` }}
            />
          )}
        </div>
      </div>
    </>
  );
}