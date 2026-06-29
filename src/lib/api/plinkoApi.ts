// lib/api/plinkoApi.ts

/**
 * DashBets — Plinko API Client
 *
 * FIX: Token key changed from 'token' → 'dashbets_token' to match
 * useAuth.ts (TOKEN_KEY = 'dashbets_token'). Mismatch was causing 401s
 * on every authenticated endpoint because the Authorization header was
 * being sent empty.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PlinkoRisk = 'low' | 'medium' | 'high';
export type PlinkoRows = 8 | 12 | 16;
export type BallStep   = 'L' | 'R';

export interface PlinkoBetRequest {
  betAmount:   number;
  rows:        PlinkoRows;
  risk:        PlinkoRisk;
  clientSeed?: string;
}

export interface PlinkoBetResult {
  betAmount:      number;
  betId:          string;
  path:           BallStep[];
  bucketIndex:    number;
  multiplier:     number;
  payout:         number;
  isWin:          boolean;
  serverSeed:     string;
  serverSeedHash: string;
  clientSeed:     string;
  newBalance:     number;
}

export interface PlinkoBetRecord {
  _id:            string;
  betAmount:      number;
  rows:           PlinkoRows;
  risk:           PlinkoRisk;
  serverSeedHash: string;
  clientSeed:     string;
  path:           BallStep[];
  bucketIndex:    number;
  multiplier:     number;
  payout:         number;
  isWin:          boolean;
  createdAt:      string;
}

export interface PlinkoHistoryResponse {
  bets: PlinkoBetRecord[];
  pagination: {
    page:  number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PlinkoStats {
  totalBets:    number;
  totalWagered: number;
  totalPayout:  number;
  totalWins:    number;
  netProfit:    number;
  winRate:      string;
  bestWin:      PlinkoBetRecord | null;
}

export interface PlinkoVerifyResult {
  betId:          string;
  serverSeed:     string;
  serverSeedHash: string;
  clientSeed:     string;
  rows:           PlinkoRows;
  storedPath:     BallStep[];
  derivedPath:    BallStep[];
  storedBucket:   number;
  derivedBucket:  number;
  hash:           string;
  verified:       boolean;
}

export interface PlinkoConfig {
  validRows:    PlinkoRows[];
  validRisks:   PlinkoRisk[];
  minBet:       number;
  maxBet:       number;
  bucketTables: Record<number, Record<PlinkoRisk, number[]>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token key — must match useAuth.ts TOKEN_KEY exactly
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'dashbets_token'; // ← was 'token' — that caused the 401s

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers ?? {}),
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────────────────────

export async function placePlinkoBet(payload: PlinkoBetRequest): Promise<PlinkoBetResult> {
  return apiFetch<PlinkoBetResult>('/api/games/plinko/bet', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

export async function getPlinkoHistory(page = 1, limit = 20): Promise<PlinkoHistoryResponse> {
  return apiFetch<PlinkoHistoryResponse>(
    `/api/games/plinko/history?page=${page}&limit=${limit}`,
  );
}

export async function getPlinkoStats(): Promise<PlinkoStats> {
  return apiFetch<PlinkoStats>('/api/games/plinko/stats');
}

export async function verifyPlinkoBet(betId: string): Promise<PlinkoVerifyResult> {
  return apiFetch<PlinkoVerifyResult>(`/api/games/plinko/verify/${betId}`);
}

export async function getPlinkoConfig(): Promise<PlinkoConfig> {
  return apiFetch<PlinkoConfig>('/api/games/plinko/config');
}