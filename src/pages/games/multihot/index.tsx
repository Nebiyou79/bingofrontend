// pages/games/slots/index.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useAuthContext } from '@/context/AuthContext';
import SlotMachine   from '@/components/multihot/SlotMachine';
import SlotBetPanel  from '@/components/multihot/SlotBetPanel';
import StatBar       from '@/components/multihot/StatBar';
import GambleModal   from '@/components/multihot/GambleModal';
import PaytableModal from '@/components/multihot/PaytableModal';
import AutoplayModal from '@/components/multihot/AutoplayModal';
import LoadingScreen from '@/components/multihot/LoadingScreen';
import { useSlotGame } from '@/hooks/useSlotGame';
import { useAutoplay } from '@/hooks/useAutoplay';
import { AppLayout }   from '@/components/layout/AppLayout';

const MAX_GAMBLE = 5;

export default function SlotsPage() {
  const { user } = useAuthContext();
  const balance  = user?.balance ?? 0;

  const {
    spin, gamble, collectWin, dismissGamble,
    isSpinning, isAnimating, lastSpin, gambleState, error, lastWin,
  } = useSlotGame();

  const [loaded,       setLoaded]       = useState(false);
  const [allSettled,   setAllSettled]   = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showAutoplay, setShowAutoplay] = useState(false);
  const [showGamble,   setShowGamble]   = useState(false);
  const [bet,          setBet]          = useState(10);
  const [turbo,        setTurbo]        = useState(false);

  const gambleStateRef = useRef(gambleState);
  gambleStateRef.current = gambleState;

  // Auto-collect guard
  const guardedSpin = useCallback(async (betAmount: number) => {
    if (gambleStateRef.current?.status === 'active') {
      try { await collectWin(); } catch { /* best-effort */ }
    }
    setAllSettled(false);
    setShowGamble(false);
    return spin(betAmount);
  }, [spin, collectWin]);

  const { isRunning: isAutoRunning, spinsLeft, stopAutoplay, startAutoplay } = useAutoplay({
    onSpinRequest: guardedSpin,
    isAnimating,
    isTurbo: turbo,
    lastWin,
    balance,
  });

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    guardedSpin(bet);
  }, [isSpinning, bet, guardedSpin]);

  const handleAllSettled = useCallback(() => { setAllSettled(true); }, []);

  const canGamble = allSettled && !!gambleState && gambleState.status === 'active' && !isAutoRunning;

  const seedHash = lastSpin?.serverSeedHash
    ? lastSpin.serverSeedHash.slice(0, 14) + '…'
    : null;

  return (
    <>
      <Head><title>Multi Hot 5 · DashBets</title></Head>

      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      <AppLayout>
        <div style={{
          minHeight:'100%',
          position:'relative',
          overflow:'hidden',
          opacity: loaded ? 1 : 0,
          transition:'opacity 0.3s ease 0.1s',
        }}>
          {/* ── Background layers ── */}
          <div style={{ position:'absolute', inset:0, zIndex:0, background:'#060810' }} />
          {/* Grid texture */}
          <div style={{
            position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
            backgroundImage:'linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)',
            backgroundSize:'38px 38px',
          }}/>
          {/* Colour radials */}
          <div style={{
            position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
            background:`
              radial-gradient(ellipse 80% 45% at 50% -5%,rgba(100,30,200,0.2) 0%,transparent 70%),
              radial-gradient(ellipse 40% 30% at 5%  65%,rgba(239,68,68,0.07)  0%,transparent 65%),
              radial-gradient(ellipse 40% 30% at 95% 65%,rgba(245,158,11,0.06) 0%,transparent 65%),
              radial-gradient(ellipse 70% 50% at 50% 110%,rgba(20,8,60,0.55)   0%,transparent 70%)
            `,
          }}/>
          {/* Ambient orbs */}
          <div style={{ position:'absolute',top:'12%',left:'6%',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%)',zIndex:1,pointerEvents:'none' }}/>
          <div style={{ position:'absolute',top:'45%',right:'4%',width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 70%)',zIndex:1,pointerEvents:'none' }}/>
          <div style={{ position:'absolute',bottom:'25%',left:'3%',width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)',zIndex:1,pointerEvents:'none' }}/>

          {/* ── Scrollable content ── */}
          <div style={{ position:'relative', zIndex:2, paddingBottom:28 }}>

            {/* Header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'11px 14px 0', maxWidth:480, margin:'0 auto',
              boxSizing:'border-box',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <a href="/dashboard" style={{
                  display:'flex', alignItems:'center', justifyContent:'center',
                  width:30, height:30, borderRadius:8,
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                  color:'rgba(255,255,255,0.4)', fontSize:16, textDecoration:'none', flexShrink:0,
                }}>‹</a>
                <div>
                  <div style={{ fontSize:'0.8rem', fontWeight:900, color:'#fff', fontFamily:"'Exo 2',sans-serif", letterSpacing:'0.06em' }}>MULTI HOT 5</div>
                  <div style={{ fontSize:8, color:'rgba(255,255,255,0.2)', fontFamily:"'Exo 2',sans-serif" }}>3×3 · 5 Lines · RTP 96%</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:4, alignItems:'center', flexShrink:0 }}>
                {isAutoRunning && (
                  <div style={{ padding:'2px 7px', borderRadius:4, fontSize:8, fontWeight:700, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.22)', color:'#ef4444', fontFamily:"'Exo 2',sans-serif" }}>
                    AUTO {spinsLeft > 0 ? spinsLeft : '∞'}
                  </div>
                )}
                {turbo && (
                  <div style={{ padding:'2px 7px', borderRadius:4, fontSize:8, fontWeight:700, background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.22)', color:'#ffd700', fontFamily:"'Exo 2',sans-serif" }}>TURBO</div>
                )}
                <div style={{ padding:'2px 7px', borderRadius:4, fontSize:8, fontWeight:700, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.18)', color:'#22c55e', fontFamily:"'Exo 2',sans-serif" }}>LIVE</div>
              </div>
            </div>

            {/* Main column */}
            <div style={{
              maxWidth:480, margin:'0 auto',
              padding:'10px 14px 0',
              display:'flex', flexDirection:'column', gap:8,
              boxSizing:'border-box',
            }}>

              <StatBar balance={balance} lastWin={lastWin} />

              <SlotMachine
                isAnimating={isAnimating}
                lastSpin={lastSpin}
                onAllSettled={handleAllSettled}
              />

              {/* Double Up — shown only after manual win, not during autoplay */}
              {canGamble && (
                <button onClick={() => setShowGamble(true)} style={{
                  width:'100%', height:44, borderRadius:12,
                  background:'linear-gradient(135deg,#92400e,#f59e0b 50%,#fbbf24)',
                  border:'none', color:'#000',
                  fontFamily:"'Exo 2',sans-serif", fontSize:'0.85rem',
                  fontWeight:900, letterSpacing:'0.08em',
                  cursor:'pointer',
                  boxShadow:'0 4px 18px rgba(245,158,11,0.38)',
                  animation:'dbup 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                  boxSizing:'border-box',
                }}>
                  🃏 DOUBLE UP · ETB {gambleState!.currentWin.toLocaleString()}
                </button>
              )}

              {/* Bet panel — error is rendered INSIDE the panel above the dock */}
              <SlotBetPanel
                bet={bet}
                onBetChange={setBet}
                onSpin={handleSpin}
                onOpenAutoplay={() => setShowAutoplay(true)}
                onOpenPaytable={() => setShowPaytable(true)}
                isSpinning={isSpinning}
                isAutoRunning={isAutoRunning}
                onStopAuto={() => stopAutoplay('User stopped')}
                turbo={turbo}
                onTurboChange={setTurbo}
                error={error}
              />

              {/* Provably fair */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                padding:'6px 12px', borderRadius:9,
                background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)',
              }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="rgba(124,58,237,0.5)" strokeWidth={2} fill="rgba(124,58,237,0.07)"/>
                </svg>
                <span style={{ fontSize:8, color:'rgba(255,255,255,0.15)', fontFamily:"'Exo 2',sans-serif" }}>Provably Fair</span>
                {seedHash && <>
                  <span style={{ fontSize:8, color:'rgba(255,255,255,0.07)' }}>·</span>
                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.1)', fontFamily:'monospace' }}>{seedHash}</span>
                </>}
              </div>

            </div>
          </div>
        </div>
      </AppLayout>

      {/* Gamble modal — centred overlay */}
      {showGamble && gambleState && (
        <GambleModal
          gambleState={gambleState}
          onGuess={gamble}
          onCollect={collectWin}
          onDismiss={() => { setShowGamble(false); dismissGamble(); }}
          maxAttempts={MAX_GAMBLE}
        />
      )}

      {showPaytable && <PaytableModal onClose={() => setShowPaytable(false)} />}

      {showAutoplay && (
        <AutoplayModal
          onStart={cfg => startAutoplay(cfg, bet)}
          onClose={() => setShowAutoplay(false)}
        />
      )}

      <style>{`
        @keyframes dbup {
          from { transform:scale(0.92) translateY(4px); opacity:0; }
          to   { transform:scale(1)    translateY(0);   opacity:1; }
        }
      `}</style>
    </>
  );
}