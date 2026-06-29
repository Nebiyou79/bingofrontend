// hooks/useKenoSocket.ts
/**
 * DashBets — Multiplayer Keno Socket Hook
 *
 * Manages the Socket.IO /keno namespace connection and exposes:
 *   - Live round state (timer, status, drawn balls)
 *   - User's tickets for the current round
 *   - Actions: placeTicket, repeatTickets, fetchHistory, fetchStats
 *   - Per-event callbacks for animation driving
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KenoTicket {
  _id:           string;
  userId:        string;
  roundId:       string;
  pickedNumbers: number[];
  betAmount:     number;
  matches:       number[];
  matchCount:    number;
  multiplier:    number;
  payout:        number;
  isWin:         boolean;
  status:        'pending' | 'settled' | 'refunded';
  createdAt:     string;
}

export interface KenoRoundState {
  roundId:      string;
  roundNumber:  number;
  status:       'betting' | 'drawing' | 'settled';
  secondsLeft:  number;
  betsClosedAt: string;
  drawnNumbers: number[];
}

export interface KenoHistoryRound {
  _id:          string;
  roundNumber:  number;
  status:       string;
  drawnNumbers: number[];
  totalBets:    number;
  totalWagered: number;
  totalPayout:  number;
  createdAt:    string;
  myTickets:    KenoTicket[];
}

export interface NumberStat {
  number:    number;
  frequency: number;
}

export interface UseKenoSocketReturn {
  connected:        boolean;
  round:            KenoRoundState | null;
  secondsLeft:      number;
  drawnSoFar:       number[];
  latestBall:       number | null;
  myTickets:        KenoTicket[];
  history:          KenoHistoryRound[];
  historyPagination:{ page: number; totalPages: number; total: number } | null;
  numberStats:      NumberStat[];
  error:            string | null;
  balance:          number | null;

  placeTicket:   (pickedNumbers: number[], betAmount: number) => void;
  repeatTickets: (roundId: string) => void;
  fetchHistory:  (page?: number) => void;
  fetchStats:    () => void;
  clearError:    () => void;
}

// ── Backend URL ───────────────────────────────────────────────────────────────
// In development the Next.js dev server (port 3000) and the Express/Socket.IO
// backend (port 5000) are on different ports, so a relative path like '/keno'
// would try to connect to port 3000 and fail.
// NEXT_PUBLIC_API_URL should be set to 'http://localhost:5000' in .env.local
// and to your production API origin in production.
// Line ~70
const BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useKenoSocket(token: string | null): UseKenoSocketReturn {
  const socketRef = useRef<Socket | null>(null);

  const [connected,         setConnected]         = useState(false);
  const [round,             setRound]             = useState<KenoRoundState | null>(null);
  const [secondsLeft,       setSecondsLeft]       = useState(0);
  const [drawnSoFar,        setDrawnSoFar]        = useState<number[]>([]);
  const [latestBall,        setLatestBall]        = useState<number | null>(null);
  const [myTickets,         setMyTickets]         = useState<KenoTicket[]>([]);
  const [history,           setHistory]           = useState<KenoHistoryRound[]>([]);
  const [historyPagination, setHistoryPagination] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [numberStats,       setNumberStats]       = useState<NumberStat[]>([]);
  const [error,             setError]             = useState<string | null>(null);
  const [balance,           setBalance]           = useState<number | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Connect / reconnect when token changes ────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // FIX: Use both WebSocket and polling transports for better reliability
    const socket = io(`${BACKEND_URL}/keno`, {
      auth:                 { token },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    1000,
      reconnectionAttempts: 10,
      timeout:              20000,
    });
    socketRef.current = socket;

    socket.on('connect',    () => { if (mountedRef.current) setConnected(true); });
    socket.on('disconnect', () => { if (mountedRef.current) setConnected(false); });
    socket.on('connect_error', (err) => {
      if (mountedRef.current) setError(err.message);
    });

    // ── round:state — full snapshot (on join or phase change) ────────────────
    socket.on('round:state', (data: KenoRoundState) => {
      if (!mountedRef.current) return;
      setRound(data);
      setSecondsLeft(data.secondsLeft);
      if (data.status === 'betting') {
        setDrawnSoFar([]);
        setLatestBall(null);
      }
      if (data.drawnNumbers?.length) {
        setDrawnSoFar(data.drawnNumbers);
      }
      // Fetch user's tickets for this round
      socket.emit('round:my_tickets', { roundId: data.roundId });
    });

    // ── round:tick — countdown ────────────────────────────────────────────────
    socket.on('round:tick', ({ secondsLeft: s }: { secondsLeft: number }) => {
      if (mountedRef.current) setSecondsLeft(s);
    });

    // ── round:bets_closed — draw starting ─────────────────────────────────────
    socket.on('round:bets_closed', (data: { roundId: string; roundNumber: number; drawnNumbers: number[] }) => {
      if (!mountedRef.current) return;
      setRound(prev => prev ? { ...prev, status: 'drawing', drawnNumbers: data.drawnNumbers } : prev);
      setDrawnSoFar([]);
      setLatestBall(null);
    });

    // ── round:ball — one ball at a time ───────────────────────────────────────
    socket.on('round:ball', ({ ball, drawnSoFar: dSF }: { ball: number; ballIndex: number; drawnSoFar: number[]; total: number }) => {
      if (!mountedRef.current) return;
      setLatestBall(ball);
      setDrawnSoFar(dSF);
    });

    // ── round:settled — show results ──────────────────────────────────────────
    socket.on('round:settled', (data: { roundId: string; roundNumber: number; drawnNumbers: number[] }) => {
      if (!mountedRef.current) return;
      setRound(prev => prev ? { ...prev, status: 'settled', drawnNumbers: data.drawnNumbers } : prev);
      setLatestBall(null);
      // Re-fetch user's tickets which now have payout data
      socket.emit('round:my_tickets', { roundId: data.roundId });
    });

    // ── ticket:placed ──────────────────────────────────────────────────────────
    socket.on('ticket:placed', ({ ticket, newBalance: nb }: { ticket: KenoTicket; newBalance: number }) => {
      if (!mountedRef.current) return;
      setMyTickets(prev => [ticket, ...prev]);
      setBalance(nb);
    });

    // ── ticket:error ───────────────────────────────────────────────────────────
    socket.on('ticket:error', ({ error: e }: { error: string }) => {
      if (mountedRef.current) setError(e);
    });

    // ── ticket:repeat_item — re-populate the bet form ─────────────────────────
    socket.on('ticket:repeat_item', (item: { pickedNumbers: number[]; betAmount: number }) => {
      // Bubble up via a custom event so the page can handle it
      window.dispatchEvent(new CustomEvent('keno:repeat_item', { detail: item }));
    });

    // ── round:my_tickets_result ───────────────────────────────────────────────
    socket.on('round:my_tickets_result', ({ tickets }: { tickets: KenoTicket[] }) => {
      if (mountedRef.current) setMyTickets(tickets);
    });

    // ── round:history_result ──────────────────────────────────────────────────
    socket.on('round:history_result', ({ rounds, pagination }: { rounds: KenoHistoryRound[]; pagination: { page: number; totalPages: number; total: number } }) => {
      if (!mountedRef.current) return;
      setHistory(rounds);
      setHistoryPagination(pagination);
    });

    // ── number:stats_result ───────────────────────────────────────────────────
    socket.on('number:stats_result', ({ stats }: { stats: NumberStat[] }) => {
      if (mountedRef.current) setNumberStats(stats);
    });

    // ── balance:update — win credited ─────────────────────────────────────────
    socket.on('balance:update', ({ newBalance }: { newBalance: number }) => {
      if (mountedRef.current) setBalance(newBalance);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const placeTicket = useCallback((pickedNumbers: number[], betAmount: number) => {
    socketRef.current?.emit('ticket:place', { pickedNumbers, betAmount });
  }, []);

  const repeatTickets = useCallback((roundId: string) => {
    socketRef.current?.emit('ticket:repeat', { roundId });
  }, []);

  const fetchHistory = useCallback((page = 1) => {
    socketRef.current?.emit('round:history', { page, limit: 10 });
  }, []);

  const fetchStats = useCallback(() => {
    socketRef.current?.emit('number:stats');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    connected, round, secondsLeft, drawnSoFar, latestBall,
    myTickets, history, historyPagination, numberStats,
    error, balance,
    placeTicket, repeatTickets, fetchHistory, fetchStats, clearError,
  };
}