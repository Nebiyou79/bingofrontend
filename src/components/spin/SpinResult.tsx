/**
 * components/spin/SpinResult.tsx
 * Overlay panel shown after a spin completes.
 *
 * - WIN / JACKPOT / BONUS: green glow, payout details
 * - LOSS: muted gray, encouragement copy
 * - REFUND: amber warning, refund confirmation
 *
 * Auto-dismisses after 4 seconds. The user can also dismiss early
 * with "Spin Again".
 */

import React, { useEffect } from 'react';
import type { SpinResult as SpinResultType } from '../../lib/api/spinApi';

interface SpinResultProps {
  result: SpinResultType;
  /** Called when the overlay should close (auto-dismiss or button press) */
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4000;

/**
 * Result overlay for a completed spin.
 * Automatically calls `onDismiss` after 4 seconds.
 */
export function SpinResult({ result, onDismiss }: SpinResultProps) {
  const isRefund = result.result === 'REFUND';
  const isLoss = !result.isWin && !isRefund;
  const isWin = result.isWin;

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  // ── Theming ────────────────────────────────────────────────────────────────
  // NOTE: Tailwind's JIT does not reliably generate slash-opacity utilities
  // (bg-green-900/30, shadow-[...]) in this build (see console errors), which
  // was causing the card to render borderless/transparent — i.e. just the
  // emoji + text floating with no visible panel. Inline rgba() styles are
  // always emitted, so we use those instead, matching the approach already
  // used in WinModal.tsx / BetControls.tsx.
  const containerStyle: React.CSSProperties = isWin
    ? {
        border: '2px solid #4ade80',
        background: 'rgba(20,83,45,0.3)',
        boxShadow: '0 0 40px rgba(74,222,128,0.25)',
      }
    : isRefund
    ? {
        border: '2px solid #fbbf24',
        background: 'rgba(120,53,15,0.2)',
        boxShadow: '0 0 30px rgba(251,191,36,0.2)',
      }
    : {
        border: '2px solid #4b5563',
        background: 'rgba(31,41,55,0.6)',
      };
  const containerClass =
    'relative rounded-2xl p-6 text-center transition-all duration-300';

  const resultLabel = (() => {
    if (isRefund) return '⚠️ Spin Failed';
    if (result.result === 'JACKPOT') return '🏆 JACKPOT!';
    if (result.multiplier === 3) return '🎉 BONUS WIN!';
    if (isWin) return '✅ You Won!';
    return '😔 Better luck next time';
  })();

  const resultColor = isWin
    ? 'text-green-300'
    : isRefund
    ? 'text-amber-300'
    : 'text-gray-400';

  return (
    <div className={containerClass} style={containerStyle} role="status" aria-live="polite">
      {/* Multiplier badge */}
      {result.multiplier > 0 && !isRefund && (
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest mb-3"
          style={
            result.result === 'JACKPOT'
              ? { background: '#facc15', color: '#111827' }
              : isWin
              ? { background: 'rgba(34,197,94,0.3)', color: '#86efac', border: '1px solid #22c55e' }
              : { background: '#374151', color: '#9ca3af' }
          }
        >
          {result.multiplier}× MULTIPLIER
        </span>
      )}

      {/* Main result label */}
      <h2 className={`text-2xl font-extrabold mb-2 ${resultColor}`}>
        {resultLabel}
      </h2>

      {/* Payout details */}
      {isWin && (
        <div className="space-y-1 my-3">
          <p className="text-4xl font-black text-green-300">
            +{result.netPayout.toLocaleString()} ETB
          </p>
          {result.commission > 0 && (
            <p className="text-xs text-gray-500 font-mono">
              Gross {result.grossWin} ETB — Commission {result.commission} ETB
            </p>
          )}
        </div>
      )}

      {isLoss && (
        <p className="text-gray-500 text-sm my-2 font-mono">
          Bet: {result.betAmount} ETB · Result: LOSS
        </p>
      )}

      {isRefund && (
        <p className="text-amber-300 text-lg font-bold my-2">
          {result.betAmount.toLocaleString()} ETB refunded
        </p>
      )}

      {/* New balance */}
      <p className="text-xs font-mono tracking-widest text-gray-400 mt-3">
        New balance:{' '}
        <span className="text-amber-400 font-semibold">
          {result.newBalance.toLocaleString()} ETB
        </span>
      </p>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className={[
          'mt-4 px-8 py-2 rounded-full text-sm font-semibold tracking-wide transition-colors',
          isWin
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : isRefund
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200',
        ].join(' ')}
      >
        Spin Again
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl bg-gray-700 w-full overflow-hidden">
        <div
          className={[
            'h-full animate-[shrink_4s_linear_forwards]',
            isWin ? 'bg-green-400' : isRefund ? 'bg-amber-400' : 'bg-gray-500',
          ].join(' ')}
          style={{
            animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}