/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * hooks/useSpinData.ts  v2.0
 *
 * Updated for new outcome types and jackpot route fallback.
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { getHistory, getUserSpinStats, verifySpin, getWheelInfo } from '../lib/api/spinApi';
import type { SpinOutcome } from '../lib/api/spinApi';
import { useJackpotStore } from '../stores';

// ─── Token guard ──────────────────────────────────────────────────────────────

function hasToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('dashbets_token');
}

// ─── Spin History ─────────────────────────────────────────────────────────────

export interface HistoryFilters {
  result: SpinOutcome | 'all';
  status: 'settled' | 'refunded' | 'all';
  from?: string;
  to?:   string;
}

export function useSpinHistory(limit = 20) {
  const [page, setPage]       = useState(1);
  const [filters, setFilters] = useState<HistoryFilters>({ result: 'all', status: 'all' });

  const query = useQuery({
    queryKey: ['spinHistory', page, limit, filters],
    queryFn:  () => getHistory(page, limit, filters),
    staleTime: 30_000,
    retry: 1,
    enabled: hasToken(),
    placeholderData: (prev: any) => prev,
  });

  const applyFilters = useCallback((f: Partial<HistoryFilters>) => {
    setFilters((p) => ({ ...p, ...f }));
    setPage(1);
  }, []);

  return {
    ...query,
    bets:       query.data?.success ? query.data.bets       : [],
    pagination: query.data?.success ? query.data.pagination : null,
    todayStats: query.data?.success ? query.data.todayStats : null,
    page,
    filters,
    goToPage:     useCallback((p: number) => setPage(Math.max(1, p)), []),
    applyFilters,
  };
}

// ─── Spin Stats ───────────────────────────────────────────────────────────────

export function useSpinStats() {
  return useQuery({
    queryKey: ['spinStats'],
    queryFn:  getUserSpinStats,
    staleTime: 60_000,
    retry: 1,
    enabled: hasToken(),
    select: (res: any) => res.success ? res.stats : null,
  });
}

// ─── Provably Fair Verify ─────────────────────────────────────────────────────

export function useVerifySpin() {
  const [betId, setBetId] = useState('');

  const query = useQuery({
    queryKey: ['verifyBet', betId],
    queryFn:  () => verifySpin(betId),
    enabled:  betId.length > 10 && hasToken(),
    staleTime: Infinity,
    retry: false,
  });

  return {
    ...query,
    betId,
    setBetId,
    result:  query.data?.success ? query.data : null,
    isError: !!(query.data && !query.data.success),
  };
}

// ─── Jackpots (with 404 graceful fallback) ────────────────────────────────────

type RouteState = 'unknown' | 'ok' | 'missing';
let jackpotRouteState: RouteState = 'unknown';

async function fetchJackpots() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dashbets_token') ?? '' : '';
  if (!token) return null;

  const res = await fetch('/api/games/jackpots', { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) { jackpotRouteState = 'missing'; return null; }
  if (!res.ok) throw new Error(`Jackpot fetch ${res.status}`);
  jackpotRouteState = 'ok';
  return res.json();
}

export function useJackpots() {
  const pools      = useJackpotStore((s) => s.pools);
  const setPools   = useJackpotStore((s) => s.setPools);
  const lastWinner = useJackpotStore((s) => s.lastWinner);

  const query = useQuery({
    queryKey: ['jackpots'],
    queryFn:  fetchJackpots,
    refetchInterval: () => jackpotRouteState === 'missing' ? false : 10_000,
    staleTime: 9_000,
    retry: false,
    enabled: hasToken(),
    onSuccess: (data: any) => {
      if (data?.success && Array.isArray(data.jackpots)) setPools(data.jackpots);
    },
  } as any);

  return {
    pools:      Object.values(pools),
    lastWinner,
    isLoading:  query.isLoading && jackpotRouteState === 'unknown',
    routeReady: jackpotRouteState === 'ok',
  };
}

// ─── Wheel Info ───────────────────────────────────────────────────────────────

export function useWheelInfo() {
  return useQuery({
    queryKey: ['wheelInfo'],
    queryFn:  getWheelInfo,
    staleTime: 5 * 60_000,
    retry: 1,
    enabled: hasToken(),
    select: (res: any) => res.success ? res : null,
  });
}