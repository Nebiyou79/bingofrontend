// components/dragon-tower/DragonTowerBetPanel.tsx
/**
 * DashBets — Dragon Tower Bet Panel
 * Professional redesign: clean controls, clear hierarchy, Stake/BC.Game-style layout.
 */

import React, { useState, useMemo } from 'react';
import type { Difficulty, DragonTowerSession } from '../../lib/api/dragonTowerApi';

const BET_CHIPS = [10, 50, 100, 500, 1_000, 5_000];
const MIN_BET   = 1;
const MAX_BET   = 10_000;

// Must match dragonTowerEngine.js exactly
const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string; safeEggs: number; totalEggs: number; houseEdge: number;
  accent: string; bg: string; border: string; tag: string;
}> = {
  easy:   { label: 'Easy',   safeEggs: 2, totalEggs: 3, houseEdge: 0.03, accent: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.35)', tag: '2/3' },
  medium: { label: 'Medium', safeEggs: 1, totalEggs: 3, houseEdge: 0.03, accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', tag: '1/3' },
  hard:   { label: 'Hard',   safeEggs: 1, totalEggs: 4, houseEdge: 0.03, accent: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.35)', tag: '1/4' },
};

function calcTowerMult(difficulty: Difficulty, rowsCleared: number): number {
  if (rowsCleared <= 0) return 1.00;
  const { safeEggs, totalEggs, houseEdge } = DIFFICULTY_CONFIG[difficulty];
  const rowMult = (totalEggs / safeEggs) * (1 - houseEdge);
  return Math.round(Math.pow(rowMult, rowsCleared) * 10000) / 10000;
}

interface DragonTowerBetPanelProps {
  session:      DragonTowerSession | null;
  isLoading:    boolean;
  error:        string | null;
  userBalance:  number;
  todayProfit?: number;
  lastWin?:     number;
  onStart:      (betAmount: number, difficulty: Difficulty, rows?: number) => void;
  onCashOut:    () => void;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, color: '#6b7280',
      textTransform: 'uppercase', letterSpacing: '0.10em', display: 'block', marginBottom: '8px',
    }}>{children}</span>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: accent ?? '#e5e7eb' }}>{value}</span>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function DragonTowerBetPanel({
  session, isLoading, error, userBalance, todayProfit = 0, onStart, onCashOut,
}: DragonTowerBetPanelProps) {
  const [betInput,   setBetInput]   = useState<string>('100');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [rows,       setRows]       = useState<number>(9);
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const isActive   = !!session && session.status === 'active';
  const isGameOver = !!session && session.status !== 'active';

  const parsedBet = useMemo(() => {
    const n = Number(betInput);
    return Number.isFinite(n) ? Math.max(MIN_BET, Math.min(MAX_BET, n)) : MIN_BET;
  }, [betInput]);

  const betError = useMemo(() => {
    const n = Number(betInput);
    if (!Number.isFinite(n) || n < MIN_BET) return `Min ${MIN_BET} ETB`;
    if (n > MAX_BET) return `Max ${MAX_BET.toLocaleString()} ETB`;
    return null;
  }, [betInput]);

  const firstRowMult   = useMemo(() => calcTowerMult(difficulty, 1),  [difficulty]);
  const firstRowPayout = useMemo(() => Math.floor(parsedBet * firstRowMult), [parsedBet, firstRowMult]);
  const topMult        = useMemo(() => calcTowerMult(difficulty, rows), [difficulty, rows]);
  const topPayout      = useMemo(() => Math.floor(parsedBet * topMult), [parsedBet, topMult]);

  const currentMult   = session?.currentMultiplier ?? 1;
  const currentPayout = session ? Math.floor(session.betAmount * currentMult).toLocaleString() : '—';

  const fmt2 = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #111108 0%, #0d0d09 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.60)',
  };

  return (
    <div style={panelStyle}>

      {/* ── Balance strip ──────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.025)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '4px' }}>
            Balance
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#f3f4f6', fontFamily: "'Rajdhani', monospace", lineHeight: 1 }}>
              {fmt2(userBalance)}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>ETB</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
            color: todayProfit >= 0 ? '#34d399' : '#f87171',
          }}>
            {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString()} ETB
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today</div>
        </div>
      </div>

      {/* ── Error / result banners ─────────────────────────────────────── */}
      {error && (
        <div style={{
          margin: '12px 16px 0', padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
          fontSize: '12px', color: '#fca5a5', fontWeight: 600,
        }}>⚠ {error}</div>
      )}

      {isGameOver && session && (
        <div style={{
          margin: '12px 16px 0', padding: '12px 16px', borderRadius: '10px', textAlign: 'center',
          background: session.status !== 'lost' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${session.status !== 'lost' ? 'rgba(245,158,11,0.28)' : 'rgba(239,68,68,0.28)'}`,
        }}>
          <div style={{
            fontSize: '14px', fontWeight: 800,
            color: session.status !== 'lost' ? '#fbbf24' : '#f87171',
          }}>
            {session.status !== 'lost' ? '🏆 Tower Cleared!' : '💥 Dragon caught you!'}
          </div>
          {session.payout > 0 && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontFamily: 'monospace' }}>
              +{session.payout.toLocaleString()} ETB · {session.currentMultiplier.toFixed(2)}x
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ── Bet amount ─────────────────────────────────────────────────── */}
        {!isActive && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Label>Bet Amount</Label>
              {betError && <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>{betError}</span>}
            </div>

            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="number"
                value={betInput}
                onChange={e => { setBetInput(e.target.value); setActiveChip(null); }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.45)',
                  border: `1.5px solid ${betError ? 'rgba(239,68,68,0.50)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '10px',
                  padding: '12px 48px 12px 14px',
                  color: '#f3f4f6',
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => {
                  if (!betError) (e.target as HTMLInputElement).style.borderColor = 'rgba(245,158,11,0.55)';
                }}
                onBlur={e => {
                  (e.target as HTMLInputElement).style.borderColor = betError ? 'rgba(239,68,68,0.50)' : 'rgba(255,255,255,0.12)';
                }}
                min={MIN_BET}
                max={MAX_BET}
              />
              <span style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '11px', fontWeight: 700, color: '#6b7280',
              }}>ETB</span>
            </div>

            {/* Quick chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {BET_CHIPS.map(v => {
                const active = activeChip === v;
                return (
                  <button
                    key={v}
                    onClick={() => { setBetInput(String(v)); setActiveChip(v); }}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#fbbf24' : '#9ca3af',
                    }}
                  >
                    {v >= 1000 ? `${v / 1000}K` : v}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Difficulty ─────────────────────────────────────────────────── */}
        {!isActive && (
          <div>
            <Label>Difficulty</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => {
                const cfg = DIFFICULTY_CONFIG[d];
                const sel = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      padding: '10px 4px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: sel ? cfg.bg : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${sel ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <span style={{
                      fontSize: '11px', fontWeight: 800,
                      color: sel ? cfg.accent : '#6b7280',
                      transition: 'color 0.15s',
                    }}>{cfg.label}</span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, fontFamily: 'monospace',
                      color: sel ? cfg.accent : '#4b5563',
                      background: sel ? `${cfg.accent}18` : 'rgba(255,255,255,0.05)',
                      padding: '1px 5px', borderRadius: '4px',
                    }}>{cfg.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tower height ───────────────────────────────────────────────── */}
        {!isActive && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <Label>Tower Height</Label>
              <span style={{
                fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
                color: '#fbbf24',
              }}>{rows} floors</span>
            </div>

            <input
              type="range" min={3} max={12} value={rows}
              onChange={e => setRows(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b', marginBottom: '10px' }}
            />

            {/* Payout range */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            }}>
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '9px', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                  Floor 1
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#fbbf24' }}>
                  {firstRowMult.toFixed(2)}x
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {firstRowPayout.toLocaleString()} ETB
                </div>
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '9px', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                  Top ({rows} floors)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>
                  {topMult.toFixed(2)}x
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {topPayout.toLocaleString()} ETB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Active session stats ────────────────────────────────────────── */}
        {isActive && session && (
          <div>
            {/* Current floor indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: '10px', marginBottom: '12px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.08) 100%)',
              border: '1px solid rgba(245,158,11,0.30)',
            }}>
              <div>
                <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  Current Floor
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace', lineHeight: 1 }}>
                  {session.currentRow} <span style={{ fontSize: '13px', color: '#92400e' }}>/ {session.rows}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  Multiplier
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace', lineHeight: 1 }}>
                  {currentMult.toFixed(2)}x
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
              <InfoRow label="Bet"    value={`${session.betAmount.toLocaleString()} ETB`} />
              <InfoRow label="Cashout" value={`${currentPayout} ETB`} accent="#fbbf24" />
              <InfoRow label="Difficulty" value={session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)} />
            </div>
          </div>
        )}

        {/* ── CTA button ─────────────────────────────────────────────────── */}
        {!isActive ? (
          <button
            onClick={() => { if (!betError && !isLoading) onStart(parsedBet, difficulty, rows); }}
            disabled={!!betError || isLoading}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: betError || isLoading ? 'not-allowed' : 'pointer',
              opacity: betError || isLoading ? 0.55 : 1,
              background: isLoading
                ? 'rgba(180,100,10,0.50)'
                : 'linear-gradient(135deg, #92400e 0%, #d97706 55%, #fbbf24 200%)',
              boxShadow: betError || isLoading ? 'none' : '0 4px 28px rgba(245,158,11,0.38)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '0.03em',
              transition: 'all 0.20s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.30)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.75s linear infinite',
                }} />
                Starting…
              </span>
            ) : (
              <>
                <span>🐉 Climb the Tower</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  {parsedBet.toLocaleString()} ETB · up to {topMult.toFixed(2)}x
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => { if (!isLoading) onCashOut(); }}
            disabled={isLoading || (session?.revealedRows.length ?? 0) === 0}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: isLoading || (session?.revealedRows.length ?? 0) === 0 ? 'not-allowed' : 'pointer',
              opacity: isLoading || (session?.revealedRows.length ?? 0) === 0 ? 0.45 : 1,
              background: 'linear-gradient(135deg, #047857 0%, #059669 55%, #10b981 200%)',
              boxShadow: '0 4px 28px rgba(16,185,129,0.32)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '0.03em',
              transition: 'all 0.20s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.30)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.75s linear infinite',
                }} />
                Processing…
              </span>
            ) : (
              <>
                <span>💰 Cash Out</span>
                <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(255,255,255,0.80)' }}>
                  {currentPayout} ETB · {currentMult.toFixed(2)}x
                </span>
              </>
            )}
          </button>
        )}

        {/* Seed footer */}
        {isActive && session && (
          <p style={{ textAlign: 'center', fontSize: '10px', color: '#374151', fontFamily: 'monospace', margin: 0 }}>
            🔒 {session.serverSeedHash.slice(0, 16)}…
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}