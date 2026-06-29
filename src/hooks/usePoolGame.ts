/**
 * hooks/usePoolGame.ts
 *
 * FIXES applied:
 *   1. Accepts `mainToken` and forwards to usePoolSocket (not socketToken)
 *   2. pool:join_room emitted in useEffect (not render body)
 *   3. snapshotCallbackRef typed as MutableRefObject<SnapshotCallback | null>
 */

import { useReducer, useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePoolSocket } from './usePoolSocket';
import type {
  PoolGameState, PoolPlayerState, GameEndPayload, GameStartPayload,
  ShotResultPayload, RoomJoinedPayload, OpponentJoinedPayload,
  ReconnectStatePayload, OpponentDisconnectedPayload, ForfeitWinPayload,
  PoolErrorPayload, PlayerGroup,
} from '../types/pool';
import type { SnapshotCallback } from './useBallInterpolation';

function makeInitialState(gameId: string, mode: string, myUserId: string): PoolGameState {
  return {
    gameId, mode: mode as PoolGameState['mode'], status: 'waiting',
    myPlayerId: myUserId, opponent: null, isMyTurn: false,
    ballPositions: [], ballsOnTable: [], scores: { p1: 0, p2: 0 },
    currentTarget: 3, myGroup: null, opponentGroup: null, tableOpen: true,
    lastShotResult: null, foulMessage: null, foulVisible: false,
    stake: 0, prize: 0, newBalance: null, endResult: null,
    waitingFor: null, turnOrder: [], controlsLocked: false,
    disconnectGrace: null, error: null, players: [], currentTurn: null,
  };
}

type Action =
  | { type: 'ROOM_JOINED';      payload: RoomJoinedPayload }
  | { type: 'OPPONENT_JOINED';  payload: OpponentJoinedPayload }
  | { type: 'GAME_START';       payload: GameStartPayload;     myUserId: string }
  | { type: 'SHOT_FIRED' }
  | { type: 'SHOT_REJECTED';    payload: { reason: string } }
  | { type: 'SHOT_RESULT';      payload: ShotResultPayload;   myUserId: string; mySlot: 'p1' | 'p2'; wasMyTurn: boolean }
  | { type: 'GAME_END';         payload: GameEndPayload }
  | { type: 'RECONNECT_STATE';  payload: ReconnectStatePayload; myUserId: string }
  | { type: 'DISCONNECT_GRACE'; payload: OpponentDisconnectedPayload }
  | { type: 'DISMISS_FOUL' }
  | { type: 'SET_ERROR';        payload: string }
  | { type: 'CLEAR_ERROR' };

const FOUL_MSGS: Partial<Record<string, string>> = {
  scratch:                             'Scratch!',
  scratch_on_break:                    'Scratch on break!',
  scratch_on_eight_ball:               'Scratched on 8-ball — you lose!',
  eight_ball_early:                    '8-ball pocketed too early — you lose!',
  eight_ball_first_contact_open_table: 'Cannot hit 8-ball first on open table.',
  wrong_ball_first:                    'Wrong ball hit first!',
  no_contact:                          'No ball contact — foul!',
  wrong_contact:                       'Wrong first contact — penalty applied.',
};

function makeFoulMsg(foulType: string | null, ballInHand: boolean): string {
  const base = (foulType ? FOUL_MSGS[foulType] : null) ?? 'Foul!';
  return ballInHand ? `${base} Opponent gets ball in hand.` : base;
}

