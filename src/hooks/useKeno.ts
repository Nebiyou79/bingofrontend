/**
 * hooks/useKeno.ts
 * Core Keno state machine.
 *
 * Fixes over original:
 *   - Adds finishDraw() so the page can explicitly transition
 *     'drawing' → 'result' after the animation loop completes.
 *     Without this the phase was forever stuck in 'drawing'.
 *   - Adds mounted-ref guard so setState calls after unmount are no-ops
 *     (prevents React "Can't perform state update on unmounted component").
 *   - place() is now safe to call while placing === true (early-return guard).
 *   - reset() clears all state including placing flag.
 *   - setPhase is exposed so the page can drive phase transitions explicitly.
 *
 * Concerns deliberately NOT in this hook:
 *   - History fetching  → useKenoHistory.ts
 *   - Number selection  → page component
 *   - Animation timing  → page component (drives finishDraw() call)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { placeBet } from '../lib/api/kenoApi';
import type { KenoResult } from '../lib/api/kenoApi';

export type KenoPhase = 'betting' | 'drawing' | 'result';

export interface UseKenoReturn {
  /** Current game phase */
  phase: KenoPhase;
  /** Explicitly set phase — used by the page to transition drawing → result */
  setPhase: (phase: KenoPhase) => void;
  /** True while the network request is in-flight */
  placing: boolean;
  /** Full API result; populated after place() succeeds, null otherwise */
  result: KenoResult | null;
  /** Human-readable error string, or null */
  error: string | null;
  /**
   * Place a keno bet.
   * Transitions phase: betting → drawing immediately, then the page calls
   * finishDraw() once animation completes to move to 'result'.
   * Returns the raw result so the page can drive the animation loop.
   * Returns null on validation failure or network error.
   */
  place: (betAmount: number, selectedNumbers: number[]) => Promise<KenoResult | null>;
  /**
   * Call this after the drawn-ball animation loop completes.
   * Transitions phase from 'drawing' → 'result'.
   * No-op if phase is not 'drawing' (safe to call speculatively).
   */
  finishDraw: () => void;
  /** Reset everything back to the 'betting' phase for a new round. */
  reset: () => void;
  /** Clear only the error banner without resetting the full game state. */
  clearError: () => void;
}

export function useKeno(): UseKenoReturn {
  const [phase,   setPhaseState] = useState<KenoPhase>('betting');
  const [placing, setPlacing]    = useState(false);
  const [result,  setResult]     = useState<KenoResult | null>(null);
  const [error,   setError]      = useState<string | null>(null);

  // Prevent setState calls after the component unmounts
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeSet = useCallback(<T>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: React.SetStateAction<T>) => {
      if (mountedRef.current) setter(value);
    },
  []);

  const safeSetPhase   = safeSet(setPhaseState);
  const safeSetPlacing = safeSet(setPlacing);
  const safeSetResult  = safeSet(setResult);
  const safeSetError   = safeSet(setError);

  // Public setter so the page can drive phase manually (e.g. drawing → result)
  const setPhase = useCallback((p: KenoPhase) => {
    safeSetPhase(p);
  }, [safeSetPhase]);

  /**
   * Fire a keno bet.
   * - Immediately transitions phase to 'drawing' to lock the UI
   * - Awaits the API response
   * - On success: stores result, stays in 'drawing' so the caller can animate
   * - On failure: restores to 'betting' with an error message
   */
  const place = useCallback(
    async (betAmount: number, selectedNumbers: number[]): Promise<KenoResult | null> => {
      // Guard: already in-flight or not in betting phase
      if (placing || phase !== 'betting') return null;

      safeSetPlacing(true);
      safeSetError(null);
      safeSetPhase('drawing');

      try {
        const res = await placeBet(betAmount, selectedNumbers);

        if (!res.success) {
          const apiErr = res as { success: false; error: string; message?: string };

          let userMsg: string;
          switch (apiErr.error) {
            case 'Insufficient balance':
              userMsg = `Insufficient balance — need ${betAmount} ETB.`;
              break;
            case 'Account suspended':
              userMsg = 'Your account has been suspended. Contact support.';
              break;
            case 'Draw failed — your bet has been refunded':
              userMsg = 'Draw failed — your balance has been restored.';
              break;
            case 'Too many requests':
              userMsg = 'Slow down — you are betting too quickly.';
              break;
            case 'Request timed out':
              userMsg = 'Request timed out. Check your bet history before trying again.';
              break;
            default:
              userMsg = apiErr.message ?? apiErr.error ?? 'Something went wrong.';
          }

          safeSetError(userMsg);
          safeSetPhase('betting');
          return null;
        }

        // Strip the discriminant and store the result
        // Phase stays in 'drawing' — the page calls finishDraw() after animation
        const { success: _s, ...resultData } = res as { success: true } & KenoResult;
        const kenoResult = resultData as KenoResult;
        safeSetResult(kenoResult);
        return kenoResult;

      } catch {
        // Unexpected runtime error (shouldn't happen — kenoApi catches network errors)
        safeSetError('Unexpected error. Check your bet history before playing again.');
        safeSetPhase('betting');
        return null;
      } finally {
        safeSetPlacing(false);
      }
    },
    [placing, phase, safeSetPlacing, safeSetError, safeSetPhase, safeSetResult]
  );

  /**
   * Transition drawing → result after the animation loop completes.
   * The page calls this once all drawn balls have been revealed.
   */
  const finishDraw = useCallback(() => {
    if (mountedRef.current && phase === 'drawing') {
      safeSetPhase('result');
    }
  }, [phase, safeSetPhase]);

  /** Reset for a fresh round. */
  const reset = useCallback(() => {
    safeSetPhase('betting');
    safeSetResult(null);
    safeSetError(null);
    safeSetPlacing(false);
  }, [safeSetPhase, safeSetResult, safeSetError, safeSetPlacing]);

  /** Clear only the inline error banner. */
  const clearError = useCallback(() => {
    safeSetError(null);
  }, [safeSetError]);

  return { phase, setPhase, placing, result, error, place, finishDraw, reset, clearError };
}
