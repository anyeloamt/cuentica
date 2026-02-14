interface ReloadPromptProps {
  offlineReady: boolean;
  needRefresh: boolean;
  onReload: () => Promise<void>;
  onDismiss: () => void;
}

export function ReloadPrompt({
  offlineReady,
  needRefresh,
  onReload,
  onDismiss,
}: ReloadPromptProps): JSX.Element | null {
  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="pwa-prompt" role="status" aria-live="polite">
      <p>
        {needRefresh ? 'A new version is available.' : 'App is ready to work offline.'}
      </p>
      <div className="pwa-prompt__actions">
        {needRefresh && (
          <button type="button" onClick={() => void onReload()}>
            Reload
          </button>
        )}
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
