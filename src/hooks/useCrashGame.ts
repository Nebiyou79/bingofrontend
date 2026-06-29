// hooks/useCrashGame.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCrashSocket } from '@/hooks/useCrashSocket';

// ── Client-side multiplier formula (mirrors server exactly) ──────────────────
function clientMultiplier(startTime: number, now: number): number {
  const elapsed = now - startTime;
  return Math.floor(100 * Math.pow(Math.E, 0.00006 * elapsed)) / 100;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoundStatus = 'idle' | 'waiting' | 'running' | 'crashed';

export interface BetEntry {
  userId:      string;
  username:    string;
  betIndex:    number;         // 0 or 1
  betAmount:   number;
  autoCashOut: number | null;
  cashedOutAt: number | null;
  payout:      number;
  status:      'active' | 'won' | 'lost';
}

export interface MyBetState {
  betId:       string;
  betIndex:    0 | 1;
  amount:      number;
  autoCashOut: number | null;
  status:      'active' | 'won' | 'lost';
  cashedOutAt: number | null;
  payout:      number;
}

export interface HistoryEntry {
  _id:         string;
  roundNumber: number;
  crashPoint:  number;
  createdAt:   string;
}

export interface MultiplierPoint {
  elapsed:    number;
  multiplier: number;
}

export interface CrashGameState {
  status:         RoundStatus;
  roundId:        string | null;
  roundNumber:    number | null;
  serverSeedHash: string | null;
  countdown:      number;
  multiplier:     number;
  crashPoint:     number | null;
  bets:           BetEntry[];
  /** Two independent bet slots — index 0 and 1. null = no bet in that slot. */
  myBets:         [MyBetState | null, MyBetState | null];
  history:        HistoryEntry[];
  curve:          MultiplierPoint[];
  isConnected:    boolean;
  error:          string | null;
}

// ── Stable initial state (no Date.now(), no window) ──────────────────────────
const INITIAL_STATE: CrashGameState = {
  status:         'idle',
  roundId:        null,
  roundNumber:    null,
  serverSeedHash: null,
  countdown:      0,
  multiplier:     1.00,
  crashPoint:     null,
  bets:           [],
  myBets:         [null, null],
  history:        [],
  curve:          [],
  isConnected:    false,
  error:          null,
};

// ── Hook options ──────────────────────────────────────────────────────────────

interface UseCrashGameOptions {
  token:            string;
  userId:           string;
  onBalanceUpdate?: (newBalance: number, multiplier?: number, payout?: number) => void;
}

export function useCrashGame({ token, userId, onBalanceUpdate }: UseCrashGameOptions) {
  const [state, setState] = useState<CrashGameState>(() => ({ ...INITIAL_STATE }));

  const startTimeRef   = useRef<number | null>(null);
  const rafRef         = useRef<number | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── RAF loop for smooth multiplier display ────────────────────────────────
  const startRafLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const loop = () => {
      if (!startTimeRef.current) return;
      const now     = Date.now();
      const mult    = clientMultiplier(startTimeRef.current, now);
      const elapsed = now - startTimeRef.current;

      setState((prev) => {
        const lastPt = prev.curve[prev.curve.length - 1];
        if (lastPt && Math.abs(lastPt.multiplier - mult) < 0.005) {
          return { ...prev, multiplier: mult };
        }
        return {
          ...prev,
          multiplier: mult,
          curve: [...prev.curve, { elapsed, multiplier: mult }].slice(-200),
        };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopRafLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // ── Utility: clone myBets tuple ───────────────────────────────────────────
  function cloneMyBets(
    prev: [MyBetState | null, MyBetState | null]
  ): [MyBetState | null, MyBetState | null] {
    return [prev[0], prev[1]];
  }

  // ── Socket event handlers ─────────────────────────────────────────────────
  const handlers = {

    connect: () =>
      setState((p) => ({ ...p, isConnected: true, error: null })),

    disconnect: () =>
      setState((p) => ({ ...p, isConnected: false })),

    connect_error: (err: Error) =>
      setState((p) => ({ ...p, isConnected: false, error: err.message })),

    // Full state snapshot on join or reconnect
    'crash:state': (data: any) => {
      const bets: BetEntry[] = data.bets ?? [];

      // Rebuild myBets from the snapshot
      const myBets: [MyBetState | null, MyBetState | null] = [null, null];
      bets
        .filter((b) => b.userId === userId)
        .forEach((b) => {
          const idx = (b.betIndex === 1 ? 1 : 0) as 0 | 1;
          myBets[idx] = {
            betId:       `${data.roundId}-${userId}-${idx}`,
            betIndex:    idx,
            amount:      b.betAmount,
            autoCashOut: b.autoCashOut,
            status:      b.status,
            cashedOutAt: b.cashedOutAt,
            payout:      b.payout,
          };
        });

      if (data.status === 'running' && data.elapsed != null) {
        startTimeRef.current = Date.now() - Number(data.elapsed);
        startRafLoop();
      }

      setState((p) => ({
        ...p,
        status:         data.status ?? 'idle',
        roundId:        data.roundId ?? null,
        roundNumber:    data.roundNumber ?? null,
        serverSeedHash: data.serverSeedHash ?? null,
        countdown:      data.countdown ?? 0,
        multiplier:     data.multiplier ?? 1.00,
        bets,
        myBets,
        isConnected: true,
        curve:       [],
      }));
    },

    // New betting window
    'crash:waiting': (data: any) => {
      stopRafLoop();
      stopCountdown();

      let cd = Number(data.countdown ?? 10);

      countdownRef.current = setInterval(() => {
        cd = Math.max(0, cd - 1);
        setState((p) => ({ ...p, countdown: cd }));
        if (cd <= 0) stopCountdown();
      }, 1000);

      setState((prev) => ({
        ...INITIAL_STATE,
        isConnected:    true,
        status:         'waiting',
        roundId:        data.roundId ?? null,
        roundNumber:    data.roundNumber ?? null,
        serverSeedHash: data.serverSeedHash ?? null,
        countdown:      cd,
        history:        prev.history,   // preserve across rounds
      }));
    },

    // Multiplier starts climbing
    'crash:start': (data: any) => {
      startTimeRef.current = Number(data.startTime ?? Date.now());
      stopCountdown();
      setState((p) => ({ ...p, status: 'running', countdown: 0 }));
      startRafLoop();
    },

    // Server 100ms tick — RAF handles visuals; we only need this for auto-cashout sync
    'crash:tick': (_data: any) => { /* intentionally no-op on client */ },

    // A new bet was added (broadcast to all)
    'crash:bet_added': (data: any) => {
      if (!data?.bet) return;
      setState((p) => ({
        ...p,
        bets: [...p.bets, data.bet as BetEntry],
      }));
    },

    // Someone (or us) cashed out
    'crash:cashout': (data: any) => {
      setState((p) => {
        const bets = p.bets.map((b) =>
          b.userId === data.userId && b.betIndex === data.betIndex
            ? { ...b, status: 'won' as const, cashedOutAt: data.multiplier, payout: data.payout }
            : b
        );

        const myBets = cloneMyBets(p.myBets);
        if (data.userId === userId) {
          const idx = (data.betIndex === 1 ? 1 : 0) as 0 | 1;
          if (myBets[idx]) {
            myBets[idx] = {
              ...myBets[idx]!,
              status:      'won',
              cashedOutAt: data.multiplier,
              payout:      data.payout,
            };
          }
        }

        return { ...p, bets, myBets };
      });
    },

    // Round crashed
    'crash:crashed': (data: any) => {
      stopRafLoop();
      stopCountdown();

      setState((p) => {
        const myBets = cloneMyBets(p.myBets);
        // Mark any still-active personal bets as lost
        for (let i = 0 as 0 | 1; i <= 1; i = (i + 1) as 0 | 1) {
          if (myBets[i]?.status === 'active') {
            myBets[i] = { ...myBets[i]!, status: 'lost' };
          }
        }

        return {
          ...p,
          status:     'crashed',
          multiplier: Number(data.crashPoint),
          crashPoint: Number(data.crashPoint),
          bets: p.bets.map((b) =>
            b.status === 'active' ? { ...b, status: 'lost' as const } : b
          ),
          myBets,
          history: [
            {
              _id:         data.roundId ?? p.roundId ?? '',
              roundNumber: data.roundNumber ?? p.roundNumber ?? 0,
              crashPoint:  Number(data.crashPoint),
              createdAt:   new Date().toISOString(),
            },
            ...p.history.slice(0, 49),
          ],
        };
      });
    },

    // Our bet was accepted by the server
'bet:placed': (data: any) => {
  const idx = ((data.betIndex ?? 0) === 1 ? 1 : 0) as 0 | 1;
  
  // ✅ Update balance immediately when bet is placed
  if (data.newBalance !== undefined) {
    onBalanceUpdate?.(data.newBalance);
  }
  
  setState((p) => {
    const myBets = cloneMyBets(p.myBets);
    myBets[idx] = {
      betId:       data.betId ?? '',
      betIndex:    idx,
      amount:      Number(data.amount),
      autoCashOut: data.autoCashOut ?? null,
      status:      'active',
      cashedOutAt: null,
      payout:      0,
    };
    return { ...p, myBets };
  });
},

    // Balance changed (win credited) — includes multiplier + payout for toast
    'balance:update': (data: { newBalance: number; multiplier?: number; payout?: number }) => {
      onBalanceUpdate?.(data.newBalance, data.multiplier, data.payout);
    },

    // History response
    'crash:history_result': (data: any) => {
      const rounds: HistoryEntry[] = (data.rounds ?? []).map((r: any) => ({
        _id:         r._id ?? '',
        roundNumber: r.roundNumber ?? 0,
        crashPoint:  Number(r.crashPoint ?? 1),
        createdAt:   r.createdAt ?? '',
      }));
      setState((p) => ({ ...p, history: rounds }));
    },

    // Server-side error
    'crash:error': (data: { message: string }) => {
      setState((p) => ({ ...p, error: data.message }));
      setTimeout(() => setState((p) => ({ ...p, error: null })), 4_000);
    },
  };

  const { emit } = useCrashSocket({ token, handlers });

  // Fetch history shortly after socket connects
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => emit('crash:history', { limit: 20 }), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRafLoop();
      stopCountdown();
    };
  }, [stopRafLoop, stopCountdown]);

  // ── Public API ────────────────────────────────────────────────────────────

  /** Place a bet. betIndex 0 = first panel, 1 = second panel. */
  const placeBet = useCallback(
    (betAmount: number, autoCashOut: number | null, betIndex: 0 | 1 = 0) => {
      emit('crash:bet', { betAmount, autoCashOut, betIndex });
    },
    [emit]
  );

  /** Cash out a specific bet slot. */
  const cashOut = useCallback(
    (betIndex: 0 | 1 = 0) => {
      emit('crash:cashout', { betIndex });
    },
    [emit]
  );

  const fetchHistory = useCallback(
    (page = 1) => emit('crash:history', { limit: 20, page }),
    [emit]
  );

  return { state, placeBet, cashOut, fetchHistory };
}