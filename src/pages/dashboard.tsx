/**
 * pages/dashboard.tsx - Updated with all 16 games
 */

import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { useWallet } from '../hooks/useWallet';
import { useTransactions } from '../hooks/useTransactions';
import { GAMES_CONFIG, GAME_CATEGORIES, GameConfig } from '../config/gameConfig';

// ═══════════════════════════════════════════════════════════════════════════
// StatCard Component
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  accentColor,
  glowColor,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  trend?: string;
  accentColor: string;
  glowColor: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden backdrop-blur-xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${glowColor}30`,
        boxShadow: `0 8px 32px ${glowColor}15`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-20 blur-2xl"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent)` }}
      />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            {label}
          </p>
          <p
            className="text-3xl sm:text-4xl font-extrabold text-white"
            style={{ fontFamily: "'Rajdhani', monospace" }}
          >
            {value}
            {unit && (
              <span className="text-lg ml-2" style={{ color: accentColor }}>
                {unit}
              </span>
            )}
          </p>
          {trend && (
            <p className="text-xs mt-2" style={{ color: accentColor }}>
              {trend}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${glowColor}15`, border: `1px solid ${glowColor}25` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GameCard Component — full-bleed cover image, name + RTP below
// ═══════════════════════════════════════════════════════════════════════════

const EMOJI_FALLBACKS: Record<string, string> = {
  keno: '🔢',
  bingo: '🎱',
  spin: '🎡',
  limbo: '📈',
  zombile: '🧟',
  blackjack: '🃏',
  'card-draw': '🎴',
  'chicken-road': '🐔',
  'hi-lo': '🎲',
  'bane-wild': '🤠',
  giovani: '💎',
  'dragon-tower': '🐉',
  mines: '💣',
  plinko: '🟡',
  rps: '✂️',
  crash: '📊',
};

function GameCard({ game }: { game: GameConfig }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = (game.icon.startsWith('/') || game.icon.startsWith('http')) && !imgError;

  const badgeColors: Record<string, string> = {
    HOT: 'linear-gradient(135deg, #ef4444, #dc2626)',
    NEW: 'linear-gradient(135deg, #10b981, #059669)',
    POPULAR: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  };

  return (
    <Link href={game.path}>
      <div
        className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Badge */}
        {game.badge && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide z-20 text-white"
            style={{
              background: badgeColors[game.badge] ?? badgeColors.POPULAR,
            }}
          >
            {game.badge}
          </div>
        )}

        {/* Cover image area — 3:2 ratio */}
        <div className="relative w-full" style={{ paddingTop: '66.66%' }}>
          {hasImage ? (
            <img
              src={game.icon}
              alt={game.name}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-5xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {EMOJI_FALLBACKS[game.id] ?? '🎮'}
            </div>
          )}
          {/* subtle dark overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>

        {/* Name + RTP below image */}
        <div className="px-3 py-2.5">
          <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide truncate">
            {game.name}
          </p>
          {game.rtp && (
            <p className="text-[10px] text-gray-500 mt-0.5">RTP: {game.rtp}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TransactionRow Component
// ═══════════════════════════════════════════════════════════════════════════

function TransactionRow({
  date,
  type,
  amount,
  status,
}: {
  date: string;
  type: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
}) {
  const statusColors = {
    completed: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
  };

  const statusIcons = {
    completed: '✓',
    pending: '⏳',
    failed: '✗',
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-sm font-mono text-gray-500">{date}</div>
        <div className="text-sm font-semibold text-gray-300 capitalize">{type}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm font-bold text-white font-mono">{amount}</div>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: statusColors[status] + '20', color: statusColors[status] }}
        >
          {statusIcons[status]}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════

const DashboardPage: NextPage = () => {
  const { user, isAuthenticated } = useAuthContext();
  const { balance, bonusBalance, loading: walletLoading } = useWallet();
  const { transactions } = useTransactions();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  const filteredGames = activeCategory === 'All' 
    ? GAMES_CONFIG 
    : GAMES_CONFIG.filter(game => game.category === activeCategory);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="animate-slide-up">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
            Welcome back, <span style={{ color: '#f59e0b' }}>{user?.username}</span>!
          </h1>
          <p className="text-gray-400">
            {new Date().getHours() < 12
              ? '☀️ Good morning! Ready to play?'
              : new Date().getHours() < 18
              ? '🌤️ Good afternoon! Let\'s have some fun!'
              : '🌙 Good evening! Time for your next win!'}
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up">
          <StatCard
            label="Account Balance"
            value={walletLoading ? '—' : (balance / 100).toFixed(2)}
            unit="ETB"
            icon="💰"
            trend="Your playable funds"
            accentColor="#10b981"
            glowColor="rgba(16, 185, 129, 0.5)"
          />
          <StatCard
            label="Bonus Balance"
            value={walletLoading ? '—' : (bonusBalance / 100).toFixed(2)}
            unit="ETB"
            icon="🎁"
            trend="Restricted bonus funds"
            accentColor="#f59e0b"
            glowColor="rgba(245, 158, 11, 0.5)"
          />
          <StatCard
            label="VIP Status"
            value={user?.vipLevel ? `Level ${user.vipLevel}` : 'Standard'}
            icon="⭐"
            trend={user?.vipPoints ? `${user.vipPoints} points` : 'Earn points to level up'}
            accentColor="#a855f7"
            glowColor="rgba(168, 85, 247, 0.5)"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
          <Link
            href="/wallet"
            className="p-4 rounded-xl text-center font-bold uppercase tracking-wide transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
            }}
          >
            💸 Deposit
          </Link>
          <Link
            href="/wallet"
            className="p-4 rounded-xl text-center font-bold uppercase tracking-wide transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
            }}
          >
            🏦 Withdraw
          </Link>
          <Link
            href="/rewards"
            className="p-4 rounded-xl text-center font-bold uppercase tracking-wide transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
            }}
          >
            🎁 Rewards
          </Link>
          <Link
            href="/referrals"
            className="p-4 rounded-xl text-center font-bold uppercase tracking-wide transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#a855f7',
            }}
          >
            👥 Refer
          </Link>
        </div>

        {/* Game Categories Filter */}
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🎮</span> All Games
            </h2>
            <Link 
              href="/games" 
              className="text-sm text-amber-400 hover:text-amber-300 transition font-semibold"
            >
              View All →
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {GAME_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all"
                style={{
                  background: activeCategory === category 
                    ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' 
                    : 'rgba(255,255,255,0.05)',
                  color: activeCategory === category ? '#fff' : '#9ca3af',
                  border: activeCategory === category 
                    ? '1px solid rgba(124,58,237,0.5)' 
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: activeCategory === category 
                    ? '0 4px 12px rgba(124,58,237,0.3)' 
                    : 'none',
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Games Grid - 2 columns mobile, 4 columns desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No games found in this category</p>
              <button 
                onClick={() => setActiveCategory('All')}
                className="text-amber-400 hover:text-amber-300 mt-2"
              >
                Show all games
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="animate-slide-up pb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>📋</span> Recent Activity
          </h2>
          <div
            className="rounded-2xl border backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(15, 12, 26, 0.6)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
            }}
          >
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {transactions.slice(0, 5).map((tx, i) => (
                  <TransactionRow
                    key={i}
                    date={new Date(tx.createdAt).toLocaleDateString()}
                    type={tx.type}
                    amount={`${(tx.amount / 100).toFixed(2)} ETB`}
                    status={tx.status as any}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>No transactions yet</p>
                <Link href="/wallet" className="text-amber-400 hover:text-amber-300 mt-2 inline-block">
                  Make your first deposit →
                </Link>
              </div>
            )}
          </div>
          <Link
            href="/transactions"
            className="mt-4 inline-block text-amber-400 hover:text-amber-300 font-semibold transition"
          >
            View all transactions →
          </Link>
        </div>
      </div>

      {/* Hide scrollbar for category filter */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </AppLayout>
  );
};

export default DashboardPage;