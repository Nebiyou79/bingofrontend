// lib/api/cardDrawApi.ts
/**
 * lib/api/cardDrawApi.ts
 * Typed fetch wrappers for the DashBets Card Draw endpoints.
 */

const BASE    = '/api/games/card-draw';
const TIMEOUT = 10_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type BetType = 'color' | 'suit' | 'exact';

export interface CardDrawBet {
  type:   BetType;
  value:  string;
  amount: number;
}

export interface DrawnCard {
  index:   number;
  rank:    string;
  suit:    string;
  value:   number;
  display: string;
  color:   'red' | 'black';
}

export interface SettledBet extends CardDrawBet {
  multiplier: number;
  payout:     number;
  isWin:      boolean;
}

export interface CardDrawPlayResponse {
  success:        true;
  roundId:        string;
  serverSeedHash: string;
  drawnCard:      DrawnCard;
  bets:           SettledBet[];
  totalWagered:   number;
  totalPayout:    number;
  netProfit:      number;
  isWin:          boolean;
  balanceBefore:  number;
  balanceAfter:   number;
}

export interface CardDrawRound {
  _id:            string;
  bets:           SettledBet[];
  totalWagered:   number;
  totalPayout:    number;
  netProfit:      number;
  isWin:          boolean;
  drawnCard:      DrawnCard;
  serverSeedHash: string;
  clientSeed:     string;
  status:         'settled';
  createdAt:      string;
}

export interface CardDrawHistoryResponse {
  success: true;
  rounds:  CardDrawRound[];
  pagination: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

export interface CardDrawPayoutTableResponse {
  success: true;
  table: { type: BetType; description: string; multiplier: number }[];
  note:  string;
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

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function playCardDraw(
  bets: CardDrawBet[],
  clientSeed = ''
): Promise<CardDrawPlayResponse | ApiError> {
  try {
    const token = getToken();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth Token:', token ? `${token.substring(0, 20)}...` : 'MISSING');
    }
    
    const payload = { bets, clientSeed };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Request Payload:', JSON.stringify(payload, null, 2));
    }
    
    const res = await fetchWithTimeout(`${BASE}/play`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('📥 Response Status:', res.status, res.statusText);
    }
    
    // Try to parse as JSON
    let data: CardDrawPlayResponse | ApiError;
    try {
      data = await res.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Response Data:', data);
      }
    } catch (parseError) {
      const clonedRes = res.clone();
      const rawText = await clonedRes.text();
      console.error('❌ Failed to parse response as JSON:', rawText);
      return { 
        success: false, 
        error: `Server returned invalid JSON (Status ${res.status})`,
        message: rawText.substring(0, 200)
      };
    }

    if (!data.success) {
      console.error('❌ Server Error:', data);
    }

    return data;
  } catch (err) {
    console.error('🔥 Network/Request Error:', err);
    if (err instanceof DOMException && err.name === 'AbortError')
      return { success: false, error: 'Request timed out' };
    return { success: false, error: 'Network error' };
  }
}

export async function getCardDrawHistory(
  page = 1, limit = 20
): Promise<CardDrawHistoryResponse | ApiError> {
  try {
    const res = await fetchWithTimeout(
      `${BASE}/history?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return res.json() as Promise<CardDrawHistoryResponse | ApiError>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError')
      return { success: false, error: 'Request timed out' };
    return { success: false, error: 'Network error' };
  }
}

export async function getPayoutTable(): Promise<CardDrawPayoutTableResponse | ApiError> {
  try {
    const res = await fetchWithTimeout(`${BASE}/payout-table`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json() as Promise<CardDrawPayoutTableResponse | ApiError>;
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
}