import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Wallet } from '../../types';

import { WalletList } from './WalletList';

const mockUseWallets = vi.fn();

vi.mock('../../hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

describe('WalletList', () => {
  beforeEach(() => {
    mockUseWallets.mockReset();
  });

  it('renders loading fallback while wallets are undefined', () => {
    mockUseWallets.mockReturnValue({ wallets: undefined });

    render(
      <MemoryRouter>
        <WalletList />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading wallets/i)).toBeInTheDocument();
  });

  it('renders empty fallback when no wallets exist', () => {
    mockUseWallets.mockReturnValue({ wallets: [] });

    render(
      <MemoryRouter>
        <WalletList />
      </MemoryRouter>
    );

    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });

  it('renders wallet links for wallets with ids', () => {
    const wallets: Wallet[] = [
      {
        id: 'wallet-1',
        name: 'Home',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'wallet-2',
        name: 'Food',
        order: 2,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    mockUseWallets.mockReturnValue({ wallets });

    render(
      <MemoryRouter>
        <WalletList />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: /home/i });
    const foodLink = screen.getByRole('link', { name: /food/i });

    expect(homeLink).toHaveAttribute('href', '/wallet/wallet-1');
    expect(foodLink).toHaveAttribute('href', '/wallet/wallet-2');
  });

  it('skips wallets without id', () => {
    const wallets: Wallet[] = [
      {
        name: 'Draft Wallet',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'wallet-2',
        name: 'Food',
        order: 2,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    mockUseWallets.mockReturnValue({ wallets });

    render(
      <MemoryRouter>
        <WalletList />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /draft wallet/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /food/i })).toHaveAttribute(
      'href',
      '/wallet/wallet-2'
    );
  });
});