function reducer(state: PoolGameState, action: Action): PoolGameState {
  switch (action.type) {
    case 'ROOM_JOINED':
      return { ...state, gameId: action.payload.gameId, waitingFor: action.payload.waitingFor };

    case 'OPPONENT_JOINED':
      return { ...state, waitingFor: null,
        opponent: { id: action.payload.opponent.id, username: action.payload.opponent.username } };

    case 'GAME_START': {
      const d = action.payload; const myId = action.myUserId;
      const opp = d.turnOrder.find(p => p.userId !== myId) ?? null;
      const players: PoolPlayerState[] = d.turnOrder.map(p => ({
        userId: p.userId, username: p.username, group: null, score: 0, isCpu: p.username === 'CPU',
      }));
      return { ...state, status: 'active', mode: d.mode, stake: d.stake, turnOrder: d.turnOrder,
        players, opponent: opp ? { id: opp.userId, username: opp.username } : state.opponent,
        isMyTurn: d.currentTurnUserId === myId, currentTurn: d.currentTurnUserId,
        ballPositions: d.ballPositions, ballsOnTable: d.ballsOnTable,
        scores: d.scores, currentTarget: d.currentTarget, tableOpen: d.tableOpen,
        waitingFor: null, controlsLocked: false };
    }

    case 'SHOT_FIRED':
      return { ...state, controlsLocked: true, foulVisible: false };

    case 'SHOT_REJECTED':
      return { ...state, controlsLocked: false, error: action.payload.reason };

    case 'SHOT_RESULT': {
      const r = action.payload; const myId = action.myUserId;
      let myGroup: PlayerGroup = state.myGroup;
      let opponentGroup: PlayerGroup = state.opponentGroup;
      if (r.groupAssigned && r.assignedGroup) {
        if (action.wasMyTurn) { myGroup = r.assignedGroup; opponentGroup = r.assignedGroup === 'solids' ? 'stripes' : 'solids'; }
        else { opponentGroup = r.assignedGroup; myGroup = r.assignedGroup === 'solids' ? 'stripes' : 'solids'; }
      } else if (r.p1Group || r.p2Group) {
        myGroup = action.mySlot === 'p1' ? r.p1Group : r.p2Group;
        opponentGroup = action.mySlot === 'p1' ? r.p2Group : r.p1Group;
      }
      const players = state.players.map((p, i) => ({
        ...p, group: (i === 0 ? r.p1Group : r.p2Group) ?? p.group,
        score: i === 0 ? r.scores.p1 : r.scores.p2,
      }));
      const msg = r.foul ? makeFoulMsg(r.foulType, r.ballInHand) : null;
      return { ...state, ballsOnTable: r.ballsOnTable, scores: r.scores,
        currentTarget: r.nextTarget, tableOpen: r.tableOpen, myGroup, opponentGroup, players,
        currentTurn: r.nextTurnUserId, isMyTurn: r.nextTurnUserId === myId,
        lastShotResult: r, foulMessage: msg, foulVisible: !!msg, controlsLocked: false };
    }

    case 'GAME_END':
      return { ...state, status: 'ended', endResult: action.payload,
        prize: action.payload.prize, newBalance: action.payload.newBalance,
        isMyTurn: false, controlsLocked: true };

    case 'RECONNECT_STATE': {
      const d = action.payload; const myId = action.myUserId;
      const isP1 = d.players[0]?.userId === myId;
      return { ...state, status: 'active', ballsOnTable: d.ballsOnTable, scores: d.scores,
        currentTarget: d.currentTarget, tableOpen: d.tableOpen,
        myGroup: isP1 ? d.p1Group : d.p2Group, opponentGroup: isP1 ? d.p2Group : d.p1Group,
        currentTurn: d.currentTurnUserId, isMyTurn: d.currentTurnUserId === myId,
        turnOrder: d.players, waitingFor: null };
    }

    case 'DISCONNECT_GRACE': return { ...state, disconnectGrace: action.payload.gracePeriodSecs };
    case 'DISMISS_FOUL':     return { ...state, foulVisible: false };
    case 'SET_ERROR':        return { ...state, error: action.payload };
    case 'CLEAR_ERROR':      return { ...state, error: null };
    default: return state;
  }
}

interface UsePoolGameParams {
  gameId:     string;
  mode:       string;
  myUserId:   string;
  mainToken?: string;  // The MAIN user JWT — passed to socket auth
}

interface UsePoolGameReturn {
  gameState:           PoolGameState;
  connected:           boolean;
  snapshotCallbackRef: MutableRefObject<SnapshotCallback | null>;
  sendShot:    (angle: number, power: number, spinX?: number, spinY?: number) => void;
  forfeit:     () => void;
  dismissFoul: () => void;
  clearError:  () => void;
}

