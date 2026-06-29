/**
 * components/bingo/LobbyTimer.tsx — Premium lobby countdown
 * All props and logic preserved.
 */

import React, { useEffect, useState, useRef } from 'react';

interface LobbyTimerProps {
  initialSeconds: number;
  socketCountdown?: number | null;
  status: 'waiting' | 'playing' | 'finished' | null;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LobbyTimer({ initialSeconds, socketCountdown, status }: LobbyTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'waiting') return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status]);

  useEffect(() => {
    if (socketCountdown !== null && socketCountdown !== undefined) {
      setSeconds(socketCountdown);
    }
  }, [socketCountdown]);

  if (status === 'playing') {
    return (
      <div
        className="flex items-center gap-2 text-xs font-bold"
        style={{ color: '#00E676' }}
      >
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Game in progress
      </div>
    );
  }

  if (status === 'finished') {
    return <div className="text-xs font-medium" style={{ color: '#475569' }}>Game ended</div>;
  }

  const isImminent = seconds <= 30 && seconds > 0;

  return (
    <div className={`flex flex-col items-center gap-1 ${isImminent ? 'text-red-400' : 'text-gray-400'}`}>
      {isImminent ? (
        <>
          <span
            className="text-[9px] font-black uppercase tracking-widest animate-pulse"
            style={{ color: '#FF5252' }}
          >
            Game starting in
          </span>
          <span
            className="text-5xl font-black font-mono tabular-nums"
            style={{
              color: '#FF5252',
              fontFamily: "'Rajdhani', sans-serif",
              textShadow: '0 0 20px rgba(255,82,82,0.5)',
            }}
          >
            {seconds}
          </span>
          <span className="text-[9px] uppercase tracking-widest" style={{ color: '#FF5252', opacity: 0.6 }}>seconds</span>
        </>
      ) : (
        <>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>
            Waiting for players
          </span>
          {seconds > 0 && (
            <span
              className="text-2xl font-black font-mono tabular-nums"
              style={{ color: '#94A3B8', fontFamily: "'Rajdhani', sans-serif" }}
            >
              {formatTime(seconds)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
