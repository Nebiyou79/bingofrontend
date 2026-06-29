// lib/api/slotsApi.ts

/**
 * DashBets — Slots API Client
 * Follows kenoApi.ts pattern: fetchWithTimeout + AbortController.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const TIMEOUT  = 10_000;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('dashbets_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotSymbol = 'cherry' | 'lemon' | 'orange' | 'grape' | 'seven' | 'wild';

export interface SpinResult {
  spinId:             string;
  reels:              SlotSymbol[];
  stops:              number[];
  multiplier:         number;
  payout:             number;
  isWin:              boolean;
  winType:            string;
  winningLine:        number[];
  triggeredFreeSpins: boolean;
  freeSpinsAwarded:   number;
  freeSpinsSessionId: string | null;
  serverSeedHash:     string;
  serverSeed:         string;
  clientSeed:         string;
  nonce:              number;
  newBalance:         number;
  vip:                { leveledUp: boolean; newLevel?: number; currentLevel?: number };
}

export interface FreeSpinResult extends Omit<SpinResult, 'triggeredFreeSpins' | 'freeSpinsAwarded' | 'freeSpinsSessionId' | 'vip'> {
  isFreeSpinBonus:    true;
  freeSpinsRemaining: number;
}

export interface SlotSpin {
  _id:                string;
  betAmount:          number;
  reels:              SlotSymbol[];
  multiplier:         number;
  payout:             number;
  isWin:              boolean;
  winType:            string;
  isFreeSpinBonus:    boolean;
  triggeredFreeSpins: boolean;
  freeSpinsAwarded:   number;
  createdAt:          string;
}

export interface SlotStats {
  totalSpins:   number;
  totalWagered: number;
  totalPayout:  number;
  totalWins:    number;
  netProfit:    number;
  winRate:      string;
  bestWin:      { payout: number; multiplier: number; winType: string; reels: SlotSymbol[]; createdAt: string } | null;
}

export interface SlotConfig {
  symbols:         SlotSymbol[];
  reelWeights:     Record<SlotSymbol, number>;
  paytable:        Array<{ combination: string[]; multiplier: number; label: string }>;
  minBet:          number;
  maxBet:          number;
  freeSpinCount:   number;
  freeBonusSymbol: string;
  rtpTarget:       string;
}

interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function spinSlots(
  betAmount: number,
  clientSeed?: string,
): Promise<SpinResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/slots/spin`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ betAmount, clientSeed }),
  });
  const json: ApiResponse<SpinResult> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Spin failed');
  return json.data!;
}

export async function playFreeSpin(
  freeSpinsSessionId: string,
): Promise<FreeSpinResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/slots/freespin`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ freeSpinsSessionId }),
  });
  const json: ApiResponse<FreeSpinResult> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Free spin failed');
  return json.data!;
}

export async function getSlotHistory(
  page = 1,
  limit = 20,
): Promise<{ spins: SlotSpin[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/games/slots/history?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'History fetch failed');
  return json.data;
}

export async function getSlotStats(): Promise<SlotStats> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/slots/stats`, {
    headers: getAuthHeaders(),
  });
  const json: ApiResponse<SlotStats> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Stats fetch failed');
  return json.data!;
}

export async function getSlotConfig(): Promise<SlotConfig> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/slots/config`, {});
  const json: ApiResponse<SlotConfig> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Config fetch failed');
  return json.data!;
}

export async function verifySlotSpin(spinId: string): Promise<{
  spinId:         string;
  serverSeed:     string;
  serverSeedHash: string;
  clientSeed:     string;
  nonce:          number;
  storedReels:    SlotSymbol[];
  derivedReels:   SlotSymbol[];
  verified:       boolean;
}> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/games/slots/verify/${spinId}`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Verify failed');
  return json.data;
}
