import { InstallPrompt } from './components/Layout/InstallPrompt';
import { ReloadPrompt } from './components/Layout/ReloadPrompt';
import './components/Layout/pwaPrompts.css';

export function App(): JSX.Element {
  return (
    <div>
      <h1>Cuentica</h1>
      <p>Simple budgeting PWA</p>
      <ReloadPrompt />
      <InstallPrompt />
    </div>
  );
}
