/**
 * components/bingo/JackpotPool.tsx
 * Displays the current jackpot pool with ETB formatting and
 * a brief pulse animation when the value increases.
 */

import React, { useEffect, useRef, useState } from 'react';

interface JackpotPoolProps {
  pool: number;
}

/**
 * Renders the jackpot pool amount.
 * Flashes a highlight whenever the pool increases (new player joins).
 */
export function JackpotPool({ pool }: JackpotPoolProps) {
  const prevRef = useRef(pool);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (pool > prevRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      prevRef.current = pool;
      return () => clearTimeout(t);
    }
    prevRef.current = pool;
  }, [pool]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Jackpot Pool
      </span>
      <div
        className={[
          'text-3xl font-black text-yellow-400 tabular-nums transition-all duration-300',
          flash ? 'scale-110 text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]' : '',
        ].join(' ')}
      >
        {pool.toLocaleString('en-ET')}
        <span className="ml-1 text-xl font-bold text-yellow-600">ETB</span>
      </div>
      {flash && (
        <span className="text-xs text-green-400 font-semibold animate-bounce">
          ▲ Pool growing!
        </span>
      )}
    </div>
  );
}
