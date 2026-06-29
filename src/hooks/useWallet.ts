/**
 * hooks/useWallet.ts
 * Fetches and exposes the authenticated user's wallet balance.
 */

import { useState, useEffect, useCallback } from 'react';
import { getBalance } from '../lib/api/walletApi';

interface WalletState {
  balance: number;
  bonusBalance: number;
  total: number;
  loading: boolean;
  error: string | null;
}

export interface UseWalletReturn extends WalletState {
  /** Manually re-fetch the balance (call after a deposit or withdrawal). */
  refetch: () => Promise<void>;
}

/**
 * Fetches balance on mount and exposes a refetch() for manual refreshes.
 */
export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    balance: 0,
    bonusBalance: 0,
    total: 0,
    loading: true,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await getBalance();
      if (res.success) {
        setState({
          balance: res.balance,
          bonusBalance: res.bonusBalance,
          total: res.total,
          loading: false,
          error: null,
        });
      } else {
        setState(s => ({ ...s, loading: false, error: (res as { error: string }).error }));
      }
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Failed to fetch balance' }));
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  return { ...state, refetch: fetchBalance };
}