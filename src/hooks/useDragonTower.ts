// hooks/useDragonTower.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { dragonTowerApi } from '@/lib/api/dragonTowerApi';
import type {
  DragonTowerSession,
  Difficulty,
  RevealResponse,
} from '@/lib/api/dragonTowerApi';

export type Phase = 'betting' | 'playing' | 'result';

export interface UseDragonTowerState {
  phase: Phase;
  session: DragonTowerSession | null;
  loading: boolean;
  error: string | null;
  /** Set only once a round resolves (loss, full clear, or cashout) — carries the reveal layout for the reveal animation. */
  lastResult: {
    outcome: 'lost' | 'tower_cleared' | 'cashed_out';
    layout: boolean[][];
    serverSeed: string;
    payout: number;
  } | null;
}

interface UseDragonTowerOptions {
  token: string;
  onBalanceUpdate?: (newBalance: number) => void;
}

const INITIAL_STATE: UseDragonTowerState = {
  phase: 'betting',
  session: null,
  loading: false,
  error: null,
  lastResult: null,
};

export function useDragonTower({ token, onBalanceUpdate }: UseDragonTowerOptions) {
  const [state, setState] = useState<UseDragonTowerState>(() => ({ ...INITIAL_STATE }));

  // ── Unmount guard — mirrors useKeno.ts's mountedRef pattern exactly ──────
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** setState wrapper that no-ops after unmount, preventing "set state on
   *  unmounted component" warnings from in-flight requests resolving late. */
  const safeSet = useCallback((updater: (prev: UseDragonTowerState) => UseDragonTowerState) => {
    if (!mountedRef.current) return;
    setState(updater);
  }, []);

  // ── Restore any active session on mount (e.g. after a refresh) ──────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await dragonTowerApi.getCurrent(token);
      if (!res.success) return;
      if (res.session) {
        safeSet((p) => ({ ...p, session: res.session, phase: 'playing' }));
      }
    })();
  }, [token, safeSet]);

  // ── start ─────────────────────────────────────────────────────────────
  const start = useCallback(
    async (betAmount: number, difficulty: Difficulty, rows?: number) => {
      safeSet((p) => ({ ...p, loading: true, error: null }));

      const res = await dragonTowerApi.start(token, betAmount, difficulty, rows);

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

  // ── reveal ────────────────────────────────────────────────────────────
  const reveal = useCallback(
    async (col: number) => {
      safeSet((p) => ({ ...p, loading: true, error: null }));

      const session = state.session;
      if (!session) {
        safeSet((p) => ({ ...p, loading: false, error: 'No active session' }));
        return;
      }

      const res: RevealResponse = await dragonTowerApi.reveal(token, session.sessionId, col);

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

      // tower_cleared
      onBalanceUpdate?.(res.newBalance);
      safeSet((p) => ({
        ...p,
        loading: false,
        phase: 'result',
        session: res.session,
        lastResult: {
          outcome: 'tower_cleared',
          layout: res.layout,
          serverSeed: res.serverSeed,
          payout: res.payout,
        },
      }));
    },
    [token, state.session, safeSet, onBalanceUpdate]
  );

  // ── cashout ───────────────────────────────────────────────────────────
  const cashout = useCallback(async () => {
    safeSet((p) => ({ ...p, loading: true, error: null }));

    const session = state.session;
    if (!session) {
      safeSet((p) => ({ ...p, loading: false, error: 'No active session' }));
      return;
    }

    const res = await dragonTowerApi.cashout(token, session.sessionId);

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

  // ── reset — back to betting phase for a new round ────────────────────
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
