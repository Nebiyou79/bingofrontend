// hooks/useChicken.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chickenApi } from '@/lib/api/chickenApi';
import type {
  ChickenSession,
  Difficulty,
  RevealResponse,
} from '@/lib/api/chickenApi';

export type Phase = 'betting' | 'playing' | 'result';

export interface UseChickenState {
  phase: Phase;
  session: ChickenSession | null;
  loading: boolean;
  error: string | null;
  lastResult: {
    outcome: 'lost' | 'road_cleared' | 'cashed_out';
    layout: boolean[];
    serverSeed: string;
    payout: number;
  } | null;
}

interface UseChickenOptions {
  token: string;
  onBalanceUpdate?: (newBalance: number) => void;
}

const INITIAL_STATE: UseChickenState = {
  phase: 'betting',
  session: null,
  loading: false,
  error: null,
  lastResult: null,
};

export function useChicken({ token, onBalanceUpdate }: UseChickenOptions) {
  const [state, setState] = useState<UseChickenState>(() => ({ ...INITIAL_STATE }));

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSet = useCallback((updater: (prev: UseChickenState) => UseChickenState) => {
    if (!mountedRef.current) return;
    setState(updater);
  }, []);

  // Restore active session on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await chickenApi.getCurrent(token);
      if (!res.success) return;
      if (res.session) {
        safeSet((p) => ({ ...p, session: res.session, phase: 'playing' }));
      }
    })();
  }, [token, safeSet]);

  // ── start ─────────────────────────────────────────────────────────────
  const start = useCallback(
    async (betAmount: number, difficulty: Difficulty, laneCount?: number) => {
      safeSet((p) => ({ ...p, loading: true, error: null }));

      const res = await chickenApi.start(token, betAmount, difficulty, laneCount);

      if (!res.success) {
        safeSet((p) => ({ ...p, loading: false, error: res.error }));
        return;
      }

      onBalanceUpdate?.(res.newBalance);
      safeSet((p) => ({
        ...p,
        loading: false,
        phase: 'playing',
        session: res.session,
        lastResult: null,
      }));
    },
    [token, safeSet, onBalanceUpdate]
  );

  // ── reveal (cross next lane) ─────────────────────────────────────────
  const reveal = useCallback(async () => {
    safeSet((p) => ({ ...p, loading: true, error: null }));

    const session = state.session;
    if (!session) {
      safeSet((p) => ({ ...p, loading: false, error: 'No active session' }));
      return;
    }

    const res: RevealResponse = await chickenApi.reveal(token, session.sessionId);

    if (!res.success) {
      safeSet((p) => ({ ...p, loading: false, error: res.error }));
      return;
    }

    if (res.result === 'safe') {
      safeSet((p) => ({ ...p, loading: false, session: res.session }));
      return;
    }

    if (res.result === 'lost') {
      safeSet((p) => ({
        ...p,
        loading: false,
        phase: 'result',
        session: res.session,
        lastResult: {
          outcome: 'lost',
          layout: res.layout,
          serverSeed: res.serverSeed,
          payout: 0,
        },
      }));
      return;
    }

    // road_cleared
    onBalanceUpdate?.(res.newBalance);
    safeSet((p) => ({
      ...p,
      loading: false,
      phase: 'result',
      session: res.session,
      lastResult: {
        outcome: 'road_cleared',
        layout: res.layout,
        serverSeed: res.serverSeed,
        payout: res.payout,
      },
    }));
  }, [token, state.session, safeSet, onBalanceUpdate]);

  // ── cashout ───────────────────────────────────────────────────────────
  const cashout = useCallback(async () => {
    safeSet((p) => ({ ...p, loading: true, error: null }));

    const session = state.session;
    if (!session) {
      safeSet((p) => ({ ...p, loading: false, error: 'No active session' }));
      return;
    }

    const res = await chickenApi.cashout(token, session.sessionId);

    if (!res.success) {
      safeSet((p) => ({ ...p, loading: false, error: res.error }));
      return;
    }

    onBalanceUpdate?.(res.newBalance);
    safeSet((p) => ({
      ...p,
      loading: false,
      phase: 'result',
      session: res.session,
      lastResult: {
        outcome: 'cashed_out',
        layout: res.layout,
        serverSeed: res.serverSeed,
        payout: res.payout,
      },
    }));
  }, [token, state.session, safeSet, onBalanceUpdate]);

  // ── reset ─────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    safeSet(() => ({ ...INITIAL_STATE }));
  }, [safeSet]);

  // ── clearError ────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    safeSet((p) => ({ ...p, error: null }));
  }, [safeSet]);

  return {
    ...state,
    start,
    reveal,
    cashout,
    reset,
    clearError,
  };
}
