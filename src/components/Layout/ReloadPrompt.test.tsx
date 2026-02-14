import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReloadPrompt } from './ReloadPrompt';

describe('ReloadPrompt', () => {
  it('does not render when no prompt state is active', () => {
    render(
      <ReloadPrompt
        offlineReady={false}
        needRefresh={false}
        onReload={vi.fn().mockResolvedValue(undefined)}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.queryByText('A new version is available.')).not.toBeInTheDocument();
    expect(screen.queryByText('App is ready to work offline.')).not.toBeInTheDocument();
  });

  it('renders offline-ready state with dismiss only', () => {
    const onDismiss = vi.fn();

    render(
      <ReloadPrompt
        offlineReady={true}
        needRefresh={false}
        onReload={vi.fn().mockResolvedValue(undefined)}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('App is ready to work offline.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders refresh state and triggers actions', () => {
    const onReload = vi.fn().mockResolvedValue(undefined);
    const onDismiss = vi.fn();

    render(
      <ReloadPrompt
        offlineReady={false}
        needRefresh={true}
        onReload={onReload}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
