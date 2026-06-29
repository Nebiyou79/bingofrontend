// components/multihot/ReelColumn.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';

export const SYMBOL_HEIGHT = 96;

const SYMBOL_MAP: Record<string, { display: string }> = {
  cherry:     { display: '/images/slots/cherry.png' },
  lemon:      { display: '/images/slots/lemon.png' },
  orange:     { display: '/images/slots/orange.png' },
  plum:       { display: '/images/slots/plum.png' },
  grapes:     { display: '/images/slots/grapes.png' },
  watermelon: { display: '/images/slots/watermelon.png' },
  bell:       { display: '/images/slots/bell.png' },
  dollar:     { display: '/images/slots/dollar.png' },
  seven:      { display: '/images/slots/seven.png' },
  wild:       { display: '/images/slots/wild.png' },
};

const POOL        = ['cherry','lemon','orange','plum','grapes','watermelon','bell','dollar','seven','wild'];
const STOP_TIMES  = [0.9, 1.3, 1.7];   // seconds: reel 0, 1, 2 settle targets
const LOOP_SPEED  = 0.6;               // seconds per loop cycle when outcome is late
const STRIP_COUNT = 30;
const LOOP_COUNT  = 20;                // symbols in the looping strip
const SETTLED_OFFSET = (STRIP_COUNT - 3) * SYMBOL_HEIGHT;
const LOOP_OFFSET    = LOOP_COUNT * SYMBOL_HEIGHT;

function randomSym() { return POOL[Math.floor(Math.random() * POOL.length)]; }

function buildStaticStrip(outcome: string[]): string[] {
  const s: string[] = [];
  for (let i = 0; i < STRIP_COUNT - 3; i++) s.push(POOL[i % POOL.length]);
  s.push(...outcome);
  return s;
}

function buildLoopStrip(): string[] {
  // A circular strip for continuous spinning — outcome patched into tail later
  const s: string[] = [];
  for (let i = 0; i < LOOP_COUNT + 3; i++) s.push(randomSym());
  return s;
}

interface ReelColumnProps {
  colIndex:    number;
  spinGen:     number;
  symbolsKey:  number;   // non-zero only when real outcome is available
  symbols:     string[];
  isAnimating: boolean;
  isSettled:   boolean;
  onSettled?:  (gen: number) => void;
  winRows?:    number[];
}

