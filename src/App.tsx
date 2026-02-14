import { InstallPrompt } from './components/Layout/InstallPrompt';
import { ReloadPrompt } from './components/Layout/ReloadPrompt';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { usePwaUpdatePrompt } from './hooks/usePwaUpdatePrompt';
import './components/Layout/pwaPrompts.css';

export function App(): JSX.Element {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { offlineReady, needRefresh, updateServiceWorker, dismiss } =
    usePwaUpdatePrompt();

  return (
    <div>
      <h1>Cuentica</h1>
      <p>Simple budgeting PWA</p>
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
    </div>
  );
}
