import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncIndicator } from './SyncIndicator';

const syncState = vi.hoisted(() => ({
  repairSync: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  value: {
    syncState: 'idle' as 'idle' | 'syncing' | 'error',
    pendingCount: 0,
    lastSyncedAt: 1_000 as number | null,
    error: null as string | null,
    hasConverged: true,
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('../../hooks/useSync', () => ({
  useSync: () => ({ ...syncState.value, repairSync: syncState.repairSync }),
}));

describe('SyncIndicator', () => {
  beforeEach(() => {
    syncState.repairSync.mockClear();
    syncState.value = {
      syncState: 'idle',
      pendingCount: 0,
      lastSyncedAt: 1_000,
      error: null,
      hasConverged: true,
    };
  });

  it('offers an authenticated repair action even after a converged sync', () => {
    const { container } = render(<SyncIndicator />);

    expect(screen.getByTestId('healthy-sync-icon')).toBeInTheDocument();
    expect(container.querySelector('.bg-accent')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('All changes synced'));
    fireEvent.click(screen.getByRole('button', { name: 'Repair sync' }));

    expect(syncState.repairSync).toHaveBeenCalledOnce();
  });

  it('disables repair while a sync is running', () => {
    syncState.value = {
      ...syncState.value,
      syncState: 'syncing',
      hasConverged: false,
    };
    render(<SyncIndicator />);

    fireEvent.click(screen.getByLabelText('Syncing changes'));

    expect(screen.getByRole('button', { name: 'Repair sync' })).toBeDisabled();
  });

  it('does not show a completed but non-converged run as synced', () => {
    syncState.value = {
      ...syncState.value,
      lastSyncedAt: null,
      hasConverged: false,
    };

    render(<SyncIndicator />);

    expect(screen.getByLabelText('Sync needs repair')).toBeInTheDocument();
    expect(screen.queryByLabelText('All changes synced')).not.toBeInTheDocument();
  });

  it('keeps attention states visually distinct', () => {
    const { container, rerender } = render(<SyncIndicator />);

    syncState.value = {
      ...syncState.value,
      pendingCount: 1,
      hasConverged: false,
    };
    rerender(<SyncIndicator />);
    expect(container.querySelector('.bg-warning')).toBeInTheDocument();

    syncState.value = {
      ...syncState.value,
      syncState: 'error',
      pendingCount: 0,
      error: 'Unable to sync',
    };
    rerender(<SyncIndicator />);
    expect(container.querySelector('.bg-error')).toBeInTheDocument();

    syncState.value = {
      ...syncState.value,
      syncState: 'idle',
      error: null,
      hasConverged: false,
    };
    rerender(<SyncIndicator />);
    expect(container.querySelector('.bg-accent')).toBeInTheDocument();
  });
});
