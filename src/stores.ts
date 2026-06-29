/**
 * stores.ts  v2.0
 *
 * FIXES:
 *  1. clearResult() now resets result to null — previously it left stale
 *     stopAngle in the result object which confused the wheel's landing trigger.
 *  2. setServerSeedHash added (needed by useSpin provably fair).
 *  3. SpinResult type extended with new fields from v2 spin engine.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  unlockedAt: string;
  claimed: boolean;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  balance: number;
  bonusBalance: number;
  vipLevel: number;
  vipPoints: number;
  vipExpiry: string | null;
  totalWagered: number;
  totalWins: number;
  totalLosses: number;
  totalSpins: number;
  biggestWin: number;
  currentWinStreak: number;
  highestWinStreak: number;
  currentLossStreak: number;
  dailyWagered: number;
  weeklyWagered: number;
  achievements: Achievement[];
  referralCode: string | null;
  referralEarnings: number;
  referralCount: number;
  selfExcluded: boolean;
}

export interface SpinResultStore {
  result: string;           // outcome key: 'loss','2x','3x','mini_jp', etc.
  isWin: boolean;
  netPayout: number;
  payout: number;
  grossWin: number;
  commission: number;
  multiplier: number;
  betAmount: number;
  newBalance: number;
  stopAngle: number;        // centre angle of winning segment (0-360)
  segmentIndex: number;     // 0-15 index
  segmentOrder: string[];
  wheelType: string;
  vipPointsEarned: number;
  jackpotWon: { type: string; amount: number } | null;
  isJackpot: boolean;
  jackpotType: string | null;
  duplicate?: boolean;
  betId?: string;
  provablyFair?: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    hashedSeed: string;
    verified: boolean;
  };
  animationConfig?: Record<string, unknown>;
}

export interface JackpotPool {
  type: 'mini' | 'minor' | 'major' | 'grand';
  name: string;
  amount: number;
  color: string;
  icon: string;
  lastWonAt: string | null;
  lastWonBy: string | null;
}

export interface FeedEvent {
  id: string;
  username: string;
  betAmount: number;
  payout: number;
  multiplier: number;
  result: string;
  wheelType: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. User Store
// ─────────────────────────────────────────────────────────────────────────────

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (u: User | null) => void;
  updateBalance: (n: number) => void;
  updateVip: (points: number, level: number) => void;
  resetStore: () => void;
}

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    updateBalance: (newBalance) =>
      set((s) => s.user ? { user: { ...s.user, balance: newBalance } } : {}),
    updateVip: (points, level) =>
      set((s) => s.user ? { user: { ...s.user, vipPoints: points, vipLevel: level } } : {}),
    resetStore: () => set({ user: null, isAuthenticated: false }),
  }))
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Spin Store
// ─────────────────────────────────────────────────────────────────────────────

interface SpinStore {
  spinning: boolean;
  result: SpinResultStore | null;
  error: string | null;
  cooldown: number;
  selectedBet: number;
  autoSpin: boolean;
  turboMode: boolean;
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;

  setSpinning: (v: boolean) => void;
  setResult: (r: SpinResultStore | null) => void;
  setError: (e: string | null) => void;
  setCooldown: (v: number) => void;
  decrementCooldown: () => void;
  setSelectedBet: (v: number) => void;
  setAutoSpin: (v: boolean) => void;
  setTurboMode: (v: boolean) => void;
  setClientSeed: (s: string) => void;
  setServerSeedHash: (h: string) => void;
  incrementNonce: () => void;
  clearResult: () => void;
}

const makeClientSeed = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const useSpinStore = create<SpinStore>()(
  subscribeWithSelector((set) => ({
    spinning:       false,
    result:         null,
    error:          null,
    cooldown:       0,
    selectedBet:    10,
    autoSpin:       false,
    turboMode:      false,
    clientSeed:     makeClientSeed(),
    serverSeedHash: '',
    nonce:          0,

    setSpinning:       (v) => set({ spinning: v }),
    // Always replace result wholesale — never merge/patch
    setResult:         (r) => set({ result: r }),
    setError:          (e) => set({ error: e }),
    setCooldown:       (v) => set({ cooldown: v }),
    decrementCooldown: ()  => set((s) => ({ cooldown: Math.max(0, s.cooldown - 1) })),
    setSelectedBet:    (v) => set({ selectedBet: v }),
    setAutoSpin:       (v) => set({ autoSpin: v }),
    setTurboMode:      (v) => set({ turboMode: v }),
    setClientSeed:     (s) => set({ clientSeed: s }),
    setServerSeedHash: (h) => set({ serverSeedHash: h }),
    incrementNonce:    ()  => set((s) => ({ nonce: s.nonce + 1 })),
    // clearResult: wipe both result AND error so wheel goes fully idle
    clearResult:       ()  => set({ result: null, error: null }),
  }))
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Jackpot Store
// ─────────────────────────────────────────────────────────────────────────────

interface JackpotStore {
  pools: Record<string, JackpotPool>;
  lastWinner: FeedEvent | null;
  setPools: (pools: JackpotPool[]) => void;
  updatePool: (type: string, amount: number) => void;
  setLastWinner: (e: FeedEvent | null) => void;
}

export const useJackpotStore = create<JackpotStore>()(
  subscribeWithSelector((set) => ({
    pools: {
      mini:  { type:'mini',  name:'Mini Jackpot',  amount:250,   color:'#22c55e', icon:'🎯', lastWonAt:null, lastWonBy:null },
      minor: { type:'minor', name:'Minor Jackpot', amount:1200,  color:'#f59e0b', icon:'⭐', lastWonAt:null, lastWonBy:null },
      major: { type:'major', name:'Major Jackpot', amount:8500,  color:'#ef4444', icon:'🔥', lastWonAt:null, lastWonBy:null },
      grand: { type:'grand', name:'Grand Jackpot', amount:52000, color:'#a855f7', icon:'👑', lastWonAt:null, lastWonBy:null },
    },
    lastWinner: null,
    setPools: (pools) => set({ pools: Object.fromEntries(pools.map((p) => [p.type, p])) }),
    updatePool: (type, amount) =>
      set((s) => ({
        pools: { ...s.pools, [type]: s.pools[type] ? { ...s.pools[type], amount } : s.pools[type] },
      })),
    setLastWinner: (e) => set({ lastWinner: e }),
  }))
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Feed Store
// ─────────────────────────────────────────────────────────────────────────────

interface FeedStore {
  events: FeedEvent[];
  addEvent: (e: FeedEvent) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedStore>()((set) => ({
  events: [],
  addEvent: (e) => set((s) => ({ events: [e, ...s.events].slice(0, 50) })),
  clearFeed: () => set({ events: [] }),
}));