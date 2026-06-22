import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from './db';
import type { SupabaseBudgetItemRow, SupabaseWalletRow } from './migration';

type TableName = 'wallets' | 'budget_items';
type RemoteRow = SupabaseWalletRow | SupabaseBudgetItemRow;

interface QueryError {
  message: string;
}

interface QueryResult {
  data: RemoteRow[] | null;
  error: QueryError | null;
}

interface QueryCall {
  table: TableName;
  gtValue: number | null;
}

interface MockState {
  rows: {
    wallets: SupabaseWalletRow[];
    budget_items: SupabaseBudgetItemRow[];
  };
  calls: QueryCall[];
  unfilteredErrorTables: TableName[];
  upserts: {
    wallets: SupabaseWalletRow[][];
    budget_items: SupabaseBudgetItemRow[][];
  };
}

interface EqQueryResult extends PromiseLike<QueryResult> {
  gt: (column: 'updated_at', value: number) => Promise<QueryResult>;
}

interface QueryBuilder {
  select: () => {
    eq: (column: 'user_id', value: string) => EqQueryResult;
  };
  upsert: (
    rows: SupabaseWalletRow[] | SupabaseBudgetItemRow[],
    options: { onConflict: 'id' }
  ) => Promise<{ error: null }>;
}

const supabaseMock = vi.hoisted(
  (): { state: MockState; supabase: { from: (table: TableName) => QueryBuilder } } => {
    const state: MockState = {
      rows: {
        wallets: [],
        budget_items: [],
      },
      calls: [],
      unfilteredErrorTables: [],
      upserts: {
        wallets: [],
        budget_items: [],
      },
    };

    const queryRows = (table: TableName, userId: string): RemoteRow[] =>
      state.rows[table].filter((row) => row.user_id === userId);

    const upsertRows = <TRow extends RemoteRow>(currentRows: TRow[], rows: TRow[]): void => {
      rows.forEach((row) => {
        const existingIndex = currentRows.findIndex(
          (currentRow) => currentRow.id === row.id
        );

        if (existingIndex === -1) {
          currentRows.push(row);
          return;
        }

        currentRows[existingIndex] = row;
      });
    };

    const createEqQueryResult = (table: TableName, userId: string): EqQueryResult => {
      const unfilteredResult = (): QueryResult => {
        state.calls.push({ table, gtValue: null });

        if (state.unfilteredErrorTables.includes(table)) {
          return { data: null, error: { message: 'network' } };
        }

        return { data: queryRows(table, userId), error: null };
      };

      return {
        gt: async (column: 'updated_at', value: number): Promise<QueryResult> => {
          const call: QueryCall = { table, gtValue: value };
          state.calls.push(call);

          return {
            data: queryRows(table, userId).filter((row) => row[column] > value),
            error: null,
          };
        },
        then: <TResult1 = QueryResult, TResult2 = never>(
          onfulfilled?:
            | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
            | null,
          onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
        ): PromiseLike<TResult1 | TResult2> =>
          Promise.resolve(unfilteredResult()).then(onfulfilled, onrejected),
      };
    };

    return {
      state,
      supabase: {
        from: (table: TableName): QueryBuilder => ({
          select: () => ({
            eq: (_column: 'user_id', value: string): EqQueryResult =>
              createEqQueryResult(table, value),
          }),
          upsert: async (
            rows: SupabaseWalletRow[] | SupabaseBudgetItemRow[],
            options: { onConflict: 'id' }
          ): Promise<{ error: null }> => {
            void options;

            if (table === 'wallets') {
              const walletRows = rows as SupabaseWalletRow[];
              state.upserts.wallets.push(walletRows);
              upsertRows(state.rows.wallets, walletRows);
            } else {
              const budgetItemRows = rows as SupabaseBudgetItemRow[];
              state.upserts.budget_items.push(budgetItemRows);
              upsertRows(state.rows.budget_items, budgetItemRows);
            }

            return { error: null };
          },
        }),
      },
    };
  }
);

vi.mock('./supabase', () => ({
  supabase: supabaseMock.supabase,
}));

