/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/games/crash/CrashGame.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthContext }    from '../../../context/AuthContext';
import { useCrashGame }      from '../../../hooks/useCrashGame';
import { CrashChart }        from '../../../components/crash/CrashChart';
import { CrashHistory }      from '../../../components/crash/CrashHistory';
import { BetPanel }          from '../../../components/crash/BetPanel';
import { ActiveBets }        from '../../../components/crash/ActiveBets';

type BetsTab = 'All Bets' | 'Previous' | 'Top';

// ─── useIsDesktop ─────────────────────────────────────────────────────────────
// Returns null while unmeasured (SSR/first paint), then true/false
function useIsDesktop(breakpoint = 1024): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isDesktop;
}

// ─── ZombieLogo ──────────────────────────────────────────────────────────────
function ZombieLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1.5px solid rgba(114,255,59,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(114,255,59,0.07)',
          fontSize: 17,
          flexShrink: 0,
        }}
      >
        ☣
      </div>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{
          fontSize: 15, fontWeight: 900,
          color: '#72FF3B',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textShadow: '0 0 14px rgba(114,255,59,0.6)',
          fontFamily: "'Courier New', monospace",
        }}>
          ZOMBIE
        </div>
        <div style={{
          fontSize: 7, fontWeight: 700,
          letterSpacing: '0.3em',
          color: 'rgba(114,255,59,0.4)',
          textTransform: 'uppercase',
        }}>
          OUTBREAK CRASH
        </div>
      </div>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, isConnected }: { status: string; isConnected: boolean }) {
  const map: Record<string, { color: string; bg: string; label: string; pulse: boolean }> = {
    waiting: { color: '#FFD700', bg: 'rgba(255,215,0,0.10)',  label: 'STANDBY',  pulse: false },
    running: { color: '#72FF3B', bg: 'rgba(114,255,59,0.10)', label: 'LIVE',     pulse: true  },
    crashed: { color: '#FF4655', bg: 'rgba(255,70,85,0.10)',  label: 'INFECTED', pulse: false },
    idle:    { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: 'IDLE',     pulse: false },
  };
  const c = isConnected ? (map[status] ?? map.idle) : { color: '#FF4655', bg: 'rgba(255,70,85,0.1)', label: 'OFFLINE', pulse: false };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20,
      background: c.bg,
      border: `1px solid ${c.color}35`,
      fontSize: 10, color: c.color, fontWeight: 700,
      letterSpacing: '0.12em', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: c.color, display: 'inline-block', flexShrink: 0,
        animation: c.pulse ? 'zg-pulse 1s ease-in-out infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}

// ─── WinToast ─────────────────────────────────────────────────────────────────
function WinToast({ toast, onClose }: { toast: { mult: number; payout: number }; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: 14, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 30,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px',
      borderRadius: 14,
      background: 'rgba(5,15,5,0.96)',
      border: '1px solid rgba(114,255,59,0.4)',
      boxShadow: '0 8px 32px rgba(114,255,59,0.2), 0 2px 8px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(14px)',
      animation: 'zg-toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      minWidth: 220, maxWidth: 300,
      whiteSpace: 'nowrap',
      pointerEvents: 'auto',
    }}>
      <span style={{ fontSize: 20 }}>☣</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(114,255,59,0.55)', textTransform: 'uppercase', marginBottom: 3 }}>
          ESCAPED THE OUTBREAK
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ color: '#72FF3B', fontWeight: 900, fontSize: 18, fontFamily: 'monospace', textShadow: '0 0 10px rgba(114,255,59,0.7)' }}>
            +{toast.payout.toFixed(2)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>ETB</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>@ {toast.mult.toFixed(2)}x</span>
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ─── BetsSection ─────────────────────────────────────────────────────────────
function BetsSection({
  betsTab, setBetsTab, bets, status, multiplier, userId, history,
}: {
  betsTab: BetsTab; setBetsTab: (t: BetsTab) => void;
  bets: any[]; status: any; multiplier: number;
  userId: string; history: any[];
}) {
  return (
    <div style={{
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(11,16,32,0.85)',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(['All Bets', 'Previous', 'Top'] as BetsTab[]).map((tab) => (
          <button key={tab} onClick={() => setBetsTab(tab)} style={{
            flex: 1, padding: '11px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: betsTab === tab ? 700 : 400,
            color: betsTab === tab ? '#fff' : 'rgba(255,255,255,0.28)',
            letterSpacing: '0.04em',
            position: 'relative',
            transition: 'color 0.15s',
          }}>
            {tab}
            {betsTab === tab && (
              <span style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 24, height: 2,
                background: '#72FF3B', borderRadius: 2,
                boxShadow: '0 0 6px rgba(114,255,59,0.6)',
              }} />
            )}
          </button>
        ))}
      </div>

      {betsTab === 'All Bets' && (
        <ActiveBets bets={bets} status={status} multiplier={multiplier} currentUserId={userId} />
      )}

      {betsTab === 'Previous' && (
        <div style={{ overflowY: 'auto', maxHeight: 260 }}>
          {history.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>☣</div>
              No round history yet
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Round', 'Crash'].map((h, i) => (
                    <th key={h} style={{
                      position: 'sticky', top: 0,
                      background: 'rgba(11,16,32,0.98)',
                      padding: '8px 16px',
                      textAlign: i === 1 ? 'right' : 'left',
                      fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.2)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h: any, i: number) => {
                  const c = h.crashPoint >= 10 ? '#00E5FF' : h.crashPoint >= 5 ? '#FFD700' : h.crashPoint >= 2 ? '#72FF3B' : '#FF4655';
                  return (
                    <tr key={h._id ?? i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '9px 16px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>#{h.roundNumber}</td>
                      <td style={{ padding: '9px 16px', textAlign: 'right' }}>
                        <span style={{ color: c, fontWeight: 900, fontFamily: 'monospace' }}>{h.crashPoint.toFixed(2)}x</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {betsTab === 'Top' && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>☣</div>
          Top survivors shown after round ends.
        </div>
      )}

      <div style={{
        padding: '7px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
          <span style={{ color: '#72FF3B' }}>☣</span> Provably Fair
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.13)', fontWeight: 700, letterSpacing: '0.18em' }}>DASHBETS</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CrashGame() {
  const { user } = useAuthContext();
  const [token,   setToken]   = useState('');
  const [balance, setBalance] = useState(0);
  const isDesktop = useIsDesktop(1024); // null = unmeasured

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setToken(localStorage.getItem('dashbets_token') ?? '');
  }, []);

const balanceInitialized = useRef(false);
useEffect(() => {
  if (!balanceInitialized.current && user?.balance !== undefined) {
    setBalance(user.balance);
    balanceInitialized.current = true;
  }
}, [user?.balance]);

  const [balFlash, setBalFlash] = useState(false);
  const prevBalRef = useRef(balance);
  useEffect(() => {
    if (balance !== prevBalRef.current) {
      setBalFlash(true);
      prevBalRef.current = balance;
      const t = setTimeout(() => setBalFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [balance]);

  const [toast, setToast] = useState<{ mult: number; payout: number } | null>(null);

  const onBalanceUpdate = useCallback((newBal: number, mult?: number, payout?: number) => {
    setBalance(newBal);
    if (mult && payout) {
      setToast({ mult, payout });
      setTimeout(() => setToast(null), 5000);
    }
  }, []);

  const userId      = (user as any)?._id ?? user?.id ?? (user as any)?.sub ?? '';
  const shouldConnect = token !== '' && userId !== '';
  const { state, placeBet, cashOut } = useCrashGame({
    token: shouldConnect ? token : '',
    userId,
    onBalanceUpdate,
  });

  const {
    status, multiplier, crashPoint,
    bets, myBets, history, curve,
    countdown, roundNumber, error, isConnected,
  } = state;

  const [showPanel2, setShowPanel2] = useState(false);
  const [betsTab,    setBetsTab]    = useState<BetsTab>('All Bets');

  // ── Panels ────────────────────────────────────────────────────────────────
  const Panels = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <BetPanel
        index={0} myBet={myBets[0]} status={status}
        multiplier={multiplier} balance={balance}
        onPlaceBet={placeBet} onCashOut={cashOut} error={error}
      />
      {!showPanel2 ? (
        <button
          onClick={() => setShowPanel2(true)}
          style={{
            width: '100%', padding: '11px 0',
            borderRadius: 12,
            background: 'transparent',
            border: '1px dashed rgba(114,255,59,0.14)',
            color: 'rgba(114,255,59,0.35)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(114,255,59,0.35)'; el.style.color = 'rgba(114,255,59,0.65)'; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(114,255,59,0.14)'; el.style.color = 'rgba(114,255,59,0.35)'; }}
        >
          + Add second bet
        </button>
      ) : (
        <BetPanel
          index={1} myBet={myBets[1]} status={status}
          multiplier={multiplier} balance={balance}
          onPlaceBet={placeBet} onCashOut={cashOut}
          onRemove={() => setShowPanel2(false)} error={null}
        />
      )}
    </div>
  );

  // ── Header (shared) ───────────────────────────────────────────────────────
  const Header = (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      height: 52,
      background: 'rgba(5,7,13,0.97)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(114,255,59,0.08)',
    }}>
      <ZombieLogo />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {roundNumber && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
            RD #{roundNumber}
          </span>
        )}
        <StatusBadge status={status} isConnected={isConnected} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4,
          animation: balFlash ? 'zg-bal-pop 0.5s ease' : 'none',
        }}>
          <span style={{
            fontSize: 15, fontWeight: 900, fontFamily: 'monospace',
            color: '#72FF3B',
            textShadow: balFlash ? '0 0 16px rgba(114,255,59,0.8)' : 'none',
            transition: 'text-shadow 0.3s',
          }}>{balance.toFixed(2)}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>ETB</span>
        </div>
        <button style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          fontSize: 16, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>≡</button>
      </div>
    </header>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; background: #05070D; }
        @keyframes zg-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes zg-toast-in { from{opacity:0;transform:translateX(-50%) translateY(-8px) scale(.95)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes zg-bal-pop  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(114,255,59,0.14); border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(114,255,59,0.28); }
      `}</style>

      {Header}

      {/* ── DESKTOP ────────────────────────────────────────────────────────── */}
      {isDesktop === true && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 390px',
          height: 'calc(100vh - 52px)',
          marginTop: 52,
          overflow: 'hidden',
        }}>
          {/* LEFT: history + chart + bets table — scrollable */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid rgba(114,255,59,0.07)',
          }}>
            {/* History strip — fixed height */}
            <CrashHistory history={history} />

            {/* Chart — flex grows to fill space */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <CrashChart
                status={status} multiplier={multiplier}
                crashPoint={crashPoint} curve={curve} countdown={countdown}
              />
              {/* Player count badge */}
              <div style={{
                position: 'absolute', bottom: 14, right: 14,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20,
                background: 'rgba(5,7,13,0.82)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(114,255,59,0.10)',
                fontSize: 11, color: 'rgba(255,255,255,0.45)',
                fontFamily: 'monospace',
              }}>
                <span style={{ color: '#72FF3B', animation: 'zg-pulse 1.5s infinite', display: 'inline-block' }}>☣</span>
                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{bets.length + 97}</span>
                <span>infected</span>
              </div>
              {toast && <WinToast toast={toast} onClose={() => setToast(null)} />}
            </div>

            {/* Bets table — fixed height, scrolls internally */}
            <div style={{
              height: 300, flexShrink: 0,
              borderTop: '1px solid rgba(114,255,59,0.06)',
              overflow: 'hidden',
              padding: '12px',
            }}>
              <BetsSection
                betsTab={betsTab} setBetsTab={setBetsTab}
                bets={bets} status={status} multiplier={multiplier}
                userId={userId} history={history}
              />
            </div>
          </div>

          {/* RIGHT: sticky bet panels column */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: 'rgba(8,11,22,0.55)',
            overflow: 'hidden',
          }}>
            {/* Scrollable panel area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 14px 0',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {!shouldConnect ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(114,255,59,0.3)', fontSize: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 10, animation: 'zg-pulse 1.5s infinite' }}>☣</div>
                  Syncing with outbreak server…
                </div>
              ) : Panels}
            </div>
            {/* Bottom padding spacer */}
            <div style={{ height: 14, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* ── MOBILE ─────────────────────────────────────────────────────────── */}
      {isDesktop === false && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 52px)',
          marginTop: 52,
          overflow: 'hidden',
          background: '#05070D',
        }}>
          {/* TOP: history + chart — takes all remaining space above panel */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* History */}
            <CrashHistory history={history} />

            {/* Chart — flex fill */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <CrashChart
                status={status} multiplier={multiplier}
                crashPoint={crashPoint} curve={curve} countdown={countdown}
              />
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 9px', borderRadius: 20,
                background: 'rgba(5,7,13,0.8)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace',
              }}>
                <span style={{ color: '#72FF3B', fontSize: 10 }}>☣</span>
                {bets.length + 97}
              </div>
              {toast && <WinToast toast={toast} onClose={() => setToast(null)} />}
            </div>
          </div>

          {/* BOTTOM: fixed-height scrollable panel drawer */}
          <div style={{
            flexShrink: 0,
            background: 'rgba(8,11,22,0.98)',
            borderTop: '1px solid rgba(114,255,59,0.12)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            /* Allow the panel itself to scroll if it grows (e.g. 2 panels) */
            maxHeight: '58vh',
            overflowY: 'auto',
            padding: '12px 12px 16px',
          }}>
            {!shouldConnect ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(114,255,59,0.3)', fontSize: 12 }}>
                <div style={{ fontSize: 22, marginBottom: 8, animation: 'zg-pulse 1.5s infinite' }}>☣</div>
                Syncing…
              </div>
            ) : Panels}
          </div>
        </div>
      )}
    </>
  );
}