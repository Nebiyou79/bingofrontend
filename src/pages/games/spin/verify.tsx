/**
 * pages/games/spin/verify.tsx — Provably Fair Verification Page
 *
 * Displays:
 *   - How provably fair works (educational)
 *   - Current session seeds (server hash, client seed, nonce)
 *   - On-demand verification for any past betId
 *   - Verification result with hash comparison
 */

import React, { useState } from 'react';
import { useVerifySpin } from '../../../hooks/useSpinData';
import { useSpinStore } from '../../../stores';

// ─── Info panel ───────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
      <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
        How provably fair works
      </h2>
      <div className="space-y-3">
        {[
          {
            step: '01',
            title: 'Server seed is hashed',
            body: 'Before every spin, the server generates a secret seed and shares only its SHA-256 hash. You can verify the hash matches after the reveal.',
          },
          {
            step: '02',
            title: 'You provide a client seed',
            body: 'Your browser generates a random client seed. You can change it at any time. This seed is combined with the server seed to produce the result.',
          },
          {
            step: '03',
            title: 'Nonce prevents reuse',
            body: 'A sequential nonce is appended to every spin so that the same seeds never produce the same result twice.',
          },
          {
            step: '04',
            title: 'Verify after the spin',
            body: 'Once the spin is complete the real server seed is revealed. You can independently compute SHA-256(serverSeed:clientSeed:nonce) and confirm it matches the pre-shared hash.',
          },
        ].map(({ step, title, body }) => (
          <div key={step} className="flex gap-3">
            <span className="text-[10px] font-black font-mono text-indigo-500 pt-0.5 shrink-0">{step}</span>
            <div>
              <p className="text-xs font-bold text-slate-200 mb-0.5">{title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Seed card ────────────────────────────────────────────────────────────────

function SeedCard({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">{label}</span>
        <button
          onClick={copy}
          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className={`text-xs break-all leading-relaxed ${mono ? 'font-mono text-indigo-300' : 'text-slate-300'}`}>
        {value || <span className="text-slate-600 italic">—</span>}
      </p>
    </div>
  );
}

// ─── Verify form ──────────────────────────────────────────────────────────────

function VerifyForm() {
  const { betId, setBetId, result, isError, isLoading } = useVerifySpin();

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
      <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
        Verify a spin
      </h2>

      <div className="space-y-2">
        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Bet ID
        </label>
        <input
          type="text"
          value={betId}
          onChange={(e) => setBetId(e.target.value.trim())}
          placeholder="Paste your bet ID…"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5
                     text-xs font-mono text-slate-200 placeholder:text-slate-600
                     focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
                     transition-colors"
        />
        <p className="text-[10px] text-slate-600 font-mono">
          Find the Bet ID in your spin history table.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-4">
          <p className="text-xs font-mono text-indigo-400 animate-pulse">Verifying…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3">
          <p className="text-xs font-mono text-red-400">Verification failed — bet not found or seeds not available.</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-4 space-y-3 ${
          result.isValid
            ? 'border-emerald-700/50 bg-emerald-900/20'
            : 'border-red-700/50 bg-red-900/20'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-xl ${result.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.isValid ? '✓' : '✗'}
            </span>
            <span className={`text-sm font-bold ${result.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.isValid ? 'Spin verified — result is provably fair' : 'Verification failed'}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <p className="text-slate-500 text-[10px] mb-1">Expected result</p>
                <p className="text-slate-200">{result.expected.result} × {result.expected.multiplier}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] mb-1">Computed result</p>
                <p className="text-slate-200">{result.actual.result} × {result.actual.multiplier}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] mb-1">Random value</p>
                <p className="text-indigo-300">{result.randomValue.toFixed(8)}</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-3 space-y-1">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">SHA-256 Hash</p>
              <p className="text-[10px] font-mono text-indigo-300 break-all leading-relaxed">{result.hash}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProvablyFairPage() {
  const clientSeed     = useSpinStore((s) => s.clientSeed);
  const serverSeedHash = useSpinStore((s) => s.serverSeedHash);
  const nonce          = useSpinStore((s) => s.nonce);
  const setClientSeed  = useSpinStore((s) => s.setClientSeed);

  const [editingSeed, setEditingSeed] = useState(false);
  const [draftSeed, setDraftSeed]     = useState(clientSeed);

  const saveSeed = () => {
    if (draftSeed.length >= 8) {
      setClientSeed(draftSeed.trim());
      setEditingSeed(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Provably Fair
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Cryptographic proof that every spin result is fair and unmanipulated
          </p>
        </div>

        {/* Current session seeds */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
            Current session
          </h2>

          <SeedCard
            label="Server seed hash (SHA-256)"
            value={serverSeedHash || 'Will be revealed after the next spin'}
          />

          {/* Client seed with edit */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                Client seed
              </span>
              <button
                onClick={() => { setEditingSeed(!editingSeed); setDraftSeed(clientSeed); }}
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {editingSeed ? 'Cancel' : 'Change'}
              </button>
            </div>
            {editingSeed ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draftSeed}
                  onChange={(e) => setDraftSeed(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200
                             focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={saveSeed}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-xs font-mono text-indigo-300 break-all">{clientSeed}</p>
            )}
          </div>

          <SeedCard
            label="Spin nonce (increments each spin)"
            value={String(nonce)}
            mono
          />
        </div>

        <VerifyForm />
        <HowItWorks />
      </div>
    </main>
  );
}