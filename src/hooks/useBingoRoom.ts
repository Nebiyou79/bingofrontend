/**
 * hooks/useBingoRoom.ts
 *
 * BUG-11 FIX: startLocalCountdown guards against seconds <= 0 so the
 *   interval is never started with a zero or negative seed.
 *
 * Other fixes already present from previous iteration:
 *   - Does not disconnect singleton socket on cleanup (only leaves room)
 *   - Hydrates lobby countdown from REST on mount
 *   - setLoading(false) guaranteed even if socket init fails
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRoomById } from '../lib/api/bingoApi';
import { createBingoSocket, joinBingoRoom, leaveBingoRoom } from '../lib/socket/bingoSocket';
import type { BingoRoom, WinPattern } from '../lib/api/bingoApi';
import type { Socket } from 'socket.io-client';
import type { BingoSocketListeners, GameOverPayload } from '../lib/socket/bingoSocket';

export interface WinnerInfo {
  cardNumber: number;
  userId: string;
  pattern: WinPattern;
  matchedIndices: number[];
  jackpotPool: number;
  amountWon: number;
  displayName?: string;
  maskedPhone?: string;
}

export interface UseBingoRoomReturn {
  room: BingoRoom | null;
  drawnBalls: number[];
  status: BingoRoom['status'] | null;
  jackpotPool: number;
  callCount: number;
  playerCount: number;
  stakeAmount: number;
  gameStartCountdown: number | null;
  winner: WinnerInfo | null;
  winners: WinnerInfo[];
  activePattern: WinPattern | null;
  winningBall: number | null;
  winnerDisplayName: string | null;
  winnerMaskedPhone: string | null;
  loading: boolean;
  error: string | null;
}

export function useBingoRoom(roomId: string | null): UseBingoRoomReturn {
  const [room, setRoom]                           = useState<BingoRoom | null>(null);
  const [drawnBalls, setDrawnBalls]               = useState<number[]>([]);
  const [status, setStatus]                       = useState<BingoRoom['status'] | null>(null);
  const [jackpotPool, setJackpotPool]             = useState(0);
  const [callCount, setCallCount]                 = useState(0);
  const [playerCount, setPlayerCount]             = useState(0);
  const [stakeAmount, setStakeAmount]             = useState(0);
  const [gameStartCountdown, setCountdown]        = useState<number | null>(null);
  const [winner, setWinner]                       = useState<WinnerInfo | null>(null);
  const [winners, setWinners]                     = useState<WinnerInfo[]>([]);
  const [activePattern, setActivePattern]         = useState<WinPattern | null>(null);
  const [winningBall, setWinningBall]             = useState<number | null>(null);
  const [winnerDisplayName, setWinnerDisplayName] = useState<string | null>(null);
  const [winnerMaskedPhone, setWinnerMaskedPhone] = useState<string | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState<string | null>(null);

  const socketRef    = useRef<Socket | null>(null);
  const listenersRef = useRef<BingoSocketListeners | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // BUG-11 FIX: Guard against zero/negative seconds to avoid an interval
  // that fires immediately and floods state updates.
  const startLocalCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (seconds <= 0) {
      setCountdown(0);
      return;
    }
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      // ── 1. Fetch initial room state via REST ────────────────────────────
      try {
        const res = await getRoomById(roomId);
        if (cancelled) return;
        if (!res.success) {
          setError((res as { error: string }).error);
          setLoading(false);
          return;
        }
        const r = res.room;
        setRoom(r);
        setDrawnBalls(r.drawnBalls ?? []);
        setCallCount(r.drawnBalls?.length ?? 0);
        setStatus(r.status);
        setJackpotPool(r.jackpotPool);
        setPlayerCount(r.playerCount);
        setStakeAmount(r.stakeAmount);
        setActivePattern(r.activePattern ?? null);
        setWinningBall(r.winningBall ?? null);

        // Hydrate local countdown from server virtual if timer is running
        const lobbySecsVirtual = r.lobbyTimeRemainingSeconds;
        if (lobbySecsVirtual && lobbySecsVirtual > 0 && r.status === 'waiting') {
          startLocalCountdown(lobbySecsVirtual);
        }

        if (r.winners?.length > 0) {
          const mapped: WinnerInfo[] = r.winners.map((w) => ({
            cardNumber: w.cardNumber, userId: w.userId, pattern: w.pattern,
            matchedIndices: w.matchedIndices ?? [], jackpotPool: r.jackpotPool,
            amountWon: w.amountWon, displayName: w.displayName, maskedPhone: w.maskedPhone,
          }));
          setWinners(mapped);
          setWinner(mapped[0] ?? null);
          setWinnerDisplayName(mapped[0]?.displayName ?? null);
          setWinnerMaskedPhone(mapped[0]?.maskedPhone ?? null);
        }
      } catch {
        if (!cancelled) { setError('Failed to load room'); setLoading(false); }
        return;
      }

      // ── 2. Connect socket ───────────────────────────────────────────────
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('dashbets_token') ?? '')
        : '';

      let socket: Socket;
      let listeners: BingoSocketListeners;

      try {
        const result = await createBingoSocket(token);
        if (cancelled) return;
        socket    = result.socket;
        listeners = result.listeners;
      } catch (e) {
        console.error('[useBingoRoom] Socket init failed:', e);
        if (!cancelled) setLoading(false);
        return;
      }

      socketRef.current    = socket;
      listenersRef.current = listeners;
      joinBingoRoom(socket, roomId);

      // ── 3. Bind events ──────────────────────────────────────────────────
      listeners.onPlayerJoined(({ playerCount: pc, jackpotPool: pool, lobbyTimeRemaining }) => {
        setPlayerCount(pc);
        setJackpotPool(pool);
        setRoom((r) => r ? { ...r, playerCount: pc, jackpotPool: pool } : r);
        if (typeof lobbyTimeRemaining === 'number' && lobbyTimeRemaining > 0) {
          startLocalCountdown(lobbyTimeRemaining);
        }
      });

      listeners.onGameStarting(({ countdown, expiresAt }) => {
        setStatus('waiting');
        if (expiresAt) {
          const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
          startLocalCountdown(remaining);
        } else {
          startLocalCountdown(countdown);
        }
      });

      listeners.onBallDrawn(({ drawnBalls: balls, playerCount: pc, jackpotPool: pool }) => {
        setDrawnBalls(balls);
        setCallCount(balls.length);
        setPlayerCount(pc);
        setJackpotPool(pool);
        setRoom((r) => r ? { ...r, drawnBalls: balls, playerCount: pc, jackpotPool: pool } : r);
        if (countdownRef.current) { clearInterval(countdownRef.current); setCountdown(null); }
        setStatus('playing');
      });

      listeners.onGameOver((payload: GameOverPayload) => {
        const pool = payload.jackpotPool;
        setStatus('finished');
        setJackpotPool(pool);
        setActivePattern(payload.activePattern ?? payload.winPattern ?? null);
        setWinningBall(payload.winningBall ?? null);
        setWinnerDisplayName(payload.winnerDisplayName ?? null);
        setWinnerMaskedPhone(payload.winnerMaskedPhone ?? null);

        if (payload.winners?.length > 0) {
          const mapped: WinnerInfo[] = payload.winners.map((w) => ({
            cardNumber: w.cardNumber, userId: w.userId, pattern: w.pattern,
            matchedIndices: w.matchedIndices ?? [], jackpotPool: pool,
            amountWon: w.amountWon, displayName: w.displayName, maskedPhone: w.maskedPhone,
          }));
          setWinners(mapped);
          setWinner(mapped[0] ?? null);
          if (!payload.winnerDisplayName) setWinnerDisplayName(mapped[0]?.displayName ?? null);
          if (!payload.winnerMaskedPhone) setWinnerMaskedPhone(mapped[0]?.maskedPhone ?? null);
        } else if (payload.winner) {
          const w = payload.winner;
          const info: WinnerInfo = {
            cardNumber: w.cardNumber, userId: w.userId, pattern: w.pattern,
            matchedIndices: w.matchedIndices ?? [], jackpotPool: pool,
            amountWon: w.amountWon, displayName: w.displayName, maskedPhone: w.maskedPhone,
          };
          setWinners([info]);
          setWinner(info);
        }

        setRoom((r) => r ? {
          ...r, status: 'finished',
          activePattern: payload.activePattern ?? payload.winPattern ?? null,
          winningBall:   payload.winningBall ?? null,
        } : r);
      });

      listeners.onRoomStatus(({ status: s, reason }) => {
        setStatus(s as BingoRoom['status']);
        if (s === 'cancelled' && reason) setError(reason);
      });

      if (!cancelled) setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      listenersRef.current?.offAll();
      if (socketRef.current && roomId) leaveBingoRoom(socketRef.current, roomId);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [roomId, startLocalCountdown]);

  return {
    room, drawnBalls, status, jackpotPool,
    callCount, playerCount, stakeAmount,
    gameStartCountdown, winner, winners,
    activePattern, winningBall,
    winnerDisplayName, winnerMaskedPhone,
    loading, error,
  };
}