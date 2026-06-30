/**
 * lib/api/bingoApi.ts
 * Typed fetch wrappers for the DashBets Bingo API.
 *
 * IMPORTANT: apiFetch does NOT throw on 4xx/5xx — it returns the JSON body
 * as-is so callers can inspect `success`. The old version threw on non-2xx
 * which meant API errors couldn't be shown to the user.
 *
 * Multi-card update:
 *   - Added getMyCards() + MyCardsResponse
 *   - shuffleCard() marked @deprecated (server returns 410)
 *   - getAvailableCards response now includes myCardNumbers (array)
 */

const BASE = '/api/games/bingo';

export type WinPattern = 'horizontal' | 'vertical' | 'diagonal' | 'fourCorners';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface BingoRoom {
  _id: string;
  stakeAmount: number;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  playerCount: number;
  jackpotPool: number;
  drawnBalls: number[];
  roomNumber: number;
  activePattern: WinPattern | null;
  winPattern: WinPattern | null;
  winningBall: number | null;
  winners: WinnerRecord[];
  lobbyTimeRemainingSeconds?: number | null;
}

export interface WinnerRecord {
  userId: string;
  cardNumber: number;
  pattern: WinPattern;
  matchedIndices: number[];
  amountWon: number;
  displayName?: string;
  maskedPhone?: string;
}

export interface PlayerCard {
  cardNumber: number;
  card: number[];
  matchedCells: boolean[][];
  matchedIndices: number[];
  isActive: boolean;
  drawnBalls: number[];
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  activePattern: WinPattern | null;
}

export interface RoomSnapshot {
  cardsInPlay: never[];
  stakeAmount: number;
  status: 'idle' | 'waiting' | 'playing';
  playerCount: number;
  jackpotPool: number;
  possibleWin: number;
  roomId: string | null;
  activePattern: WinPattern | null;
  lobbyTimeRemainingSeconds: number | null;
  isBonus: boolean;
}

export interface JoinRoomResponse {
  success: true;
  roomId: string;
  stakeAmount: number;
  jackpotPool: number;
  playerCount: number;
  lobbyTimeRemainingSeconds: number;
  drawSeedHash: string | null;
  activePattern: WinPattern | null;
  minPlayersToStart: number;
  maxCards?: number;
  // alreadyJoined path (game in progress):
  alreadyJoined?: boolean;
  cardNumber?: number;
  card?: number[];
  matchedCells?: boolean[][];
  status?: string;
  message?: string;
  // alreadyInRoom path (still waiting — multi-card):
  alreadyInRoom?: boolean;
  myCards?: { cardNumber: number; card: number[]; matchedCells: boolean[][] }[];
  canAddMore?: boolean;
}

export interface CardSlot {
  cardNumber: number;
  taken: boolean;
  takenByMe: boolean;
}

export interface AvailableCardsResponse {
  success: true;
  roomId: string;
  slots: CardSlot[];
  myCardNumbers: number[];   // NEW: all confirmed card numbers for this user
  myCardNumber: number | null; // backwards-compat: first card or null
}

export interface PreviewCardResponse {
  success: true;
  cardNumber: number;
  card: number[];
}

export interface ConfirmCardResponse {
  success: true;
  roomId: string;
  cardNumber: number;
  card: number[];
  stakeAmount: number;
  entryFee: number;
  netToPool: number;
  currentPool: number;
  playerCount: number;
  lobbyTimeRemainingSeconds: number;
  drawSeedHash: string | null;
  minPlayersToStart: number;
  alreadyConfirmed?: boolean;
  message?: string;
}

// ─── NEW: Multi-card types ─────────────────────────────────────────────────

export interface MyCardEntry {
  cardNumber:     number;
  card:           number[];     // flat 25-element array
  matchedCells:   boolean[][];  // 5×5
  matchedIndices: number[];
  isActive:       boolean;
}

