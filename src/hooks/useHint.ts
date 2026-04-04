import { useState, useCallback } from 'react';

export function useHint(key: string): { visible: boolean; dismiss: () => void } {
  const storageKey = `hint-${key}-dismissed`;
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });

  const dismiss = useCallback((): void => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
  }, [storageKey]);

  return { visible, dismiss };
}
