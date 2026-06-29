// components/crash/ActiveBets.tsx
'use client';

import { memo } from 'react';
import type { BetEntry, RoundStatus } from '../../hooks/useCrashGame';

interface ActiveBetsProps {
  bets:          BetEntry[];
  status:        RoundStatus;
  multiplier:    number;
  currentUserId: string;
}

function avatarColor(userId: string): string {
  const hue = (userId.charCodeAt(0) * 37 + (userId.charCodeAt(1) || 0) * 13) % 360;
  return `hsl(${hue},60%,38%)`;
}

function maskName(name: string): string {
  if (name.length <= 3) return name[0] + '***';
  return name[0] + '***' + name[name.length - 1];
}

const StatusDot = ({ status }: { status: BetEntry['status'] }) => {
  const configs = {
    active: { color: '#72FF3B', pulse: true,  label: 'LIVE' },
    won:    { color: '#72FF3B', pulse: false,  label: 'WON'  },
    lost:   { color: '#FF4655', pulse: false,  label: 'BUST' },
  };
  const c = configs[status] ?? configs.active;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 20,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: c.color,
        background: `${c.color}18`,
        border: `1px solid ${c.color}40`,
        boxShadow: c.pulse ? `0 0 6px ${c.color}60` : 'none',
        fontFamily: 'monospace',
      }}
    >
      <span
        style={{
          width: 5, height: 5, borderRadius: '50%',
          background: c.color,
          display: 'inline-block',
          animation: c.pulse ? 'ab-pulse 1s ease-in-out infinite' : 'none',
        }}
      />
      {c.label}
    </span>
  );
};

export const ActiveBets = memo(function ActiveBets({
  bets, status, multiplier, currentUserId,
}: ActiveBetsProps) {
  const totalWon  = bets.filter((b) => b.status === 'won').reduce((s, b) => s + b.payout, 0);
  const activeCnt = bets.filter((b) => b.status === 'active').length;

  return (
    <>
      <style>{`
        @keyframes ab-pulse {
          0%,100% { opacity: 1;   transform: scale(1);    }
          50%      { opacity: 0.5; transform: scale(1.3);  }
        }
        @keyframes ab-row-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ab-row {
          animation: ab-row-in 0.2s ease both;
          transition: background 0.2s;
        }
        .ab-row:hover { background: rgba(255,255,255,0.025) !important; }
        .ab-payout {
          font-family: 'Courier New', monospace;
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      <div className="flex flex-col h-full">
        {/* Summary strip */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: '1px solid rgba(114,255,59,0.06)' }}
        >
          <div className="flex items-center gap-3">
            {/* Stacked avatars */}
            <div className="flex">
              {bets.slice(0, 4).map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-white font-bold"
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: avatarColor(b.userId),
                    border: '1.5px solid rgba(5,7,13,0.9)',
                    marginLeft: i > 0 ? -6 : 0,
                    fontSize: 9,
                    zIndex: 4 - i,
                  }}
                >
                  {b.username[0]?.toUpperCase()}
                </div>
              ))}
            </div>
            <div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{bets.length}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}> players</span>
              {activeCnt > 0 && status === 'running' && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#72FF3B',
                    background: 'rgba(114,255,59,0.12)',
                    border: '1px solid rgba(114,255,59,0.25)',
                    animation: 'ab-pulse 1.5s ease-in-out infinite',
                  }}
                >
                  {activeCnt} LIVE
                </span>
              )}
            </div>
          </div>

          {totalWon > 0 && (
            <div className="text-right">
              <div
                className="ab-payout font-bold"
                style={{ fontSize: 13, color: '#72FF3B' }}
              >
                +{totalWon.toFixed(2)}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Total won ETB
              </div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div
          className="grid px-4 py-1.5"
          style={{
            gridTemplateColumns: '1fr 80px 72px 80px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {['Player', 'Bet', '×', 'Profit'].map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.18)',
                textAlign: i === 0 ? 'left' : 'right',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Bet rows */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 260 }}>
          {bets.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2"
              style={{ height: 80, color: 'rgba(255,255,255,0.15)', fontSize: 12 }}
            >
              <span style={{ fontSize: 20 }}>☣</span>
              <span>No bets this round</span>
            </div>
          ) : (
            bets.map((bet, i) => {
              const isMe     = bet.userId === currentUserId;
              const isWon    = bet.status === 'won';
              const isLost   = bet.status === 'lost';
              const isActive = bet.status === 'active';
              const liveVal  = isActive && status === 'running'
                ? (bet.betAmount * multiplier)
                : null;

              const profit = isWon ? bet.payout - bet.betAmount : isActive && liveVal !== null
                ? liveVal - bet.betAmount
                : null;

              return (
                <div
                  key={`${bet.userId}-${bet.betIndex ?? 0}-${i}`}
                  className="ab-row grid px-4 py-2 items-center"
                  style={{
                    gridTemplateColumns: '1fr 80px 72px 80px',
                    animationDelay: `${Math.min(i * 30, 300)}ms`,
                    background: isMe
                      ? 'rgba(114,255,59,0.04)'
                      : isWon
                      ? 'rgba(114,255,59,0.025)'
                      : 'transparent',
                    borderLeft: isMe ? '2px solid rgba(114,255,59,0.4)' : '2px solid transparent',
                  }}
                >
                  {/* Player */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex-shrink-0 flex items-center justify-center text-white font-bold"
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: avatarColor(bet.userId),
                        fontSize: 10,
                        boxShadow: isMe ? '0 0 8px rgba(114,255,59,0.5)' : 'none',
                      }}
                    >
                      {bet.username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="truncate"
                        style={{
                          fontSize: 11,
                          fontWeight: isMe ? 700 : 400,
                          color: isMe ? '#72FF3B' : 'rgba(255,255,255,0.55)',
                          maxWidth: 72,
                        }}
                      >
                        {maskName(bet.username)}{isMe ? ' ★' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Bet amount */}
                  <div
                    className="ab-payout text-right"
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
                  >
                    {bet.betAmount.toFixed(2)}
                  </div>

                  {/* Cashout × */}
                  <div className="text-right">
                    {isWon && (
                      <span
                        className="ab-payout font-bold"
                        style={{ fontSize: 11, color: '#A855F7' }}
                      >
                        {bet.cashedOutAt?.toFixed(2)}x
                      </span>
                    )}
                    {isLost && (
                      <StatusDot status="lost" />
                    )}
                    {isActive && status === 'running' && (
                      <StatusDot status="active" />
                    )}
                    {isActive && status !== 'running' && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>—</span>
                    )}
                  </div>

                  {/* Profit */}
                  <div className="text-right">
                    {isWon && (
                      <span
                        className="ab-payout font-bold"
                        style={{ fontSize: 11, color: '#72FF3B' }}
                      >
                        +{(bet.payout - bet.betAmount).toFixed(2)}
                      </span>
                    )}
                    {isActive && liveVal !== null && profit !== null && (
                      <span
                        className="ab-payout"
                        style={{ fontSize: 11, color: profit >= 0 ? 'rgba(114,255,59,0.4)' : 'rgba(255,70,85,0.4)' }}
                      >
                        {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                      </span>
                    )}
                    {isLost && (
                      <span
                        className="ab-payout"
                        style={{ fontSize: 11, color: 'rgba(255,70,85,0.45)' }}
                      >
                        -{bet.betAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
});