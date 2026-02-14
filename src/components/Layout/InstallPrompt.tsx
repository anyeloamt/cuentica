import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export function InstallPrompt(): JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
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

  if (isInstalled || !deferredPrompt) {
    return null;
  }

  const handleInstall = async (): Promise<void> => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      className="pwa-prompt"
      role="dialog"
      aria-live="polite"
      aria-label="Install app prompt"
    >
      <p>Install Cuentica for quicker access and offline support.</p>
      <div className="pwa-prompt__actions">
        <button type="button" onClick={handleInstall}>
          Install app
        </button>
        <button type="button" onClick={() => setDeferredPrompt(null)}>
          Not now
        </button>
      </div>
    </div>
  );
}
