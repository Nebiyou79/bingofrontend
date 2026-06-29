// lib/api/chickenApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = 10_000;

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

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

export interface CrossedLane {
  lane: number;
  wasBlocked: boolean;
  multiplier: number;
}

export interface ChickenSession {
  sessionId: string;
  difficulty: Difficulty;
  laneCount: number;
  betAmount: number;
  status: 'active' | 'won' | 'lost' | 'cashed_out';
  serverSeedHash: string;
  clientSeed: string;
  currentLane: number;
  crossedLanes: CrossedLane[];
  currentMultiplier: number;
  payout: number;
  createdAt?: string;
  layout?: boolean[];
  serverSeed?: string;
}

export interface DifficultyConfig {
  label: string;
  minDanger: number;
  maxDanger: number;
  houseEdge: number;
}

export interface StartSuccess {
  success: true;
  session: ChickenSession;
  newBalance: number;
  config: DifficultyConfig;
}

export interface RevealSafeResult {
  success: true;
  result: 'safe';
  lane: number;
  session: ChickenSession;
}

export interface RevealLostResult {
  success: true;
  result: 'lost';
  lane: number;
  layout: boolean[];
  serverSeed: string;
  session: ChickenSession;
}

export interface RevealClearedResult {
  success: true;
  result: 'road_cleared';
  lane: number;
  payout: number;
  newBalance: number;
  layout: boolean[];
  serverSeed: string;
  session: ChickenSession;
}

export type RevealResponse = RevealSafeResult | RevealLostResult | RevealClearedResult | ApiError;

export interface CashoutSuccess {
  success: true;
  payout: number;
  newBalance: number;
  layout: boolean[];
  serverSeed: string;
  session: ChickenSession;
}

export interface CurrentSuccess {
  success: true;
  session: ChickenSession | null;
}

export interface HistorySuccess {
  success: true;
  sessions: ChickenSession[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export interface VerifySuccess {
  success: true;
  difficulty: Difficulty;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  layout: boolean[];
  recomputedLayout: boolean[];
  valid: boolean;
  multiplierTable: { lane: number; danger: number; multiplier: number }[];
  instructions: string[];
}

export interface ApiError {
  success: false;
  error: string;
}

export type PlaceBetResponse = StartSuccess | ApiError;

// ── API ───────────────────────────────────────────────────────────────────

export const chickenApi = {
  start: (token: string, betAmount: number, difficulty: Difficulty, laneCount?: number): Promise<PlaceBetResponse> =>
    request('/api/games/chicken/start', token, {
      method: 'POST',
      body: JSON.stringify({ betAmount, difficulty, laneCount }),
    }),

  reveal: (token: string, sessionId: string): Promise<RevealResponse> =>
    request('/api/games/chicken/reveal', token, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  cashout: (token: string, sessionId: string): Promise<CashoutSuccess | ApiError> =>
    request('/api/games/chicken/cashout', token, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  getCurrent: (token: string): Promise<CurrentSuccess | ApiError> =>
    request('/api/games/chicken/current', token, { method: 'GET' }),

  getHistory: (token: string, page = 1, limit = 20): Promise<HistorySuccess | ApiError> =>
    request(`/api/games/chicken/history?page=${page}&limit=${limit}`, token, { method: 'GET' }),

  verify: (token: string, sessionId: string): Promise<VerifySuccess | ApiError> =>
    request(`/api/games/chicken/verify/${sessionId}`, token, { method: 'GET' }),
};
