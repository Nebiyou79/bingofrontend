// lib/api/giovaniApi.ts

/**
 * DashBets — Giovani API Client (5×3 grid, 25 paylines)
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

export type GiovaniSymbol = 'ten' | 'jack' | 'queen' | 'king' | 'ace' | 'gem' | 'lion' | 'crown' | 'chest';

/** grid[reel][row] — 5 reels x 3 rows */
export type GiovaniGrid = GiovaniSymbol[][];

export interface WinningLine {
  lineIndex: number;        // 0-24
  symbol:    GiovaniSymbol;
  length:    number;        // 3, 4, or 5
  mult:      number;
  win:       number;
  cells:     [number, number][]; // [reel, row] pairs covered by the matched run
}

export interface SpinResult {
  spinId:             string;
  grid:               GiovaniGrid;
  multiplier:         number;
  payout:             number;
  isWin:              boolean;
  winType:            string;
  winningLines:       WinningLine[];
  scatterCount:        number;
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

export interface GiovaniSpinRecord {
  _id:                string;
  betAmount:          number;
  grid:               GiovaniGrid;
  multiplier:         number;
  payout:             number;
  isWin:              boolean;
  winType:            string;
  winningLines:       WinningLine[];
  scatterCount:       number;
  isFreeSpinBonus:    boolean;
  triggeredFreeSpins: boolean;
  freeSpinsAwarded:   number;
  createdAt:          string;
}

export interface GiovaniStats {
  totalSpins:   number;
  totalWagered: number;
  totalPayout:  number;
  totalWins:    number;
  netProfit:    number;
  winRate:      string;
  bestWin:      { payout: number; multiplier: number; winType: string; grid: GiovaniGrid; createdAt: string } | null;
}

export interface GiovaniConfig {
  symbols:         GiovaniSymbol[];
  reelWeights:     Record<GiovaniSymbol, number>;
  reelCount:       number;
  rowCount:        number;
  paylineCount:    number;
  paylines:        number[][];
  paytable:        Array<{ combination: string[]; multiplier: number; label: string }>;
  minBet:          number;
  maxBet:          number;
  freeBonusSymbol: string;
  scatterSymbol:   string;
  rtpTarget:       string;
}

interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function spinGiovani(
  betAmount: number,
  clientSeed?: string,
): Promise<SpinResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/giovani/spin`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ betAmount, clientSeed }),
  });
  const json: ApiResponse<SpinResult> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Spin failed');
  return json.data!;
}

export async function playGiovaniFreeSpin(
  freeSpinsSessionId: string,
): Promise<FreeSpinResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/giovani/freespin`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ freeSpinsSessionId }),
  });
  const json: ApiResponse<FreeSpinResult> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Free spin failed');
  return json.data!;
}

export async function getGiovaniHistory(
  page = 1,
  limit = 20,
): Promise<{ spins: GiovaniSpinRecord[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/games/giovani/history?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'History fetch failed');
  return json.data;
}

export async function getGiovaniStats(): Promise<GiovaniStats> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/giovani/stats`, {
    headers: getAuthHeaders(),
  });
  const json: ApiResponse<GiovaniStats> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Stats fetch failed');
  return json.data!;
}

export async function getGiovaniConfig(): Promise<GiovaniConfig> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/giovani/config`, {});
  const json: ApiResponse<GiovaniConfig> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Config fetch failed');
  return json.data!;
}

export async function verifyGiovaniSpin(spinId: string): Promise<{
  spinId:         string;
  serverSeed:     string;
  serverSeedHash: string;
  clientSeed:     string;
  nonce:          number;
  storedGrid:     GiovaniGrid;
  derivedGrid:    GiovaniGrid;
  verified:       boolean;
}> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/games/giovani/verify/${spinId}`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Verify failed');
  return json.data;
}