/**
 * hooks/useCardDraw.ts
 * Core Card Draw game state machine.
 *
 * Phases:
 *   'betting'   → building bets, not submitted
 *   'revealing' → request in-flight, card animating
 *   'result'    → round settled, showing outcome
 *
 * The hook owns all server calls; the page drives UI state only.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { playCardDraw, getCardDrawHistory } from '../lib/api/cardDrawApi';
import type {
  CardDrawBet, CardDrawPlayResponse, CardDrawRound,
} from '../lib/api/cardDrawApi';

export type CardDrawPhase = 'betting' | 'revealing' | 'result';

export interface UseCardDrawReturn {
  phase:        CardDrawPhase;
  lastResult:   CardDrawPlayResponse | null;
  history:      CardDrawRound[];
  historyPage:  number;
  historyTotal: number;
  histLoading:  boolean;
  error:        string | null;

  play:         (bets: CardDrawBet[], clientSeed?: string) => Promise<CardDrawPlayResponse | null>;
  reset:        () => void;
  clearError:   () => void;
  loadHistory:  (page?: number) => Promise<void>;
}

export function useCardDraw(): UseCardDrawReturn {
  const [phase,        setPhase]        = useState<CardDrawPhase>('betting');
  const [lastResult,   setLastResult]   = useState<CardDrawPlayResponse | null>(null);
  const [history,      setHistory]      = useState<CardDrawRound[]>([]);
  const [historyPage,  setHistoryPage]  = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [histLoading,  setHistLoading]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const play = useCallback(async (bets: CardDrawBet[], clientSeed = '') => {
    if (phase !== 'betting') return null;
    if (!mountedRef.current) return null;

    setPhase('revealing');
    setError(null);

    try {
      const res = await playCardDraw(bets, clientSeed);
      if (!mountedRef.current) return null;

      if (!res.success) {
        setError((res as { error: string }).error ?? 'Something went wrong.');
        setPhase('betting');
        return null;
      }

      const r = res as CardDrawPlayResponse;
      setLastResult(r);
      setPhase('result');
      return r;
    } catch {
      if (mountedRef.current) {
        setError('Network error. Check your connection.');
        setPhase('betting');
      }
      return null;
    }
  }, [phase]);

  const loadHistory = useCallback(async (page = 1) => {
    if (!mountedRef.current) return;
    setHistLoading(true);
    try {
      const res = await getCardDrawHistory(page, 10);
      if (!mountedRef.current) return;
      if (res.success) {
        setHistory(res.rounds);
        setHistoryPage(res.pagination.page);
        setHistoryTotal(res.pagination.total);
      }
    } catch {
      // silently ignore history fetch errors
    } finally {
      if (mountedRef.current) setHistLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('betting');
    setLastResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    phase, lastResult, history, historyPage, historyTotal, histLoading,
    error, play, reset, clearError, loadHistory,
  };
}