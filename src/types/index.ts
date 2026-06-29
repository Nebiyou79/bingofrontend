// types/index.ts — Shared TypeScript types for DashBets frontend

// ── Auth / Session ────────────────────────────────────────────────────────────
export interface DashBetsUser {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
}

export interface AuthSession {
    user: DashBetsUser;
    expires: string;
}

// ── User (extended with wallet stats) ─────────────────────────────────────────
// ADD THIS INTERFACE IF IT DOESN'T EXIST:
export interface User {
    id: string;
    username: string;
    email: string;
    phone?: string;
    balance: number;
    bonusBalance: number;
    vipLevel: number;
    vipPoints: number;
    totalWagered: number;
    biggestWin: number;        // ← ADDED: largest win amount in ETB
    role: 'user' | 'admin';
    createdAt?: string;
}

// ── API Response wrappers ─────────────────────────────────────────────────────
export interface ApiSuccess<T = undefined> {
    message: string;
    data?: T;
}

export interface ApiError {
    error: string;
}

// ── Auth forms ────────────────────────────────────────────────────────────────
export interface LoginFormValues {
    identifier: string; // phone or email
    password: string;
}

export interface RegisterFormValues {
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

// ── Wallet ────────────────────────────────────────────────────────────────────
export type PaymentMethod = 'telebirr' | 'cbebirr';

// Single source of truth — matches walletApi.ts
export type DepositMethod = 'telebirr' | 'cbebirr';

export interface WalletBalance {
    balance: number;
    bonusBalance: number;
}

// ── Games ─────────────────────────────────────────────────────────────────────
export type GameType = 'bingo' | 'spin' | 'keno';

export type BetResult = 'win' | 'loss' | 'pending';

export interface GameBet {
    _id: string;
    gameType: GameType;
    betAmount: number;
    maxPayout: number;
    result: BetResult;
    payout: number;
    createdAt: string;
}