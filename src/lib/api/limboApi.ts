/**
 * lib/api/limboApi.ts
 * Typed fetch wrappers for the DashBets Limbo REST endpoints.
 * Mirrors kenoApi.ts exactly: same auth pattern, same error shape,
 * same fetchWithTimeout + AbortController pattern.
 *
 * Note: Betting is done via Socket.IO (useLimboSocket.ts), not REST.
 * These wrappers cover the read-only REST endpoints only:
 *   GET /api/games/limbo/history         → getHistory()
 *   GET /api/games/limbo/rounds          → getRounds()
 *   GET /api/games/limbo/stats           → getStats()
 *   GET /api/games/limbo/verify/:roundId → verify()
 */

const BASE    = '/api/games/limbo';
const TIMEOUT = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LimboBet {
  _id:              string;
  betAmount:        number;
  targetMultiplier: number;
  crashPoint:       number | null;
  isWin:            boolean;
  payout:           number;
  status:           'pending' | 'settled' | 'refunded';
  createdAt:        string;
  /** Populated from LimboRound */
  roundId?: {
    _id:            string;
    roundNumber:    number;
    crashPoint:     number | null;
    serverSeedHash: string;
    status:         string;
    createdAt:      string;
  };
}

export interface LimboRound {
  _id:            string;
  roundNumber:    number;
  status:         'betting' | 'revealing' | 'settled';
  serverSeedHash: string;
  crashPoint:     number | null;
  totalBets:      number;
  totalWagered:   number;
  totalPayout:    number;
  settledAt:      string | null;
  createdAt:      string;
  /** Attached server-side — this user's bet in this round (if any) */
  myBet?: {
    betAmount:        number;
    targetMultiplier: number;
    isWin:            boolean;
    payout:           number;
  } | null;
}

export interface LimboPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface LimboHistoryResponse {
  success:    true;
  bets:       LimboBet[];
  pagination: LimboPagination;
}

export interface LimboRoundsResponse {
  success:    true;
  rounds:     LimboRound[];
  pagination: LimboPagination;
}

export interface LimboStatsResponse {
  success: true;
  stats: {
    averageCrashPoint:  number;
    distribution:       Record<string, number>;
    recentCrashPoints:  number[];
    winProbabilities:   Record<string, string>;
  } | null;
  roundsAnalysed: number;
}

export interface LimboVerifyResponse {
  success:              true;
  roundId:              string;
  roundNumber:          number;
  serverSeed:           string;
  serverSeedHash:       string;
  prevHash:             string | null;
  hashMatch:            boolean;
  crashPoint:           number;
  recomputedCrashPoint: number;
  crashPointMatch:      boolean;
  totalBets:            number;
  totalWagered:         number;
  settledAt:            string | null;
}

export interface ApiError {
  success: false;
  error:   string;
  message?: string;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashbets_token') ?? '';
}

// ── Get API base URL ──────────────────────────────────────────────────────────

function getApiBase(): string {
  // Use environment variable or fallback to localhost:5000
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function handleNetworkError(err: unknown): ApiError {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { success: false, error: 'Request timed out', message: 'Server took too long.' };
  }
  return { success: false, error: 'Network error', message: 'Could not reach the server.' };
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetch the current user's personal Limbo bet history (paginated).
 */
export async function getHistory(
  page  = 1,
  limit = 20
): Promise<LimboHistoryResponse | ApiError> {
  try {
    const apiBase = getApiBase();
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res    = await fetchWithTimeout(`${apiBase}${BASE}/history?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<LimboHistoryResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Fetch public round history including crash points (paginated).
 * Each round also includes the current user's bet for that round (if any).
 */
export async function getRounds(
  page  = 1,
  limit = 20
): Promise<LimboRoundsResponse | ApiError> {
  try {
    const apiBase = getApiBase();
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res    = await fetchWithTimeout(`${apiBase}${BASE}/rounds?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<LimboRoundsResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Fetch crash point distribution statistics.
 * @param rounds Number of recent rounds to analyse (10–500, default 100)
 */
export async function getStats(rounds = 100): Promise<LimboStatsResponse | ApiError> {
  try {
    const apiBase = getApiBase();
    const params = new URLSearchParams({ rounds: String(rounds) });
    const res    = await fetchWithTimeout(`${apiBase}${BASE}/stats?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<LimboStatsResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Verify a settled Limbo round provably fairly.
 * Returns serverSeed and recomputed crashPoint for client-side verification.
 */
export async function verify(roundId: string): Promise<LimboVerifyResponse | ApiError> {
  try {
    const apiBase = getApiBase();
    const res    = await fetchWithTimeout(`${apiBase}${BASE}/verify/${roundId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<LimboVerifyResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}