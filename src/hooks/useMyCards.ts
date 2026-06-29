/**
 * hooks/useMyCards.ts
 *
 * Returns ALL cards the authenticated user holds in a bingo room.
 * Replaces useBingoCard for multi-card gameplay.
 *
 * Design mirrors useBingoCard's BUG-06 fix:
 *   matchedCells is computed locally from drawnBalls — no extra API call per ball.
 *   winningCells is derived from server-set matchedIndices (populated after room:gameOver).
 *
 * Usage:
 *   const { cards, canAddMore, loading, error, refetch } = useMyCards(roomId, drawnBalls);
 *   // After each confirmCard(), call refetch() to add the new card to the deck.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMyCards, flatToGrid, matchedIndicesToMatrix } from '../lib/api/bingoApi';
import type { WinPattern } from '../lib/api/bingoApi';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CardState {
  cardNumber:     number;
  /** 5×5 grid of cell values (0 = FREE). */
  card:           number[][];
  /** true for each cell whose value has been drawn (or FREE). Computed locally. */
  matchedCells:   boolean[][];
  /** Flat indices of the winning line — populated after room:gameOver. */
  matchedIndices: number[];
  /** 5×5 boolean matrix of winning line — null until win. */
  winningCells:   boolean[][] | null;
  isActive:       boolean;
}

export interface UseMyCardsReturn {
  cards:      CardState[];
  canAddMore: boolean;
  maxCards:   number;
  loading:    boolean;
  error:      string | null;
  /** Call after each confirmCard() to refresh the card list. */
  refetch:    () => Promise<void>;
  /**
   * Apply server win data for a specific card.
   * Called from the game page when room:gameOver arrives with matchedIndices.
   */
  applyWinData: (cardNumber: number, matchedIndices: number[]) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMyCards(
  roomId:     string | null,
  drawnBalls: number[]
): UseMyCardsReturn {
  // Raw server data: flat grids + matchedIndices
  interface RawCard {
    cardNumber:     number;
    card:           number[];      // flat
    matchedIndices: number[];
    isActive:       boolean;
  }

  const [rawCards, setRawCards]     = useState<RawCard[]>([]);
  const [canAddMore, setCanAddMore] = useState(false);
  const [maxCards, setMaxCards]     = useState(5);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // winData is kept separately so applyWinData() doesn't require a refetch
  const [winData, setWinData] = useState<Record<number, number[]>>({});

  const fetchCards = useCallback(async () => {
    // BUG-19 pattern: set loading=false immediately when roomId is null
    if (!roomId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyCards(roomId);
      if (!res.success) {
        setError((res as { error: string }).error);
      } else {
        setRawCards(
          res.cards.map((c) => ({
            cardNumber:     c.cardNumber,
            card:           c.card,
            matchedIndices: c.matchedIndices,
            isActive:       c.isActive,
          }))
        );
        setCanAddMore(res.canAddMore);
        setMaxCards(res.maxCards ?? 5);
        setError(null);
        // Seed winData from server (in case page is refreshed mid-game)
        const initial: Record<number, number[]> = {};
        for (const c of res.cards) {
          if (c.matchedIndices.length > 0) initial[c.cardNumber] = c.matchedIndices;
        }
        setWinData((prev) => ({ ...initial, ...prev }));
      }
    } catch {
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Fetch on mount / roomId change.
  // BUG-06 pattern: drawnBalls is NOT in the dependency list — matchedCells is local.
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Apply win data for a specific card number (called from game page on gameOver)
  const applyWinData = useCallback((cardNumber: number, indices: number[]) => {
    setWinData((prev) => ({ ...prev, [cardNumber]: indices }));
  }, []);

  // BUG-06: Compute matchedCells locally — no round-trip per drawn ball
  const cards = useMemo((): CardState[] => {
    const drawn = new Set(drawnBalls);
    return rawCards.map((raw) => {
      const grid = flatToGrid(raw.card);
      const matchedCells = grid.map((row) =>
        row.map((cell) => cell === 0 || drawn.has(cell))
      );
      const effectiveIndices = winData[raw.cardNumber] ?? raw.matchedIndices;
      const winningCells =
        effectiveIndices.length > 0 ? matchedIndicesToMatrix(effectiveIndices) : null;

      return {
        cardNumber:     raw.cardNumber,
        card:           grid,
        matchedCells,
        matchedIndices: effectiveIndices,
        winningCells,
        isActive:       raw.isActive,
      };
    });
  }, [rawCards, drawnBalls, winData]);

  return {
    cards,
    canAddMore,
    maxCards,
    loading,
    error,
    refetch: fetchCards,
    applyWinData,
  };
}