// components/multihot/LoadingScreen.tsx
'use client';

import React, { useEffect, useState } from 'react';

const SLOT_IMAGES = [
  '/images/slots/cherry.png',
  '/images/slots/lemon.png',
  '/images/slots/orange.png',
  '/images/slots/plum.png',
  '/images/slots/grapes.png',
  '/images/slots/watermelon.png',
  '/images/slots/bell.png',
  '/images/slots/dollar.png',
  '/images/slots/seven.png',
  '/images/slots/wild.png',
];

function useAssetPreloader(urls: string[], onReady: () => void) {
  useEffect(() => {
    let loaded = 0;
    const total = urls.length;
    if (total === 0) { onReady(); return; }
    urls.forEach(src => {
      const img = new Image();
      img.onload  = img.onerror = () => {
        loaded += 1;
        if (loaded >= total) onReady();
      };
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const [assetsReady, setAssetsReady] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [leaving,     setLeaving]     = useState(false);

  useAssetPreloader(SLOT_IMAGES, () => setAssetsReady(true));

  // Progress bar — fills over ~2.4 s, waits for assets before completing
  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(p + Math.random() * 3.5 + 1, assetsReady ? 100 : 92);
      setProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          setLeaving(true);
          setTimeout(onComplete, 550);
        }, 300);
      }
    }, 40);
    return () => clearInterval(iv);
  }, [assetsReady, onComplete]);

  const LETTERS = 'MULTI HOT'.split('');
  const HOT_NUM = '5';

  return (
    <div
      aria-label="Loading game"
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     9999,
        background: '#0b0e17',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.55s ease',
        opacity:    leaving ? 0 : 1,
        pointerEvents: leaving ? 'none' : 'all',
      }}
    >
      <style>{`
        @keyframes mh-letter-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mh-line-in {
          from { width: 0; opacity: 0; }
          to   { width: 160px; opacity: 1; }
        }
        @keyframes mh-tag-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes mh-glow-pulse {
          0%,100% { opacity: 0.45; }
          50%     { opacity: 0.75; }
        }
        @keyframes mh-num-in {
          from { opacity: 0; transform: scale(0.6) translateY(10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>

      {/* Ambient radial glow */}
      <div style={{
        position: 'absolute',
        width: 480, height: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        animation: 'mh-glow-pulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Gold top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3,
        background: 'linear-gradient(90deg, transparent 0%, #5a3d00 8%, #c8910a 28%, #ffd700 40%, #ffe566 50%, #ffd700 60%, #c8910a 72%, #5a3d00 92%, transparent 100%)',
      }} />

      {/* SmartSoft-style "S" monogram */}
      <div style={{
        width: 64, height: 64, borderRadius: 16, marginBottom: 20,
        background: 'linear-gradient(135deg, #c8910a 0%, #ffd700 50%, #c8910a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 32px rgba(212,175,55,0.35)',
        animation: 'mh-num-in 0.5s ease both',
        animationDelay: '0.05s',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '2rem', fontWeight: 900,
          color: '#0b0e17', letterSpacing: '-0.02em',
        }}>S</span>
      </div>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 10 }}>
        {LETTERS.map((char, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize:   char === ' ' ? '0' : '2.6rem',
              fontWeight: 900,
              color:      '#e8ecf4',
              letterSpacing: '0.03em',
              animation:  'mh-letter-in 0.45s ease both',
              animationDelay: `${0.15 + i * 0.055}s`,
              width:      char === ' ' ? 14 : 'auto',
              display:    'inline-block',
              lineHeight: 1,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
        {/* The "5" in hot pink/red — matches the game title style */}
        <span style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '2.6rem', fontWeight: 900,
          color: '#ef4444',
          marginLeft: 6,
          textShadow: '0 0 20px rgba(239,68,68,0.7)',
          animation: 'mh-num-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
          animationDelay: `${0.15 + LETTERS.length * 0.055 + 0.05}s`,
          display: 'inline-block',
          lineHeight: 1,
        }}>{HOT_NUM}</span>
      </div>

      {/* Accent underline */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, #5a3d00, #ffd700, #5a3d00)',
        borderRadius: 1,
        boxShadow: '0 0 10px rgba(212,175,55,0.6)',
        animation: 'mh-line-in 0.5s ease 0.75s both',
        marginBottom: 16,
        transformOrigin: 'left center',
        width: 160,
      }} />

      {/* Tagline */}
      <p style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize:   10,
        color:      'rgba(255,255,255,0.28)',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        animation:  'mh-tag-in 0.4s ease 1.1s both',
        margin:     0,
        marginBottom: 56,
      }}>
        Bane Wild Edition · DashBets
      </p>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3,
        background: 'rgba(255,255,255,0.05)',
      }}>
        <div style={{
          height: '100%',
          width:  `${progress}%`,
          background: 'linear-gradient(90deg, #c8910a, #ffd700, #ffe566)',
          boxShadow:  '0 0 14px rgba(212,175,55,0.7)',
          transition: 'width 0.1s linear',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Progress label */}
      <div style={{
        position: 'absolute', bottom: 12,
        fontFamily: "'Exo 2', sans-serif",
        fontSize: 10, color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.12em',
      }}>
        {progress < 100 ? `Loading… ${progress}%` : 'Ready'}
      </div>
    </div>
  );
}