const { fullSync, syncHydrate, syncPull } = await import('./sync');

const syncKey = 'cuentica-sync-ts-user-1';
const migrationKey = 'cuentica-migration-user-1';
const hydrationKey = 'cuentica-initial-cloud-pull-v2-user-1';

const createRemoteWallet = (
  overrides: Partial<SupabaseWalletRow> = {}
): SupabaseWalletRow => ({
  id: 'wallet-1',
  user_id: 'user-1',
  name: 'Remote Wallet',
  order: 1,
  color: null,
  category_id: null,
  created_at: 1_000,
  updated_at: 2_000,
  sync_status: 'synced',
  deleted: false,
  ...overrides,
});

const createRemoteBudgetItem = (
  overrides: Partial<SupabaseBudgetItemRow> = {}
): SupabaseBudgetItemRow => ({
  id: 'item-1',
  user_id: 'user-1',
  wallet_id: 'wallet-1',
  order: 1,
  name: 'Salary',
  type: '+',
  amount: 100_00,
  date: null,
  category_tag: null,
  created_at: 1_000,
  updated_at: 2_000,
  sync_status: 'synced',
  deleted: false,
  ...overrides,
});

describe('syncPull', () => {
  beforeEach(async () => {
    localStorage.clear();
    supabaseMock.state.rows.wallets = [];
    supabaseMock.state.rows.budget_items = [];
    supabaseMock.state.calls = [];
    supabaseMock.state.unfilteredErrorTables = [];
    supabaseMock.state.upserts.wallets = [];
    supabaseMock.state.upserts.budget_items = [];
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('pulls a remote wallet that falls behind a previous client-clock checkpoint', async () => {
    localStorage.setItem(syncKey, '20000');
    supabaseMock.state.rows.wallets = [createRemoteWallet({ updated_at: 15_000 })];

    await syncPull('user-1');

    const wallet = await db.wallets.get('wallet-1');

    expect(wallet?.name).toBe('Remote Wallet');
    expect(wallet?.updatedAt).toBe(15_000);
    expect(localStorage.getItem(syncKey)).toBe('15000');
    expect(
      supabaseMock.state.calls.find((call) => call.table === 'wallets')?.gtValue
    ).toBe(0);
  });

  it('does not advance the checkpoint when no remote rows are applied', async () => {
    localStorage.setItem(syncKey, '20000');

    await syncPull('user-1');

    expect(localStorage.getItem(syncKey)).toBe('20000');
  });

  it('stores the checkpoint as the highest applied remote updatedAt', async () => {
    supabaseMock.state.rows.wallets = [createRemoteWallet({ updated_at: 1_500 })];
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({ updated_at: 2_500 }),
    ];

    await syncPull('user-1');

    expect(localStorage.getItem(syncKey)).toBe('2500');
  });

  it('does not overwrite a same-id local wallet with pending changes', async () => {
    await db.wallets.add({
      id: 'wallet-1',
      name: 'Local Pending Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 30_000,
      syncStatus: 'pending',
      deleted: false,
    });
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({ name: 'Remote Wallet', updated_at: 31_000 }),
    ];

    await syncPull('user-1');

    const wallet = await db.wallets.get('wallet-1');

    expect(wallet?.name).toBe('Local Pending Wallet');
    expect(wallet?.syncStatus).toBe('pending');
    expect(localStorage.getItem(syncKey)).toBeNull();
  });
});

