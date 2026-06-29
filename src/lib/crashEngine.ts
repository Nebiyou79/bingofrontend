// lib/crashEngine.ts
// Client-side copy of the crash multiplier formula.
// Must stay in sync with server/lib/crashEngine.js

/**
 * Calculate multiplier at elapsed time.
 * Mirrors server formula exactly for smooth between-tick animation.
 *
 * @param startTime - Date.now() when the round started flying
 * @param now       - current Date.now()
 */
export function getMultiplierAtTime(startTime: number, now: number): number {
  const elapsed = now - startTime;
  return Math.floor(100 * Math.pow(Math.E, 0.00006 * elapsed)) / 100;
}

/**
 * Colour for multiplier display.
 */
export function multiplierColor(mult: number): string {
  if (mult >= 10) return '#ffa657';
  if (mult >= 5)  return '#e3b341';
  if (mult >= 2)  return '#3fb950';
  return '#58a6ff';
}
