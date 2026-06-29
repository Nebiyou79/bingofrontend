/**
 * hooks/useLimboSocket.ts
 *
 * Manages the Socket.IO /limbo namespace connection.
 * Mirrors useKenoSocket pattern exactly:
 *   - mountedRef unmount guard
 *   - safeSet wrapper
 *   - token-based auth
 *   - round state catch-up on connect
 *   - betting countdown timer via setInterval
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LimboPhase = 'idle' | 'betting' | 'revealing' | 'result';

export interface LimboResult {
  roundNumber:      number;
  crashPoint:       number;
  targetMultiplier: number;
  betAmount:        number;
  isWin:            boolean;
  payout:           number;
  newBalance:       number;
}

export interface LimboHistoryEntry {
  roundNumber:      number;
  crashPoint:       number;
  isWin:            boolean;
  payout:           number;
  target:           number;
  betAmount:        number;
}

interface LimboState {
  connected:        boolean;
  phase:            LimboPhase;
  roundNumber:      number | null;
  serverSeedHash:   string | null;
  serverSeed:       string | null;    // revealed after round
  crashPoint:       number | null;    // revealed after round
  hasBet:           boolean;
  betAmount:        number;
  targetMultiplier: number;
  betCountInRound:  number;
  bettingClosesIn:  number;           // ms remaining in betting window
  lastResult:       LimboResult | null;
  history:          LimboHistoryEntry[];
  error:            string | null;
}

const INITIAL: LimboState = {
  connected:        false,
  phase:            'idle',
  roundNumber:      null,
  serverSeedHash:   null,
  serverSeed:       null,
  crashPoint:       null,
  hasBet:           false,
  betAmount:        10,
  targetMultiplier: 2,
  betCountInRound:  0,
  bettingClosesIn:  0,
  lastResult:       null,
  history:          [],
  error:            null,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLimboSocket(
  token: string | null,
  onBalanceUpdate?: (balance: number) => void
) {
  const [state, setState]   = useState<LimboState>(INITIAL);
  const socketRef           = useRef<Socket | null>(null);
  const mountedRef          = useRef(true);
  const countdownRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const bettingEndsAtRef    = useRef<number>(0);

  // Unmount guard
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const safeSet = useCallback(
    (updater: Partial<LimboState> | ((s: LimboState) => Partial<LimboState>)) => {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        ...(typeof updater === 'function' ? updater(prev) : updater),
      }));
    },
    []
  );

  // ── Countdown ticker ──────────────────────────────────────────────────────
  const startCountdown = useCallback((durationMs: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    bettingEndsAtRef.current = Date.now() + durationMs;

    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, bettingEndsAtRef.current - Date.now());
      safeSet({ bettingClosesIn: remaining });
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 100);
  }, [safeSet]);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // ── FIX: Connect to the backend port ──
    // Use environment variable or fallback to port 5000
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const socket: Socket = io(`${backendUrl}/limbo`, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });
    socketRef.current = socket;

    // ── Connection ───────────────────────────────────────────────────────
    socket.on('connect', () => {
      safeSet({ connected: true, error: null });
    });

    socket.on('disconnect', () => {
      safeSet({ connected: false });
      if (countdownRef.current) clearInterval(countdownRef.current);
    });

    socket.on('connect_error', (err) => {
      safeSet({ error: `Connection error: ${err.message}`, connected: false });
    });

    // ── Round: new betting window opens ──────────────────────────────────
    socket.on('round:new', (data: {
      roundNumber:     number;
      serverSeedHash:  string;
      bettingDuration: number;
    }) => {
      startCountdown(data.bettingDuration);
      safeSet({
        phase:           'betting',
        roundNumber:     data.roundNumber,
        serverSeedHash:  data.serverSeedHash,
        serverSeed:      null,
        crashPoint:      null,
        hasBet:          false,
        betCountInRound: 0,
        bettingClosesIn: data.bettingDuration,
        error:           null,
      });
    });

    // ── Catch-up on page load ────────────────────────────────────────────
    socket.on('round:state', (data: {
      roundNumber:     number;
      serverSeedHash:  string;
      status:          string;
      bettingClosesIn: number;
      hasBet:          boolean;
      betCount:        number;
    }) => {
      if (data.status === 'betting' && data.bettingClosesIn > 0) {
        startCountdown(data.bettingClosesIn);
      }
      safeSet({
        phase:           data.status === 'betting' ? 'betting' : 'revealing',
        roundNumber:     data.roundNumber,
        serverSeedHash:  data.serverSeedHash,
        hasBet:          data.hasBet,
        betCountInRound: data.betCount,
        bettingClosesIn: data.bettingClosesIn,
      });
    });

    // ── Live bet count broadcast ─────────────────────────────────────────
    socket.on('round:betCount', (data: { count: number }) => {
      safeSet({ betCountInRound: data.count });
    });

    // ── Bet acknowledged ─────────────────────────────────────────────────
    socket.on('limbo:betPlaced', (data: {
      betAmount:        number;
      targetMultiplier: number;
      newBalance:       number;
      roundNumber:      number;
    }) => {
      safeSet({ hasBet: true, error: null });
      onBalanceUpdate?.(data.newBalance);
    });

    // ── Bet rejected ─────────────────────────────────────────────────────
    socket.on('limbo:betError', (data: { error: string }) => {
      safeSet({ error: data.error });
    });

    // ── Personal result for this player ──────────────────────────────────
    socket.on('limbo:result', (data: LimboResult) => {
      const entry: LimboHistoryEntry = {
        roundNumber:      data.roundNumber,
        crashPoint:       data.crashPoint,
        isWin:            data.isWin,
        payout:           data.payout,
        target:           data.targetMultiplier,
        betAmount:        data.betAmount,
      };
      safeSet(prev => ({
        phase:      'result',
        lastResult: data,
        history:    [entry, ...prev.history].slice(0, 50),
      }));
      onBalanceUpdate?.(data.newBalance);
    });

    // ── Public round result — crash point + seed revealed ─────────────────
    socket.on('round:result', (data: {
      roundNumber:    number;
      crashPoint:     number;
      serverSeed:     string;
      serverSeedHash: string;
      totalBets:      number;
    }) => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      safeSet(prev => ({
        phase:          'revealing',
        crashPoint:     data.crashPoint,
        serverSeed:     data.serverSeed,
        bettingClosesIn: 0,
        // If not in result phase yet (didn't bet), update to revealing
        ...(prev.phase !== 'result' ? { phase: 'revealing' as LimboPhase } : {}),
      }));
    });

    return () => {
      socket.disconnect();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [token, safeSet, startCountdown, onBalanceUpdate]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const placeBet = useCallback((betAmount: number, targetMultiplier: number) => {
    if (!socketRef.current?.connected) {
      safeSet({ error: 'Not connected to server. Reconnecting…' });
      return;
    }
    safeSet({ error: null });
    socketRef.current.emit('limbo:placeBet', { betAmount, targetMultiplier });
  }, [safeSet]);

  const setTarget = useCallback((t: number) => {
    safeSet({ targetMultiplier: Math.max(1.01, Math.min(1000, t)) });
  }, [safeSet]);

  const setBetAmount = useCallback((b: number) => {
    safeSet({ betAmount: Math.max(1, Math.min(10_000, b)) });
  }, [safeSet]);

  const clearError = useCallback(() => safeSet({ error: null }), [safeSet]);

  // Win probability for display: 99/target %
  const winChance = Math.min(98, Math.floor((99 / state.targetMultiplier) * 100) / 100);
  const potentialPayout = Math.floor(state.betAmount * state.targetMultiplier);

  return {
    state,
    winChance,
    potentialPayout,
    placeBet,
    setTarget,
    setBetAmount,
    clearError,
  };
}