export interface MyCardsResponse {
  success:       true;
  roomId:        string;
  drawnBalls:    number[];
  status:        BingoRoom['status'];
  activePattern: WinPattern | null;
  cards:         MyCardEntry[];
  canAddMore:    boolean;
  maxCards:      number;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  validStakes?: number[];
  currentBalance?: number;
  requiredAmount?: number;
  maxCards?: number;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashbets_token') ?? '';
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Authorization:  `Bearer ${token}`,
    'x-auth-token': token,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers:     { ...authHeaders(), ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function joinRoom(
  stakeAmount: number
): Promise<JoinRoomResponse | ApiError> {
  return apiFetch('/join', {
    method: 'POST',
    body:   JSON.stringify({ stakeAmount: Number(stakeAmount) }),
  });
}

/**
 * @deprecated Card shuffling has been removed. The server returns HTTP 410.
 * Use pickRandom() client-side instead, then call confirmCard().
 */
export async function shuffleCard(
  roomId: string
): Promise<{ success: true; cardNumber: number; card: number[] } | ApiError> {
  return apiFetch('/shuffle', { method: 'POST', body: JSON.stringify({ roomId }) });
}

export async function getLobbySnapshot(): Promise<
  { success: true; snapshot: RoomSnapshot[] } | ApiError
> {
  return apiFetch('/rooms', { method: 'GET' });
}

export async function getRoomById(
  id: string
): Promise<{ success: true; room: BingoRoom } | ApiError> {
  return apiFetch(`/rooms/${id}`, { method: 'GET' });
}

export async function getPlayerCard(
  roomId: string
): Promise<({ success: true } & PlayerCard) | ApiError> {
  return apiFetch(`/rooms/${roomId}/card`, { method: 'GET' });
}

/** Returns ALL cards the authenticated user holds in this room. */
export async function getMyCards(
  roomId: string
): Promise<MyCardsResponse | ApiError> {
  return apiFetch(`/rooms/${roomId}/my-cards`, { method: 'GET' });
}

export async function getAvailableCards(
  roomId: string
): Promise<AvailableCardsResponse | ApiError> {
  return apiFetch(`/rooms/${roomId}/available-cards`, { method: 'GET' });
}

export async function previewCard(
  roomId: string,
  cardNumber: number
): Promise<PreviewCardResponse | ApiError> {
  return apiFetch(`/rooms/${roomId}/preview-card`, {
    method: 'POST',
    body:   JSON.stringify({ cardNumber }),
  });
}

/**
 * confirmCard — deducts balance + assigns the chosen card.
 * Multi-card: can be called up to maxCards times per room while lobby is open.
 * Idempotent: if the player already has THIS specific card, returns it without charging again.
 */
export async function confirmCard(
  roomId: string,
  cardNumber: number
): Promise<ConfirmCardResponse | ApiError> {
  return apiFetch(`/rooms/${roomId}/confirm-card`, {
    method: 'POST',
    body:   JSON.stringify({ cardNumber }),
  });
}

// ─── Client-side utilities ────────────────────────────────────────────────────

/**
 * Pick a random free card number from the available slots.
 * Excludes cards already confirmed by the current user.
 */
export function pickRandomCard(
  slots: CardSlot[],
  myConfirmedCards: number[]
): number | null {
  const mySet = new Set(myConfirmedCards);
  const free  = slots.filter((s) => !s.taken || mySet.has(s.cardNumber))
    .filter((s) => !mySet.has(s.cardNumber) && !s.taken)
    .map((s) => s.cardNumber);
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export function flatToGrid(flatCard: number[]): number[][] {
  const grid: number[][] = [];
  for (let i = 0; i < flatCard.length; i += 5) grid.push(flatCard.slice(i, i + 5));
  return grid;
}

export function matchedIndicesToMatrix(matchedIndices: number[]): boolean[][] {
  const set = new Set(matchedIndices);
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (__, col) => set.has(row * 5 + col))
  );
}

export function patternLabel(pattern: WinPattern | null): string {
  switch (pattern) {
    case 'horizontal':  return 'Any Row';
    case 'vertical':    return 'Any Column';
    case 'diagonal':    return 'Diagonal';
    case 'fourCorners': return 'Four Corners';
    default:            return 'Unknown';
  }
}

export function patternIcon(pattern: WinPattern | null): string {
  switch (pattern) {
    case 'horizontal':  return '↔';
    case 'vertical':    return '↕';
    case 'diagonal':    return '↗';
    case 'fourCorners': return '⬛';
    default:            return '?';
  }
}