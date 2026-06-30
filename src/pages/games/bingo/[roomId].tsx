/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * pages/games/bingo/[roomId].tsx — Premium Live Casino Game Room
 *
 * Layout (matches reference images):
 *   HEADER  : sticky top bar — logo/room info | jackpot banner | wallet/sound
 *   LEFT    : giant floating ball + draw countdown + recent balls
 *   CENTER  : multi-card deck (scrollable)
 *   RIGHT   : game info panel + win pattern + live feed
 *   BOTTOM  : called numbers (full-width chip board)
 *   MOBILE  : stacked vertically with bottom action bar
 *
 * All hooks, socket events, state management, and game logic preserved.
 * Only layout, styling, animations, and component hierarchy changed.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../../context/AuthContext';
import { BallBoard } from '../../../components/bingo/BallBoard';
import { WinPatternDisplay, PatternBadge } from '../../../components/bingo/WinPatternDisplay';
import { MultiCardDeck } from '../../../components/bingo/MultiCardDeck';
import type { CardState } from '../../../components/bingo/MultiCardDeck';
import { LobbyTimer } from '../../../components/bingo/LobbyTimer';
import { useBingoRoom } from '../../../hooks/useBingoRoom';
import { useMyCards } from '../../../hooks/useMyCards';
import { useAutoMark } from '../../../hooks/useAutoMark';
import { WinPattern } from '@/lib/api/bingoApi';

// ─── Design tokens (Tailwind can't handle arbitrary values easily in some places) ──

const T = {
  bg:      '#08080C',
  surface: '#111827',
  glass:   'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  glow:    'rgba(124,58,237,0.25)',
  primary: '#7C3AED',
  gold:    '#F7B500',
  success: '#00E676',
  danger:  '#EF4444',
} as const;

// ─── BINGO letter helpers ─────────────────────────────────────────────────────

type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

function getLetter(ball: number): BingoLetter {
  if (ball <= 15) return 'B';
  if (ball <= 30) return 'I';
  if (ball <= 45) return 'N';
  if (ball <= 60) return 'G';
  return 'O';
}

const LETTER_COLORS: Record<BingoLetter, { bg: string; glow: string }> = {
  B: { bg: 'linear-gradient(135deg,#3B82F6,#2563EB)', glow: 'rgba(59,130,246,0.55)'  },
  I: { bg: 'linear-gradient(135deg,#F97316,#EA580C)', glow: 'rgba(249,115,22,0.55)'  },
  N: { bg: 'linear-gradient(135deg,#EF4444,#DC2626)', glow: 'rgba(239,68,68,0.55)'   },
  G: { bg: 'linear-gradient(135deg,#22C55E,#16A34A)', glow: 'rgba(34,197,94,0.55)'   },
  O: { bg: 'linear-gradient(135deg,#A855F7,#9333EA)', glow: 'rgba(168,85,247,0.55)'  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icons = {
  Back: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M15 19L8 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Trophy: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8m-4-4v4M7 4H4a1 1 0 00-1 1v3c0 2.5 2 4.5 4 5m10-9h3a1 1 0 011 1v3c0 2.5-2 4.5-4 5M7 4h10v8a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Users: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Cards: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 7V5a2 2 0 012-2h12a2 2 0 012 2v13a2 2 0 01-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Speed: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Sound: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Mute: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Crown: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 18h18v2H3v-2zm0-2l3-8 4.5 4.5L12 4l1.5 8.5L18 8l3 8H3z"/>
    </svg>
  ),
  Lightning: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6V22l8.91-10.96A1 1 0 0019 9.5h-6V2z"/>
    </svg>
  ),
};

// ─── Giant floating ball ──────────────────────────────────────────────────────

