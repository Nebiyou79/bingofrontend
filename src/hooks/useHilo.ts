/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * hooks/useHilo.ts
 * Core Hi-Lo game state machine.
 *
 * BUG FIXES:
 * 1. submitGuess returns success:false with a "Guess failed." error when the
 *    player loses — the hook was treating this as a generic error and going
 *    back to 'playing'. We now inspect the error message / response shape and
 *    transition to 'lost' when appropriate.
 *
 * 2. result.multiplier / result.stepCount were captured from the stale
 *    closure value of `session` (which had not yet been updated by this
 *    round's guess). We now read from `r` (the API response) first, and only
 *    fall back to session state as a last resort.
 *
 * 3. savedSessionRef: we keep a ref copy of the current session so that even
 *    if React batches the setSession(null) before the result render, we still
 *    have the betAmount / stepCount / multiplier available for the overlay.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  startSession, submitGuess, skipCard, cashout as cashoutApi,
  getCurrentSession,
} from '../lib/api/hiloApi';
import type {
  HiloCard, HiloOdds, HiloStartResponse, HiloGuessResponse,
  HiloCashoutResponse,
} from '../lib/api/hiloApi';

export type HiloPhase = 'idle' | 'playing' | 'resolving' | 'won' | 'lost';

export interface HiloSessionState {
  sessionId:       string;
  serverSeedHash:  string;
  currentCard:     HiloCard;
  odds:            HiloOdds;
  multiplier:      number;
  betAmount:       number;
  stepCount:       number;
  potentialPayout: number;
  cardHistory:     HiloCard[];
}

export interface HiloResult {
  payout:     number;
  multiplier: number;
  stepCount:  number;
  serverSeed: string;
  won:        boolean;
  lostOn?:    HiloCard;
}

export interface UseHiloReturn {
  phase:      HiloPhase;
  session:    HiloSessionState | null;
  result:     HiloResult | null;
  error:      string | null;
  lastCard:   HiloCard | null;

  startGame:  (betAmount: number, clientSeed?: string) => Promise<void>;
  guess:      (prediction: 'higher' | 'lower' | 'equal') => Promise<void>;
  skip:       () => Promise<void>;
  cashout:    () => Promise<void>;
  reset:      () => void;
  clearError: () => void;
}

// Error messages the server sends when a guess is simply wrong (not a real error)
const LOSS_ERROR_PATTERNS = [
  'guess failed',
  'incorrect guess',
  'wrong guess',
  'bust',
  'lost',
  'game over',
  'session.*lost',
  'prediction.*wrong',
  'prediction.*incorrect',
];

function isLossError(message: string): boolean {
  const lower = message.toLowerCase();
  return LOSS_ERROR_PATTERNS.some(p => new RegExp(p).test(lower));
}

