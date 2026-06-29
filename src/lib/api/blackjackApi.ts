/**
 * lib/api/blackjackApi.ts
 * Typed fetch wrappers for the DashBets Blackjack Lite endpoints.
 * Mirrors kenoApi.ts exactly: same auth pattern, same error shape,
 * same fetchWithTimeout + AbortController pattern.
 *
 * Endpoints consumed:
 *   POST /api/games/blackjack/start            → startGame()
 *   POST /api/games/blackjack/hit              → hit()
 *   POST /api/games/blackjack/stand            → stand()
 *   GET  /api/games/blackjack/current          → getCurrentSession()
 *   GET  /api/games/blackjack/history          → getHistory()
 *   GET  /api/games/blackjack/verify/:id       → verify()
 */

const BASE    = '/api/games/blackjack';
const TIMEOUT = 10_000; // 10 seconds

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single playing card as returned by the server. */
export interface BJCard {
  index?:   number | null;
  rank?:    string | null;
  suit?:    string | null;
  value?:   number | null;
  hidden?:  boolean;
  /** e.g. 'AS', 'KH', '10D', '??' for hole card */
  display:  string;
}

export type BJPhase   = 'player_turn' | 'dealer_turn' | 'settled';
export type BJOutcome = 'player_win' | 'dealer_win' | 'push';

export interface BJStartResponse {
  success:         true;
  sessionId:       string;
  serverSeedHash:  string;
  playerCards:     BJCard[];
  /** Only [0] is real during player_turn; [1] is { display: '??', hidden: true } */
  dealerCards:     BJCard[];
  playerTotal:     number;
  phase:           BJPhase;
  betAmount:       number;
  newBalance:      number;
  // Present only when game settles immediately (natural Blackjack)
  isBlackjack?:    boolean;
  dealerBlackjack?: boolean;
  outcome?:        BJOutcome;
  payout?:         number;
  dealerTotal?:    number;
  serverSeed?:     string;
}

export interface BJHitResponse {
  success:       true;
  newCard:       BJCard;
  playerCards:   BJCard[];
  playerTotal:   number;
  phase:         BJPhase;
  // Present only when player busts
  isBust?:       boolean;
  outcome?:      BJOutcome;
  payout?:       number;
  dealerCards?:  BJCard[];
  dealerTotal?:  number;
  serverSeed?:   string;
  newBalance?:   number;
}

export interface BJStandResponse {
  success:      true;
  dealerCards:  BJCard[];
  dealerTotal:  number;
  playerTotal:  number;
  phase:        'settled';
  outcome:      BJOutcome;
  payout:       number;
  isWin:        boolean;
  serverSeed:   string;
  newBalance:   number;
}

export interface BJCurrentResponse {
  success: true;
  session: null | {
    sessionId:      string;
    serverSeedHash: string;
    playerCards:    BJCard[];
    dealerCards:    BJCard[];
    playerTotal:    number;
    betAmount:      number;
    phase:          BJPhase;
  };
}

export interface BJHistoryResponse {
  success:    true;
  sessions:   BJSession[];
  pagination: BJPagination;
}

export interface BJSession {
  _id:            string;
  betAmount:      number;
  playerCards:    BJCard[];
  dealerCards:    BJCard[];
  playerTotal:    number;
  dealerTotal:    number;
  outcome:        BJOutcome;
  payout:         number;
  isWin:          boolean;
  serverSeedHash: string;
  createdAt:      string;
}

export interface BJPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
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

function authHeaders(): HeadersInit {
  return {
    Authorization:  `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

// ── Fetch with timeout ────────────────────────────────────────────────────────

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
    return {
      success: false,
      error:   'Request timed out',
      message: 'The server took too long to respond. Please try again.',
    };
  }
  return {
    success: false,
    error:   'Network error',
    message: 'Could not reach the server. Check your connection.',
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Deal the initial hand and start a new Blackjack session.
 * Deducts betAmount from balance atomically.
 */
export async function startGame(
  betAmount: number,
  clientSeed = ''
): Promise<BJStartResponse | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}/start`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ betAmount, clientSeed }),
    });
    return res.json() as Promise<BJStartResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Draw one card for the player.
 * Returns updated player hand; settles immediately if player busts.
 */
export async function hit(sessionId: string): Promise<BJHitResponse | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}/hit`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ sessionId }),
    });
    return res.json() as Promise<BJHitResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * End player turn. Server plays out dealer hand and settles the round.
 * Returns full dealer hand, outcome, payout, and revealed serverSeed.
 */
export async function stand(sessionId: string): Promise<BJStandResponse | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}/stand`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ sessionId }),
    });
    return res.json() as Promise<BJStandResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Fetch the player's current active session.
 * Used to resume after a page refresh. Returns null if no active session.
 */
export async function getCurrentSession(): Promise<BJCurrentResponse | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}/current`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<BJCurrentResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Fetch paginated session history (settled rounds only).
 */
export async function getHistory(
  page  = 1,
  limit = 20
): Promise<BJHistoryResponse | ApiError> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res    = await fetchWithTimeout(`${BASE}/history?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<BJHistoryResponse | ApiError>;
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Verify a settled session provably fairly.
 * Reveals serverSeed and reconstructs initial deal from seed.
 */
export async function verify(sessionId: string): Promise<object | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}/verify/${sessionId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  } catch (err) {
    return handleNetworkError(err);
  }
}
