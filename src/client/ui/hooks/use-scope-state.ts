'use client';

import { useState, useCallback, useEffect } from 'react';

export function useScopeState(): {
  scopeCellId: string | null;
  openScope: (cellId: string) => void;
  closeScope: () => void;
} {
  const [scopeCellId, setScopeCellId] = useState<string | null>(null);

  const openScope = useCallback((cellId: string) => {
    setScopeCellId(cellId);
  }, []);

  const closeScope = useCallback(() => {
    setScopeCellId(null);
  }, []);

  useEffect(() => {
    if (scopeCellId === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setScopeCellId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scopeCellId]);

  return { scopeCellId, openScope, closeScope };
}
