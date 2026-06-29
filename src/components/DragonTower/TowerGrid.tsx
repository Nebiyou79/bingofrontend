// components/DragonTower/TowerGrid.tsx
'use client';

import { useMemo } from 'react';
import type { RevealedRow, Difficulty } from '@/lib/api/dragonTowerApi';

interface TowerGridProps {
  rows: number;
  difficulty: Difficulty;
  currentRow: number;
  revealedRows: RevealedRow[];
  /** Full layout — only present once the round has ended (loss or cashout/clear). */
  finalLayout?: boolean[][] | null;
  status: 'betting' | 'playing' | 'result';
  loading: boolean;
  onPick: (col: number) => void;
}

const EGGS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 3,
  medium: 3,
  hard: 4,
};

export function TowerGrid({
  rows,
  difficulty,
  currentRow,
  revealedRows,
  finalLayout,
  status,
  loading,
  onPick,
}: TowerGridProps) {
  const totalEggs = EGGS_BY_DIFFICULTY[difficulty];

  // Build a quick lookup: row -> { pickedCol, wasSafe } for rows already played this round
  const revealedByRow = useMemo(() => {
    const map = new Map<number, RevealedRow>();
    for (const r of revealedRows) map.set(r.row, r);
    return map;
  }, [revealedRows]);

  // Render top-to-bottom: highest row index at the top of the tower
  const rowIndices = useMemo(
    () => Array.from({ length: rows }, (_, i) => rows - 1 - i),
    [rows]
  );

  return (
    <div className="dt-tower" style={{ '--dt-eggs': totalEggs } as React.CSSProperties}>
      {rowIndices.map((row) => {
        const revealed = revealedByRow.get(row);
        const isCurrentRow = status === 'playing' && row === currentRow;
        const isCleared = row < currentRow;
        const isFuture = row > currentRow;
        const finalRow = finalLayout?.[row];

        return (
          <div
            key={row}
            className={[
              'dt-row',
              isCurrentRow ? 'dt-row-active' : '',
              isCleared ? 'dt-row-cleared' : '',
              isFuture ? 'dt-row-locked' : '',
            ].join(' ')}
          >
            <div className="dt-row-index">{row + 1}</div>

            <div className="dt-eggs">
              {Array.from({ length: totalEggs }, (_, col) => {
                const wasPicked = revealed?.pickedCol === col;

                // Determine this egg's visual state:
                //  - 'safe' / 'trap'      → this exact egg was picked this round
                //  - 'unpicked-safe'      → round ended on THIS row via a trap pick,
                //                           and the final layout reveal shows this
                //                           other egg in the row was actually safe
                //  - 'idle'               → playable or already-cleared, not yet picked
                //  - 'locked'             → future row, not yet reachable
                let eggState: 'idle' | 'safe' | 'trap' | 'unpicked-safe' | 'locked' = 'locked';

                if (isCurrentRow || isCleared) {
                  eggState = 'idle';
                }

                if (wasPicked && revealed) {
                  eggState = revealed.wasSafe ? 'safe' : 'trap';
                } else if (
                  finalRow &&
                  revealed &&
                  !revealed.wasSafe &&
                  row === revealed.row &&
                  finalRow[col] === true
                ) {
                  // This row busted on a different egg — reveal the safe one(s) for context
                  eggState = 'unpicked-safe';
                }

                const clickable = isCurrentRow && !loading && status === 'playing';

                return (
                  <button
                    key={col}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && onPick(col)}
                    className={`dt-egg dt-egg-${eggState} ${clickable ? 'dt-egg-clickable' : ''}`}
                    aria-label={`Row ${row + 1}, slot ${col + 1}`}
                  >
                    <span className="dt-egg-icon">
                      {eggState === 'safe' && <SafeIcon />}
                      {eggState === 'trap' && <TrapIcon />}
                      {eggState === 'unpicked-safe' && <SafeIcon dim />}
                      {(eggState === 'idle' || eggState === 'locked') && <EggIcon />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .dt-tower {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border-radius: 16px;
          background:
            radial-gradient(120% 100% at 50% 0%, rgba(132, 255, 99, 0.06), transparent 60%),
            var(--dt-surface);
          border: 1px solid var(--dt-border);
          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.4);
        }
        .dt-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 10px;
          transition: background 0.25s ease, opacity 0.25s ease;
        }
        .dt-row-active {
          background: linear-gradient(90deg, rgba(132, 255, 99, 0.1), transparent);
          box-shadow: inset 0 0 0 1px rgba(132, 255, 99, 0.25);
        }
        .dt-row-cleared {
          opacity: 0.55;
        }
        .dt-row-locked {
          opacity: 0.3;
        }
        .dt-row-index {
          width: 22px;
          flex-shrink: 0;
          font-family: var(--dt-font-mono);
          font-size: 11px;
          color: var(--dt-text-dim);
          text-align: right;
        }
        .dt-eggs {
          display: grid;
          grid-template-columns: repeat(var(--dt-eggs), 1fr);
          gap: 8px;
          flex: 1;
        }
        .dt-egg {
          aspect-ratio: 1;
          border-radius: 12px;
          border: 1px solid var(--dt-border);
          background: var(--dt-egg-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
          position: relative;
          transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .dt-egg-clickable {
          cursor: pointer;
        }
        .dt-egg-clickable:hover {
          transform: translateY(-2px) scale(1.04);
          border-color: var(--dt-toxic);
          background: rgba(132, 255, 99, 0.08);
        }
        .dt-egg-clickable:active {
          transform: translateY(0) scale(0.97);
        }
        .dt-egg-safe {
          border-color: var(--dt-toxic);
          background: rgba(132, 255, 99, 0.14);
          animation: dtReveal 0.32s ease-out;
        }
        .dt-egg-trap {
          border-color: var(--dt-danger);
          background: rgba(255, 59, 59, 0.16);
          animation: dtShake 0.4s ease-out;
        }
        .dt-egg-unpicked-safe {
          border-color: rgba(132, 255, 99, 0.3);
          opacity: 0.6;
        }
        .dt-egg-icon {
          width: 55%;
          height: 55%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes dtReveal {
          0% { transform: scale(0.7) rotate(-8deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes dtShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px) rotate(-2deg); }
          40% { transform: translateX(4px) rotate(2deg); }
          60% { transform: translateX(-3px) rotate(-1deg); }
          80% { transform: translateX(3px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}

// ── Inline icons — kept dependency-free (no external icon font/library assumed) ──

function EggIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <path
        d="M12 2C8 7 5 12.5 5 16.5C5 20.09 8.13 23 12 23C15.87 23 19 20.09 19 16.5C19 12.5 16 7 12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        className="dt-icon-stroke"
      />
    </svg>
  );
}

function SafeIcon({ dim = false }: { dim?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" opacity={dim ? 0.5 : 1}>
      <path
        d="M12 2C8 7 5 12.5 5 16.5C5 20.09 8.13 23 12 23C15.87 23 19 20.09 19 16.5C19 12.5 16 7 12 2Z"
        fill="rgba(132,255,99,0.2)"
        stroke="#84ff63"
        strokeWidth="1.5"
      />
      <path d="M8.5 13.5L11 16L16 10" stroke="#84ff63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <path
        d="M12 2C8 7 5 12.5 5 16.5C5 20.09 8.13 23 12 23C15.87 23 19 20.09 19 16.5C19 12.5 16 7 12 2Z"
        fill="rgba(255,59,59,0.2)"
        stroke="#ff3b3b"
        strokeWidth="1.5"
      />
      <path d="M9 9L15 15M15 9L9 15" stroke="#ff3b3b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}