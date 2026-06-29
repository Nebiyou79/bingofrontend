/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/games/bingo.tsx — Premium Bingo Lobby
 * Modern casino-grade UI with card-based layout, glassmorphism, and gold accents.
 * All hooks, APIs, and business logic preserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../context/AuthContext';
import { useBingoLobby } from '../../hooks/useBingoLobby';
import { joinRoom } from '../../lib/api/bingoApi';
import type { RoomSnapshot } from '../../lib/api/bingoApi';
import { GamePageWrapper } from '../../components/games/GamePageWrapper';
import { getGameById } from '../../config/gameConfig';

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Bingo: () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#7C3AED" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="#7C3AED" opacity="0.3" />
      <path d="M12 6L12 18M6 12L18 12" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C9.5 2 7.5 4 7.5 6.5V10C7.5 12.5 9.5 14.5 12 14.5C14.5 14.5 16.5 12.5 16.5 10V6.5C16.5 4 14.5 2 12 2Z" stroke="#F7B500" strokeWidth="2" />
      <path d="M8 14.5C8 17.5 10 19.5 12 19.5C14 19.5 16 17.5 16 14.5" stroke="#F7B500" strokeWidth="2" />
      <path d="M12 19.5V22" stroke="#F7B500" strokeWidth="2" />
      <path d="M10 22H14" stroke="#F7B500" strokeWidth="2" />
    </svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M17 21V19C17 17.8954 16.1046 17 15 17H9C7.89543 17 7 17.8954 7 19V21" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="9" r="4" stroke="#7C3AED" strokeWidth="2" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#00E676" strokeWidth="2" />
      <path d="M12 6V12L16 14" stroke="#00E676" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ totalPool, activeRooms, totalPlayers }: { totalPool: number; activeRooms: number; totalPlayers: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-6">
      {/* Background with gradient and glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #111827 30%, #1e1b4b 70%, #0f172a 100%)',
        }}
      />
      
      {/* Decorative bingo balls */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-600/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/3 blur-2xl" />

      <div className="relative px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Title */}
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              🎱
            </div>
            <div>
              <h1
                className="text-4xl md:text-5xl font-black text-white leading-none"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}
              >
                BINGO
              </h1>
              <p className="text-sm text-gray-400 mt-1">Live Rooms • Real Prizes</p>
            </div>
          </div>

          {/* Right: Total Prize Pool */}
          <div
            className="flex-shrink-0 px-6 py-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(247,181,0,0.1), rgba(247,181,0,0.05))',
              border: '1px solid rgba(247,181,0,0.2)',
              boxShadow: '0 4px 30px rgba(247,181,0,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <Icons.Trophy />
              <div>
                <p className="text-[9px] text-yellow-600 uppercase tracking-widest font-mono">Total Prize Pool</p>
                <p
                  className="text-3xl md:text-4xl font-black"
                  style={{ color: '#F7B500', fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {totalPool.toLocaleString()}
                  <span className="text-xl ml-1 opacity-70">ETB</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex gap-3 mt-6 flex-wrap">
          {[
            { icon: '🟢', label: 'Active Rooms', value: activeRooms, color: '#00E676' },
            { icon: '👥', label: 'Live Players', value: totalPlayers, color: '#7C3AED' },
            { icon: '⭐', label: 'Bonus Rooms', value: '3', color: '#F7B500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-lg">{stat.icon}</span>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{stat.label}</p>
                <p className="text-lg font-black leading-none" style={{ color: stat.color, fontFamily: "'Rajdhani', sans-serif" }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({
  snap,
  onJoin,
  joining,
}: {
  snap: RoomSnapshot;
  onJoin: (stake: number) => void;
  joining: boolean;
}) {
  const { stakeAmount, status, lobbyTimeRemainingSeconds, possibleWin, isBonus, playerCount } = snap;
  const isJoinable = status === 'waiting' || status === 'playing';
  const [hovered, setHovered] = useState(false);

  // Generate random player avatars for visual flair
  const playerAvatars = Array.from({ length: Math.min(playerCount, 5) }, (_, i) => (
    <div
      key={i}
      className="w-6 h-6 rounded-full border-2 border-[#08080c]"
      style={{
        background: `hsl(${(i * 60 + 30) % 360}, 60%, 40%)`,
        marginLeft: i > 0 ? '-6px' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8px',
        fontWeight: 'bold',
        color: '#fff',
      }}
    >
      {String.fromCharCode(65 + i)}
    </div>
  ));

  const remainingPlayers = Math.max(0, 90 - playerCount);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl transition-all duration-300 overflow-hidden"
      style={{
        background: isBonus
          ? 'linear-gradient(135deg, rgba(247,181,0,0.08) 0%, rgba(16,18,26,0.95) 60%)'
          : 'rgba(255,255,255,0.03)',
        border: isBonus
          ? '1px solid rgba(247,181,0,0.3)'
          : hovered
          ? '1px solid rgba(124,58,237,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: hovered
          ? '0 8px 30px rgba(124,58,237,0.15)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Bonus Badge */}
      {isBonus && (
        <div
          className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest z-10"
          style={{
            background: 'linear-gradient(135deg, #F7B500, #d97706)',
            color: '#000',
            boxShadow: '0 2px 12px rgba(247,181,0,0.4)',
          }}
        >
          ⭐ BONUS ROOM
        </div>
      )}

      <div className="p-5">
        {/* Top Row: Stake + Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Stake Circle */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
              style={{
                background: isBonus
                  ? 'linear-gradient(135deg, #F7B500, #d97706)'
                  : 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(79,70,229,0.6))',
                color: isBonus ? '#000' : '#fff',
                boxShadow: isBonus
                  ? '0 4px 20px rgba(247,181,0,0.3)'
                  : '0 4px 20px rgba(124,58,237,0.3)',
              }}
            >
              {stakeAmount}
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Stake</p>
              <p className="text-sm font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {stakeAmount} ETB
              </p>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* Middle: Players + Timer */}
        <div className="flex items-center justify-between mb-4">
          {/* Players */}
          <div className="flex items-center gap-2">
            <div className="flex">{playerAvatars}</div>
            {remainingPlayers > 0 && (
              <span className="text-[10px] text-gray-500 font-mono">+{remainingPlayers}</span>
            )}
            <span className="text-xs font-bold text-gray-300" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {playerCount}/90
            </span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5">
            <Icons.Clock />
            {status === 'waiting' && lobbyTimeRemainingSeconds != null && lobbyTimeRemainingSeconds > 0 ? (
              <RowCountdown initialSeconds={lobbyTimeRemainingSeconds} />
            ) : status === 'waiting' ? (
              <span className="text-xs font-bold" style={{ color: '#F7B500' }}>Waiting…</span>
            ) : status === 'playing' ? (
              <span className="text-xs font-bold" style={{ color: '#FF5252' }}>Live Now</span>
            ) : (
              <span className="text-gray-600 text-xs">—</span>
            )}
          </div>
        </div>

        {/* Bottom: Prize Pool + CTA */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Prize Pool</p>
            <p className="text-lg font-black" style={{ color: '#F7B500', fontFamily: "'Rajdhani', sans-serif" }}>
              {(possibleWin ?? 0).toLocaleString()}
              <span className="text-xs ml-1 opacity-70">ETB</span>
            </p>
          </div>

          <button
            disabled={!isJoinable || joining}
            onClick={() => onJoin(stakeAmount)}
            className={[
              'px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2',
              isJoinable
                ? isBonus
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'bg-gray-800 text-gray-600',
            ].join(' ')}
            style={{
              boxShadow: isJoinable && hovered
                ? isBonus
                  ? '0 4px 20px rgba(247,181,0,0.4)'
                  : '0 4px 20px rgba(124,58,237,0.4)'
                : 'none',
            }}
          >
            {joining ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining…
              </span>
            ) : status === 'playing' ? (
              <>
                Watch
                <Icons.ChevronRight />
              </>
            ) : (
              <>
                Join Now
                <Icons.ChevronRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'waiting') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
        style={{
          background: 'rgba(0,230,118,0.15)',
          border: '1px solid rgba(0,230,118,0.3)',
          color: '#00E676',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Open
      </span>
    );
  }
  if (status === 'playing') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
        style={{
          background: 'rgba(255,82,82,0.15)',
          border: '1px solid rgba(255,82,82,0.3)',
          color: '#FF5252',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#475569',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
      Idle
    </span>
  );
}

// ─── Row Countdown ────────────────────────────────────────────────────────────

function RowCountdown({ initialSeconds }: { initialSeconds: number | null }) {
  const [secs, setSecs] = useState(initialSeconds ?? 0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecs(initialSeconds ?? 0);
    if (ref.current) clearInterval(ref.current);
    if ((initialSeconds ?? 0) <= 0) return;
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(ref.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [initialSeconds]);

  if (!secs || secs <= 0) return <span className="text-gray-500 text-xs font-mono">—</span>;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs <= 30;
  return (
    <span
      className="font-mono text-sm font-black tabular-nums"
      style={{ color: urgent ? '#FF5252' : '#00E676' }}
    >
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const VALID_STAKES = [10, 20, 30, 50, 80, 100, 150, 200, 300];

export default function BingoLobbyPage() {
  const game = getGameById('bingo')!; // matches gameConfig.ts id for Bingo
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?next=/games/bingo');
    }
  }, [authLoading, isAuthenticated, router]);

  const { rooms, loading: lobbyLoading, error: lobbyError } = useBingoLobby();
  const [joiningStake, setJoiningStake] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = async (stake: number) => {
    setJoiningStake(stake);
    setJoinError(null);
    try {
      const res = await joinRoom(stake);
      if (!res.success) {
        setJoinError((res as any).message ?? (res as any).error);
        return;
      }
      if ((res as any).alreadyJoined && res.roomId) {
        router.push(`/games/bingo/${res.roomId}`);
        return;
      }
      router.push(`/games/bingo/select?roomId=${res.roomId}&stake=${stake}`);
    } catch {
      setJoinError('Network error. Please try again.');
    } finally {
      setJoiningStake(null);
    }
  };

  const totalPlayers = Object.values(rooms).reduce((a, r) => a + (r.playerCount || 0), 0);
  const totalPool = Object.values(rooms).reduce((a, r) => a + (r.jackpotPool || 0), 0);
  const activeRooms = Object.values(rooms).filter(
    (r) => r.status === 'waiting' || r.status === 'playing'
  ).length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080C' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-purple-500 border-purple-500/20 animate-spin" />
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <GamePageWrapper game={game}>
      <>
        <Head>
          <title>Bingo Lobby — DashBets</title>
          <meta name="description" content="Join live Bingo rooms, pick your lucky cards, and win real prizes." />
        </Head>

        <div
          className="min-h-full p-4 md:p-6"
          style={{
            background: 'linear-gradient(180deg, #08080C 0%, #0f172a 50%, #08080C 100%)',
            fontFamily: "'Exo 2', sans-serif",
          }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <HeroSection totalPool={totalPool} activeRooms={activeRooms} totalPlayers={totalPlayers} />

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lobbyLoading
                ? VALID_STAKES.slice(0, 6).map((s) => (
                    <div
                      key={s}
                      className="h-56 rounded-2xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                    />
                  ))
                : VALID_STAKES.map((stake) => {
                    const snap: RoomSnapshot = rooms[stake] ?? {
                      stakeAmount: stake,
                      status: 'idle',
                      playerCount: 0,
                      jackpotPool: 0,
                      possibleWin: 0,
                      roomId: null,
                      activePattern: null,
                      lobbyTimeRemainingSeconds: null,
                      isBonus: false,
                    };
                    return (
                      <RoomCard
                        key={stake}
                        snap={snap}
                        onJoin={handleJoin}
                        joining={joiningStake === stake}
                      />
                    );
                  })}
            </div>

            {/* Errors */}
            {(lobbyError || joinError) && (
              <div
                className="mt-4 rounded-xl px-4 py-3 border text-sm"
                style={{
                  background: 'rgba(255,82,82,0.08)',
                  borderColor: 'rgba(255,82,82,0.2)',
                  color: '#FF5252',
                }}
              >
                ⚠️ {lobbyError ?? joinError}
              </div>
            )}

            {/* Info Banner */}
            <div
              className="mt-6 rounded-2xl px-5 py-4 border text-sm text-center"
              style={{
                background: 'rgba(124,58,237,0.06)',
                borderColor: 'rgba(124,58,237,0.12)',
                color: '#7C3AED',
              }}
            >
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <span>🎲 Fair Play • Provably Fair Games</span>
                <span>🔒 RNG Certified • iTech Labs</span>
                <span>💰 Stake Refunded if Lobby Doesn`t Fill</span>
                <span>⚡ 24/7 Support Available</span>
              </div>
            </div>
          </div>
        </div>
      </>
    </GamePageWrapper>
  );
}