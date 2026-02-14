import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { Wallet } from '../../types';

import { WalletList } from './WalletList';

describe('WalletList', () => {
  const mockOnDeleteWallet = vi.fn();

  it('renders loading fallback while wallets are undefined', () => {
    render(
      <MemoryRouter>
        <WalletList wallets={undefined} onDeleteWallet={mockOnDeleteWallet} />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading wallets/i)).toBeInTheDocument();
  });

  it('renders empty fallback when no wallets exist', () => {
    render(
      <MemoryRouter>
        <WalletList wallets={[]} onDeleteWallet={mockOnDeleteWallet} />
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

    render(
      <MemoryRouter>
        <WalletList wallets={wallets} onDeleteWallet={mockOnDeleteWallet} />
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

    render(
      <MemoryRouter>
        <WalletList wallets={wallets} onDeleteWallet={mockOnDeleteWallet} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /draft wallet/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /food/i })).toHaveAttribute(
      'href',
      '/wallet/wallet-2'
    );
  });

  it('calls onDeleteWallet when delete button is clicked', () => {
    const wallets: Wallet[] = [
      {
        id: 'wallet-1',
        name: 'Home',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    render(
      <MemoryRouter>
        <WalletList wallets={wallets} onDeleteWallet={mockOnDeleteWallet} />
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete home/i });
    fireEvent.click(deleteButton);

    expect(mockOnDeleteWallet).toHaveBeenCalledWith(wallets[0]);
  });
});
