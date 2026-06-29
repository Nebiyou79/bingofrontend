// components/multihot/SlotMachine.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReelColumn from './ReelColumn';
import MultiplierReel from './MultiplierReel';
import PaylineHighlighter from './PaylineHighlighter';
import WinTierPopup, { getTier, WinTier } from './WinTierPopup';
import { SpinResult } from '@/lib/api/slotApi';

// ── Layout ────────────────────────────────────────────────────────────────────
// Target viewport: 360px wide, 14px padding each side → 332px content
// PL_W×2 = 32px, MULT_W = 40px, gaps = ~12px → reels area = 248px
// 248 / 3 reels = ~82px each. Scale from ORIG=96 → SCALE=82/96≈0.854
export const SYM   = 82;
const ORIG         = 96;
const SCALE        = SYM / ORIG;    // 0.854
const REEL_GAP     = 2;
const MULT_W       = 40;
const PL_W         = 16;
const REEL_H       = SYM * 3;      // 246px

const LINE_COLORS  = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

// Row of each payline on the LEFT side (entering col 0) and RIGHT side (exiting col 2)
//                        L  mid  R
const PAYLINE_SIDE_ROW: [number, number][] = [
  [0, 0],  // line 1: top row straight
  [1, 1],  // line 2: middle row straight
  [2, 2],  // line 3: bottom row straight
  [0, 2],  // line 4: diagonal ↘ (top-left → bottom-right)
  [2, 0],  // line 5: diagonal ↙ (bottom-left → top-right)
];

const PAYLINES_FLAT = [
  [0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6],
];

const IDLE_REELS: string[][] = [
  ['bell',  'wild',  'seven' ],
  ['cherry','seven', 'bell'  ],
  ['lemon', 'cherry','dollar'],
];
const IDLE_MULT = { values:[5,4,3,2,1] as number[], activeRow:2 };

interface Props {
  isAnimating:   boolean;
  lastSpin:      SpinResult | null;
  onAllSettled?: () => void;
}

