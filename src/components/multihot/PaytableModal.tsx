// components/multihot/PaytableModal.tsx
'use client';

import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

const LINE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

const PAYLINES_VISUAL: Array<[number, number][]> = [
  [[0,0],[0,1],[0,2]],
  [[1,0],[1,1],[1,2]],
  [[2,0],[2,1],[2,2]],
  [[0,0],[1,1],[2,2]],
  [[2,0],[1,1],[0,2]],
];

const PAYOUTS = [
  { emoji: '👑', label: 'WILD (Crown)',  mult: 20, color: '#ffd700',  bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.22)'  },
  { emoji: '7️⃣', label: 'Seven',         mult: 15, color: '#ef4444',  bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)'  },
  { emoji: '💰', label: 'Dollar',        mult: 10, color: '#22c55e',  bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)'  },
  { emoji: '🔔', label: 'Bell',          mult: 5,  color: '#f59e0b',  bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
  { emoji: '🍉', label: 'Watermelon',    mult: 3,  color: '#3b82f6',  bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.2)' },
  { emoji: '🍇', label: 'Grapes',        mult: 3,  color: '#a855f7',  bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.2)' },
  { emoji: '🍒', label: 'Cherry',        mult: 1,  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
  { emoji: '🍋', label: 'Lemon',         mult: 1,  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
  { emoji: '🍊', label: 'Orange',        mult: 1,  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
  { emoji: '🍑', label: 'Plum',          mult: 1,  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
];

const MULT_INFO = [
  { v: 5, color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)',  w: '5%',  name: 'Crown'    },
  { v: 4, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', w: '10%', name: 'Mega'     },
  { v: 3, color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.22)',  w: '20%', name: 'Super'    },
  { v: 2, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)', w: '30%', name: 'Double'   },
  { v: 1, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.22)', w: '35%', name: 'Standard' },
];

function MiniGrid({ cells, color }: { cells: [number, number][]; color: string }) {
  const active = new Set(cells.map(([r, c]) => `${r}-${c}`));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 14px)', gridTemplateRows: 'repeat(3, 14px)', gap: 2 }}>
      {[0,1,2].map(r => [0,1,2].map(c => {
        const key  = `${r}-${c}`;
        const isOn = active.has(key);
        return (
          <div key={key} style={{
            width: 14, height: 14, borderRadius: 3,
            background: isOn ? color : 'rgba(255,255,255,0.04)',
            border:     `1px solid ${isOn ? color : 'rgba(255,255,255,0.07)'}`,
            boxShadow:  isOn ? `0 0 5px ${color}88` : 'none',
          }} />
        );
      }))}
    </div>
  );
}

type Tab = 'payouts' | 'lines' | 'multiplier' | 'rules';

export default function PaytableModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('payouts');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'payouts',    label: 'Payouts'    },
    { id: 'lines',      label: 'Paylines'   },
    { id: 'multiplier', label: 'Multiplier' },
    { id: 'rules',      label: 'Rules'      },
  ];

  return (
    <>
      <style>{`
        @keyframes pt-in {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .pt-scroll::-webkit-scrollbar { width: 3px; }
        .pt-scroll::-webkit-scrollbar-track { background: transparent; }
        .pt-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        {/* Sheet */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 540,
            maxHeight: '90vh',
            background: '#0d1117',
            borderRadius: '20px 20px 0 0',
            border: '1px solid rgba(255,255,255,0.07)',
            borderBottom: 'none',
            animation: 'pt-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Top accent */}
          <div style={{
            height: 3, flexShrink: 0,
            background: 'linear-gradient(90deg, transparent 0%, #5a3d00 8%, #c8910a 28%, #ffd700 40%, #ffe566 50%, #ffd700 60%, #c8910a 72%, #5a3d00 92%, transparent 100%)',
          }} />

          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 20px 12px', flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em',
            }}>PAYTABLE</span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.45)', width: 30, height: 30, borderRadius: 8,
                cursor: 'pointer', fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '0 20px 12px', flexShrink: 0 }}>
            {tabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, height: 32, borderRadius: 8,
                    background:  active ? 'rgba(255,255,255,0.09)' : 'transparent',
                    border:      active ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
                    color:       active ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontSize:    11, fontWeight: 700,
                    cursor:      'pointer',
                    fontFamily:  "'Exo 2', sans-serif",
                    transition:  'all 0.15s',
                    letterSpacing: '0.05em',
                  }}
                >{t.label}</button>
              );
            })}
          </div>

          {/* Scrollable content */}
          <div
            className="pt-scroll"
            style={{
              flex: 1, overflowY: 'auto',
              padding: '0 20px 20px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}
          >
            {/* ── PAYOUTS ── */}
            {tab === 'payouts' && PAYOUTS.map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 12,
                background: p.bg, border: `1px solid ${p.border}`,
              }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0, width: 32, textAlign: 'center' }}>{p.emoji}</span>
                <span style={{
                  flex: 1, fontFamily: "'Exo 2', sans-serif",
                  fontSize: 12, color: 'rgba(255,255,255,0.55)',
                }}>{p.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.15rem', fontWeight: 900, color: p.color,
                    fontFamily: "'Exo 2', sans-serif",
                    textShadow: `0 0 14px ${p.color}66`,
                  }}>×{p.mult}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'Exo 2', sans-serif" }}>per line bet</div>
                </div>
              </div>
            ))}

            {/* ── PAYLINES ── */}
            {tab === 'lines' && (
              <>
                <p style={{
                  margin: '0 0 6px', fontSize: 10,
                  color: 'rgba(255,255,255,0.25)', fontFamily: "'Exo 2', sans-serif",
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>5 fixed paylines · always active</p>
                {PAYLINES_VISUAL.map((cells, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    background: `${LINE_COLORS[i]}0a`,
                    border: `1px solid ${LINE_COLORS[i]}28`,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                      background: LINE_COLORS[i],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 900, color: '#fff',
                      fontFamily: "'Exo 2', sans-serif",
                    }}>{i + 1}</div>
                    <MiniGrid cells={cells} color={LINE_COLORS[i]} />
                    <span style={{ fontSize: 11, color: `${LINE_COLORS[i]}bb`, fontFamily: "'Exo 2', sans-serif" }}>
                      {['Top row', 'Middle row', 'Bottom row', 'Diagonal ↘', 'Diagonal ↙'][i]}
                    </span>
                  </div>
                ))}
                <p style={{
                  margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.22)',
                  fontFamily: "'Exo 2', sans-serif", lineHeight: 1.6,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '10px 12px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  Your bet per line × 5 = total bet per spin. All 5 lines are always active.
                </p>
              </>
            )}

            {/* ── MULTIPLIER ── */}
            {tab === 'multiplier' && (
              <>
                <p style={{
                  margin: '0 0 6px', fontSize: 10,
                  color: 'rgba(255,255,255,0.25)', fontFamily: "'Exo 2', sans-serif",
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>Applied to all wins this spin</p>
                {MULT_INFO.map(m => (
                  <div key={m.v} style={{
                    padding: '10px 14px', borderRadius: 12,
                    background: m.bg, border: `1px solid ${m.border}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{
                      fontSize: '1.4rem', fontWeight: 900, color: m.color,
                      fontFamily: "'Exo 2', sans-serif", width: 40, textAlign: 'center',
                      textShadow: `0 0 14px ${m.color}66`, flexShrink: 0,
                    }}>{m.v}×</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: m.color, fontFamily: "'Exo 2', sans-serif", fontWeight: 700 }}>{m.name}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'Exo 2', sans-serif" }}>{m.w}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', width: m.w, borderRadius: 99, background: m.color, opacity: 0.7 }} />
                      </div>
                    </div>
                  </div>
                ))}
                <p style={{
                  margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.22)',
                  fontFamily: "'Exo 2', sans-serif", lineHeight: 1.6,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '10px 12px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  The multiplier reel spins independently. The active row (arrow) determines the multiplier applied to all wins this spin.
                </p>
              </>
            )}

            {/* ── RULES ── */}
            {tab === 'rules' && [
              { icon: '🎰', title: 'How to Win',      body: 'Land 3 identical symbols on any active payline. Win = Bet × Symbol Multiplier × Active Reel Multiplier.' },
              { icon: '👑', title: 'Wild Crown',       body: 'Substitutes for any symbol. 3 Crowns pay ×20 your bet — the top prize.' },
              { icon: '🃏', title: 'Gamble Feature',   body: 'After any win, guess card colour (red/black) to double up. 5 rounds max — wrong guess loses the win.' },
              { icon: '🔀', title: 'Paylines',         body: 'All 5 paylines always active: top, middle, bottom rows + both diagonals. All line wins are summed.' },
              { icon: '🔐', title: 'Provably Fair',    body: 'HMAC-SHA256 with server + client seed. Verify any spin via the history page.' },
              { icon: '📊', title: 'Return to Player', body: 'Theoretical RTP 96%. Max win 345× total bet per spin.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 900, color: 'rgba(255,215,0,0.65)',
                    fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.07em',
                  }}>{title}</span>
                </div>
                <p style={{
                  margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)',
                  fontFamily: "'Exo 2', sans-serif", lineHeight: 1.65,
                }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Close footer */}
          <div style={{
            padding: '12px 20px 20px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button
              onClick={onClose}
              style={{
                width: '100%', height: 46, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.08em',
              }}
            >CLOSE</button>
          </div>
        </div>
      </div>
    </>
  );
}