export default function ReelColumn({
  colIndex, spinGen, symbolsKey, symbols, isAnimating, onSettled, winRows = [],
}: ReelColumnProps) {
  // phase:
  //   'idle'     — static display, no animation
  //   'spinning' — initial CSS animation playing (timed, outcome may arrive during)
  //   'looping'  — outcome late; continuous CSS loop keeps reel moving
  //   'settled'  — outcome shown, animation done
  const [phase, setPhase] = useState<'idle'|'spinning'|'looping'|'settled'>('idle');
  const [strip, setStrip] = useState<string[]>(() => buildStaticStrip(symbols));

  // loopKey bumps each time we re-trigger the loop CSS animation
  const [loopKey, setLoopKey] = useState(0);

  const symbolsRef     = useRef(symbols);
  symbolsRef.current   = symbols;
  const onSettledRef   = useRef(onSettled);
  onSettledRef.current = onSettled;

  const myGenRef          = useRef(spinGen);
  const pendingSettleRef  = useRef(false);  // outcome not yet arrived after initial spin
  const outcomeArrivedRef = useRef(false);  // outcome arrived while initial spin running
  const loopingRef        = useRef(false);  // are we in continuous loop mode?
  const loopTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── commitSettle ─────────────────────────────────────────────────────────
  // Always called with the verified real outcome — never IDLE fallback.
  const commitSettle = (outcome: string[]) => {
    // Clear any pending loop timer
    if (loopTimerRef.current) { clearTimeout(loopTimerRef.current); loopTimerRef.current = null; }
    pendingSettleRef.current  = false;
    outcomeArrivedRef.current = false;
    loopingRef.current        = false;

    const myGen      = myGenRef.current;
    const finalStrip = buildStaticStrip(outcome);
    console.log(`[ReelColumn ${colIndex}] commitSettle gen=${myGen} symbols=${outcome.join(',')}`);

    setPhase('idle');
    setStrip(finalStrip);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('settled');
        onSettledRef.current?.(myGen);
      });
    });
  };

  // ── startLoop: switch to continuous spinning when outcome is late ─────────
  const startLoop = () => {
    loopingRef.current       = true;
    pendingSettleRef.current = true;

    // Build a looping strip of random symbols
    setStrip(buildLoopStrip());
    setPhase('looping');
    setLoopKey(k => k + 1);

    console.log(`[ReelColumn ${colIndex}] outcome late — starting continuous loop`);
  };

  // Schedule the next loop iteration (called at end of each loop CSS animation)
  const scheduleNextLoop = () => {
    if (!loopingRef.current) return;
    loopTimerRef.current = setTimeout(() => {
      if (!loopingRef.current) return;
      setStrip(buildLoopStrip());
      setLoopKey(k => k + 1);
    }, 0);
  };

  // ── isAnimating changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (isAnimating) {
      myGenRef.current          = spinGen;
      pendingSettleRef.current  = false;
      outcomeArrivedRef.current = false;
      loopingRef.current        = false;
      if (loopTimerRef.current) { clearTimeout(loopTimerRef.current); loopTimerRef.current = null; }

      setStrip(buildStaticStrip(symbolsRef.current));
      setPhase('spinning');

      settleTimerRef.current = setTimeout(() => {
        if (outcomeArrivedRef.current) {
          // Outcome already in hand — settle cleanly
          commitSettle(symbolsRef.current);
        } else {
          // Outcome late — switch to continuous loop instead of freezing
          startLoop();
        }
      }, STOP_TIMES[colIndex] * 1000);

    } else {
      // isAnimating turned false externally (e.g. error/reset)
      loopingRef.current = false;
      if (loopTimerRef.current) { clearTimeout(loopTimerRef.current); loopTimerRef.current = null; }
      if (phase !== 'settled') {
        setStrip(buildStaticStrip(symbolsRef.current));
        setPhase('idle');
      }
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    }
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (loopTimerRef.current)   clearTimeout(loopTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  // ── outcome ready: fires when BOTH symbolsKey AND symbols update ────────────
  // React batches setDisplaySpin + setSymbolsKey into one render, so `symbols`
  // and `symbolsKey` always change in the same render when the outcome arrives.
  // By depending on both we get the real outcome symbols in the closure —
  // no ref-staleness possible.
  useEffect(() => {
    if (symbolsKey !== myGenRef.current) return;

    outcomeArrivedRef.current = true;

    console.log(`[ReelColumn ${colIndex}] outcome ready key=${symbolsKey} symbols=${symbols.join(',')} pending=${pendingSettleRef.current} phase=${phase}`);

    if (pendingSettleRef.current) {
      // Looping or holding — commit with real symbols from this render's closure
      commitSettle(symbols);
    } else if (phase === 'spinning') {
      // Still in initial animation — patch strip tail for correct visual landing
      setStrip(prev => {
        const next = [...prev];
        const tail = STRIP_COUNT - 3;
        symbols.forEach((sym, i) => { next[tail + i] = sym; });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, symbols]);

  // ── idle symbol sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'idle') setStrip(buildStaticStrip(symbols));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols]);

  const isSpinning     = phase === 'spinning';
  const isLooping      = phase === 'looping';
  const isSettledPhase = phase === 'settled';
  const winRows_settled = isSettledPhase ? winRows : [];

  // Loop strip length differs from spin strip
  const totalHeight = isLooping
    ? (LOOP_COUNT + 3) * SYMBOL_HEIGHT
    : STRIP_COUNT * SYMBOL_HEIGHT;

  return (
    <>
      <style>{`
        /* Initial spin animation — decelerates to a stop */
        @keyframes reelSpin-${colIndex} {
          0%   { transform: translateY(0); }
          55%  { transform: translateY(-${SETTLED_OFFSET * 0.82}px); }
          75%  { transform: translateY(-${SETTLED_OFFSET * 1.03}px); }
          88%  { transform: translateY(-${SETTLED_OFFSET * 0.985}px); }
          100% { transform: translateY(-${SETTLED_OFFSET}px); }
        }
        .reel-animate-${colIndex} {
          animation: reelSpin-${colIndex} ${STOP_TIMES[colIndex]}s cubic-bezier(0.2,0.08,0.1,1) forwards;
        }

        /* Continuous loop — constant speed, repeating */
        @keyframes reelLoop-${colIndex} {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-${LOOP_OFFSET}px); }
        }
        .reel-loop-${colIndex} {
          animation: reelLoop-${colIndex} ${LOOP_SPEED}s linear forwards;
        }

        @keyframes winPulse {
          0%,100% { filter: brightness(1) drop-shadow(0 0 8px rgba(255,215,0,0.4)); }
          50%     { filter: brightness(1.2) drop-shadow(0 0 24px rgba(255,215,0,0.9)); }
        }
      `}</style>

      <div style={{ width:SYMBOL_HEIGHT, height:SYMBOL_HEIGHT*3, overflow:'hidden', position:'relative', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:'0 0 auto 0', height:36, zIndex:10, background:'linear-gradient(to bottom,#050108,transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:'auto 0 0 0', height:36, zIndex:10, background:'linear-gradient(to top,#050108,transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:0, right:0, top:SYMBOL_HEIGHT, height:SYMBOL_HEIGHT, borderTop:'1px solid rgba(212,175,55,0.18)', borderBottom:'1px solid rgba(212,175,55,0.18)', zIndex:5, pointerEvents:'none', background:'rgba(212,175,55,0.015)' }} />

        <div
          key={isLooping ? `loop-${loopKey}` : `spin-${colIndex}`}
          className={
            isSpinning ? `reel-animate-${colIndex}` :
            isLooping  ? `reel-loop-${colIndex}` :
            ''
          }
          style={{
            height: totalHeight,
            transform: isSettledPhase ? `translateY(-${SETTLED_OFFSET}px)` : undefined,
          }}
          onAnimationEnd={isLooping ? scheduleNextLoop : undefined}
        >
          {strip.map((sym, idx) => {
            const info           = SYMBOL_MAP[sym] ?? { display: '/images/slots/cherry.png' };
            const posInFinalView = idx - (STRIP_COUNT - 3);
            const isInFinalView  = posInFinalView >= 0 && posInFinalView < 3;
            const isWinSymbol    = isInFinalView && isSettledPhase && winRows_settled.includes(posInFinalView);
            return (
              <div key={idx} style={{ width:SYMBOL_HEIGHT, height:SYMBOL_HEIGHT, display:'flex', alignItems:'center', justifyContent:'center', userSelect:'none', background:isWinSymbol?'radial-gradient(circle,rgba(212,175,55,0.18) 0%,transparent 70%)':'transparent', borderRadius:isWinSymbol?'12px':'0', transition:'background 0.4s ease', padding:6 }}>
                <img src={info.display} alt={sym} style={{ width:sym==='wild'||sym==='seven'?'88%':'82%', height:sym==='wild'||sym==='seven'?'88%':'82%', objectFit:'contain', display:'block', animation:isWinSymbol?'winPulse 1s ease-in-out infinite':'none', transition:'filter 0.3s ease' }} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}