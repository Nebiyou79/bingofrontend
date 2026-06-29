/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * hooks/useSpin.ts  v4.0
 *
 * FIXES:
 *  1. Removed checkAuth() from onSuccess — it triggered a re-render that
 *     wiped result state before WinModal could read it, AND reset isSpinning
 *     to an indeterminate state that kept the wheel spinning.
 *  2. Balance is updated directly from res.newBalance (no auth refetch needed).
 *  3. setSpinning(false) is called in onSettled AFTER setResult — guarantees
 *     SpinWheel receives isSpinning=false AND stopAngle together in the same
 *     render cycle, which triggers the landing animation correctly.
 *  4. clearResult() now also resets stopAngle (via store) so the next spin
 *     starts clean.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeBet, generateRequestId } from '../lib/api/spinApi';
import type { SpinResult } from '../lib/api/spinApi';
import { useSpinStore, useJackpotStore, useFeedStore } from '../stores';
import { useAuthContext } from '../context/AuthContext';

const COOLDOWN_MS       = 3000;
const TURBO_COOLDOWN_MS = 800;
const AUTO_SPIN_DELAY   = 4500;
const isClient          = typeof window !== 'undefined';

export function useSpin() {
  const queryClient = useQueryClient();

  // Auth context — read-only, do NOT call checkAuth() during a spin result
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();

  // Spin store
  const spinning     = useSpinStore((s: any) => s.spinning);
  const result       = useSpinStore((s: any) => s.result);
  const error        = useSpinStore((s: any) => s.error);
  const cooldown     = useSpinStore((s: any) => s.cooldown);
  const selectedBet  = useSpinStore((s: any) => s.selectedBet);
  const autoSpin     = useSpinStore((s: any) => s.autoSpin);
  const turboMode    = useSpinStore((s: any) => s.turboMode);
  const clientSeed   = useSpinStore((s: any) => s.clientSeed);
  const nonce        = useSpinStore((s: any) => s.nonce);

  const setSpinning       = useSpinStore((s: any) => s.setSpinning);
  const setResult         = useSpinStore((s: any) => s.setResult);
  const setError          = useSpinStore((s: any) => s.setError);
  const setCooldown       = useSpinStore((s: any) => s.setCooldown);
  const decrementCooldown = useSpinStore((s: any) => s.decrementCooldown);
  const setSelectedBet    = useSpinStore((s: any) => s.setSelectedBet);
  const setAutoSpin       = useSpinStore((s: any) => s.setAutoSpin);
  const setTurboMode      = useSpinStore((s: any) => s.setTurboMode);
  const incrementNonce    = useSpinStore((s: any) => s.incrementNonce);
  const clearResult       = useSpinStore((s: any) => s.clearResult);
  const setServerSeedHash = useSpinStore((s: any) => s.setServerSeedHash);

  const setLastWinner = useJackpotStore((s: any) => s.setLastWinner);
  const addFeedEvent  = useFeedStore((s: any) => s.addEvent);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);

  // ── Cooldown ticker ───────────────────────────────────────────────────────
  const startCooldown = useCallback(() => {
    const ms = turboMode ? TURBO_COOLDOWN_MS : COOLDOWN_MS;
    setCooldown(Math.ceil(ms / 1000));
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => decrementCooldown(), 1000);
    setTimeout(() => {
      if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
      setCooldown(0);
    }, ms);
  }, [turboMode, setCooldown, decrementCooldown]);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: ({ betAmount, requestId }: { betAmount: number; requestId: string }) => {
      if (!isClient) throw new Error('SSR');
      const token = localStorage.getItem('dashbets_token');
      if (!token)  throw new Error('Not authenticated');
      return placeBet(betAmount, requestId, clientSeed);
    },

    onSuccess: (res: any, { betAmount }) => {
      if (!res.success) {
        const err = res as { error: string; message?: string };
        if (err.error === 'RATE_LIMIT_EXCEEDED') {
          setError('Please wait before spinning again.');
          startCooldown();
        } else if (err.error?.includes('REFUND')) {
          setError('Spin failed — your bet has been refunded.');
        } else {
          setError(err.message ?? err.error ?? 'Something went wrong.');
        }
        return; // setSpinning(false) called in onSettled
      }

      const raw = res as Record<string, any>;

      // ── Normalise payout fields ───────────────────────────────────────
      const netPayout  = Number(raw.netPayout ?? raw.payout ?? 0);
      const grossWin   = Number(raw.grossWin   ?? 0);
      const commission = Number(raw.commission ?? 0);
      const newBalance = Number(raw.newBalance ?? user?.balance ?? 0);
      const multiplier = Number(raw.multiplier ?? 0);
      const isWin      = Boolean(raw.isWin) || netPayout > 0;
      const resultStr  = (raw.result ?? 'loss').toString().toLowerCase();

      const safeResult: SpinResult = {
        result:       resultStr as any,
        isWin,
        netPayout,
        payout:       netPayout,
        grossWin,
        commission,
        multiplier,
        betAmount:    Number(raw.betAmount ?? betAmount),
        newBalance,
        stopAngle:    Number(raw.stopAngle ?? 0),
        segmentOrder: Array.isArray(raw.segmentOrder) ? raw.segmentOrder : [],
        segmentIndex: Number(raw.segmentIndex ?? 0),
        wheelType:    raw.wheelType ?? 'standard',
        vipPointsEarned: Number(raw.vipPointsEarned ?? 0),
        jackpotWon:   raw.jackpotWon ?? null,
        isJackpot:    Boolean(raw.isJackpot),
        jackpotType:  raw.jackpotType ?? null,
        duplicate:    raw.duplicate ?? false,
        betId:        raw.betId,
        provablyFair: raw.provablyFair,
        animationConfig: raw.animationConfig,
      } as any;

      // Store provably fair server seed hash
      if (raw.provablyFair?.hashedSeed) {
        setServerSeedHash(raw.provablyFair.hashedSeed);
      }

      // Jackpot announcement
      if (safeResult.jackpotWon && isClient) {
        setLastWinner({
          id:        Date.now().toString(),
          username:  user?.username ?? 'Player',
          betAmount,
          payout:    netPayout,
          multiplier,
          result:    resultStr,
          wheelType: safeResult.wheelType ?? 'standard',
          timestamp: Date.now(),
        });
      }

      // Live feed for big wins
      if (isWin && netPayout >= 200 && isClient) {
        addFeedEvent({
          id:        Date.now().toString(),
          username:  user?.username ?? 'Player',
          betAmount,
          payout:    netPayout,
          multiplier,
          result:    resultStr,
          wheelType: safeResult.wheelType ?? 'standard',
          timestamp: Date.now(),
        });
      }

      // ── SET RESULT BEFORE setSpinning(false) ─────────────────────────
      // This ensures the wheel component receives both stopAngle AND
      // isSpinning=false in the correct order.
      setResult(safeResult);
      incrementNonce();
      startCooldown();

      queryClient.invalidateQueries({ queryKey: ['spinHistory'] });
      queryClient.invalidateQueries({ queryKey: ['spinStats'] });
    },

    onError: (err: any) => {
      setError(err instanceof Error ? err.message : 'Network error. Try again.');
    },

    // onSettled runs AFTER onSuccess — sets spinning false last
    onSettled: () => {
      setSpinning(false);
    },
  });

  // ── Main spin function ────────────────────────────────────────────────────
  const spin = useCallback(async (betAmount?: number) => {
    if (!isClient || authLoading || !isAuthenticated || !user) {
      setError('Please log in to spin'); return;
    }
    const amount = betAmount ?? selectedBet;
    if (spinning || cooldown > 0) return;
    if (user.balance < amount) { setError('Insufficient balance.'); return; }

    setSpinning(true);
    setError(null);
    clearResult();
    mutation.mutate({ betAmount: amount, requestId: generateRequestId() });
  }, [spinning, cooldown, selectedBet, user, isAuthenticated, authLoading,
      setSpinning, setError, clearResult, mutation]);

  // ── Auto-spin ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isClient || !autoSpin || spinning || cooldown > 0) return;
    autoRef.current = setTimeout(() => spin(), AUTO_SPIN_DELAY);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [autoSpin, spinning, cooldown, spin]);

  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    if (autoRef.current)     clearTimeout(autoRef.current);
  }, []);

  const isReady = isClient && !authLoading && !spinning && cooldown === 0
    && isAuthenticated && !!user && user.balance >= selectedBet;

  return {
    spinning, result, error, cooldown, selectedBet,
    autoSpin, turboMode, nonce, clientSeed,
    spin, clearResult, setSelectedBet, setAutoSpin, setTurboMode,
    isReady,
    balance: user?.balance ?? 0,
  };
}