// hooks/useRPS.ts

/**
 * DashBets — useRPS Hook
 *
 * Manages the full RPS state machine:
 *
 * SINGLE mode:
 *   idle → starting → waiting_pick → playing → revealing → idle
 *
 * CHAIN mode:
 *   idle → starting → waiting_pick → playing → revealing
 *        ↘ (win, chain continues) → waiting_pick
 *        ↘ (lose / cashout / max chain) → idle
 *
 * Follows useKeno.ts / useSlots.ts pattern:
 *   mountedRef, balance:update socket, no setState after unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket }                                from 'socket.io-client';
import {
  startRPSGame,
  playRPSRound,
  cashOutRPS,
  getRPSConfig,
  RPSChoice,
  RPSMode,
  RPSGameStarted,
  RPSRoundResult,
  RPSCashOutResult,
  RPSConfig,
} from '../lib/api/rpsApi';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RPSPhase =
  | 'idle'
  | 'starting'       // POST /start in-flight
  | 'waiting_pick'   // game active, awaiting player choice
  | 'playing'        // POST /play in-flight
  | 'revealing'      // animating outcome (brief, then transitions)
  | 'cashing_out'    // POST /cashout in-flight
  | 'error';

export interface RPSState {
  phase:           RPSPhase;
  mode:            RPSMode;
  gameId:          string | null;
  betAmount:       number;
  serverSeedHash:  string | null;    // committed before pick
  clientSeed:      string | null;
  winStreak:       number;
  potentialPayout: number;
  lastRound:       RPSRoundResult | null;
  lastOutcome:     'win' | 'lose' | 'tie' | null;
  playerChoice:    RPSChoice | null;
  houseChoice:     RPSChoice | null;
  isGameOver:      boolean;
  finalPayout:     number;
  balance:         number | null;
  error:           string | null;
  config:          RPSConfig | null;
}

const INITIAL_STATE: RPSState = {
  phase:           'idle',
  mode:            'single',
  gameId:          null,
  betAmount:       0,
  serverSeedHash:  null,
  clientSeed:      null,
  winStreak:       0,
  potentialPayout: 0,
  lastRound:       null,
  lastOutcome:     null,
  playerChoice:    null,
  houseChoice:     null,
  isGameOver:      false,
  finalPayout:     0,
  balance:         null,
  error:           null,
  config:          null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRPS(initialBalance: number) {
  const mountedRef = useRef(true);
  const socketRef  = useRef<Socket | null>(null);

  const [state, setState] = useState<RPSState>({
    ...INITIAL_STATE,
    balance: initialBalance,
  });

  // ── Socket: balance:update ─────────────────────────────────────────────────
  useEffect(() => {
    const token  = localStorage.getItem('dashbets_token');
    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? '', {
      auth:       { token },
      transports: ['websocket'],
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
    getRPSConfig()
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

  // ─── startGame ────────────────────────────────────────────────────────────
  const startGame = useCallback(async (
    betAmount: number,
    mode: RPSMode,
    clientSeed?: string,
  ) => {
    if (!mountedRef.current) return;
    if (state.phase !== 'idle') return;

    setState(prev => ({ ...prev, phase: 'starting', error: null }));

    try {
      const result: RPSGameStarted = await startRPSGame(betAmount, mode, clientSeed);
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        phase:           'waiting_pick',
        mode,
        gameId:          result.gameId,
        betAmount:       result.betAmount,
        serverSeedHash:  result.serverSeedHash,
        clientSeed:      result.clientSeed,
        balance:         result.newBalance,
        winStreak:       0,
        potentialPayout: 0,
        isGameOver:      false,
        finalPayout:     0,
        lastRound:       null,
        lastOutcome:     null,
        playerChoice:    null,
        houseChoice:     null,
      }));
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Failed to start game',
      }));
    }
  }, [state.phase]);

  // ─── pickChoice ──────────────────────────────────────────────────────────
  const pickChoice = useCallback(async (playerChoice: RPSChoice) => {
    if (!mountedRef.current) return;
    if (state.phase !== 'waiting_pick' || !state.gameId) return;

    setState(prev => ({ ...prev, phase: 'playing', playerChoice, error: null }));

    try {
      const result: RPSRoundResult = await playRPSRound(state.gameId, playerChoice);
      if (!mountedRef.current) return;

      const isGameOver =
        result.status === 'completed' ||
        result.status === 'lost'      ||
        result.status === 'tied';

      setState(prev => ({
        ...prev,
        phase:           'revealing',
        lastRound:       result,
        lastOutcome:     result.outcome,
        houseChoice:     result.houseChoice,
        winStreak:       result.winStreak     ?? prev.winStreak,
        potentialPayout: result.potentialPayout ?? prev.potentialPayout,
        isGameOver,
        finalPayout:     isGameOver ? (result.finalPayout ?? 0) : prev.finalPayout,
        balance:         result.newBalance != null ? result.newBalance : prev.balance,
      }));
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Round failed',
      }));
    }
  }, [state.phase, state.gameId]);

  // ─── onRevealComplete: called by UI animation once outcome is shown ───────
  const onRevealComplete = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prev => {
      if (prev.isGameOver) {
        // Stay in idle — game over screen shown until player resets
        return { ...prev, phase: 'idle' };
      }
      // Chain continues — await next pick
      // If tie: also go back to waiting_pick (server already incremented nonce)
      return { ...prev, phase: 'waiting_pick', playerChoice: null, houseChoice: null };
    });
  }, []);

  // ─── cashOut ─────────────────────────────────────────────────────────────
  const cashOut = useCallback(async () => {
    if (!mountedRef.current) return;
    if ((state.phase !== 'waiting_pick' && state.phase !== 'revealing') || !state.gameId) return;
    if (state.mode !== 'chain' || state.winStreak === 0) return;

    setState(prev => ({ ...prev, phase: 'cashing_out', error: null }));

    try {
      const result: RPSCashOutResult = await cashOutRPS(state.gameId);
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        phase:        'idle',
        isGameOver:   true,
        finalPayout:  result.finalPayout,
        balance:      result.newBalance,
        gameId:       null,
        lastOutcome:  'win',
      }));
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Cash out failed',
      }));
    }
  }, [state.phase, state.gameId, state.mode, state.winStreak]);

  // ─── reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setState(prev => ({
      ...INITIAL_STATE,
      balance: prev.balance,
      config:  prev.config,
    }));
  }, []);

  // ─── Derived convenience flags ────────────────────────────────────────────
  const canStartGame  = state.phase === 'idle';
  const canPick       = state.phase === 'waiting_pick';
  const canCashOut    = state.phase === 'waiting_pick' && state.mode === 'chain' && state.winStreak > 0;
  const isLoading     = state.phase === 'starting' || state.phase === 'playing' || state.phase === 'cashing_out';

  return {
    ...state,
    startGame,
    pickChoice,
    onRevealComplete,
    cashOut,
    reset,
    canStartGame,
    canPick,
    canCashOut,
    isLoading,
  };
}
