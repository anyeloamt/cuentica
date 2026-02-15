import { useState, useEffect } from 'react';

const IOS_PROMPT_DISMISS_KEY = 'ios-install-prompt-dismissed';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface UseIOSInstallPrompt {
  shouldShow: boolean;
  dismiss: () => void;
}

export function useIOSInstallPrompt(): UseIOSInstallPrompt {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!isIOS) {
      return;
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        (navigator as unknown as { standalone: boolean }).standalone === true);

    if (isStandalone) {
      return;
    }

    const dismissedAt = localStorage.getItem(IOS_PROMPT_DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < THIRTY_DAYS_MS) {
        return;
      }
    }

    setShouldShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(IOS_PROMPT_DISMISS_KEY, Date.now().toString());
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}
