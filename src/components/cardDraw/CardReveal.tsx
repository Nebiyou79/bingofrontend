// components/cardDraw/CardReveal.tsx
/**
 * Bane Games — Card Reveal Animation
 *
 * Upgrades per UI guide:
 * - Larger card (w-56 h-80 desktop, w-44 h-64 mobile)
 * - Ambient glow behind card matching suit color
 * - Proper 4-corner card layout
 * - Smoother flip with scale overshoot
 * - Richer idle state with fan of cards
 */

import React, { useEffect, useState } from 'react';
import type { DrawnCard } from '../../lib/api/cardDrawApi';

interface CardRevealProps {
  card: DrawnCard | null;
  isRevealing: boolean;
}

const suitMap: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export function CardReveal({ card, isRevealing }: CardRevealProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isRevealing) {
      setAnimate(false);
      const t = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(t);
    }
    if (!card) setAnimate(false);
  }, [isRevealing, card]);

  /* ── Idle state ── */
  if (!card && !isRevealing) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 p-8">
        {/* Fan of decorative cards */}
        <div style={{ position: 'relative', width: 180, height: 200 }}>
          {[
            { rot: -18, x: -48, y: 12, bg: 'linear-gradient(135deg,#1e3a5f,#0d1b2a)', borderColor: 'rgba(255,255,255,0.10)' },
            { rot: -7,  x: -18, y: 4,  bg: 'linear-gradient(135deg,#1a2744,#0a1328)', borderColor: 'rgba(255,255,255,0.12)' },
            { rot:  4,  x:  14, y: 0,  bg: 'linear-gradient(135deg,#16213e,#0d1b2a)', borderColor: 'rgba(108,60,225,0.25)' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                width: 100,
                height: 140,
                borderRadius: 10,
                background: s.bg,
                border: `1.5px solid ${s.borderColor}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                transform: `translateX(calc(-50% + ${s.x}px)) translateY(${s.y}px) rotate(${s.rot}deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{
                width: '78%', height: '78%', borderRadius: 6,
                background: 'repeating-linear-gradient(45deg, rgba(108,60,225,0.06) 0px, rgba(108,60,225,0.06) 3px, transparent 3px, transparent 9px)',
                border: '1px solid rgba(108,60,225,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 900, fontSize: 11, color: 'rgba(255,255,255,0.08)', letterSpacing: 3 }}>BG</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #3F4A5C)', marginTop: 8, letterSpacing: '0.04em' }}>
          Place your bets and draw a card
        </p>
      </div>
    );
  }

  /* ── Revealing / loading state ── */
  if (isRevealing && !card) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 p-8">
        <style>{`
          @keyframes card-spin {
            0%   { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
        `}</style>
        <div style={{
          width: 168, height: 232,
          borderRadius: 14,
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          border: '2px solid rgba(108,60,225,0.35)',
          boxShadow: '0 0 40px rgba(108,60,225,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'card-spin 0.9s cubic-bezier(0.4,0,0.2,1) infinite',
        }}>
          <span style={{ fontSize: 52 }}>🃏</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--brand-light, #9B6EFF)', fontWeight: 700, letterSpacing: '0.08em', animation: 'pulse 1s ease-in-out infinite' }}>
          REVEALING CARD…
        </p>
      </div>
    );
  }

  if (!card) return null;

  /* ── Revealed card ── */
  const isRed      = card.color === 'red';
  const suitSymbol = suitMap[card.suit] || card.suit;
  const textColor  = isRed ? '#F87171' : '#94A3B8';
  const glowColor  = isRed ? 'rgba(239,68,68,0.50)' : 'rgba(99,120,180,0.45)';
  const borderClr  = isRed ? 'rgba(248,113,113,0.35)' : 'rgba(148,163,184,0.25)';

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      <style>{`
        @keyframes card-flip-reveal {
          0%   { transform: rotateY(90deg) scale(0.85); opacity: 0; }
          55%  { transform: rotateY(-8deg) scale(1.06); opacity: 1; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        .card-flip-in {
          animation: card-flip-reveal 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        {/* Ambient glow blob behind card */}
        <div style={{
          position: 'absolute',
          width: 200, height: 200,
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(64px)',
          opacity: 0.55,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* The card itself */}
        <div
          className={animate ? 'card-flip-in' : ''}
          style={{
            position: 'relative',
            zIndex: 1,
            /* Desktop: w-56 h-80 → 224×320. Mobile via inline responsive approx */
            width: 'clamp(176px, 20vw, 224px)',
            height: 'clamp(248px, 28vw, 320px)',
            borderRadius: 16,
            background: 'linear-gradient(160deg,#f8fafc 0%,#e2e8f0 100%)',
            border: `2px solid ${borderClr}`,
            boxShadow: `0 0 40px ${glowColor}, 0 12px 48px rgba(0,0,0,0.7)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            opacity: animate ? 1 : 0,
          }}
        >
          {/* Top-left corner */}
          <div style={{ position: 'absolute', top: 10, left: 12, lineHeight: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Rajdhani', sans-serif", color: textColor }}>{card.rank}</div>
            <div style={{ fontSize: 14, color: textColor, marginTop: -2 }}>{suitSymbol}</div>
          </div>

          {/* Top-right corner */}
          <div style={{ position: 'absolute', top: 10, right: 12, lineHeight: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Rajdhani', sans-serif", color: textColor }}>{card.rank}</div>
            <div style={{ fontSize: 14, color: textColor, marginTop: -2 }}>{suitSymbol}</div>
          </div>

          {/* Centre suit */}
          <div style={{
            fontSize: 'clamp(64px,9vw,88px)',
            lineHeight: 1,
            color: textColor,
            filter: `drop-shadow(0 0 18px ${glowColor})`,
          }}>
            {suitSymbol}
          </div>

          {/* Bottom-left corner (inverted) */}
          <div style={{ position: 'absolute', bottom: 10, left: 12, lineHeight: 1, transform: 'rotate(180deg)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Rajdhani', sans-serif", color: textColor }}>{card.rank}</div>
            <div style={{ fontSize: 14, color: textColor, marginTop: -2 }}>{suitSymbol}</div>
          </div>

          {/* Bottom-right corner (inverted) */}
          <div style={{ position: 'absolute', bottom: 10, right: 12, lineHeight: 1, transform: 'rotate(180deg)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Rajdhani', sans-serif", color: textColor }}>{card.rank}</div>
            <div style={{ fontSize: 14, color: textColor, marginTop: -2 }}>{suitSymbol}</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary,#8892A4)' }}>
          <span style={{ fontWeight: 700, color: textColor }}>{card.rank} of {card.suit.charAt(0).toUpperCase() + card.suit.slice(1)}</span>
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted,#3F4A5C)', textTransform: 'capitalize', letterSpacing: '0.06em' }}>
          {card.color} card
        </p>
      </div>
    </div>
  );
}