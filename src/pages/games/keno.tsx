/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/games/keno.tsx
 * CLASSIC KENO — Fully mobile-responsive upgrade.
 *
 * Mobile layout (< lg):
 *   - Single column. Right sidebar widgets collapse into an
 *     accordion-style "Game Info" drawer pinned above the board.
 *   - CountdownClock moves to a compact bar below the title.
 *   - PayoutTable + Recent Results move into a swipeable bottom sheet
 *     triggered by a "ℹ Info" button.
 *   - TrustBar collapses to 2×2 grid.
 *   - InfoStrip becomes scrollable horizontal strip.
 *   - Tab labels shortened to icons + abbreviation.
 *   - KenoTicketBuilder modifier row: grid-cols-4 → grid-cols-2 on xs.
 *
 * Desktop layout (>= lg):
 *   - Original 2-column (flex-1 + w-80) preserved exactly.
 *
 * All mobile fixes are Tailwind breakpoint classes only —
 * zero logic changes, zero prop changes to any component.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { useKenoSocket } from '../../hooks/useKenoSocket';

// ── Upgraded components ───────────────────────────────────────────────────────
import { KenoBoard }         from '../../components/keno/KenoBoard';
import { KenoTicketBuilder } from '../../components/keno/KenoTicketBuilder';
import { KenoCurrentBets }   from '../../components/keno/KenoCurrentBets';
import { KenoHistory }       from '../../components/keno/KenoHistory';
import { KenoResults }       from '../../components/keno/KenoResults';
import { KenoResult }        from '../../components/keno/KenoResult';
import { KenoStatistics }    from '../../components/keno/KenoStatistics';
import { GamePageWrapper }   from '../../components/games/GamePageWrapper';
import { getGameById }       from '../../config/gameConfig';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  accent:    'var(--accent,    #00d4aa)',
  accentDim: 'var(--accent-dim,rgba(0,212,170,0.12))',
  accentGlow:'var(--accent-glow,rgba(0,212,170,0.30))',
  gold:      'var(--gold,      #f5c842)',
  gold2:     '#e8a800',
  green:     'var(--green,     #00c853)',
  surface:   'var(--bg-surface,  #141824)',
  base:      'var(--bg-base,    #0b0e17)',
  elevated:  'var(--bg-elevated, #1c2132)',
  border:    'var(--border,    rgba(255,255,255,0.07))',
  borderLit: 'var(--border-lit,rgba(0,212,170,0.25))',
  textPri:   'var(--text-primary,   #e8ecf4)',
  textSec:   'var(--text-secondary, #8b93a7)',
  textMuted: 'var(--text-muted,    #4a5168)',
  mono:      "var(--font-mono, 'JetBrains Mono', monospace)",
  display:   "var(--font-display, 'Barlow Condensed', sans-serif)",
  body:      "var(--font-body, 'DM Sans', sans-serif)",
  rMd:       'var(--r-md, 10px)',
  rLg:       'var(--r-lg, 16px)',
};

// ─── Payout tables ─────────────────────────────────────────────────────────────
const PAYOUT_TABLES: Record<number, Array<{ hits: number; payout: string }>> = {
  1:  [{ hits: 1, payout: '3×' }],
  2:  [{ hits: 2, payout: '5×' }],
  3:  [{ hits: 2, payout: '2×' }, { hits: 3, payout: '20×' }],
  4:  [{ hits: 2, payout: '1.5×' }, { hits: 3, payout: '10×' }, { hits: 4, payout: '80×' }],
  5:  [{ hits: 3, payout: '3×' }, { hits: 4, payout: '20×' }, { hits: 5, payout: '200×' }],
  6:  [{ hits: 3, payout: '1.5×' }, { hits: 4, payout: '5×' }, { hits: 5, payout: '50×' }, { hits: 6, payout: '1,000×' }],
  7:  [{ hits: 4, payout: '5×' }, { hits: 5, payout: '50×' }, { hits: 6, payout: '200×' }, { hits: 7, payout: '2,000×' }],
  8:  [{ hits: 4, payout: '5×' }, { hits: 5, payout: '15×' }, { hits: 6, payout: '50×' }, { hits: 7, payout: '200×' }, { hits: 8, payout: '2,000×' }],
  9:  [{ hits: 4, payout: '2×' }, { hits: 5, payout: '10×' }, { hits: 6, payout: '30×' }, { hits: 7, payout: '100×' }, { hits: 8, payout: '500×' }, { hits: 9, payout: '2,500×' }],
  10: [{ hits: 5, payout: '5×' }, { hits: 6, payout: '20×' }, { hits: 7, payout: '80×' }, { hits: 8, payout: '300×' }, { hits: 9, payout: '1,000×' }, { hits: 10, payout: '5,000×' }],
};

