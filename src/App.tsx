import { Route, Routes } from 'react-router-dom';

import { HomePage } from './components/Home/HomePage';
import { AuthPage } from './components/Auth/AuthPage';
import { NotFoundPage } from './components/Home/NotFoundPage';
import { WalletDetailPage } from './components/Budget/WalletDetailPage';
import { InstallPrompt } from './components/Layout/InstallPrompt';
import { IOSInstallPrompt } from './components/Layout/IOSInstallPrompt';
import { ReloadPrompt } from './components/Layout/ReloadPrompt';
import { AppLayout } from './components/Layout/AppLayout';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useIOSInstallPrompt } from './hooks/useIOSInstallPrompt';
import { useMigration } from './hooks/useMigration';
import { usePwaUpdatePrompt } from './hooks/usePwaUpdatePrompt';
import './components/Layout/pwaPrompts.css';

export function App(): JSX.Element {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { shouldShow: showIOSPrompt, dismiss: dismissIOSPrompt } = useIOSInstallPrompt();
  const { offlineReady, needRefresh, updateServiceWorker, dismiss } =
    usePwaUpdatePrompt();
  const { migrating, error, retry } = useMigration();

  return (
    <>
      <ReloadPrompt
        offlineReady={offlineReady}
        needRefresh={needRefresh}
        onReload={updateServiceWorker}
        onDismiss={dismiss}
      />
      <InstallPrompt
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={promptInstall}
      />
      <IOSInstallPrompt shouldShow={showIOSPrompt} onDismiss={dismissIOSPrompt} />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/wallet/:id" element={<WalletDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      {(migrating || error) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg-primary/95 px-6">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-bg-primary p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-text-primary">
              Syncing your data...
            </h2>
            {migrating ? (
              <>
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
                  aria-label="Sync in progress"
                />
                <p className="text-sm text-text-secondary">
                  Please keep this tab open while we sync your wallets and budget items.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
