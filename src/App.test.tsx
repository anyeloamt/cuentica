import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

const mockCreateWallet = vi.fn().mockResolvedValue({ ok: true });
const mockUseWallets = vi.fn();

vi.mock('./hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

vi.mock('./hooks/useBudgetItems', () => ({
  useBudgetItems: () => ({
    items: [],
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  }),
}));

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
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Cuentica')).toBeInTheDocument();
  });

  it('renders HomePage at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });

  it('renders WalletDetailPage at /wallet/:id', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/abc']}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it('redirects /nonexistent to home', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });
});
