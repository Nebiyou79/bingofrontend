/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/api/adminApi.ts
 * All admin REST calls. Reads JWT from localStorage automatically.
 * Every function returns the raw parsed JSON — callers check `success`.
 */

const BASE = '/api/admin';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashbets_token') ?? '';
}

async function req<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json() as Promise<T>;
}

const get   = <T>(path: string)             => req<T>('GET',   path);
const post  = <T>(path: string, b: object)  => req<T>('POST',  path, b);
const put   = <T>(path: string, b: object)  => req<T>('PUT',   path, b);
const patch = <T>(path: string, b?: object) => req<T>('PATCH', path, b);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

export interface AdminUser {
  _id: string; username: string; email: string; phone: string;
  role: 'user' | 'admin'; balance: number; bonusBalance: number;
  isActive: boolean; isSuspended: boolean;
  vipLevel: number; vipPoints: number; totalWagered: number;
  totalSpins: number; biggestWin: number; createdAt: string; lastLogin: string | null;
}

export interface Transaction {
  _id: string; userId: any; type: string; amount: number;
  status: string; method: string | null; reference: string | null;
  agentName: string | null; agentPhone: string | null;
  notes: string | null; createdAt: string; processedAt: string | null;
  receiptUrl: string | null;
}

export interface Jackpot {
  _id: string; type: string; name: string; amount: number;
  seedAmount: number; incrementRate: number; isActive: boolean;
  color: string; icon: string; lastWonAt: string | null; winners: number;
}

// ── Lock state shapes (mirrors AdminSettings sub-documents) ────────────────────

export interface LockBase {
  enabled: boolean;
  enabledAt: string | null;
  gamesLimit: number | null;
  gamesPlayed: number;
  /** Derived by hooks/admin endpoints — not stored on model. */
  gamesRemaining?: number | null;
}

export interface AutoWinState extends LockBase {
  targetCardNumbers: number[];
  maxDrawsToWin: number | null;
  stakeFilter: string | null;
}

export interface SpinLockState extends LockBase {}

export interface CrashLockState extends LockBase {
  mode: 'instant' | 'capped';
  maxMultiplier: number;
}

export interface KenoLockState extends LockBase {
  strategy: 'minimize_payout' | 'avoid_picks';
  sampleSize: number;
}

export interface PlinkoLockState extends LockBase {
  centerSpread: 0 | 1 | 2;
}

export interface MinesLockState extends LockBase {
  strategy: 'front_load' | 'high_index' | 'random_dense';
  extraMines: number;
}

export interface SlotsLockState extends LockBase {
  mode: 'no_win' | 'min_win';
}

export interface DashboardControls {
  autoWin:    Pick<AutoWinState,    'enabled' | 'targetCardNumbers' | 'gamesLimit' | 'gamesPlayed'>;
  spinLock:   Pick<SpinLockState,   'enabled' | 'enabledAt'>;
  crashLock:  Pick<CrashLockState,  'enabled' | 'mode' | 'maxMultiplier' | 'gamesLimit' | 'gamesPlayed'>;
  kenoLock:   Pick<KenoLockState,   'enabled' | 'strategy' | 'gamesLimit' | 'gamesPlayed'>;
  plinkoLock: Pick<PlinkoLockState, 'enabled' | 'centerSpread' | 'gamesLimit' | 'gamesPlayed'>;
  minesLock:  Pick<MinesLockState,  'enabled' | 'strategy' | 'gamesLimit' | 'gamesPlayed'>;
  slotsLock:  Pick<SlotsLockState,  'enabled' | 'mode' | 'gamesLimit' | 'gamesPlayed'>;
}

export interface DashboardData {
  users: { total: number; newToday: number; newThisWeek: number };
  pendingActions: { deposits: number; withdrawals: number; total: number };
  liveGames: { kenoRound: any; bingoRooms: number };
  jackpots: Jackpot[];
  revenue: { houseToday: number; houseMonth: number };
  financials: {
    depositsThisMonth:    { count: number; total: number };
    withdrawalsThisMonth: { count: number; total: number };
    netFlow: number;
  };
  games: {
    spin:  { bets: number; wagered: number; paid: number; houseEdge: number };
    keno:  { bets: number; wagered: number; paid: number; houseEdge: number };
    bingo: { entries: number; wagered: number };
  };
  /** Live status of every game-manipulation control. */
  controls: DashboardControls;
}

// ── Shared lock response shapes ────────────────────────────────────────────────

type LockToggleResponse<K extends string, S> = { success: boolean; message: string } & Record<K, S>;
type LockAuditResponse<K extends string, S>  = { success: boolean } & Record<K, S> & { auditLog: any[] };

