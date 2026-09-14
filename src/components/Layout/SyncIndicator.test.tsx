import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SyncIndicator } from './SyncIndicator';

const syncState = vi.hoisted(() => ({
  repairSync: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  value: {
    syncState: 'idle' as 'idle' | 'syncing' | 'error',
    pendingCount: 0,
    lastSyncedAt: 1_000,
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
  it('offers an authenticated repair action even after a converged sync', () => {
    render(<SyncIndicator />);

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
});