function GiantBall({ ball, isWinning = false }: { ball: number | null; isWinning?: boolean }) {
  if (!ball) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-36 h-36 rounded-full border-4 border-dashed flex items-center justify-center text-5xl font-black"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.08)' }}
        >
          ?
        </div>
        <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#374151' }}>
          Waiting for draw…
        </p>
      </div>
    );
  }

  const letter = getLetter(ball);
  const { bg, glow } = LETTER_COLORS[letter];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Outer glow ring */}
      <div
        className="relative"
        style={{
          filter: `drop-shadow(0 0 ${isWinning ? '40px' : '22px'} ${glow})`,
        }}
      >
        {/* Animated ring for winning state */}
        {isWinning && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: glow }}
          />
        )}

        <div
          className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center font-black transition-all duration-500"
          style={{
            background: bg,
            border: isWinning ? '3px solid #F7B500' : '2px solid rgba(255,255,255,0.18)',
            transform: isWinning ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {/* Highlight shine */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.28) 0%, transparent 55%)',
            }}
          />
          <span className="text-xl font-bold text-white opacity-80 leading-none -mb-1">{letter}</span>
          <span className="text-5xl font-black text-white leading-none">{ball}</span>
          {isWinning && (
            <span className="absolute -top-2.5 -right-2.5 text-2xl animate-bounce">⭐</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono">
        <span style={{ color: '#475569' }}>BALL</span>
        <span className="font-black text-white">
          {letter}-{ball}
        </span>
      </div>
    </div>
  );
}

// ─── Draw countdown ring ──────────────────────────────────────────────────────

function DrawCountdown({ socketCountdown }: { socketCountdown: number | null }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (socketCountdown !== null && socketCountdown !== undefined) {
      setSecs(socketCountdown);
    }
  }, [socketCountdown]);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const pct = secs > 0 ? Math.max(0, Math.min(1, secs / 10)) : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const isUrgent = secs <= 3 && secs > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#374151' }}>
        Next draw in
      </span>
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
          <circle
            cx="28" cy="28" r={r} fill="none"
            stroke={isUrgent ? T.danger : T.gold}
            strokeWidth="3"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <span
          className="text-xl font-black font-mono"
          style={{ color: isUrgent ? T.danger : T.gold, fontFamily: "'Rajdhani', sans-serif" }}
        >
          {String(secs).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

// ─── Recent balls strip ───────────────────────────────────────────────────────

function RecentBalls({ balls }: { balls: number[] }) {
  const recent = [...balls].reverse().slice(0, 5);
  if (recent.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#374151' }}>
        Recent balls
      </span>
      <div className="flex gap-2">
        {recent.map((ball, i) => {
          const letter = getLetter(ball);
          const { bg, glow } = LETTER_COLORS[letter];
          return (
            <div
              key={`${ball}-${i}`}
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center font-black text-[9px] text-white flex-shrink-0 transition-all"
              style={{
                background: bg,
                boxShadow: i === 0 ? `0 0 14px ${glow}` : 'none',
                opacity: 1 - i * 0.15,
                transform: `scale(${1 - i * 0.06})`,
              }}
            >
              <span className="leading-none opacity-70">{letter}</span>
              <span className="text-xs leading-none">{ball}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Left panel: current ball section ────────────────────────────────────────

function CurrentBallPanel({
  drawnBalls,
  winningBall,
  gameStartCountdown,
  status,
  lobbyInitialSecs,
  gameId,
}: {
  drawnBalls: number[];
  winningBall: number | null;
  gameStartCountdown: number | null;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled' | null;
  lobbyInitialSecs: number;
  gameId: string;
}) {
  const currentBall = drawnBalls.length > 0 ? drawnBalls[drawnBalls.length - 1] : null;
  const isWinBall = winningBall != null && currentBall === winningBall;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center gap-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Live badge */}
      <div className="w-full flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
          style={{
            background: status === 'playing' ? 'rgba(0,230,118,0.1)' : 'rgba(247,181,0,0.1)',
            border: `1px solid ${status === 'playing' ? 'rgba(0,230,118,0.3)' : 'rgba(247,181,0,0.3)'}`,
            color: status === 'playing' ? T.success : T.gold,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: status === 'playing' ? T.success : T.gold }}
          />
          {status === 'playing' ? '● LIVE' : status === 'waiting' ? 'WAITING' : 'ENDED'}
        </div>
        <span className="text-[9px] font-mono" style={{ color: '#374151' }}>
          {drawnBalls.length}/75
        </span>
      </div>

      {/* Giant ball */}
      <GiantBall ball={currentBall} isWinning={isWinBall} />

      {/* Countdown or lobby timer */}
      {status === 'playing' ? (
        <DrawCountdown socketCountdown={gameStartCountdown} />
      ) : status === 'waiting' ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#374151' }}>
            Game starts in
          </span>
          <LobbyTimer
            initialSeconds={lobbyInitialSecs}
            socketCountdown={gameStartCountdown}
            status={status}
          />
        </div>
      ) : null}

      {/* Recent balls */}
      <RecentBalls balls={drawnBalls} />

      {/* Game ID footer */}
      <div className="w-full pt-2 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span className="text-[9px] font-mono" style={{ color: '#1F2937' }}>
          Game ID: {gameId}
        </span>
      </div>
    </div>
  );
}

// ─── Right panel: game info ───────────────────────────────────────────────────

function GameInfoPanel({
  jackpotPool,
  playerCount,
  cardsSold,
  drawSpeed,
  activePattern,
  status,
}: {
  jackpotPool: number;
  playerCount: number;
  cardsSold?: number;
  drawSpeed?: string;
  activePattern: WinPattern | null;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled' | null;
}) {
  return (
    <div className="space-y-3">
      {/* Game info card */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: '#64748B', fontFamily: "'Rajdhani', sans-serif" }}
        >
          Game Info
        </span>

        {[
          { icon: <Icons.Trophy />, label: 'Jackpot',       value: `${jackpotPool.toLocaleString()} ETB`, color: T.gold    },
          { icon: <Icons.Users />, label: 'Players',        value: String(playerCount),                  color: '#C084FC'  },
          { icon: <Icons.Cards />, label: 'Cards in Play',  value: cardsSold ? String(cardsSold) : '—',  color: '#94A3B8'  },
          { icon: <Icons.Speed />, label: 'Draw Speed',     value: drawSpeed ?? '2.5s',                  color: '#94A3B8'  },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ color: '#475569' }}>
              {icon}
              <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-sm font-black" style={{ color, fontFamily: "'Rajdhani', sans-serif" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Win pattern */}
      {activePattern && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: '#64748B', fontFamily: "'Rajdhani', sans-serif" }}
          >
            Win Pattern
          </span>
          <WinPatternDisplay pattern={activePattern} gameActive={status === 'playing'} />
        </div>
      )}
    </div>
  );
}

