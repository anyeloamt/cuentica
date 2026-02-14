import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { HomePage } from './HomePage';

const mockUseWallets = vi.fn();
const mockCreateWallet = vi.fn();

vi.mock('../../hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    mockUseWallets.mockReset();
    mockCreateWallet.mockReset();
    mockUseWallets.mockReturnValue({
      wallets: [],
      createWallet: mockCreateWallet,
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

    await user.click(screen.getByRole('button', { name: /add wallet/i }));

    const input = screen.getByLabelText(/wallet name/i);
    await user.type(input, 'New Wallet');

    await user.click(screen.getByRole('button', { name: /^create$/i }));

    expect(mockCreateWallet).toHaveBeenCalledWith('New Wallet');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows error when createWallet fails', async () => {
    mockCreateWallet.mockResolvedValue({ ok: false, error: 'empty-name' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /add wallet/i }));

    const input = screen.getByLabelText(/wallet name/i);
    await user.type(input, 'Valid Name But Mock Fail');

    await user.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByText(/wallet name cannot be empty/i)).toBeInTheDocument();
  });

  it('disables create button when input is empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /add wallet/i }));
    const createButton = screen.getByRole('button', { name: /^create$/i });

    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText(/wallet name/i), '   ');
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText(/wallet name/i), 'Valid Name');
    expect(createButton).toBeEnabled();
  });
});