const MAX_WIN: Record<number, string> = {
  1: '3×', 2: '5×', 3: '20×', 4: '80×', 5: '200×',
  6: '1,000×', 7: '2,000×', 8: '2,000×', 9: '2,500×', 10: '5,000×',
};

// ─── Ball palette ──────────────────────────────────────────────────────────────
const BALL_PALETTE = [
  { bg: '#dc2626', border: '#ef4444', glow: 'rgba(220,38,38,0.5)' },
  { bg: '#d97706', border: '#f59e0b', glow: 'rgba(217,119,6,0.5)'  },
  { bg: '#7c3aed', border: '#a855f7', glow: 'rgba(124,58,237,0.5)' },
  { bg: '#0891b2', border: '#22d3ee', glow: 'rgba(8,145,178,0.5)'  },
];
function ballColor(n: number) {
  return BALL_PALETTE[Math.min(Math.floor((n - 1) / 20), 3)];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RecentBall({ n }: { n: number }) {
  const c = ballColor(n);
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${c.bg}ee, ${c.bg}99)`,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 10px ${c.glow}`,
        fontFamily: T.mono,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span className="absolute" style={{ top: '3px', left: '3px', width: '5px', height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.55)' }} />
      <span className="relative z-10">{n}</span>
    </div>
  );
}

function PopularPick({ n, pct, onPick }: { n: number; pct: number; onPick: (n: number) => void }) {
  const c = ballColor(n);
  return (
    <button onClick={() => onPick(n)} className="flex flex-col items-center gap-1 group focus:outline-none">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white transition-transform group-hover:scale-110 relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${c.bg}ee, ${c.bg}99)`,
          border: `2px solid ${c.border}`,
          boxShadow: `0 0 10px ${c.glow}`,
          fontFamily: T.mono,
        }}
      >
        <span className="absolute" style={{ top: '3px', left: '3px', width: '5px', height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.55)' }} />
        <span className="relative z-10">{n}</span>
      </div>
      <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.accent }}>{pct}%</span>
    </button>
  );
}

/** Full countdown clock — used in desktop right column */
function CountdownClock({ seconds, roundNumber }: { seconds: number; roundNumber: number }) {
  const mm     = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss     = String(seconds % 60).padStart(2, '0');
  const urgent = seconds <= 10 && seconds > 0;
  const pct    = Math.min(100, (seconds / 120) * 100);

  return (
    <div
      className="rounded-2xl p-4 text-center relative overflow-hidden"
      style={{ background: T.surface, border: `1px solid ${T.borderLit}`, borderRadius: T.rLg }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: 'rgba(0,212,170,0.08)' }} />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Next Draw
        </p>
        <span className="text-xl">⏳</span>
      </div>
      <div
        className={`leading-none mb-1 relative z-10 transition-colors ${urgent ? 'animate-pulse' : ''}`}
        style={{
          fontFamily: T.display, fontSize: '52px', fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          color: urgent ? 'var(--red,#ff4757)' : T.accent,
          textShadow: `0 0 30px ${urgent ? 'rgba(255,71,87,0.5)' : T.accentGlow}`,
        }}
      >
        {mm}:{ss}
      </div>
      <p style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
        Draw #{String(roundNumber).padStart(7, '0')}
      </p>
      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: urgent ? 'var(--red,#ff4757)' : `linear-gradient(90deg, ${T.accent}, #00ffe7)` }} />
      </div>
    </div>
  );
}

