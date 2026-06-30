/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * components/wallet/WithdrawalForm.tsx — Premium Redesign
 * Preserves all original validation + business logic.
 * New: casino-grade visuals, chip presets, withdrawal summary.
 */

import React, { useState } from 'react';
import { DepositMethod } from '../../types';
import { useWithdrawal } from '../../hooks/useWithdrawal';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface WithdrawalFormProps {
  availableBalance: number;
  onSuccess?: () => void;
}

const PHONE_RE = /^(09|07)\d{8}$/;
const W_CHIPS = [500, 1000, 5000, 10000, 50000];

export function WithdrawalForm({ availableBalance, onSuccess }: WithdrawalFormProps) {
  const { loading, error, success, submittedTx, submitWithdrawal, reset } = useWithdrawal();

  const [amount, setAmount]         = useState('');
  const [method, setMethod]         = useState<DepositMethod | null>(null);
  const [agentPhone, setAgentPhone] = useState('');
  const [agentName, setAgentName]   = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parsedAmount = Number(amount) || 0;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!parsedAmount || parsedAmount < 50)     errs.amount = 'Minimum withdrawal is ETB 50';
    if (parsedAmount > availableBalance)        errs.amount = `Insufficient balance (available: ETB ${availableBalance.toLocaleString()})`;
    if (!method)                               errs.method = 'Select a payment method';
    if (!PHONE_RE.test(agentPhone))            errs.agentPhone = 'Valid Ethiopian phone: 09xxxxxxxx or 07xxxxxxxx';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !method) return;
    await submitWithdrawal(parsedAmount, method, agentPhone, agentName || undefined);
    onSuccess?.();
  };

  const s = (key: string) => ({
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${fieldErrors[key] ? '#FF5252' : 'rgba(255,255,255,0.14)'}`,
    borderRadius: '10px', padding: '12px 14px',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '14px', color: '#F0F0F8', outline: 'none',
    width: '100%', transition: 'border-color 0.2s',
  } as React.CSSProperties);

  if (success && submittedTx) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(0,230,118,0.1)', border: '2px solid rgba(0,230,118,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '28px',
        }}>✓</div>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Request Submitted
        </h3>
        <p style={{ fontSize: '13px', color: '#8890A8', marginBottom: '20px' }}>
          Admin will transfer funds to your phone shortly.
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left',
        }}>
          {[
            ['Amount', `ETB ${(submittedTx as any).amount?.toLocaleString()}`],
            ['Method', (submittedTx as any).method === 'telebirr' ? 'Telebirr' : 'CBE Birr'],
            ['To Phone', (submittedTx as any).agentPhone || '—'],
            ['Status', 'Pending Review'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
              <span style={{ color: '#8890A8' }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { reset(); setAmount(''); setMethod(null); setAgentPhone(''); setAgentName(''); setActiveChip(null); }}
          style={{
            width: '100%', padding: '13px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
            color: '#F0F0F8', fontFamily: "'Rajdhani', sans-serif",
            fontSize: '15px', fontWeight: 700, borderRadius: '12px', cursor: 'pointer',
          }}
        >
          New Withdrawal
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Balance display */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,230,118,0.1), rgba(0,230,118,0.04))',
        border: '1px solid rgba(0,230,118,0.2)',
        borderRadius: '12px', padding: '16px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '4px' }}>
            Withdrawable Balance
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '24px', fontWeight: 700, color: '#00E676' }}>
            {fmt(availableBalance)} ETB
          </div>
        </div>
        <span style={{ fontSize: '32px' }}>💚</span>
      </div>

      {/* Freeze notice */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.2)',
        borderRadius: '10px', padding: '12px', marginBottom: '18px',
        fontSize: '12px', color: '#FFA040',
      }}>
        <span>⚠️</span>
        <div>Your balance will be <strong>frozen immediately</strong> when you submit. Restored if rejected.</div>
      </div>

      {/* API error */}
      {error && (
        <div style={{
          background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)',
          borderRadius: '10px', padding: '12px', color: '#FF5252',
          fontSize: '13px', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Payment method */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '8px' }}>
          Payment Method
        </div>
        <PaymentMethodSelector value={method} onChange={m => { setMethod(m); setFieldErrors(p => ({ ...p, method: '' })); }} />
        {fieldErrors.method && <div style={{ fontSize: '12px', color: '#FF5252', marginTop: '4px' }}>{fieldErrors.method}</div>}
      </div>

      {/* Amount */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '8px' }}>
          Amount (ETB)
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${fieldErrors.amount ? '#FF5252' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <input
            type="number" value={amount} min={50}
            onChange={e => { setAmount(e.target.value); setActiveChip(null); setFieldErrors(p => ({ ...p, amount: '' })); }}
            placeholder="Minimum ETB 50"
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '13px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '20px', fontWeight: 600, color: '#F0F0F8', outline: 'none', width: 0 }}
          />
          <div style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#8890A8', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>ETB</div>
        </div>
        {fieldErrors.amount && <div style={{ fontSize: '12px', color: '#FF5252', marginTop: '4px' }}>{fieldErrors.amount}</div>}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {W_CHIPS.map(v => (
            <button key={v} onClick={() => { setActiveChip(v); setAmount(String(v)); setFieldErrors(p => ({ ...p, amount: '' })); }} style={{
              padding: '6px 12px',
              background: activeChip === v ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${activeChip === v ? '#7C3AED' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', fontWeight: 600,
              color: activeChip === v ? '#9F5FFA' : '#F0F0F8',
            }}>
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '8px' }}>
          Your Phone Number *
        </div>
        <input
          type="tel" value={agentPhone} maxLength={10} placeholder="09xxxxxxxx"
          onChange={e => { setAgentPhone(e.target.value); setFieldErrors(p => ({ ...p, agentPhone: '' })); }}
          style={s('agentPhone')}
        />
        {fieldErrors.agentPhone && <div style={{ fontSize: '12px', color: '#FF5252', marginTop: '4px' }}>{fieldErrors.agentPhone}</div>}
      </div>

      {/* Account name */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8890A8', marginBottom: '8px' }}>
          Account Name (optional)
        </div>
        <input
          type="text" value={agentName} placeholder="Name on your mobile account"
          onChange={e => setAgentName(e.target.value)}
          style={s('agentName')}
        />
      </div>

      {/* Summary */}
      {parsedAmount >= 50 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '14px', marginBottom: '16px',
        }}>
          {[
            ['Withdrawal Amount', `${parsedAmount.toLocaleString()} ETB`, '#F0F0F8'],
            ['Processing Fee', 'Free', '#00E676'],
            ["You'll Receive", `${parsedAmount.toLocaleString()} ETB`, '#00E676'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
              <span style={{ color: '#8890A8' }}>{l}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: c as string }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)',
          color: '#00E676', fontFamily: "'Rajdhani', sans-serif",
          fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px',
          borderRadius: '12px', cursor: 'pointer', opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {loading && <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(0,230,118,0.4)', borderTopColor: '#00E676', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
        REQUEST WITHDRAWAL ⬆
      </button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '11px', color: '#4A5068' }}>
        <span>🔒 Secure</span><span>⏱ 5-30 min</span><span>✓ Verified</span>
      </div>
    </div>
  );
}