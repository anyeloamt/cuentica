import { useCallback, useEffect, useState } from 'react';

export type InstallPromptOutcome = 'accepted' | 'dismissed';

export interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: InstallPromptOutcome;
    platform: string;
  }>;
}

interface UseInstallPromptResult {
  isInstallable: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
}

const INSTALL_PROMPT_DISMISS_KEY = 'install-prompt-dismissed';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isDismissedInStorage(): boolean {
  const dismissedAt = localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY);
  if (!dismissedAt) return false;
  const dismissedTime = parseInt(dismissedAt, 10);
  return Date.now() - dismissedTime < THIRTY_DAYS_MS;
}

function isDeferredInstallPromptEvent(event: Event): event is DeferredInstallPromptEvent {
  return 'prompt' in event && 'userChoice' in event;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => isDismissedInStorage());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
      if (!isDeferredInstallPromptEvent(event)) {
        return;
      }

      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = (): void => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Failed to trigger install prompt', error);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback((): void => {
    localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  return {
    isInstallable: deferredPrompt !== null,
    isInstalled,
    isDismissed,
    promptInstall,
    dismiss,
  };
}
