/**
 * lib/kenoConstants.ts
 *
 * Frontend mirror of backend/lib/kenoEngine.js constants.
 * SINGLE SOURCE OF TRUTH for the frontend — import from here, not from
 * individual components.
 *
 * ⚠️  If you change VALID_BETS or PAYOUT_MAP on the backend you MUST
 *     update this file to match or the UI will show incorrect max-payout hints.
 */

/** ETB wager amounts accepted by the system. Must match backend VALID_BETS. */
export const VALID_BETS = [10, 20, 30, 50, 100] as const;

export type ValidBet = (typeof VALID_BETS)[number];

/**
 * Maximum gross payout for each bet amount.
 * Key = bet in ETB, Value = max payout in ETB.
 * Must match backend PAYOUT_MAP.
 */
export const PAYOUT_MAP: Record<ValidBet, number> = {
  10:  20,
  20:  40,
  30:  60,
  50:  100,
  100: 200,
};

/** Match-ratio thresholds — must match backend PAYOUT_THRESHOLDS. */
export const PAYOUT_THRESHOLDS = {
  FULL: 0.8,
  HALF: 0.5,
} as const;

/**
 * Compute the client-side payout preview (mirrors backend calculatePayout).
 * Used only for display hints — the server is authoritative for real payouts.
 */
export function previewPayout(
  matchCount: number,
  spots: number,
  betAmount: number
): number {
  const maxPayout = PAYOUT_MAP[betAmount as ValidBet];
  if (!maxPayout || spots === 0) return 0;
  const ratio = matchCount / spots;
  if (ratio >= PAYOUT_THRESHOLDS.FULL) return maxPayout;
  if (ratio >= PAYOUT_THRESHOLDS.HALF) return Math.round(maxPayout * 0.5);
  return 0;
}
