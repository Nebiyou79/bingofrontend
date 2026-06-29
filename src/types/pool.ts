// types/pool.ts

export type PoolMode     = 'eightball' | 'ethiopian';
export type RoomType     = 'cpu' | 'pvp';
export type RoomStatus   = 'waiting' | 'active' | 'completed';
export type GameStatus   = 'waiting' | 'active' | 'ended';
export type PlayerGroup  = 'solids' | 'stripes' | null;
export type EndReason    = 'normal' | 'forfeit' | 'disconnect' | 'timeout' | 'draw';

export type FoulType =
  | 'scratch' | 'scratch_on_break' | 'scratch_on_eight_ball'
  | 'eight_ball_early' | 'eight_ball_first_contact_open_table'
  | 'wrong_ball_first' | 'no_contact' | 'wrong_contact' | null;

// ── REST ──────────────────────────────────────────────────────────────────────

export interface RoomSnapshot {
  roomId:       string;
  mode:         PoolMode;
  roomNumber:   number;
  type:         RoomType;
  stake:        number;
  occupancy:    number;
  maxPlayers:   number;
  status:       RoomStatus;
  houseCut?:    number;
  winnerPayout?: number;
}

export interface JoinRoomResponse {
  success:              boolean;
  gameId:               string;
  socketToken:          string;
  roomSnapshot:         RoomSnapshot;
  entryTransactionId?:  string;
}

// ── Socket payloads ───────────────────────────────────────────────────────────

export interface RoomJoinedPayload {
  gameId:     string;
  roomSnapshot: RoomSnapshot | null;
  waitingFor: 'opponent' | null;
}

export interface OpponentJoinedPayload {
  opponent: { id: string; username: string };
}

export interface TurnOrderEntry {
  userId:   string;
  username: string;
}

export interface BallPosition {
  id: number; x: number; y: number; z: number;
  rx: number; ry: number; rz: number;
}

export interface GameStartPayload {
  gameId:            string;
  mode:              PoolMode;
  ballPositions:     BallPosition[];
  ballsOnTable:      number[];
  turnOrder:         TurnOrderEntry[];
  currentTurnUserId: string;
  stake:             number;
  scores:            { p1: number; p2: number };
  currentTarget:     number;
  tableOpen:         boolean;
}

export interface ShotResultPayload {
  pocketed:       number[];
  cuePocketed:    boolean;
  firstContact:   number | null;
  foul:           boolean;
  foulType:       FoulType;
  ballInHand:     boolean;
  groupAssigned:  boolean;
  assignedGroup:  PlayerGroup;
  p1Group:        PlayerGroup;
  p2Group:        PlayerGroup;
  tableOpen:      boolean;
  scoreDelta:     number;
  scores:         { p1: number; p2: number };
  nextTarget:     number;
  nextTurnUserId: string | null;
  ballsOnTable:   number[];
}

export interface GameEndPayload {
  winner:     string | null;
  loser:      string | null;
  reason:     EndReason;
  scores:     { p1: number; p2: number } | null;
  prize:      number;
  newBalance: number | null;
  mode:       PoolMode;
}

export interface OpponentDisconnectedPayload { gracePeriodSecs: number; }
export interface ForfeitWinPayload            { reason: string; }
export interface RoomUpdatePayload            { roomId: string; occupancy: number; status: RoomStatus; }
export interface ReconnectStatePayload {
  gameId: string; mode: PoolMode; ballsOnTable: number[];
  ballPositions: BallPosition[]; currentTurnUserId: string;
  scores: { p1: number; p2: number }; currentTarget: number;
  p1Group: PlayerGroup; p2Group: PlayerGroup;
  tableOpen: boolean; players: TurnOrderEntry[];
}
export interface PoolErrorPayload { message: string; }

// ── Socket handler map ────────────────────────────────────────────────────────

export interface PoolSocketHandlers {
  onRoomJoined?:           (data: RoomJoinedPayload)            => void;
  onOpponentJoined?:       (data: OpponentJoinedPayload)         => void;
  onGameStart?:            (data: GameStartPayload)              => void;
  onShotRejected?:         (data: { reason: string })            => void;
  onPhysicsSnapshot?:      (data: unknown)                       => void;
  onShotResult?:           (data: ShotResultPayload)             => void;
  onGameEnd?:              (data: GameEndPayload)                 => void;
  onOpponentDisconnected?: (data: OpponentDisconnectedPayload)    => void;
  onForfeitWin?:           (data: ForfeitWinPayload)              => void;
  onRoomUpdate?:           (data: RoomUpdatePayload)              => void;
  onReconnectState?:       (data: ReconnectStatePayload)          => void;
  onError?:                (data: PoolErrorPayload)               => void;
}

// ── Game state ────────────────────────────────────────────────────────────────

export interface PoolPlayerState {
  userId:   string;
  username: string;
  group:    PlayerGroup;
  score:    number;
  isCpu:    boolean;
}

export interface PoolGameState {
  gameId:          string | null;
  mode:            PoolMode | null;
  status:          GameStatus;
  myPlayerId:      string;
  opponent:        { id: string; username: string } | null;
  isMyTurn:        boolean;
  ballPositions:   BallPosition[];
  ballsOnTable:    number[];
  scores:          { p1: number; p2: number };
  currentTarget:   number;
  myGroup:         PlayerGroup;
  opponentGroup:   PlayerGroup;
  tableOpen:       boolean;
  lastShotResult:  ShotResultPayload | null;
  foulMessage:     string | null;
  foulVisible:     boolean;
  stake:           number;
  prize:           number;
  newBalance:      number | null;
  endResult:       GameEndPayload | null;
  waitingFor:      'opponent' | null;
  turnOrder:       TurnOrderEntry[];
  controlsLocked:  boolean;
  disconnectGrace: number | null;
  error:           string | null;
  players:         PoolPlayerState[];
  currentTurn:     string | null;
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface PoolSessionData {
  gameId:      string;
  socketToken: string;
  roomId:      string;
  mode:        PoolMode;
  stake:       number;
}