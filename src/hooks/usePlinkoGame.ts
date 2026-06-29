// hooks/usePlinkoGame.ts
// DashBets — usePlinkoGame (updated for Plinko X)
//
// Changes:
//  - Exposes `currentMultiplier` so PlinkoCanvas can color the ball
//    appropriately (red=low, orange=mid, blue=high, matching reference)
//  - Balance update pattern unchanged (onBalanceUpdate callback)
//  - formRef pattern unchanged to avoid stale closures

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  placePlinkoBet,
  getPlinkoHistory,
  getPlinkoStats,
  type PlinkoBetResult,
  type PlinkoBetRecord,
  type PlinkoStats,
  type PlinkoRisk,
  type PlinkoRows,
  type BallStep,
} from '../lib/api/plinkoApi';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PlinkoFormState {
  betAmount: number;
  rows:      PlinkoRows;
  risk:      PlinkoRisk;
}

export interface PlinkoGameState {
  form:              PlinkoFormState;
  isDropping:        boolean;
  activePath:        BallStep[] | null;
  lastResult:        PlinkoBetResult | null;
  landedBucket:      number | null;
  currentMultiplier: number | null;   // ← NEW: for ball color during animation
  history:           PlinkoBetRecord[];
  historyPage:       number;
  historyTotal:      number;
  historyLoading:    boolean;
  stats:             PlinkoStats | null;
  statsLoading:      boolean;
  error:             string | null;
}

export function getAnimationDuration(rows: PlinkoRows): number {
  return rows * 80 + 400;
}

const INITIAL_FORM: PlinkoFormState = { betAmount: 10, rows: 16, risk: 'medium' };

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePlinkoGame(onBalanceUpdate?: (balance: number) => void) {
  const [state, setState] = useState<PlinkoGameState>({
    form:              INITIAL_FORM,
    isDropping:        false,
    activePath:        null,
    lastResult:        null,
    landedBucket:      null,
    currentMultiplier: null,
    history:           [],
    historyPage:       1,
    historyTotal:      0,
    historyLoading:    false,
    stats:             null,
    statsLoading:      false,
    error:             null,
  });

  const formRef       = useRef<PlinkoFormState>(INITIAL_FORM);
  const lastResultRef = useRef<PlinkoBetResult | null>(null);

  useEffect(() => {
    formRef.current = state.form;
  }, [state.form]);

  // ── Form setters ────────────────────────────────────────────────────────

  const setBetAmount = useCallback((betAmount: number) => {
    setState(s => ({ ...s, form: { ...s.form, betAmount }, error: null }));
  }, []);

  const setRows = useCallback((rows: PlinkoRows) => {
    setState(s => ({
      ...s,
      form:         { ...s.form, rows },
      landedBucket: null,
      error:        null,
    }));
  }, []);

  const setRisk = useCallback((risk: PlinkoRisk) => {
    setState(s => ({
      ...s,
      form:         { ...s.form, risk },
      landedBucket: null,
      error:        null,
    }));
  }, []);

  // ── Place bet ─────────────────────────────────────────────────────────

  const placeBet = useCallback(async () => {
    const { betAmount, rows, risk } = formRef.current;

    setState(s => {
      if (s.isDropping) return s;
      return {
        ...s,
        isDropping:        true,
        activePath:        null,
        lastResult:        null,
        landedBucket:      null,
        currentMultiplier: null,
        error:             null,
      };
    });

    try {
      const result = await placePlinkoBet({ betAmount, rows, risk });
      lastResultRef.current = result;

      setState(s => ({
        ...s,
        activePath:        result.path,
        lastResult:        result,
        currentMultiplier: result.multiplier,  // ← available immediately for ball color
      }));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place bet';
      setState(s => ({
        ...s,
        isDropping:        false,
        activePath:        null,
        currentMultiplier: null,
        error:             message,
      }));
    }
  }, [onBalanceUpdate]);

  // ── onAnimationEnd — called by PlinkoCanvas rAF loop ─────────────────

  const onAnimationEnd = useCallback(() => {
    const result = lastResultRef.current;
    setState(s => ({
      ...s,
      isDropping:   false,
      landedBucket: result?.bucketIndex ?? null,
    }));
    if (result?.newBalance !== undefined) {
      onBalanceUpdate?.(result.newBalance);
    }
  }, [onBalanceUpdate]);

  // ── History ──────────────────────────────────────────────────────────

  const loadHistory = useCallback(async (page = 1) => {
    setState(s => ({ ...s, historyLoading: true }));
    try {
      const data = await getPlinkoHistory(page);
      setState(s => ({
        ...s,
        history:        data.bets,
        historyPage:    data.pagination.page,
        historyTotal:   data.pagination.total,
        historyLoading: false,
      }));
    } catch {
      setState(s => ({ ...s, historyLoading: false }));
    }
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setState(s => ({ ...s, statsLoading: true }));
    try {
      const stats = await getPlinkoStats();
      setState(s => ({ ...s, stats, statsLoading: false }));
    } catch {
      setState(s => ({ ...s, statsLoading: false }));
    }
  }, []);

  return {
    ...state,
    setBetAmount,
    setRows,
    setRisk,
    placeBet,
    onAnimationEnd,
    loadHistory,
    loadStats,
  };
}