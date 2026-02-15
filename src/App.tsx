import { Route, Routes } from 'react-router-dom';

import { HomePage } from './components/Home/HomePage';
import { NotFoundPage } from './components/Home/NotFoundPage';
import { WalletDetailPage } from './components/Budget/WalletDetailPage';
import { InstallPrompt } from './components/Layout/InstallPrompt';
import { IOSInstallPrompt } from './components/Layout/IOSInstallPrompt';
import { ReloadPrompt } from './components/Layout/ReloadPrompt';
import { AppLayout } from './components/Layout/AppLayout';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useIOSInstallPrompt } from './hooks/useIOSInstallPrompt';
import { usePwaUpdatePrompt } from './hooks/usePwaUpdatePrompt';
import './components/Layout/pwaPrompts.css';

export function App(): JSX.Element {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { shouldShow: showIOSPrompt, dismiss: dismissIOSPrompt } = useIOSInstallPrompt();
  const { offlineReady, needRefresh, updateServiceWorker, dismiss } =
    usePwaUpdatePrompt();

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
          <Route path="/wallet/:id" element={<WalletDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