export default function SlotMachine({ isAnimating, lastSpin, onAllSettled }: Props) {
  const [settledCount, setSettledCount] = useState(0);
  const [displaySpin,  setDisplaySpin]  = useState<SpinResult | null>(null);
  const [symbolsKey,   setSymbolsKey]   = useState(0);
  const [winTier,      setWinTier]      = useState<WinTier | null>(null);
  const [showSmallWin, setShowSmallWin] = useState(false);
  const [multSettled,  setMultSettled]  = useState(true);

  const onAllSettledRef = useRef(onAllSettled);
  useEffect(() => { onAllSettledRef.current = onAllSettled; }, [onAllSettled]);

  const spinGenRef       = useRef(0);
  const prevAnimatingRef = useRef(isAnimating);
  const multTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (isAnimating && !prevAnimatingRef.current) spinGenRef.current += 1;
  prevAnimatingRef.current = isAnimating;

  useEffect(() => {
    if (lastSpin) { setDisplaySpin(lastSpin); setSymbolsKey(spinGenRef.current); }
    else          { setDisplaySpin(null);     setSymbolsKey(0); }
  }, [lastSpin]);

  useEffect(() => {
    if (isAnimating) {
      setSettledCount(0);
      setMultSettled(false);
      setWinTier(null);
      setShowSmallWin(false);
      if (multTimerRef.current) clearTimeout(multTimerRef.current);
      multTimerRef.current = setTimeout(() => setMultSettled(true), 650);
    }
    return () => { if (multTimerRef.current) clearTimeout(multTimerRef.current); };
  }, [isAnimating]);

  useEffect(() => {
    if (!isAnimating && settledCount === 3) {
      const id = setTimeout(() => onAllSettledRef.current?.(), 0);
      return () => clearTimeout(id);
    }
  }, [isAnimating, settledCount]);

  useEffect(() => {
    if (!isAnimating && settledCount === 3 && displaySpin?.isWin) {
      const tier = getTier(displaySpin.totalPayout);
      const id = setTimeout(() => {
        if (tier) setWinTier(tier);
        else { setShowSmallWin(true); setTimeout(() => setShowSmallWin(false), 2800); }
      }, 150);
      return () => clearTimeout(id);
    }
  }, [isAnimating, settledCount, displaySpin]);

  const handleColSettled = useCallback((gen: number) => {
    if (gen !== spinGenRef.current) return;
    setSettledCount(prev => prev + 1);
  }, []);

  const allSettled     = settledCount === 3;
  const reels          = displaySpin?.reels ?? IDLE_REELS;
  const multValues     = displaySpin?.multiplierReel ?? IDLE_MULT.values;
  const activeRow      = displaySpin?.activeRow ?? IDLE_MULT.activeRow;
  const colSymbols     = [0,1,2].map(col => [0,1,2].map(row => reels[row]?.[col] ?? 'cherry'));
  const paylineResults = displaySpin?.paylineResults ?? [];
  const winningLines   = allSettled && displaySpin ? paylineResults.map(p => p.paylineIndex) : [];

  const winRowsByCol: number[][] = [[],[],[]];
  if (allSettled && displaySpin) {
    paylineResults.forEach(pr => {
      PAYLINES_FLAT[pr.paylineIndex]?.forEach(flatIdx => {
        const row = Math.floor(flatIdx/3), col = flatIdx%3;
        if (!winRowsByCol[col].includes(row)) winRowsByCol[col].push(row);
      });
    });
  }

  const isWin = allSettled && !!displaySpin?.isWin;

  return (
    <>
      <style>{`
        @keyframes sm-banner { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sm-pop    { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes sm-glow   {
          0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 8px 32px rgba(0,0,0,0.6)}
          50%    {box-shadow:0 0 0 1px rgba(212,175,55,0.5),0 8px 32px rgba(0,0,0,0.6),0 0 40px rgba(212,175,55,0.12)}
        }
      `}</style>

      {winTier && displaySpin && (
        <WinTierPopup amount={displaySpin.totalPayout} tier={winTier} onDone={() => setWinTier(null)} />
      )}

      <div style={{ display:'flex', flexDirection:'column', userSelect:'none', width:'100%' }}>

        {/* ── Chassis ── */}
        <div style={{
          width:'100%',
          background:'linear-gradient(180deg,#12151e 0%,#090c13 60%,#060810 100%)',
          borderRadius:14,
          border:`1px solid ${isWin?'rgba(212,175,55,0.45)':'rgba(255,255,255,0.06)'}`,
          animation: isWin ? 'sm-glow 1.4s ease-in-out infinite' : undefined,
          overflow:'hidden',
          transition:'border-color 0.4s',
          boxSizing:'border-box',
        }}>

          {/* Gold accent */}
          <div style={{ height:2, background:'linear-gradient(90deg,transparent,#5a3d00 10%,#c8910a 30%,#ffd700 42%,#ffe566 50%,#ffd700 58%,#c8910a 70%,#5a3d00 90%,transparent)' }} />

          {/* Title row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px 3px' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontSize:'1.1rem', fontWeight:900, fontFamily:"'Exo 2',sans-serif", background:'linear-gradient(180deg,#ffe566 0%,#c8910a 60%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'0.1em' }}>MULTI HOT</span>
              <span style={{ fontSize:'1.1rem', fontWeight:900, fontFamily:"'Exo 2',sans-serif", color:'#ef4444', WebkitTextFillColor:'#ef4444', textShadow:'0 0 12px rgba(239,68,68,0.6)' }}>5</span>
            </div>
            <span style={{ fontSize:7, color:'rgba(255,255,255,0.15)', fontFamily:"'Exo 2',sans-serif", letterSpacing:'0.2em' }}>5 LINES FIXED</span>
          </div>

          {/* ── Reel row: [PL | reels | PL | mult] all inside padding ── */}
          <div style={{
            padding:'2px 8px 8px',
            display:'flex',
            alignItems:'stretch',
            gap:4,
            boxSizing:'border-box',
            width:'100%',
            overflow:'hidden',   // critical — clip any overflow
          }}>

            {/* Left payline column */}
            <PaylineSide winningLines={winningLines} side="left" reelH={REEL_H} />

            {/* Reels viewport — flex:1 takes remaining space */}
            <div style={{
              flex:1,
              minWidth:0,         // allow flex shrink
              height:REEL_H,
              borderRadius:9,
              background:'#04030a',
              border:'1px solid rgba(255,255,255,0.05)',
              boxShadow:'inset 0 0 30px rgba(0,0,0,0.98)',
              position:'relative', overflow:'hidden',
              display:'flex', gap:REEL_GAP, padding:'1px',
            }}>
              {/* Edge vignettes */}
              <div style={{ position:'absolute',inset:'0 auto 0 0',width:10,zIndex:15,background:'linear-gradient(to right,#04030a,transparent)',pointerEvents:'none' }} />
              <div style={{ position:'absolute',inset:'0 0 0 auto',width:10,zIndex:15,background:'linear-gradient(to left,#04030a,transparent)',pointerEvents:'none' }} />

              {[0,1,2].map(col => (
                <ScaledReel
                  key={col} col={col}
                  spinGen={spinGenRef.current} symbolsKey={symbolsKey}
                  symbols={colSymbols[col]} isAnimating={isAnimating}
                  isSettled={!isAnimating && settledCount > col}
                  onSettled={handleColSettled} winRows={winRowsByCol[col]}
                />
              ))}

              <PaylineHighlighter winningPaylines={winningLines} isSpinning={isAnimating} />

              {/* Small-win flash */}
              {showSmallWin && displaySpin?.isWin && (
                <div style={{
                  position:'absolute', inset:0, zIndex:30,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  background:'rgba(0,0,0,0.82)', backdropFilter:'blur(4px)', borderRadius:8,
                  animation:'sm-pop 0.3s ease-out both',
                }}>
                  <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#ffd700', fontFamily:"'Exo 2',sans-serif" }}>WIN!</div>
                  <div style={{ fontSize:'1.35rem', fontWeight:900, color:'#ffd700', fontFamily:"'Exo 2',sans-serif" }}>
                    ETB {displaySpin.totalPayout.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Right payline column */}
            <PaylineSide winningLines={winningLines} side="right" reelH={REEL_H} />

            {/* Multiplier column — fixed width, never grows */}
            <div style={{ width:MULT_W, flexShrink:0, height:REEL_H }}>
              <MultiplierReel
                values={multValues}
                activeRow={activeRow}
                isSpinning={!multSettled}
              />
            </div>

          </div>

          {/* Gold bottom accent */}
          <div style={{ height:2, opacity:0.35, background:'linear-gradient(90deg,transparent,#5a3d00 10%,#c8910a 30%,#ffd700 42%,#ffe566 50%,#ffd700 58%,#c8910a 70%,#5a3d00 90%,transparent)' }} />
        </div>

        {/* ── Small-win banner ── */}
        {isWin && displaySpin && !getTier(displaySpin.totalPayout) && (
          <div style={{
            width:'100%', marginTop:8, padding:'8px 14px', borderRadius:12,
            background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.2)',
            textAlign:'center', animation:'sm-banner 0.4s ease both',
            boxSizing:'border-box',
          }}>
            <div style={{ fontSize:'1.05rem', fontWeight:900, color:'#ffd700', fontFamily:"'Exo 2',sans-serif", marginBottom:3 }}>
              🎉 +ETB {displaySpin.totalPayout.toLocaleString()}
            </div>
            {paylineResults.map((p,i) => (
              <div key={i} style={{ fontSize:10, color:LINE_COLORS[p.paylineIndex]??'#ffd700', fontFamily:"'Exo 2',sans-serif", marginTop:2 }}>
                Line {p.paylineIndex+1}: {p.symbol} ×{p.multiplier} · ×{p.activeMult} = ETB {p.totalWin.toLocaleString()}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Scaled reel wrapper ───────────────────────────────────────────────────────
interface ScaledProps {
  col:number; spinGen:number; symbolsKey:number; symbols:string[];
  isAnimating:boolean; isSettled:boolean;
  onSettled?:(g:number)=>void; winRows:number[];
}
function ScaledReel({ col, spinGen, symbolsKey, symbols, isAnimating, isSettled, onSettled, winRows }: ScaledProps) {
  return (
    <div style={{ flex:1, minWidth:0, height:REEL_H, overflow:'hidden', position:'relative' }}>
      <div style={{ transformOrigin:'top left', transform:`scale(${SCALE})`, width:ORIG, height:ORIG*3, position:'absolute', top:0, left:0 }}>
        <ReelColumn
          colIndex={col} spinGen={spinGen} symbolsKey={symbolsKey} symbols={symbols}
          isAnimating={isAnimating} isSettled={isSettled} onSettled={onSettled} winRows={winRows}
        />
      </div>
    </div>
  );
}

// ── Payline side indicators ───────────────────────────────────────────────────
// Each payline number badge is positioned at the exact row it enters/exits on that side
function PaylineSide({ winningLines, side, reelH }: { winningLines:number[]; side:string; reelH:number }) {
  const rowH = reelH / 3;
  return (
    <div style={{ width:PL_W, flexShrink:0, position:'relative', height:reelH }}>
      {[0,1,2,3,4].map(line => {
        const isWin  = winningLines.includes(line);
        const color  = LINE_COLORS[line];
        const rowIdx = side === 'left'
          ? PAYLINE_SIDE_ROW[line][0]
          : PAYLINE_SIDE_ROW[line][1];
        const top    = rowIdx * rowH + rowH / 2 - 11;

        return (
          <div key={line} style={{
            position:'absolute', top, left:0, right:0,
            height:22, borderRadius:5,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:8, fontWeight:900, fontFamily:"'Exo 2',sans-serif",
            background:  isWin ? color : 'rgba(255,255,255,0.04)',
            border:      `1px solid ${isWin ? color : color+'22'}`,
            color:       isWin ? '#fff' : color+'55',
            boxShadow:   isWin ? `0 0 10px ${color}88` : 'none',
            transform:   isWin ? 'scale(1.1)' : 'scale(1)',
            transition:  'all 0.25s ease',
          }}>{line+1}</div>
        );
      })}
    </div>
  );
}