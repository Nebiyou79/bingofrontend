/**
 * lib/api/hiloApi.ts
 * Typed fetch wrappers for the DashBets Hi-Lo endpoints.
 * Follows the same pattern as kenoApi.ts: timeout, robust error extraction,
 * response-union approach.
 */

const BASE    = '/api/games/hilo';
const TIMEOUT = 10_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HiloCard {
  index:   number;
  rank:    string;
  suit:    string;
  value:   number;
  display: string;
  color:   'red' | 'black';
}

export interface HiloPredictionOdds {
  outcomeCount:   number;
  totalRemaining: number;
  probability:    number;
  multiplier:     number;
}

export interface HiloOdds {
  higher: HiloPredictionOdds;
  lower:  HiloPredictionOdds;
  equal:  HiloPredictionOdds;
}

export interface HiloStartResponse {
  success:        true;
  sessionId:      string;
  serverSeedHash: string;
  currentCard:    HiloCard;
  odds:           HiloOdds;
  multiplier:     number;
  betAmount:      number;
}

export interface HiloGuessResponse {
  success:          boolean;
  result:           'correct' | 'lost';
  prediction:       'higher' | 'lower' | 'equal';
  currentCard:      HiloCard;
  nextCard:         HiloCard;
  odds?:            HiloOdds;
  multiplier?:      number;
  stepMultiplier?:  number;
  stepCount?:       number;
  potentialPayout?: number;
  deckExhausted?:   boolean;
  payout?:          number;
  serverSeed?:      string;
  message:          string;
}

export interface HiloSkipResponse {
  success:         true;
  action:          'skip';
  currentCard:     HiloCard;
  odds:            HiloOdds;
  multiplier:      number;
  potentialPayout: number;
  stepCount:       number;
}

export interface HiloCashoutResponse {
  success:    true;
  payout:     number;
  multiplier: number;
  stepCount:  number;
  newBalance: number;
  serverSeed: string;
}

export interface HiloCurrentResponse {
  success: true;
  session: {
    sessionId:       string;
    serverSeedHash:  string;
    currentCard:     HiloCard;
    odds:            HiloOdds;
    multiplier:      number;
    betAmount:       number;
    stepCount:       number;
    potentialPayout: number;
    expiresAt:       string;
  } | null;
}

export interface HiloHistorySession {
  _id:               string;
  betAmount:         number;
  currentMultiplier: number;
  stepCount:         number;
  payout:            number;
  status:            'cashed_out' | 'lost';
  multiplierHistory: number[];
  createdAt:         string;
}

export interface HiloHistoryResponse {
  success: true;
  sessions: HiloHistorySession[];
  pagination: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error:   string;
  message?: string;
}

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

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function post<T>(path: string, body: object): Promise<T | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}${path}`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
    });
    return res.json() as Promise<T | ApiError>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError')
      return { success: false, error: 'Request timed out' };
    return { success: false, error: 'Network error' };
  }
}

async function get<T>(path: string): Promise<T | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<T | ApiError>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError')
      return { success: false, error: 'Request timed out' };
    return { success: false, error: 'Network error' };
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const startSession  = (betAmount: number, clientSeed?: string) =>
  post<HiloStartResponse>('/start', { betAmount, clientSeed: clientSeed ?? '' });

export const submitGuess   = (sessionId: string, prediction: 'higher' | 'lower' | 'equal') =>
  post<HiloGuessResponse>('/guess', { sessionId, prediction });

export const skipCard      = (sessionId: string) =>
  post<HiloSkipResponse>('/skip', { sessionId });

export const cashout       = (sessionId: string) =>
  post<HiloCashoutResponse>('/cashout', { sessionId });

export const getCurrentSession = () =>
  get<HiloCurrentResponse>('/current');

export const getHistory    = (page = 1, limit = 20) =>
  get<HiloHistoryResponse>(`/history?page=${page}&limit=${limit}`);