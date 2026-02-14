import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { Wallet } from '../../types';

import { WalletList } from './WalletList';

describe('WalletList', () => {
  const mockOnDeleteWallet = vi.fn();
  const mockOnRenameWallet = vi.fn();
  const mockOnReorderWallet = vi.fn();

  const defaultProps = {
    wallets: [],
    onDeleteWallet: mockOnDeleteWallet,
    onRenameWallet: mockOnRenameWallet,
    onReorderWallet: mockOnReorderWallet,
  };

  it('renders loading fallback while wallets are undefined', () => {
    render(
      <MemoryRouter>
        <WalletList {...defaultProps} wallets={undefined} />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading wallets/i)).toBeInTheDocument();
  });

  it('renders empty fallback when no wallets exist', () => {
    render(
      <MemoryRouter>
        <WalletList {...defaultProps} wallets={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
    expect(screen.getByText(/tap \+ to create your first wallet/i)).toBeInTheDocument();
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
        <WalletList {...defaultProps} wallets={wallets} />
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
        <WalletList {...defaultProps} wallets={wallets} />
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
        <WalletList {...defaultProps} wallets={wallets} />
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete home/i });
    fireEvent.click(deleteButton);

    expect(mockOnDeleteWallet).toHaveBeenCalledWith(wallets[0]);
  });

  it('handles inline rename', () => {
    const wallets: Wallet[] = [
      {
        id: 'w1',
        name: 'Old Name',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    render(
      <MemoryRouter>
        <WalletList {...defaultProps} wallets={wallets} />
      </MemoryRouter>
    );

    const nameElement = screen.getByText('Old Name');
    fireEvent.click(nameElement);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.blur(input);

    expect(mockOnRenameWallet).toHaveBeenCalledWith('w1', 'New Name');
  });

  it('renders reorder buttons', () => {
    const wallets: Wallet[] = [
      { id: 'w1', name: '1', order: 1, createdAt: 1, updatedAt: 1 },
      { id: 'w2', name: '2', order: 2, createdAt: 1, updatedAt: 1 },
    ];

    render(
      <MemoryRouter>
        <WalletList {...defaultProps} wallets={wallets} />
      </MemoryRouter>
    );

    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    const downButtons = screen.getAllByRole('button', { name: /move down/i });

    expect(upButtons).toHaveLength(1);
    expect(downButtons).toHaveLength(1);
  });

  it('calls onReorderWallet when clicked', () => {
    const wallets: Wallet[] = [
      { id: 'w1', name: '1', order: 1, createdAt: 1, updatedAt: 1 },
      { id: 'w2', name: '2', order: 2, createdAt: 1, updatedAt: 1 },
    ];

    render(
      <MemoryRouter>
        <WalletList {...defaultProps} wallets={wallets} />
      </MemoryRouter>
    );

    const downButton = screen.getByRole('button', { name: /move down/i });
    fireEvent.click(downButton);
    expect(mockOnReorderWallet).toHaveBeenCalledWith('w1', 'down');
  });
});
