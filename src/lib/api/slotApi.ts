/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api/slotApi.ts
// DashBets — Multi Hot 5 Slot API client
// Added: exponential-backoff retry on 500 / MongoDB write-conflict errors

import axios from 'axios';

const BASE      = '/api/games/slots';
const TOKEN_KEY = 'dashbets_token';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Retry helper ─────────────────────────────────────────────────────────────
// Retries on 500 status or MongoDB write-conflict messages.
// Uses exponential backoff: 300ms, 600ms, 1200ms
const RETRYABLE_MSG = /write conflict|please retry|mongo/i;

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 300,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status  = (err as any)?.response?.status;
      const message = (err as any)?.response?.data?.error ?? (err as any)?.message ?? '';
      const isRetryable = status === 500 && RETRYABLE_MSG.test(message);
      if (!isRetryable || attempt === maxAttempts - 1) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[slotApi] retrying after ${delay}ms (attempt ${attempt + 1}) — ${message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaylineResult {
  paylineIndex: number;
  symbol:       string;
  multiplier:   number;
  activeMult:   number;
  totalWin:     number;
}

export interface SpinResult {
  spinId:           string;
  reels:            string[][];
  multiplierReel:   number[];
  activeRow:        number;
  activeMultiplier: number;
  paylineResults:   PaylineResult[];
  totalPayout:      number;
  isWin:            boolean;
  newBalance:       number;
  serverSeedHash:   string;
  canGamble:        boolean;
}

export interface GambleResult {
  card:         'red' | 'black';
  won:          boolean;
  currentWin:   number;
  attempts:     number;
  status:       'active' | 'collected' | 'lost';
  forceCollect: boolean;
}

export interface CollectResult {
  collected:  number;
  newBalance: number;
}

export interface GambleState {
  originalWin: number;
  currentWin:  number;
  attempts:    number;
  status:      'active' | 'collected' | 'lost';
}

export interface SlotSpin {
  _id:              string;
  betAmount:        number;
  reels:            string[][];
  multiplierReel:   number[];
  activeRow:        number;
  activeMultiplier: number;
  paylineResults:   PaylineResult[];
  totalPayout:      number;
  isWin:            boolean;
  serverSeedHash:   string;
  clientSeed:       string;
  gambleState:      GambleState | null;
  createdAt:        string;
}

export interface HistoryResponse {
  spins: SlotSpin[];
  pagination: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

// ── API calls (all critical writes use retry) ─────────────────────────────────

export async function spinSlot(betAmount: number, clientSeed?: string): Promise<SpinResult> {
  return withRetry(async () => {
    const { data } = await axios.post(
      `${BASE}/spin`,
      { betAmount, clientSeed },
      { headers: authHeaders() }
    );
    if (!data.success) throw new Error(data.error ?? 'Spin failed');
    return data;
  });
}

export async function gambleGuess(spinId: string, guess: 'red' | 'black'): Promise<GambleResult> {
  return withRetry(async () => {
    const { data } = await axios.post(
      `${BASE}/gamble`,
      { spinId, guess },
      { headers: authHeaders() }
    );
    if (!data.success) throw new Error(data.error ?? 'Gamble failed');
    return data;
  });
}

export async function collectGambleWin(spinId: string): Promise<CollectResult> {
  return withRetry(async () => {
    const { data } = await axios.post(
      `${BASE}/gamble/collect`,
      { spinId },
      { headers: authHeaders() }
    );
    if (!data.success) throw new Error(data.error ?? 'Collect failed');
    return data;
  });
}

export async function getSlotHistory(page = 1, limit = 20): Promise<HistoryResponse> {
  const { data } = await axios.get(`${BASE}/history`, {
    params:  { page, limit },
    headers: authHeaders(),
  });
  if (!data.success) throw new Error(data.error ?? 'Failed to load history');
  return data;
}

export async function verifySlotSpin(id: string) {
  const { data } = await axios.get(`${BASE}/verify/${id}`, { headers: authHeaders() });
  if (!data.success) throw new Error(data.error ?? 'Verification failed');
  return data.verification;
}