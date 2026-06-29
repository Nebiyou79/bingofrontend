// hooks/useGiovani.ts

/**
 * DashBets — useGiovani Hook (5×3 grid, 25 paylines)
 *
 * Manages the full Giovani slot machine state machine:
 *   idle → spinning → revealing → [freeSpins → spinning → revealing]* → idle
 *
 * Follows useKeno.ts pattern: mountedRef, balance:update socket event,
 * no setState after unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket }                                from 'socket.io-client';
import {
  spinGiovani,
  playGiovaniFreeSpin,
  getGiovaniConfig,
  SpinResult,
  FreeSpinResult,
  GiovaniConfig,
  GiovaniGrid,
} from '../lib/api/giovaniApi';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GiovaniPhase =
  | 'idle'
  | 'spinning'      // waiting for server response
  | 'revealing'     // animating reels
  | 'freeSpins'     // bonus round active
  | 'freeSpinning'  // free spin in flight
  | 'error';

export interface GiovaniState {
  phase:              GiovaniPhase;
  grid:               GiovaniGrid;
  lastResult:         SpinResult | null;
  lastFreeResult:     FreeSpinResult | null;
  freeSpinsRemaining: number;
  freeSpinsSessionId: string | null;
  totalFreeWin:       number;        // accumulated winnings during bonus round
  balance:            number | null;
  error:              string | null;
  config:             GiovaniConfig | null;
}

// Default idle grid — all "ten" before the first spin
const INITIAL_GRID: GiovaniGrid = [
  ['ten', 'ten', 'ten'],
  ['ten', 'ten', 'ten'],
  ['ten', 'ten', 'ten'],
  ['ten', 'ten', 'ten'],
  ['ten', 'ten', 'ten'],
];

const INITIAL_STATE: GiovaniState = {
  phase:              'idle',
  grid:               INITIAL_GRID,
  lastResult:         null,
  lastFreeResult:     null,
  freeSpinsRemaining: 0,
  freeSpinsSessionId: null,
  totalFreeWin:       0,
  balance:            null,
  error:              null,
  config:             null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGiovani(initialBalance: number) {
  const mountedRef  = useRef(true);
  const socketRef   = useRef<Socket | null>(null);

  const [state, setState] = useState<GiovaniState>({
    ...INITIAL_STATE,
    balance: initialBalance,
  });

  // ── Socket: balance:update ─────────────────────────────────────────────────
  useEffect(() => {
    const token  = localStorage.getItem('dashbets_token');
    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? '', {
      auth:              { token },
      transports:        ['websocket'],
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('balance:update', ({ newBalance }: { newBalance: number }) => {
      if (!mountedRef.current) return;
      setState(prev => ({ ...prev, balance: newBalance }));
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Load config ────────────────────────────────────────────────────────────
  useEffect(() => {
    getGiovaniConfig()
      .then(config => {
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, config }));
      })
      .catch(() => { /* non-fatal */ });
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // ─── spin ──────────────────────────────────────────────────────────────────
  const spin = useCallback(async (betAmount: number, clientSeed?: string) => {
    if (!mountedRef.current) return;
    if (state.phase !== 'idle') return;

    setState(prev => ({ ...prev, phase: 'spinning', error: null }));

    try {
      const result = await spinGiovani(betAmount, clientSeed);
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        phase:              'revealing',
        grid:               result.grid,
        lastResult:         result,
        balance:            result.newBalance,
        // Prime free spin state if bonus triggered
        freeSpinsRemaining: result.freeSpinsAwarded,
        freeSpinsSessionId: result.freeSpinsSessionId,
        totalFreeWin:       0,
      }));
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Spin failed',
      }));
    }
  }, [state.phase]);

  // ─── onRevealComplete: called by animation layer once reels stop ───────────
  const onRevealComplete = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prev => {
      if (prev.freeSpinsRemaining > 0) {
        return { ...prev, phase: 'freeSpins' };
      }
      return { ...prev, phase: 'idle' };
    });
  }, []);

  // ─── playNextFreeSpin ──────────────────────────────────────────────────────
  const playNextFreeSpin = useCallback(async () => {
    if (!mountedRef.current) return;
    setState(prev => {
      if (prev.phase !== 'freeSpins' || !prev.freeSpinsSessionId) return prev;
      return { ...prev, phase: 'freeSpinning' };
    });

    const sessionId = state.freeSpinsSessionId;
    if (!sessionId) return;

    try {
      const result = await playGiovaniFreeSpin(sessionId);
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        phase:              'revealing',
        grid:               result.grid,
        lastFreeResult:     result,
        balance:            result.newBalance,
        freeSpinsRemaining: result.freeSpinsRemaining,
        totalFreeWin:       prev.totalFreeWin + result.payout,
      }));
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Free spin failed',
      }));
    }
  }, [state.phase, state.freeSpinsSessionId]);

  // ─── reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prev => ({
      ...INITIAL_STATE,
      balance: prev.balance,
      config:  prev.config,
    }));
  }, []);

  return {
    ...state,
    spin,
    onRevealComplete,
    playNextFreeSpin,
    reset,
    isSpinning: state.phase === 'spinning' || state.phase === 'freeSpinning',
    canSpin:    state.phase === 'idle',
  };
}