describe('syncHydrate', () => {
  beforeEach(async () => {
    localStorage.clear();
    supabaseMock.state.rows.wallets = [];
    supabaseMock.state.rows.budget_items = [];
    supabaseMock.state.calls = [];
    supabaseMock.state.unfilteredErrorTables = [];
    supabaseMock.state.upserts.wallets = [];
    supabaseMock.state.upserts.budget_items = [];
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('does not overwrite a same-id local wallet with pending changes during hydration', async () => {
    await db.wallets.add({
      id: 'wallet-1',
      name: 'Local Pending Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 30_000,
      syncStatus: 'pending',
      deleted: false,
    });
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({ name: 'Remote Wallet', updated_at: 31_000 }),
    ];

    await syncHydrate('user-1');

    const wallet = await db.wallets.get('wallet-1');

    expect(wallet?.name).toBe('Local Pending Wallet');
    expect(wallet?.syncStatus).toBe('pending');
    expect(localStorage.getItem(hydrationKey)).toBe('done');
    expect(localStorage.getItem(syncKey)).toBeNull();
  });

  it('does not write the hydration flag when the unfiltered pull fails', async () => {
    supabaseMock.state.unfilteredErrorTables = ['wallets'];

    await expect(syncHydrate('user-1')).rejects.toThrow('network');

    expect(localStorage.getItem(hydrationKey)).toBeNull();
  });
});

describe('fullSync', () => {
  beforeEach(async () => {
    localStorage.clear();
    supabaseMock.state.rows.wallets = [];
    supabaseMock.state.rows.budget_items = [];
    supabaseMock.state.calls = [];
    supabaseMock.state.unfilteredErrorTables = [];
    supabaseMock.state.upserts.wallets = [];
    supabaseMock.state.upserts.budget_items = [];
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('hydrates older visible and deleted remote data despite a recent checkpoint', async () => {
    localStorage.setItem(syncKey, '2000000000');
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({
        id: 'older-wallet',
        name: 'Older Wallet',
        updated_at: 1_000_000_000,
      }),
      createRemoteWallet({
        id: 'deleted-wallet',
        name: 'Deleted Wallet',
        deleted: true,
        updated_at: 1_000_000_500,
      }),
    ];
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({
        id: 'older-item',
        wallet_id: 'older-wallet',
        name: 'Older Item',
        updated_at: 1_000_000_100,
      }),
    ];

    await fullSync('user-1');

    const olderWallet = await db.wallets.get('older-wallet');
    const deletedWallet = await db.wallets.get('deleted-wallet');
    const olderItem = await db.budgetItems.get('older-item');

    expect(olderWallet?.name).toBe('Older Wallet');
    expect(deletedWallet?.deleted).toBe(true);
    expect(olderItem?.name).toBe('Older Item');
    expect(localStorage.getItem(hydrationKey)).toBe('done');
    expect(
      supabaseMock.state.calls.filter((call) => call.gtValue === null).length
    ).toBe(2);
  });

  it('hydrates even when the old migration flag is already done', async () => {
    localStorage.setItem(migrationKey, 'done');
    supabaseMock.state.rows.wallets = [createRemoteWallet({ id: 'wallet-2' })];

    await fullSync('user-1');

    const wallet = await db.wallets.get('wallet-2');

    expect(wallet?.id).toBe('wallet-2');
    expect(localStorage.getItem(hydrationKey)).toBe('done');
  });

  it('does not repeat the unfiltered hydration pull after the flag is set', async () => {
    supabaseMock.state.rows.wallets = [createRemoteWallet()];

    await fullSync('user-1');
    await fullSync('user-1');

    expect(
      supabaseMock.state.calls.filter((call) => call.gtValue === null).length
    ).toBe(2);
    expect(localStorage.getItem(hydrationKey)).toBe('done');
  });

  it('sets the checkpoint to the highest applied updatedAt during hydration', async () => {
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({ id: 'wallet-1', updated_at: 3_000 }),
      createRemoteWallet({ id: 'wallet-2', updated_at: 7_000 }),
    ];
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({ id: 'item-1', updated_at: 5_000 }),
    ];

    await fullSync('user-1');

    expect(localStorage.getItem(syncKey)).toBe('7000');
  });

  it('keeps successfully pushed local rows synced after the follow-up pull', async () => {
    await db.wallets.add({
      id: 'wallet-1',
      name: 'Local Pending Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 30_000,
      syncStatus: 'pending',
      deleted: false,
    });

    await fullSync('user-1');

    const wallet = await db.wallets.get('wallet-1');

    expect(wallet?.name).toBe('Local Pending Wallet');
    expect(wallet?.syncStatus).toBe('synced');
    expect(supabaseMock.state.upserts.wallets).toHaveLength(1);
  });
});
