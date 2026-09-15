import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncProvider, useSync } from './useSync';

type TestSyncResult = 'converged' | 'pending';

const syncMocks = vi.hoisted(() => ({
  auth: {
    user: { id: 'user-a' } as { id: string } | null,
    isConfigured: true,
  },
  pendingCount: 0,
  fullSync: vi.fn<[string], Promise<TestSyncResult>>(),
  repairSync: vi.fn<[string], Promise<TestSyncResult>>(),
  syncPush: vi.fn<[string], Promise<void>>(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => syncMocks.auth,
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => syncMocks.pendingCount,
}));

vi.mock('../lib/sync', () => ({
  fullSync: syncMocks.fullSync,
  repairSync: syncMocks.repairSync,
  syncPush: syncMocks.syncPush,
}));

const createDeferred = <T,>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
} => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

function SyncProbe(): JSX.Element {
  const sync = useSync();
  return (
    <div>
      <span data-testid="state">{sync.syncState}</span>
      <span data-testid="converged">{sync.hasConverged ? 'yes' : 'no'}</span>
      <span data-testid="last-synced">{sync.lastSyncedAt ?? 'never'}</span>
      <span data-testid="error">{sync.error ?? 'none'}</span>
      <button type="button" onClick={() => void sync.repairSync()}>
        Repair
      </button>
    </div>
  );
}

const renderSync = (): ReturnType<typeof render> =>
  render(
    <SyncProvider>
      <SyncProbe />
    </SyncProvider>
  );

describe('useSync', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cuentica-local-owner', 'user-a');
    localStorage.setItem('cuentica-local-owner-generation', '1');
    syncMocks.auth.user = { id: 'user-a' };
    syncMocks.auth.isConfigured = true;
    syncMocks.pendingCount = 0;
    syncMocks.fullSync.mockReset().mockResolvedValue('converged');
    syncMocks.repairSync.mockReset().mockResolvedValue('converged');
    syncMocks.syncPush.mockReset().mockResolvedValue(undefined);
  });

  it('does not publish convergence for a completed run with pending rows', async () => {
    syncMocks.fullSync.mockResolvedValue('pending');

    renderSync();

    await waitFor(() => expect(syncMocks.fullSync).toHaveBeenCalledWith('user-a'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('idle'));
    expect(screen.getByTestId('converged')).toHaveTextContent('no');
    expect(screen.getByTestId('last-synced')).toHaveTextContent('never');
  });

  it('queues repair behind active work and awaits a fresh repair pass', async () => {
    const activeFullSync = createDeferred<TestSyncResult>();
    const queuedRepair = createDeferred<TestSyncResult>();
    syncMocks.fullSync.mockReturnValue(activeFullSync.promise);
    syncMocks.repairSync.mockReturnValue(queuedRepair.promise);
    renderSync();
    await waitFor(() => expect(syncMocks.fullSync).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole('button', { name: 'Repair' }));
    expect(syncMocks.repairSync).not.toHaveBeenCalled();

    act(() => {
      activeFullSync.resolve('converged');
    });
    await waitFor(() => expect(syncMocks.repairSync).toHaveBeenCalledOnce());
    expect(screen.getByTestId('state')).toHaveTextContent('syncing');

    act(() => {
      queuedRepair.resolve('converged');
    });
    await waitFor(() => expect(screen.getByTestId('converged')).toHaveTextContent('yes'));
  });

  it('ignores an old owner completion after a user switch', async () => {
    const userASync = createDeferred<TestSyncResult>();
    syncMocks.fullSync.mockImplementation((userId) =>
      userId === 'user-a' ? userASync.promise : Promise.resolve('pending')
    );
    const { rerender } = renderSync();
    await waitFor(() => expect(syncMocks.fullSync).toHaveBeenCalledWith('user-a'));

    syncMocks.auth.user = { id: 'user-b' };
    localStorage.setItem('cuentica-local-owner', 'user-b');
    localStorage.setItem('cuentica-local-owner-generation', '2');
    rerender(
      <SyncProvider>
        <SyncProbe />
      </SyncProvider>
    );
    await waitFor(() => expect(syncMocks.fullSync).toHaveBeenCalledWith('user-b'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('idle'));

    act(() => {
      userASync.resolve('converged');
    });
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('none'));

    expect(screen.getByTestId('converged')).toHaveTextContent('no');
    expect(screen.getByTestId('last-synced')).toHaveTextContent('never');
  });

  it('coalesces automatic full sync triggers for the same owner', async () => {
    const activeFullSync = createDeferred<TestSyncResult>();
    syncMocks.fullSync.mockReturnValue(activeFullSync.promise);
    renderSync();
    await waitFor(() => expect(syncMocks.fullSync).toHaveBeenCalledOnce());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(syncMocks.fullSync).toHaveBeenCalledOnce();

    act(() => {
      activeFullSync.resolve('converged');
    });
    await waitFor(() => expect(screen.getByTestId('converged')).toHaveTextContent('yes'));
    expect(syncMocks.fullSync).toHaveBeenCalledOnce();
  });

  it('keeps guest mode local and does not start network synchronization', async () => {
    syncMocks.auth.user = null;
    localStorage.clear();

    renderSync();

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('idle'));
    expect(syncMocks.fullSync).not.toHaveBeenCalled();
    expect(syncMocks.repairSync).not.toHaveBeenCalled();
    expect(screen.getByTestId('converged')).toHaveTextContent('no');
  });
});
