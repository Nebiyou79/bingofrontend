/**
 * lib/poolApi.ts
 * DashBets — Pool REST API service layer
 *
 * All fetch calls read JWT from localStorage key 'dashbets_token'.
 * Base URL from process.env.NEXT_PUBLIC_API_URL (falls back to '').
 */

const BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN_KEY: string = 'dashbets_token';

// ── Types ────────────────────────────────────────────────────────────────────

interface RoomSnapshot {
  // Define based on your actual room snapshot structure
  roomId: string;
  mode: string;
  occupants: number;
  maxOccupants: number;
  stake: number;
  status: 'waiting' | 'in_progress' | 'finished';
  [key: string]: any;
}

interface PoolGame {
  // Define based on your actual pool game structure
  gameId: string;
  roomId: string;
  mode: string;
  players: string[];
  winner?: string;
  stake: number;
  prize: number;
  status: string;
  createdAt: string;
  finishedAt?: string;
  [key: string]: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  [key: string]: any;
}

interface GetRoomsResponse extends ApiResponse {
  rooms: RoomSnapshot[];
}

interface JoinRoomResponse extends ApiResponse {
  gameId: string;
  socketToken: string;
  roomSnapshot: RoomSnapshot;
  entryTransactionId?: string;
}

interface LeaveRoomResponse extends ApiResponse {
  message: string;
  refundedAmount: number;
}

interface GetHistoryResponse extends ApiResponse {
  games: PoolGame[];
  pagination: PaginationInfo;
}

interface ApiError extends Error {
  status: number;
  data: any;
}

interface HistoryParams {
  page?: number;
  limit?: number;
  mode?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T = any>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

// ── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/pool/rooms
 * Returns all 10 rooms (5 per mode).
 * No auth required.
 */
export async function getRooms(): Promise<GetRoomsResponse> {
  const res = await fetch(`${BASE_URL}/api/pool/rooms`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<GetRoomsResponse>(res);
}

/**
 * POST /api/pool/rooms/:roomId/join
 * Authenticated. Deducts stake from balance.
 *
 * @param roomId - e.g. "eightball_room2"
 * @param mode - "eightball" | "ethiopian"
 */
export async function joinRoom(
  roomId: string,
  mode: string
): Promise<JoinRoomResponse> {
  const res = await fetch(`${BASE_URL}/api/pool/rooms/${roomId}/join`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mode }),
  });
  return handleResponse<JoinRoomResponse>(res);
}

/**
 * POST /api/pool/rooms/:roomId/leave
 * Authenticated. Pre-game exit — refunds stake if only occupant.
 */
export async function leaveRoom(roomId: string): Promise<LeaveRoomResponse> {
  const res = await fetch(`${BASE_URL}/api/pool/rooms/${roomId}/leave`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<LeaveRoomResponse>(res);
}

/**
 * GET /api/pool/history
 * Authenticated. Paginated match history.
 */
export async function getHistory(
  params: HistoryParams = {}
): Promise<GetHistoryResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.mode) qs.set('mode', params.mode);

  const res = await fetch(
    `${BASE_URL}/api/pool/history?${qs.toString()}`,
    {
      method: 'GET',
      headers: authHeaders(),
    }
  );
  return handleResponse<GetHistoryResponse>(res);
}