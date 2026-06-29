// components/multihot/GambleModal.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { GambleState } from '@/lib/api/slotApi';

type CardState = 'idle' | 'flipping' | 'revealed';

interface Props {
  gambleState: GambleState;
  onGuess:     (g: 'red'|'black') => Promise<{card:string;won:boolean;forceCollect:boolean}|null>;
  onCollect:   () => Promise<void>;
  onDismiss:   () => void;
  maxAttempts: number;
}

export default function GambleModal({ gambleState, onGuess, onCollect, onDismiss, maxAttempts }: Props) {
  const [loading,   setLoading]   = useState(false);
  const [cardState, setCardState] = useState<CardState>('idle');
  const [card,      setCard]      = useState<'red'|'black'|null>(null);
  const [won,       setWon]       = useState<boolean|null>(null);
  const [err,       setErr]       = useState<string|null>(null);

  const isActive     = gambleState.status === 'active';
  const forceCollect = gambleState.attempts >= maxAttempts;
  const doubled      = gambleState.currentWin * 2;
  const isRed        = card === 'red';

  const handleGuess = useCallback(async (guess: 'red'|'black') => {
    if (loading || !isActive || forceCollect) return;
    setLoading(true); setErr(null); setCardState('flipping');
    try {
      const r = await onGuess(guess);
      if (!r) throw new Error('Request failed');
      setCard(r.card as 'red'|'black');
      setWon(r.won);
      setCardState('revealed');
    } catch(e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setCardState('idle');
    } finally { setLoading(false); }
  }, [loading, isActive, forceCollect, onGuess]);

  const handleCollect = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try { await onCollect(); }
    catch(e) { setErr(e instanceof Error ? e.message : 'Collect failed'); }
    finally { setLoading(false); }
  }, [loading, onCollect]);

  const resetForNext = () => { setCardState('idle'); setCard(null); setWon(null); };

  return (
    <>
      <style>{`
        @keyframes gm-backdrop { from{opacity:0} to{opacity:1} }
        @keyframes gm-modal-in { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes gm-flip {
          0%   { transform:perspective(500px) rotateY(0deg); }
          45%  { transform:perspective(500px) rotateY(90deg); }
          55%  { transform:perspective(500px) rotateY(90deg); }
          100% { transform:perspective(500px) rotateY(0deg); }
        }
        @keyframes gm-reveal {
          from { transform:perspective(500px) rotateY(90deg); opacity:0; }
          to   { transform:perspective(500px) rotateY(0deg);  opacity:1; }
        }
        @keyframes gm-result { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>

      {/* Backdrop — full screen, centred */}
      <div style={{
        position:'fixed', inset:0, zIndex:60,
        background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'16px',
        animation:'gm-backdrop 0.25s ease both',
      }}>
        {/* Modal card */}
        <div style={{
          width:'100%', maxWidth:420,
          background:'linear-gradient(160deg,#141820 0%,#0c0f16 100%)',
          borderRadius:20,
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 32px 80px rgba(0,0,0,0.9)',
          overflow:'hidden',
          animation:'gm-modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {/* Red accent top */}
          <div style={{ height:3, background:'linear-gradient(90deg,transparent,#7f1d1d 10%,#ef4444 35%,#ff6b6b 50%,#ef4444 65%,#7f1d1d 90%,transparent)' }} />

          <div style={{ padding:'20px 20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:'1.1rem', fontWeight:900, color:'#fff', letterSpacing:'0.1em' }}>DOUBLE UP</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'Exo 2',sans-serif", marginTop:2 }}>
                  Round {gambleState.attempts+1} of {maxAttempts}
                </div>
              </div>
              <button onClick={onDismiss} disabled={loading} style={{
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                color:'rgba(255,255,255,0.35)', width:28, height:28, borderRadius:7,
                cursor:'pointer', fontSize:14,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
            </div>

            {/* Current win */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:12, padding:'12px 16px',
            }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'Exo 2',sans-serif", letterSpacing:'0.1em' }}>CURRENT WIN</span>
              <span style={{ fontSize:'1.6rem', fontWeight:900, color:'#ffd700', fontFamily:"'Exo 2',sans-serif" }}>
                ETB {gambleState.currentWin.toLocaleString()}
              </span>
            </div>

            {/* Card */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <div style={{
                width:100, height:136, borderRadius:14,
                border: cardState==='revealed'
                  ? `2px solid ${isRed?'#ef4444':'#3b82f6'}`
                  : '1px solid rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: cardState==='revealed' ? '3.5rem' : '2rem',
                background: cardState==='revealed'
                  ? (isRed?'linear-gradient(135deg,#1a0505,#2d0808)':'linear-gradient(135deg,#050d1a,#0a1628)')
                  : 'rgba(255,255,255,0.03)',
                color: cardState==='revealed' ? (isRed?'#ef4444':'#3b82f6') : 'rgba(255,255,255,0.1)',
                boxShadow: cardState==='revealed'
                  ? `0 0 40px ${isRed?'rgba(239,68,68,0.4)':'rgba(59,130,246,0.4)'}`
                  : 'none',
                animation: cardState==='flipping' ? 'gm-flip 0.6s ease-in-out forwards'
                          : cardState==='revealed' ? 'gm-reveal 0.3s ease-out forwards'
                          : 'none',
                transition:'background 0.3s, border 0.3s, box-shadow 0.3s',
              }}>
                {cardState==='revealed' ? (isRed?'♥':'♠') : cardState==='flipping' ? '🂠' : '?'}
              </div>
            </div>

            {/* Result badge */}
            {cardState==='revealed' && won!==null && (
              <div style={{
                textAlign:'center', padding:'10px 14px', borderRadius:10,
                background: won?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)',
                border:`1px solid ${won?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)'}`,
                color: won?'#22c55e':'#ef4444',
                fontSize:13, fontWeight:700, fontFamily:"'Exo 2',sans-serif",
                animation:'gm-result 0.3s ease-out',
              }}>
                {won ? '🎉 Correct — Win Doubled!' : '💀 Wrong — Win Lost!'}
              </div>
            )}

            {err && <div style={{ color:'#ef4444', fontSize:11, textAlign:'center', fontFamily:"'Exo 2',sans-serif" }}>{err}</div>}

            {/* Guess buttons */}
            {isActive && !forceCollect && cardState==='idle' && (
              <>
                <div style={{ display:'flex', gap:10 }}>
                  {(['red','black'] as const).map(g => (
                    <button key={g} onClick={() => handleGuess(g)} disabled={loading} style={{
                      flex:1, height:54, borderRadius:12,
                      cursor: loading?'not-allowed':'pointer', opacity: loading?0.5:1,
                      fontWeight:900, fontSize:'1rem', fontFamily:"'Exo 2',sans-serif",
                      background: g==='red'
                        ? 'linear-gradient(135deg,#dc2626,#7f1d1d)'
                        : 'linear-gradient(135deg,#1e3a5f,#0f172a)',
                      color:'#fff', border:'none',
                      boxShadow: g==='red'
                        ? '0 4px 20px rgba(220,38,38,0.4)'
                        : '0 4px 20px rgba(0,0,0,0.5)',
                      letterSpacing:'0.08em',
                    }}>{g==='red'?'♥ RED':'♠ BLACK'}</button>
                  ))}
                </div>
                <div style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:"'Exo 2',sans-serif" }}>
                  Correct → ETB {doubled.toLocaleString()}
                </div>
                <button onClick={handleCollect} disabled={loading} style={{
                  width:'100%', height:42, borderRadius:10,
                  background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.18)',
                  color: loading?'rgba(34,197,94,0.3)':'#22c55e',
                  fontSize:12, fontWeight:700, cursor: loading?'not-allowed':'pointer',
                  fontFamily:"'Exo 2',sans-serif",
                }}>{loading?'Processing…':`Collect ETB ${gambleState.currentWin.toLocaleString()} (Skip)`}</button>
              </>
            )}

            {/* After correct */}
            {cardState==='revealed' && isActive && won && (
              <div style={{ display:'flex', gap:8 }}>
                {!forceCollect && (
                  <button onClick={resetForNext} style={{
                    flex:1, height:50, borderRadius:12, border:'none',
                    background:'linear-gradient(135deg,#f59e0b,#b45309)',
                    color:'#000', fontWeight:900, fontSize:'0.95rem',
                    cursor:'pointer', fontFamily:"'Exo 2',sans-serif", letterSpacing:'0.05em',
                  }}>Double Again</button>
                )}
                <button onClick={handleCollect} disabled={loading} style={{
                  flex:1, height:50, borderRadius:12, border:'none',
                  background:'linear-gradient(135deg,#22c55e,#15803d)',
                  color:'#fff', fontWeight:900, fontSize:'0.95rem',
                  cursor: loading?'not-allowed':'pointer', opacity: loading?0.6:1,
                  fontFamily:"'Exo 2',sans-serif",
                }}>Collect</button>
              </div>
            )}

            {/* Force collect */}
            {isActive && forceCollect && cardState==='idle' && (
              <>
                <div style={{ color:'#f59e0b', fontSize:12, textAlign:'center', fontFamily:"'Exo 2',sans-serif",
                  padding:'6px 10px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:8 }}>
                  Max rounds reached — collect your winnings!
                </div>
                <button onClick={handleCollect} disabled={loading} style={{
                  width:'100%', height:52, borderRadius:12, border:'none',
                  background:'linear-gradient(135deg,#22c55e,#15803d)',
                  color:'#fff', fontWeight:900, fontSize:'1rem',
                  cursor: loading?'not-allowed':'pointer', opacity: loading?0.6:1,
                  fontFamily:"'Exo 2',sans-serif",
                }}>Collect ETB {gambleState.currentWin.toLocaleString()}</button>
              </>
            )}

            {/* Lost */}
            {gambleState.status==='lost' && (
              <button onClick={onDismiss} style={{
                width:'100%', height:46, borderRadius:11,
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                color:'rgba(255,255,255,0.35)', fontWeight:700, cursor:'pointer',
                fontFamily:"'Exo 2',sans-serif", fontSize:13,
              }}>Close</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}