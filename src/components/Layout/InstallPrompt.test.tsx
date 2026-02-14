import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InstallPrompt } from './InstallPrompt';

describe('InstallPrompt', () => {
  it('does not render when app is not installable', () => {
    render(
      <InstallPrompt
        isInstallable={false}
        isInstalled={false}
        onInstall={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
  });

  it('does not render when app is already installed', () => {
    render(
      <InstallPrompt
        isInstallable={true}
        isInstalled={true}
        onInstall={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
  });

  it('renders and calls install handler', () => {
    const onInstall = vi.fn().mockResolvedValue(undefined);

    render(
      <InstallPrompt isInstallable={true} isInstalled={false} onInstall={onInstall} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Install app' }));

    expect(onInstall).toHaveBeenCalledTimes(1);
  });
});
