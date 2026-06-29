/**
 * hooks/useBingoCard.ts
 *
 * @deprecated For multi-card gameplay, use `useMyCards` instead.
 *   This hook returns only the first card a player holds in a room.
 *   It remains for backwards-compatibility with pages that have not yet
 *   migrated to the multi-card flow.
 *
 * BUG-06 FIX: No longer re-fetches the API on every ball draw.
 * matchedCells is now computed locally from drawnBalls — the card grid
 * doesn't change during a game so there's nothing new to fetch each ball.
 * The API is still fetched on mount and after a shuffle (card grid change).
 *
 * BUG-19 FIX: loading is set to false when roomId is null.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPlayerCard, flatToGrid, matchedIndicesToMatrix } from '../lib/api/bingoApi';
import type { PlayerCard, WinPattern } from '../lib/api/bingoApi';

export interface UseBingoCardReturn {
  card: number[][] | null;
  cardNumber: number | null;
  /** Computed locally from drawnBalls — no extra API call needed. */
  matchedCells: boolean[][] | null;
  /** 5×5 boolean matrix of the winning line (server-set after win). */
  winningCells: boolean[][] | null;
  matchedIndices: number[];
  activePattern: WinPattern | null;
  loading: boolean;
  error: string | null;
  isMarked: (cellValue: number) => boolean;
  /** Call after shuffle to force a re-fetch of the new card grid. */
  refetch: () => Promise<void>;
}

export function useBingoCard(
  roomId: string | null,
  drawnBalls: number[]
): UseBingoCardReturn {
  const [cardData, setCardData] = useState<PlayerCard | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchCard = useCallback(async () => {
    // BUG-19 FIX: set loading=false immediately when roomId is null
    if (!roomId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getPlayerCard(roomId);
      if (!res.success) {
        setError((res as { error: string }).error);
      } else {
        setCardData(res as unknown as PlayerCard);
        setError(null);
      }
    } catch {
      setError('Failed to load card');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Fetch on mount and when roomId changes.
  // BUG-06 FIX: drawnBalls.length is REMOVED from the dependency list.
  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  // BUG-06 FIX: Compute matchedCells locally from drawn balls.
  const matchedCells = useMemo((): boolean[][] | null => {
    if (!cardData?.card) return null;
    const drawn = new Set(drawnBalls);
    const grid  = flatToGrid(cardData.card);
    return grid.map((row) =>
      row.map((cell) => cell === 0 || drawn.has(cell))
    );
  }, [cardData?.card, drawnBalls]);

  const isMarked = useCallback(
    (cellValue: number): boolean => {
      if (cellValue === 0) return true;
      return drawnBalls.includes(cellValue);
    },
    [drawnBalls]
  );

  const matchedIndices = cardData?.matchedIndices ?? [];
  const winningCells   =
    matchedIndices.length > 0 ? matchedIndicesToMatrix(matchedIndices) : null;

  const cardGrid = cardData?.card ? flatToGrid(cardData.card) : null;

  return {
    card:           cardGrid,
    cardNumber:     cardData?.cardNumber ?? null,
    matchedCells,
    winningCells,
    matchedIndices,
    activePattern:  cardData?.activePattern ?? null,
    loading,
    error,
    isMarked,
    refetch:        fetchCard,
  };
}