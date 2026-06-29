// types/limbo.ts

export type LimboRoundStatus = 'betting' | 'running' | 'settled';

export interface LimboRoundPublic {
  roundId: string;
  roundNumber: number;
  status: LimboRoundStatus;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  secondsLeft: number;
  bettingEndsAt: string;
}

export interface LimboRunningPayload {
  roundId: string;
  roundNumber: number;
  runningStartedAt: string;
  durationMs: number;
}

export interface LimboSettledPayload {
  roundId: string;
  roundNumber: number;
  crashPoint: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  totalBets: number;
  totalWagered: number;
  totalPayout: number;
}

export interface LimboBet {
  _id: string;
  betAmount: number;
  targetMultiplier: number;
  status: 'pending' | 'settled';
  outcome: 'win' | 'lose' | null;
  payout: number;
  createdAt: string;
}

export type LimboPhase = 'connecting' | 'betting' | 'running' | 'settled';
