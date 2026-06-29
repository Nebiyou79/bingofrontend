/**
 * components/bingo/CardNumberGrid.tsx
 * Multi-card aware card grid with Pick Random button.
 * 
 * Color legend:
 *   🟩 Green  → My confirmed cards (locked)
 *   🟨 Amber  → Pending preview (click to deselect)
 *   🟦 Blue   → Taken by others (disabled)
 *   ⬜ Gray   → Available (clickable)
 */

import React from 'react';

interface CardNumberGridProps {
  totalCards?: number;         // default 200
  takenCards: number[];        // taken by other players
  myCards: number[];           // confirmed cards (green, locked)
  pendingCard?: number | null; // previewing but not confirmed (amber)
  onSelect: (n: number) => void;
  onPickRandom?: () => void;
  loading?: boolean;
}

export function CardNumberGrid({
  totalCards = 200,
  takenCards,
  myCards,
  pendingCard = null,
  onSelect,
  onPickRandom,
  loading = false,
}: CardNumberGridProps) {
  const takenSet = new Set(takenCards);
  const mySet = new Set(myCards);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-lg animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="w-3 h-3 rounded bg-green-500 border border-green-400/50" />
          My Cards
        </span>
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="w-3 h-3 rounded bg-amber-400 border border-amber-400/50" />
          Selected
        </span>
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400/50" />
          Taken
        </span>
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="w-3 h-3 rounded bg-gray-700 border border-gray-600/50" />
          Available
        </span>
      </div>

      {/* Pick Random Button */}
      <div className="flex justify-center">
        <button
          onClick={onPickRandom}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.15))',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          <span className="text-base">🎲</span>
          Pick Random Card
        </button>
      </div>

      {/* Grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
        {Array.from({ length: totalCards }, (_, i) => {
          const num = i + 1;
          const isMyCard = mySet.has(num);
          const isPending = pendingCard === num;
          const isTaken = takenSet.has(num) && !isMyCard;

          let style: React.CSSProperties = {};
          let className = 'flex items-center justify-center rounded-lg text-xs font-bold h-9 select-none transition-all duration-150 ';
          let isDisabled = false;

          if (isMyCard) {
            // Green - my confirmed card (locked)
            style = {
              background: 'linear-gradient(135deg, #00E676, #00c853)',
              color: '#000',
              boxShadow: '0 0 12px rgba(0,230,118,0.4)',
              border: '1px solid rgba(0,230,118,0.6)',
              transform: 'scale(1.05)',
            };
            className += 'z-10 relative cursor-not-allowed';
            isDisabled = true;
          } else if (isPending) {
            // Amber - pending preview (click to deselect)
            style = {
              background: 'linear-gradient(135deg, #F7B500, #d97706)',
              color: '#000',
              boxShadow: '0 0 12px rgba(247,181,0,0.4)',
              border: '1px solid rgba(247,181,0,0.6)',
              transform: 'scale(1.05)',
            };
            className += 'z-10 relative cursor-pointer';
          } else if (isTaken) {
            // Blue - taken by others (disabled)
            style = {
              background: 'rgba(79,70,229,0.2)',
              color: '#4F46E5',
              border: '1px solid rgba(79,70,229,0.3)',
              cursor: 'not-allowed',
              opacity: 0.6,
            };
            isDisabled = true;
          } else {
            // Gray - available (clickable)
            style = {
              background: 'rgba(255,255,255,0.04)',
              color: '#94A3B8',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
            };
            className += 'hover:bg-purple-600/20 hover:text-purple-300 hover:border-purple-500/40 hover:scale-105 active:scale-95';
          }

          return (
            <button
              key={num}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(num)}
              className={className}
              style={style}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}