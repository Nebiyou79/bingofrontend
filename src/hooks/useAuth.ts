/**
 * hooks/useAuth.ts
 * Core authentication hook. Manages JWT storage, user state, and session hydration.
 * Used exclusively via AuthContext — do not call directly in pages.
 */

import { useState, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../lib/api/authApi';

const TOKEN_KEY = 'dashbets_token';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  balance: number;
  vipLevel?: number;      // Add this
  vipPoints?: number;     // Add this
  totalWagered?: number;  // Add this
   biggestWin: number;
}

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * Core auth state machine. Handles login, register, logout, and session restore.
 * Wrap with AuthContext to provide values app-wide.
 */
export function useAuth(): UseAuthReturn {
  // Initialize token from localStorage immediately to prevent flash of unauthenticated state
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to prevent redirect before checkAuth completes
  const [error, setError] = useState<string | null>(null);

  /** Persist token and update in-memory state. */
  const saveToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  /** Clear all auth state from memory and storage. */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  /**
   * Read saved JWT from localStorage and hydrate user state via /api/auth/me.
   * Called on app mount by AuthContext to restore sessions after refresh.
   */
  const checkAuth = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    
    if (!stored) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Token exists in storage, set it immediately
    setToken(stored);
    
    try {
      const res = await getMe();
      if (res.success) {
        setUser(res.user as User);
      } else {
        // Token invalid or expired — clean up
        console.warn('Auth check failed — clearing token');
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      // Network error — keep the token, user can retry
      console.error('Auth check network error:', err);
      // Don't clear token on network errors
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticate with email/phone + password.
   * Stores the returned JWT and sets user state on success.
   * Throws with a user-facing message on failure.
   */
  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser({ identifier, password });
      if (!res.success) {
        const msg = (res as { error: string }).error;
        setError(msg);
        throw new Error(msg);
      }
      saveToken(res.token);
      setUser(res.user as User);
    } finally {
      setLoading(false);
    }
  }, [saveToken]);

  /**
   * Create a new account then auto-login on success.
   * Throws with a user-facing message on failure.
   */
  const register = useCallback(
    async (username: string, email: string, phone: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await registerUser({ username, email, phone, password });
        if (!res.success) {
          const msg = (res as { error: string }).error;
          setError(msg);
          throw new Error(msg);
        }
        saveToken(res.token);
        setUser(res.user as User);
      } finally {
        setLoading(false);
      }
    },
    [saveToken]
  );

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    checkAuth,
  };
}