export function useHilo(): UseHiloReturn {
  const [phase,    setPhase]    = useState<HiloPhase>('idle');
  const [session,  setSession]  = useState<HiloSessionState | null>(null);
  const [result,   setResult]   = useState<HiloResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [lastCard, setLastCard] = useState<HiloCard | null>(null);

  const mountedRef        = useRef(true);
  const pendingRequestRef = useRef(false);
  // FIX 3: always keep a current copy of session in a ref so we can read it
  // synchronously inside async callbacks without stale-closure issues.
  const sessionRef = useRef<HiloSessionState | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Keep sessionRef in sync with state
  useEffect(() => { sessionRef.current = session; }, [session]);

  const safe = <T,>(fn: (v: T) => void) => (v: T) => {
    if (mountedRef.current) fn(v);
  };

  // ── Restore active session on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getCurrentSession();
        if (!mountedRef.current) return;
        if (res.success && res.session) {
          const s = res.session;
          setSession({
            sessionId:       s.sessionId,
            serverSeedHash:  s.serverSeedHash,
            currentCard:     s.currentCard,
            odds:            s.odds,
            multiplier:      s.multiplier,
            betAmount:       s.betAmount,
            stepCount:       s.stepCount,
            potentialPayout: s.potentialPayout,
            cardHistory:     [s.currentCard],
          });
          setPhase('playing');
        }
      } catch {
        // Silently ignore — user just starts fresh
      }
    })();
  }, []);

  // ── Handle already-resolved responses from the server ──────────────────────
  const handleAlreadyResolved = useCallback((res: any) => {
    if (!res.alreadyResolved) return false;

    if (res.result === 'lost' || res.result === 'cashed_out') {
      const won = res.result === 'cashed_out';
      setResult({
        payout:     res.payout ?? 0,
        multiplier: res.multiplier ?? 0,
        stepCount:  res.stepCount ?? 0,
        serverSeed: res.serverSeed ?? '',
        won,
      });
      setSession(null);
      setPhase(won ? 'won' : 'lost');
      return true;
    }

    return false;
  }, []);

  // ── Start ──────────────────────────────────────────────────────────────────
  const startGame = useCallback(async (betAmount: number, clientSeed = '') => {
    if (phase !== 'idle') return;
    safe(setPhase)('resolving');
    safe(setError)(null);
    try {
      const res = await startSession(betAmount, clientSeed);
      if (!mountedRef.current) return;
      if (!res.success) {
        setError((res as { error: string }).error ?? 'Failed to start game.');
        setPhase('idle');
        return;
      }
      const r = res as HiloStartResponse;
      setSession({
        sessionId:       r.sessionId,
        serverSeedHash:  r.serverSeedHash,
        currentCard:     r.currentCard,
        odds:            r.odds,
        multiplier:      r.multiplier,
        betAmount:       r.betAmount,
        stepCount:       0,
        potentialPayout: r.betAmount,
        cardHistory:     [r.currentCard],
      });
      setLastCard(r.currentCard);
      setPhase('playing');
    } catch {
      if (mountedRef.current) {
        setError('Could not start game. Check your connection.');
        setPhase('idle');
      }
    }
  }, [phase]);

  // ── Guess ──────────────────────────────────────────────────────────────────
  const guess = useCallback(async (prediction: 'higher' | 'lower' | 'equal') => {
    if (phase !== 'playing' || !session) return;
    if (pendingRequestRef.current) return;

    pendingRequestRef.current = true;
    safe(setPhase)('resolving');
    safe(setError)(null);

    // FIX 3: snapshot session values NOW (before any async work) so we have
    // accurate stepCount / multiplier / betAmount even after session clears.
    const snap = sessionRef.current ?? session;

    try {
      const res = await submitGuess(snap.sessionId, prediction);
      if (!mountedRef.current) return;

      // Handle server-side race condition (session already resolved)
      if (!res.success && handleAlreadyResolved(res)) return;

      if (!res.success) {
        const errMsg = (res as any).error ?? 'Guess failed.';

        // FIX 1: server returns success:false when guess is wrong (lost round).
        // Detect loss signals in the error message or response shape.
        const serverSaysLost =
          isLossError(errMsg) ||
          (res as any).result === 'lost' ||
          (res as any).lost === true ||
          (res as any).gameOver === true;

        if (serverSaysLost) {
          // FIX 2: use snap (synchronous snapshot) not the stale `session`
          // closure for stepCount / multiplier so the bust screen is accurate.
          setResult({
            payout:     0,
            multiplier: (res as any).multiplier ?? snap.multiplier,
            stepCount:  (res as any).stepCount  ?? snap.stepCount,
            serverSeed: (res as any).serverSeed ?? '',
            won:        false,
            lostOn:     (res as any).nextCard ?? (res as any).drawnCard ?? (res as any).card ?? undefined,
          });
          setSession(null);
          setPhase('lost');
          return;
        }

        // Genuine error (network / validation)
        setError(errMsg);
        setPhase('playing');
        return;
      }

      const r = res as HiloGuessResponse;
      setLastCard(r.nextCard ?? r.currentCard);

      if (r.result === 'lost') {
        // FIX 2: same — use response values, fall back to snap
        setResult({
          payout:     0,
          multiplier: r.multiplier ?? snap.multiplier,
          stepCount:  r.stepCount  ?? snap.stepCount,
          serverSeed: r.serverSeed ?? '',
          won:        false,
          lostOn:     r.nextCard,
        });
        setSession(null);
        setPhase('lost');
      } else {
        setSession(prev => prev ? {
          ...prev,
          currentCard:     r.currentCard,
          odds:            r.odds!,
          multiplier:      r.multiplier!,
          stepCount:       r.stepCount!,
          potentialPayout: r.potentialPayout!,
          cardHistory:     [...prev.cardHistory, r.currentCard],
        } : null);
        setPhase('playing');
      }
    } catch {
      if (mountedRef.current) {
        setError('Network error during guess.');
        setPhase('playing');
      }
    } finally {
      pendingRequestRef.current = false;
    }
  }, [phase, session, handleAlreadyResolved]);

  // ── Skip ───────────────────────────────────────────────────────────────────
  const skip = useCallback(async () => {
    if (phase !== 'playing' || !session) return;
    if (pendingRequestRef.current) return;

    pendingRequestRef.current = true;
    safe(setPhase)('resolving');

    try {
      const res = await skipCard(session.sessionId);
      if (!mountedRef.current) return;

      if (!res.success && handleAlreadyResolved(res)) return;

      if (!res.success) {
        setError((res as { error: string }).error ?? 'Skip failed.');
        setPhase('playing');
        return;
      }

      setLastCard(res.currentCard);
      setSession(prev => prev ? {
        ...prev,
        currentCard:     res.currentCard,
        odds:            res.odds,
        multiplier:      res.multiplier,
        potentialPayout: res.potentialPayout,
        stepCount:       res.stepCount,
        cardHistory:     [...prev.cardHistory, res.currentCard],
      } : null);
      setPhase('playing');
    } catch {
      if (mountedRef.current) {
        setError('Network error during skip.');
        setPhase('playing');
      }
    } finally {
      pendingRequestRef.current = false;
    }
  }, [phase, session, handleAlreadyResolved]);

  // ── Cashout ────────────────────────────────────────────────────────────────
  const cashout = useCallback(async () => {
    if (phase !== 'playing' || !session) return;
    if (pendingRequestRef.current) return;

    pendingRequestRef.current = true;
    safe(setPhase)('resolving');

    try {
      const res = await cashoutApi(session.sessionId);
      if (!mountedRef.current) return;

      if (!res.success && handleAlreadyResolved(res)) return;

      if (res.success && (res as any).alreadyResolved) {
        handleAlreadyResolved(res);
        return;
      }

      if (!res.success) {
        setError((res as { error: string }).error ?? 'Cashout failed.');
        setPhase('playing');
        return;
      }

      const r = res as HiloCashoutResponse;
      setResult({
        payout:     r.payout,
        multiplier: r.multiplier,
        stepCount:  r.stepCount,
        serverSeed: r.serverSeed,
        won:        true,
      });
      setSession(null);
      setPhase('won');
    } catch {
      if (mountedRef.current) {
        setError('Cashout failed. Try again.');
        setPhase('playing');
      }
    } finally {
      pendingRequestRef.current = false;
    }
  }, [phase, session, handleAlreadyResolved]);

  const reset = useCallback(() => {
    pendingRequestRef.current = false;
    setPhase('idle');
    setSession(null);
    setResult(null);
    setError(null);
    setLastCard(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { phase, session, result, error, lastCard, startGame, guess, skip, cashout, reset, clearError };
}