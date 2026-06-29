// components/blackjack/BlackjackTable.tsx
'use client';

import { useState } from 'react';
import { useBlackjack } from '@/hooks/useBlackjack';

const SUIT_GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR: Record<string, string> = {
  S: 'text-zinc-100', C: 'text-zinc-100',
  H: 'text-rose-500', D: 'text-rose-500',
};

function parseCard(card: string) {
  if (card === 'HIDDEN') return null;
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return { rank, suit, glyph: SUIT_GLYPH[suit] ?? suit, color: SUIT_COLOR[suit] ?? 'text-zinc-100' };
}

function PlayingCard({ card, index }: { card: string; index: number }) {
  const parsed = parseCard(card);
  return (
    <div
      className="relative h-28 w-20 shrink-0 rounded-lg border border-white/10 bg-zinc-900 shadow-lg shadow-black/40 transition-all duration-300"
      style={{
        animation: 'bj-deal 280ms ease-out both',
        animationDelay: `${index * 90}ms`,
      }}
    >
      {parsed ? (
        <div className={`flex h-full w-full flex-col items-center justify-center gap-1 ${parsed.color}`}>
          <span className="text-2xl font-semibold tracking-tight">{parsed.rank}</span>
          <span className="text-2xl leading-none">{parsed.glyph}</span>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_6px,transparent_6px,transparent_12px)]">
          <span className="text-xs uppercase tracking-widest text-zinc-500">DashBets</span>
        </div>
      )}
    </div>
  );
}

function Hand({ label, cards, total, highlight }: { label: string; cards: string[]; total: number | null; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-zinc-400">
        <span>{label}</span>
        {total != null && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${highlight ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-zinc-200'}`}>
            {total}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {cards.map((c, i) => <PlayingCard key={`${c}-${i}`} card={c} index={i} />)}
      </div>
    </div>
  );
}

const OUTCOME_COPY: Record<string, { label: string; tone: string }> = {
  blackjack: { label: 'Blackjack!', tone: 'text-amber-400' },
  win:       { label: 'You win',    tone: 'text-emerald-400' },
  push:      { label: 'Push — bet returned', tone: 'text-zinc-300' },
  lose:      { label: 'Dealer wins', tone: 'text-rose-500' },
};

export default function BlackjackTable() {
  const {
    phase, hand, balance, loading, error,
    canHit, canStand, canDouble,
    start, hit, stand, doubleDown, newHand,
  } = useBlackjack();

  const [betInput, setBetInput] = useState(10);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-950/40 to-zinc-950 p-6 shadow-2xl">
      <style>{`
        @keyframes bj-deal {
          from { opacity: 0; transform: translateY(-16px) rotate(-4deg); }
          to   { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Blackjack Lite</h2>
        {balance != null && (
          <span className="text-sm text-zinc-400">Balance: <span className="font-medium text-zinc-200">{balance.toFixed(2)} ETB</span></span>
        )}
      </div>

      {hand && (
        <div className="mb-8 flex flex-col gap-8">
          <Hand
            label="Dealer"
            cards={hand.dealerCards}
            total={hand.status === 'settled' ? hand.dealerTotal : null}
          />
          <Hand
            label="You"
            cards={hand.playerCards}
            total={hand.playerTotal}
            highlight={hand.playerTotal === 21}
          />
        </div>
      )}

      {phase === 'result' && hand?.outcome && (
        <div className="mb-6 text-center">
          <p className={`text-xl font-bold ${OUTCOME_COPY[hand.outcome]?.tone}`}>
            {OUTCOME_COPY[hand.outcome]?.label}
          </p>
          {hand.payout > 0 && (
            <p className="mt-1 text-sm text-zinc-400">Payout: {hand.payout.toFixed(2)} ETB</p>
          )}
        </div>
      )}

      {error && <p className="mb-4 text-center text-sm text-rose-400">{error}</p>}

      {phase === 'betting' && (
        <div className="flex flex-col items-center gap-3">
          <label className="text-sm text-zinc-400">Bet amount</label>
          <input
            type="number"
            min={1}
            value={betInput}
            onChange={(e) => setBetInput(Number(e.target.value))}
            className="w-32 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-center text-zinc-100 outline-none focus:border-amber-400"
          />
          <button
            onClick={() => start(betInput)}
            disabled={loading || betInput < 1}
            className="mt-2 rounded-lg bg-amber-400 px-6 py-2 font-semibold text-zinc-900 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? 'Dealing…' : 'Deal'}
          </button>
        </div>
      )}

      {(phase === 'player_turn') && (
        <div className="flex justify-center gap-3">
          <button
            onClick={hit}
            disabled={!canHit}
            className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-zinc-900 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            Hit
          </button>
          <button
            onClick={stand}
            disabled={!canStand}
            className="rounded-lg bg-zinc-700 px-6 py-2 font-semibold text-zinc-100 transition hover:bg-zinc-600 disabled:opacity-50"
          >
            Stand
          </button>
          {canDouble && (
            <button
              onClick={doubleDown}
              disabled={loading}
              className="rounded-lg border border-amber-400 px-6 py-2 font-semibold text-amber-400 transition hover:bg-amber-400/10 disabled:opacity-50"
            >
              Double
            </button>
          )}
        </div>
      )}

      {phase === 'dealer_turn' && (
        <p className="text-center text-sm text-zinc-400">Dealer is playing…</p>
      )}

      {phase === 'result' && (
        <div className="flex justify-center">
          <button
            onClick={newHand}
            className="rounded-lg bg-amber-400 px-6 py-2 font-semibold text-zinc-900 transition hover:bg-amber-300"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
