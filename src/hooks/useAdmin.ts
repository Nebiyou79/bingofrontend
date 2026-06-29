/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * hooks/useAdmin.ts
 * React hooks for every admin data domain.
 * All hooks follow the same pattern:
 *   { data, loading, error, refetch, ...actions }
 */

import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api/adminApi';
import type {
  DashboardData, AdminUser, Transaction, Jackpot, Pagination,
  AutoWinState, SpinLockState, CrashLockState,
  KenoLockState, PlinkoLockState, MinesLockState, SlotsLockState,
} from '../lib/api/adminApi';

// ── Shared helpers ─────────────────────────────────────────────────────────────

function useAsync<T>(
  fetcher: () => Promise<{ success: boolean } & Record<string, any>>,
  dataKey: string,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (res.success) setData(res[dataKey] as T);
      else setError((res as any).error ?? 'Request failed');
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load, setData };
}

/**
 * Generic hook factory for game-lock controls.
 * Manages state, audit log, busy flag, and enable/disable actions.
 */
function useLock<S extends object>(
  fetchFn: () => Promise<{ success: boolean } & Record<string, any>>,
  stateKey: string,
  enableFn: (data: any) => Promise<{ success: boolean; message: string } & Record<string, any>>,
  disableFn: (notes?: string) => Promise<{ success: boolean; message: string } & Record<string, any>>,
) {
  const [state, setState]       = useState<S | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      if (res.success) {
        setState(res[stateKey] as S);
        setAuditLog(res.auditLog ?? []);
      } else {
        setError((res as any).error ?? 'Failed');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const enable = async (data: any = {}) => {
    setBusy(true);
    try {
      const res = await enableFn(data);
      if (res.success) await load();
      return res;
    } finally {
      setBusy(false);
    }
  };

  const disable = async (notes?: string) => {
    setBusy(true);
    try {
      const res = await disableFn(notes);
      if (res.success) await load();
      return res;
    } finally {
      setBusy(false);
    }
  };

  return { state, auditLog, loading, busy, error, refetch: load, enable, disable };
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useAsync<DashboardData>(() => api.fetchDashboard(), 'dashboard');
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useAdminAnalytics(period: string, from?: string, to?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.fetchAnalytics(period, from, to);
      if (res.success) setData(res);
      else setError(res.error ?? 'Failed');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [period, from, to]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useAdminUsers(initialParams: Record<string, any> = {}) {
  const [params, setParams]         = useState(initialParams);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.fetchUsers(params);
      if (res.success) {
        setUsers(res.users);
        setPagination(res.pagination);
      } else setError((res as any).error ?? 'Failed');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const suspend = async (id: string, reason?: string) => {
    const res = await api.suspendUser(id, reason);
    if (res.success) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: false, isSuspended: true } : u));
    }
    return res;
  };

  const unsuspend = async (id: string) => {
    const res = await api.unsuspendUser(id);
    if (res.success) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: true, isSuspended: false } : u));
    }
    return res;
  };

  const adjust = async (id: string, amount: number, type: string, notes?: string) => {
    const res = await api.adjustBalance(id, amount, type, notes);
    if (res.success) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, balance: res.newBalance } : u));
    }
    return res;
  };

  return {
    users, pagination, loading, error,
    params, setParams,
    refetch: load,
    suspend, unsuspend, adjust,
  };
}

export function useAdminUser(id: string) {
  const [user, setUser]         = useState<AdminUser | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await api.fetchUserById(id);
      if (res.success) {
        setUser(res.user);
        setRecentTx(res.recentTransactions);
        setStats(res.stats);
      } else setError((res as any).error ?? 'Not found');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const suspend = async (reason?: string) => {
    const res = await api.suspendUser(id, reason);
    if (res.success && user) setUser({ ...user, isActive: false, isSuspended: true });
    return res;
  };

  const unsuspend = async () => {
    const res = await api.unsuspendUser(id);
    if (res.success && user) setUser({ ...user, isActive: true, isSuspended: false });
    return res;
  };

  const adjust = async (amount: number, type: string, notes?: string) => {
    const res = await api.adjustBalance(id, amount, type, notes);
    if (res.success && user) setUser({ ...user, balance: res.newBalance });
    return res;
  };

  return { user, recentTx, stats, loading, error, refetch: load, suspend, unsuspend, adjust };
}

// ── Transactions ──────────────────────────────────────────────────────────────

