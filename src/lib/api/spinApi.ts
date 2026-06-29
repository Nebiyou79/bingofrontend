/**
 * lib/api/spinApi.ts  v2.0
 *
 * Updated SpinResult type to include all new v2 fields:
 *   segmentIndex, isJackpot, jackpotType, payout alias
 * Accepts both `payout` and `netPayout` from backend.
 */

const BASE = '/api/games/spin';

// ─── Outcome types (all 12 from spinEngine) ───────────────────────────────────

export type SpinOutcome =
  | 'loss' | 'refund' | 'even'
  | '2x' | '3x' | 'bonus' | 'mega' | 'epic'
  | 'mini_jp' | 'minor_jp' | 'major_jp' | 'grand_jp'
  | 'win' | 'jackpot' | 'pending'; // legacy aliases

export type WheelType = 'standard' | 'enhanced' | 'vip' | 'mega';

export interface ProvablyFairData {
  serverSeed:  string;
  clientSeed:  string;
  nonce:       number;
  hashedSeed:  string;
  verified:    boolean;
  verifyUrl?:  string;
}

export interface SpinResult {
  // Outcome
  result:         string;
  multiplier:     number;
  stopAngle:      number;   // centre of winning segment (0-360)
  segmentIndex:   number;   // 0-15
  segmentOrder:   string[]; // 16 labels
  wheelType?:     WheelType;

  // Payout — backend returns BOTH names
  betAmount:      number;
  grossWin:       number;
  commission:     number;
  netPayout:      number;   // primary
  payout?:        number;   // alias (same value)
  newBalance:     number;
  isWin:          boolean;

  // Jackpot
  isJackpot?:     boolean;
  jackpotType?:   string | null;
  jackpotWon?:    { type: string; amount: number } | null;

  // Meta
  duplicate?:     boolean;
  betId?:         string;
  vipPointsEarned?: number;
  animationConfig?: Record<string, unknown>;
  provablyFair?:  ProvablyFairData;
}

export interface SpinBet {
  _id:         string;
  betAmount:   number;
  result:      string;
  multiplier:  number;
  grossWin:    number;
  commission:  number;
  payout:      number;
  status:      'settled' | 'refunded' | 'pending' | 'error';
  wheelType?:  WheelType;
  createdAt:   string;
  provablyFair?: {
    hashedSeed: string;
    nonce:      number;
    verified:   boolean;
  } | null;
}

export interface SpinPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface TodayStats {
  totalSpins: number;
  wins:       number;
  losses:     number;
  totalBet:   number;
  totalWon:   number;
  netPnl:     number;
}

export interface SpinHistoryResponse {
  success:    true;
  bets:       SpinBet[];
  pagination: SpinPagination;
  todayStats: TodayStats;
}

export interface VerifyResponse {
  success:     true;
  isValid:     boolean;
  actual:      { result: string; multiplier: number; payout: number };
  expected:    { result: string; multiplier: number };
  randomValue: number;
  hash:        string;
  message:     string;
}

export interface UserSpinStats {
  success: true;
  stats: {
    highestMultiplier: number;
    biggestWin:        number;
    totalSpins:        number;
    totalWagered:      number;
    vipLevel:          number;
    vipPoints:         number;
    winStreak:         number;
    rtp:               number;
    winRate:           number;
    daily:             TodayStats;
    weekly:            TodayStats;
    allTime:           TodayStats;
  };
}

interface ApiError {
  success: false;
  error:   string;
  message?: string;
}

type PlaceBetResponse = ({ success: true } & SpinResult) | ApiError;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashbets_token') ?? '';
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

async function safeJson<T>(res: Response): Promise<T | ApiError> {
  try {
    return await res.json() as T;
  } catch {
    return { success: false, error: `HTTP ${res.status}`, message: res.statusText };
  }
}

// ─── Request ID ───────────────────────────────────────────────────────────────

export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function placeBet(
  betAmount: number,
  requestId: string,
  clientSeed?: string,
): Promise<PlaceBetResponse> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ betAmount, requestId, clientSeed }),
  });
  return safeJson<PlaceBetResponse>(res) as Promise<PlaceBetResponse>;
}

export async function getHistory(
  page = 1,
  limit = 20,
  filters?: {
    result?: SpinOutcome | 'all';
    status?: 'settled' | 'refunded' | 'all';
    from?:   string;
    to?:     string;
  },
): Promise<SpinHistoryResponse | ApiError> {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.result && filters.result !== 'all') p.set('result', filters.result);
  if (filters?.status && filters.status !== 'all') p.set('status', filters.status);
  if (filters?.from) p.set('from', filters.from);
  if (filters?.to)   p.set('to',   filters.to);
  const res = await fetch(`${BASE}/history?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  return safeJson<SpinHistoryResponse>(res);
}

export async function verifySpin(betId: string): Promise<VerifyResponse | ApiError> {
  const res = await fetch(`${BASE}/verify/${betId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  return safeJson<VerifyResponse>(res);
}

export async function getWheelInfo(): Promise<any> {
  const res = await fetch(`${BASE}/wheel-info`, { headers: { Authorization: `Bearer ${getToken()}` } });
  return safeJson<any>(res);
}

export async function getUserSpinStats(): Promise<UserSpinStats | ApiError> {
  const res = await fetch(`${BASE}/stats`, { headers: { Authorization: `Bearer ${getToken()}` } });
  return safeJson<UserSpinStats>(res);
}