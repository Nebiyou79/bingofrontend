/**
 * hooks/useDeposit.ts
 * State machine for the two-step deposit flow with a 15-minute countdown.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { initiateDeposit as apiInitiate, confirmDeposit as apiConfirm } from '../lib/api/walletApi';
import type { InitiatedDeposit, DepositMethod } from '../lib/api/walletApi';

export type DepositStep = 'idle' | 'initiated' | 'confirming' | 'submitted' | 'error';

interface DepositState {
  step: DepositStep;
  pendingTx: InitiatedDeposit | null;
  countdown: number;       // seconds remaining
  error: string | null;
  loading: boolean;
}

export interface UseDepositReturn extends DepositState {
  initiateDeposit: (amount: number, method: DepositMethod) => Promise<void>;
  confirmDeposit: (reference: string, receiptFile?: File) => Promise<void>;
  moveToConfirm: () => void;       // ← ADDED
  backToInitiated: () => void;     // ← ADDED
  reset: () => void;
}

const WINDOW_SECONDS = 15 * 60;

/**
 * Drives the deposit UI state machine.
 * Countdown ticks every second and auto-expires the flow at zero.
 */
export function useDeposit(): UseDepositReturn {
  const [state, setState] = useState<DepositState>({
    step: 'idle',
    pendingTx: null,
    countdown: WINDOW_SECONDS,
    error: null,
    loading: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Start the 15-minute countdown timer. */
  const startCountdown = useCallback((expiresAt: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        setState(s => ({ ...s, step: 'error', error: 'Deposit window expired. Please start a new deposit.' }));
      } else {
        setState(s => ({ ...s, countdown: remaining }));
      }
    }, 1000);
  }, []);

  /** Clean up interval on unmount. */
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  /**
   * Step 1 — calls POST /api/wallet/deposit/initiate.
   * On success, starts the countdown and moves to the 'initiated' step.
   */
  const initiateDeposit = useCallback(async (amount: number, method: DepositMethod) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await apiInitiate(amount, method);
      if (!res.success) {
        setState(s => ({ ...s, loading: false, error: (res as { error: string }).error, step: 'error' }));
        return;
      }
      const tx = res as unknown as InitiatedDeposit;
      const remaining = Math.max(0, Math.floor((new Date(tx.expiresAt).getTime() - Date.now()) / 1000));
      setState({
        step: 'initiated',
        pendingTx: tx,
        countdown: remaining,
        error: null,
        loading: false,
      });
      startCountdown(tx.expiresAt);
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Network error. Please try again.', step: 'error' }));
    }
  }, [startCountdown]);

  /**
   * Step 2 — calls POST /api/wallet/deposit/confirm with reference + optional receipt.
   * On success, moves to 'submitted'.
   */
  const confirmDeposit = useCallback(async (reference: string, receiptFile?: File) => {
    const txId = state.pendingTx?.transactionId;
    if (!txId) return;

    setState(s => ({ ...s, loading: true, error: null, step: 'confirming' }));
    try {
      const res = await apiConfirm(txId, reference, receiptFile);
      if (!res.success) {
        setState(s => ({ ...s, loading: false, error: (res as { error: string }).error, step: 'error' }));
        return;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState(s => ({ ...s, step: 'submitted', loading: false }));
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Network error. Please try again.', step: 'error' }));
    }
  }, [state.pendingTx]);

  /** Move from 'initiated' to 'confirming' step. */
  const moveToConfirm = useCallback(() => {
    setState(s => ({ ...s, step: 'confirming', error: null }));
  }, []);

  /** Move back from 'confirming' to 'initiated' step. */
  const backToInitiated = useCallback(() => {
    setState(s => ({ ...s, step: 'initiated', error: null }));
  }, []);

  /** Reset to 'idle', clear all transient state and the countdown. */
  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ step: 'idle', pendingTx: null, countdown: WINDOW_SECONDS, error: null, loading: false });
  }, []);

  return { ...state, initiateDeposit, confirmDeposit, moveToConfirm, backToInitiated, reset };
}