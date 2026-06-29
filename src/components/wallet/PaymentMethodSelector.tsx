/**
 * components/wallet/PaymentMethodSelector.tsx
 * Telebirr / CBE Birr selector with agent details.
 */

import React, { useEffect, useState } from 'react';
import { DepositMethod, Agent } from '../../types';
import { getAgents } from '../../lib/api/walletApi';

interface PaymentMethodSelectorProps {
  value: DepositMethod | null;
  onChange: (method: DepositMethod) => void;
  disabled?: boolean;
}

const BRAND = {
  telebirr: { color: '#FF6B00', label: 'Telebirr', emoji: '🟠' },
  cbebirr:  { color: '#0066CC', label: 'CBE Birr', emoji: '🔵' },
};

/** Radio-style selector for Telebirr and CBE Birr payment methods. */
export function PaymentMethodSelector({ value, onChange, disabled = false }: PaymentMethodSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    getAgents().then(res => setAgents(res.agents)).catch(() => {});
  }, []);

  const agentFor = (method: DepositMethod) => agents.find(a => a.method === method);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-300">Payment Method</p>
      <div className="grid grid-cols-2 gap-3">
        {(['telebirr', 'cbebirr'] as DepositMethod[]).map(method => {
          const brand = BRAND[method];
          const agent = agentFor(method);
          const selected = value === method;
          return (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method)}
              className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition ${
                selected
                  ? 'border-opacity-100 bg-gray-700'
                  : 'border-gray-600 bg-gray-700/40 hover:bg-gray-700/70'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              style={{ borderColor: selected ? brand.color : undefined }}
            >
              {selected && (
                <span
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: brand.color }}
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              <span className="text-lg mb-1">{brand.emoji}</span>
              <span className="font-semibold text-white text-sm">{brand.label}</span>
              {agent && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-400 truncate">{agent.name}</p>
                  <p className="text-xs font-mono" style={{ color: brand.color }}>{agent.phone}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
