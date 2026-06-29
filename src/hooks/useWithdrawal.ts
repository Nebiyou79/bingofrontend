/**
 * hooks/useWithdrawal.ts
 * Simple state wrapper around the withdrawal API call.
 */

import { useState, useCallback } from 'react';
import { requestWithdrawal as apiWithdraw } from '../lib/api/walletApi';
import type { Transaction, DepositMethod } from '../lib/api/walletApi';

interface WithdrawalState {
  loading: boolean;
  error: string | null;
  success: boolean;
  submittedTx: Partial<Transaction> | null;
}

export interface UseWithdrawalReturn extends WithdrawalState {
  submitWithdrawal: (
    amount: number,
    method: DepositMethod,
    agentPhone: string,
    agentName?: string
  ) => Promise<void>;
  reset: () => void;
}

/** Manages withdrawal submission state. Call reset() to re-enable the form. */
export function useWithdrawal(): UseWithdrawalReturn {
  const [state, setState] = useState<WithdrawalState>({
    loading: false,
    error: null,
    success: false,
    submittedTx: null,
  });

  /**
   * Submit a withdrawal request. On success, balance is frozen server-side immediately.
   */
  const submitWithdrawal = useCallback(
    async (amount: number, method: DepositMethod, agentPhone: string, agentName?: string) => {
      setState({ loading: true, error: null, success: false, submittedTx: null });
      try {
        const res = await apiWithdraw(amount, method, agentPhone, agentName);
        if (!res.success) {
          setState({ loading: false, error: (res as { error: string }).error, success: false, submittedTx: null });
          return;
        }
        setState({ loading: false, error: null, success: true, submittedTx: res.transaction });
      } catch {
        setState({ loading: false, error: 'Network error. Please try again.', success: false, submittedTx: null });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false, submittedTx: null });
  }, []);

  return { ...state, submitWithdrawal, reset };
}