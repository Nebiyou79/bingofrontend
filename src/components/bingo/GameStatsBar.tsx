/**
 * components/bingo/GameStatsBar.tsx — Premium stats bar with auto-mark toggle
 * Casino-grade horizontal stat strip with mute and auto-mark controls.
 */

import React from 'react';

interface GameStatsBarProps {
  jackpotPool: number;
  stakeAmount: number;
  callCount: number;
  playerCount: number;
  cardsSold?: number;
  muted: boolean;
  autoMark: boolean;
  onToggleMute: () => void;
  onToggleAutoMark: () => void;
}

function StatBox({
  label, value, valueColor, icon,
}: {
  label: string; value: React.ReactNode; valueColor?: string; icon?: string;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl min-w-0 gap-0.5"
      style={{ 
        background: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(255,255,255,0.06)' 
      }}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      <span
        className="text-sm font-black leading-none truncate w-full text-center"
        style={{ 
          color: valueColor ?? '#fff', 
          fontFamily: "'Rajdhani', sans-serif" 
        }}
      >
        {value}
      </span>
      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ToggleButton({
  label,
  icon,
  active,
  activeColor,
  onToggle,
}: {
  label: string;
  icon: string;
  active: boolean;
  activeColor: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center justify-center py-2 px-2.5 rounded-xl gap-0.5 transition-all min-w-[2.5rem]"
      style={{
        background: active ? `${activeColor}15` : 'rgba(255,255,255,0.03)',
        border: active 
          ? `1px solid ${activeColor}30` 
          : '1px solid rgba(255,255,255,0.06)',
      }}
      aria-label={label}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span 
        className="text-[8px] font-bold uppercase tracking-wider"
        style={{ color: active ? activeColor : '#475569' }}
      >
        {active ? label : label}
      </span>
    </button>
  );
}

export function GameStatsBar({
  jackpotPool,
  stakeAmount,
  callCount,
  playerCount,
  cardsSold,
  muted,
  autoMark,
  onToggleMute,
  onToggleAutoMark,
}: GameStatsBarProps) {
  return (
    <div className="flex flex-wrap items-stretch gap-1.5 w-full">
      <StatBox
        icon="💰"
        label="Jackpot"
        value={`${jackpotPool.toLocaleString()} ETB`}
        valueColor="#F7B500"
      />
      <StatBox 
        icon="🎫" 
        label="Stake" 
        value={stakeAmount} 
      />
      <StatBox
        icon="🎱"
        label="Called"
        value={callCount}
        valueColor="#00E676"
      />
      <StatBox
        icon="👥"
        label="Players"
        value={playerCount}
        valueColor="#7C3AED"
      />
      {cardsSold !== undefined && (
        <StatBox
          icon="🃏"
          label="Cards"
          value={cardsSold}
          valueColor="#F7B500"
        />
      )}
      
      {/* Toggle Controls */}
      <div className="flex gap-1.5">
        <ToggleButton
          label="Auto"
          icon={autoMark ? '🤖' : '✋'}
          active={autoMark}
          activeColor="#00E676"
          onToggle={onToggleAutoMark}
        />
        <ToggleButton
          label="Sound"
          icon={muted ? '🔇' : '🔊'}
          active={!muted}
          activeColor="#7C3AED"
          onToggle={onToggleMute}
        />
      </div>
    </div>
  );
}