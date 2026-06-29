// lib/plinkoEngine.js
'use strict';

/**
 * DashBets — Plinko Engine
 *
 * Provably fair: HMAC-SHA256(serverSeed, clientSeed) → LCG seeded RNG
 * mirrors bingoEngine.js seededShuffle / kenoEngine.js structure.
 *
 * Ball path: for each of `rows` peg rows, the LCG produces a float.
 *   < 0.5  → "L" (left deflection)
 *   >= 0.5 → "R" (right deflection)
 * bucketIndex = count of "R" steps (0 = far left, rows = far right).
 *
 * Payout tables are the canonical Stake / BC.Game values adjusted for
 * ~4% house edge, covering all 9 combinations of rows × risk.
 */

const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ROWS  = [8, 12, 16];
const VALID_RISKS = ['low', 'medium', 'high'];
const MIN_BET     = 1;
const MAX_BET     = 10_000;

// ─────────────────────────────────────────────────────────────────────────────
// Bucket multiplier tables
// BUCKET_TABLES[rows][risk] → array of length (rows + 1), symmetric.
// Index 0 = far-left edge (highest payout), index rows/2 = centre (lowest).
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET_TABLES = {
  8: {
    low: [
      5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6,
    ],
    medium: [
      13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13,
    ],
    high: [
      29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29,
    ],
  },
  12: {
    low: [
      10, 3, 1.4, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 1.4, 3, 10,
    ],
    medium: [
      33, 11, 4, 2, 0.6, 0.3, 0.2, 0.3, 0.6, 2, 4, 11, 33,
    ],
    high: [
      141, 26, 5.5, 2, 0.4, 0.2, 0.1, 0.2, 0.4, 2, 5.5, 26, 141,
    ],
  },
  16: {
    low: [
      16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16,
    ],
    medium: [
      88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.2, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88,
    ],
    high: [
      1000, 130, 26, 9, 4, 2, 0.7, 0.5, 0.3, 0.5, 0.7, 2, 4, 9, 26, 130, 1000,
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LCG seeded from HMAC (mirrors bingoEngine.seededShuffle pattern)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a seeded LCG PRNG from an HMAC-SHA256 hash.
 * Returns a function that yields floats in [0, 1).
 *
 * @param {string} serverSeed
 * @param {string} clientSeed
 * @returns {() => number}
 */
function buildLCG(serverSeed, clientSeed) {
  const hash  = crypto
    .createHmac('sha256', serverSeed)
    .update(clientSeed)
    .digest('hex');
  let state = parseInt(hash.slice(0, 8), 16) >>> 0; // seed from first 4 bytes
  return () => {
    state = ((state * 1_664_525) + 1_013_904_223) >>> 0; // LCG params
    return state / 0x1_0000_0000;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate the full ball path for a single drop.
 *
 * @param {string} serverSeed
 * @param {string} clientSeed
 * @param {number} rows  — must be 8, 12, or 16
 * @returns {{ path: ('L'|'R')[], bucketIndex: number, hash: string }}
 */
function generatePath(serverSeed, clientSeed, rows) {
  if (!VALID_ROWS.includes(rows)) {
    throw new Error(`Invalid rows: ${rows}. Must be one of ${VALID_ROWS.join(', ')}`);
  }

  const hash = crypto
    .createHmac('sha256', serverSeed)
    .update(clientSeed)
    .digest('hex');

  const rand  = buildLCG(serverSeed, clientSeed);
  const path  = [];

  for (let i = 0; i < rows; i++) {
    path.push(rand() < 0.5 ? 'L' : 'R');
  }

  const bucketIndex = path.filter(d => d === 'R').length;

  return { path, bucketIndex, hash };
}

/**
 * Calculate payout for a given result.
 *
 * @param {number} betAmount   — in ETB
 * @param {number} rows
 * @param {'low'|'medium'|'high'} risk
 * @param {number} bucketIndex — 0-indexed
 * @returns {{ multiplier: number, payout: number }}
 */
function calculatePayout(betAmount, rows, risk, bucketIndex) {
  const table      = BUCKET_TABLES[rows]?.[risk];
  if (!table) throw new Error(`Invalid rows/risk: ${rows}/${risk}`);
  const multiplier = table[bucketIndex];
  if (multiplier === undefined) {
    throw new Error(`Invalid bucketIndex ${bucketIndex} for rows=${rows}`);
  }
  return {
    multiplier,
    payout: Math.round(betAmount * multiplier),
  };
}

/**
 * Generate a provably fair seed/hash pair (same pattern as bingoEngine).
 * Publish the hash before the drop; reveal the seed in the response for
 * player verification.
 *
 * @returns {{ serverSeed: string, serverSeedHash: string }}
 */
function generateServerSeed() {
  const serverSeed     = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto
    .createHash('sha256')
    .update(serverSeed)
    .digest('hex');
  return { serverSeed, serverSeedHash };
}

/**
 * Validate bet input.
 * @param {number} betAmount
 * @param {number} rows
 * @param {string} risk
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBet(betAmount, rows, risk) {
  if (!betAmount || betAmount < MIN_BET || betAmount > MAX_BET) {
    return { valid: false, error: `Bet must be between ${MIN_BET} and ${MAX_BET} ETB` };
  }
  if (!VALID_ROWS.includes(Number(rows))) {
    return { valid: false, error: `Rows must be one of: ${VALID_ROWS.join(', ')}` };
  }
  if (!VALID_RISKS.includes(risk)) {
    return { valid: false, error: `Risk must be one of: ${VALID_RISKS.join(', ')}` };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  generatePath,
  calculatePayout,
  generateServerSeed,
  validateBet,
  BUCKET_TABLES,
  VALID_ROWS,
  VALID_RISKS,
  MIN_BET,
  MAX_BET,
};
