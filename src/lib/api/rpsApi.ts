// lib/api/rpsApi.ts

/**
 * DashBets — RPS API Client
 * Follows kenoApi.ts / slotsApi.ts pattern exactly.
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

export type RPSChoice  = 'rock' | 'paper' | 'scissors';
export type RPSMode    = 'single' | 'chain';
export type RPSOutcome = 'win' | 'lose' | 'tie';
export type RPSStatus  = 'active' | 'completed' | 'lost' | 'tied';

export interface RPSGameStarted {
  gameId:          string;
  mode:            RPSMode;
  betAmount:       number;
  serverSeedHash:  string;   // committed before player picks
  clientSeed:      string;
  status:          'active';
  winStreak:       number;
  potentialPayout: number;
  newBalance:      number;
}

export interface RPSRoundResult {
  gameId:          string;
  roundNumber:     number;
  playerChoice:    RPSChoice;
  houseChoice:     RPSChoice;
  outcome:         RPSOutcome;
  status:          RPSStatus;
  // Single mode resolved fields
  finalPayout?:    number;
  multiplier?:     number;
  isWin?:          boolean;
  serverSeed?:     string;   // revealed on game end
  // Chain mode in-progress fields
  winStreak?:      number;
  potentialPayout?: number;
  nextRoundHash?:  string;
  maxChain?:       number;
  autoCompleted?:  boolean;
  newBalance?:     number | null;
}

export interface RPSCashOutResult {
  gameId:       string;
  winStreak:    number;
  finalPayout:  number;
  multiplier:   number;
  isWin:        true;
  status:       'completed';
  newBalance:   number;
  serverSeed:   string;
}

export interface RPSGame {
  _id:             string;
  mode:            RPSMode;
  status:          RPSStatus;
  betAmount:       number;
  rounds:          Array<{
    roundNumber:     number;
    playerChoice:    RPSChoice;
    houseChoice:     RPSChoice;
    outcome:         RPSOutcome;
    potentialPayout: number;
  }>;
  winStreak:       number;
  finalPayout:     number;
  finalMultiplier: number;
  isWin:           boolean;
  createdAt:       string;
  resolvedAt:      string | null;
}

export interface RPSStats {
  totalGames:   number;
  totalWagered: number;
  totalPayout:  number;
  totalWins:    number;
  bestStreak:   number;
  netProfit:    number;
  winRate:      string;
  bestWin:      { finalPayout: number; finalMultiplier: number; winStreak: number; mode: RPSMode; createdAt: string } | null;
}

export interface RPSConfig {
  choices:             RPSChoice[];
  modes:               RPSMode[];
  minBet:              number;
  maxBet:              number;
  singleWinMultiplier: number;
  chainMultipliers:    number[];
  maxChain:            number;
  rtpTarget:           string;
}

interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function startRPSGame(
  betAmount: number,
  mode: RPSMode,
  clientSeed?: string,
): Promise<RPSGameStarted> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/rps/start`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ betAmount, mode, clientSeed }),
  });
  const json: ApiResponse<RPSGameStarted> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Failed to start RPS game');
  return json.data!;
}

export async function playRPSRound(
  gameId: string,
  playerChoice: RPSChoice,
): Promise<RPSRoundResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/rps/play`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ gameId, playerChoice }),
  });
  const json: ApiResponse<RPSRoundResult> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Round play failed');
  return json.data!;
}

export async function cashOutRPS(gameId: string): Promise<RPSCashOutResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/rps/cashout`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ gameId }),
  });
  const json: ApiResponse<RPSCashOutResult> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Cash out failed');
  return json.data!;
}

export async function getRPSHistory(
  page = 1,
  limit = 20,
): Promise<{ games: RPSGame[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/games/rps/history?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'History fetch failed');
  return json.data;
}

export async function getRPSStats(): Promise<RPSStats> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/rps/stats`, {
    headers: getAuthHeaders(),
  });
  const json: ApiResponse<RPSStats> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Stats fetch failed');
  return json.data!;
}

export async function getRPSConfig(): Promise<RPSConfig> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/games/rps/config`, {});
  const json: ApiResponse<RPSConfig> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Config fetch failed');
  return json.data!;
}

export async function verifyRPSGame(gameId: string): Promise<{
  gameId:         string;
  serverSeed:     string;
  serverSeedHash: string;
  clientSeed:     string;
  rounds:         Array<{ roundNumber: number; playerChoice: RPSChoice; storedHouse: RPSChoice; derivedHouse: RPSChoice; verified: boolean; outcome: RPSOutcome }>;
  allVerified:    boolean;
}> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/games/rps/verify/${gameId}`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Verify failed');
  return json.data;
}
