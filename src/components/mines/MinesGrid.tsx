// components/mines/MinesGrid.tsx

import React, { useCallback } from 'react';
import { TileState } from '../../hooks/useMinesGame';
import { IconGem, IconBomb } from '../icons/GameIcons';

interface MinesGridProps {
  tileStates:        TileState[];
  revealedTiles:     number[];
  tileMultipliers:   Record<number, number>;
  onTileClick:       (index: number) => void;
  disabled:          boolean;
  isShaking:         boolean;
}

interface TileProps {
  index:           number;
  state:           TileState;
  multiplier?:     number;
  onClick:         (index: number) => void;
  disabled:        boolean;
  isShaking:       boolean;
}

function Tile({ index, state, multiplier, onClick, disabled, isShaking }: TileProps) {
  const isClickable = state === 'hidden' && !disabled;

  const handleClick = useCallback(() => {
    if (isClickable) onClick(index);
  }, [isClickable, onClick, index]);

  const base = 'relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 transition-all duration-200 select-none overflow-hidden touch-manipulation ';

  let cls = base;
  switch (state) {
    case 'hidden':
      cls += isClickable
        ? [
            'bg-[#1a1d2e] border-[#2a2d42]',
            'active:border-[#6c63ff]/70 active:bg-[#1e2138]',
            'active:scale-95 active:shadow-lg active:shadow-[#6c63ff]/20',
            'hover:border-[#6c63ff]/70 hover:bg-[#1e2138]',
            'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6c63ff]/20',
            'cursor-pointer',
          ].join(' ')
        : 'bg-[#1a1d2e] border-[#1f2235] cursor-not-allowed opacity-50';
      break;
    case 'safe':
      cls += 'bg-[#0d1b3e] border-[#3b82f6]/80 shadow-lg shadow-[#3b82f6]/30';
      break;
    case 'exploded':
      cls += 'bg-[#3b0a0a] border-red-500 shadow-xl shadow-red-500/50 ' + (isShaking ? 'animate-shake' : '');
      break;
    case 'unrevealed-mine':
      cls += 'bg-[#2a1a0a] border-orange-600/50 opacity-80 ' + (isShaking ? 'animate-shake' : '');
      break;
    default:
      cls += 'bg-[#1a1d2e] border-[#2a2d42]';
  }

  const content = () => {
    switch (state) {
      case 'hidden':
        return (
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 opacity-30">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-xs sm:text-sm font-black">D</span>
            </div>
            <span className="text-[7px] sm:text-[9px] text-gray-500 font-bold tracking-widest">DashBets</span>
          </div>
        );

      case 'safe':
        return (
          <>
            <div className="animate-gem-reveal">
              <IconGem 
                size={window?.innerWidth < 640 ? 24 : 36}
                style={{ 
                  filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.9)) drop-shadow(0 0 4px rgba(147,197,253,1))' 
                }} 
              />
            </div>
            {multiplier != null && (
              <span className="text-[8px] sm:text-[10px] font-bold text-blue-300 mt-0.5 font-mono">
                {multiplier.toFixed(2)}x
              </span>
            )}
          </>
        );

      case 'exploded':
        return (
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(239,68,68,1))' }}>
            <IconBomb size={window?.innerWidth < 640 ? 24 : 36} />
          </div>
        );

      case 'unrevealed-mine':
        return (
          <div style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.7))' }}>
            <IconBomb size={window?.innerWidth < 640 ? 20 : 28} />
          </div>
        );

      default:
        return <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-700" />;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={cls}
      style={{ 
        aspectRatio: '1 / 1',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
      aria-label={isClickable ? `Reveal tile ${index + 1}` : `Tile ${index + 1}`}
    >
      {content()}
    </button>
  );
}

export function MinesGrid({
  tileStates,
  tileMultipliers,
  onTileClick,
  disabled,
  isShaking,
}: MinesGridProps) {
  return (
    <>
      <style>{`
        @keyframes gem-reveal {
          0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          55%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes shake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          10%     { transform: translate(-3px,-1px) rotate(-2deg); }
          20%     { transform: translate(3px,1px) rotate(2deg); }
          30%     { transform: translate(-3px,0px) rotate(-1deg); }
          40%     { transform: translate(3px,0px) rotate(1deg); }
          50%     { transform: translate(-2px,1px) rotate(-1deg); }
          60%     { transform: translate(2px,-1px) rotate(1deg); }
          70%     { transform: translate(-1px,0px) rotate(0deg); }
          80%     { transform: translate(1px,0px) rotate(0deg); }
          90%     { transform: translate(0,0) rotate(0deg); }
        }
        .animate-gem-reveal {
          animation: gem-reveal 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out forwards;
        }

        .mines-grid-bg {
          background-color: #0e1020;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        @media (min-width: 640px) {
          .mines-grid-bg {
            background-size: 24px 24px;
          }
        }
      `}</style>

      <div className="
        mines-grid-bg rounded-xl sm:rounded-2xl p-3 sm:p-4
        border-2 border-[#3b82f6]/30
        shadow-2xl shadow-[#3b82f6]/10
        w-full max-w-[350px] sm:max-w-[420px] md:max-w-[520px] mx-auto
        relative overflow-hidden
      ">
        {/* Corner accent glows */}
        <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10">
          {tileStates.map((state, i) => (
            <Tile
              key={i}
              index={i}
              state={state}
              multiplier={state === 'safe' ? tileMultipliers[i] : undefined}
              onClick={onTileClick}
              disabled={disabled}
              isShaking={isShaking && (state === 'exploded' || state === 'unrevealed-mine')}
            />
          ))}
        </div>
      </div>
    </>
  );
}