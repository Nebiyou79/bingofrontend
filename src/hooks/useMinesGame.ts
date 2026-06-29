// hooks/useMinesGame.ts
/**
 * DashBets — useMinesGame Hook
 *
 * Mirrors hooks/useBingoCard.ts:
 *   - useState for all local state
 *   - useCallback for stable action references
 *   - useEffect for initial load (resume active game on mount)
 *   - useMemo for derived values
 *   - Never throws — surfaces errors via `error` string
 *
 * Fix (race condition):
 *   The hook now accepts an `authReady` boolean parameter. When false,
 *   the mount effect skips the API call entirely. The page passes
 *   `!authLoading` from useAuthContext so the call only fires after
 *   checkAuth() has written the JWT to localStorage, eliminating the
 *   401 race between AuthContext hydration and this hook's useEffect.
 */

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  startGame    as apiStartGame,
  revealTile   as apiRevealTile,
  cashOut      as apiCashOut,
  getCurrent   as apiGetCurrent,
  MinesGameState,
} from '../lib/api/minesApi';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TileState =
  | 'hidden'          // not yet revealed
  | 'safe'            // revealed, no mine
  | 'mine'            // revealed mine (game over)
  | 'unrevealed-mine' // shown after game over (mines player didn't hit)
  | 'exploded';       // the tile the player actually clicked that had a mine

export interface MinesHookReturn {
  // State
  gameState:   MinesGameState | null;
  tileStates:  TileState[];       // length 25, indexed 0–24
  isLoading:   boolean;
  isRevealing: boolean;           // true while a reveal/cashout request is in-flight
  error:       string | null;
  lastHitTile: number | null;     // index of the tile that caused a loss

  // Derived
  potentialPayout: number;        // betAmount * currentMultiplier
  isGameOver:      boolean;
  isActive:        boolean;
  canCashOut:      boolean;

  // Actions
  startGame:  (betAmount: number, mineCount: number, clientSeed?: string) => Promise<void>;
  revealTile: (tileIndex: number) => Promise<void>;
  cashOut:    () => Promise<void>;
  resetGame:  () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * @param authReady  Pass `!authLoading` from useAuthContext.
 *                   The hook will not fire any API call until this is true,
 *                   guaranteeing the JWT is already in localStorage.
 */
export function useMinesGame(authReady: boolean = true): MinesHookReturn {
  const [gameState,   setGameState]   = useState<MinesGameState | null>(null);
  // Start true only while authReady is false, so the grid shows a skeleton.
  // Once authReady flips, we immediately kick off loadCurrent.
  const [isLoading,   setIsLoading]   = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastHitTile, setLastHitTile] = useState<number | null>(null);

  // ── Resume active game on mount — gated on authReady ───────────────────────
  useEffect(() => {
    // Do not fire until the auth context has finished hydrating.
    // This is the core fix: without this guard, the fetch races against
    // checkAuth() writing the token to localStorage, producing a 401.
    if (!authReady) return;

    let cancelled = false;
    async function loadCurrent() {
      setIsLoading(true);
      try {
        const res = await apiGetCurrent();
        if (cancelled) return;
        if (res.success && res.game) {
          setGameState(res.game);
        }
        // Non-success just means no active game — not an error worth surfacing
      } catch {
        // Swallow network errors on mount; user can start a new game
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCurrent();
    return () => { cancelled = true; };
  }, [authReady]); // re-run if authReady changes (e.g. token refreshed)

  // ── Derived tile states ─────────────────────────────────────────────────────
  const tileStates = useMemo<TileState[]>(() => {
    const states: TileState[] = Array(25).fill('hidden');
    if (!gameState) return states;

    const revealed = new Set(gameState.revealedTiles);
    const mines    = new Set(gameState.minePositions ?? []);
    const isOver   = gameState.status !== 'active';

    for (let i = 0; i < 25; i++) {
      if (revealed.has(i)) {
        // All revealed tiles during an active game are safe by definition
        states[i] = 'safe';
      } else if (isOver && mines.has(i)) {
        // Show mine positions after game ends
        states[i] = (i === lastHitTile && gameState.status === 'lost')
          ? 'exploded'
          : 'unrevealed-mine';
      }
      // else remains 'hidden'
    }

    // Ensure the exact clicked tile is marked exploded (it is never added to
    // revealedTiles by the server on a mine hit; lastHitTile carries it locally)
    if (lastHitTile !== null && gameState.status === 'lost') {
      states[lastHitTile] = 'exploded';
    }

    return states;
  }, [gameState, lastHitTile]);

  // ── Derived booleans ────────────────────────────────────────────────────────
  const isGameOver = useMemo(
    () => !!gameState && gameState.status !== 'active',
    [gameState]
  );
  const isActive = useMemo(
    () => !!gameState && gameState.status === 'active',
    [gameState]
  );
  const canCashOut = useMemo(
    () => isActive && (gameState?.revealedTiles.length ?? 0) > 0,
    [isActive, gameState]
  );
  const potentialPayout = useMemo(() => {
    if (!gameState) return 0;
    return Math.floor(gameState.betAmount * gameState.currentMultiplier);
  }, [gameState]);

  // ── startGame ───────────────────────────────────────────────────────────────
  const startGame = useCallback(async (
    betAmount:   number,
    mineCount:   number,
    clientSeed?: string
  ) => {
    setError(null);
    setLastHitTile(null);
    setIsLoading(true);
    try {
      const res = await apiStartGame(betAmount, mineCount, clientSeed);
      if (!res.success) {
        setError(res.error);
      } else {
        setGameState(res.game);
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── revealTile ──────────────────────────────────────────────────────────────
  const revealTile = useCallback(async (tileIndex: number) => {
    if (!gameState || gameState.status !== 'active' || isRevealing) return;

    setError(null);
    setIsRevealing(true);
    try {
      const res = await apiRevealTile(gameState._id, tileIndex);
      if (!res.success) {
        setError(res.error);
      } else {
        if (res.hit) setLastHitTile(tileIndex);
        setGameState(res.game);
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to reveal tile');
    } finally {
      setIsRevealing(false);
    }
  }, [gameState, isRevealing]);

  // ── cashOut ─────────────────────────────────────────────────────────────────
  const cashOut = useCallback(async () => {
    if (!gameState || !canCashOut || isRevealing) return;

    setError(null);
    setIsRevealing(true);
    try {
      const res = await apiCashOut(gameState._id);
      if (!res.success) {
        setError(res.error);
      } else {
        setGameState(res.game);
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to cash out');
    } finally {
      setIsRevealing(false);
    }
  }, [gameState, canCashOut, isRevealing]);

  // ── resetGame ───────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    setGameState(null);
    setError(null);
    setLastHitTile(null);
    setIsLoading(false);
    setIsRevealing(false);
  }, []);

  return {
    gameState,
    tileStates,
    isLoading,
    isRevealing,
    error,
    lastHitTile,
    potentialPayout,
    isGameOver,
    isActive,
    canCashOut,
    startGame,
    revealTile,
    cashOut,
    resetGame,
  };
}