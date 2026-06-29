// components/dragon-tower/DragonTowerGrid.tsx
/**
 * DashBets — Dragon Tower Grid
 *
 * FIX: totalCols now derives from difficulty (easy/medium = 3, hard = 4).
 * Previously hardcoded to 4, which allowed column index 3 to be sent for
 * easy/medium, causing the backend to return a 400 "Invalid egg index" error.
 */

import React, { useCallback } from 'react';
import type { DragonTowerSession, Difficulty } from '../../lib/api/dragonTowerApi';

type CellState = 'pending' | 'active' | 'safe' | 'dragon' | 'revealed-dragon' | 'revealed-safe';

// ── Column count by difficulty (must match dragonTowerEngine.js DIFFICULTY_CONFIG) ──
const COLS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy:   3,
  medium: 3,
  hard:   4,
};

interface DragonTowerGridProps {
  session:   DragonTowerSession | null;
  layout?:   boolean[][];
  onPick:    (col: number) => void;
  disabled:  boolean;
  isShaking: boolean;
}

interface CellProps {
  state:    CellState;
  col:      number;
  row:      number;
  mult?:    number;
  onClick:  () => void;
  disabled: boolean;
  isShaking: boolean;
}

// ── Cell ───────────────────────────────────────────────────────────────────
function Cell({ state, col, row, mult, onClick, disabled, isShaking }: CellProps) {
  const isClickable = state === 'active' && !disabled;

  let containerStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '14px',
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.18s ease',
    userSelect: 'none',
    cursor: isClickable ? 'pointer' : 'default',
  };

  switch (state) {
    case 'pending':
      containerStyle = { ...containerStyle,
        background: 'rgba(15,10,2,0.70)',
        borderColor: 'rgba(80,60,10,0.35)',
        opacity: 0.45,
      };
      break;
    case 'active':
      containerStyle = { ...containerStyle,
        background: isClickable
          ? 'linear-gradient(145deg, rgba(40,28,4,0.95) 0%, rgba(60,40,5,0.95) 100%)'
          : 'rgba(20,15,2,0.70)',
        borderColor: isClickable ? 'rgba(245,158,11,0.75)' : 'rgba(245,158,11,0.25)',
        boxShadow: isClickable ? '0 0 18px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,220,100,0.10)' : 'none',
        opacity: isClickable ? 1 : 0.45,
        transform: 'none',
      };
      break;
    case 'safe':
      containerStyle = { ...containerStyle,
        background: 'linear-gradient(145deg, rgba(25,18,2,0.95) 0%, rgba(40,28,3,0.95) 100%)',
        borderColor: 'rgba(251,191,36,0.85)',
        boxShadow: '0 0 22px rgba(251,191,36,0.30), inset 0 1px 0 rgba(255,220,80,0.15)',
      };
      break;
    case 'dragon':
      containerStyle = { ...containerStyle,
        background: 'linear-gradient(145deg, rgba(35,5,5,0.97) 0%, rgba(50,8,8,0.97) 100%)',
        borderColor: 'rgba(239,68,68,0.90)',
        boxShadow: '0 0 28px rgba(239,68,68,0.50)',
        animation: isShaking ? 'shake 0.65s ease-in-out forwards' : 'none',
      };
      break;
    case 'revealed-dragon':
      containerStyle = { ...containerStyle,
        background: 'rgba(20,5,5,0.60)',
        borderColor: 'rgba(180,60,60,0.30)',
        opacity: 0.55,
      };
      break;
    case 'revealed-safe':
      containerStyle = { ...containerStyle,
        background: 'rgba(5,12,5,0.50)',
        borderColor: 'rgba(30,80,30,0.25)',
        opacity: 0.40,
      };
      break;
  }

  const renderContent = () => {
    switch (state) {
      case 'pending':
        return <span style={{ fontSize: '24px', opacity: 0.35 }}>🥚</span>;

      case 'active':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '26px',
              animation: isClickable ? 'eggFloat 2s ease-in-out infinite' : 'none',
              filter: isClickable ? 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' : 'none',
            }}>🥚</span>
            {isClickable && (
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'monospace',
              }}>Pick</span>
            )}
          </div>
        );

      case 'safe':
        return (
          <>
            <span style={{
              fontSize: '26px',
              filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.95)) drop-shadow(0 0 5px rgba(245,158,11,1))',
            }}>🐉</span>
            {mult != null && (
              <span style={{
                fontSize: '9px', fontWeight: 700, color: '#fde68a',
                marginTop: '2px', fontFamily: 'monospace',
              }}>{mult.toFixed(2)}x</span>
            )}
          </>
        );

      case 'dragon':
        return (
          <span style={{
            fontSize: '28px',
            filter: 'drop-shadow(0 0 14px rgba(239,68,68,1))',
          }}>🔥</span>
        );

      case 'revealed-dragon':
        return <span style={{ fontSize: '22px', opacity: 0.55, filter: 'drop-shadow(0 0 5px rgba(249,115,22,0.45))' }}>🐉</span>;

      case 'revealed-safe':
        return <span style={{ fontSize: '22px', opacity: 0.35 }}>🥚</span>;

      default:
        return null;
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `Pick egg ${col + 1} on row ${row + 1}` : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      style={containerStyle}
      onMouseEnter={isClickable ? e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px) scale(1.04)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 28px rgba(245,158,11,0.40), inset 0 1px 0 rgba(255,220,100,0.15)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.95)';
      } : undefined}
      onMouseLeave={isClickable ? e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 18px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,220,100,0.10)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245,158,11,0.75)';
      } : undefined}
    >
      {renderContent()}
    </div>
  );
}

