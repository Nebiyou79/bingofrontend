/**
 * components/admin/AdminLayout.tsx
 * Persistent sidebar + topbar shell for all admin pages.
 * Matches the DashBets dark casino aesthetic.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  group?: string;
}

const NAV: NavItem[] = [
  { href: '/admin',                  label: 'Dashboard',    icon: '📊' },
  { href: '/admin/transactions',     label: 'Transactions', icon: '💳' },
  { href: '/admin/users',            label: 'Users',        icon: '👥' },
  // ── Games ──────────────────────────────────────────────────────────────────
  { href: '/admin/games/bingo',      label: 'Bingo',        icon: '🎱', group: 'Games' },
  { href: '/admin/games/keno',       label: 'Keno',         icon: '🔢', group: 'Games' },
  { href: '/admin/games/crash',      label: 'Crash',        icon: '📈', group: 'Games' },
  { href: '/admin/games/plinko',     label: 'Plinko',       icon: '🎳', group: 'Games' },
  { href: '/admin/games/mines',      label: 'Mines',        icon: '💣', group: 'Games' },
  { href: '/admin/games/spin',       label: 'Spin',         icon: '🎰', group: 'Games' },
  { href: '/admin/games/slots',      label: 'Slots',        icon: '🃏', group: 'Games' },
  { href: '/admin/games/pool',       label: 'Pool',         icon: '🎯', group: 'Games' },
  // ── Admin ──────────────────────────────────────────────────────────────────
  { href: '/admin/jackpots',         label: 'Jackpots',     icon: '🏆' },
  { href: '/admin/autowin',          label: 'Auto-Win',     icon: '🎮' },
  { href: '/admin/settings',         label: 'Settings',     icon: '⚙️'  },
  { href: '/admin/analytics',        label: 'Analytics',    icon: '📈' },
];

export function AdminLayout({ children, title = 'Admin' }: { children: React.ReactNode; title?: string }) {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('dashbets_token');
    if (!token) return;
    fetch('/api/admin/transactions/pending', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setPendingCount(d.transactions?.length ?? 0); })
      .catch(() => {});
  }, [router.pathname]);

  const navWithBadges = NAV.map(n =>
    n.href === '/admin/transactions' ? { ...n, badge: pendingCount || undefined } : n
  );

  // Render group labels when the group name first appears
  let lastGroup: string | undefined = undefined;

  return (
    <div
      className="min-h-screen flex"
      style={{
        fontFamily: "'Exo 2', sans-serif",
        background: 'linear-gradient(135deg, #0a0812 0%, #0d0b18 60%, #08090f 100%)',
        color: '#fff',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col h-screen sticky top-0 transition-all duration-200"
        style={{
          width: collapsed ? 60 : 220,
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 py-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            🎰
          </div>
          {!collapsed && (
            <div>
              <p className="text-xs font-extrabold text-white leading-none" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em' }}>
                DASHBETS
              </p>
              <p className="text-[9px] text-amber-500 font-bold tracking-widest">ADMIN PANEL</p>
            </div>
          )}
          <button
            className="ml-auto text-gray-700 hover:text-gray-400 transition-colors"
            onClick={() => setCollapsed(c => !c)}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {navWithBadges.map(item => {
            const active = router.pathname === item.href ||
              (item.href !== '/admin' && router.pathname.startsWith(item.href));

            // Group separator
            const showGroupLabel = !collapsed && item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;

            return (
              <React.Fragment key={item.href}>
                {showGroupLabel && (
                  <p
                    className="px-2.5 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.18)', fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {item.group}
                  </p>
                )}
                <Link href={item.href}>
                  <div
                    className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 relative group"
                    style={{
                      background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
                      border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span
                        className="text-xs font-semibold flex-1"
                        style={{ color: active ? '#c4b5fd' : '#6b7280' }}
                      >
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge ? (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: '#ef4444', color: '#fff' }}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User Footer */}
        <div
          className="px-3 py-3 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {!collapsed && (
            <p className="text-[10px] text-gray-700 mb-2 font-mono truncate">{user?.username}</p>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span>🚪</span>
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
        >
          <h1
            className="text-base font-extrabold text-white"
            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}
          >
            {title.toUpperCase()}
          </h1>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <Link href="/admin/transactions">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
                >
                  🔔 {pendingCount} pending
                </div>
              </Link>
            )}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
