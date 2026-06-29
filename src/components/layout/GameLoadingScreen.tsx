// components/loading/GameLoadingScreen.tsx
/**
 * Bane Games — Shared Loading Screen
 *
 * Usage:
 *   <GameLoadingScreen game="hilo" />
 *   <GameLoadingScreen game="rps" />
 *
 * Images expected at:
 *   /images/games/loading1.png  → used for Hi-Lo
 *   /images/games/loading2.png  → used for Rock Paper Scissors
 */

import React, { useEffect, useState, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type GameType = 'hilo' | 'rps';

interface GameLoadingScreenProps {
  game: GameType;
  /** Called when the artificial minimum display time has passed and content is ready */
  onReady?: () => void;
  /** Override the minimum ms before onReady fires (default: 2200) */
  minDisplayMs?: number;
}

// ─── Per-game config ───────────────────────────────────────────────────────────
const GAME_CONFIG: Record<GameType, {
  image: string;
  title: string;
  subtitle: string;
  accent: string;
  accentDim: string;
  tips: string[];
}> = {
  hilo: {
    image: '/images/games/loading1.png',
    title: 'Hi-Lo',
    subtitle: 'Predict the next card',
    accent: '#c0392b',       // crimson
    accentDim: 'rgba(192,57,43,0.18)',
    tips: [
      'Each correct guess multiplies your stake.',
      'Cash out any time — the next card might go against you.',
      'Equal-card bets pay 12× — worth the risk.',
      'King or Ace? Go with the odds: Higher or Lower gives 96% probability.',
    ],
  },
  rps: {
    image: '/images/games/loading2.png',
    title: 'Rock Paper Scissors',
    subtitle: 'Chain wins up to 102×',
    accent: '#8b5cf6',       // violet
    accentDim: 'rgba(139,92,246,0.18)',
    tips: [
      'Chain mode: keep winning to stack your multiplier.',
      'The house choice is locked before you pick — provably fair.',
      'Cash out between rounds to lock in your profit.',
      'Win streak of 6 pushes your payout past 30×.',
    ],
  },
};

// ─── Animated loading bar ──────────────────────────────────────────────────────
function LoadingBar({ accent, progress }: { accent: string; progress: number }) {
  return (
    <div style={{
      width: '100%',
      height: 3,
      background: 'rgba(255,255,255,0.07)',
      borderRadius: 99,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
        borderRadius: 99,
        transition: 'width 0.18s ease-out',
        boxShadow: `0 0 10px ${accent}88`,
      }} />
    </div>
  );
}

// ─── Pulsing logo mark ─────────────────────────────────────────────────────────
function BaneLogo({ accent }: { accent: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* B glyph */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill={accent} fillOpacity="0.15" />
        <rect x="0.5" y="0.5" width="27" height="27" rx="6.5" stroke={accent} strokeOpacity="0.4" />
        <text x="14" y="20" textAnchor="middle" fill={accent}
          style={{ fontSize: 17, fontWeight: 900, fontFamily: "'Rajdhani', 'Inter', sans-serif" }}>B</text>
      </svg>
      <span style={{
        fontFamily: "'Rajdhani', 'Inter', sans-serif",
        fontWeight: 800,
        fontSize: 18,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.90)',
        textTransform: 'uppercase',
      }}>
        Bane Games
      </span>
    </div>
  );
}

// ─── Rotating tip ──────────────────────────────────────────────────────────────
function RotatingTip({ tips, accent }: { tips: string[]; accent: string }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % tips.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(cycle);
  }, [tips.length]);

  return (
    <p style={{
      fontSize: 12,
      color: 'rgba(255,255,255,0.38)',
      fontFamily: "'Rajdhani', 'Inter', sans-serif",
      letterSpacing: '0.03em',
      textAlign: 'center',
      minHeight: 36,
      maxWidth: 300,
      margin: '0 auto',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.35s ease',
      lineHeight: 1.55,
    }}>
      <span style={{ color: accent, marginRight: 5, fontWeight: 700 }}>TIP</span>
      {tips[idx]}
    </p>
  );
}

