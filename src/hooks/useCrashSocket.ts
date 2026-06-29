// hooks/useCrashSocket.ts
'use client';

/**
 * Singleton Socket.IO connection for /crash namespace.
 * SSR-safe: never runs on the server.
 * Never disconnects on component unmount — only removes listeners.
 * 
 * FIXED: Prevents connection when token is empty (auth not yet loaded).
 */

import { useEffect, useRef } from 'react';
import type { Socket }       from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

let _socket:      Socket | null = null;
let _socketToken: string        = '';

function getSocket(token: string): Socket | null {
  if (typeof window === 'undefined') return null;

  // ── FIX: Don't create socket with empty token ──────────────────────────
  if (!token) {
    if (_socket) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket      = null;
      _socketToken = '';
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { io } = require('socket.io-client') as typeof import('socket.io-client');

  // If token changed, tear down old socket
  if (_socket && _socketToken !== token) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket      = null;
    _socketToken = '';
  }

  if (_socket?.connected) return _socket;

  // Reconnect if disconnected but same token
  if (_socket && !_socket.connected) {
    _socket.connect();
    return _socket;
  }

  _socket = io(`${SOCKET_URL}/crash`, {
    auth:                 { token },
    transports:           ['websocket'],
    reconnection:         true,
    reconnectionAttempts: Infinity,
    reconnectionDelay:    1_000,
    reconnectionDelayMax: 5_000,
    autoConnect:          true,
  });
  _socketToken = token;

  return _socket;
}

export type CrashSocketEvent =
  | 'crash:state'
  | 'crash:waiting'
  | 'crash:start'
  | 'crash:tick'
  | 'crash:cashout'
  | 'crash:crashed'
  | 'crash:bet_added'
  | 'crash:history_result'
  | 'crash:error'
  | 'crash:pong'
  | 'bet:placed'
  | 'balance:update'
  | 'connect'
  | 'disconnect'
  | 'connect_error';

type HandlerMap = Partial<Record<CrashSocketEvent, (...args: any[]) => void>>;

interface UseCrashSocketOptions {
  token:    string;
  handlers: HandlerMap;
}

export function useCrashSocket({ token, handlers }: UseCrashSocketOptions) {
  const socketRef    = useRef<Socket | null>(null);
  const handlersRef  = useRef<HandlerMap>(handlers);

  // Always keep handlersRef current so wrappers never go stale
  useEffect(() => { handlersRef.current = handlers; });

  useEffect(() => {
    // ── FIX: Also guard at the effect level ──────────────────────────────
    if (typeof window === 'undefined' || !token) {
      // Clean up any existing socket if token becomes empty
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = getSocket(token);
    if (!socket) return;
    socketRef.current = socket;

    // One stable wrapper per event — survives re-renders
    const wrappers: Record<string, (...args: any[]) => void> = {};
    for (const event of Object.keys(handlers) as CrashSocketEvent[]) {
      const wrapper = (...args: any[]) => handlersRef.current[event]?.(...args);
      wrappers[event] = wrapper;
      socket.on(event, wrapper);
    }

    return () => {
      for (const [event, wrapper] of Object.entries(wrappers)) {
        socket.off(event, wrapper);
      }
      // Don't disconnect — socket is a singleton shared across components
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const emit = (event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  };

  const isConnected = () => socketRef.current?.connected ?? false;

  return { emit, isConnected, socket: socketRef.current };
}