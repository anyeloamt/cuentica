import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider } from '../../context/AuthContext';

import { Header } from './Header';

vi.mock('../Settings/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Toggle</button>,
}));

vi.mock('../../hooks/useWalletName', () => ({
  useWalletName: (id: string | undefined) => (id === '123' ? 'My Budget' : undefined),
}));

describe('Header', () => {
  it('renders "Cuentica" title on home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Cuentica')).toBeInTheDocument();
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });

  it('shows back button and wallet name on wallet detail route', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/123']}>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('My Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  it('shows fallback "Wallet" when wallet name is not found', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/unknown']}>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Wallet')).toBeInTheDocument();
  });

  it('renders ThemeToggle', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});
