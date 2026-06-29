/**
 * hooks/useBingoLobby.ts
 * Polls getLobbySnapshot() every 10 seconds and groups rooms by stakeAmount.
 * §1.6 — RoomSnapshot now includes possibleWin + isBonus.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLobbySnapshot } from '../lib/api/bingoApi';
import type { RoomSnapshot } from '../lib/api/bingoApi';

export type GroupedRooms = Record<number, RoomSnapshot>;

export interface UseBingoLobbyReturn {
  rooms: GroupedRooms;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const POLL_INTERVAL_MS = 10_000;

export function useBingoLobby(): UseBingoLobbyReturn {
  const [rooms, setRooms]     = useState<GroupedRooms>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await getLobbySnapshot();
      if (!res.success) {
        setError((res as { error: string }).error);
        return;
      }
      const grouped: GroupedRooms = {};
      for (const snap of res.snapshot) {
        const existing = grouped[snap.stakeAmount];
        if (!existing || snap.playerCount > existing.playerCount) {
          grouped[snap.stakeAmount] = snap;
        }
      }
      setRooms(grouped);
      setError(null);
    } catch {
      setError('Failed to load lobby');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    timerRef.current = setInterval(fetchSnapshot, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchSnapshot]);

  return { rooms, loading, error, refetch: fetchSnapshot };
}
