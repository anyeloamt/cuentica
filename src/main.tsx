import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BudgetClipboardProvider } from './context/BudgetClipboardContext';
import { ToastProvider } from './context/ToastContext';
import { App } from './App';
import { ToastViewport } from './components/Feedback/ToastViewport';
import './styles/global.css';

const applyInitialTheme = (): void => {
  try {
    const savedTheme = localStorage.getItem('cuentica-theme');
    const theme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1c1917' : '#faf9f7');
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

applyInitialTheme();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BudgetClipboardProvider>
            <ToastProvider>
              <App />
              <ToastViewport />
            </ToastProvider>
          </BudgetClipboardProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
