// components/multihot/SlotBetPanel.tsx
'use client';

import React, { useState, useCallback } from 'react';

const MIN = 1, MAX = 10_000;
const QUICK = [5, 10, 25, 50, 100, 500];

// ── Icons ─────────────────────────────────────────────────────────────────────
const AutoIcon = ({ active }: { active: boolean }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={9} stroke={active?'#ef4444':'currentColor'} strokeWidth={1.8} fill={active?'rgba(239,68,68,0.12)':'none'}/>
    <path d="M9.5 8l5 4-5 4V8z" fill={active?'#ef4444':'currentColor'}/>
  </svg>
);
const TurboIcon = ({ active }: { active: boolean }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" stroke={active?'#ffd700':'currentColor'} strokeWidth={1.8} strokeLinejoin="round" fill={active?'rgba(255,215,0,0.12)':'none'}/>
  </svg>
);
const InfoIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.8}/>
    <path d="M12 11v5M12 7.5v.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
  </svg>
);
const BetIcon = ({ open }: { open: boolean }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={9} stroke={open?'#ffd700':'currentColor'} strokeWidth={1.8} fill={open?'rgba(255,215,0,0.08)':'none'}/>
    <path d="M9 9h4a2 2 0 010 4H9m0-4v6m0-6H8m1 6h5" stroke={open?'#ffd700':'currentColor'} strokeWidth={1.5} strokeLinecap="round"/>
  </svg>
);

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  bet:            number;
  onBetChange:    (b: number) => void;
  onSpin:         () => void;
  onOpenAutoplay: () => void;
  onOpenPaytable: () => void;
  isSpinning:     boolean;
  isAutoRunning:  boolean;
  onStopAuto:     () => void;
  turbo:          boolean;
  onTurboChange:  (v: boolean) => void;
  error:          string | null;
}

