/**
 * hooks/useTransactions.ts
 * Paginated transaction list with type/status filter controls.
 */

import { useState, useEffect, useCallback } from 'react';
import { getTransactions } from '../lib/api/walletApi';
import type { Transaction, Pagination } from '../lib/api/walletApi';

interface Filters {
  type?: Transaction['type'] | '';
  status?: Transaction['status'] | '';
}

interface TransactionState {
  transactions: Transaction[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

export interface UseTransactionsReturn extends TransactionState {
  filters: Filters;
  setFilters: (f: Filters) => void;
  goToPage: (page: number) => void;
}

const DEFAULT_PAGINATION: Pagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

/**
 * Fetches transactions on mount and whenever filters or page change.
 * setFilters() resets to page 1 automatically.
 */
export function useTransactions(): UseTransactionsReturn {
  const [page, setPage] = useState(1);
  const [filters, setFiltersState] = useState<Filters>({});
  const [state, setState] = useState<TransactionState>({
    transactions: [],
    pagination: DEFAULT_PAGINATION,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await getTransactions(
        page,
        20,
        filters.type === '' ? undefined : filters.type,
        filters.status === '' ? undefined : filters.status,
      );
      if (res.success) {
        setState({ transactions: res.transactions, pagination: res.pagination, loading: false, error: null });
      } else {
        setState(s => ({ ...s, loading: false, error: (res as { error: string }).error }));
      }
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Failed to load transactions' }));
    }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const setFilters = useCallback((f: Filters) => {
    setFiltersState(f);
    setPage(1); // reset to first page when filter changes
  }, []);

  return { ...state, filters, setFilters, goToPage: setPage };
}