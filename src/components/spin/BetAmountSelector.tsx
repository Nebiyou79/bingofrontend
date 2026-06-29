/**
 * components/spin/BetAmountSelector.tsx
 * Pill-button row for selecting a bet amount.
 * Disabled while the wheel is spinning or on cooldown.
 */

import React from 'react';

/** Valid bet amounts driven by spinEngine's VALID_BETS */
export const VALID_BETS = [10, 20, 30, 50, 100, 200] as const;
export type ValidBet = typeof VALID_BETS[number];

interface BetAmountSelectorProps {
  /** Currently selected bet amount */
  selected: number;
  /** Called when the user taps a different amount */
  onSelect: (amount: number) => void;
  /** User's live wallet balance in ETB */
  balance: number;
  /** Disable all buttons while spinning or in cooldown */
  disabled?: boolean;
}

/**
 * Renders a horizontal row of pill buttons — one per valid bet amount.
 * Amounts the user cannot afford are shown as faded but still tappable
 * (server-side validation is the authoritative check).
 */
export function BetAmountSelector({
  selected,
  onSelect,
  balance,
  disabled = false,
}: BetAmountSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Balance indicator */}
      <p className="text-xs font-mono tracking-widest text-gray-400 uppercase">
        Balance:{' '}
        <span className="text-amber-400 font-semibold">
          {balance.toLocaleString()} ETB
        </span>
      </p>

      {/* Pill grid */}
      <div className="flex flex-wrap justify-center gap-2">
        {VALID_BETS.map((amount) => {
          const isSelected = selected === amount;
          const canAfford = balance >= amount;

          return (
            <button
              key={amount}
              onClick={() => onSelect(amount)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`Bet ${amount} ETB`}
              className={[
                'relative px-5 py-2 rounded-full text-sm font-semibold tracking-wide',
                'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                'border',
                isSelected
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/50 scale-105'
                  : canAfford
                  ? 'bg-gray-800 border-gray-600 text-gray-200 hover:border-indigo-500 hover:text-indigo-300'
                  : 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed opacity-50',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {amount}
              <span className="ml-1 text-xs opacity-70">ETB</span>
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