// ── Row multiplier label ────────────────────────────────────────────────────
function RowMultBadge({ mult, isCurrent, isCleared }: { mult: number; isCurrent: boolean; isCleared: boolean }) {
  return (
    <div style={{
      fontSize: '10px',
      fontWeight: 700,
      fontFamily: 'monospace',
      padding: '3px 8px',
      borderRadius: '8px',
      minWidth: '56px',
      textAlign: 'center',
      transition: 'all 0.2s',
      background: isCurrent
        ? 'rgba(245,158,11,0.20)'
        : isCleared
        ? 'rgba(52,211,153,0.12)'
        : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isCurrent
        ? 'rgba(245,158,11,0.55)'
        : isCleared
        ? 'rgba(52,211,153,0.28)'
        : 'rgba(255,255,255,0.07)'}`,
      color: isCurrent ? '#fcd34d' : isCleared ? '#6ee7b7' : '#374151',
    }}>
      {mult.toFixed(2)}x
    </div>
  );
}

// ── Main Grid ──────────────────────────────────────────────────────────────
export function DragonTowerGrid({ session, layout, onPick, disabled, isShaking }: DragonTowerGridProps) {
  const totalRows    = session?.rows       ?? 9;
  const currentRow   = session?.currentRow ?? 0;
  const revealedRows = session?.revealedRows ?? [];
  const status       = session?.status ?? 'active';
  const isActive     = status === 'active';
  const difficulty   = session?.difficulty ?? 'medium';

  // BUG FIX: derive column count from difficulty to match backend validation
  const totalCols = COLS_BY_DIFFICULTY[difficulty];

  const getRowMult = useCallback((rowIdx: number): number => {
    const rev = revealedRows.find(r => r.row === rowIdx);
    if (rev) return rev.multiplier;
    const remaining = totalRows - rowIdx;
    return Math.pow(1.35, remaining);
  }, [revealedRows, totalRows]);

  const getCellState = useCallback((rowIdx: number, colIdx: number): CellState => {
    const rev = revealedRows.find(r => r.row === rowIdx);
    if (rev) {
      if (rev.pickedCol === colIdx) return rev.wasSafe ? 'safe' : 'dragon';
      if (!isActive && layout?.[rowIdx]?.[colIdx] === false) return 'revealed-dragon';
      return 'revealed-safe';
    }
    if (isActive && rowIdx === currentRow) return 'active';
    if (!isActive && layout?.[rowIdx]?.[colIdx] === false) return 'revealed-dragon';
    return 'pending';
  }, [revealedRows, currentRow, isActive, layout]);

  // Render rows bottom-to-top (row 0 = ground floor, shown at bottom)
  const rowIndices = Array.from({ length: totalRows }, (_, i) => totalRows - 1 - i);

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          10% { transform: translate(-6px,-3px) rotate(-4deg); }
          30% { transform: translate(-7px,2px) rotate(-3deg); }
          50% { transform: translate(-5px,3px) rotate(-4deg); }
          70% { transform: translate(-3px,1px) rotate(-2deg); }
          90% { transform: translate(-1px,0) rotate(0deg); }
        }
        @keyframes eggFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes rowSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .tower-cell-row {
          animation: rowSlideIn 0.25s ease-out both;
        }
      `}</style>

      <div style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 65%), #0c0800',
        border: '2px solid rgba(245,158,11,0.22)',
        borderRadius: '20px',
        padding: '20px 16px',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0 0 60px rgba(245,158,11,0.06), inset 0 1px 0 rgba(255,220,80,0.06)',
        backgroundImage: `
          radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 65%),
          linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)
        `,
        backgroundSize: 'auto, 24px 24px, 24px 24px',
      }}>
        {/* Ambient corner glows */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🏰</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Dragon Tower</span>
          </div>
          {session && (
            <div style={{
              fontSize: '10px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '8px', color: '#fbbf24', fontFamily: 'monospace',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
            }}>
              {revealedRows.length} / {totalRows} floors
            </div>
          )}
        </div>

        {!session ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#374151' }}>
            <span style={{ fontSize: '52px', marginBottom: '12px', opacity: 0.35 }}>🐉</span>
            <p style={{ fontSize: '13px' }}>Place your bet to start climbing</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {rowIndices.map((rowIdx, renderIdx) => {
              const isCurrent = isActive && rowIdx === currentRow;
              const isCleared = revealedRows.some(r => r.row === rowIdx && r.wasSafe);
              const mult      = getRowMult(rowIdx);
              const rowOpacity = !isActive && rowIdx > (revealedRows.length - 1) ? 0.45 : 1;

              return (
                <div
                  key={rowIdx}
                  className="tower-cell-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: rowOpacity,
                    animationDelay: `${renderIdx * 0.015}s`,
                    transition: 'opacity 0.3s',
                  }}
                >
                  {/* Row number */}
                  <div style={{
                    width: '22px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textAlign: 'right',
                    flexShrink: 0,
                    fontFamily: 'monospace',
                    color: isCurrent ? '#fcd34d' : '#2d3748',
                  }}>
                    {rowIdx + 1}
                  </div>

                  {/* Eggs — totalCols now matches backend difficulty config */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {Array.from({ length: totalCols }, (_, colIdx) => (
                      <Cell
                        key={colIdx}
                        state={getCellState(rowIdx, colIdx)}
                        col={colIdx}
                        row={rowIdx}
                        mult={revealedRows.find(r => r.row === rowIdx && r.pickedCol === colIdx)?.multiplier}
                        onClick={() => onPick(colIdx)}
                        disabled={disabled}
                        isShaking={isShaking && getCellState(rowIdx, colIdx) === 'dragon'}
                      />
                    ))}
                  </div>

                  {/* Multiplier badge */}
                  <RowMultBadge mult={mult} isCurrent={isCurrent} isCleared={isCleared} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}