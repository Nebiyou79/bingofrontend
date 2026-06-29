// pages/pool/index.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import type { PoolMode } from '../../types/pool';

const MODES = [
  {
    mode:     'eightball' as PoolMode,
    icon:     '🎱',
    label:    'Eight Ball',
    subtitle: 'Classic 8-ball rules.\nPot all your balls and sink the 8 to win!',
    tags:     ['1 vs 1', '6 Pockets'],
    cta:      'Play Eight Ball',
    accent:   'border-emerald-800/40 hover:border-emerald-700/60',
    ctaClass: 'bg-emerald-600 hover:bg-emerald-500',
  },
  {
    mode:     'ethiopian' as PoolMode,
    icon:     '⭐',
    label:    'Ethiopian Points',
    subtitle: 'Score points by potting balls in order.\nHighest score wins!',
    tags:     ['1 vs 1', 'Points Mode'],
    cta:      'Play Ethiopian Points',
    accent:   'border-amber-800/40 hover:border-amber-700/60',
    ctaClass: 'bg-amber-500 hover:bg-amber-400',
  },
];

const FEATURES = [
  { icon: '👥', title: 'Real Players',    desc: 'Play against real opponents in real-time' },
  { icon: '🛡', title: 'Fair Play',       desc: 'Advanced anti-cheat and secure gameplay' },
  { icon: '🏆', title: 'Win Big',         desc: 'Compete in high stake rooms and win big' },
  { icon: '⚡', title: 'Instant Payouts', desc: 'Winnings are added to your wallet instantly' },
];

const PoolHome: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?next=/pool');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-400 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <>
      <Head><title>Pool · DashBets</title></Head>
      <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Hero */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-white font-black text-3xl mb-1">Pool</h1>
              <p className="text-zinc-500 text-sm">Play real-time 3D pool games and win big!</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-sm">👥</div>
              <div>
                <div className="text-white text-xs font-semibold">Real-time Multiplayer</div>
                <div className="text-zinc-500 text-xs">Play against real players</div>
              </div>
            </div>
          </div>

          {/* Section title */}
          <div className="mb-5">
            <h2 className="text-white font-bold text-base">Choose Game Mode</h2>
            <div className="mt-1.5 w-10 h-0.5 bg-emerald-500 rounded-full" />
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {MODES.map(({ mode, icon, label, subtitle, tags, cta, accent, ctaClass }) => (
              <div key={mode}
                className={`bg-zinc-900 border rounded-2xl p-6 transition-all duration-200 ${accent} cursor-pointer group`}
                onClick={() => router.push(`/pool/lobby/${mode}`)}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-xl">{label}</h3>
                    <p className="text-zinc-400 text-sm mt-0.5 whitespace-pre-line leading-snug">{subtitle}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-5">
                  {tags.map(tag => (
                    <span key={tag} className="text-zinc-400 text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 ${ctaClass}`}
                  onClick={e => { e.stopPropagation(); router.push(`/pool/lobby/${mode}`); }}
                >
                  {cta} <span>›</span>
                </button>
              </div>
            ))}
          </div>

          {/* Features row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-white font-semibold text-sm">{title}</div>
                <div className="text-zinc-500 text-xs mt-1 leading-snug">{desc}</div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-center text-zinc-600 text-xs mt-8">
            🛡 By playing, you agree to our{' '}
            <a href="/terms" className="text-emerald-500 underline underline-offset-2">Terms of Service</a>
            {' '}and confirm you are 18+ years of age.
          </p>
        </div>
      </div>
    </>
  );
};

export default PoolHome;