// components/DragonTower/MultiplierDisplay.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface MultiplierDisplayProps {
  multiplier: number;
  nextMultiplier: number | null;
  potentialPayout: number;
  status: 'betting' | 'playing' | 'result';
  outcome?: 'lost' | 'tower_cleared' | 'cashed_out' | null;
}

export function MultiplierDisplay({
  multiplier,
  nextMultiplier,
  potentialPayout,
  status,
  outcome,
}: MultiplierDisplayProps) {
  const [pulse, setPulse] = useState(false);
  const prevMult = useRef(multiplier);

  useEffect(() => {
    if (multiplier !== prevMult.current) {
      setPulse(true);
      prevMult.current = multiplier;
      const t = setTimeout(() => setPulse(false), 420);
      return () => clearTimeout(t);
    }
  }, [multiplier]);

  const isBusted = outcome === 'lost';
  const isWin = outcome === 'tower_cleared' || outcome === 'cashed_out';

  return (
    <div className="dt-mult-wrap">
      <div className="dt-mult-label">
        {isBusted ? 'TERMINATED' : isWin ? 'EXTRACTED' : 'CURRENT MULTIPLIER'}
      </div>

      <div
        className={[
          'dt-mult-value',
          pulse ? 'dt-mult-pulse' : '',
          isBusted ? 'dt-mult-busted' : '',
          isWin ? 'dt-mult-win' : '',
        ].join(' ')}
      >
        {multiplier.toFixed(2)}
        <span className="dt-mult-x">×</span>
      </div>

      {status === 'playing' && nextMultiplier !== null && (
        <div className="dt-mult-next">
          next row <strong>{nextMultiplier.toFixed(2)}×</strong>
        </div>
      )}

      {status === 'playing' && potentialPayout > 0 && (
        <div className="dt-mult-payout">
          payout if cashed now <strong>{potentialPayout.toFixed(2)}</strong> ETB
        </div>
      )}

      <style jsx>{`
        .dt-mult-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 18px 24px;
          position: relative;
        }
        .dt-mult-label {
          font-family: var(--dt-font-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          color: var(--dt-text-dim);
          text-transform: uppercase;
        }
        .dt-mult-value {
          font-family: var(--dt-font-display);
          font-size: clamp(40px, 8vw, 64px);
          font-weight: 700;
          line-height: 1;
          color: var(--dt-toxic);
          text-shadow:
            0 0 12px rgba(132, 255, 99, 0.55),
            0 0 36px rgba(132, 255, 99, 0.25);
          transition: color 0.25s ease, text-shadow 0.25s ease;
          display: flex;
          align-items: baseline;
          gap: 2px;
        }
        .dt-mult-x {
          font-size: 0.5em;
          opacity: 0.7;
        }
        .dt-mult-pulse {
          animation: dtMultPulse 0.42s ease-out;
        }
        .dt-mult-busted {
          color: var(--dt-danger);
          text-shadow: 0 0 12px rgba(255, 59, 59, 0.6), 0 0 40px rgba(255, 59, 59, 0.3);
        }
        .dt-mult-win {
          color: var(--dt-cyan);
          text-shadow: 0 0 16px rgba(74, 227, 255, 0.6), 0 0 44px rgba(74, 227, 255, 0.3);
        }
        .dt-mult-next,
        .dt-mult-payout {
          font-family: var(--dt-font-mono);
          font-size: 12px;
          color: var(--dt-text-dim);
        }
        .dt-mult-next strong,
        .dt-mult-payout strong {
          color: var(--dt-text);
          font-weight: 600;
        }
        @keyframes dtMultPulse {
          0% { transform: scale(1); }
          35% { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}