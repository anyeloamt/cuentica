interface InstallPromptProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

export function InstallPrompt({
  isInstallable,
  isInstalled,
  isDismissed,
  onInstall,
  onDismiss,
}: InstallPromptProps): JSX.Element | null {
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  return (
    <div
      className="pwa-prompt"
      role="dialog"
      aria-live="polite"
      aria-label="Install app prompt"
    >
      <p>Install Cuentica for quicker access and offline support.</p>
      <div className="pwa-prompt__actions">
        <button
          type="button"
          className="pwa-prompt__action-primary"
          onClick={() => void onInstall()}
        >
          Install app
        </button>
        <button
          type="button"
          className="pwa-prompt__action-secondary"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