/** Compact inline countdown bar — used on mobile below title */
function CountdownBar({ seconds, roundNumber }: { seconds: number; roundNumber: number }) {
  const mm     = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss     = String(seconds % 60).padStart(2, '0');
  const urgent = seconds <= 10 && seconds > 0;
  const pct    = Math.min(100, (seconds / 120) * 100);

  return (
    <div
      className="rounded-xl px-3 py-2 relative overflow-hidden"
      style={{ background: T.surface, border: `1px solid ${T.borderLit}`, borderRadius: T.rMd }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Next Draw
          </span>
          <span style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted }}>
            #{String(roundNumber).padStart(7, '0')}
          </span>
        </div>
        <span
          className={urgent ? 'animate-pulse' : ''}
          style={{ fontFamily: T.display, fontSize: '22px', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            color: urgent ? 'var(--red,#ff4757)' : T.accent }}
        >
          {mm}:{ss}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: T.elevated }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: urgent ? 'var(--red,#ff4757)' : `linear-gradient(90deg, ${T.accent}, #00ffe7)` }} />
      </div>
    </div>
  );
}

/** Payout sidebar — desktop right column */
function PayoutTableSidebar({ numPicks }: { numPicks: number }) {
  const rows = [...(PAYOUT_TABLES[numPicks] ?? PAYOUT_TABLES[10])].reverse();

  function multColor(payout: string): string {
    const v = parseFloat(payout.replace(/,/g, ''));
    if (v >= 1000) return T.gold;
    if (v >= 100)  return '#f97316';
    if (v >= 10)   return '#a78bfa';
    if (v >= 5)    return T.textSec;
    return T.textMuted;
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border, background: T.accentDim }}>
        <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Payout Table
        </p>
        <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>({numPicks} picks)</span>
      </div>
      <div className="grid grid-cols-2 px-4 py-2 border-b" style={{ borderColor: T.border }}>
        {['HITS', 'PAYOUT'].map((h, i) => (
          <span key={h} style={{ fontFamily: T.body, fontSize: '9px', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i === 1 ? 'right' : 'left' }}>
            {h}
          </span>
        ))}
      </div>
      <div className="px-4 py-1">
        {rows.map((row, i) => {
          const isTop = i === 0;
          return (
            <div key={row.hits} className="grid grid-cols-2 items-center py-2 border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.04)', background: isTop ? T.accentDim : 'transparent' }}>
              <span style={{ fontFamily: T.mono, fontSize: '12px', fontWeight: 600, color: isTop ? T.accent : T.textSec }}>
                {row.hits}
              </span>
              <span style={{ fontFamily: T.display, fontSize: '13px', fontWeight: 900, color: isTop ? T.gold : multColor(row.payout), textAlign: 'right' }}>
                {row.payout}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Mobile info drawer — replaces right column on small screens.
 * Toggled by the ℹ button in the title bar.
 * Contains: PayoutTable + Recent Results + Popular Picks.
 */
function MobileInfoDrawer({
  open, onClose, numPicks, drawnSoFar, onPopularPick,
}: {
  open: boolean; onClose: () => void; numPicks: number;
  drawnSoFar: number[]; onPopularPick: (n: number) => void; isBetting: boolean;
}) {
  if (!open) return null;
  const MOCK_RECENT = [12, 27, 34, 45, 58, 63, 72, 14, 33, 76];
  const POPULAR_PICKS_DATA = [{ n: 7, pct: 32 }, { n: 14, pct: 28 }, { n: 23, pct: 26 }, { n: 31, pct: 24 }, { n: 63, pct: 22 }];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl overflow-y-auto max-h-[80vh]"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: T.border }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: T.border }}>
          <p style={{ fontFamily: T.display, fontSize: '13px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Game Info
          </p>
          <button
            onClick={onClose}
            style={{ fontFamily: T.mono, fontSize: '18px', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 pb-8">
          {/* Payout table */}
          <PayoutTableSidebar numPicks={numPicks} />

          {/* Recent results */}
          <div className="rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: T.rLg }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: T.border, background: T.accentDim }}>
              <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Recent Results
              </p>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {(drawnSoFar.length > 0 ? drawnSoFar.slice(-10) : MOCK_RECENT).map((n, i) => (
                <RecentBall key={`${n}-${i}`} n={n} />
              ))}
            </div>
          </div>

          {/* Popular picks */}
          <div className="rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: T.rLg }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: T.border, background: T.accentDim }}>
              <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Popular Picks
              </p>
            </div>
            <div className="p-4 flex gap-4 justify-around">
              {POPULAR_PICKS_DATA.map(p => (
                <PopularPick key={p.n} n={p.n} pct={p.pct} onPick={(n) => { onPopularPick(n); onClose(); }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * InfoStrip — mobile: horizontal scroll; desktop: 3-col grid
 */
function InfoStrip({ numPicks, betAmount }: { numPicks: number; betAmount: number }) {
  const maxWin = MAX_WIN[numPicks] ?? '—';
  const items = [
    { icon: '🏆', label: 'Win Up To',  value: maxWin },
    { icon: '⭐', label: 'Max Picks',  value: `${numPicks} Numbers` },
    { icon: '🪙', label: 'Total Bet',  value: betAmount > 0 ? `${betAmount} ETB` : '—' },
  ];
  return (
    /* Mobile: flex + overflow-x-auto | Desktop: grid-cols-3 */
    <div className="flex lg:grid lg:grid-cols-3 gap-2 lg:gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl px-3 py-3 flex items-center gap-2 flex-shrink-0"
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd, minWidth: '120px' }}
        >
          <span className="text-lg flex-shrink-0">{item.icon}</span>
          <div className="min-w-0">
            <p style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {item.label}
            </p>
            <p style={{ fontFamily: T.display, fontSize: '13px', fontWeight: 700, color: T.accent, marginTop: '1px', whiteSpace: 'nowrap' }}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * TrustBar — mobile: 2×2 grid | desktop: 4-col single row
 */
function TrustBar() {
  const items = [
    { icon: '🛡️', title: 'Provably Fair', sub: '100% RNG' },
    { icon: '🕐', title: 'Live Draws',    sub: 'Every 2 Min' },
    { icon: '👥', title: '2,458 Players', sub: 'Online Now' },
    { icon: '🔒', title: 'Secure',        sub: '256-bit SSL' },
  ];
  return (
    /* Mobile: 2-col grid | Desktop: 4-col single row */
    <div
      className="rounded-2xl grid grid-cols-2 lg:grid-cols-4 lg:divide-x"
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}
    >
      {items.map((item, i) => (
        <div
          key={item.title}
          className="flex items-center gap-2 px-3 py-3"
          style={{
            borderColor: T.border,
            /* Mobile: bottom border on top row items */
            borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
            /* Mobile: right border on left-col items (0, 2) */
            borderRight: i % 2 === 0 ? `1px solid ${T.border}` : 'none',
          }}
        >
          <span className="text-base flex-shrink-0">{item.icon}</span>
          <div>
            <p style={{ fontFamily: T.display, fontSize: '11px', fontWeight: 700, color: T.textPri }}>{item.title}</p>
            <p style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted }}>{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'current' | 'history' | 'results' | 'statistics';

const POPULAR_PICKS = [
  { n: 7,  pct: 32 },
  { n: 14, pct: 28 },
  { n: 23, pct: 26 },
  { n: 31, pct: 24 },
  { n: 63, pct: 22 },
];

const MOCK_RECENT = [12, 27, 34, 45, 58, 63, 72, 14, 33, 76];

const KenoPage: NextPage = () => {
  const game   = getGameById('keno');
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login?next=/games/keno');
  }, [authLoading, isAuthenticated, router]);

  const [balance, setBalance] = useState(user?.balance ?? 0);
  useEffect(() => { if (user?.balance !== undefined) setBalance(user.balance); }, [user?.balance]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('dashbets_token') : null;
  const {
    connected, round, secondsLeft, drawnSoFar, latestBall,
    myTickets, history, historyPagination, numberStats,
    lastResult,
    error, balance: socketBalance,
    placeTicket, repeatTickets, fetchHistory, fetchStats, clearError,
  } = useKenoSocket(isAuthenticated ? token : null);

  useEffect(() => { if (socketBalance !== null) setBalance(socketBalance); }, [socketBalance]);

  const [tab,           setTab]           = useState<Tab>('current');
  const [selected,      setSelected]      = useState<number[]>([]);
  const [numPicks,      setNumPicks]      = useState(10);
  const [autoPlay,      setAutoPlay]      = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [statsLoaded,   setStatsLoaded]   = useState(false);
  const [showResult,    setShowResult]    = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);  // mobile bottom sheet

  useEffect(() => { if (lastResult) setShowResult(true); }, [lastResult]);

  useEffect(() => {
    if ((tab === 'history' || tab === 'results') && !historyLoaded) { fetchHistory(1); setHistoryLoaded(true); }
    if (tab === 'statistics' && !statsLoaded) { fetchStats(); setStatsLoaded(true); }
  }, [tab, historyLoaded, statsLoaded, fetchHistory, fetchStats]);

  useEffect(() => { if (round?.status === 'betting') setSelected([]); }, [round?.roundId]);

  const status    = round?.status ?? 'betting';
  const isBetting = status === 'betting';
  const roundNum  = round?.roundNumber ?? 2456897;

  const handlePlace = useCallback((picks: number[], bet: number) => {
    if (!isBetting) return;
    placeTicket(picks, bet);
    setBalance(p => Math.max(0, p - bet));
    setSelected([]);
    setTab('current');
  }, [isBetting, placeTicket]);

  const handleRepeat = useCallback((id: string) => {
    repeatTickets(id); setTab('current');
  }, [repeatTickets]);

  const toggleNumber = useCallback((n: number) => {
    if (!isBetting) return;
    setSelected(prev =>
      prev.includes(n) ? prev.filter(x => x !== n)
        : prev.length < numPicks ? [...prev, n] : prev
    );
  }, [isBetting, numPicks]);

  const togglePopular = useCallback((n: number) => {
    if (!isBetting) return;
    setSelected(prev =>
      prev.includes(n) ? prev.filter(x => x !== n)
        : prev.length < numPicks ? [...prev, n] : prev
    );
  }, [isBetting, numPicks]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.base }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-[var(--accent,#00d4aa)] border-white/10 animate-spin" />
      </div>
    );
  }

  // ── Short tab labels (mobile) / full labels (desktop) ──────────────────────
  const TAB_LABELS: Record<Tab, { short: string; full: string }> = {
    current:    { short: '🎟', full: 'Current' },
    history:    { short: '📋', full: 'History' },
    results:    { short: '🔢', full: 'Results' },
    statistics: { short: '📊', full: 'Stats' },
  };

  return (
    <GamePageWrapper game={game!} loadingDuration={2500}>
      <>
        <Head><title>Classic Keno — DashBets</title></Head>

        {/* Mobile info bottom sheet */}
        <MobileInfoDrawer
          open={showInfoSheet}
          onClose={() => setShowInfoSheet(false)}
          numPicks={numPicks}
          drawnSoFar={drawnSoFar}
          onPopularPick={togglePopular}
          isBetting={isBetting}
        />

        <div className="p-3 sm:p-4 lg:p-5 min-h-full" style={{ fontFamily: T.body, background: T.base }}>

          {/* Error banner */}
          {error && (
            <div className="flex items-center justify-between gap-3 mb-4 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.20)', borderRadius: T.rMd }}>
              <p style={{ fontFamily: T.mono, fontSize: '13px', color: 'var(--red,#ff4757)' }}>{error}</p>
              <button onClick={clearError}
                style={{ color: 'var(--red,#ff4757)', fontSize: '18px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {/* Result card */}
          {showResult && lastResult && (
            <div className="mb-4">
              <KenoResult result={lastResult as any} selectedNumbers={selected} onDismiss={() => setShowResult(false)} />
            </div>
          )}

          {/* ── Outer layout: single col on mobile, 2-col on lg+ ── */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">

            {/* ══ MAIN COLUMN ══ */}
            <div className="w-full lg:flex-1 lg:min-w-0 space-y-3 lg:space-y-4">

              {/* Title bar */}
              <div
                className="rounded-2xl px-4 lg:px-5 py-3 lg:py-4 flex items-center justify-between"
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl lg:text-2xl">👑</span>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-black text-white leading-none"
                      style={{ fontFamily: T.display, letterSpacing: '0.06em' }}>
                      CLASSIC KENO
                    </h1>
                    <p style={{ fontFamily: T.mono, fontSize: '10px', color: T.accent, marginTop: '2px' }}>
                      Live Draw · Every 2 Minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Connection dot */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'animate-pulse' : ''}`}
                      style={{ background: connected ? T.accent : 'var(--red,#ff4757)' }} />
                    {/* Label hidden on xs, visible sm+ */}
                    <span className="hidden sm:inline" style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
                      {connected ? 'Live' : 'Connecting…'}
                    </span>
                  </div>

                  {/* ℹ — triggers mobile info sheet; hidden on desktop (right col serves same purpose) */}
                  <button
                    onClick={() => setShowInfoSheet(true)}
                    className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 focus:outline-none"
                    style={{ background: T.accentDim, border: `1px solid rgba(0,212,170,0.25)`, color: T.accent, fontFamily: T.display, fontSize: '13px', fontWeight: 700 }}
                  >
                    ℹ
                  </button>

                  {/* "How to Play" — hidden on mobile, shown desktop */}
                  <button
                    className="hidden lg:flex items-center gap-1.5 transition-colors hover:opacity-80 focus:outline-none"
                    style={{ fontFamily: T.mono, fontSize: '11px', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]"
                      style={{ borderColor: T.border, color: T.textMuted }}>?</span>
                    How to Play?
                  </button>
                </div>
              </div>

              {/* Compact countdown — mobile only */}
              <div className="lg:hidden">
                <CountdownBar seconds={secondsLeft} roundNumber={roundNum} />
              </div>

              {/* Board card */}
              <div
                className="rounded-2xl px-3 sm:px-4 lg:px-5 py-4"
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}
              >
                {/* Pick count selector header */}
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontFamily: T.display, fontSize: '12px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Select 1–{numPicks}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>Max:</span>
                    <div className="flex gap-1">
                      {[1, 3, 5, 8, 10].map(n => (
                        <button
                          key={n}
                          onClick={() => { setNumPicks(n); setSelected([]); }}
                          className="w-7 h-7 rounded-lg text-xs font-bold transition-all focus:outline-none"
                          style={numPicks === n ? {
                            background: T.accent, color: '#0b0e17', fontFamily: T.display, border: 'none',
                          } : {
                            background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}`, fontFamily: T.display, cursor: 'pointer',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawing status bar */}
                {drawnSoFar.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 flex-wrap"
                    style={{ background: 'rgba(0,212,170,0.05)', border: `1px solid rgba(0,212,170,0.15)`, borderRadius: T.rMd }}>
                    <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: T.accent }} />
                    <span style={{ fontFamily: T.display, fontSize: '11px', fontWeight: 700, color: T.accent }}>
                      Drawing… {drawnSoFar.length}/20
                    </span>
                    <div className="flex gap-1 flex-wrap ml-1">
                      {drawnSoFar.map((n, i) => {
                        const isLatest = n === latestBall;
                        const isHit    = selected.includes(n);
                        return (
                          <span
                            key={`${n}-${i}`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-black transition-all relative overflow-hidden"
                            style={isLatest ? {
                              background: '#f97316', border: '2px solid #fb923c', color: '#000',
                              transform: 'scale(1.3)', boxShadow: '0 0 12px rgba(249,115,22,0.8)', fontFamily: T.mono,
                            } : isHit ? {
                              background: 'radial-gradient(circle at 35% 35%, #22c55e, #16a34a)',
                              border: '2px solid #4ade80', color: '#fff', boxShadow: '0 0 8px rgba(34,197,94,0.5)', fontFamily: T.mono,
                            } : {
                              background: 'radial-gradient(circle at 35% 35%, rgba(120,40,10,0.95), rgba(80,20,5,0.9))',
                              border: '1px solid rgba(154,52,18,0.4)', color: '#fb923c', fontFamily: T.mono,
                            }}
                          >
                            {n}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* KenoBoard — fully responsive (min/max cell width in component) */}
                <KenoBoard
                  selected={selected}
                  drawn={drawnSoFar}
                  latestBall={latestBall}
                  onToggle={toggleNumber}
                  disabled={!isBetting}
                  maxSpots={numPicks}
                />
              </div>

              {/* KenoTicketBuilder — owns QP, payout table, bet input, BET button */}
              <KenoTicketBuilder
                selected={selected}
                onSelect={setSelected}
                onPlace={handlePlace}
                balance={balance}
                disabled={!isBetting}
                status={status}
              />

              {/* Info strip */}
              <InfoStrip numPicks={numPicks} betAmount={0} />

              {/* Auto Play toggle */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🔄</span>
                  <div>
                    <p style={{ fontFamily: T.display, fontSize: '12px', fontWeight: 700, color: T.textPri }}>Auto Play</p>
                    <p style={{ fontFamily: T.mono, fontSize: '10px', color: T.textMuted }}>
                      Repeat bet automatically each round
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoPlay(v => !v)}
                  className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none"
                  style={{ background: autoPlay ? T.accent : T.elevated, border: `1px solid ${T.border}` }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                    style={{ left: autoPlay ? '22px' : '2px' }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}>
                {/* Tab strip */}
                <div className="flex border-b" style={{ borderColor: T.border }}>
                  {(['current', 'history', 'results', 'statistics'] as Tab[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className="flex-1 py-3 transition-all focus:outline-none"
                      style={{
                        fontFamily: T.display,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background: tab === id ? T.accentDim : 'transparent',
                        color: tab === id ? T.accent : T.textMuted,
                        cursor: 'pointer',
                        border: 'none',
                        borderBottom: tab === id ? `2px solid ${T.accent}` : '2px solid transparent',
                      }}
                    >
                      {/* Mobile: icon only | sm+: full label */}
                      <span className="sm:hidden">{TAB_LABELS[id].short}</span>
                      <span className="hidden sm:inline">{TAB_LABELS[id].full}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 sm:p-4">
                  {tab === 'current'    && <KenoCurrentBets tickets={myTickets} drawnSoFar={drawnSoFar} status={status} />}
                  {tab === 'history'    && <KenoHistory rounds={history} pagination={historyPagination} loading={!historyLoaded} onPageChange={fetchHistory} onRepeat={handleRepeat} />}
                  {tab === 'results'    && <KenoResults rounds={history} loading={!historyLoaded} />}
                  {tab === 'statistics' && <KenoStatistics stats={numberStats} roundsAnalysed={numberStats.length > 0 ? 100 : 0} />}
                </div>
              </div>

              {/* Trust bar */}
              <TrustBar />
            </div>

            {/* ══ RIGHT COLUMN — desktop only (hidden on mobile, replaced by bottom sheet) ══ */}
            <div className="hidden lg:flex lg:w-80 lg:flex-shrink-0 flex-col gap-4">

              {/* Countdown */}
              <CountdownClock seconds={secondsLeft} roundNumber={roundNum} />

              {/* Payout table */}
              <PayoutTableSidebar numPicks={numPicks} />

              {/* Recent Results */}
              <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: T.border, background: T.accentDim }}>
                  <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Recent Results
                  </p>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {(drawnSoFar.length > 0 ? drawnSoFar.slice(-10) : MOCK_RECENT).map((n, i) => (
                    <RecentBall key={`${n}-${i}`} n={n} />
                  ))}
                </div>
              </div>

              {/* Popular Picks */}
              <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border, background: T.accentDim }}>
                  <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Popular Picks
                  </p>
                  <button style={{ fontFamily: T.mono, fontSize: '10px', color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View more
                  </button>
                </div>
                <div className="p-4 flex gap-3 justify-around">
                  {POPULAR_PICKS.map(p => (
                    <PopularPick key={p.n} n={p.n} pct={p.pct} onPick={togglePopular} />
                  ))}
                </div>
              </div>

              {/* VIP + Daily Bonus widget */}
              <div
                className="rounded-2xl overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.10), rgba(11,14,23,0.97))', border: `1px solid rgba(0,212,170,0.20)`, borderRadius: T.rLg }}
              >
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none"
                  style={{ background: 'rgba(0,212,170,0.08)' }} />
                <div className="px-4 pt-4 pb-2 relative z-10">
                  <p style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>VIP Level</p>
                  <p style={{ fontFamily: T.display, fontSize: '18px', fontWeight: 900, color: T.gold }}>Gold III</p>
                  <div className="flex justify-between mb-1 mt-1" style={{ fontFamily: T.mono, fontSize: '9px', color: T.textMuted }}>
                    <span>2,450 / 5,000 XP</span><span>2,940 to next</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: '49%', background: `linear-gradient(90deg, ${T.accent}, #00ffe7)` }} />
                  </div>
                </div>
                <div className="mx-4 mb-4 mt-3 rounded-xl p-3 text-center relative z-10"
                  style={{ background: T.accentDim, border: `1px solid rgba(0,212,170,0.20)`, borderRadius: T.rMd }}>
                  <p style={{ fontFamily: T.display, fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily Bonus</p>
                  <p style={{ fontFamily: T.mono, fontSize: '11px', color: T.textSec, marginTop: '2px' }}>Up to 5,000 ETB</p>
                  <button
                    className="mt-2 w-full py-2 rounded-xl font-black transition-all hover:brightness-105 active:scale-[0.97] focus:outline-none"
                    style={{ background: T.accent, color: '#0b0e17', fontFamily: T.display, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${T.accentGlow}`, borderRadius: T.rMd }}
                  >
                    Claim Now
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </>
    </GamePageWrapper>
  );
};

export default KenoPage;