/**
 * hooks/usePoolSocket.ts
 *
 * ROOT AUTH FIX:
 *   The pool socket JWT is signed with { userId, gameId } by poolController.js.
 *   The server's authenticatePoolSocket reads decoded.id (from the main JWT shape).
 *   So we MUST send the main JWT (from auth context / localStorage), NOT the
 *   socketToken from joinRoom. The socketToken is only used to verify room
 *   membership server-side if needed — not for socket auth.
 *
 *   Token priority:
 *     1. `mainToken` prop (from AuthContext — always correct user identity)
 *     2. localStorage 'token' fallback
 *
 *   The socketToken (from joinRoom response) should NOT be used as the socket
 *   auth token because it's signed { userId, gameId } and the server middleware
 *   reads decoded.id which won't exist → "User not found".
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PoolSocketHandlers } from '../types/pool';
import { SOCKET_NAMESPACE, TOKEN_KEY } from '../lib/pool.constants';

const SOCKET_SERVER =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

interface UsePoolSocketOptions extends PoolSocketHandlers {
  /**
   * The main user JWT (decoded.id must exist on the server).
   * Pass this from AuthContext — do NOT pass the socketToken from joinRoom.
   */
  mainToken?: string;
}

interface UsePoolSocketReturn {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data?: unknown) => void;
}

export function usePoolSocket(options: UsePoolSocketOptions = {}): UsePoolSocketReturn {
  const { mainToken, ...handlers } = options;
  const socketRef   = useRef<Socket | null>(null);
  const handlersRef = useRef<PoolSocketHandlers>(handlers);
  const [connected, setConnected] = useState(false);

  // Keep handlers current without re-creating socket
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    // Use the main JWT — NOT the socket token from joinRoom
    const token =
      mainToken ||
      (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);

    if (!token) {
      console.warn('[usePoolSocket] No auth token — socket not created');
      return;
    }

    console.log('[usePoolSocket] connecting to', SOCKET_SERVER + SOCKET_NAMESPACE);

    const socket = io(SOCKET_SERVER + SOCKET_NAMESPACE, {
      auth:                 { token },
      transports:           ['websocket', 'polling'],
      autoConnect:          true,
      reconnection:         true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[usePoolSocket] connected:', socket.id);
      setConnected(true);
    });
    socket.on('disconnect', (reason) => {
      console.log('[usePoolSocket] disconnected:', reason);
      setConnected(false);
    });
    socket.on('connect_error', (err: Error) => {
      console.error('[usePoolSocket] connect_error:', err.message);
      setConnected(false);
    });

    function wire<K extends keyof PoolSocketHandlers>(event: string, key: K) {
      socket.on(event, (...args: unknown[]) => {
        const fn = handlersRef.current[key] as ((...a: unknown[]) => void) | undefined;
        if (typeof fn === 'function') fn(...args);
      });
    }

    wire('pool:room_joined',           'onRoomJoined');
    wire('pool:opponent_joined',       'onOpponentJoined');
    wire('pool:game_start',            'onGameStart');
    wire('pool:shot_rejected',         'onShotRejected');
    wire('pool:physics_snapshot',      'onPhysicsSnapshot');
    wire('pool:shot_result',           'onShotResult');
    wire('pool:game_end',              'onGameEnd');
    wire('pool:opponent_disconnected', 'onOpponentDisconnected');
    wire('pool:forfeit_win',           'onForfeitWin');
    wire('pool:room_update',           'onRoomUpdate');
    wire('pool:reconnect_state',       'onReconnectState');
    wire('pool:error',                 'onError');

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  // Re-connect when mainToken changes (login/logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainToken]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[usePoolSocket] emit skipped — not connected:', event);
    }
  }, []);

  return { socket: socketRef.current, connected, emit };
}