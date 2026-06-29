/**
 * hooks/useAutoMark.ts
 * 
 * Manages the auto-mark toggle state with localStorage persistence.
 * Auto-mark is a frontend-only preference that determines whether
 * drawn balls are automatically highlighted on bingo cards.
 * 
 * When auto-mark is OFF, players must manually tap cells to mark them.
 * Win detection is always server-side regardless of this setting.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dashbets_automark';

export function useAutoMark() {
  const [autoMark, setAutoMark] = useState<boolean>(true);

  // Load saved preference on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setAutoMark(saved === 'true');
    }
  }, []);

  // Toggle and persist
  const toggleAutoMark = () => {
    setAutoMark((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  // Set explicitly (useful for resetting)
  const setAutoMarkState = (value: boolean) => {
    setAutoMark(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  };

  return {
    autoMark,
    toggleAutoMark,
    setAutoMarkState,
  };
}