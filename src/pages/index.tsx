/**
 * pages/index.tsx
 * DashBets — Public landing page.
 * Redesigned to match the rich casino aesthetic with dark purple/gold theme.
 */

import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../context/AuthContext';

// ─── Game Card ────────────────────────────────────────────────────────────────

interface GameCardProps {
  href: string;
  emoji: string;
  title: string;
  tagline: string;
  rtp: string;
  color: string;
  glowColor: string;
  badge?: string;
}

function GameCard({ href, emoji, title, tagline, rtp, glowColor, badge }: GameCardProps) {
  const inner = (
    <div
      className="group relative rounded-2xl p-5 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 4px 30px ${glowColor}20`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${glowColor}40`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${glowColor}50`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 30px ${glowColor}20`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(255,255,255,0.08)`;
      }}
    >
      {badge && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
        >
          {badge}
        </div>
      )}

      {/* Game illustration area */}
      <div
        className="w-full h-32 rounded-xl mb-4 flex items-center justify-center text-6xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${glowColor}20, ${glowColor}08)` }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}40 0%, transparent 70%)`,
          }}
        />
        <span className="relative z-10 text-7xl group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </span>
      </div>

      <h3
        className="text-lg font-extrabold text-white mb-1"
        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
      >
        {title}
      </h3>
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{tagline}</p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-gray-600">
          RTP <span style={{ color: glowColor }}>{rtp}</span>
        </span>
        {!badge && (
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${glowColor}cc)`,
              color: '#fff',
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.05em',
            }}
          >
            Play Now
          </div>
        )}
      </div>
    </div>
  );

  if (badge) return inner;
  return <Link href={href}>{inner}</Link>;
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p
        className="text-2xl sm:text-3xl font-extrabold text-white"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5 font-mono">{label}</p>
    </div>
  );
}


// ─── Live Winner Row ──────────────────────────────────────────────────────────

function WinnerRow({ name, amount, game, time }: { name: string; amount: string; game: string; time: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
      >
        {name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{name}</p>
        <p className="text-[10px] text-gray-600 font-mono">{game} · {time}</p>
      </div>
      <span className="text-xs font-bold text-amber-400 font-mono tabular-nums shrink-0">
        +{amount} ETB
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LandingPage: NextPage = () => {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, loading, router]);

  return (
    <>
      <Head>
        <title>DashBets — Play. Win. Repeat.</title>
        <meta name="description" content="Ethiopia's premier online betting platform. Spin Wheel, Bingo, Keno, Pool — real ETB payouts." />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="min-h-screen text-white flex flex-col"
        style={{
          fontFamily: "'Exo 2', sans-serif",
          background: 'linear-gradient(135deg, #0f0c1a 0%, #12101f 60%, #0a0d1a 100%)',
        }}
      >
        {/* ── Ambient backgrounds ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }}
          />
          <div
            className="absolute top-32 right-1/4 w-72 h-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-96 h-64 opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
        </div>

        {/* ── 1. Nav ── */}
        <nav
          className="sticky top-0 z-50 border-b border-white/5"
          style={{ background: 'rgba(15,12,26,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                🎰
              </div>
              <div>
                <p
                  className="text-base font-extrabold text-white leading-none"
                  style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}
                >
                  DASHBETS
                </p>
                <p className="text-[8px] text-amber-500/60 font-mono tracking-widest uppercase leading-none">
                  Play · Win · Repeat
                </p>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {['Home', 'Games', 'Jackpot', 'VIP Club', 'Promotions', 'Support'].map((item) => (
                <button
                  key={item}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Auth CTAs */}
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.06em',
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>

        {/* ── 2. Hero ── */}
        <section className="relative max-w-6xl mx-auto w-full px-4 pt-16 pb-12 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 max-w-xl">
            {/* Country badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6 border border-amber-500/20"
              style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}
            >
              🇪🇹 Ethiopia&apos;s #1 Betting Platform
            </div>

            <h1
              className="text-5xl sm:text-6xl font-extrabold leading-[1.0] mb-5"
              style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.02em' }}
            >
              <span className="text-white">PLAY YOUR</span>
              <br />
              <span className="text-white">FAVORITE </span>
              <span className="text-amber-400">GAMES</span>
              <br />
              <span className="text-white">WIN </span>
              <span
                className="text-transparent"
                style={{
                  WebkitTextStroke: '2px #7c3aed',
                  textShadow: '0 0 30px rgba(124,58,237,0.5)',
                }}
              >
                BIG
              </span>
              <span className="text-white"> EVERYDAY!</span>
            </h1>

            <p className="text-gray-400 text-base mb-3">
              Bingo, Spin, Keno, Pool — Endless excitement
            </p>
            <p className="text-gray-500 text-sm mb-8">huge jackpots and real rewards!</p>

            <div className="flex gap-3">
              <Link
                href="/auth/register"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-white shadow-xl transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  boxShadow: '0 6px 25px rgba(124,58,237,0.45)',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.06em',
                }}
              >
                Start Playing Now
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-gray-300 border border-white/15 hover:border-white/30 hover:text-white transition-all"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                ▶ How It Works
              </Link>
            </div>
          </div>

          {/* Hero visual — jackpots panel + illustration */}
          <div className="flex-1 hidden lg:block">
            {/* Jackpots showcase */}
            <div
              className="rounded-2xl overflow-hidden border border-white/8 p-5"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🏆</span>
                <p
                  className="text-sm font-bold uppercase tracking-wider text-gray-300"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  OUR JACKPOTS
                </p>
                <span className="text-xs text-gray-600">Win big in our progressive jackpots</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'MINI',  amount: '45,250',     color: '#10b981' },
                  { label: 'MINOR', amount: '125,750',    color: '#22d3ee' },
                  { label: 'MAJOR', amount: '950,500',    color: '#f59e0b' },
                  { label: 'GRAND', amount: '4,560,750',  color: '#ef4444' },
                ].map((j) => (
                  <div
                    key={j.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: `${j.color}10`, border: `1px solid ${j.color}25` }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: j.color, fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {j.label}
                    </p>
                    <p
                      className="text-sm font-bold text-white leading-tight font-mono"
                    >
                      {j.amount}
                    </p>
                    <p className="text-[9px] text-gray-600 mt-0.5">ETB</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Stats strip ── */}
        <section className="max-w-4xl mx-auto w-full px-4 pb-12">
          <div
            className="grid grid-cols-4 gap-6 rounded-2xl p-6 border border-white/6"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <StatBadge value="250K+" label="Players" />
            <StatBadge value="10M+" label="Bets Placed" />
            <StatBadge value="25M+ ETB" label="Total Won" />
            <StatBadge value="99.9%" label="Uptime" />
          </div>
        </section>

        {/* ── 4. Choose your game ── */}
        <section className="max-w-6xl mx-auto w-full px-4 pb-16">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4))' }}
            />
            <h2
              className="text-lg font-bold uppercase tracking-[0.2em] text-white"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              → CHOOSE YOUR GAME ←
            </h2>
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.4), transparent)' }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GameCard
              href="/games/spin"
              emoji="🎡"
              title="SPIN"
              tagline="Spin the wheel and win awesome prizes"
              rtp="96.5%"
              color="#7c3aed"
              glowColor="#7c3aed"
            />
            <GameCard
              href="/games/bingo"
              emoji="🎱"
              title="BINGO"
              tagline="Join live bingo rooms and win big"
              rtp="90.2%"
              color="#10b981"
              glowColor="#10b981"
            />
            <GameCard
              href="/games/keno"
              emoji="🔢"
              title="KENO"
              tagline="Pick your numbers and get lucky"
              rtp="97.1%"
              color="#f59e0b"
              glowColor="#f59e0b"
            />
            <GameCard
              href="/games/pool"
              emoji="🎯"
              title="POOL"
              tagline="Predict the next ball and win big"
              rtp="95.0%"
              color="#22d3ee"
              glowColor="#22d3ee"
            />
          </div>
        </section>

        {/* ── 5. Social proof + Bonus + Features ── */}
        <section className="max-w-6xl mx-auto w-full px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Winners */}
            <div
              className="rounded-2xl p-5 border border-white/6"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <h3
                className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                LIVE WINNERS
              </h3>
              <WinnerRow name="John D." amount="12,500" game="Spin" time="2m ago" />
              <WinnerRow name="Alex M." amount="5,750" game="Bingo" time="5m ago" />
              <WinnerRow name="Sara K." amount="3,200" game="Keno" time="7m ago" />
              <WinnerRow name="David L." amount="25,000" game="Spin" time="10m ago" />
              <WinnerRow name="Mike B." amount="1,850" game="Pool" time="12m ago" />
            </div>

            {/* Welcome Bonus */}
            <div
              className="rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-amber-500/20 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))' }}
            >
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(245,158,11,0.3) 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <p
                className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                WELCOME BONUS
              </p>
              <p
                className="text-3xl font-extrabold text-white mb-1 leading-tight"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                100% UP TO
              </p>
              <p
                className="text-4xl font-extrabold text-amber-400 mb-1"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                5,000 ETB
              </p>
              <p
                className="text-lg font-bold text-white mb-5"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                + 50 FREE SPINS
              </p>
              <Link
                href="/auth/register"
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.06em',
                }}
              >
                Claim Bonus Now
              </Link>
            </div>

            {/* Why DashBets */}
            <div
              className="rounded-2xl p-5 border border-white/6"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <h3
                className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                WHY DASHBETS?
              </h3>
              <div className="space-y-1">
                {[
                  { icon: '✅', text: 'Provably Fair Games' },
                  { icon: '⚡', text: 'Instant Withdrawals' },
                  { icon: '🛡️', text: '24/7 Customer Support' },
                  { icon: '💎', text: 'Huge Jackpots' },
                  { icon: '🎁', text: 'VIP Rewards & Cashback' },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-base">{f.icon}</span>
                    <span className="text-sm text-gray-300 font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. CTA Band ── */}
        <section className="max-w-6xl mx-auto w-full px-4 pb-20">
          <div
            className="relative overflow-hidden rounded-2xl px-8 py-10 text-center border border-purple-500/20"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.1))',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center bottom, rgba(124,58,237,0.3) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-3 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
              >
                🛡️ PROVABLY FAIR · 100% Transparent
              </div>
              <h2
                className="text-3xl font-extrabold text-white mb-5"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.02em' }}
              >
                Create your account — it&apos;s free.
              </h2>
              <Link
                href="/auth/register"
                className="inline-block px-12 py-3.5 rounded-xl text-base font-bold text-white shadow-xl transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  boxShadow: '0 6px 25px rgba(124,58,237,0.5)',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.08em',
                }}
              >
                Get Started →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. Footer ── */}
        <footer className="border-t border-white/5 py-8 px-4 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                🎰
              </div>
              <span className="text-sm font-bold text-gray-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                © {new Date().getFullYear()} DASHBETS · Addis Ababa, Ethiopia
              </span>
            </div>
            <div className="flex gap-6 text-xs text-gray-700">
              <Link href="/auth/login" className="hover:text-gray-400 transition-colors">Log In</Link>
              <Link href="/auth/register" className="hover:text-gray-400 transition-colors">Register</Link>
              <span className="cursor-default">Terms</span>
              <span className="cursor-default">Responsible Gaming</span>
              <span className="cursor-default">Privacy</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;