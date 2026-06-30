/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * components/wallet/DepositFlow.tsx — Premium Redesign
 * Preserves all original business logic (two-step flow, countdown, receipt upload).
 * New: casino-grade visuals, chip selectors, deposit summary with bonus display.
 */

import React, { useState, useRef } from 'react';
import { DepositMethod } from '../../types';
import { useDeposit } from '../../hooks/useDeposit';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface DepositFlowProps {
  onSuccess?: () => void;
}

const CHIPS = [100, 500, 1000, 5000, 10000, 50000];
const BONUS_RATE = 0.05;
const MIN_BONUS_DEPOSIT = 100;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function DepositSummary({ amount }: { amount: number }) {
  const bonus = amount >= MIN_BONUS_DEPOSIT ? Math.floor(amount * BONUS_RATE) : 0;
  const total = amount + bonus;
  const fmt = (n: number) => n.toLocaleString('en-ET');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px',
    }}>
      <SumRow label="Deposit Amount" value={`${fmt(amount)} ETB`} />
      <SumRow
        label={`Bonus (${(BONUS_RATE * 100).toFixed(0)}%)`}
        value={bonus > 0 ? `+${fmt(bonus)} ETB` : 'Min. 100 ETB required'}
        valueColor={bonus > 0 ? '#00E676' : '#4A5068'}
      />
      <SumRow label="Total You'll Get" value={`${fmt(total)} ETB`} valueColor="#F7B500" bold />
    </div>
  );
}

function SumRow({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      fontSize: '13px',
    }}>
      <span style={{ color: bold ? '#F0F0F8' : '#8890A8', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: valueColor || '#F0F0F8', fontSize: bold ? '15px' : '13px' }}>
        {value}
      </span>
    </div>
  );
}

