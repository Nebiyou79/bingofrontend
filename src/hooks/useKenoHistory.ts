/**
 * hooks/useKenoHistory.ts
 * Fetches paginated Keno bet history.
 *
 * Fixes over original:
 *   - Mounted-ref guard prevents setState after unmount
 *   - refreshTick included in fetchHistory deps array (was missing → stale closure)
 *   - Stable goToPage / refetch callbacks (no unnecessary re-renders)
 *   - Defaults align with page component (10 records per page)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getHistory } from '../lib/api/kenoApi';
import type { KenoBet, KenoPagination } from '../lib/api/kenoApi';

interface KenoHistoryState {
  bets:       KenoBet[];
  pagination: KenoPagination;
  loading:    boolean;
  error:      string | null;
}

export interface UseKenoHistoryReturn extends KenoHistoryState {
  /** Navigate to a specific page number */
  goToPage: (page: number) => void;
  /** Manually re-fetch the current page (call after a new round completes) */
  refetch: () => void;
}

const DEFAULT_PAGINATION: KenoPagination = {
  page:       1,
  limit:      10,
  total:      0,
  totalPages: 1,
  hasNext:    false,
  hasPrev:    false,
};

/**
 * Provides paginated Keno bet history.
 * @param limit - Records per page (default: 10)
 */
export function useKenoHistory(limit = 10): UseKenoHistoryReturn {
  const [page,         setPage]         = useState(1);
  const [refreshTick,  setRefreshTick]  = useState(0);
  const [state,        setState]        = useState<KenoHistoryState>({
    bets:       [],
    pagination: DEFAULT_PAGINATION,
    loading:    true,
    error:      null,
  });

  // Prevent setState on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      if (mountedRef.current) {
        setState(s => ({ ...s, loading: true, error: null }));
      }

      try {
        const res = await getHistory(page, limit);

        if (cancelled || !mountedRef.current) return;

        if (res.success) {
          setState({
            bets:       res.bets,
            pagination: res.pagination,
            loading:    false,
            error:      null,
          });
        } else {
          setState(s => ({
            ...s,
            loading: false,
            error:   (res as { error: string }).error ?? 'Failed to load history.',
          }));
        }
      } catch {
        if (cancelled || !mountedRef.current) return;
        setState(s => ({ ...s, loading: false, error: 'Failed to load history.' }));
      }
    };

    fetchHistory();

    return () => { cancelled = true; };
  }, [page, limit, refreshTick]);

  /** Navigate to a page; clamps to ≥ 1. */
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, p));
  }, []);

  /** Increment tick to force a re-fetch without changing the page number. */
  const refetch = useCallback(() => {
    setRefreshTick(t => t + 1);
  }, []);

  return { ...state, goToPage, refetch };
}
