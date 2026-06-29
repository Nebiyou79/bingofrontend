// components/plinko/PlinkoLiveBets.tsx
// DashBets — PlinkoLiveBets (Plinko X style)
//
// Matches reference:
//  - Deep navy background
//  - Pulsing green live indicator
//  - ETB currency
//  - Color-coded multiplier and result columns

'use client';

import React from 'react';

export interface LiveBetEntry {
  user:       string;
  wager:      number;
  multiplier: number;
  result:     string;
  win:        boolean;
}

interface PlinkoLiveBetsProps {
  bets: LiveBetEntry[];
}

const PlinkoLiveBets: React.FC<PlinkoLiveBetsProps> = ({ bets }) => {
  return (
    <div
      style={{
        background:     'rgba(5,12,46,0.97)',
        border:         '1px solid rgba(99,102,241,0.18)',
        borderRadius:   16,
        overflow:       'hidden',
        display:        'flex',
        flexDirection:  'column',
        maxHeight:       560,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        padding:      '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink:   0,
      }}>
        <span style={{ position: 'relative', display: 'flex', width: 8, height: 8, flexShrink: 0 }}>
          <span style={{
            position:     'absolute',
            inset:        0,
            borderRadius: '50%',
            background:   '#4ade80',
            animation:    'livebets-ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
            opacity:      0.75,
          }} />
          <span style={{
            position:     'relative',
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   '#4ade80',
            display:      'block',
          }} />
        </span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em' }}>
          LIVE BETS
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '2fr 2fr 1.4fr 2fr',
        padding:             '6px 14px',
        borderBottom:        '1px solid rgba(255,255,255,0.04)',
        flexShrink:          0,
      }}>
        {['User', 'Wager', 'Multi', 'Result'].map((h, i) => (
          <span key={h} style={{
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: '0.12em',
            color:         'rgba(255,255,255,0.22)',
            textAlign:     i > 0 ? 'right' : 'left',
            textTransform: 'uppercase',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {bets.map((bet, i) => {
          const multColor  = bet.win ? '#4ade80' : '#f87171';
          const rawAmt     = Number(bet.result.replace(/[^0-9.]/g, ''));
          const resultText = bet.win
            ? `+${rawAmt.toFixed(2)}`
            : `-${rawAmt.toFixed(2)}`;

          return (
            <div
              key={i}
              style={{
                display:             'grid',
                gridTemplateColumns: '2fr 2fr 1.4fr 2fr',
                alignItems:          'center',
                padding:             '9px 14px',
                borderBottom:        '1px solid rgba(255,255,255,0.03)',
                transition:          'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
                {bet.user}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'right', fontFamily: 'monospace' }}>
                {bet.wager.toFixed(2)}{' '}
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>ETB</span>
              </span>
              <span style={{ color: multColor, fontSize: 11, fontWeight: 800, textAlign: 'right' }}>
                {bet.multiplier}×
              </span>
              <span style={{ color: multColor, fontSize: 11, fontWeight: 800, textAlign: 'right', fontFamily: 'monospace' }}>
                {resultText}
              </span>
            </div>
          );
        })}

        {bets.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
            No bets yet
          </div>
        )}
      </div>

      <style>{`
        @keyframes livebets-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PlinkoLiveBets;