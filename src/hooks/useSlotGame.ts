// hooks/useSlotGame.ts
import { useState, useCallback, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import {
  spinSlot, gambleGuess, collectGambleWin,
  SpinResult, GambleResult, GambleState,
} from '@/lib/api/slotApi';

// Minimum time the animation window stays open after the API responds.
// Gives reels time to finish their CSS animation + commitSettle rAF.
// The longest reel stops at 1700ms; add 400ms buffer = 2100ms minimum total,
// but we measure from API response time, so the post-API delay is what matters.
const REEL_ANIMATION_MS   = 2000;  // total window from spin start
const MIN_POST_API_DELAY  = 400;   // minimum ms to wait after API responds

export function useSlotGame() {
  const { checkAuth } = useAuthContext();

  const [isSpinning,    setIsSpinning]    = useState(false);
  const [isAnimating,   setIsAnimating]   = useState(false);
  const [lastSpin,      setLastSpin]      = useState<SpinResult | null>(null);
  const [pendingSpin,   setPendingSpin]   = useState<SpinResult | null>(null);
  const [gambleState,   setGambleState]   = useState<GambleState | null>(null);
  const [currentSpinId, setCurrentSpinId] = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [lastWin,       setLastWin]       = useState(0);

  const spinLockRef  = useRef(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spin = useCallback(async (betAmount: number, clientSeed?: string) => {
    if (spinLockRef.current || isSpinning) return null;
    spinLockRef.current = true;

    setIsSpinning(true);
    setIsAnimating(true);
    setError(null);
    setGambleState(null);
    setPendingSpin(null);
    setLastWin(0);
    setLastSpin(null);

    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }

    const spinStart = Date.now();

    try {
      // Run API call — animation has already started above
      const result = await spinSlot(betAmount, clientSeed);
      const elapsed = Date.now() - spinStart;

      // Publish result immediately — reels may still be animating
      setLastSpin(result);
      setPendingSpin(result);
      setCurrentSpinId(result.spinId);
      setLastWin(result.totalPayout);

      checkAuth().catch(() => {});

      if (result.isWin && result.canGamble) {
        setGambleState({
          originalWin: result.totalPayout,
          currentWin:  result.totalPayout,
          attempts:    0,
          status:      'active',
        });
      }

      // Wait until both:
      //   (a) the full REEL_ANIMATION_MS window has passed from spin start, AND
      //   (b) at least MIN_POST_API_DELAY ms have passed since API responded.
      // This handles both fast API (normal case) and slow API (>2s) cases.
      const remainingFromStart = REEL_ANIMATION_MS - elapsed;
      const waitMs = Math.max(remainingFromStart, MIN_POST_API_DELAY);
      console.log(`[useSlotGame] API responded in ${elapsed}ms — waiting ${waitMs}ms before clearing animation`);

      await new Promise<void>(r => setTimeout(r, waitMs));

      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Spin failed');
      return null;
    } finally {
      setIsSpinning(false);
      animTimerRef.current = setTimeout(() => {
        console.log('[useSlotGame] clearing isAnimating');
        setIsAnimating(false);
        spinLockRef.current = false;
      }, 50);
    }
  }, [isSpinning, checkAuth]);

  const gamble = useCallback(async (guess: 'red' | 'black'): Promise<GambleResult | null> => {
    if (!currentSpinId || !gambleState || gambleState.status !== 'active') return null;
    setError(null);
    try {
      const result = await gambleGuess(currentSpinId, guess);
      setGambleState({ originalWin: gambleState.originalWin, currentWin: result.currentWin, attempts: result.attempts, status: result.status });
      if (result.status === 'lost') { setLastWin(0); await checkAuth(); }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gamble failed');
      return null;
    }
  }, [currentSpinId, gambleState, checkAuth]);

  const collectWin = useCallback(async (): Promise<void> => {
    if (!currentSpinId || !gambleState || gambleState.status !== 'active') return;
    setError(null);
    try {
      const result = await collectGambleWin(currentSpinId);
      setLastWin(result.collected);
      setGambleState(prev => prev ? { ...prev, status: 'collected' } : null);
      await checkAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Collect failed');
    }
  }, [currentSpinId, gambleState, checkAuth]);

  const dismissGamble = useCallback(() => setGambleState(null), []);

  return {
    spin, gamble, collectWin, dismissGamble,
    isSpinning, isAnimating,
    lastSpin, pendingSpin, gambleState, currentSpinId, error, lastWin,
  };
}