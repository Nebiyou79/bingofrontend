/**
 * hoc/withAuth.tsx
 * HOC that guards pages behind authentication.
 * Redirects to /auth/login if no valid session is found after hydration.
 * Shows a spinner while session check is in progress.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../context/AuthContext';

/**
 * Wrap any page component with this HOC to require authentication.
 *
 * @example
 * export default withAuth(DashboardPage);
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const GuardedPage: React.FC<P> = (props) => {
    const { isAuthenticated, loading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace('/auth/login');
      }
    }, [loading, isAuthenticated, router]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 animate-spin border-4 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm">Loading…</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };

  GuardedPage.displayName = `withAuth(${Component.displayName ?? Component.name ?? 'Component'})`;
  return GuardedPage;
}