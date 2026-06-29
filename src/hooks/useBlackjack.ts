/**
 * hooks/useBlackjack.ts
 *
 * Phase state machine: idle → player_turn → dealer_turn → result
 * Mirrors useKenoSocket pattern: mountedRef unmount guard, safeSet wrapper,
 * clearError / reset helpers, onBalanceUpdate callback.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as bjApi from '../lib/api/blackjackApi';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BJPhase   = 'idle' | 'player_turn' | 'dealer_turn' | 'result';
export type BJOutcome = 'player_win' | 'dealer_win' | 'push' | null;

export interface BJCard {
  index?:   number | null;
  rank?:    string | null;
  suit?:    string | null;
  value?:   number | null;
  hidden?:  boolean;
  display:  string;
}

interface BJState {
  phase:           BJPhase;
  sessionId:       string | null;
  serverSeedHash:  string | null;
  serverSeed:      string | null;      // revealed at game end
  playerCards:     BJCard[];
  dealerCards:     BJCard[];
  playerTotal:     number;
  dealerTotal:     number;
  betAmount:       number;
  outcome:         BJOutcome;
  payout:          number;
  isWin:           boolean;
  isBlackjack:     boolean;
  dealerBlackjack: boolean;
  isBust:          boolean;
  error:           string | null;
  isLoading:       boolean;
}

const INITIAL: BJState = {
  phase:           'idle',
  sessionId:       null,
  serverSeedHash:  null,
  serverSeed:      null,
  playerCards:     [],
  dealerCards:     [],
  playerTotal:     0,
  dealerTotal:     0,
  betAmount:       0,
  outcome:         null,
  payout:          0,
  isWin:           false,
  isBlackjack:     false,
  dealerBlackjack: false,
  isBust:          false,
  error:           null,
  isLoading:       false,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBlackjack(onBalanceUpdate?: (balance: number) => void) {
  const [state, setState] = useState<BJState>(INITIAL);
  const mountedRef        = useRef(true);

  // Unmount guard — same pattern as useKenoSocket
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeSet = useCallback(
    (updater: Partial<BJState> | ((s: BJState) => Partial<BJState>)) => {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        ...(typeof updater === 'function' ? updater(prev) : updater),
      }));
    },
    []
  );

  const clearError = useCallback(() => safeSet({ error: null }), [safeSet]);

  const reset = useCallback(() => {
    safeSet({ ...INITIAL });
  }, [safeSet]);

  // ── Deal ─────────────────────────────────────────────────────────────────

  const deal = useCallback(
    async (betAmount: number, clientSeed = '') => {
      if (betAmount < 1) {
        safeSet({ error: 'Minimum bet is 1 ETB' });
        return;
      }
      safeSet({ isLoading: true, error: null, phase: 'idle' });

      const res = await bjApi.startGame(betAmount, clientSeed);

      if (!res.success) {
        safeSet({ isLoading: false, error: res.error });
        return;
      }

      // Natural Blackjack — settled immediately
      if (res.isBlackjack || res.phase === 'settled') {
        safeSet({
          isLoading:       false,
          phase:           'result',
          sessionId:       res.sessionId,
          serverSeedHash:  res.serverSeedHash,
          serverSeed:      res.serverSeed ?? null,
          playerCards:     res.playerCards,
          dealerCards:     res.dealerCards,
          playerTotal:     res.playerTotal,
          dealerTotal:     res.dealerTotal ?? 0,
          betAmount,
          outcome:         res.outcome ?? null,
          payout:          res.payout ?? 0,
          isWin:           res.outcome === 'player_win',
          isBlackjack:     true,
          dealerBlackjack: res.dealerBlackjack ?? false,
          isBust:          false,
        });
        if (res.newBalance !== undefined) onBalanceUpdate?.(res.newBalance);
        return;
      }

      // Normal deal — player's turn
      safeSet({
        isLoading:      false,
        phase:          'player_turn',
        sessionId:      res.sessionId,
        serverSeedHash: res.serverSeedHash,
        playerCards:    res.playerCards,
        dealerCards:    res.dealerCards,
        playerTotal:    res.playerTotal,
        dealerTotal:    0,
        betAmount,
        outcome:        null,
        payout:         0,
        isWin:          false,
        isBlackjack:    false,
        isBust:         false,
        serverSeed:     null,
      });
      if (res.newBalance !== undefined) onBalanceUpdate?.(res.newBalance);
    },
    [safeSet, onBalanceUpdate]
  );

  // ── Hit ──────────────────────────────────────────────────────────────────

  const hit = useCallback(async () => {
    if (!state.sessionId || state.phase !== 'player_turn') return;
    safeSet({ isLoading: true, error: null });

    const res = await bjApi.hit(state.sessionId);

    if (!res.success) {
      safeSet({ isLoading: false, error: res.error });
      return;
    }

    // Bust
    if (res.isBust || res.phase === 'settled') {
      safeSet({
        isLoading:   false,
        phase:       'result',
        playerCards: res.playerCards,
        playerTotal: res.playerTotal,
        dealerCards: res.dealerCards ?? state.dealerCards,
        dealerTotal: res.dealerTotal ?? 0,
        outcome:     res.outcome ?? 'dealer_win',
        payout:      0,
        isWin:       false,
        isBust:      true,
        serverSeed:  res.serverSeed ?? null,
      });
      if (res.newBalance !== undefined) onBalanceUpdate?.(res.newBalance);
      return;
    }

    // Card added, still playing
    safeSet({
      isLoading:   false,
      playerCards: res.playerCards,
      playerTotal: res.playerTotal,
    });
  }, [state.sessionId, state.phase, state.dealerCards, safeSet, onBalanceUpdate]);

  // ── Stand ────────────────────────────────────────────────────────────────

  const stand = useCallback(async () => {
    if (!state.sessionId || state.phase !== 'player_turn') return;
    safeSet({ isLoading: true, error: null, phase: 'dealer_turn' });

    const res = await bjApi.stand(state.sessionId);

    if (!res.success) {
      safeSet({ isLoading: false, error: res.error, phase: 'player_turn' });
      return;
    }

    safeSet({
      isLoading:   false,
      phase:       'result',
      dealerCards: res.dealerCards,
      dealerTotal: res.dealerTotal,
      playerTotal: res.playerTotal,
      outcome:     res.outcome,
      payout:      res.payout,
      isWin:       res.isWin,
      serverSeed:  res.serverSeed,
    });
    onBalanceUpdate?.(res.newBalance);
  }, [state.sessionId, state.phase, safeSet, onBalanceUpdate]);

  // ── Resume on mount (page refresh recovery) ───────────────────────────────

  const resume = useCallback(async () => {
    safeSet({ isLoading: true, error: null });
    const res = await bjApi.getCurrentSession();

    if (!res.success || !res.session) {
      safeSet({ isLoading: false });
      return;
    }

    const s = res.session;
    safeSet({
      isLoading:      false,
      phase:          s.phase === 'player_turn' ? 'player_turn' : 'idle',
      sessionId:      s.sessionId,
      serverSeedHash: s.serverSeedHash,
      playerCards:    s.playerCards,
      dealerCards:    s.dealerCards,
      playerTotal:    s.playerTotal,
      betAmount:      s.betAmount,
    });
  }, [safeSet]);

  return {
    state,
    deal,
    hit,
    stand,
    resume,
    clearError,
    reset,
  };
}