export default function SlotBetPanel({
  bet, onBetChange, onSpin,
  onOpenAutoplay, onOpenPaytable,
  isSpinning, isAutoRunning, onStopAuto,
  turbo, onTurboChange,
  error,
}: Props) {
  const [showBet,  setShowBet]  = useState(false);
  const [inputVal, setInputVal] = useState(String(bet));

  const sync = useCallback((v: number) => {
    const c = Math.min(MAX, Math.max(MIN, Math.floor(v)));
    onBetChange(c);
    setInputVal(String(c));
  }, [onBetChange]);

  return (
    <>
      <style>{`
        @keyframes bp-spin  { to{transform:rotate(360deg);} }
        @keyframes bp-drop  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bp-pulse { 0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.18)} 50%{box-shadow:0 0 0 7px rgba(239,68,68,0.04)} }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=number]{-moz-appearance:textfield;}
      `}</style>

      {/* ── Error banner — shown above dock ── */}
      {error && (
        <div style={{
          color:'#ef4444', fontSize:11, textAlign:'center',
          fontFamily:"'Exo 2',sans-serif", padding:'5px 10px',
          background:'rgba(239,68,68,0.07)', borderRadius:8,
          border:'1px solid rgba(239,68,68,0.15)', boxSizing:'border-box',
        }}>{error}</div>
      )}

      {/* ── Bet flyout ── */}
      {showBet && (
        <div style={{
          background:'rgba(10,12,18,0.98)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:14, padding:'12px',
          animation:'bp-drop 0.16s ease both',
          boxSizing:'border-box',
        }}>
          {/* Quick picks */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:4, marginBottom:8 }}>
            {QUICK.map(v => (
              <button key={v} onClick={() => sync(v)} style={{
                height:28, borderRadius:6,
                background: bet===v?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.03)',
                border:`1px solid ${bet===v?'rgba(239,68,68,0.45)':'rgba(255,255,255,0.07)'}`,
                color: bet===v?'#ef4444':'rgba(255,255,255,0.3)',
                fontSize:10, fontWeight:700, cursor:'pointer',
                fontFamily:"'Exo 2',sans-serif",
              }}>{v}</button>
            ))}
          </div>
          {/* Input row */}
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            {(['½','−'] as const).map((l,i) => (
              <button key={l} onClick={() => i===0?sync(bet/2):sync(bet-1)} style={adjSt}>{l}</button>
            ))}
            <input type="number" value={inputVal}
              onChange={e=>{setInputVal(e.target.value);const n=Number(e.target.value);if(!isNaN(n)&&n>0)onBetChange(n);}}
              onBlur={()=>sync(bet)}
              style={{ flex:1,height:34,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:7,color:'#fff',fontSize:'0.9rem',fontWeight:700,textAlign:'center',outline:'none',fontFamily:"'Exo 2',sans-serif" }}
            />
            {(['+','×2'] as const).map((l,i) => (
              <button key={l} onClick={() => i===0?sync(bet+1):sync(bet*2)} style={adjSt}>{l}</button>
            ))}
          </div>
          {/* Max / Paytable */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:8 }}>
            <button onClick={()=>sync(MAX)} style={{ height:26,borderRadius:6,background:'rgba(255,215,0,0.07)',border:'1px solid rgba(255,215,0,0.18)',color:'rgba(255,215,0,0.7)',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'Exo 2',sans-serif" }}>MAX BET</button>
            <button onClick={onOpenPaytable} style={{ height:26,borderRadius:6,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.28)',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'Exo 2',sans-serif" }}>PAYTABLE</button>
          </div>
        </div>
      )}

      {/* ── Dock ── */}
      <div style={{
        background:'rgba(6,8,16,0.9)',
        borderRadius:16,
        border:'1px solid rgba(255,255,255,0.06)',
        padding:'8px 6px 10px',
        display:'grid',
        // 4 side buttons + 1 centre = 5 columns
        // Side buttons share equal space; centre is wider
        gridTemplateColumns:'1fr 1fr 90px 1fr 1fr',
        alignItems:'center',
        gap:0,
        boxSizing:'border-box',
        width:'100%',
        overflow:'hidden',
      }}>

        {/* AUTO */}
        <DockBtn
          onClick={isAutoRunning ? onStopAuto : onOpenAutoplay}
          active={isAutoRunning} label={isAutoRunning?'STOP':'AUTO'}
          activeColor="#ef4444" pulse={isAutoRunning}
        ><AutoIcon active={isAutoRunning}/></DockBtn>

        {/* TURBO */}
        <DockBtn
          onClick={()=>onTurboChange(!turbo)}
          active={turbo} label="TURBO" activeColor="#ffd700"
        ><TurboIcon active={turbo}/></DockBtn>

        {/* ── SPIN centre ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          {/* Bet pill */}
          <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:7, overflow:'hidden' }}>
            <button onClick={()=>sync(bet-1)} disabled={isSpinning} style={pillSt}>−</button>
            <button onClick={()=>setShowBet(s=>!s)} style={{ padding:'2px 6px',background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',minWidth:0 }}>
              <span style={{ fontSize:6,color:'rgba(255,255,255,0.25)',fontFamily:"'Exo 2',sans-serif",letterSpacing:'0.1em',whiteSpace:'nowrap' }}>BET (ETB)</span>
              <span style={{ fontSize:'0.9rem',fontWeight:900,color:'#ffd700',fontFamily:"'Exo 2',sans-serif",lineHeight:1 }}>{bet}</span>
            </button>
            <button onClick={()=>sync(bet+1)} disabled={isSpinning} style={pillSt}>+</button>
          </div>

          {/* Spin button */}
          <button onClick={onSpin} disabled={!(!isSpinning)} style={{
            width:62, height:62, borderRadius:'50%',
            border: !isSpinning?'2.5px solid rgba(239,68,68,0.7)':'2.5px solid rgba(255,255,255,0.08)',
            background: !isSpinning
              ? 'radial-gradient(circle at 35% 35%,#ff6b6b,#dc2626 55%,#7f1d1d)'
              : '#141820',
            color: !isSpinning?'#fff':'rgba(255,255,255,0.15)',
            boxShadow: !isSpinning
              ? '0 0 0 3px rgba(239,68,68,0.1),0 4px 20px rgba(239,68,68,0.45),inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'none',
            cursor: !isSpinning?'pointer':'not-allowed',
            transition:'all 0.2s ease',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Exo 2',sans-serif", fontWeight:900, flexShrink:0,
            animation: isAutoRunning?'bp-pulse 1.6s ease-in-out infinite':'none',
          }}>
            {isSpinning
              ? <span style={{ width:20,height:20,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.2)',borderTopColor:'#fff',display:'inline-block',animation:'bp-spin 0.6s linear infinite' }}/>
              : <div style={{ display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1.1,gap:1 }}>
                  <span style={{ fontSize:'1.35rem' }}>⟳</span>
                  <span style={{ fontSize:'0.6rem',letterSpacing:'0.06em' }}>SPIN</span>
                </div>
            }
          </button>

          {/* Total label */}
          <span style={{ fontSize:7,color:'rgba(255,255,255,0.16)',fontFamily:"'Exo 2',sans-serif",whiteSpace:'nowrap' }}>
            ×5 = ETB {(bet*5).toLocaleString()}
          </span>
        </div>

        {/* BET select */}
        <DockBtn onClick={()=>setShowBet(s=>!s)} active={showBet} label="BET" activeColor="#ffd700">
          <BetIcon open={showBet}/>
        </DockBtn>

        {/* INFO */}
        <DockBtn onClick={onOpenPaytable} label="INFO"><InfoIcon/></DockBtn>

      </div>
    </>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
interface DBP {
  onClick:()=>void; children:React.ReactNode; label:string;
  active?:boolean; activeColor?:string; disabled?:boolean; pulse?:boolean;
}
function DockBtn({ onClick, children, label, active, activeColor, disabled, pulse }: DBP) {
  const col = active && activeColor ? activeColor : active ? '#fff' : 'rgba(255,255,255,0.28)';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: active ? `${activeColor??'#fff'}14` : 'transparent',
      border:'none', borderRadius:10, padding:'5px 2px 4px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
      cursor:disabled?'not-allowed':'pointer', color:col, opacity:disabled?0.3:1,
      width:'100%', minWidth:0, transition:'all 0.15s',
      animation: pulse?'bp-pulse 1.6s ease-in-out infinite':'none',
      overflow:'hidden',
    }}>
      {children}
      <span style={{ fontSize:7, fontWeight:700, letterSpacing:'0.05em', color:col, fontFamily:"'Exo 2',sans-serif", whiteSpace:'nowrap' }}>{label}</span>
    </button>
  );
}

const adjSt: React.CSSProperties = {
  width:32,height:34,borderRadius:6,
  background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',
  color:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:700,
  cursor:'pointer',flexShrink:0,
  display:'flex',alignItems:'center',justifyContent:'center',
  fontFamily:"'Exo 2',sans-serif",
};
const pillSt: React.CSSProperties = {
  width:22,height:30,background:'rgba(255,255,255,0.04)',
  border:'none',borderRadius:0,color:'rgba(255,255,255,0.5)',
  fontSize:15,fontWeight:700,cursor:'pointer',flexShrink:0,
  display:'flex',alignItems:'center',justifyContent:'center',
  fontFamily:"'Exo 2',sans-serif",
};