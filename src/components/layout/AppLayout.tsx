/**
 * components/layout/AppLayout.tsx — Updated with all 17 games
 * Each game page shows its own background image from public/images/games/bg (X).png
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { GAMES_CONFIG } from '../../config/gameConfig';

interface NavItem {
  href: string;
  label: string;
  icon: string | React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
    ],
  },
  {
    title: 'Games',
    items: [
      {
        href: '/games',
        label: 'All Games',
        icon: '🎮',
        children: Array.from(
          new Map(GAMES_CONFIG.map(g => [g.id, g])).values()
        ).map(game => ({
          href: game.path,
          label: game.name,
          icon: game.icon,
          badge: game.badge,
        })),
      },
      { href: '/jackpot', label: 'Jackpots', icon: '💎', badge: 'LIVE' },
      { href: '/vip', label: 'VIP Club', icon: '⭐' },
      { href: '/achievements', label: 'Achievements', icon: '🏆' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/rewards', label: 'Rewards', icon: '🎁' },
      { href: '/referrals', label: 'Referrals', icon: '👥' },
      { href: '/transactions', label: 'Transactions', icon: '📋' },
      { href: '/analytics', label: 'Analytics', icon: '📊' },
    ],
  },
  {
    title: 'Help',
    items: [
      { href: '/support', label: 'Support', icon: '💬' },
      { href: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

const BOTTOM_TABS = [
  { label: 'Home', icon: '⬡', href: '/dashboard' },
  { label: 'Games', icon: '🎮', href: '/games' },
  { label: 'Bonus', icon: '🎁', href: '/bonus', center: true },
  { label: 'Support', icon: '💬', href: '/support' },
  { label: 'Leaderboard', icon: '🏆', href: '/leaderboard' },
];

// Generate dynamic game backgrounds from config
const GAME_BACKGROUNDS: Record<string, string> = GAMES_CONFIG.reduce((acc, game) => {
  acc[game.path] = game.backgroundImage;
  return acc;
}, {} as Record<string, string>);

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

// Helper component for game icons in sidebar
function GameIcon({ icon, gameName }: { icon: string; gameName: string }) {
  const [imgError, setImgError] = useState(false);
  const isImagePath = icon.startsWith('/') || icon.startsWith('http');

  if (isImagePath && !imgError) {
    return (
      <img
        src={icon}
        alt={gameName}
        className="w-5 h-5 object-contain"
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback emoji mapping
  const emojiFallbacks: Record<string, string> = {
    'Keno': '🔢',
    'Bingo': '🎱',
    'Spin Wheel': '🎡',
    'Limbo': '📈',
    'Zombile': '🧟',
    'BlackJack': '🃏',
    'Card Draw': '🎴',
    'Chicken Road': '🐔',
    'HI-LO': '🎲',
    'Bane Wild': '🤠',
    'Giovani': '💎',
    'Dragon Tower': '🐉',
    'Mines': '💣',
    'Plinko': '🟡',
    'RPS': '✂️',
    'Crash': '📊',
    'Slots': '🎰'
  };

  return <span>{emojiFallbacks[gameName] || '🎮'}</span>;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gamesExpanded, setGamesExpanded] = useState(router.pathname.startsWith('/games'));

  const handleLogout = () => { logout(); router.push('/'); };
  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + '/');

  // Get background image for current game page
  const gameBackground = GAME_BACKGROUNDS[router.pathname];
  
  // Find game config for accent colors
  const currentGame = GAMES_CONFIG.find(g => g.path === router.pathname);

  return (
    <>
      <Head>
        <title>{title ? `${title} — DashBets` : 'DashBets'}</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="min-h-screen text-white flex flex-col relative"
        style={{
          fontFamily: "'Exo 2', sans-serif",
          background: 'linear-gradient(160deg, #0d0b1e 0%, #10102a 50%, #080b18 100%)',
        }}
      >
        {/* Game Background Image Overlay - Now game-specific */}
        {gameBackground && (
          <div
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url(${gameBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.15,
              filter: 'blur(8px)',
            }}
          />
        )}
        
        {/* Game-specific accent overlays */}
        {currentGame && (
          <>
            <div
              className="fixed inset-0 z-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${currentGame.accentColor}15 0%, transparent 60%)`,
              }}
            />
            <div
              className="fixed inset-0 z-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 100%, ${currentGame.secondaryColor}10 0%, transparent 60%)`,
              }}
            />
          </>
        )}

        {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
        <header
          className="sticky top-0 z-50 flex items-center gap-3 px-4 h-15 relative"
          style={{
            height: 60,
            background: 'rgba(10,8,22,0.96)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 1px 30px rgba(0,0,0,0.4)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5 w-4">
              <div className="h-px bg-gray-400 w-full" />
              <div className="h-px bg-gray-400 w-3/4" />
              <div className="h-px bg-gray-400 w-full" />
            </div>
          </button>

          {/* Mobile logo */}
          <Link href="/dashboard" className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }}>
              🎰
            </div>
            <span className="text-base font-extrabold tracking-[0.06em]"
              style={{ fontFamily: "'Rajdhani',sans-serif", background: 'linear-gradient(90deg,#fff,#c4b5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              DASHBETS
            </span>
          </Link>

          <div className="flex-1" />

          {/* Live balance pill */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono text-amber-400 tabular-nums font-bold">
                {user.balance.toLocaleString()} ETB
              </span>
            </div>
          )}

          {/* Deposit button */}
          <Link href="/wallet"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              fontFamily: "'Rajdhani',sans-serif",
              letterSpacing: '0.06em',
            }}>
            + Deposit
          </Link>

          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"
              style={{ width: 18, height: 18, color: '#9ca3af' }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>

          {/* Avatar + username */}
          <button onClick={handleLogout}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            title="Click to log out">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                border: '2px solid rgba(167,139,250,0.4)',
              }}>
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold text-white leading-none">{user?.username ?? '…'}</p>
              <p className="text-[9px] font-mono leading-none mt-0.5"
                style={{ color: '#a78bfa' }}>VIP {user?.vipLevel ?? 0}</p>
            </div>
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* ── Mobile overlay ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/70 md:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)} />
          )}

          {/* ══ SIDEBAR ═══════════════════════════════════════════════════ */}
          <aside
            className={[
              'fixed top-[60px] left-0 bottom-0 z-40 w-56 flex flex-col overflow-y-auto transition-transform duration-300',
              'md:sticky md:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            ].join(' ')}
            style={{
              background: 'rgba(8,6,18,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Desktop logo */}
            <div className="hidden md:flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 0 16px rgba(245,158,11,0.4)' }}>
                🎰
              </div>
              <div>
                <p className="text-[15px] font-extrabold leading-none tracking-[0.07em]"
                  style={{
                    fontFamily: "'Rajdhani',sans-serif",
                    background: 'linear-gradient(90deg,#fff,#c4b5fd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                  DASHBETS
                </p>
                <p className="text-[8px] tracking-[0.2em] uppercase font-mono mt-0.5"
                  style={{ color: 'rgba(167,139,250,0.5)' }}>
                  Play · Win · Repeat
                </p>
              </div>
            </div>

            {/* VIP status mini-card */}
            {user && (
              <div className="mx-3 mt-3 mb-1 rounded-xl px-3 py-2.5"
                style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.08))', border:'1px solid rgba(124,58,237,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-mono text-purple-400/70 uppercase tracking-widest">Balance</p>
                    <p className="text-sm font-black text-amber-400 tabular-nums font-mono">
                      {user.balance.toLocaleString()} <span className="text-[9px] text-amber-600">ETB</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'2px solid rgba(167,139,250,0.3)' }}>
                    {user.vipLevel ?? 0}
                  </div>
                </div>
              </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-2 py-2 space-y-3">
              {NAV_SECTIONS.map((section, si) => (
                <div key={si}>
                  {section.title && (
                    <p className="px-2 mb-1 text-[8px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: 'rgba(100,116,139,0.7)' }}>
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      if (item.children) {
                        const childActive = item.children.some(c => isActive(c.href));
                        return (
                          <div key={item.href}>
                            <button
                              onClick={() => setGamesExpanded(v => !v)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                              style={{
                                color: childActive ? '#e2e8f0' : '#64748b',
                                background: childActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                              }}>
                              <span className="text-base w-5 text-center">{item.icon}</span>
                              <span className="flex-1 text-left text-[13px]">{item.label}</span>
                              <span className="text-[9px] text-slate-600">{gamesExpanded ? '▲' : '▼'}</span>
                            </button>
                            {gamesExpanded && (
                              <div className="ml-2.5 mt-0.5 pl-3 space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar"
                                style={{ borderLeft: '1px solid rgba(124,58,237,0.2)' }}>
                                {item.children.map((child, ci) => {
                                  const active = isActive(child.href);
                                  return (
                                    <Link key={`${child.href}-${ci}`} href={child.href}
                                      onClick={() => setSidebarOpen(false)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                                      style={active ? {
                                        background: 'rgba(124,58,237,0.18)',
                                        color: '#c4b5fd',
                                      } : { color: '#64748b' }}>
                                      {typeof child.icon === 'string' && child.icon.startsWith('/') ? (
                                        <GameIcon icon={child.icon as string} gameName={child.label} />
                                      ) : (
                                        <span className="text-base w-5 text-center">{child.icon}</span>
                                      )}
                                      {child.label}
                                      {child.badge && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono"
                                          style={{ 
                                            background: child.badge === 'NEW' ? 'rgba(16,185,129,0.2)' : 
                                                       child.badge === 'HOT' ? 'rgba(239,68,68,0.2)' :
                                                       child.badge === 'POPULAR' ? 'rgba(168,85,247,0.2)' :
                                                       'rgba(239,68,68,0.2)', 
                                            color: child.badge === 'NEW' ? '#10b981' : 
                                                   child.badge === 'HOT' ? '#f87171' :
                                                   child.badge === 'POPULAR' ? '#a855f7' :
                                                   '#f87171', 
                                            border: `1px solid ${
                                              child.badge === 'NEW' ? 'rgba(16,185,129,0.3)' : 
                                              child.badge === 'HOT' ? 'rgba(239,68,68,0.3)' :
                                              child.badge === 'POPULAR' ? 'rgba(168,85,247,0.3)' :
                                              'rgba(239,68,68,0.3)'
                                            }` 
                                          }}>
                                          {child.badge}
                                        </span>
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/5"
                          style={active ? {
                            background: 'linear-gradient(90deg,rgba(124,58,237,0.25),rgba(124,58,237,0.06))',
                            color: '#e2e8f0',
                            borderLeft: '2px solid #7c3aed',
                            paddingLeft: 10,
                          } : { color: '#64748b' }}>
                          <span className="text-base w-5 text-center">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono animate-pulse"
                              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all hover:bg-red-500/10"
                style={{ color: '#ef4444' }}>
                <span className="text-base w-5 text-center">🚪</span>
                Logout
              </button>
            </div>
          </aside>

          {/* ══ PAGE CONTENT ══════════════════════════════════════════════ */}
          <main className="flex-1 min-w-0 pb-20 md:pb-6 overflow-y-auto relative z-10">
            {children}
          </main>
        </div>

        {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════ */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{
            background: 'rgba(8,6,18,0.98)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-end justify-around max-w-lg mx-auto px-2" style={{ height: 64 }}>
            {BOTTOM_TABS.map(tab => {
              const active = router.pathname === tab.href || router.pathname.startsWith(tab.href + '/');
              if ((tab as any).center) {
                return (
                  <Link key={tab.href} href={tab.href} className="flex flex-col items-center" style={{ marginTop: -20 }}>
                    <div className="w-13 h-13 rounded-full flex items-center justify-center text-2xl transition-transform hover:scale-110"
                      style={{
                        width: 52, height: 52,
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                        boxShadow: '0 0 24px rgba(245,158,11,0.55)',
                        border: '3px solid rgba(10,8,22,0.8)',
                      }}>
                      {tab.icon}
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wide mt-0.5"
                      style={{ color: '#fbbf24' }}>
                      {tab.label}
                    </span>
                  </Link>
                );
              }
              return (
                <Link key={tab.href} href={tab.href}
                  className="flex flex-col items-center gap-0.5 pb-2 pt-2.5 min-w-10">
                  <span className={`text-xl transition-all ${active ? 'scale-110' : 'opacity-40'}`}>
                    {tab.icon}
                  </span>
                  <span className={`text-[8px] font-bold uppercase tracking-wide ${active ? 'text-purple-400' : 'text-gray-700'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.5);
        }
      `}</style>
    </>
  );
}