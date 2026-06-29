// components/multihot/MultiplierReel.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

const META: Record<number,{c:string;bg:string;glow:string}> = {
  5:{c:'#ef4444',bg:'rgba(239,68,68,0.22)', glow:'rgba(239,68,68,0.55)'},
  4:{c:'#f59e0b',bg:'rgba(245,158,11,0.22)',glow:'rgba(245,158,11,0.55)'},
  3:{c:'#22c55e',bg:'rgba(34,197,94,0.22)', glow:'rgba(34,197,94,0.55)'},
  2:{c:'#3b82f6',bg:'rgba(59,130,246,0.22)',glow:'rgba(59,130,246,0.55)'},
  1:{c:'#a855f7',bg:'rgba(168,85,247,0.22)',glow:'rgba(168,85,247,0.55)'},
};
const fallback = {c:'#fff',bg:'rgba(255,255,255,0.1)',glow:'rgba(255,255,255,0.3)'};
const m = (v:number) => META[v] ?? fallback;

interface Props {
  values:     number[];
  activeRow:  number;
  isSpinning: boolean;
}

export default function MultiplierReel({ values, activeRow, isSpinning }: Props) {
  const [frozen, setFrozen] = useState({ values, activeRow });
  const prevSpin = useRef(isSpinning);

  useEffect(() => {
    if (!isSpinning) setFrozen({ values, activeRow });
    prevSpin.current = isSpinning;
  }, [isSpinning, values, activeRow]);

  const len   = frozen.values.length || 5;
  const above = frozen.values[(frozen.activeRow - 1 + len) % len];
  const curr  = frozen.values[frozen.activeRow];
  const below = frozen.values[(frozen.activeRow + 1) % len];

  const cells = [
    { v: above, active: false },
    { v: curr,  active: true  },
    { v: below, active: false },
  ];

  return (
    <>
      <style>{`
        @keyframes mr-unk { 0%,100%{opacity:0.08} 50%{opacity:0.18} }
        @keyframes mr-pop { from{transform:scale(0.72);opacity:0} 55%{transform:scale(1.08)} to{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', boxSizing:'border-box', overflow:'hidden' }}>
        {/* MULT label */}
        <div style={{
          fontSize:6, fontWeight:900, color:'rgba(255,215,0,0.28)',
          fontFamily:"'Exo 2',sans-serif", letterSpacing:'0.1em',
          textTransform:'uppercase', textAlign:'center',
          paddingBottom:2, flexShrink:0, lineHeight:1,
        }}>MULT</div>

        {/* 3 cells */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, minHeight:0, overflow:'hidden' }}>
          {cells.map(({ v, active }, idx) => {
            const mt = m(v);
            return (
              <div key={idx} style={{
                flex:1, minHeight:0, borderRadius:7,
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative', overflow:'hidden',
                background: active && !isSpinning ? mt.bg : 'rgba(0,0,0,0.45)',
                border: active && !isSpinning
                  ? `1.5px solid ${mt.c}`
                  : '1px solid rgba(255,255,255,0.05)',
                boxShadow: active && !isSpinning
                  ? `0 0 14px ${mt.glow}, inset 0 0 6px ${mt.bg}`
                  : 'none',
                transition:'all 0.3s ease',
              }}>
                {/* Arrow */}
                {active && !isSpinning && (
                  <div style={{
                    position:'absolute', left:-8, top:'50%', transform:'translateY(-50%)',
                    width:0, height:0,
                    borderTop:'3px solid transparent',
                    borderBottom:'3px solid transparent',
                    borderLeft:`5px solid ${mt.c}`,
                    filter:`drop-shadow(0 0 2px ${mt.glow})`,
                  }}/>
                )}
                <span style={{
                  fontFamily:"'Exo 2',sans-serif",
                  fontSize: active && !isSpinning ? '0.85rem' : '0.6rem',
                  fontWeight:900,
                  color: isSpinning
                    ? 'rgba(255,255,255,0.06)'
                    : active ? mt.c : 'rgba(255,255,255,0.12)',
                  textShadow: active && !isSpinning ? `0 0 10px ${mt.glow}` : 'none',
                  lineHeight:1, userSelect:'none',
                  animation: isSpinning
                    ? 'mr-unk 0.5s ease-in-out infinite'
                    : active ? 'mr-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
                }}>
                  {isSpinning ? '?' : `${v}×`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}