// components/keno/KenoStatistics.tsx
/**
 * KenoStatistics — number frequency chart.
 * Premium gold/black casino redesign with hot/cold/normal indicators.
 */
import React, { useState } from 'react';
import type { NumberStat } from '../../hooks/useKenoSocket';

const GOLD   = '#f5c842';
const GOLD2  = '#e8a800';
const BORDER = 'rgba(245,200,66,0.12)';

export function KenoStatistics({
  stats,
  roundsAnalysed,
}: {
  stats: NumberStat[];
  roundsAnalysed: number;
}) {
  const [sort, setSort] = useState<'number' | 'freq'>('freq');
  const [filter, setFilter] = useState<'all' | 'hot' | 'cold'>('all');

  const max = Math.max(...stats.map((s) => s.frequency), 1);

  const sorted = [...stats]
    .filter((s) => {
      if (filter === 'hot')  return s.frequency >= max * 0.7;
      if (filter === 'cold') return s.frequency <= max * 0.3;
      return true;
    })
    .sort((a, b) =>
      sort === 'number' ? a.number - b.number : b.frequency - a.frequency
    );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-sm font-black text-white"
            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}
          >
            Number Frequency
          </p>
          <p className="text-[10px] font-mono text-gray-600 mt-0.5">
            Last {roundsAnalysed} rounds analysed
          </p>
        </div>

        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'number' ? 'freq' : 'number'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:brightness-110"
          style={{
            background: 'rgba(245,200,66,0.08)',
            border: `1px solid ${BORDER}`,
            color: GOLD,
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          ⇅ {sort === 'number' ? 'By Freq' : 'By Num'}
        </button>
      </div>

      {/* Hot / Cold / All filter chips */}
      <div className="flex gap-2">
        {([
          { id: 'all',  label: 'All',  color: GOLD },
          { id: 'hot',  label: '🔥 Hot',  color: '#f97316' },
          { id: 'cold', label: '🧊 Cold', color: '#60a5fa' },
        ] as const).map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className="px-3 py-1 rounded-xl text-[10px] font-black transition-all"
            style={
              filter === id
                ? {
                    background: `${color}20`,
                    border: `1px solid ${color}50`,
                    color,
                    fontFamily: "'Rajdhani', sans-serif",
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${BORDER}`,
                    color: '#4b5563',
                    fontFamily: "'Rajdhani', sans-serif",
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div
        className="space-y-1 max-h-72 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${BORDER} transparent` }}
      >
        {sorted.map(({ number: n, frequency }) => {
          const pct    = Math.round((frequency / max) * 100);
          const isHot  = frequency >= max * 0.7;
          const isCold = frequency <= max * 0.3;

          const barColor = isHot
            ? 'linear-gradient(90deg, #f97316, #fb923c)'
            : isCold
            ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
            : `linear-gradient(90deg, ${GOLD2}, ${GOLD})`;

          const badgeStyle: React.CSSProperties = isHot
            ? { background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316' }
            : isCold
            ? { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }
            : { background: 'rgba(245,200,66,0.08)', border: `1px solid ${BORDER}`, color: GOLD };

          return (
            <div key={n} className="flex items-center gap-2.5 py-0.5">
              {/* Number badge */}
              <span
                className="flex-shrink-0 inline-flex items-center justify-center w-8 h-7 rounded-lg text-[11px] font-black"
                style={{ ...badgeStyle, fontFamily: "'Rajdhani', sans-serif" }}
              >
                {n}
              </span>

              {/* Bar track */}
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>

              {/* Count */}
              <span
                className="flex-shrink-0 text-[11px] font-black font-mono tabular-nums w-6 text-right"
                style={{
                  color: isHot ? '#f97316' : isCold ? '#60a5fa' : GOLD,
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                {frequency}
              </span>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="text-center py-8 text-xs font-mono text-gray-600">
            No data for this filter.
          </p>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex gap-4 pt-3 border-t"
        style={{ borderColor: BORDER }}
      >
        {[
          { dot: 'linear-gradient(90deg, #f97316, #fb923c)', label: 'Hot ≥70%' },
          { dot: `linear-gradient(90deg, ${GOLD2}, ${GOLD})`, label: 'Normal'   },
          { dot: 'linear-gradient(90deg, #3b82f6, #60a5fa)', label: 'Cold ≤30%' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-1.5 rounded-full"
              style={{ background: dot }}
            />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
