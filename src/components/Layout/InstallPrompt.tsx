interface InstallPromptProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<void>;
}

export function InstallPrompt({
  isInstallable,
  isInstalled,
  onInstall,
}: InstallPromptProps): JSX.Element | null {
  if (isInstalled || !isInstallable) {
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
        <button type="button" onClick={() => void onInstall()}>
          Install app
        </button>
      </div>
    </div>
  );
}
