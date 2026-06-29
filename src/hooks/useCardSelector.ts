/**
 * hooks/useCardSelector.ts
 * Manages the card-selection flow on the select.tsx page.
 *
 * Key fix: fetchSlots dependency array no longer includes `selectedCard`
 * to prevent an infinite re-fetch loop when a card is selected.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAvailableCards,
  previewCard as previewCardApi,
  confirmCard as confirmCardApi,
  flatToGrid,
} from '../lib/api/bingoApi';
import type { CardSlot } from '../lib/api/bingoApi';

export interface UseCardSelectorReturn {
  slots: CardSlot[];
  myCardNumber: number | null;
  selectedCard: number | null;
  previewGrid: number[][] | null;
  loadingSlots: boolean;
  loadingPreview: boolean;
  confirming: boolean;
  error: string | null;
  selectCard: (cardNumber: number) => Promise<void>;
  shufflePick: () => Promise<void>;
  confirm: () => Promise<{ roomId: string; cardNumber: number } | null>;
  refetchSlots: () => Promise<void>;
}

export function useCardSelector(roomId: string | null): UseCardSelectorReturn {
  const [slots, setSlots]               = useState<CardSlot[]>([]);
  const [myCardNumber, setMyCardNumber] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [previewGrid, setPreviewGrid]   = useState<number[][] | null>(null);
  const [loadingSlots, setLoadingSlots]     = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // Use a ref so fetchSlots is stable and doesn't re-run when selectedCard changes
  const selectedCardRef = useRef<number | null>(null);
  selectedCardRef.current = selectedCard;

  const fetchSlots = useCallback(async () => {
    if (!roomId) return;
    setLoadingSlots(true);
    try {
      const res = await getAvailableCards(roomId);
      if (!res.success) {
        setError((res as { error: string }).error);
        return;
      }
      setSlots(res.slots);
      setMyCardNumber(res.myCardNumber);
      // Pre-select the user's already-confirmed card (idempotent re-entry)
      if (res.myCardNumber && selectedCardRef.current === null) {
        setSelectedCard(res.myCardNumber);
      }
    } catch {
      setError('Failed to load available cards');
    } finally {
      setLoadingSlots(false);
    }
  }, [roomId]); // ← stable — does NOT depend on selectedCard

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const selectCard = useCallback(async (cardNumber: number) => {
    if (!roomId) return;
    setSelectedCard(cardNumber);
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await previewCardApi(roomId, cardNumber);
      if (!res.success) {
        setError((res as { error: string }).error);
        return;
      }
      setPreviewGrid(flatToGrid(res.card));
    } catch {
      setError('Failed to load card preview');
    } finally {
      setLoadingPreview(false);
    }
  }, [roomId]);

  const shufflePick = useCallback(async () => {
    const free = slots.filter((s) => !s.taken);
    if (free.length === 0) {
      setError('No free cards available');
      return;
    }
    const pick = free[Math.floor(Math.random() * free.length)];
    await selectCard(pick.cardNumber);
  }, [slots, selectCard]);

  const confirm = useCallback(async (): Promise<{ roomId: string; cardNumber: number } | null> => {
    if (!roomId || selectedCard === null) return null;
    setConfirming(true);
    setError(null);
    try {
      const res = await confirmCardApi(roomId, selectedCard);
      if (!res.success) {
        const e = res as { error: string; message?: string };
        setError(e.message ?? e.error);
        return null;
      }
      return { roomId: res.roomId, cardNumber: res.cardNumber };
    } catch {
      setError('Failed to confirm card. Please try again.');
      return null;
    } finally {
      setConfirming(false);
    }
  }, [roomId, selectedCard]);

  return {
    slots, myCardNumber, selectedCard, previewGrid,
    loadingSlots, loadingPreview, confirming, error,
    selectCard, shufflePick, confirm,
    refetchSlots: fetchSlots,
  };
}