export function useAdminTransactions(initialParams: Record<string, any> = {}) {
  const [params, setParams]               = useState(initialParams);
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [pagination, setPagination]       = useState<Pagination | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.fetchAllTransactions(params);
      if (res.success) { setTransactions(res.transactions); setPagination(res.pagination); }
      else setError((res as any).error ?? 'Failed');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const updateTxStatus = (id: string, status: string) =>
    setTransactions(prev => prev.map(t => t._id === id ? { ...t, status } : t));

  const approve = async (tx: Transaction) => {
    setActionLoading(tx._id);
    try {
      const res = tx.type === 'deposit'
        ? await api.approveDeposit(tx._id)
        : await api.approveWithdrawal(tx._id);
      if (res.success) updateTxStatus(tx._id, 'approved');
      return res;
    } finally { setActionLoading(null); }
  };

  const reject = async (tx: Transaction, notes?: string) => {
    setActionLoading(tx._id);
    try {
      const res = tx.type === 'deposit'
        ? await api.rejectDeposit(tx._id, notes)
        : await api.rejectWithdrawal(tx._id, notes);
      if (res.success) updateTxStatus(tx._id, 'rejected');
      return res;
    } finally { setActionLoading(null); }
  };

  return {
    transactions, pagination, loading, error, actionLoading,
    params, setParams, refetch: load, approve, reject,
  };
}

export function usePendingTransactions() {
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchPendingTransactions();
      if (res.success) setTransactions(res.transactions);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeTx = (id: string) =>
    setTransactions(prev => prev.filter(t => t._id !== id));

  const approve = async (tx: Transaction) => {
    setActionLoading(tx._id);
    try {
      const res = tx.type === 'deposit'
        ? await api.approveDeposit(tx._id)
        : await api.approveWithdrawal(tx._id);
      if (res.success) removeTx(tx._id);
      return res;
    } finally { setActionLoading(null); }
  };

  const reject = async (tx: Transaction, notes?: string) => {
    setActionLoading(tx._id);
    try {
      const res = tx.type === 'deposit'
        ? await api.rejectDeposit(tx._id, notes)
        : await api.rejectWithdrawal(tx._id, notes);
      if (res.success) removeTx(tx._id);
      return res;
    } finally { setActionLoading(null); }
  };

  return { transactions, loading, actionLoading, refetch: load, approve, reject };
}

// ── Jackpots ──────────────────────────────────────────────────────────────────

export function useAdminJackpots() {
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.fetchJackpots();
      if (res.success) setJackpots(res.jackpots);
      else setError((res as any).error ?? 'Failed');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateJp = (updated: Jackpot) =>
    setJackpots(prev => prev.map(j => j.type === updated.type ? updated : j));

  const seed = async (type: string, amount: number) => {
    setBusy(type);
    try {
      const res = await api.seedJackpot(type, amount);
      if (res.success) updateJp(res.jackpot);
      return res;
    } finally { setBusy(null); }
  };

  const reset = async (type: string) => {
    setBusy(type);
    try {
      const res = await api.resetJackpot(type);
      if (res.success) updateJp(res.jackpot);
      return res;
    } finally { setBusy(null); }
  };

  const toggle = async (type: string, isActive: boolean) => {
    setBusy(type);
    try {
      const res = await api.toggleJackpot(type, isActive);
      if (res.success) updateJp(res.jackpot);
      return res;
    } finally { setBusy(null); }
  };

  return { jackpots, loading, error, busy, refetch: load, seed, reset, toggle };
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.fetchSettings();
      if (res.success) setSettings(res.settings);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (data: any) => {
    setSaving(true); setSaved(false);
    try {
      const res = await api.updateSettings(data);
      if (res.success) { setSettings(res.settings); setSaved(true); setTimeout(() => setSaved(false), 3000); }
      return res;
    } finally { setSaving(false); }
  };

  return { settings, loading, saving, saved, error, save, refetch: load };
}

// ── Auto-win ──────────────────────────────────────────────────────────────────

export function useAutoWin() {
  const [state, setState]       = useState<AutoWinState | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchAutoWinAudit();
      if (res.success) { setState(res.autoWin); setAuditLog(res.auditLog); }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const enable = async (data: Parameters<typeof api.enableAutoWin>[0]) => {
    setBusy(true);
    try {
      const res = await api.enableAutoWin(data);
      if (res.success) { setState(res.autoWin); await load(); }
      return res;
    } finally { setBusy(false); }
  };

  const disable = async (notes?: string) => {
    setBusy(true);
    try {
      const res = await api.disableAutoWin(notes);
      if (res.success) setState(prev => prev ? { ...prev, enabled: false, targetCardNumbers: [] } : prev);
      return res;
    } finally { setBusy(false); }
  };

  return { state, auditLog, loading, busy, refetch: load, enable, disable };
}

// ── Spin lock ─────────────────────────────────────────────────────────────────

/**
 * Controls the global spin lock.
 * When enabled every spin returns a loss or refund (no wins).
 *
 * @example
 * const { state, busy, enable, disable } = useSpinLock();
 * await enable({ notes: 'maintenance window' });
 * await disable('done');
 */
