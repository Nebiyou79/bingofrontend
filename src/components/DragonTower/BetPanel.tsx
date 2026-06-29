// components/DragonTower/BetPanel.tsx
'use client';

import { useState } from 'react';
import type { Difficulty } from '@/lib/api/dragonTowerApi';

interface BetPanelProps {
  phase: 'betting' | 'playing' | 'result';
  loading: boolean;
  balance: number;
  currentRow: number;
  rows: number;
  currentMultiplier: number;
  betAmount: number;
  difficulty: Difficulty;
  onBetAmountChange: (v: number) => void;
  onDifficultyChange: (d: Difficulty) => void;
  onRowsChange: (r: number) => void;
  onStart: () => void;
  onCashout: () => void;
  onPlayAgain: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; tag: string }[] = [
  { value: 'easy', label: 'Easy', tag: '2 of 3 safe' },
  { value: 'medium', label: 'Medium', tag: '1 of 3 safe' },
  { value: 'hard', label: 'Hard', tag: '1 of 4 safe' },
];

export function BetPanel({
  phase,
  loading,
  balance,
  currentRow,
  rows,
  currentMultiplier,
  betAmount,
  difficulty,
  onBetAmountChange,
  onDifficultyChange,
  onRowsChange,
  onStart,
  onCashout,
  onPlayAgain,
}: BetPanelProps) {
  const [localBet, setLocalBet] = useState(String(betAmount));

  const commitBet = (raw: string) => {
    setLocalBet(raw);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) onBetAmountChange(n);
  };

  const canStart = phase === 'betting' && betAmount > 0 && betAmount <= balance && !loading;
  const canCashout = phase === 'playing' && currentRow > 0 && !loading;

  return (
    <div className="dt-panel">
      {phase === 'betting' && (
        <>
          <div className="dt-field">
            <label className="dt-label">Stake (ETB)</label>
            <div className="dt-stake-row">
              <input
                className="dt-input"
                type="number"
                min={1}
                value={localBet}
                onChange={(e) => commitBet(e.target.value)}
                disabled={loading}
              />
              <button type="button" className="dt-chip" onClick={() => commitBet(String(Math.max(1, Math.floor(betAmount / 2))))}>
                ½
              </button>
              <button type="button" className="dt-chip" onClick={() => commitBet(String(Math.min(balance, betAmount * 2)))}>
                2×
              </button>
              <button type="button" className="dt-chip" onClick={() => commitBet(String(Math.floor(balance)))}>
                Max
              </button>
            </div>
            <div className="dt-balance-hint">Balance: {balance.toFixed(2)} ETB</div>
          </div>

          <div className="dt-field">
            <label className="dt-label">Difficulty</label>
            <div className="dt-difficulty-grid">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`dt-difficulty-btn ${difficulty === d.value ? 'dt-difficulty-active' : ''}`}
                  onClick={() => onDifficultyChange(d.value)}
                  disabled={loading}
                >
                  <span className="dt-difficulty-label">{d.label}</span>
                  <span className="dt-difficulty-tag">{d.tag}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="dt-field">
            <label className="dt-label">
              Tower height <span className="dt-rows-value">{rows} rows</span>
            </label>
            <input
              className="dt-slider"
              type="range"
              min={3}
              max={9}
              value={rows}
              onChange={(e) => onRowsChange(Number(e.target.value))}
              disabled={loading}
            />
          </div>

          <button type="button" className="dt-cta dt-cta-start" disabled={!canStart} onClick={onStart}>
            {loading ? 'Spawning tower…' : 'Climb the Tower'}
          </button>
        </>
      )}

      {phase === 'playing' && (
        <>
          <div className="dt-status-line">
            <span>Row {currentRow} of {rows} cleared</span>
            <span className="dt-status-mult">{currentMultiplier.toFixed(2)}×</span>
          </div>
          <button
            type="button"
            className="dt-cta dt-cta-cashout"
            disabled={!canCashout}
            onClick={onCashout}
          >
            {loading
              ? 'Processing…'
              : currentRow > 0
                ? `Cash Out · ${currentMultiplier.toFixed(2)}×`
                : 'Pick an egg to begin'}
          </button>
        </>
      )}

      {phase === 'result' && (
        <button type="button" className="dt-cta dt-cta-again" onClick={onPlayAgain} disabled={loading}>
          Play Again
        </button>
      )}

      <style jsx>{`
        .dt-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 18px;
          border-radius: 16px;
          background: var(--dt-surface);
          border: 1px solid var(--dt-border);
        }
        .dt-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dt-label {
          font-family: var(--dt-font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dt-text-dim);
          display: flex;
          justify-content: space-between;
        }
        .dt-rows-value {
          color: var(--dt-toxic);
        }
        .dt-stake-row {
          display: flex;
          gap: 6px;
        }
        .dt-input {
          flex: 1;
          background: var(--dt-egg-bg);
          border: 1px solid var(--dt-border);
          border-radius: 10px;
          padding: 10px 12px;
          color: var(--dt-text);
          font-family: var(--dt-font-mono);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .dt-input:focus {
          border-color: var(--dt-toxic);
        }
        .dt-chip {
          background: var(--dt-egg-bg);
          border: 1px solid var(--dt-border);
          border-radius: 10px;
          padding: 0 12px;
          color: var(--dt-text-dim);
          font-family: var(--dt-font-mono);
          font-size: 12px;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .dt-chip:hover {
          border-color: var(--dt-toxic);
          color: var(--dt-toxic);
        }
        .dt-balance-hint {
          font-family: var(--dt-font-mono);
          font-size: 11px;
          color: var(--dt-text-dim);
          opacity: 0.7;
        }
        .dt-difficulty-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .dt-difficulty-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          border-radius: 10px;
          border: 1px solid var(--dt-border);
          background: var(--dt-egg-bg);
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .dt-difficulty-btn:hover {
          border-color: rgba(132, 255, 99, 0.4);
        }
        .dt-difficulty-active {
          border-color: var(--dt-toxic);
          background: rgba(132, 255, 99, 0.1);
          box-shadow: 0 0 0 1px rgba(132, 255, 99, 0.3) inset;
        }
        .dt-difficulty-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--dt-text);
        }
        .dt-difficulty-tag {
          font-family: var(--dt-font-mono);
          font-size: 10px;
          color: var(--dt-text-dim);
        }
        .dt-slider {
          width: 100%;
          accent-color: #84ff63;
        }
        .dt-status-line {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: var(--dt-font-mono);
          font-size: 13px;
          color: var(--dt-text-dim);
        }
        .dt-status-mult {
          color: var(--dt-toxic);
          font-size: 16px;
          font-weight: 700;
        }
        .dt-cta {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-family: var(--dt-font-display);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .dt-cta:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .dt-cta:not(:disabled):hover {
          transform: translateY(-1px);
        }
        .dt-cta-start {
          background: linear-gradient(135deg, #84ff63, #4ade80);
          color: #06140a;
          box-shadow: 0 0 24px rgba(132, 255, 99, 0.35);
        }
        .dt-cta-cashout {
          background: linear-gradient(135deg, #4ae3ff, #2bb3d6);
          color: #021014;
          box-shadow: 0 0 24px rgba(74, 227, 255, 0.35);
        }
        .dt-cta-again {
          background: var(--dt-egg-bg);
          border: 1px solid var(--dt-toxic);
          color: var(--dt-toxic);
        }
      `}</style>
    </div>
  );
}