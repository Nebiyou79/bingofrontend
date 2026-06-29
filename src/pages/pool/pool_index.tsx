// pages/pool/index.tsx
// Matches Image 6: DashBets Pool home with Eight Ball + Ethiopian Points cards

import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';

const PoolHome: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login?next=/pool');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-green-500 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <>
      <Head><title>Pool · DashBets</title></Head>

      <div className="min-h-screen bg-zinc-950 px-6 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold leading-tight">Pool</h1>
            <p className="text-white/50 text-sm mt-1">Play real-time 3D pool games and win big!</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Real-time Multiplayer</div>
              <div className="text-white/40 text-xs">Play against real players</div>
            </div>
          </div>
        </div>

        {/* Mode label */}
        <div className="mb-5">
          <h2 className="text-white font-semibold text-lg">Choose Game Mode</h2>
          <div className="h-0.5 w-12 bg-green-500 mt-1.5 rounded-full" />
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Eight Ball */}
          <Link href="/pool/lobby/eightball" className="group block">
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900 overflow-hidden hover:border-green-600/60 transition-all duration-200 hover:shadow-lg hover:shadow-green-900/20">
              {/* Background image area */}
              <div className="h-44 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-end pr-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
                {/* Ball graphic */}
                <div className="relative z-10 flex gap-2 opacity-70 group-hover:opacity-90 transition-opacity">
                  {[8, 1, 2, 3].map(n => (
                    <div
                      key={n}
                      className="rounded-full flex items-center justify-center font-black text-white shadow-lg"
                      style={{
                        width: n === 8 ? 64 : 40,
                        height: n === 8 ? 64 : 40,
                        backgroundColor: n === 8 ? '#111' : n === 1 ? '#F5C518' : n === 2 ? '#1A52BD' : '#D62020',
                        fontSize: n === 8 ? 22 : 14,
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-black text-white text-lg">8</div>
                  <h3 className="text-white font-bold text-2xl">Eight Ball</h3>
                </div>
                <p className="text-white/50 text-sm mb-4">Classic 8-ball rules. Pot all your balls and sink the 8 to win!</p>
                <div className="flex gap-3 mb-5">
                  <span className="bg-white/10 text-white/60 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
                    1 vs 1
                  </span>
                  <span className="bg-white/10 text-white/60 text-xs px-3 py-1 rounded-full">6 Pockets</span>
                </div>
                <div className="bg-green-600 group-hover:bg-green-500 text-white font-semibold text-sm rounded-xl px-5 py-3 flex items-center justify-between transition-colors">
                  Play Eight Ball
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Ethiopian Points */}
          <Link href="/pool/lobby/ethiopian" className="group block">
            <div className="relative rounded-2xl border border-amber-600/30 bg-zinc-900 overflow-hidden hover:border-amber-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-amber-900/20">
              <div className="h-44 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-end pr-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
                <div className="relative z-10 flex gap-1.5 opacity-70 group-hover:opacity-90 transition-opacity flex-wrap max-w-[200px] justify-end">
                  {[3, 5, 7, 9, 11, 13].map(n => (
                    <div key={n} className="rounded-full flex items-center justify-center font-black text-white shadow-lg text-xs"
                      style={{ width: 36, height: 36, backgroundColor: ['#D62020','#E8792A','#8B1A1A','#F5C518','#D62020','#E8792A'][([3,5,7,9,11,13].indexOf(n))] }}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-xl">⭐</div>
                  <h3 className="text-white font-bold text-2xl">Ethiopian Points</h3>
                </div>
                <p className="text-white/50 text-sm mb-4">Score points by potting balls in order. Highest score wins!</p>
                <div className="flex gap-3 mb-5">
                  <span className="bg-white/10 text-white/60 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
                    1 vs 1
                  </span>
                  <span className="bg-white/10 text-white/60 text-xs px-3 py-1 rounded-full">Points Mode</span>
                </div>
                <div className="bg-amber-600 group-hover:bg-amber-500 text-white font-semibold text-sm rounded-xl px-5 py-3 flex items-center justify-between transition-colors">
                  Play Ethiopian Points
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '👥', title: 'Real Players',    desc: 'Play against real opponents in real-time' },
            { icon: '🛡️', title: 'Fair Play',       desc: 'Advanced anti-cheat and secure gameplay' },
            { icon: '🏆', title: 'Win Big',          desc: 'Compete in high stake rooms and win big' },
            { icon: '⚡', title: 'Instant Payouts',  desc: 'Winnings are added to your wallet instantly' },
          ].map(f => (
            <div key={f.title} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-white font-semibold text-sm mb-1">{f.title}</div>
              <div className="text-white/40 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Terms */}
        <div className="mt-8 flex items-center gap-2 text-white/25 text-xs">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          By playing, you agree to our{' '}
          <a href="/terms" className="text-green-500 underline">Terms of Service</a>{' '}
          and confirm that you are 18+ years of age.
        </div>
      </div>
    </>
  );
};

export default PoolHome;
