/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/games/spin/index.tsx — DashBets Premium Spin Page
 * Uses AppLayout for consistent chrome across all pages.
 */

import React, { useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpin }       from '../../../hooks/useSpin';
import { useSpinStats }  from '../../../hooks/useSpinData';
import { useAuthContext } from '../../../context/AuthContext';
import { GamePageWrapper } from '../../../components/games/GamePageWrapper';
import { getGameById }   from '../../../config/gameConfig';
import { SpinWheel }     from '../../../components/spin/SpinWheel';
import { JackpotBar }    from '../../../components/spin/JackpotBar';
import { BetControls }   from '../../../components/spin/BetControls';
import { WinModal }      from '../../../components/spin/WinModal';
import { LiveFeed }      from '../../../components/spin/LiveFeed';
import { SpinHistory }   from '../../../components/spin/SpinHistory';
import { VipProgressBar } from '../../../components/spin/VipComponents';
import { useJackpotStore } from '../../../stores';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ selectedBet }: { selectedBet: number }) {
  // const { data: stats } = useSpinStats();
  const pools     = useJackpotStore((s: any) => s.pools);
  const grandPool = (Object.values(pools as any) as any[]).find((p: any) => p.type === 'grand');


  const items = [
    { label: 'MIN BET',  value: '1 ETB',                                      color: '#22c55e', icon: '▼' },
    { label: 'YOUR BET', value: `${selectedBet} ETB`,                         color: '#f59e0b', icon: '●' },
    { label: 'MAX WIN',  value: `${(selectedBet * 25).toLocaleString()} ETB`, color: '#ef4444', icon: '▲' },
    { label: 'JACKPOT',  value: `${(grandPool?.amount ?? 52000).toLocaleString()} ETB`, color: '#a855f7', icon: '◆' },
  ];

  return (
    <div className="grid grid-cols-4 rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,4,16,0.8)' }}>
      {items.map(({ label, value, color, icon }, i) => (
        <div key={label}
          className="flex flex-col items-center py-3 px-2"
          style={{
            borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[9px]" style={{ color }}>{icon}</span>
            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{label}</span>
          </div>
          <span className="text-sm font-black tabular-nums"
            style={{ color, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.02em' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Spin button ──────────────────────────────────────────────────────────────

function SpinButton({ isReady, spinning, cooldown, selectedBet, onClick }: {
  isReady: boolean; spinning: boolean; cooldown: number; selectedBet: number; onClick: () => void;
}) {
  return (
    <div className="relative flex justify-center">
      {cooldown > 0 && (
        <svg className="absolute inset-0 m-auto pointer-events-none"
          width={220} height={68} viewBox="-6 -6 232 80" style={{ overflow: 'visible' }}>
          <rect x={0} y={0} width={220} height={68} rx={34} fill="none"
            stroke="rgba(124,58,237,0.12)" strokeWidth={4}/>
          <rect x={0} y={0} width={220} height={68} rx={34} fill="none"
            stroke="#7c3aed" strokeWidth={4} strokeLinecap="round"
            strokeDasharray={`${(220 + 68) * 2}`}
            strokeDashoffset={`${((220 + 68) * 2) * (1 - cooldown / 3)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}/>
        </svg>
      )}
      <button
        onClick={onClick}
        disabled={!isReady}
        className="relative w-56 rounded-full font-black text-lg tracking-widest transition-all duration-150 focus:outline-none overflow-hidden active:scale-95"
        style={{
          height: 64,
          ...(isReady ? {
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
            boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 8px 32px rgba(124,58,237,0.3)',
            color: '#fff',
          } : {
            background: 'rgba(20,16,40,0.6)',
            border: '1px solid rgba(124,58,237,0.15)',
            color: '#4c3d7a',
            cursor: 'not-allowed',
          }),
          fontFamily: "'Rajdhani',sans-serif",
        }}>
        {/* Shine overlay */}
        {isReady && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.12) 0%,transparent 60%)' }}/>
        )}
        <span className="relative z-10 flex flex-col items-center leading-tight">
          {spinning ? (
            <span className="animate-pulse text-purple-200">Spinning…</span>
          ) : cooldown > 0 ? (
            <span className="text-base font-mono">Wait {cooldown}s</span>
          ) : (
            <>
              <span className="text-xl">SPIN</span>
              <span className="text-[11px] font-mono opacity-70">{selectedBet} ETB</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

// ─── Right sidebar panels ─────────────────────────────────────────────────────

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(5,4,16,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-slate-500">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TodayStats() {
  const { data: stats } = useSpinStats();
  const daily   = (stats as any)?.daily ?? { wins: 0, totalSpins: 0, netPnl: 0 };
  const winRate = daily.totalSpins > 0 ? Math.round((daily.wins / daily.totalSpins) * 100) : 0;
  const items = [
    { l: 'Spins',   v: daily.totalSpins.toString(), c: 'text-slate-300' },
    { l: 'Win %',   v: `${winRate}%`,               c: winRate >= 50 ? 'text-emerald-400' : 'text-rose-400' },
    { l: 'Net P&L', v: `${daily.netPnl >= 0 ? '+' : ''}${daily.netPnl.toLocaleString()}`, c: daily.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
    { l: 'Best ×',  v: `${(stats as any)?.highestMultiplier ?? 0}×`, c: 'text-amber-400' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ l, v, c }) => (
        <div key={l} className="text-center py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className={`text-sm font-black tabular-nums font-mono ${c}`}
            style={{ fontFamily: "'Rajdhani',sans-serif" }}>{v}</p>
          <p className="text-[8px] text-slate-700 font-mono mt-0.5 uppercase tracking-wide">{l}</p>
        </div>
      ))}
    </div>
  );
}

function JackpotCard() {
  const pools     = useJackpotStore((s: any) => s.pools);
  const grandPool = (Object.values(pools as any) as any[]).find((p: any) => p.type === 'grand');
  return (
    <div className="rounded-2xl p-5 space-y-3 text-center"
      style={{
        background: 'linear-gradient(135deg,rgba(88,28,135,0.2),rgba(20,16,40,0.9))',
        border: '1px solid rgba(168,85,247,0.2)',
      }}>
      <div className="text-3xl">💎</div>
      <div>
        <p className="text-[9px] font-mono tracking-widest uppercase text-purple-500 mb-1">Grand Jackpot</p>
        <p className="font-black text-purple-300 tabular-nums"
          style={{ fontSize: 28, fontFamily: "'Rajdhani',sans-serif" }}>
          {(grandPool?.amount ?? 52000).toLocaleString()}
          <span className="text-lg ml-1 text-purple-600">ETB</span>
        </p>
      </div>
      <p className="text-[9px] text-slate-600 font-mono">Can be won at any time!</p>
      <button className="w-full py-2 rounded-xl text-[11px] font-bold font-mono transition-all"
        style={{ background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.2)', color:'#c084fc' }}>
        View Jackpot History
      </button>
    </div>
  );
}

// ─── Left sidebar panels ──────────────────────────────────────────────────────

function HowToPlay() {
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(5,4,16,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-slate-500">How to Play</p>
      {[
        ['1', 'Select your bet', 'Choose an ETB chip amount'],
        ['2', 'Click SPIN',      'Wheel spins — result is fair'],
        ['3', 'Collect winnings','Up to 25× your bet!'],
      ].map(([n, t, s]) => (
        <div key={n} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>{n}</div>
          <div>
            <p className="text-[11px] font-bold text-slate-300">{t}</p>
            <p className="text-[9px] text-slate-600">{s}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyBonus() {
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(5,4,16,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🎁</span>
        <p className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Daily Bonus</p>
      </div>
      <p className="text-[9px] text-slate-600">Claim your free daily bonus!</p>
      <div className="flex items-center justify-between">
        <span className="text-xl font-black text-purple-400" style={{ fontFamily: "'Rajdhani',sans-serif" }}>
          250 ETB
        </span>
        <span className="text-[10px] font-mono text-slate-600">23:59:59</span>
      </div>
      <button className="w-full py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          fontFamily: "'Rajdhani',sans-serif",
        }}>
        Claim Bonus
      </button>
    </div>
  );
}

function ProvablyFairCard() {
  return (
    <div className="rounded-2xl p-4 space-y-2"
      style={{ background: 'rgba(5,4,16,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2">
        <span>🔒</span>
        <p className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Provably Fair</p>
      </div>
      <p className="text-[9px] text-slate-600 leading-relaxed">
        Every spin uses cryptographic seeds — fully transparent and verifiable.
      </p>
      <Link href="/games/spin/verify"
        className="flex items-center gap-1 text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors">
        <span className="text-emerald-500">✓</span> Verify Fairness
      </Link>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

function SpinPageContent() {
  const { user } = useAuthContext();
  const {
    spinning, result, error, cooldown,
    selectedBet, autoSpin, turboMode,
    spin, clearResult, setSelectedBet, setAutoSpin, setTurboMode,
    isReady, balance,
  } = useSpin();

  const handleSpin    = useCallback(() => spin(selectedBet), [spin, selectedBet]);
  const handleDismiss = useCallback(() => clearResult(), [clearResult]);

  return (
    <div className="px-4 py-5 max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white"
            style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.04em' }}>
            Spin Wheel
          </h1>
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">
            Provably fair · 16 segments · 12 outcomes
          </p>
        </div>
        <Link href="/games/spin/verify"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
          <span>✓</span> Verify Fairness
        </Link>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-5">

        {/* ── LEFT ── */}
        <div className="space-y-4 hidden lg:block">
          {/* Balance card */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(5,4,16,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-3">Your Balance</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-amber-400 tabular-nums"
                  style={{ fontFamily: "'Rajdhani',sans-serif" }}>
                  {(balance ?? 0).toLocaleString()}
                  <span className="text-sm ml-1 text-amber-700">ETB</span>
                </p>
              </div>
              <Link href="/wallet"
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xl transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                +
              </Link>
            </div>
          </div>

          <DailyBonus />
          <HowToPlay />
          <ProvablyFairCard />
        </div>

        {/* ── CENTER ── */}
        <div className="space-y-4">
          <StatsBar selectedBet={selectedBet} />
          <JackpotBar />

          {/* Wheel */}
          <div className="flex justify-center py-1">
            <SpinWheel
              isSpinning={spinning}
              stopAngle={(result as any)?.stopAngle ?? null}
              isWinner={Boolean((result as any)?.isWin)}
            />
          </div>

          {/* Error */}
          {error && !result && (
            <div className="rounded-xl px-4 py-3 text-center"
              style={{ background: 'rgba(153,27,27,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-rose-400 text-xs font-mono">{error}</p>
            </div>
          )}

          {/* Bet controls */}
          <BetControls
            selected={selectedBet}
            balance={balance ?? 0}
            disabled={spinning || cooldown > 0}
            autoSpin={autoSpin}
            turboMode={turboMode}
            onSelect={setSelectedBet}
            onAutoSpin={setAutoSpin}
            onTurbo={setTurboMode}
          />

          {/* Spin button */}
          <SpinButton
            isReady={isReady}
            spinning={spinning}
            cooldown={cooldown}
            selectedBet={selectedBet}
            onClick={handleSpin}
          />

          {/* VIP progress */}
          {user && (
            <VipProgressBar
              vipLevel={user.vipLevel ?? 0}
              vipPoints={user.vipPoints ?? 0}
              totalWagered={user.totalWagered ?? 0}
            />
          )}

          {/* Spin history */}
          <section className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Recent Spins</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <SpinHistory />
          </section>
        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-4 hidden lg:block">
          <SidePanel title="Recent Activity">
            <LiveFeed />
          </SidePanel>

          <JackpotCard />

          <SidePanel title="Today's Stats">
            <TodayStats />
          </SidePanel>
        </div>
      </div>

      {/* Win modal */}
      {result && (result as any).result && (
        <WinModal result={result as any} onDismiss={handleDismiss} />
      )}
    </div>
  );
}

// ─── Export with providers ────────────────────────────────────────────────────

export default function SpinPage() {
  const game = getGameById('spin')!; // matches gameConfig.ts id for Spin Wheel

  return (
    <>
      <Head>
        <title>Spin Wheel — DashBets</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <GamePageWrapper game={game}>
          <SpinPageContent />
        </GamePageWrapper>
      </QueryClientProvider>
    </>
  );
}