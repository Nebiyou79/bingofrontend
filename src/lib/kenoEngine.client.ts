// lib/kenoEngine.client.ts
/**
 * Frontend mirror of backend/lib/kenoEngine.js payout constants.
 * Keep in sync with the backend.
 */

export const PAYOUT_TABLE: Record<number, Record<number, number>> = {
  1:  { 1: 3 },
  2:  { 2: 5 },
  3:  { 2: 2,   3: 20 },
  4:  { 2: 1.5, 3: 10,  4: 80 },
  5:  { 3: 3,   4: 20,  5: 200 },
  6:  { 3: 1.5, 4: 5,   5: 50,  6: 1000 },
  7:  { 4: 5,   5: 50,  6: 200, 7: 2000 },
  8:  { 4: 5,   5: 15,  6: 50,  7: 200,  8: 2000 },
  9:  { 4: 2,   5: 10,  6: 30,  7: 100,  8: 500,   9: 2500 },
  10: { 5: 5,   6: 20,  7: 80,  8: 300,  9: 1000, 10: 5000 },
};

export function getPayoutRows(spots: number): { match: number; multiplier: number }[] {
  const row = PAYOUT_TABLE[spots] ?? {};
  return Object.entries(row)
    .map(([m, mult]) => ({ match: Number(m), multiplier: mult }))
    .sort((a, b) => a.match - b.match);
}

export function getMultiplier(spots: number, matchCount: number): number {
  return PAYOUT_TABLE[spots]?.[matchCount] ?? 0;
}

export const MIN_BET   = 1;
export const MAX_BET   = 10_000;
export const MAX_SPOTS = 10;
export const MIN_SPOTS = 1;
