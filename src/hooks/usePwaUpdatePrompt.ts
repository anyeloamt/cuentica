import { useCallback, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface UsePwaUpdatePromptResult {
  offlineReady: boolean;
  needRefresh: boolean;
  updateServiceWorker: () => Promise<void>;
  dismiss: () => void;
}

export function usePwaUpdatePrompt(): UsePwaUpdatePromptResult {
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

  const handleUpdateServiceWorker = useCallback(async (): Promise<void> => {
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Failed to update service worker', error);
    }
  }, [updateServiceWorker]);

  const dismiss = useCallback((): void => {
    offlineReady[1](false);
    needRefresh[1](false);
  }, [needRefresh, offlineReady]);

  const isOfflineReady = offlineReady[0];

  useEffect(() => {
    if (isOfflineReady) {
      const timer = setTimeout(() => {
        dismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOfflineReady, dismiss]);

  return {
    offlineReady: offlineReady[0],
    needRefresh: needRefresh[0],
    updateServiceWorker: handleUpdateServiceWorker,
    dismiss,
  };
}