export function useSpinLock() {
  return useLock<SpinLockState>(
    api.fetchSpinLock,
    'spinLock',
    api.enableSpinLock,
    api.disableSpinLock,
  );
}

// ── Crash lock ────────────────────────────────────────────────────────────────

/**
 * Controls the crash game lock.
 * Modes: 'instant' (always crash at 1×) or 'capped' (crash ≤ maxMultiplier).
 *
 * @example
 * const { state, enable, disable } = useCrashLock();
 * await enable({ mode: 'capped', maxMultiplier: 1.5, gamesLimit: 10 });
 */
export function useCrashLock() {
  return useLock<CrashLockState>(
    api.fetchCrashLock,
    'crashLock',
    api.enableCrashLock,
    api.disableCrashLock,
  );
}

// ── Keno lock ─────────────────────────────────────────────────────────────────

/**
 * Controls the keno draw lock.
 * Strategies:
 *   'minimize_payout' — picks the draw with the lowest total projected payout.
 *   'avoid_picks'     — avoids the most commonly picked numbers (subtler).
 *
 * @example
 * const { state, enable, disable } = useKenoLock();
 * await enable({ strategy: 'avoid_picks', sampleSize: 300, gamesLimit: 5 });
 */
export function useKenoLock() {
  return useLock<KenoLockState>(
    api.fetchKenoLock,
    'kenoLock',
    api.enableKenoLock,
    api.disableKenoLock,
  );
}

// ── Plinko lock ───────────────────────────────────────────────────────────────

/**
 * Controls the plinko ball-path lock.
 * centerSpread: how many buckets either side of centre are considered "safe".
 *   0 → exact centre only, 1 → centre ± 1 bucket, 2 → centre ± 2 buckets.
 *
 * @example
 * const { state, enable, disable } = usePlinkoLock();
 * await enable({ centerSpread: 1, gamesLimit: 20 });
 */
export function usePlinkoLock() {
  return useLock<PlinkoLockState>(
    api.fetchPlinkoLock,
    'plinkoLock',
    api.enablePlinkoLock,
    api.disablePlinkoLock,
  );
}

// ── Mines lock ────────────────────────────────────────────────────────────────

/**
 * Controls the mines game lock.
 * Strategies:
 *   'front_load'   — mines placed at the lowest tile indices.
 *   'high_index'   — mines placed at the highest tile indices.
 *   'random_dense' — normal random placement but with extra hidden mines.
 *
 * @example
 * const { state, enable, disable } = useMinesLock();
 * await enable({ strategy: 'random_dense', extraMines: 3, gamesLimit: 50 });
 */
export function useMinesLock() {
  return useLock<MinesLockState>(
    api.fetchMinesLock,
    'minesLock',
    api.enableMinesLock,
    api.disableMinesLock,
  );
}

// ── Slots lock ────────────────────────────────────────────────────────────────

/**
 * Controls the slots lock.
 * Modes: 'no_win' (all spins lose) or 'min_win' (only minimum-payout wins allowed).
 *
 * @example
 * const { state, enable, disable } = useSlotsLock();
 * await enable({ mode: 'no_win', gamesLimit: 100 });
 */
export function useSlotsLock() {
  return useLock<SlotsLockState>(
    api.fetchSlotsLock,
    'slotsLock',
    api.enableSlotsLock,
    api.disableSlotsLock,
  );
}

// ── Bingo rooms ───────────────────────────────────────────────────────────────

export function useAdminBingo(initialParams: Record<string, any> = {}) {
  const [params, setParams]         = useState(initialParams);
  const [rooms, setRooms]           = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchBingoRooms(params);
      if (res.success) { setRooms(res.rooms); setPagination(res.pagination); }
    } catch (_) {}
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);
  return { rooms, pagination, loading, params, setParams, refetch: load };
}

// ── Keno rounds ───────────────────────────────────────────────────────────────

export function useAdminKeno(initialParams: Record<string, any> = {}) {
  const [params, setParams]         = useState(initialParams);
  const [rounds, setRounds]         = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchKenoRounds(params);
      if (res.success) { setRounds(res.rounds); setPagination(res.pagination); }
    } catch (_) {}
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);
  return { rounds, pagination, loading, params, setParams, refetch: load };
}

// ── Pool games ────────────────────────────────────────────────────────────────

export function useAdminPool(initialParams: Record<string, any> = {}) {
  const [params, setParams]         = useState(initialParams);
  const [games, setGames]           = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchPoolGames(params);
      if (res.success) { setGames(res.games); setPagination(res.pagination); }
    } catch (_) {}
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);
  return { games, pagination, loading, params, setParams, refetch: load };
}