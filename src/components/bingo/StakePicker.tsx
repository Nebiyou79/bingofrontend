/**
 * components/bingo/StakePicker.tsx  (unchanged — kept for completeness)
 * Only the lobby page itself is being redesigned; this component is still
 * used in the join flow but StakePicker is no longer the primary lobby UI.
 */

import React from 'react';
import type { GroupedRooms } from '../../hooks/useBingoLobby';

const VALID_STAKES = [10, 20, 30, 50, 80, 100, 150, 200, 300];

interface StakePickerProps {
  selected: number | null;
  onSelect: (stake: number) => void;
  rooms: GroupedRooms;
  activeStakes?: number[];
}

export function StakePicker({ selected, onSelect, rooms, activeStakes = VALID_STAKES }: StakePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {VALID_STAKES.map((stake) => {
        const snap       = rooms[stake];
        const isActive   = activeStakes.includes(stake);
        const isSelected = selected === stake;

        return (
          <button
            key={stake}
            disabled={!isActive}
            onClick={() => isActive && onSelect(stake)}
            className={[
              'relative flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all duration-200 select-none',
              isSelected
                ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 shadow-lg shadow-indigo-500/20 scale-105'
                : isActive
                ? 'border-gray-700 bg-gray-800 text-gray-200 hover:border-indigo-500/60 hover:bg-gray-700 cursor-pointer'
                : 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed opacity-50',
            ].join(' ')}
          >
            <span className="text-xl font-black tracking-tight font-mono">
              {stake}<span className="text-xs font-semibold ml-0.5 opacity-70">ETB</span>
            </span>
            {snap ? (
              <div className="mt-1.5 flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {snap.playerCount} players
                </span>
                <span className="text-[10px] font-semibold text-yellow-500">
                  {snap.jackpotPool.toLocaleString()} ETB pool
                </span>
              </div>
            ) : (
              <span className="mt-1.5 text-[10px] text-gray-600">No active room</span>
            )}
            {isSelected && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">✓</span>
            )}
            {!isActive && (
              <span className="absolute top-1 right-1 text-[9px] bg-gray-800 text-gray-500 rounded px-1 py-0.5 font-medium">OFF</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
