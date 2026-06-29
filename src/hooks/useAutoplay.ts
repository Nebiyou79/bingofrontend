// hooks/useAutoplay.ts
// Fixed: autoplay drives off isAnimating (not isSpinning) so it waits for
// the full reel animation before firing the next spin.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface AutoplayConfig {
  spins:        number;        // 0 = infinite
  stopOnWin:    number | null;
  stopOnLoss:   number | null;
  stopOnBigWin: boolean;
}

export const BIG_WIN_THRESHOLD = 50;

interface Options {
  onSpinRequest:  (bet: number) => Promise<unknown>;
  isAnimating:    boolean;   // ← drives off isAnimating, not isSpinning
  isTurbo:        boolean;
  lastWin:        number;
  balance:        number;
}

export function useAutoplay({ onSpinRequest, isAnimating, isTurbo, lastWin, balance }: Options) {
  const [isRunning,  setIsRunning]  = useState(false);
  const [spinsLeft,  setSpinsLeft]  = useState(0);
  const [cumulWin,   setCumulWin]   = useState(0);
  const [cumulLoss,  setCumulLoss]  = useState(0);
  const [stopReason, setStopReason] = useState<string | null>(null);

  const isRunningRef   = useRef(false);
  const configRef      = useRef<AutoplayConfig | null>(null);
  const betRef         = useRef(0);
  const spinsLeftRef   = useRef(0);
  const cumulWinRef    = useRef(0);
  const cumulLossRef   = useRef(0);
  const lastWinRef     = useRef(lastWin);
  const balanceRef     = useRef(balance);
  const prevBalRef     = useRef(balance);
  // true while we are waiting for a spin we fired to complete
  const waitingRef     = useRef(false);

  useEffect(() => { lastWinRef.current = lastWin;   }, [lastWin]);
  useEffect(() => { balanceRef.current = balance;   }, [balance]);

  const stopAutoplay = useCallback((reason?: string) => {
    isRunningRef.current = false;
    waitingRef.current   = false;
    setIsRunning(false);
    setStopReason(reason ?? null);
  }, []);

  // ── Driver: fires every time isAnimating flips to false ──────────────────
  useEffect(() => {
    if (isAnimating) return;                    // still spinning
    if (!isRunningRef.current) return;          // autoplay not active
    if (!waitingRef.current)   return;          // we didn't fire this spin
    waitingRef.current = false;

    const cfg = configRef.current!;

    // P&L accounting
    const net = balanceRef.current - prevBalRef.current;
    if (net < 0) {
      cumulLossRef.current += Math.abs(net);
      setCumulLoss(cumulLossRef.current);
    } else if (net > 0) {
      cumulWinRef.current += net;
      setCumulWin(cumulWinRef.current);
    }

    // Stop checks (in priority order)
    if (cfg.stopOnBigWin && lastWinRef.current >= BIG_WIN_THRESHOLD) {
      stopAutoplay('Big Win — autoplay paused'); return;
    }
    if (cfg.stopOnWin !== null && cumulWinRef.current >= cfg.stopOnWin) {
      stopAutoplay(`Win target ETB ${cfg.stopOnWin} reached`); return;
    }
    if (cfg.stopOnLoss !== null && cumulLossRef.current >= cfg.stopOnLoss) {
      stopAutoplay(`Loss limit ETB ${cfg.stopOnLoss} reached`); return;
    }
    if (cfg.spins > 0 && spinsLeftRef.current <= 0) {
      stopAutoplay('All spins completed'); return;
    }
    if (balanceRef.current < betRef.current) {
      stopAutoplay('Insufficient balance'); return;
    }

    // Fire next spin after a short inter-spin delay
    // Turbo = 100ms gap, normal = 300ms
    const delay = isTurbo ? 100 : 300;
    if (cfg.spins > 0) {
      spinsLeftRef.current -= 1;
      setSpinsLeft(spinsLeftRef.current);
    }
    prevBalRef.current = balanceRef.current;
    waitingRef.current = true;
    setTimeout(() => {
      if (isRunningRef.current) onSpinRequest(betRef.current);
    }, delay);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  const startAutoplay = useCallback((cfg: AutoplayConfig, bet: number) => {
    configRef.current    = cfg;
    betRef.current       = bet;
    spinsLeftRef.current = cfg.spins;
    cumulWinRef.current  = 0;
    cumulLossRef.current = 0;
    prevBalRef.current   = balanceRef.current;

    setSpinsLeft(cfg.spins);
    setCumulWin(0);
    setCumulLoss(0);
    setStopReason(null);
    isRunningRef.current = true;
    setIsRunning(true);

    if (cfg.spins > 0) {
      spinsLeftRef.current -= 1;
      setSpinsLeft(spinsLeftRef.current);
    }

    prevBalRef.current = balanceRef.current;
    waitingRef.current = true;
    onSpinRequest(bet);
  }, [onSpinRequest]);

  return { isRunning, spinsLeft, cumulWin, cumulLoss, stopReason, startAutoplay, stopAutoplay };
}