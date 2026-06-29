// components/multihot/StatBar.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

function useCountUp(value: number, ms = 500) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf  = useRef<number | null>(null);

  useEffect(() => {
    const from = prev.current, to = value;
    if (from === to) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * e);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else        prev.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, ms]);

  return display;
}

interface Props { balance: number; lastWin: number; }

export default function StatBar({ balance, lastWin }: Props) {
  const bal = useCountUp(balance);
  const win = useCountUp(lastWin);
  const isWin = lastWin > 0;

  return (
    <>
      <style>{`@keyframes sb-win { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto 1fr',
        background:'rgba(0,0,0,0.4)', borderRadius:10,
        border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden',
      }}>
        {/* Balance */}
        <div style={{ padding:'8px 12px' }}>
          <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.14em', color:'rgba(255,255,255,0.25)', fontFamily:"'Exo 2',sans-serif", textTransform:'uppercase', marginBottom:2 }}>Balance</div>
          <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#ffd700', fontFamily:"'Exo 2',sans-serif", whiteSpace:'nowrap' }}>
            {bal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
            <span style={{ fontSize:8, color:'rgba(255,215,0,0.5)', marginLeft:3 }}>ETB</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width:1, background:'rgba(255,255,255,0.06)', alignSelf:'stretch' }} />

        {/* Win */}
        <div style={{ padding:'8px 12px', background: isWin ? 'rgba(34,197,94,0.05)' : 'transparent', transition:'background 0.3s' }}>
          <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.14em', color:'rgba(255,255,255,0.25)', fontFamily:"'Exo 2',sans-serif", textTransform:'uppercase', marginBottom:2 }}>Win</div>
          <div key={lastWin} style={{ fontSize:'0.95rem', fontWeight:900, color: isWin ? '#22c55e' : 'rgba(255,255,255,0.12)', fontFamily:"'Exo 2',sans-serif", animation: isWin ? 'sb-win 0.3s ease both' : 'none' }}>
            {isWin
              ? <>{win.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}<span style={{ fontSize:8, color:'rgba(34,197,94,0.55)', marginLeft:3 }}>ETB</span></>
              : '—'
            }
          </div>
        </div>
      </div>
    </>
  );
}