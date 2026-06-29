// lib/api/dragonTowerApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = 10_000;

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * fetch wrapper with a hard timeout via AbortController.
 * Mirrors the kenoApi.ts convention: every network call races against
 * a timeout so a stalled connection can't hang the UI indefinitely.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${API_BASE}${path}`,
      { ...options, headers: { ...authHeaders(token), ...options.headers } },
      timeoutMs
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out' } as T;
    }
    return { success: false, error: 'Network error' } as T;
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { success: false, error: 'Invalid server response' } as T;
  }

  return data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RevealedRow {
  row: number;
  pickedCol: number;
  wasSafe: boolean;
  multiplier: number;
}

export interface DragonTowerSession {
  sessionId: string;
  difficulty: Difficulty;
  rows: number;
  betAmount: number;
  status: 'active' | 'won' | 'lost' | 'cashed_out';
  serverSeedHash: string;
  clientSeed: string;
  currentRow: number;
  revealedRows: RevealedRow[];
  currentMultiplier: number;
  payout: number;
  createdAt?: string;
  layout?: boolean[][];
  serverSeed?: string;
}

export interface DifficultyConfig {
  label: string;
  totalEggs: number;
  safeEggs: number;
  houseEdge: number;
}

export interface StartSuccess {
  success: true;
  session: DragonTowerSession;
  newBalance: number;
  config: DifficultyConfig;
}

export interface RevealSafeResult {
  success: true;
  result: 'safe';
  row: number;
  pickedCol: number;
  session: DragonTowerSession;
}

export interface RevealLostResult {
  success: true;
  result: 'lost';
  row: number;
  pickedCol: number;
  layout: boolean[][];
  serverSeed: string;
  session: DragonTowerSession;
}

export interface RevealClearedResult {
  success: true;
  result: 'tower_cleared';
  row: number;
  pickedCol: number;
  payout: number;
  newBalance: number;
  layout: boolean[][];
  serverSeed: string;
  session: DragonTowerSession;
}

export type RevealResponse = RevealSafeResult | RevealLostResult | RevealClearedResult | ApiError;

export interface CashoutSuccess {
  success: true;
  payout: number;
  newBalance: number;
  layout: boolean[][];
  serverSeed: string;
  session: DragonTowerSession;
}

export interface CurrentSuccess {
  success: true;
  session: DragonTowerSession | null;
}

export interface HistorySuccess {
  success: true;
  sessions: DragonTowerSession[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export interface VerifySuccess {
  success: true;
  difficulty: Difficulty;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  layout: boolean[][];
  recomputedLayout: boolean[][];
  valid: boolean;
  multiplierTable: { row: number; multiplier: number }[];
  instructions: string[];
}

export interface ApiError {
  success: false;
  error: string;
}

export type PlaceBetResponse = StartSuccess | ApiError;

// ── API ───────────────────────────────────────────────────────────────────

export const dragonTowerApi = {
  start: (token: string, betAmount: number, difficulty: Difficulty, rows?: number): Promise<PlaceBetResponse> =>
    request('/api/games/dragon-tower/start', token, {
      method: 'POST',
      body: JSON.stringify({ betAmount, difficulty, rows }),
    }),

  reveal: (token: string, sessionId: string, col: number): Promise<RevealResponse> =>
    request('/api/games/dragon-tower/reveal', token, {
      method: 'POST',
      body: JSON.stringify({ sessionId, col }),
    }),

  cashout: (token: string, sessionId: string): Promise<CashoutSuccess | ApiError> =>
    request('/api/games/dragon-tower/cashout', token, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  getCurrent: (token: string): Promise<CurrentSuccess | ApiError> =>
    request('/api/games/dragon-tower/current', token, { method: 'GET' }),

  getHistory: (token: string, page = 1, limit = 20): Promise<HistorySuccess | ApiError> =>
    request(`/api/games/dragon-tower/history?page=${page}&limit=${limit}`, token, { method: 'GET' }),

  verify: (token: string, sessionId: string): Promise<VerifySuccess | ApiError> =>
    request(`/api/games/dragon-tower/verify/${sessionId}`, token, { method: 'GET' }),
};
