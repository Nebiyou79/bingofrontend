// types/blackjack.ts

export type BlackjackStatus = 'player_turn' | 'dealer_turn' | 'settled';
export type BlackjackOutcome = 'win' | 'lose' | 'push' | 'blackjack' | null;

export interface BlackjackHand {
  dealerScore: number;
  playerScore: number;
  _id: string;
  status: BlackjackStatus;
  betAmount: number;
  doubled: boolean;
  playerCards: string[];
  playerTotal: number;
  dealerCards: string[];       // second card is the literal string "HIDDEN" until settled
  dealerTotal: number | null;
  outcome: BlackjackOutcome;
  payout: number;
  createdAt: string;
  settledAt: string | null;
}

export interface BlackjackHistoryItem extends BlackjackHand {
  balanceBefore: number | null;
  balanceAfter: number | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  [key: string]: unknown;
  data?: T;
}

export interface ApiError {
  success: false;
  error: string;
  handId?: string;
}
