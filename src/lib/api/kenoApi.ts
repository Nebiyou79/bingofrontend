/**
 * lib/api/kenoApi.ts
 * Typed fetch wrappers for the DashBets Keno Game endpoints.
 * Mirrors spinApi.ts exactly: same auth pattern, same error shape,
 * same response-union approach.
 *
 * Fixes:
 *   - 10 s request timeout via AbortController (prevents hung UI)
 *   - Robust error extraction (handles non-JSON server errors)
 *   - Re-exported ValidBet type from kenoConstants (single source of truth)
 *
 * Endpoints consumed:
 *   POST /api/games/keno/bet      → placeBet()
 *   GET  /api/games/keno/history  → getHistory()
 */

export type { ValidBet } from '../kenoConstants';

const BASE    = '/api/games/keno';
const TIMEOUT = 10_000; // 10 seconds

// ─── Types ────────────────────────────────────────────────────────────────────

/** Payload returned by POST /api/games/keno/bet on success. */
export interface KenoResult {
  /** All 20 numbers drawn by the server, sorted ascending */
  drawnNumbers: number[];
  /** Subset of the player's picks that appear in drawnNumbers */
  matches: number[];
  matchCount: number;
  /** matchCount / selectedNumbers.length */
  matchRatio: number;
  /** ETB credited (0 on loss, maxPayout on full win, maxPayout×0.5 on half win) */
  payout: number;
  /** Maximum possible payout for this bet amount */
  maxPayout: number;
  /** 'win' or 'loss' */
  result: 'win' | 'loss';
  isWin: boolean;
  balanceBefore: number;
  /** Updated wallet balance after payout */
  newBalance: number;
}

/** Single record from GET /api/games/keno/history */
export interface KenoBet {
  _id: string;
  betAmount: number;
  maxPayout: number;
  payout: number;
  result: 'win' | 'loss';
  status: 'settled' | 'refunded';
  gameData: {
    selectedNumbers: number[];
    drawnNumbers: number[];
    matchCount: number;
    matchRatio: number;
  };
  createdAt: string;
}

export interface KenoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface KenoHistoryResponse {
  success: true;
  bets: KenoBet[];
  pagination: KenoPagination;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export type PlaceBetResponse = ({ success: true } & KenoResult) | ApiError;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashbets_token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    Authorization:  `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch wrapper with a 10 s timeout.
 * Returns null if the request was aborted; throws on network errors.
 */
async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Place a keno bet.
 * @param betAmount       - Must be one of VALID_BETS (10 / 20 / 30 / 50 / 100)
 * @param selectedNumbers - 1–10 unique integers in the range 1–80
 */
export async function placeBet(
  betAmount: number,
  selectedNumbers: number[]
): Promise<PlaceBetResponse> {
  try {
    const res = await fetchWithTimeout(`${BASE}/bet`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ betAmount, selectedNumbers }),
    });

    // Handle non-JSON responses (e.g. 429 from rate limiter returning HTML)
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        error:   res.status === 429 ? 'Too many requests' : 'Server error',
        message: res.status === 429
          ? 'You are placing bets too quickly. Please slow down.'
          : `Unexpected response (${res.status})`,
      };
    }

    return res.json() as Promise<PlaceBetResponse>;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out', message: 'The server took too long to respond. Please try again.' };
    }
    return { success: false, error: 'Network error', message: 'Could not reach the server. Check your connection.' };
  }
}

/**
 * Fetch paginated keno bet history.
 * @param page  - 1-based page number (default: 1)
 * @param limit - Records per page, max 50 (default: 20)
 */
export async function getHistory(
  page  = 1,
  limit = 20
): Promise<KenoHistoryResponse | ApiError> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res    = await fetchWithTimeout(`${BASE}/history?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<KenoHistoryResponse | ApiError>;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out', message: 'History could not be loaded.' };
    }
    return { success: false, error: 'Network error', message: 'Failed to load history.' };
  }
}