// ─── Activity item ────────────────────────────────────────────────────────────

interface ActivityItem {
  id: number;
  text: string;
  icon: string;
  time: string;
  highlight?: boolean;
}

// ─── Live feed ────────────────────────────────────────────────────────────────

function LiveFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: '#64748B', fontFamily: "'Rajdhani', sans-serif" }}
        >
          Live Feed
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>

      <div className="space-y-1.5 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {items.length === 0 ? (
          <p className="text-[11px] text-center py-4" style={{ color: '#1F2937' }}>
            Waiting for game events…
          </p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 p-2 rounded-xl transition-colors"
              style={{ background: item.highlight ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.02)' }}
            >
              <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[11px] font-medium leading-snug"
                  style={{ color: item.highlight ? T.success : '#94A3B8' }}
                >
                  {item.text}
                </p>
                <p className="text-[9px] font-mono mt-0.5" style={{ color: '#374151' }}>{item.time}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <button
          className="w-full py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#475569',
          }}
        >
          View All Feed →
        </button>
      )}
    </div>
  );
}

// ─── Winner overlay ───────────────────────────────────────────────────────────

function WinnerOverlay({
  isMe,
  winnerName,
  amount,
  pattern,
}: {
  isMe: boolean;
  winnerName: string;
  amount: number;
  pattern: WinPattern | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: isMe
          ? 'radial-gradient(ellipse at center, rgba(247,181,0,0.18) 0%, rgba(8,8,12,0.97) 100%)'
          : 'rgba(8,8,12,0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="text-center px-6 max-w-md w-full">
        <div className="text-8xl mb-4 animate-bounce">{isMe ? '🏆' : '🎉'}</div>
        <h2
          className="text-5xl font-black mb-3 tracking-wider"
          style={{ fontFamily: "'Rajdhani', sans-serif", color: isMe ? T.gold : '#fff' }}
        >
          {isMe ? 'YOU WON!' : 'GAME OVER'}
        </h2>
        {isMe ? (
          <>
            <p className="text-4xl font-black text-white mb-2">
              +{amount.toLocaleString()}{' '}
              <span style={{ color: T.gold }}>ETB</span>
            </p>
            {pattern && (
              <div className="flex justify-center mt-2">
                <PatternBadge pattern={pattern} active />
              </div>
            )}
          </>
        ) : (
          <p className="text-xl text-gray-300 font-medium">{winnerName} won this round</p>
        )}
        <p
          className="text-xs mt-6 animate-pulse font-mono"
          style={{ color: '#374151' }}
        >
          Redirecting to results…
        </p>
      </div>
    </div>
  );
}

