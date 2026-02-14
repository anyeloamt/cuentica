import { useRegisterSW } from 'virtual:pwa-register/react';

export function ReloadPrompt(): JSX.Element | null {
  const { needRefresh, updateServiceWorker } = useRegisterSW();

  if (!needRefresh[0]) {
    return null;
  }

  const handleReload = (): void => {
    void updateServiceWorker(true);
  };

  const handleDismiss = (): void => {
    needRefresh[1](false);
  };

  return (
    <div className="pwa-prompt" role="status" aria-live="polite">
      <p>A new version is available.</p>
      <div className="pwa-prompt__actions">
        <button type="button" onClick={handleReload}>
          Reload
        </button>
        <button type="button" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
