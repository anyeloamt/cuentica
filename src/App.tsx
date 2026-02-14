import { InstallPrompt } from './components/Layout/InstallPrompt';
import { ReloadPrompt } from './components/Layout/ReloadPrompt';
import { ThemeToggle } from './components/Settings/ThemeToggle';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { usePwaUpdatePrompt } from './hooks/usePwaUpdatePrompt';
import './components/Layout/pwaPrompts.css';

export function App(): JSX.Element {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { offlineReady, needRefresh, updateServiceWorker, dismiss } =
    usePwaUpdatePrompt();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-200">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-accent">Cuentica</h1>
        <ThemeToggle />
      </header>
      <main className="p-4">
        <p className="mb-4">Simple budgeting PWA</p>
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
      </main>
    </div>
  );
}
