// lib/api/minesApi.ts
/**
 * DashBets — Mines API Layer
 *
 * Mirrors lib/api/bingoApi.ts exactly:
 *   - apiFetch wrapper with JWT Authorization header
 *   - Never throws on 4xx/5xx — returns { success: false, error } shape
 *   - All response types are fully typed
 */

// ── Dynamic token store with request queue ─────────────────────────────────

let authToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;
let resolveTokenPromise: ((token: string | null) => void) | null = null;
let rejectTokenPromise: ((error: Error) => void) | null = null;
let tokenTimeout: ReturnType<typeof setTimeout> | null = null;

/** Called by AuthContext after checkAuth completes */
export function setAuthToken(token: string | null) {
  authToken = token;
  
  // Clear timeout if exists
  if (tokenTimeout) {
    clearTimeout(tokenTimeout);
    tokenTimeout = null;
  }
  
  // Resolve any waiting promises
  if (resolveTokenPromise) {
    if (token) {
      resolveTokenPromise(token);
    } else {
      // No token means user is not authenticated
      resolveTokenPromise(null);
    }
    tokenPromise = null;
    resolveTokenPromise = null;
    rejectTokenPromise = null;
  }
}

/** Wait for token to be set (returns immediately if already set) */
async function waitForToken(): Promise<string | null> {
  // If token already set, return it
  if (authToken !== null) return authToken;
  
  // If no token promise exists, create one
  if (!tokenPromise) {
    tokenPromise = new Promise((resolve, reject) => {
      resolveTokenPromise = resolve;
      rejectTokenPromise = reject;
      
      // Timeout after 3 seconds to prevent infinite waiting
      tokenTimeout = setTimeout(() => {
        if (tokenPromise) {
          reject(new Error('Authentication timeout'));
          tokenPromise = null;
          resolveTokenPromise = null;
          rejectTokenPromise = null;
        }
      }, 3000);
    });
  }
  
  try {
    return await tokenPromise;
  } catch (error) {
    console.error('Token wait failed:', error);
    return null;
  }
}

/** Get current token (waits if needed) */
async function getAuthTokenAsync(): Promise<string> {
  const token = await waitForToken();
  if (token) return token;
  
  // Fallback to localStorage if still no token
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '';
    if (localToken) {
      // Cache it for future use
      authToken = localToken;
      return localToken;
    }
  }
  return '';
}

// ── Shared fetch utility with auth waiting ─────────────────────────────────

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Wait for token to be available before making request
  const token = await getAuthTokenAsync();
  
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
  const url = `${base}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers ?? {}),
    },
  });

  // Parse JSON even on error responses so callers get { success: false, error }
  const data = await res.json().catch(() => ({
    success: false,
    error: `HTTP ${res.status}`,
  }));

  return data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MinesGameState {
  _id:               string;
  betAmount:         number;
  mineCount:         number;
  serverSeedHash:    string;
  clientSeed:        string;
  revealedTiles:     number[];
  currentMultiplier: number;
  nextMultiplier:    number | null;
  status:            'active' | 'won' | 'lost';
  payout:            number;
  cashedOutAt:       string | null;
  createdAt:         string;
  // Only present when status !== 'active'
  minePositions?:    number[];
  serverSeed?:       string;
}

export interface ApiOk<T = unknown> {
  success: true;
  [key: string]: unknown;
}

export interface ApiError {
  success: false;
  error:   string;
}

export type ApiResult<T = unknown> = { success: true } & T | ApiError;

export interface StartGameResponse {
  success: true;
  game:    MinesGameState;
}

export interface RevealTileResponse {
  success: true;
  hit:     boolean;
  game:    MinesGameState;
}

export interface CashOutResponse {
  success:    true;
  payout:     number;
  multiplier: number;
  game:       MinesGameState;
}

export interface CurrentGameResponse {
  success: true;
  game:    MinesGameState | null;
}

export interface MultiplierRow {
  reveals:    number;
  multiplier: number;
}

export interface MultiplierTableResponse {
  success: true;
  table:   Record<number, MultiplierRow[]>;
}

export interface GameHistoryResponse {
  success: true;
  games:   MinesGameState[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
    hasNext:    boolean;
    hasPrev:    boolean;
  };
}

export interface VerifyResponse {
  success:  true;
  verified: boolean;
  game:     MinesGameState & { serverSeed: string; minePositions: number[] };
}

// ── API functions ──────────────────────────────────────────────────────────────

/**
 * Start a new Mines game.
 * Deducts bet from balance atomically on the server.
 */
export async function startGame(
  betAmount: number,
  mineCount: number,
  clientSeed?: string
): Promise<StartGameResponse | ApiError> {
  return apiFetch<StartGameResponse | ApiError>('/api/games/mines/start', {
    method: 'POST',
    body:   JSON.stringify({ betAmount, mineCount, clientSeed }),
  });
}

/**
 * Reveal a tile. Returns { hit: true } if mine, { hit: false } + new multiplier otherwise.
 */
export async function revealTile(
  gameId:    string,
  tileIndex: number
): Promise<RevealTileResponse | ApiError> {
  return apiFetch<RevealTileResponse | ApiError>('/api/games/mines/reveal', {
    method: 'POST',
    body:   JSON.stringify({ gameId, tileIndex }),
  });
}

/**
 * Cash out the current game. Credits payout to balance atomically.
 * Returns the final multiplier and payout amount.
 */
export async function cashOut(gameId: string): Promise<CashOutResponse | ApiError> {
  return apiFetch<CashOutResponse | ApiError>('/api/games/mines/cashout', {
    method: 'POST',
    body:   JSON.stringify({ gameId }),
  });
}

/**
 * Get the user's current active game (if any).
 */
export async function getCurrent(): Promise<CurrentGameResponse | ApiError> {
  return apiFetch<CurrentGameResponse | ApiError>('/api/games/mines/current');
}

/**
 * Get paginated game history for the authenticated user.
 */
export async function getHistory(
  page  = 1,
  limit = 20
): Promise<GameHistoryResponse | ApiError> {
  return apiFetch<GameHistoryResponse | ApiError>(
    `/api/games/mines/history?page=${page}&limit=${limit}`
  );
}

/**
 * Verify a completed game's provably fair outcome.
 */
export async function verifyGame(gameId: string): Promise<VerifyResponse | ApiError> {
  return apiFetch<VerifyResponse | ApiError>(`/api/games/mines/verify/${gameId}`);
}

/**
 * Fetch the precomputed multiplier table for all mine counts.
 * No auth required.
 */
export async function getMultiplierTable(
  mines?: number
): Promise<MultiplierTableResponse | ApiError> {
  const qs = mines != null ? `?mines=${mines}` : '';
  return apiFetch<MultiplierTableResponse | ApiError>(
    `/api/games/mines/multiplier-table${qs}`
  );
}