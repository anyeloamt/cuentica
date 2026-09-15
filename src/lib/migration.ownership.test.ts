import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db, prepareLocalUser } from './db';
import type { SupabaseBudgetItemRow, SupabaseWalletRow } from './migration';

type TableName = 'wallets' | 'budget_items';
type RemoteRow = SupabaseWalletRow | SupabaseBudgetItemRow;

interface QueryResult {
  data: RemoteRow[] | null;
  error: { message: string } | null;
}

interface MigrationFinalQuery extends Promise<QueryResult> {
  limit: (count: number) => Promise<QueryResult>;
}

interface MigrationDeletedQuery {
  eq: (column: 'deleted', value: boolean) => MigrationFinalQuery;
}

interface MigrationQuery {
  eq: (column: 'user_id', value: string) => MigrationDeletedQuery;
}

const migrationMock = vi.hoisted(() => {
  const state = {
    rows: {
      wallets: [] as SupabaseWalletRow[],
      budget_items: [] as SupabaseBudgetItemRow[],
    },
    fullSelectWaits: {} as Partial<Record<TableName, Promise<void>>>,
    upsertWaits: {} as Partial<Record<TableName, Promise<void>>>,
    fullSelectCalls: [] as TableName[],
    upsertCalls: [] as TableName[],
  };

  const createQuery = (table: TableName, columns: string): MigrationQuery => ({
    eq: (_column: 'user_id', userId: string): MigrationDeletedQuery => ({
      eq: (_deletedColumn: 'deleted', deleted: boolean): MigrationFinalQuery => {
        const result = async (): Promise<QueryResult> => {
          if (columns !== 'id') {
            state.fullSelectCalls.push(table);
            await state.fullSelectWaits[table];
          }
          return {
            data: state.rows[table].filter(
              (row) => row.user_id === userId && (deleted || !row.deleted)
            ),
            error: null,
          };
        };
        const query = result();
        return Object.assign(query, {
          limit: async (count: number): Promise<QueryResult> => {
            const queryResult = await query;
            return { ...queryResult, data: queryResult.data?.slice(0, count) ?? null };
          },
        });
      },
    }),
  });

  return {
    state,
    supabase: {
      from: (table: TableName) => ({
        select: (columns: string): MigrationQuery => createQuery(table, columns),
        upsert: async (): Promise<{ error: null }> => {
          state.upsertCalls.push(table);
          await state.upsertWaits[table];
          return { error: null };
        },
      }),
    },
  };
});

vi.mock('./supabase', () => ({
  supabase: migrationMock.supabase,
}));

const { migrateLocalDataForUser } = await import('./migration');

const createRemoteWallet = (): SupabaseWalletRow => ({
  id: 'user-a-remote-wallet',
  user_id: 'user-a',
  name: 'User A Remote Wallet',
  order: 1,
  color: null,
  category_id: null,
  created_at: 1,
  updated_at: 1,
  sync_status: 'synced',
  deleted: false,
});

const createDeferred = (): { promise: Promise<void>; resolve: () => void } => {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe('migration ownership fencing', () => {
  beforeEach(async () => {
    localStorage.clear();
    migrationMock.state.rows.wallets = [];
    migrationMock.state.rows.budget_items = [];
    migrationMock.state.fullSelectWaits = {};
    migrationMock.state.upsertWaits = {};
    migrationMock.state.fullSelectCalls = [];
    migrationMock.state.upsertCalls = [];
    await db.open();
    await prepareLocalUser('user-a');
  });

  afterEach(async () => {
    await db.delete();
  });

  it('does not apply an old owner cloud pull after ownership changes', async () => {
    const delayedPull = createDeferred();
    migrationMock.state.rows.wallets = [createRemoteWallet()];
    migrationMock.state.fullSelectWaits.wallets = delayedPull.promise;

    const migrating = migrateLocalDataForUser('user-a');
    await vi.waitFor(() =>
      expect(migrationMock.state.fullSelectCalls).toContain('wallets')
    );
    await prepareLocalUser('user-b');
    await db.wallets.add({
      id: 'user-b-wallet',
      name: 'User B Wallet',
      order: 1,
      createdAt: 2,
      updatedAt: 2,
      syncStatus: 'pending',
    });
    const migrationResult = expect(migrating).rejects.toThrow('Local data owner changed');
    delayedPull.resolve();

    await migrationResult;
    expect((await db.wallets.toArray()).map((wallet) => wallet.id)).toEqual(['user-b-wallet']);
  });

  it('does not mark a new owner row synced after an old migration upsert', async () => {
    await db.wallets.add({
      id: 'shared-wallet',
      name: 'User A Wallet',
      order: 1,
      createdAt: 1,
      updatedAt: 1,
      syncStatus: 'pending',
    });
    const delayedUpsert = createDeferred();
    migrationMock.state.upsertWaits.wallets = delayedUpsert.promise;

    const migrating = migrateLocalDataForUser('user-a');
    await vi.waitFor(() => expect(migrationMock.state.upsertCalls).toContain('wallets'));
    await prepareLocalUser('user-b');
    await db.wallets.add({
      id: 'shared-wallet',
      name: 'User B Wallet',
      order: 1,
      createdAt: 2,
      updatedAt: 2,
      syncStatus: 'pending',
    });
    const migrationResult = expect(migrating).rejects.toThrow('Local data owner changed');
    delayedUpsert.resolve();

    await migrationResult;
    expect((await db.wallets.get('shared-wallet'))?.name).toBe('User B Wallet');
    expect((await db.wallets.get('shared-wallet'))?.syncStatus).toBe('pending');
  });
});