export function usePoolGame({ gameId, mode, myUserId, mainToken }: UsePoolGameParams): UsePoolGameReturn {
  const queryClient = useQueryClient();
  const mySlotRef   = useRef<'p1' | 'p2'>('p1');
  const isMyTurnRef = useRef(false);
  const [state, dispatch] = useReducer(reducer, makeInitialState(gameId, mode, myUserId));
  const snapshotCallbackRef = useRef<SnapshotCallback | null>(null);

  const onRoomJoined      = useCallback((data: RoomJoinedPayload)           => dispatch({ type: 'ROOM_JOINED', payload: data }), []);
  const onOpponentJoined  = useCallback((data: OpponentJoinedPayload)        => dispatch({ type: 'OPPONENT_JOINED', payload: data }), []);
  const onGameStart       = useCallback((data: GameStartPayload) => {
    mySlotRef.current = data.turnOrder[0]?.userId === myUserId ? 'p1' : 'p2';
    dispatch({ type: 'GAME_START', payload: data, myUserId });
  }, [myUserId]);
  const onShotRejected    = useCallback((data: { reason: string })           => dispatch({ type: 'SHOT_REJECTED', payload: data }), []);
  const onPhysicsSnapshot = useCallback((buf: unknown)                       => { snapshotCallbackRef.current?.(buf as ArrayBuffer); }, []);
  const onShotResult      = useCallback((data: ShotResultPayload)            => {
    dispatch({ type: 'SHOT_RESULT', payload: data, myUserId, mySlot: mySlotRef.current, wasMyTurn: isMyTurnRef.current });
  }, [myUserId]);
  const onGameEnd         = useCallback((data: GameEndPayload) => {
    dispatch({ type: 'GAME_END', payload: data });
    queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
  }, [queryClient]);
  const onReconnectState  = useCallback((data: ReconnectStatePayload)        => dispatch({ type: 'RECONNECT_STATE', payload: data, myUserId }), [myUserId]);
  const onOpponentDisconnected = useCallback((data: OpponentDisconnectedPayload) => dispatch({ type: 'DISCONNECT_GRACE', payload: data }), []);
  const onForfeitWin      = useCallback((_: ForfeitWinPayload)               => { /* pool:game_end fires right after */ }, []);
  const onError           = useCallback((data: PoolErrorPayload)             => dispatch({ type: 'SET_ERROR', payload: data.message }), []);

  const { connected, emit } = usePoolSocket({
    mainToken,  // ← main JWT, NOT socketToken
    onRoomJoined, onOpponentJoined, onGameStart, onShotRejected,
    onPhysicsSnapshot, onShotResult, onGameEnd, onReconnectState,
    onOpponentDisconnected, onForfeitWin, onError,
  });

  // Emit pool:join_room in useEffect (not render body)
  const hasJoined = useRef(false);
  useEffect(() => {
    if (connected && gameId && mode && !hasJoined.current) {
      hasJoined.current = true;
      console.log('[usePoolGame] → pool:join_room', { gameId, mode });
      emit('pool:join_room', { gameId, mode });
    }
  }, [connected, gameId, mode, emit]);

  useEffect(() => { isMyTurnRef.current = state.isMyTurn; }, [state.isMyTurn]);

  const sendShot = useCallback((angle: number, power: number, spinX = 0, spinY = 0) => {
    if (!state.isMyTurn || state.controlsLocked) return;
    dispatch({ type: 'SHOT_FIRED' });
    emit('pool:shot', { angle, power, spinX, spinY });
  }, [state.isMyTurn, state.controlsLocked, emit]);

  const forfeit    = useCallback(() => emit('pool:forfeit'),                 [emit]);
  const dismissFoul = useCallback(() => dispatch({ type: 'DISMISS_FOUL' }), []);
  const clearError  = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }),  []);

  return { gameState: state, connected, snapshotCallbackRef, sendShot, forfeit, dismissFoul, clearError };
}