// ── Dashboard ──────────────────────────────────────────────────────────────────

export const fetchDashboard = () =>
  get<{ success: boolean; dashboard: DashboardData }>('/dashboard');

// ── Analytics ─────────────────────────────────────────────────────────────────

export const fetchAnalytics = (period: string, from?: string, to?: string) => {
  const q = new URLSearchParams({ period });
  if (from) q.set('from', from);
  if (to)   q.set('to',   to);
  return get<any>(`/analytics?${q}`);
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const fetchUsers = (params: Record<string, string | number> = {}) => {
  const q = new URLSearchParams(params as any).toString();
  return get<{ success: boolean; users: AdminUser[]; pagination: Pagination }>(`/users?${q}`);
};

export const fetchUserById = (id: string) =>
  get<{ success: boolean; user: AdminUser; recentTransactions: Transaction[]; stats: any }>(`/users/${id}`);

export const suspendUser = (id: string, reason?: string) =>
  patch<{ success: boolean; message: string }>(`/users/${id}/suspend`, { reason });

export const unsuspendUser = (id: string) =>
  patch<{ success: boolean; message: string }>(`/users/${id}/unsuspend`);

export const adjustBalance = (id: string, amount: number, type: string, notes?: string) =>
  post<{ success: boolean; message: string; newBalance: number }>(`/users/${id}/balance`, { amount, type, notes });

export const fetchUserTransactions = (id: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get<{ success: boolean; transactions: Transaction[]; pagination: Pagination }>(`/users/${id}/transactions?${q}`);
};

// ── Transactions ──────────────────────────────────────────────────────────────

export const fetchAllTransactions = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get<{ success: boolean; transactions: Transaction[]; pagination: Pagination }>(`/transactions?${q}`);
};

export const fetchPendingTransactions = (type?: string) => {
  const q = type ? `?type=${type}` : '';
  return get<{ success: boolean; transactions: Transaction[] }>(`/transactions/pending${q}`);
};

export const fetchTransactionById = (id: string) =>
  get<{ success: boolean; transaction: Transaction }>(`/transactions/${id}`);

export const approveDeposit = (id: string) =>
  patch<{ success: boolean; message: string }>(`/transactions/${id}/approve`);

export const rejectDeposit = (id: string, notes?: string) =>
  patch<{ success: boolean; message: string }>(`/transactions/${id}/reject`, { notes });

export const approveWithdrawal = (id: string) =>
  patch<{ success: boolean; message: string }>(`/transactions/${id}/withdrawal/approve`);

export const rejectWithdrawal = (id: string, notes?: string) =>
  patch<{ success: boolean; message: string }>(`/transactions/${id}/withdrawal/reject`, { notes });

// ── Settings ──────────────────────────────────────────────────────────────────

export const fetchSettings = () =>
  get<{ success: boolean; settings: any }>('/settings');

export const updateSettings = (data: any) =>
  put<{ success: boolean; message: string; settings: any }>('/settings', data);

// ── Auto-win ──────────────────────────────────────────────────────────────────

export const fetchAutoWinAudit = () =>
  get<{ success: boolean; autoWin: AutoWinState; auditLog: any[] }>('/autowin/audit');

export const enableAutoWin = (data: {
  targetCardNumbers: number[];
  maxDrawsToWin?: number | null;
  stakeFilter?: string | null;
  gamesLimit?: number | null;
  notes?: string;
}) => post<{ success: boolean; message: string; autoWin: AutoWinState }>('/autowin/enable', data);

export const disableAutoWin = (notes?: string) =>
  post<{ success: boolean; message: string }>('/autowin/disable', { notes });

// ── Spin lock ─────────────────────────────────────────────────────────────────

export const fetchSpinLock = () =>
  get<LockAuditResponse<'spinLock', SpinLockState>>('/spin-lock');

export const enableSpinLock = (data: { notes?: string } = {}) =>
  post<LockToggleResponse<'spinLock', SpinLockState>>('/spin-lock/enable', data);

export const disableSpinLock = (notes?: string) =>
  post<LockToggleResponse<'spinLock', SpinLockState>>('/spin-lock/disable', { notes });

// ── Crash lock ────────────────────────────────────────────────────────────────

export const fetchCrashLock = () =>
  get<LockAuditResponse<'crashLock', CrashLockState>>('/crash-lock');

