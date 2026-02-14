import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    walletName: 'Test Wallet',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isDeleting: false,
  };

  it('renders correctly when open', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByText('Delete Test Wallet?')).toBeInTheDocument();
    expect(
      screen.getByText(/All budget items in this wallet will be lost/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Delete Test Wallet?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('shows deleting state and disables buttons', () => {
    render(<ConfirmDeleteModal {...defaultProps} isDeleting={true} />);

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('focuses cancel button on mount', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });
});
