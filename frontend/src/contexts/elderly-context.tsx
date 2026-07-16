/**
 * @project AncestorTree
 * @file src/contexts/elderly-context.tsx
 * @description Elderly mode context — larger fonts, simplified UI
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface ElderlyContextValue {
  elderlyMode: boolean;
  toggleElderlyMode: () => void;
}

const ElderlyContext = createContext<ElderlyContextValue>({
  elderlyMode: false,
  toggleElderlyMode: () => {},
});

export function ElderlyProvider({ children }: { children: React.ReactNode }) {
  const [elderlyMode, setElderlyMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('elderlyMode');
    if (stored === 'true') {
      document.documentElement.classList.add('elderly-mode');
      return true;
    }
    return false;
  });

  const toggleElderlyMode = useCallback(() => {
    setElderlyMode(prev => {
      const next = !prev;
      localStorage.setItem('elderlyMode', String(next));
      if (next) {
        document.documentElement.classList.add('elderly-mode');
      } else {
        document.documentElement.classList.remove('elderly-mode');
      }
      return next;
    });
  }, []);

  return (
    <ElderlyContext.Provider value={{ elderlyMode, toggleElderlyMode }}>
      {children}
    </ElderlyContext.Provider>
  );
}

export function useElderly() {
  return useContext(ElderlyContext);
}
