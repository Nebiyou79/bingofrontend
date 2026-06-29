/**
 * context/AuthContext.tsx
 * Provides authentication state to the entire app.
 * Wraps _app.tsx; calls checkAuth() on mount to restore saved sessions.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { UseAuthReturn } from '../hooks/useAuth';
import { setAuthToken } from '../lib/api/minesApi';

const AuthContext = createContext<UseAuthReturn | null>(null);

/** Provides auth state app-wide. Place in _app.tsx around <Component />. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Restore session from localStorage on first render
  useEffect(() => {
    auth.checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync token to API module whenever auth state changes
  useEffect(() => {
    setAuthToken(auth.token);
  }, [auth.token]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Access authentication state anywhere in the component tree.
 * Must be used inside <AuthProvider>.
 */
export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}