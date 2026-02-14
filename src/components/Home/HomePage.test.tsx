import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { HomePage } from './HomePage';

const mockUseWallets = vi.fn();
const mockCreateWallet = vi.fn();
const mockDeleteWallet = vi.fn();

vi.mock('../../hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    mockUseWallets.mockReset();
    mockCreateWallet.mockReset();
    mockDeleteWallet.mockReset();
    mockUseWallets.mockReturnValue({
      wallets: [],
      createWallet: mockCreateWallet,
      deleteWallet: mockDeleteWallet,
    });
  });

  it('renders FAB button', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole('button', { name: /add wallet/i });
    expect(fabButton).toBeInTheDocument();
  });

  it('renders wallet list empty state', () => {
    mockUseWallets.mockReturnValue({
      wallets: [],
      createWallet: mockCreateWallet,
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });

  it('renders wallet links from WalletList', () => {
    mockUseWallets.mockReturnValue({
      wallets: [
        {
          id: 'wallet-1',
          name: 'Main Wallet',
          order: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createWallet: mockCreateWallet,
    });

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

  it('opens create wallet modal when FAB is clicked', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole('button', { name: /add wallet/i });
    fireEvent.click(fabButton);

    expect(screen.getByRole('dialog', { name: /new wallet/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/wallet name/i)).toHaveFocus();
  });

  it('calls createWallet and closes modal on submit', async () => {
    mockCreateWallet.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add wallet/i }));
    });

    const input = screen.getByLabelText(/wallet name/i);
    await waitFor(() => expect(input).toHaveFocus());

    await act(async () => {
      await user.type(input, 'New Wallet');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^create$/i }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(mockCreateWallet).toHaveBeenCalledWith('New Wallet');
  });

  it('shows error when createWallet fails', async () => {
    mockCreateWallet.mockResolvedValue({ ok: false, error: 'empty-name' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add wallet/i }));
    });

    const input = screen.getByLabelText(/wallet name/i);
    await waitFor(() => expect(input).toHaveFocus());

    await act(async () => {
      await user.type(input, 'Valid Name But Mock Fail');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^create$/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/wallet name cannot be empty/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /^create$/i })).not.toBeDisabled();
  });

  it('handles delete wallet flow', async () => {
    mockUseWallets.mockReturnValue({
      wallets: [
        {
          id: 'w1',
          name: 'Wallet To Delete',
          order: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createWallet: mockCreateWallet,
      deleteWallet: mockDeleteWallet,
    });
    mockDeleteWallet.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 1. Click delete button on the wallet card
    const deleteButton = screen.getByRole('button', { name: /delete wallet to delete/i });
    await act(async () => {
      await user.click(deleteButton);
    });

    // 2. Verify modal appears
    expect(
      screen.getByRole('dialog', { name: /delete wallet to delete/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all budget items in this wallet will be lost/i)
    ).toBeInTheDocument();

    // 3. Click delete in the modal
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await act(async () => {
      await user.click(confirmButton);
    });

    // 4. Verify deleteWallet was called
    expect(mockDeleteWallet).toHaveBeenCalledWith('w1');

    // 5. Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /delete wallet to delete/i })
      ).not.toBeInTheDocument();
    });
  });

  it('cancels delete wallet flow', async () => {
    mockUseWallets.mockReturnValue({
      wallets: [
        {
          id: 'w1',
          name: 'Wallet To Keep',
          order: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createWallet: mockCreateWallet,
      deleteWallet: mockDeleteWallet,
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 1. Open delete modal
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /delete wallet to keep/i }));
    });

    // 2. Click cancel
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    });

    // 3. Verify modal closes and deleteWallet was NOT called
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockDeleteWallet).not.toHaveBeenCalled();
  });

  it('disables create button when input is empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add wallet/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /new wallet/i })).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /^create$/i });

    expect(createButton).toBeDisabled();

    await act(async () => {
      await user.type(screen.getByLabelText(/wallet name/i), '   ');
    });
    expect(createButton).toBeDisabled();

    await act(async () => {
      await user.type(screen.getByLabelText(/wallet name/i), 'Valid Name');
    });
    expect(createButton).toBeEnabled();
  });
});
