/**
 * components/AppWrapper.tsx
 * Wraps the entire app to show loading screen during auth check
 * Place this around your main app content in _app.tsx
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';

interface AppWrapperProps {
  children: React.ReactNode;
}

/**
 * Shows loading screen while auth is being checked on mount.
 * Also prevents access to protected pages until auth is ready.
 */
export function AppWrapper({ children }: AppWrapperProps) {
  const { loading: authLoading, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate progress updates while loading
  useEffect(() => {
    if (!authLoading) {
      setLoadingProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setLoadingProgress((p) => {
        if (p >= 85) return p; // Don't go beyond 85% until actually done
        return p + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [authLoading]);

  // Mark as mounted after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Protect certain routes
  useEffect(() => {
    if (!mounted || authLoading) return;

    const protectedRoutes = ['/dashboard', '/wallet', '/bonus', '/support', '/leaderboard', '/games'];
    const isProtectedRoute = protectedRoutes.some((route) => router.pathname.startsWith(route));
    const isAuthRoute = router.pathname.startsWith('/auth');

    if (isProtectedRoute && !isAuthenticated) {
      router.replace('/auth/login');
    } else if (isAuthRoute && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  // Show loading screen during initial auth check
  if (authLoading) {
    return (
      <LoadingScreen
        isVisible={true}
        progress={Math.min(Math.floor(loadingProgress), 99)}
        message="Checking your session..."
      />
    );
  }

  // Don't render protected content until mounted
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}