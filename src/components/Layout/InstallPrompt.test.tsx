import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InstallPrompt } from './InstallPrompt';

const defaultProps = {
  isInstallable: true,
  isInstalled: false,
  isDismissed: false,
  onInstall: vi.fn().mockResolvedValue(undefined),
  onDismiss: vi.fn(),
};

describe('InstallPrompt', () => {
  it('does not render when app is not installable', () => {
    render(<InstallPrompt {...defaultProps} isInstallable={false} />);

    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
  });

  it('does not render when app is already installed', () => {
    render(<InstallPrompt {...defaultProps} isInstalled={true} />);

    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
  });

  it('does not render when dismissed', () => {
    render(<InstallPrompt {...defaultProps} isDismissed={true} />);

    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
  });

  it('renders and calls install handler', () => {
    const onInstall = vi.fn().mockResolvedValue(undefined);

    render(<InstallPrompt {...defaultProps} onInstall={onInstall} />);

    fireEvent.click(screen.getByRole('button', { name: 'Install app' }));

    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();

    render(<InstallPrompt {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
