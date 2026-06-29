// lib/api/crashApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function authFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export interface CrashBet {
  userId:      string;
  username:    string;
  betAmount:   number;
  autoCashOut: number | null;
  cashedOutAt: number | null;
  payout:      number;
  status:      'active' | 'won' | 'lost';
}

export interface CrashRoundSummary {
  _id:          string;
  roundNumber:  number;
  status:       'waiting' | 'running' | 'crashed';
  crashPoint:   number;
  serverSeedHash: string;
  totalWagered: number;
  totalCashedOut: number;
  houseProfit:  number;
  createdAt:    string;
}

export interface VerifyResult {
  roundNumber:    number;
  serverSeed:     string;
  serverSeedHash: string;
  clientSeed:     string;
  crashPoint:     number;
  recomputed:     number;
  valid:          boolean;
  instructions:   string[];
}

export interface UserStats {
  totalBets:          number;
  totalWagered:       number;
  totalWon:           number;
  biggestWin:         number;
  biggestMultiplier:  number | null;
  winRate:            number;
  netProfit:          number;
}

export const crashApi = {
  getCurrent: (token: string) =>
    authFetch('/api/games/crash/current', token),

  getRounds: (token: string, page = 1, limit = 20) =>
    authFetch(`/api/games/crash/rounds?page=${page}&limit=${limit}`, token),

  getRoundById: (token: string, id: string) =>
    authFetch(`/api/games/crash/rounds/${id}`, token),

  verify: (token: string, roundId: string): Promise<{ success: boolean; verify: VerifyResult }> =>
    authFetch(`/api/games/crash/verify/${roundId}`, token),

  getStats: (token: string): Promise<{ success: boolean; stats: UserStats }> =>
    authFetch('/api/games/crash/stats', token),
};
