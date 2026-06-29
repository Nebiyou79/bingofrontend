/**
 * walletApi.ts
 * Typed fetch wrappers for every DashBets wallet endpoint.
 * Throws on network failures; callers handle logical errors via `success`.
 */

const BASE = '/api/wallet';

// ─── shared types ────────────────────────────────────────────────────────────

export type DepositMethod = 'telebirr' | 'cbebirr';

export interface Agent {
  name: string;
  phone: string;
  method: DepositMethod;
}

export interface InitiatedDeposit {
  transactionId: string;
  amount: number;
  method: DepositMethod;
  agent: Agent;
  expiresAt: string;
  windowMinutes: number;
  instructions: string[];
}

export interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'bingo_entry' | 'spin_entry' | 'spin_win' | 'spin_refund';
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed' | 'expired';
  method?: DepositMethod;
  reference?: string;
  receiptUrl?: string;
  agentName?: string;
  agentPhone?: string;
  createdAt: string;
  processedAt?: string;
  expiresAt?: string;
  description?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiError {
  success: false;
  error: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashbets_token') ?? '';
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getToken()}` };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  return res.json() as Promise<T>;
}

// ─── exported API functions ───────────────────────────────────────────────────

/** Fetch the authenticated user's current balance. */
export async function getBalance(): Promise<
  { success: true; balance: number; bonusBalance: number; total: number } | ApiError
> {
  return apiFetch('/balance');
}

/** Fetch available payment agent info for display before a transfer. */
export async function getAgents(): Promise<
  { success: true; agents: Agent[] } | ApiError
> {
  return apiFetch('/agents');
}

/**
 * Step 1 of a deposit — initiate and receive agent info + 15-min window.
 * No money moves at this point.
 */
export async function initiateDeposit(
  amount: number,
  method: DepositMethod
): Promise<{ success: true } & InitiatedDeposit | ApiError> {
  return apiFetch('/deposit/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, method }),
  });
}

/**
 * Step 2 of a deposit — submit mobile-money reference + optional receipt.
 * Sends multipart/form-data so `fetch` sets the boundary automatically.
 */
export async function confirmDeposit(
  transactionId: string,
  reference: string,
  receiptFile?: File
): Promise<
  { success: true; message: string; transaction: Partial<Transaction> } | ApiError
> {
  const form = new FormData();
  form.append('transactionId', transactionId);
  form.append('reference', reference);
  if (receiptFile) form.append('receipt', receiptFile);

  // Do NOT set Content-Type manually — fetch adds the multipart boundary
  return apiFetch('/deposit/confirm', { method: 'POST', body: form });
}

/**
 * Submit a withdrawal request.
 * The amount is frozen from the user's balance immediately on success.
 */
export async function requestWithdrawal(
  amount: number,
  method: DepositMethod,
  agentPhone: string,
  agentName?: string
): Promise<
  { success: true; message: string; transaction: Partial<Transaction> } | ApiError
> {
  return apiFetch('/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, method, agentPhone, agentName }),
  });
}

/**
 * Fetch paginated transaction history with optional type/status filters.
 */
export async function getTransactions(
  page = 1,
  limit = 20,
  type?: Transaction['type'],
  status?: Transaction['status']
): Promise<
  { success: true; transactions: Transaction[]; pagination: Pagination } | ApiError
> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type)   params.set('type', type);
  if (status) params.set('status', status);
  return apiFetch(`/transactions?${params.toString()}`);
}

/** Fetch a single transaction by ID. */
export async function getTransaction(
  id: string
): Promise<{ success: true; transaction: Transaction } | ApiError> {
  return apiFetch(`/transactions/${id}`);
}