// ─── Floating card suits (decorative, hilo only) ───────────────────────────────
function FloatingSuits({ accent }: { accent: string }) {
  const suits = ['♠', '♥', '♦', '♣'];
  return (
    <>
      {suits.map((s, i) => (
        <div key={s} style={{
          position: 'absolute',
          fontSize: 22,
          color: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : `${accent}18`,
          top: `${[15, 70, 25, 80][i]}%`,
          left: `${[8, 85, 75, 12][i]}%`,
          animation: `floatSuit${i} ${[5.5, 6.2, 4.8, 7][i]}s ease-in-out infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {s}
        </div>
      ))}
      <style>{`
        @keyframes floatSuit0 { 0%,100%{transform:translateY(0) rotate(-8deg)} 50%{transform:translateY(-14px) rotate(4deg)} }
        @keyframes floatSuit1 { 0%,100%{transform:translateY(0) rotate(12deg)} 50%{transform:translateY(-10px) rotate(-3deg)} }
        @keyframes floatSuit2 { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-18px) rotate(8deg)} }
        @keyframes floatSuit3 { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-12px) rotate(-10deg)} }
        @keyframes pulseGlow  { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spinRing   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

// ─── RPS hand icons (decorative, rps only) ────────────────────────────────────
function FloatingHands({ accent }: { accent: string }) {
  const hands = ['✊', '✋', '✌️'];
  return (
    <>
      {hands.map((h, i) => (
        <div key={h} style={{
          position: 'absolute',
          fontSize: 28,
          top: `${[20, 65, 40][i]}%`,
          left: `${[7, 82, 80][i]}%`,
          opacity: 0.06,
          animation: `floatSuit${i} ${[6, 5, 7][i]}s ease-in-out infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: `drop-shadow(0 0 8px ${accent})`,
        }}>
          {h}
        </div>
      ))}
    </>
  );
}

// ─── Spinner ring ──────────────────────────────────────────────────────────────
function SpinnerRing({ accent }: { accent: string }) {
  return (
    <div style={{ position: 'relative', width: 44, height: 44 }}>
      {/* Track */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.07)',
      }} />
      {/* Active arc */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: `2px solid transparent`,
        borderTopColor: accent,
        borderRightColor: `${accent}55`,
        animation: 'spinRing 0.85s linear infinite',
      }} />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function GameLoadingScreen({
  game,
  onReady,
  minDisplayMs = 2200,
}: GameLoadingScreenProps) {
  const cfg = GAME_CONFIG[game];
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const startRef = useRef(Date.now());

  // Simulate a smooth progress bar that completes around minDisplayMs
  useEffect(() => {
    let raf: number;
    const duration = minDisplayMs * 0.9;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const raw = elapsed / duration;
      // Ease-out curve that slows near 100%
      const eased = Math.min(1 - Math.pow(1 - raw, 2.5), 0.97);
      setProgress(Math.round(eased * 100));
      if (raw < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [minDisplayMs]);

  // When both image and time are done, fire onReady
  useEffect(() => {
    if (!imageLoaded) return;
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, minDisplayMs - elapsed);
    const t = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onReady?.(), 400);
      }, 200);
    }, remaining);
    return () => clearTimeout(t);
  }, [imageLoaded, minDisplayMs, onReady]);

  return (
    <div
      role="status"
      aria-label={`Loading ${cfg.title}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #06090f 0%, #080c18 55%, #06090f 100%)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s ease',
        overflow: 'hidden',
      }}
    >
      {/* Ambient radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${cfg.accentDim}, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Decorative floating elements */}
      {game === 'hilo'
        ? <FloatingSuits accent={cfg.accent} />
        : <FloatingHands accent={cfg.accent} />
      }

      {/* Content column */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        width: '100%',
        maxWidth: 380,
        padding: '0 32px',
        animation: 'fadeUp 0.5s ease both',
      }}>

        {/* Brand */}
        <BaneLogo accent={cfg.accent} />

        {/* Game image — the main visual */}
        <div style={{
          position: 'relative',
          width: 210,
          height: 210,
          flexShrink: 0,
        }}>
          {/* Ring spinner behind image */}
          <div style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: `1px solid ${cfg.accent}22`,
            animation: 'spinRing 8s linear infinite',
          }} />
          <div style={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            border: `1px dashed ${cfg.accent}14`,
            animation: 'spinRing 14s linear infinite reverse',
          }} />

          {/* Image container */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${cfg.accent}30`,
            boxShadow: `0 0 40px ${cfg.accent}30, 0 0 80px ${cfg.accent}12`,
            background: 'rgba(255,255,255,0.03)',
          }}>
            <img
              src={cfg.image}
              alt={cfg.title}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // don't block on broken img
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
          </div>

          {/* Shimmer overlay while loading */}
          {!imageLoaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `linear-gradient(90deg, transparent 0%, ${cfg.accent}18 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s linear infinite',
            }} />
          )}
        </div>

        {/* Game title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontFamily: "'Rajdhani', 'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 28,
            color: '#fff',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            {cfg.title}
          </h1>
          <p style={{
            margin: '6px 0 0',
            fontFamily: "'Rajdhani', 'Inter', sans-serif",
            fontSize: 12,
            color: 'rgba(255,255,255,0.30)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            {cfg.subtitle}
          </p>
        </div>

        {/* Progress bar + spinner row */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <SpinnerRing accent={cfg.accent} />
            <div style={{ flex: 1 }}>
              <LoadingBar accent={cfg.accent} progress={progress} />
            </div>
            <span style={{
              fontFamily: "'Rajdhani', 'Inter', monospace",
              fontSize: 11,
              color: 'rgba(255,255,255,0.20)',
              fontWeight: 700,
              minWidth: 30,
              textAlign: 'right',
            }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Rotating tips */}
        <RotatingTip tips={cfg.tips} accent={cfg.accent} />

      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes floatSuit0 { 0%,100%{transform:translateY(0) rotate(-8deg)} 50%{transform:translateY(-14px) rotate(4deg)} }
        @keyframes floatSuit1 { 0%,100%{transform:translateY(0) rotate(12deg)} 50%{transform:translateY(-10px) rotate(-3deg)} }
        @keyframes floatSuit2 { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-18px) rotate(8deg)} }
        @keyframes floatSuit3 { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-12px) rotate(-10deg)} }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spinRing   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @media (prefers-reduced-motion: reduce) {
          *[style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default GameLoadingScreen;