export const enableCrashLock = (data: {
  mode?: 'instant' | 'capped';
  maxMultiplier?: number;
  gamesLimit?: number | null;
  notes?: string;
} = {}) => {  // ← ADD DEFAULT EMPTY OBJECT
  return post<LockToggleResponse<'crashLock', CrashLockState>>('/crash-lock/enable', data);
};

export const disableCrashLock = (notes?: string) =>
  post<LockToggleResponse<'crashLock', CrashLockState>>('/crash-lock/disable', { notes });

// ── Keno lock ─────────────────────────────────────────────────────────────────

export const fetchKenoLock = () =>
  get<LockAuditResponse<'kenoLock', KenoLockState>>('/keno-lock');

export const enableKenoLock = (data: {
  strategy?: 'minimize_payout' | 'avoid_picks';
  sampleSize?: number;
  gamesLimit?: number | null;
  notes?: string;
}) => post<LockToggleResponse<'kenoLock', KenoLockState>>('/keno-lock/enable', data);

export const disableKenoLock = (notes?: string) =>
  post<LockToggleResponse<'kenoLock', KenoLockState>>('/keno-lock/disable', { notes });

// ── Plinko lock ───────────────────────────────────────────────────────────────

export const fetchPlinkoLock = () =>
  get<LockAuditResponse<'plinkoLock', PlinkoLockState>>('/plinko-lock');

export const enablePlinkoLock = (data: {
  centerSpread?: 0 | 1 | 2;
  gamesLimit?: number | null;
  notes?: string;
}) => post<LockToggleResponse<'plinkoLock', PlinkoLockState>>('/plinko-lock/enable', data);

export const disablePlinkoLock = (notes?: string) =>
  post<LockToggleResponse<'plinkoLock', PlinkoLockState>>('/plinko-lock/disable', { notes });

// ── Mines lock ────────────────────────────────────────────────────────────────

export const fetchMinesLock = () =>
  get<LockAuditResponse<'minesLock', MinesLockState>>('/mines-lock');

export const enableMinesLock = (data: {
  strategy?: 'front_load' | 'high_index' | 'random_dense';
  extraMines?: number;
  gamesLimit?: number | null;
  notes?: string;
}) => post<LockToggleResponse<'minesLock', MinesLockState>>('/mines-lock/enable', data);

export const disableMinesLock = (notes?: string) =>
  post<LockToggleResponse<'minesLock', MinesLockState>>('/mines-lock/disable', { notes });

// ── Slots lock ────────────────────────────────────────────────────────────────

export const fetchSlotsLock = () =>
  get<LockAuditResponse<'slotsLock', SlotsLockState>>('/slots-lock');

export const enableSlotsLock = (data: {
  mode?: 'no_win' | 'min_win';
  gamesLimit?: number | null;
  notes?: string;
}) => post<LockToggleResponse<'slotsLock', SlotsLockState>>('/slots-lock/enable', data);

export const disableSlotsLock = (notes?: string) =>
  post<LockToggleResponse<'slotsLock', SlotsLockState>>('/slots-lock/disable', { notes });

// ── Bingo ─────────────────────────────────────────────────────────────────────

export const fetchBingoRooms = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get<{ success: boolean; rooms: any[]; pagination: Pagination }>(`/bingo/rooms?${q}`);
};

export const fetchBingoRoomById = (id: string) =>
  get<{ success: boolean; room: any }>(`/bingo/rooms/${id}`);

// ── Keno ──────────────────────────────────────────────────────────────────────

export const fetchKenoRounds = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get<{ success: boolean; rounds: any[]; pagination: Pagination }>(`/keno/rounds?${q}`);
};

export const fetchKenoRoundById = (id: string) =>
  get<{ success: boolean; round: any; tickets: any[] }>(`/keno/rounds/${id}`);

// ── Pool ──────────────────────────────────────────────────────────────────────

export const fetchPoolGames = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get<{ success: boolean; games: any[]; pagination: Pagination }>(`/pool/games?${q}`);
};

// ── Jackpots ──────────────────────────────────────────────────────────────────

export const fetchJackpots = () =>
  get<{ success: boolean; jackpots: Jackpot[] }>('/jackpots');

export const seedJackpot = (type: string, amount: number) =>
  patch<{ success: boolean; message: string; jackpot: Jackpot }>(`/jackpots/${type}/seed`, { amount });

export const resetJackpot = (type: string) =>
  patch<{ success: boolean; message: string; jackpot: Jackpot }>(`/jackpots/${type}/reset`);

export const toggleJackpot = (type: string, isActive: boolean) =>
  patch<{ success: boolean; message: string; jackpot: Jackpot }>(`/jackpots/${type}/toggle`, { isActive });