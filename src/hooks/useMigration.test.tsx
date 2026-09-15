import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMigration } from './useMigration';

const migrationMocks = vi.hoisted(() => {
  const resolvers = new Map<string, () => void>();
  return {
    auth: {
      user: { id: 'user-a' } as { id: string } | null,
      loading: false,
      isConfigured: true,
    },
    migrate: vi.fn(
      (userId: string): Promise<'skipped-empty'> =>
        new Promise((resolve) => {
          resolvers.set(userId, () => resolve('skipped-empty'));
        })
    ),
    resolvers,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => migrationMocks.auth,
}));

vi.mock('../lib/migration', () => ({
  migrateLocalDataForUser: migrationMocks.migrate,
}));

function MigrationProbe(): JSX.Element {
  const { migrating, error } = useMigration();
  return <span>{error ?? (migrating ? 'migrating' : 'idle')}</span>;
}

describe('useMigration', () => {
  beforeEach(() => {
    localStorage.clear();
    migrationMocks.migrate.mockClear();
    migrationMocks.resolvers.clear();
    migrationMocks.auth.user = { id: 'user-a' };
    localStorage.setItem('cuentica-local-owner', 'user-a');
    localStorage.setItem('cuentica-local-owner-generation', '1');
  });

  it('starts the new owner migration and never marks stale completion done', async () => {
    const { rerender } = render(<MigrationProbe />);
    await waitFor(() => expect(migrationMocks.migrate).toHaveBeenCalledWith('user-a'));

    migrationMocks.auth.user = { id: 'user-b' };
    localStorage.setItem('cuentica-local-owner', 'user-b');
    localStorage.setItem('cuentica-local-owner-generation', '2');
    rerender(<MigrationProbe />);
    await waitFor(() => expect(migrationMocks.migrate).toHaveBeenCalledWith('user-b'));

    act(() => {
      migrationMocks.resolvers.get('user-b')?.();
    });
    await waitFor(() =>
      expect(localStorage.getItem('cuentica-migration-user-b')).toBe('done')
    );

    act(() => {
      migrationMocks.resolvers.get('user-a')?.();
    });
    await waitFor(() =>
      expect(localStorage.getItem('cuentica-migration-user-a')).toBeNull()
    );
  });
});
