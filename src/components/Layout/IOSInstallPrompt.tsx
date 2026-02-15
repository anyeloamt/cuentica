import './pwaPrompts.css';

interface IOSInstallPromptProps {
  shouldShow: boolean;
  onDismiss: () => void;
}

export function IOSInstallPrompt({
  shouldShow,
  onDismiss,
}: IOSInstallPromptProps): JSX.Element | null {
  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className="pwa-prompt"
      role="dialog"
      aria-live="polite"
      aria-label="Install app instructions"
    >
      <div className="mb-2">
        <p className="mb-2 font-medium">Install Cuentica</p>
        <p className="text-sm">
          Tap the <ShareIcon /> icon below, then select{' '}
          <span className="font-bold">Add to Home Screen</span>.
        </p>
      </div>
      <div className="pwa-prompt__actions">
        <button type="button" onClick={onDismiss}>
          Close
        </button>
      </div>
    </div>
  );
}

function ShareIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block w-5 h-5 mx-1 align-text-bottom"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
