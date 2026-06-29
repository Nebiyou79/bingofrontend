/**
 * pages/games/bingo/select.tsx — Premium Card Selection
 * Modern 3-column layout with glassmorphism, live preview, and multi-card support.
 * All hooks/socket/API logic preserved.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../../context/AuthContext';
import { CardNumberGrid } from '../../../components/bingo/CardNumberGrid';
import { BingoCard } from '../../../components/bingo/BingoCard';
import { useCardSelector } from '../../../hooks/useCardSelector';
import { getRoomById } from '../../../lib/api/bingoApi';
import { createBingoSocket, joinBingoRoom, leaveBingoRoom } from '../../../lib/socket/bingoSocket';
import type { Socket } from 'socket.io-client';

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  ChevronLeft: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Users: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M17 21V19C17 17.8954 16.1046 17 15 17H9C7.89543 17 7 17.8954 7 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Sparkle: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ 
  roomId, 
  stakeAmount, 
  playerCount, 
  minPlayers, 
  countdownSeconds,
  roomLoading 
}: { 
  roomId: string;
  stakeAmount: number;
  playerCount: number;
  minPlayers: number;
  countdownSeconds: number;
  roomLoading: boolean;
}) {
  const m = Math.floor(Math.max(0, countdownSeconds) / 60);
  const s = Math.floor(Math.max(0, countdownSeconds) % 60);
  const urgent = countdownSeconds > 0 && countdownSeconds <= 30;
  const isReady = playerCount >= minPlayers;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6">
      {/* Background with gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #08080C 100%)',
        }}
      />
      
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-purple-600/5 blur-3xl" />

      {/* Floating bingo balls (decorative) */}
      <div className="absolute top-4 right-12 opacity-10 text-6xl">🎱</div>
      <div className="absolute bottom-8 right-24 opacity-5 text-4xl">🎯</div>

      <div className="relative px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Left: Title */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ 
                  background: 'rgba(124,58,237,0.2)', 
                  color: '#a78bfa',
                  border: '1px solid rgba(124,58,237,0.3)'
                }}
              >
                ROOM #{roomId.slice(-6).toUpperCase()}
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}
            >
              Select Your Bingo Cards
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Pick your lucky numbers and get ready to win big!
            </p>
          </div>

          {/* Right: Stats */}
          <div className="flex flex-wrap gap-3">
            {/* Countdown */}
            <div
              className="px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="text-2xl font-black font-mono tabular-nums"
                  style={{
                    color: urgent ? '#FF5252' : isReady ? '#00E676' : '#F7B500',
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider font-mono">Starts In</span>
                  <span 
                    className="text-[8px] font-bold"
                    style={{ color: urgent ? '#FF5252' : '#94A3B8' }}
                  >
                    {urgent ? '⚡ Starting Soon' : 'Waiting'}
                  </span>
                </div>
              </div>
            </div>

            {/* Players */}
            <div
              className="px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <Icons.Users />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {playerCount}/90
                  </span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider font-mono">Players</span>
                </div>
              </div>
            </div>

            {/* Stake */}
            <div
              className="px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(247,181,0,0.08)',
                border: '1px solid rgba(247,181,0,0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {stakeAmount} ETB
                  </span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider font-mono">Stake</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── My Cards Sidebar ─────────────────────────────────────────────────────────

function MyCardsSidebar({ 
  selectedCards, 
  maxCards, 
  onRemove 
}: { 
  selectedCards: number[];
  maxCards: number;
  onRemove: (card: number) => void;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          Your Selected Cards
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
          {selectedCards.length}/{maxCards}
        </span>
      </div>

      <div className="space-y-2">
        {Array.from({ length: maxCards }, (_, i) => {
          const cardNum = selectedCards[i] || null;
          const isFilled = cardNum !== null;

          return (
            <div
              key={i}
              className={[
                'rounded-xl p-3 flex items-center justify-between transition-all duration-200',
                isFilled
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-gray-800/30 border border-gray-700/50 border-dashed',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                {isFilled ? (
                  <>
                    <span className="text-lg">🎴</span>
                    <div>
                      <span className="text-sm font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        Card #{cardNum}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2 font-mono">Confirmed</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-lg">⬜</span>
                    <span className="text-sm text-gray-500 font-mono">Select a card</span>
                  </>
                )}
              </div>
              {isFilled && (
                <button
                  onClick={() => onRemove(cardNum)}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700/50">
        <p className="text-[10px] text-gray-500 text-center">
          You can select up to {maxCards} cards
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CardSelectPage() {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { roomId, stake } = router.query as { roomId?: string; stake?: string };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?next=/games/bingo');
    }
  }, [authLoading, isAuthenticated, router]);

  const [serverSeconds, setServerSeconds] = useState(0);
  const [roomPlayerCount, setRoomPlayerCount] = useState(0);
  const [roomLoading, setRoomLoading] = useState(true);
  const countdownSecs = Math.max(0, serverSeconds);

  // ─── Load room data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    setRoomLoading(true);
    getRoomById(roomId)
      .then((res) => {
        if (res.success) {
          const r = res.room;
          if (r.status === 'playing' || r.status === 'finished') {
            router.replace(`/games/bingo/${roomId}`);
            return;
          }
          if (r.status === 'cancelled') {
            router.replace('/games/bingo');
            return;
          }
          setRoomPlayerCount(r.playerCount);
          setServerSeconds(r.lobbyTimeRemainingSeconds ?? 0);
        }
      })
      .finally(() => setRoomLoading(false));
  }, [roomId, router]);

  // ─── Socket connection ──────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!roomId) return;
    const token = typeof window !== 'undefined' ? (localStorage.getItem('dashbets_token') ?? '') : '';
    let mounted = true;

    createBingoSocket(token)
      .then(({ socket, listeners }) => {
        if (!mounted) return;
        socketRef.current = socket;
        joinBingoRoom(socket, roomId);

        listeners.onGameStarting(({ countdown, expiresAt }) => {
          if (!mounted) return;
          const remaining = expiresAt
            ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
            : countdown;
          setServerSeconds(remaining);
        });

        listeners.onPlayerJoined(({ playerCount: pc, lobbyTimeRemaining }) => {
          if (!mounted) return;
          setRoomPlayerCount(pc);
          if (typeof lobbyTimeRemaining === 'number' && lobbyTimeRemaining > 0) {
            setServerSeconds(lobbyTimeRemaining);
          }
        });

        listeners.onRoomStatus(({ status, reason }) => {
          if (!mounted) return;
          if (status === 'playing' || status === 'finished') {
            router.replace(`/games/bingo/${roomId}`);
          }
          if (status === 'cancelled') {
            alert(reason ?? 'Room cancelled. Returning to lobby.');
            router.replace('/games/bingo');
          }
        });
      })
      .catch(console.error);

    return () => {
      mounted = false;
      if (socketRef.current && roomId) {
        leaveBingoRoom(socketRef.current, roomId);
      }
    };
  }, [roomId, router]);

  // ─── Card selector hook ──────────────────────────────────────────────────
  const {
    slots,
    selectedCard,
    previewGrid,
    loadingSlots,
    loadingPreview,
    confirming,
    error,
    selectCard,
    shufflePick,
    confirm,
  } = useCardSelector(roomId ?? null);

  // ─── Local state for selected cards ─────────────────────────────────────
  const [myConfirmedCards, setMyConfirmedCards] = useState<number[]>([]);
  const maxCards = 5;

  const handleConfirm = async () => {
    const result = await confirm();
    if (result) {
      setMyConfirmedCards((prev) => [...prev, result.cardNumber]);
      // Navigate to game page after successful confirmation
      router.push(`/games/bingo/${result.roomId}`);
    }
  };

  const handleRemoveCard = (cardNum: number) => {
    // Note: This would need backend support to remove a confirmed card
    // For now, just show a warning
    alert('Cannot remove confirmed card. Please contact support if needed.');
  };

  const takenCards = slots
    .filter((s) => s.taken && !s.takenByMe)
    .map((s) => s.cardNumber);

  const stakeNum = stake ? Number(stake) : 0;

  // ─── Loading states ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080C' }}>
        <div className="w-10 h-10 border-2 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Select Your Cards — DashBets Bingo</title>
        <meta name="description" content="Pick your lucky bingo cards and join the game." />
      </Head>

      <div
        className="min-h-screen text-white flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #08080C 0%, #0f172a 50%, #08080C 100%)',
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        {/* ── HEADER ── */}
        <header
          className="sticky top-0 z-30 px-4 h-14 flex items-center justify-between border-b"
          style={{
            background: 'rgba(8,8,12,0.97)',
            borderColor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={() => router.push('/games/bingo')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <Icons.ChevronLeft />
            Lobby
          </button>

          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ fontFamily: "'Rajdhani', sans-serif", color: '#7C3AED' }}
            >
              Select Your Cards
            </span>
          </div>

          <button
            onClick={shufflePick}
            disabled={loadingSlots}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
            }}
          >
            <Icons.Sparkle />
            Random
          </button>
        </header>

        {/* ── HERO SECTION ── */}
        <div className="px-4 pt-4">
          <HeroSection
            roomId={roomId || ''}
            stakeAmount={stakeNum}
            playerCount={roomPlayerCount}
            minPlayers={2}
            countdownSeconds={countdownSecs}
            roomLoading={roomLoading}
          />
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Left Column: Grid + Preview */}
              <div className="space-y-4">
                {/* Card Number Grid */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        Available Card Numbers
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">1-200</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-green-500" /> My Cards
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-amber-400" /> Selected
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-blue-600" /> Taken
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-gray-700" /> Available
                      </span>
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-9 rounded-lg animate-pulse"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
                      {Array.from({ length: 200 }, (_, i) => {
                        const num = i + 1;
                        const isMyCard = myConfirmedCards.includes(num);
                        const isPending = selectedCard === num;
                        const isTaken = takenCards.includes(num) && !isMyCard;

                        let style: React.CSSProperties = {};
                        let className =
                          'flex items-center justify-center rounded-lg text-xs font-bold h-9 select-none transition-all duration-150 ';

                        if (isMyCard) {
                          style = {
                            background: 'linear-gradient(135deg, #00E676, #00c853)',
                            color: '#000',
                            boxShadow: '0 0 12px rgba(0,230,118,0.5)',
                            border: '1px solid rgba(0,230,118,0.6)',
                            transform: 'scale(1.05)',
                          };
                          className += 'z-10 relative cursor-not-allowed';
                        } else if (isPending) {
                          style = {
                            background: 'linear-gradient(135deg, #F7B500, #d97706)',
                            color: '#000',
                            boxShadow: '0 0 12px rgba(247,181,0,0.4)',
                            border: '1px solid rgba(247,181,0,0.6)',
                            transform: 'scale(1.05)',
                          };
                          className += 'z-10 relative cursor-pointer';
                        } else if (isTaken) {
                          style = {
                            background: 'rgba(79,70,229,0.2)',
                            color: '#4F46E5',
                            border: '1px solid rgba(79,70,229,0.3)',
                            cursor: 'not-allowed',
                            opacity: 0.6,
                          };
                        } else {
                          style = {
                            background: 'rgba(255,255,255,0.04)',
                            color: '#94A3B8',
                            border: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                          };
                          className +=
                            'hover:bg-purple-600/20 hover:text-purple-300 hover:border-purple-500/40 hover:scale-105 active:scale-95';
                        }

                        return (
                          <button
                            key={num}
                            disabled={isMyCard || isTaken}
                            onClick={() => !isMyCard && !isTaken && selectCard(num)}
                            className={className}
                            style={style}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
                    <span>You can select up to {maxCards} cards</span>
                    <span>Selected {myConfirmedCards.length}/{maxCards}</span>
                  </div>
                </div>

                {/* Card Preview */}
                {selectedCard && (
                  <div
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      background: 'rgba(247,181,0,0.03)',
                      borderColor: 'rgba(247,181,0,0.2)',
                      boxShadow: '0 4px 30px rgba(247,181,0,0.05)',
                    }}
                  >
                    <div
                      className="px-4 py-2.5 border-b flex items-center justify-between"
                      style={{ borderColor: 'rgba(247,181,0,0.15)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#F7B500' }}>
                          Card Preview
                        </span>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(247,181,0,0.15)',
                            color: '#F7B500',
                            border: '1px solid rgba(247,181,0,0.3)',
                          }}
                        >
                          #{selectedCard}
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(0,230,118,0.1)',
                          color: '#00E676',
                          border: '1px solid rgba(0,230,118,0.2)',
                        }}
                      >
                        Selected
                      </span>
                    </div>
                    <div className="p-5">
                      {loadingPreview ? (
                        <div className="flex justify-center py-8">
                          <div
                            className="w-8 h-8 border-2 border-t-yellow-400 rounded-full animate-spin"
                            style={{ borderColor: 'rgba(247,181,0,0.2)', borderTopColor: '#F7B500' }}
                          />
                        </div>
                      ) : previewGrid ? (
                        <div className="flex justify-center">
                          <BingoCard card={previewGrid} drawnBalls={[]} activePattern={null} />
                        </div>
                      ) : null}
                    </div>
                    <div
                      className="px-4 py-2 border-t flex items-center justify-between text-xs"
                      style={{ borderColor: 'rgba(247,181,0,0.1)' }}
                    >
                      <span className="text-gray-500">Card Number</span>
                      <span className="font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        #{selectedCard}
                      </span>
                      <span className="text-gray-500">Stake</span>
                      <span className="font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {stakeNum} ETB
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm border"
                    style={{
                      background: 'rgba(255,82,82,0.08)',
                      borderColor: 'rgba(255,82,82,0.2)',
                      color: '#FF5252',
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Right Column: My Cards + Confirm */}
              <div className="space-y-4">
                <MyCardsSidebar
                  selectedCards={myConfirmedCards}
                  maxCards={maxCards}
                  onRemove={handleRemoveCard}
                />

                {/* Confirm Button */}
                <div className="sticky top-20">
                  <button
                    disabled={!selectedCard || confirming}
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    style={{
                      background: selectedCard
                        ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                        : 'rgba(255,255,255,0.04)',
                      color: selectedCard ? '#fff' : '#475569',
                      boxShadow: selectedCard
                        ? '0 4px 30px rgba(124,58,237,0.4)'
                        : 'none',
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.06em',
                    }}
                  >
                    {confirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"
                          style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }}
                        />
                        Confirming…
                      </span>
                    ) : selectedCard ? (
                      <>
                        <Icons.Check />
                        Confirm Card #{selectedCard} — Pay {stakeNum} ETB
                      </>
                    ) : (
                      'Select a Card to Continue'
                    )}
                  </button>

                  <p className="text-[10px] text-gray-500 text-center mt-2">
                    {stakeNum} ETB will be deducted from your balance
                  </p>
                </div>
              </div>
            </div>

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
                <span>💰 Stake Refunded if Game Cancelled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}