// ─── Top header ───────────────────────────────────────────────────────────────

function TopHeader({
  roomId,
  jackpotPool,
  status,
  muted,
  onToggleMute,
  onBack,
}: {
  roomId: string;
  jackpotPool: number;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled' | null;
  muted: boolean;
  onToggleMute: () => void;
  onBack: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 border-b"
      style={{
        background: 'rgba(8,8,12,0.97)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Left: back + room info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-white"
          style={{ color: '#64748B' }}
        >
          <Icons.Back />
          <span className="hidden sm:inline">Lobby</span>
        </button>

        <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff' }}
          >
            B
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              BINGO LIVE
            </span>
            <span className="text-[9px] font-mono" style={{ color: '#374151' }}>
              Room #{roomId.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Center: jackpot banner */}
      <div className="flex flex-col items-center">
        <div
          className="flex flex-col items-center px-5 py-1 rounded-xl"
          style={{
            background: 'rgba(247,181,0,0.07)',
            border: '1px solid rgba(247,181,0,0.2)',
          }}
        >
          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(247,181,0,0.6)' }}>
            Jackpot
          </span>
          <span
            className="text-xl font-black leading-none"
            style={{ color: T.gold, fontFamily: "'Rajdhani', sans-serif" }}
          >
            {jackpotPool.toLocaleString()} <span className="text-sm font-bold opacity-70">ETB</span>
          </span>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
          style={{
            background: status === 'playing' ? 'rgba(0,230,118,0.1)' : 'rgba(247,181,0,0.08)',
            border: `1px solid ${status === 'playing' ? 'rgba(0,230,118,0.25)' : 'rgba(247,181,0,0.2)'}`,
            color: status === 'playing' ? T.success : T.gold,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: status === 'playing' ? T.success : T.gold }}
          />
          {status === 'playing' ? 'LIVE' : status === 'waiting' ? 'WAITING' : 'ENDED'}
        </div>

        <button
          onClick={onToggleMute}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: muted ? '#374151' : '#94A3B8',
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <Icons.Mute /> : <Icons.Sound />}
        </button>
      </div>
    </header>
  );
}

// ─── Bottom action bar (mobile) ───────────────────────────────────────────────

function BottomBar({
  autoMark,
  onToggleAutoMark,
  onBack,
  cardCount,
}: {
  autoMark: boolean;
  onToggleAutoMark: () => void;
  onBack: () => void;
  cardCount: number;
}) {
  return (
    <nav
      className="lg:hidden sticky bottom-0 z-20 flex items-center justify-between gap-2 px-4 py-3 border-t"
      style={{
        background: 'rgba(8,8,12,0.98)',
        borderColor: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <button
        onClick={onBack}
        className="flex flex-col items-center gap-1 text-[10px] font-semibold"
        style={{ color: '#475569' }}
      >
        <Icons.Back />
        Lobby
      </button>

      <button
        className="flex flex-col items-center gap-1 text-[10px] font-semibold relative"
        style={{ color: '#475569' }}
      >
        <Icons.Cards />
        My Cards
        {cardCount > 0 && (
          <span
            className="absolute -top-1 -right-2 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center"
            style={{ background: T.primary, color: '#fff' }}
          >
            {cardCount}
          </span>
        )}
      </button>

      {/* Auto-mark CTA */}
      <button
        onClick={onToggleAutoMark}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95"
        style={{
          background: autoMark
            ? `linear-gradient(135deg, ${T.success}, #00b854)`
            : `linear-gradient(135deg, ${T.gold}, #d97706)`,
          color: autoMark ? '#000' : '#000',
          boxShadow: autoMark
            ? '0 4px 20px rgba(0,230,118,0.3)'
            : '0 4px 20px rgba(247,181,0,0.3)',
        }}
      >
        <Icons.Lightning />
        Auto Mark {autoMark ? 'ON' : 'OFF'}
      </button>

      <button className="flex flex-col items-center gap-1 text-[10px] font-semibold" style={{ color: '#475569' }}>
        <Icons.Trophy />
        Rules
      </button>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BingoRoomPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { roomId } = router.query;
  const roomIdStr = typeof roomId === 'string' ? roomId : '';

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?next=/games/bingo');
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Room data ─────────────────────────────────────────────────────────────
  const {
    room,
    drawnBalls,
    status,
    jackpotPool,
    playerCount,
    stakeAmount,
    gameStartCountdown,
    winner,
    winners,
    activePattern,
    winningBall,
    winnerDisplayName,
    winnerMaskedPhone,
    loading: roomLoading,
    error: roomError,
  } = useBingoRoom(roomIdStr || null);

  // ── Multi-card data ───────────────────────────────────────────────────────
  const {
    cards,
    maxCards,
    loading: cardsLoading,
    // error: cardsError,
    // refetch: refetchCards,
    applyWinData,
  } = useMyCards(roomIdStr || null, drawnBalls);

  // ── Auto-mark toggle ──────────────────────────────────────────────────────
  const { autoMark, toggleAutoMark } = useAutoMark();
  const [manualMarks, setManualMarks] = useState<Record<number, Set<number>>>({});

  const handleCellTap = (cardNumber: number, cellValue: number) => {
    if (autoMark) return;
    if (cellValue === 0) return;
    if (!drawnBalls.includes(cellValue)) return;
    setManualMarks((prev) => {
      const existing = new Set(prev[cardNumber] ?? []);
      existing.has(cellValue) ? existing.delete(cellValue) : existing.add(cellValue);
      return { ...prev, [cardNumber]: existing };
    });
  };

  // ── Winner data sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'finished' && winners.length > 0) {
      for (const w of winners) applyWinData(w.cardNumber, w.matchedIndices);
    }
  }, [status, winners, applyWinData]);

  // ── Mute ─────────────────────────────────────────────────────────────────
  const [muted, setMuted] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('bingo_muted') === '1'
  );
  const toggleMute = () =>
    setMuted((m) => { localStorage.setItem('bingo_muted', m ? '0' : '1'); return !m; });

  // ── Activity feed ─────────────────────────────────────────────────────────
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const counterRef  = useRef<number>(0);
  const prevBallRef = useRef<number>(0);
  const prevPlayRef = useRef<number>(0);

  useEffect(() => {
    if (drawnBalls.length > prevBallRef.current && drawnBalls.length > 0) {
      const ball = drawnBalls[drawnBalls.length - 1];
      const letter = getLetter(ball);
      counterRef.current++;
      setActivityItems((prev) => [
        { id: counterRef.current, text: `Ball ${letter}-${ball} drawn`, icon: '🎱', time: 'Just now', highlight: false },
        ...prev.slice(0, 19),
      ]);
    }
    prevBallRef.current = drawnBalls.length;
  }, [drawnBalls.length]);

  useEffect(() => {
    if (playerCount > prevPlayRef.current && prevPlayRef.current > 0) {
      counterRef.current++;
      setActivityItems((prev) => [
        { id: counterRef.current, text: 'New player joined the room', icon: '👥', time: 'Just now', highlight: true },
        ...prev.slice(0, 19),
      ]);
    }
    prevPlayRef.current = playerCount;
  }, [playerCount]);

  // ── Winner overlay + redirect ─────────────────────────────────────────────
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  useEffect(() => {
    if (status === 'cancelled' || roomError?.toLowerCase().includes('enough players')) {
      setShowCancelBanner(true);
    }
  }, [status, roomError]);

  useEffect(() => {
    if (status !== 'finished' || resultSaved) return;
    if (!winners.length && !winner) return;
    const w = winners[0] ?? winner;
    if (!w) return;

    setShowWinnerOverlay(true);

    const userId = (user as { id?: string; _id?: string })?.id ?? (user as { _id?: string })?._id ?? '';
    const isMyWin = winners.some((v) => v.userId === userId);

    sessionStorage.setItem('bingoResult', JSON.stringify({
      won: isMyWin,
      jackpotPool,
      prizePerCard: w.amountWon,
      winnerName: winnerDisplayName ?? w.displayName ?? 'Winner',
      winnerMaskedPhone: winnerMaskedPhone ?? w.maskedPhone ?? '****',
      winnerCard: cards.find((c) => c.cardNumber === w.cardNumber)?.card ?? [],
      winnerCardNumber: w.cardNumber,
      winnerMatchedIndices: w.matchedIndices,
      myCard: cards[0]?.card ?? [],
      myCardNumber: cards[0]?.cardNumber ?? 0,
      myMatchedCells: cards[0]?.matchedCells ?? [],
      stakeAmount,
      pattern: w.pattern,
    }));

    setResultSaved(true);
    setTimeout(() => router.push('/games/bingo/result'), 2500);
  }, [status, winners, winner, resultSaved, jackpotPool, cards, stakeAmount, winnerDisplayName, winnerMaskedPhone, user, router]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <div className="w-8 h-8 border-2 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  if (roomLoading || cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
          <p className="text-[11px] font-mono uppercase tracking-widest animate-pulse" style={{ color: '#374151' }}>
            Loading room…
          </p>
        </div>
      </div>
    );
  }

  if (showCancelBanner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: T.bg }}>
        <div
          className="max-w-sm w-full text-center p-8 rounded-2xl space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(247,181,0,0.2)' }}
        >
          <span className="text-5xl">😔</span>
          <h2 className="text-xl font-black" style={{ color: T.gold, fontFamily: "'Rajdhani', sans-serif" }}>
            Not Enough Players
          </h2>
          <p className="text-sm" style={{ color: '#64748B' }}>
            The game was cancelled. Your stake has been refunded.
          </p>
          <button
            onClick={() => router.push('/games/bingo')}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${T.primary}, #6D28D9)`, color: '#fff' }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (roomError && !showCancelBanner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: T.bg }}>
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: T.danger }}>{roomError}</p>
          <button
            onClick={() => router.push('/games/bingo')}
            className="px-6 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${T.primary}, #6D28D9)`, color: '#fff' }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const userId         = (user as { id?: string; _id?: string })?.id ?? (user as { _id?: string })?._id ?? '';
  const isMe           = winners.some((w) => w.userId === userId);
  const lobbyInitSecs  = (room as { lobbyTimeRemainingSeconds?: number })?.lobbyTimeRemainingSeconds ?? 0;
  const playerNums     = cards.flatMap((c) => c.card.flat());
  const gameIdDisplay  = roomIdStr ? roomIdStr.slice(-10).toUpperCase() : '—';

  const pageBackground = status === 'finished' && isMe
    ? 'radial-gradient(ellipse at top, rgba(247,181,0,0.06) 0%, #08080C 50%)'
    : 'radial-gradient(ellipse at top, rgba(124,58,237,0.06) 0%, #08080C 50%)';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>Bingo Room — DashBets</title>
        <meta name="description" content="Live Bingo game room with real-time draws and prizes." />
      </Head>

      {showWinnerOverlay && (
        <WinnerOverlay
          isMe={isMe}
          winnerName={winnerDisplayName ?? 'A player'}
          amount={winners[0]?.amountWon ?? 0}
          pattern={winner?.pattern ?? null}
        />
      )}

      <div
        className="min-h-screen text-white flex flex-col"
        style={{ background: pageBackground, fontFamily: "'Exo 2', sans-serif" }}
      >
        {/* ── HEADER ── */}
        <TopHeader
          roomId={roomIdStr}
          jackpotPool={jackpotPool}
          status={status}
          muted={muted}
          onToggleMute={toggleMute}
          onBack={() => router.push('/games/bingo')}
        />

        {/* ── MAIN ── */}
        <main
          className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 py-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {/*
           * Desktop grid: [left 260px] [center 1fr] [right 300px]
           * Tablet: [left 220px] [center 1fr]  — right panel collapses below
           * Mobile: single column
           */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-4">

            {/* ── LEFT: current ball panel ── */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <CurrentBallPanel
                drawnBalls={drawnBalls}
                winningBall={winningBall}
                gameStartCountdown={gameStartCountdown}
                status={status}
                lobbyInitialSecs={lobbyInitSecs}
                gameId={gameIdDisplay}
              />
            </div>

            {/* ── CENTER: cards + ball board ── */}
            <div className="space-y-4 min-w-0">
              {/* Cards section */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-black uppercase tracking-wider"
                      style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      My Cards
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#C084FC', border: '1px solid rgba(124,58,237,0.25)' }}
                    >
                      {cards.length}/{maxCards}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {winners.length > 0 && (
                      <span
                        className="text-[10px] font-black px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(247,181,0,0.15)', color: T.gold, border: '1px solid rgba(247,181,0,0.3)' }}
                      >
                        🏆 {winners.length} Winner{winners.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {/* Desktop auto-mark toggle */}
                    <button
                      onClick={toggleAutoMark}
                      className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
                      style={{
                        background: autoMark
                          ? 'rgba(0,230,118,0.12)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${autoMark ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        color: autoMark ? T.success : '#64748B',
                      }}
                    >
                      <span>{autoMark ? '🤖' : '✋'}</span>
                      Auto Mark
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-black"
                        style={{
                          background: autoMark ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)',
                          color: autoMark ? T.success : '#374151',
                        }}
                      >
                        {autoMark ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>

                <MultiCardDeck
                  cards={cards as CardState[]}
                  drawnBalls={drawnBalls}
                  activePattern={activePattern}
                  winningBall={winningBall}
                  autoMark={autoMark}
                  manualMarks={manualMarks}
                  onCellTap={handleCellTap}
                  winners={winners}
                  status={status}
                />
              </div>

              {/* Called numbers */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <BallBoard drawnBalls={drawnBalls} playerCardNumbers={playerNums} />
              </div>

              {/* Footer info strip */}
              <div
                className="rounded-2xl px-5 py-3 flex flex-wrap items-center justify-center gap-4 text-[10px]"
                style={{
                  background: 'rgba(124,58,237,0.04)',
                  border: '1px solid rgba(124,58,237,0.1)',
                  color: '#374151',
                }}
              >
                <span>🛡 Provably Fair</span>
                <span>🔒 RNG Certified</span>
                <span>💰 Stake Refunded if Cancelled</span>
                <span>⚡ 24/7 Support</span>
                <span className="font-mono">Game #{gameIdDisplay}</span>
              </div>
            </div>

            {/* ── RIGHT: game info + live feed ── */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <GameInfoPanel
                jackpotPool={jackpotPool}
                playerCount={playerCount}
                activePattern={activePattern}
                status={status}
              />
              <LiveFeed items={activityItems} />
            </div>
          </div>
        </main>

        {/* ── MOBILE BOTTOM BAR ── */}
        <BottomBar
          autoMark={autoMark}
          onToggleAutoMark={toggleAutoMark}
          onBack={() => router.push('/games/bingo')}
          cardCount={cards.length}
        />
      </div>
    </>
  );
}