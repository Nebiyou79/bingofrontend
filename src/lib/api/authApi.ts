/**
 * authApi.ts
 * Low-level fetch wrappers for the DashBets auth endpoints.
 * All functions throw on network error; callers handle HTTP errors via the
 * `success` flag and `error` field in the response body.
 */

const BASE = '/api/auth';

/** Shape returned by /register and /login */
export interface AuthResponse {
  success: boolean;
  token: string;
  message?: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    balance: number;
  };
}

/** Shape returned by /me */
export interface MeResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    role: 'user' | 'admin';
    balance: number;
  };
}

/** Error response shape */
export interface ApiError {
  success: false;
  error: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dashbets_token');
}

async function post<T>(path: string, body: object, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data: T = await res.json();
  return data;
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: T = await res.json();
  return data;
}

// ─── exported API functions ──────────────────────────────────────────────────

/**
 * Register a new user account.
 * @returns AuthResponse (check `success` field before using `token`)
 */
export async function registerUser(data: {
  username: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResponse | ApiError> {
  return post<AuthResponse | ApiError>('/register', data);
}

/**
 * Log in with email/phone + password.
 * `identifier` can be an email address or an Ethiopian phone number.
 * @returns AuthResponse (check `success` field before using `token`)
 */
export async function loginUser(data: {
  identifier: string;
  password: string;
}): Promise<AuthResponse | ApiError> {
  return post<AuthResponse | ApiError>('/login', data);
}

/**
 * Fetch the currently authenticated user's profile.
 * Reads the JWT from localStorage automatically.
 * @returns MeResponse or ApiError
 */
export async function getMe(): Promise<MeResponse | ApiError> {
  const token = getToken();
  if (!token) return { success: false, error: 'No token found' };
  return get<MeResponse | ApiError>('/me', token);
}