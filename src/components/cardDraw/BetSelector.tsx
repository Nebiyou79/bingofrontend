// components/cardDraw/BetSelector.tsx
/**
 * DashBets — Card Draw Bet Selector
 *
 * Allows users to build a list of bets (color, suit, exact) before drawing.
 * Displays dynamic payout multipliers from the fetched payout table.
 * 
 * FIXED: Exact bets now use correct backend format (e.g., 'AH', '10S', 'KD')
 *        Suit bets now use backend format (e.g., 'hearts', 'spades')
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { BetType, CardDrawBet, CardDrawPayoutTableResponse } from '../../lib/api/cardDrawApi';

// ── Constants ──────────────────────────────────────────────────────────────────

const BET_CHIPS = [10, 50, 100, 500, 1_000, 5_000];
const MIN_BET = 1;
const MAX_BET = 10_000;

const SUITS_DISPLAY = ['♠', '♥', '♦', '♣'];
const SUITS_BACKEND: Record<string, string> = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
};

// Exact cards in backend format: rank + suit initial (A=ace, H=hearts, etc.)
const EXACT_CARDS = [
  // Hearts
  'AH', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH',
  // Diamonds
  'AD', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD',
  // Clubs
  'AC', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC',
  // Spades
  'AS', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS',
];

// Helper to get display name for exact card
const getExactCardDisplay = (code: string) => {
  const suitChar = code.slice(-1);
  const rank = code.slice(0, -1);
  const suitMap: Record<string, string> = { H: '♥', D: '♦', C: '♣', S: '♠' };
  const suitSymbol = suitMap[suitChar] || suitChar;
  const isRed = suitChar === 'H' || suitChar === 'D';
  return { rank, suit: suitSymbol, isRed };
};

// Helper to get display value for bets in the slip
const getBetDisplayValue = (type: BetType, value: string): string => {
  if (type === 'exact') {
    const { rank, suit } = getExactCardDisplay(value);
    return `${rank}${suit}`;
  }
  if (type === 'suit') {
    const suitDisplayMap: Record<string, string> = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠',
    };
    return suitDisplayMap[value] || value;
  }
  return value;
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface BetSelectorProps {
  onPlay: (bets: CardDrawBet[], clientSeed?: string) => void;
  isLoading: boolean;
  userBalance: number;
  payoutTable: CardDrawPayoutTableResponse['table'] | null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function BetSelector({ onPlay, isLoading, userBalance, payoutTable }: BetSelectorProps) {
  const [betInput, setBetInput] = useState<string>('100');
  const [activeChip, setActiveChip] = useState<number | null>(null);
  const [bets, setBets] = useState<CardDrawBet[]>([]);
  const [activeBetType, setActiveBetType] = useState<BetType>('color');
  const [activeValue, setActiveValue] = useState<string>('red');
  const [clientSeed, setClientSeed] = useState('');
  const [showSeed, setShowSeed] = useState(false);

  const parsedBet = useMemo(() => {
    const n = Number(betInput);
    return Number.isFinite(n) ? Math.max(MIN_BET, Math.min(MAX_BET, n)) : MIN_BET;
  }, [betInput]);

  const betError = useMemo(() => {
    const n = Number(betInput);
    if (!Number.isFinite(n) || n < MIN_BET) return `Min ${MIN_BET} ETB`;
    if (n > MAX_BET) return `Max ${MAX_BET.toLocaleString()} ETB`;
    if (parsedBet > userBalance) return 'Insufficient balance';
    return null;
  }, [betInput, userBalance, parsedBet]);

  // Reset active value when bet type changes
  useEffect(() => {
    if (activeBetType === 'color') setActiveValue('red');
    else if (activeBetType === 'suit') setActiveValue('hearts');
    else setActiveValue('AH'); // Default to Ace of Hearts for exact
  }, [activeBetType]);

  const totalWagered = useMemo(() => bets.reduce((sum, b) => sum + b.amount, 0), [bets]);
  const canAddBet = !betError && parsedBet > 0;
  const canPlay = bets.length > 0 && totalWagered <= userBalance;

  const addBet = () => {
    if (!canAddBet) return;
    setBets(prev => [...prev, { type: activeBetType, value: activeValue, amount: parsedBet }]);
  };

  const removeBet = (index: number) => {
    setBets(prev => prev.filter((_, i) => i !== index));
  };

  const getMultiplier = (type: BetType): string => {
    if (!payoutTable) return '—';

    if (type === 'exact') {
      const entry = payoutTable.find(p => p.type === 'exact');
      return entry ? `${entry.multiplier.toFixed(2)}x` : '—';
    }

    if (type === 'suit') {
      const entry = payoutTable.find(p => p.type === 'suit');
      return entry ? `${entry.multiplier.toFixed(2)}x` : '—';
    }

    // For color bets
    const entry = payoutTable.find(p => p.type === type);
    return entry ? `${entry.multiplier.toFixed(2)}x` : '—';
  };

  const handlePlay = () => {
    if (!canPlay || isLoading) return;
    const seed = clientSeed.trim();
    onPlay(bets, seed.length > 0 ? seed : undefined);
    setBets([]); // Clear bets after play
  };

  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(160deg, #13152a 0%, #0e1020 100%)',
        border: '1px solid rgba(108,99,255,0.25)',
      }}
    >
      {/* ── USER DASHBOARD card ─────────────────────────────────────────────── */}
      <div
        className="p-4 m-3 rounded-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(59,130,246,0.10) 100%)',
          border: '1px solid rgba(108,99,255,0.40)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between mb-3 relative z-10">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Balance</p>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">D</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3 relative z-10">
          <span
            className="font-black text-white leading-none"
            style={{ fontSize: '28px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '-0.5px' }}
          >
            {fmt(userBalance)}
          </span>
          <span className="text-gray-400 text-sm font-bold">ETB</span>
        </div>
        {totalWagered > 0 && (
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="text-gray-500">Total wagered:</span>
            <span className="font-mono font-bold text-purple-400">{totalWagered.toLocaleString()} ETB</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-1">Place Your Bets</p>

        {/* ── Bet Type Selector ──────────────────────────────────────────────── */}
        <div className="flex gap-1.5">
          {(['color', 'suit', 'exact'] as BetType[]).map(type => (
            <button
              key={type}
              onClick={() => setActiveBetType(type)}
              className="flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all"
              style={{
                background: activeBetType === type ? 'rgba(108,99,255,0.20)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeBetType === type ? 'rgba(108,99,255,0.60)' : 'rgba(255,255,255,0.10)'}`,
                color: activeBetType === type ? '#a5b4fc' : '#6b7280',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── Value Selector ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Choose {activeBetType}
          </label>

          {/* Color Selector */}
          {activeBetType === 'color' && (
            <div className="flex gap-2">
              {['red', 'black'].map(color => (
                <button
                  key={color}
                  onClick={() => setActiveValue(color)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold uppercase transition-all flex items-center justify-center gap-2"
                  style={{
                    background: activeValue === color
                      ? color === 'red' ? 'rgba(239,68,68,0.20)' : 'rgba(30,41,59,0.60)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeValue === color
                      ? color === 'red' ? 'rgba(239,68,68,0.60)' : 'rgba(100,116,139,0.60)'
                      : 'rgba(255,255,255,0.10)'}`,
                    color: activeValue === color ? (color === 'red' ? '#f87171' : '#94a3b8') : '#6b7280',
                  }}
                >
                  <span className={`text-lg ${color === 'red' ? 'text-red-500' : 'text-gray-300'}`}>
                    {color === 'red' ? '♥' : '♠'}
                  </span>
                  {color}
                </button>
              ))}
            </div>
          )}

          {/* Suit Selector */}
          {activeBetType === 'suit' && (
            <div className="grid grid-cols-4 gap-1.5">
              {SUITS_DISPLAY.map(suitSymbol => {
                const isRed = suitSymbol === '♥' || suitSymbol === '♦';
                const backendValue = SUITS_BACKEND[suitSymbol];
                return (
                  <button
                    key={suitSymbol}
                    onClick={() => setActiveValue(backendValue)}
                    className="py-3 rounded-xl text-xl font-bold transition-all flex items-center justify-center"
                    style={{
                      background: activeValue === backendValue ? 'rgba(108,99,255,0.20)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${activeValue === backendValue ? 'rgba(108,99,255,0.60)' : 'rgba(255,255,255,0.10)'}`,
                      color: activeValue === backendValue ? '#a5b4fc' : (isRed ? '#f87171' : '#94a3b8'),
                    }}
                  >
                    {suitSymbol}
                  </button>
                );
              })}
            </div>
          )}

          {/* Exact Card Selector */}
          {activeBetType === 'exact' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {/* Group by suit */}
              {[
                { char: 'H', symbol: '♥', isRed: true },
                { char: 'D', symbol: '♦', isRed: true },
                { char: 'C', symbol: '♣', isRed: false },
                { char: 'S', symbol: '♠', isRed: false },
              ].map(({ char, symbol, isRed }) => {
                const cardsOfSuit = EXACT_CARDS.filter(c => c.endsWith(char));
                return (
                  <div key={char} className="mb-1.5">
                    <span
                      className="text-xs font-bold mb-1 block"
                      style={{ color: isRed ? '#f87171' : '#94a3b8' }}
                    >
                      {symbol}
                    </span>
                    <div className="grid grid-cols-7 gap-1">
                      {cardsOfSuit.map(card => {
                        const { rank } = getExactCardDisplay(card);
                        return (
                          <button
                            key={card}
                            onClick={() => setActiveValue(card)}
                            className="py-2 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: activeValue === card ? 'rgba(108,99,255,0.20)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${activeValue === card ? 'rgba(108,99,255,0.60)' : 'rgba(255,255,255,0.10)'}`,
                              color: activeValue === card ? '#a5b4fc' : '#9ca3af',
                            }}
                          >
                            {rank}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Multiplier display */}
          <div className="text-right">
            <span className="text-xs font-bold text-amber-400">
              Payout: {getMultiplier(activeBetType, activeValue)}
            </span>
          </div>
        </div>

        {/* ── Bet Amount ──────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bet Amount (ETB)</label>
          <div
            className={`flex items-center rounded-xl overflow-hidden ${betError ? 'ring-1 ring-red-500/60' : ''}`}
            style={{
              background: 'rgba(0,0,0,0.40)',
              border: `1px solid ${betError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)'}`,
            }}
          >
            <input
              type="number"
              value={betInput}
              onChange={e => { setBetInput(e.target.value); setActiveChip(null); }}
              min={MIN_BET}
              max={MAX_BET}
              className="flex-1 bg-transparent text-white text-xl font-black font-mono px-4 py-3 outline-none w-0"
              placeholder="100"
            />
            <span className="px-4 text-sm font-bold text-gray-500" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>ETB</span>
          </div>
          {betError && <p className="text-xs text-red-400">{betError}</p>}
          <div className="flex flex-wrap gap-1.5">
            {BET_CHIPS.map(v => (
              <button
                key={v}
                onClick={() => { setActiveChip(v); setBetInput(String(v)); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                style={{
                  background: activeChip === v ? 'rgba(108,99,255,0.20)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${activeChip === v ? 'rgba(108,99,255,0.60)' : 'rgba(255,255,255,0.10)'}`,
                  color: activeChip === v ? '#a5b4fc' : '#9ca3af',
                }}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Add Bet Button */}
        <button
          onClick={addBet}
          disabled={!canAddBet}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{
            background: 'rgba(108,99,255,0.20)',
            border: '1px solid rgba(108,99,255,0.40)',
            color: '#c4b5fd',
          }}
        >
          + Add to Slip
        </button>

        {/* ── Bet Slip ─────────────────────────────────────────────────────────── */}
        {bets.length > 0 && (
          <div className="space-y-2 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bet Slip ({bets.length})</span>
              <button onClick={() => setBets([])} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {bets.map((bet, i) => {
                const displayValue = getBetDisplayValue(bet.type, bet.value);
                return (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-gray-400 w-10">{bet.type}</span>
                      <span className="font-mono text-white">{displayValue}</span>
                      <span className="text-amber-400 ml-1">({getMultiplier(bet.type, bet.value)})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-300">{bet.amount.toLocaleString()} ETB</span>
                      <button onClick={() => removeBet(i)} className="text-gray-600 hover:text-red-400">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-gray-500">Total Stake</span>
              <span className="text-sm font-bold font-mono text-purple-400">{totalWagered.toLocaleString()} ETB</span>
            </div>
          </div>
        )}

        {/* ── Provably Fair Seed ──────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowSeed(s => !s)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            <span className="text-[10px]">{showSeed ? '▲' : '▼'}</span>
            Provably Fair Settings
          </button>
          {showSeed && (
            <div className="mt-2 space-y-1">
              <label className="block text-xs text-gray-600">Client Seed (optional)</label>
              <input
                type="text"
                value={clientSeed}
                onChange={e => setClientSeed(e.target.value)}
                placeholder="Leave blank to use your user ID"
                className="w-full rounded-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.10)' }}
              />
            </div>
          )}
        </div>

        {/* ── Draw Card Button ────────────────────────────────────────────────── */}
        <button
          onClick={handlePlay}
          disabled={!canPlay || isLoading}
          className="w-full rounded-xl font-black text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex flex-col items-center justify-center py-4 gap-0.5"
          style={{
            background: isLoading
              ? 'rgba(108,99,255,0.40)'
              : 'linear-gradient(135deg, #7c3aed 0%, #6c63ff 50%, #f59e0b 150%)',
            boxShadow: '0 4px 24px rgba(108,99,255,0.40)',
            color: '#fff',
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              Drawing Card…
            </span>
          ) : (
            <>
              <span className="flex items-center gap-2">
                <span>🃏</span> Draw Card
              </span>
              <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
                DRAW / REVEAL
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}