function AgentBox({ pendingTx }: { pendingTx: any }) {
  const rows = [
    { label: 'Name',         value: pendingTx?.agent?.name,  mono: false },
    { label: 'Phone',        value: pendingTx?.agent?.phone, mono: true  },
    { label: 'Amount (exact)', value: `${pendingTx?.amount?.toLocaleString()} ETB`, mono: true, highlight: true },
  ];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '16px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '10px' }}>
        Transfer To
      </div>
      {rows.map(r => (
        <div key={r.label} style={{
          display: 'flex', justifyContent: 'space-between', padding: '5px 0',
          borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px',
        }}>
          <span style={{ color: '#8890A8' }}>{r.label}</span>
          <span style={{
            fontFamily: r.mono ? "'JetBrains Mono', monospace" : 'inherit',
            fontWeight: 600,
            color: r.highlight ? '#00E676' : '#F0F0F8',
          }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Premium two-step deposit flow with casino-grade UI. */
export function DepositFlow({ onSuccess }: DepositFlowProps) {
  const {
    step, pendingTx, countdown, error, loading,
    initiateDeposit, confirmDeposit, reset, moveToConfirm, backToInitiated,
  } = useDeposit();

  // Step 1 state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DepositMethod | null>(null);
  const [amountError, setAmountError] = useState('');
  const [activeChip, setActiveChip] = useState<number | null>(null);

  // Step 3 state
  const [reference, setReference] = useState('');
  const [refError, setRefError] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = Number(amount) || 0;
  const urgent = countdown < 180;

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB'); return; }
    setReceiptFile(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const handleChip = (v: number) => {
    setActiveChip(v);
    setAmount(String(v));
    setAmountError('');
  };

  const handleInitiate = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed < 10) { setAmountError('Minimum deposit is ETB 10'); return; }
    if (!method) { setAmountError('Please select a payment method'); return; }
    setAmountError('');
    await initiateDeposit(parsed, method);
  };

  const handleConfirm = async () => {
    if (!reference || reference.trim().length < 4) {
      setRefError('Reference must be at least 4 characters');
      return;
    }
    setRefError('');
    await confirmDeposit(reference.trim(), receiptFile ?? undefined);
    onSuccess?.();
  };

  const handleReset = () => {
    reset();
    setAmount('');
    setMethod(null);
    setReference('');
    setReceiptFile(null);
    setPreviewUrl(null);
    setActiveChip(null);
    setAmountError('');
    setRefError('');
  };

  // ── Error ──────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
        <div style={{
          background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)',
          borderRadius: '12px', padding: '14px', color: '#FF5252', fontSize: '14px',
          marginBottom: '20px', textAlign: 'left',
        }}>
          {error}
        </div>
        <PrimaryBtn onClick={handleReset}>Try Again</PrimaryBtn>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 'submitted') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(0,230,118,0.1)', border: '2px solid rgba(0,230,118,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '28px',
        }}>✓</div>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Awaiting Approval
        </h3>
        <p style={{ fontSize: '13px', color: '#8890A8', marginBottom: '20px' }}>
          Payment proof submitted. Admin will review shortly.
        </p>
        {pendingTx && (
          <AgentBox pendingTx={pendingTx} />
        )}
        <PrimaryBtn onClick={handleReset}>Make Another Deposit</PrimaryBtn>
      </div>
    );
  }

  // ── Step 3: Confirming ────────────────────────────────────────────────────
  if (step === 'confirming') {
    return (
      <div>
        <AgentBox pendingTx={pendingTx} />

        <div style={{ marginBottom: '18px' }}>
          <FieldLabel>Transaction Reference *</FieldLabel>
          <input
            type="text"
            value={reference}
            onChange={e => { setReference(e.target.value); setRefError(''); }}
            placeholder="e.g. TXN1234567890"
            style={inputStyle(!!refError)}
          />
          {refError && <ErrorText>{refError}</ErrorText>}
          <div style={{ fontSize: '11px', color: '#4A5068', marginTop: '4px' }}>
            The reference number from your Telebirr / CBE Birr transaction
          </div>
        </div>

        <FieldLabel>Receipt Screenshot (optional)</FieldLabel>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#7C3AED' : 'rgba(255,255,255,0.14)'}`,
            background: dragging ? 'rgba(124,58,237,0.05)' : 'transparent',
            borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s', marginBottom: '16px',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e.target.files?.[0])}
          />
          {previewUrl ? (
            <img src={previewUrl} alt="Receipt" style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'contain' }} />
          ) : receiptFile ? (
            <div style={{ color: '#00E676', fontSize: '13px' }}>✓ {receiptFile.name}</div>
          ) : (
            <>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
              <div style={{ fontSize: '13px', color: '#8890A8' }}>
                Drag & drop or <span style={{ color: '#9F5FFA' }}>browse</span>
              </div>
              <div style={{ fontSize: '11px', color: '#4A5068', marginTop: '4px' }}>PNG, JPG, PDF · max 5 MB</div>
            </>
          )}
        </div>
        {receiptFile && (
          <button
            onClick={() => { setReceiptFile(null); setPreviewUrl(null); }}
            style={{ background: 'none', border: 'none', color: '#4A5068', fontSize: '12px', cursor: 'pointer', marginBottom: '12px' }}
          >
            Remove file
          </button>
        )}

        <PrimaryBtn onClick={handleConfirm} loading={loading}>
          {loading ? 'Submitting…' : 'Confirm Deposit'}
        </PrimaryBtn>
        <GhostBtn onClick={backToInitiated} style={{ marginTop: '10px' }}>
          ← Back
        </GhostBtn>
      </div>
    );
  }

  // ── Step 2: Initiated — instructions + countdown ──────────────────────────
  if (step === 'initiated' && pendingTx) {
    return (
      <div>
        {/* Countdown */}
        <div style={{
          textAlign: 'center',
          background: urgent ? 'rgba(255,82,82,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${urgent ? 'rgba(255,82,82,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '12px', padding: '14px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '4px' }}>
            Time Remaining
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '36px', fontWeight: 700,
            color: urgent ? '#FF5252' : '#F0F0F8',
            animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
          }}>
            {formatCountdown(countdown)}
          </div>
        </div>

        <AgentBox pendingTx={pendingTx} />

        <div style={{ marginBottom: '20px' }}>
          {pendingTx.instructions?.map((instr: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#9F5FFA',
                flexShrink: 0, marginTop: '1px',
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: '13px', color: '#8890A8', lineHeight: 1.5 }}>{instr}</div>
            </div>
          ))}
        </div>

        <button
          onClick={moveToConfirm}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #00E676, #00B248)',
            color: '#000', fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          I Have Completed Payment →
        </button>
        <GhostBtn onClick={handleReset}>Cancel</GhostBtn>
      </div>
    );
  }

  // ── Step 1: Idle ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        {[['1', 'Select Method'], ['2', 'Enter Amount'], ['3', 'Confirm']].map(([num, label], i) => (
          <React.Fragment key={num}>
            {i > 0 && <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: i === 0 ? '#9F5FFA' : '#4A5068' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                border: `2px solid ${i === 0 ? '#7C3AED' : '#4A5068'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
              }}>{num}</div>
              {label}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Payment method */}
      <FieldLabel style={{ marginBottom: '10px' }}>1. Select Payment Method</FieldLabel>
      <PaymentMethodSelector value={method} onChange={setMethod} />

      {/* Amount */}
      <div style={{ marginTop: '20px', marginBottom: '16px' }}>
        <FieldLabel>2. Enter Amount (ETB)</FieldLabel>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${amountError ? '#FF5252' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountError(''); setActiveChip(null); }}
            placeholder="1,000"
            min={10}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              padding: '14px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '22px', fontWeight: 600, color: '#F0F0F8',
              outline: 'none', width: 0,
            }}
          />
          <div style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#8890A8', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            ETB
          </div>
        </div>
        {amountError && <ErrorText>{amountError}</ErrorText>}

        {/* Chip presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {CHIPS.map(v => (
            <button
              key={v}
              onClick={() => handleChip(v)}
              style={{
                padding: '7px 14px',
                background: activeChip === v ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${activeChip === v ? '#7C3AED' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px', fontWeight: 600,
                color: activeChip === v ? '#9F5FFA' : '#F0F0F8',
                transition: 'all 0.15s',
              }}
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit summary with bonus */}
      {parsedAmount >= 10 && <DepositSummary amount={parsedAmount} />}

      <PrimaryBtn onClick={handleInitiate} loading={loading}>
        {loading ? 'Initiating…' : 'DEPOSIT NOW →'}
      </PrimaryBtn>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '11px', color: '#4A5068' }}>
        <span>🔒 Secure</span>
        <span>⚡ Instant</span>
        <span>✓ Encrypted</span>
      </div>
    </div>
  );
}

// ── Shared UI primitives ───────────────────────────────────────────────────────

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '8px', ...style }}>
      {children}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '12px', color: '#FF5252', marginTop: '4px' }}>{children}</div>;
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${hasError ? '#FF5252' : 'rgba(255,255,255,0.14)'}`,
    borderRadius: '10px', padding: '12px 14px',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '14px', color: '#F0F0F8', outline: 'none',
    transition: 'border-color 0.2s',
  };
}

function PrimaryBtn({ children, onClick, loading, style }: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '14px',
        background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
        color: '#fff',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '17px', fontWeight: 700, letterSpacing: '1px',
        border: 'none', borderRadius: '12px', cursor: 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        ...style,
      }}
    >
      {loading && <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '10px',
        background: 'transparent', border: 'none',
        color: '#4A5068', cursor: 'pointer',
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '13px', transition: 'color 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}