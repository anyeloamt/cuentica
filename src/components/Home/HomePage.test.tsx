import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HomePage } from './HomePage';

const mockUseWallets = vi.fn();

vi.mock('../../hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    mockUseWallets.mockReset();
  });

  it('renders wallet list empty state', () => {
    mockUseWallets.mockReturnValue([]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });

  it('renders wallet links from WalletList', () => {
    mockUseWallets.mockReturnValue([
      {
        id: 'wallet-1',
        name: 'Main Wallet',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /main wallet/i })).toHaveAttribute(
      'href',
      '/wallet/wallet-1'
    );
  });
});
