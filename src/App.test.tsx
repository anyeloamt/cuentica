import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from './App';
import { BudgetClipboardProvider } from './context/BudgetClipboardContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const mockCreateWallet = vi.fn().mockResolvedValue({ ok: true });
const mockUseWallets = vi.fn();

vi.mock('./hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

vi.mock('./hooks/useBudgetItems', () => ({
  useBudgetItems: () => ({
    items: [],
    addItems: vi.fn().mockResolvedValue({ ok: true, ids: [] }),
    appendItemsFromPaste: vi.fn().mockResolvedValue({ ok: true, insertedCount: 0 }),
    trimEmptyRows: vi.fn().mockResolvedValue({ ok: true, count: 0 }),
    updateItem: vi.fn(),
    deleteItem: vi.fn().mockResolvedValue({ ok: true }),
    restoreItem: vi.fn().mockResolvedValue({ ok: true }),
    reorderBudgetItems: vi.fn().mockResolvedValue({ ok: true }),
  }),
}));

function renderApp(initialEntries: string[] = ['/']): void {
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <BudgetClipboardProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BudgetClipboardProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    mockUseWallets.mockReset();
    mockUseWallets.mockReturnValue({
      wallets: [],
      createWallet: mockCreateWallet,
      deleteWallet: vi.fn(),
      renameWallet: vi.fn(),
      reorderWallet: vi.fn(),
    });
  });

  it('renders without crashing', () => {
    renderApp();
    expect(screen.getByText('Cuentica')).toBeInTheDocument();
  });

  it('renders HomePage at /', () => {
    renderApp(['/']);
    expect(screen.getByText(/ready to start budgeting\?/i)).toBeInTheDocument();
  });

  it('renders WalletDetailPage at /wallet/:id', () => {
    renderApp(['/wallet/abc']);
    expect(screen.getByText(/your budget starts here/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage at /nonexistent', () => {
    renderApp(['/nonexistent']);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
