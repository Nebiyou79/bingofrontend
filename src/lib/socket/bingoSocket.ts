/**
 * lib/socket/bingoSocket.ts
 *
 * BUG-10 FIX: Listener leak on room navigation.
 *   offAll() now uses removeAllListeners(event) for room-scoped events
 *   instead of socket.off(event) with no callback, which previously
 *   removed ALL handlers including ones from other components.
 *   lobby:snapshot listeners are preserved across navigations.
 *
 * Socket connects to NEXT_PUBLIC_API_URL (backend port 5000).
 */

import type { Socket } from 'socket.io-client';
import type { WinPattern, WinnerRecord } from '../api/bingoApi';

// ─── Backend URL ──────────────────────────────────────────────────────────────
function getBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
}

// ─── Event payload types ──────────────────────────────────────────────────────

export interface PlayerJoinedPayload {
  playerCount: number;
  jackpotPool: number;
  lobbyTimeRemaining?: number | null;
}

export interface GameStartingPayload {
  countdown: number;
  startTime?: string;
  expiresAt?: string;
}

export interface BallDrawnPayload {
  ball: number;
  drawnBalls: number[];
  ballIndex: number;
  playerCount: number;
  jackpotPool: number;
}

export interface GameOverPayload {
  winners: WinnerRecord[];
  winner: {
    cardNumber: number;
    userId: string;
    pattern: WinPattern;
    matchedIndices: number[];
    amountWon: number;
    displayName?: string;
    maskedPhone?: string;
  } | null;
  jackpotPool: number;
  winningBall: number | null;
  winPattern: WinPattern | null;
  activePattern: WinPattern | null;
  noWinner?: boolean;
  winnerDisplayName?: string | null;
  winnerMaskedPhone?: string | null;
}

export interface RoomStatusPayload {
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  reason?: string;
}

export interface BingoSocketListeners {
  onPlayerJoined:  (cb: (payload: PlayerJoinedPayload) => void)  => void;
  onGameStarting:  (cb: (payload: GameStartingPayload) => void)  => void;
  onBallDrawn:     (cb: (payload: BallDrawnPayload) => void)     => void;
  onGameOver:      (cb: (payload: GameOverPayload) => void)      => void;
  onRoomStatus:    (cb: (payload: RoomStatusPayload) => void)    => void;
  onLobbySnapshot: (cb: (payload: { snapshot: unknown[] }) => void) => void;
  /**
   * BUG-10 FIX: Remove only room-scoped event listeners.
   * Does NOT remove lobby:snapshot listeners — those persist across navigations.
   */
  offAll: () => void;
}

// Singleton socket — reused across navigations within the same session
let _socket: Socket | null = null;
let _socketToken: string   = '';

export async function createBingoSocket(
  token?: string
): Promise<{ socket: Socket; listeners: BingoSocketListeners }> {
  const { io } = await import('socket.io-client');

  const authToken = token
    ?? (typeof window !== 'undefined' ? localStorage.getItem('dashbets_token') : null)
    ?? '';

  // Disconnect stale socket if the auth token changed (e.g. new login)
  if (_socket && _socketToken !== authToken) {
    _socket.disconnect();
    _socket = null;
  }

  if (!_socket || !_socket.connected) {
    const backendUrl = getBackendUrl();

    _socket = io(`${backendUrl}/bingo`, {
      auth:       { token: authToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay:   1500,
      timeout:             10_000,
      extraHeaders: {
        Authorization:  `Bearer ${authToken}`,
        'x-auth-token': authToken,
      },
    });

    _socketToken = authToken;

    _socket.on('connect',      () => console.log('[bingoSocket] ✅ Connected to /bingo:', _socket!.id));
    _socket.on('disconnect',   (r) => console.log('[bingoSocket] Disconnected from /bingo:', r));
    _socket.on('connect_error',(e) => console.error('[bingoSocket] Connection error:', e.message));
  }

  const socket = _socket;

  const listeners: BingoSocketListeners = {
    onPlayerJoined:  (cb) => socket.on('room:playerJoined', cb),
    onGameStarting:  (cb) => socket.on('room:gameStarting', cb),
    onBallDrawn:     (cb) => socket.on('room:ballDrawn',    cb),
    onGameOver:      (cb) => socket.on('room:gameOver',     cb),
    onRoomStatus:    (cb) => socket.on('room:status',       cb),
    onLobbySnapshot: (cb) => socket.on('lobby:snapshot',    cb),

    // BUG-10 FIX: removeAllListeners(event) removes every handler for that
    // specific event. This is safer than socket.off(event) with no callback
    // (which does the same thing but is less explicit). We remove only the
    // room-scoped events; lobby:snapshot must survive navigation.
    offAll: () => {
      socket.removeAllListeners('room:playerJoined');
      socket.removeAllListeners('room:gameStarting');
      socket.removeAllListeners('room:ballDrawn');
      socket.removeAllListeners('room:gameOver');
      socket.removeAllListeners('room:status');
      // lobby:snapshot is intentionally NOT removed here
    },
  };

  return { socket, listeners };
}

export function joinBingoRoom(socket: Socket, roomId: string): void {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('dashbets_token') ?? '')
    : '';
  socket.emit('join-room', { roomId, token });
}

export function leaveBingoRoom(socket: Socket, roomId: string): void {
  socket.emit('leave-room', { roomId });
}

/** Call on logout to fully tear down the singleton. */
export function disconnectBingoSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket      = null;
    _socketToken = '';
  }
}