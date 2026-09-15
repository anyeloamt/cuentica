import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CuenticaDB, db, prepareLocalUser } from './db';
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
  from: number;
  to: number;
  orderColumns: string[];
}

interface MockState {
  rows: {
    wallets: SupabaseWalletRow[];
    budget_items: SupabaseBudgetItemRow[];
  };
  calls: QueryCall[];
  unfilteredErrorTables: TableName[];
  pageErrorStarts: {
    wallets: number[];
    budget_items: number[];
  };
  rangeWaits: Partial<Record<TableName, Promise<void>>>;
  upsertWaits: Partial<Record<TableName, Promise<void>>>;
  upserts: {
    wallets: SupabaseWalletRow[][];
    budget_items: SupabaseBudgetItemRow[][];
  };
}

interface SelectQuery {
  eq: (column: 'user_id', value: string) => SelectQuery;
  gt: (column: 'updated_at', value: number) => SelectQuery;
  order: (
    column: 'updated_at' | 'id',
    options: { ascending: true }
  ) => SelectQuery;
  range: (from: number, to: number) => Promise<QueryResult>;
}

interface QueryBuilder {
  select: () => SelectQuery;
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
      pageErrorStarts: {
        wallets: [],
        budget_items: [],
      },
      rangeWaits: {},
      upsertWaits: {},
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

    const createSelectQuery = (table: TableName): SelectQuery => {
      let userId = '';
      let gtValue: number | null = null;
      const orderColumns: string[] = [];
      const query: SelectQuery = {
        eq: (_column: 'user_id', value: string): SelectQuery => {
          userId = value;
          return query;
        },
        gt: (_column: 'updated_at', value: number): SelectQuery => {
          gtValue = value;
          return query;
        },
        order: (column: 'updated_at' | 'id'): SelectQuery => {
          orderColumns.push(column);
          return query;
        },
        range: async (from: number, to: number): Promise<QueryResult> => {
          state.calls.push({ table, gtValue, from, to, orderColumns: [...orderColumns] });
          await state.rangeWaits[table];

          if (
            (gtValue === null && state.unfilteredErrorTables.includes(table)) ||
            state.pageErrorStarts[table].includes(from)
          ) {
            return { data: null, error: { message: 'network' } };
          }

          const rows = queryRows(table, userId)
            .filter((row) => gtValue === null || row.updated_at > gtValue)
            .sort((left, right) =>
              left.updated_at === right.updated_at
                ? left.id.localeCompare(right.id)
                : left.updated_at - right.updated_at
            )
            .slice(from, to + 1);

          return { data: rows, error: null };
        },
      };

      return query;
    };

    return {
      state,
      supabase: {
        from: (table: TableName): QueryBuilder => ({
          select: () => createSelectQuery(table),
          upsert: async (
            rows: SupabaseWalletRow[] | SupabaseBudgetItemRow[],
            options: { onConflict: 'id' }
          ): Promise<{ error: null }> => {
            void options;
            await state.upsertWaits[table];

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

const { fullSync, repairSync, syncHydrate, syncPull, syncPush } = await import('./sync');

const syncKey = 'cuentica-sync-ts-user-1';
const walletSyncKey = 'cuentica-sync-ts-user-1-wallets';
const budgetItemSyncKey = 'cuentica-sync-ts-user-1-budget-items';
const walletReconciledKey = 'cuentica-reconciled-user-1-wallets';
const budgetItemReconciledKey = 'cuentica-reconciled-user-1-budget-items';
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

const resetSupabaseMock = (): void => {
  supabaseMock.state.rows.wallets = [];
  supabaseMock.state.rows.budget_items = [];
  supabaseMock.state.calls = [];
  supabaseMock.state.unfilteredErrorTables = [];
  supabaseMock.state.pageErrorStarts = { wallets: [], budget_items: [] };
  supabaseMock.state.rangeWaits = {};
  supabaseMock.state.upsertWaits = {};
  supabaseMock.state.upserts.wallets = [];
  supabaseMock.state.upserts.budget_items = [];
};

const createDeferred = (): { promise: Promise<void>; resolve: () => void } => {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe('syncPull', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetSupabaseMock();
    await db.open();
    await prepareLocalUser('user-1');
  });

  afterEach(async () => {
    await db.delete();
  });

  it('pulls a remote wallet that falls behind a previous client-clock checkpoint', async () => {
    localStorage.setItem(walletSyncKey, '20000');
    localStorage.setItem(walletReconciledKey, '1');
    supabaseMock.state.rows.wallets = [createRemoteWallet({ updated_at: 15_000 })];

    await syncPull('user-1');

    const wallet = await db.wallets.get('wallet-1');

    expect(wallet?.name).toBe('Remote Wallet');
    expect(wallet?.updatedAt).toBe(15_000);
    expect(localStorage.getItem(walletSyncKey)).toBe('15000');
    expect(
      supabaseMock.state.calls.find((call) => call.table === 'wallets')?.gtValue
    ).toBe(0);
  });

  it('does not advance the checkpoint when no remote rows are applied', async () => {
    localStorage.setItem(walletSyncKey, '20000');
    localStorage.setItem(walletReconciledKey, '1');

    await syncPull('user-1');

    expect(localStorage.getItem(walletSyncKey)).toBe('20000');
  });

  it('stores the checkpoint as the highest applied remote updatedAt', async () => {
    supabaseMock.state.rows.wallets = [createRemoteWallet({ updated_at: 1_500 })];
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({ updated_at: 2_500 }),
    ];

    await syncPull('user-1');

    expect(localStorage.getItem(walletSyncKey)).toBe('1500');
    expect(localStorage.getItem(budgetItemSyncKey)).toBe('2500');
    expect(localStorage.getItem(walletReconciledKey)).toBe('1');
    expect(localStorage.getItem(budgetItemReconciledKey)).toBe('1');
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

  it('treats an old deployed done marker as unreconciled', async () => {
    localStorage.setItem(walletReconciledKey, 'done');
    localStorage.setItem(walletSyncKey, '999999999');
    supabaseMock.state.rows.wallets = [createRemoteWallet({ updated_at: 1_000 })];

    await syncPull('user-1');

    expect(await db.wallets.get('wallet-1')).toBeDefined();
    expect(
      supabaseMock.state.calls.find((call) => call.table === 'wallets')?.gtValue
    ).toBeNull();
    expect(localStorage.getItem(walletReconciledKey)).toBe('1');
  });

  it('pages both entities in stable updated-at and id order', async () => {
    supabaseMock.state.rows.wallets = Array.from({ length: 101 }, (_, index) =>
      createRemoteWallet({
        id: `wallet-${index.toString().padStart(3, '0')}`,
        updated_at: 2_000,
        deleted: index === 100,
      })
    );
    supabaseMock.state.rows.budget_items = Array.from({ length: 101 }, (_, index) =>
      createRemoteBudgetItem({
        id: `item-${index.toString().padStart(3, '0')}`,
        wallet_id: 'wallet-000',
        updated_at: 3_000,
      })
    );

    await syncPull('user-1');

    expect(await db.wallets.count()).toBe(101);
    expect(await db.budgetItems.count()).toBe(101);
    expect((await db.wallets.get('wallet-100'))?.deleted).toBe(true);
    expect(
      supabaseMock.state.calls
        .filter((call) => call.table === 'wallets')
        .map(({ from, to, orderColumns }) => ({ from, to, orderColumns }))
    ).toEqual([
      { from: 0, to: 99, orderColumns: ['updated_at', 'id'] },
      { from: 100, to: 199, orderColumns: ['updated_at', 'id'] },
    ]);
    expect(
      supabaseMock.state.calls
        .filter((call) => call.table === 'budget_items')
        .map((call) => call.from)
    ).toEqual([0, 100]);
  });

  it('does not checkpoint an entity when a later page fails', async () => {
    supabaseMock.state.rows.wallets = Array.from({ length: 101 }, (_, index) =>
      createRemoteWallet({ id: `wallet-${index}`, updated_at: 2_000 + index })
    );
    supabaseMock.state.pageErrorStarts.wallets = [100];

    await expect(syncPull('user-1')).rejects.toThrow('network');

    expect(await db.wallets.count()).toBe(100);
    expect(localStorage.getItem(walletSyncKey)).toBeNull();
    expect(localStorage.getItem(walletReconciledKey)).toBeNull();

    supabaseMock.state.pageErrorStarts.wallets = [];
    supabaseMock.state.calls = [];
    await syncPull('user-1');

    expect(await db.wallets.count()).toBe(101);
    expect(localStorage.getItem(walletSyncKey)).toBe('2100');
    expect(localStorage.getItem(walletReconciledKey)).toBe('1');
    expect(
      supabaseMock.state.calls.find((call) => call.table === 'wallets')?.gtValue
    ).toBeNull();
  });

  it('keeps entity completion independent when budget item page two fails', async () => {
    supabaseMock.state.rows.wallets = [createRemoteWallet()];
    supabaseMock.state.rows.budget_items = Array.from({ length: 101 }, (_, index) =>
      createRemoteBudgetItem({ id: `item-${index}`, updated_at: 3_000 + index })
    );
    supabaseMock.state.pageErrorStarts.budget_items = [100];

    await expect(syncPull('user-1')).rejects.toThrow('network');

    expect(localStorage.getItem(walletSyncKey)).toBe('2000');
    expect(localStorage.getItem(walletReconciledKey)).toBe('1');
    expect(localStorage.getItem(budgetItemSyncKey)).toBeNull();
    expect(localStorage.getItem(budgetItemReconciledKey)).toBeNull();
  });

  it('rolls back a failed page transaction without marking reconciliation', async () => {
    supabaseMock.state.rows.wallets = [createRemoteWallet()];
    const bulkPut = vi.spyOn(db.wallets, 'bulkPut').mockRejectedValueOnce(new Error('transaction'));

    await expect(syncPull('user-1')).rejects.toThrow('transaction');

    expect(await db.wallets.count()).toBe(0);
    expect(localStorage.getItem(walletSyncKey)).toBeNull();
    expect(localStorage.getItem(walletReconciledKey)).toBeNull();
    bulkPut.mockRestore();
  });

  it('keeps a concurrent pending wallet edit newer than a remote page', async () => {
    const otherConnection = new CuenticaDB();
    await otherConnection.open();
    await db.wallets.add({
      id: 'wallet-1',
      name: 'Original Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 1_000,
      syncStatus: 'synced',
    });
    supabaseMock.state.rows.wallets = [createRemoteWallet({ name: 'Remote Wallet' })];
    const originalBulkPut = db.wallets.bulkPut.bind(db.wallets);
    let pendingEdit: Promise<string> | null = null;
    const bulkPut = vi.spyOn(db.wallets, 'bulkPut').mockImplementationOnce((rows) => {
      pendingEdit = otherConnection.wallets.put({
        id: 'wallet-1',
        name: 'Concurrent Pending Wallet',
        order: 1,
        createdAt: 1_000,
        updatedAt: 4_000,
        syncStatus: 'pending',
      });
      return originalBulkPut(rows);
    });

    await syncPull('user-1');
    await pendingEdit;

    expect((await db.wallets.get('wallet-1'))?.name).toBe('Concurrent Pending Wallet');
    expect((await db.wallets.get('wallet-1'))?.syncStatus).toBe('pending');
    bulkPut.mockRestore();
    otherConnection.close();
  });

  it('keeps a concurrent pending budget item edit newer than a remote page', async () => {
    const otherConnection = new CuenticaDB();
    await otherConnection.open();
    await db.budgetItems.add({
      id: 'item-1',
      walletId: 'wallet-1',
      name: 'Original Item',
      order: 1,
      type: '+',
      amount: 10,
      createdAt: 1_000,
      updatedAt: 1_000,
      syncStatus: 'synced',
    });
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({ name: 'Remote Item' }),
    ];
    const originalBulkPut = db.budgetItems.bulkPut.bind(db.budgetItems);
    let pendingEdit: Promise<string> | null = null;
    const bulkPut = vi.spyOn(db.budgetItems, 'bulkPut').mockImplementationOnce((rows) => {
      pendingEdit = otherConnection.budgetItems.put({
        id: 'item-1',
        walletId: 'wallet-1',
        name: 'Concurrent Pending Item',
        order: 1,
        type: '+',
        amount: 20,
        createdAt: 1_000,
        updatedAt: 4_000,
        syncStatus: 'pending',
      });
      return originalBulkPut(rows);
    });

    await syncPull('user-1');
    await pendingEdit;

    expect((await db.budgetItems.get('item-1'))?.name).toBe('Concurrent Pending Item');
    expect((await db.budgetItems.get('item-1'))?.syncStatus).toBe('pending');
    bulkPut.mockRestore();
    otherConnection.close();
  });

  it('rejects an old pull response after local ownership changes', async () => {
    const delayedRange = createDeferred();
    supabaseMock.state.rows.wallets = [createRemoteWallet({ user_id: 'user-1' })];
    supabaseMock.state.rangeWaits.wallets = delayedRange.promise;

    const oldPull = syncPull('user-1');
    await Promise.resolve();
    await prepareLocalUser('user-2');
    await db.wallets.add({
      id: 'user-2-wallet',
      name: 'User 2 Wallet',
      order: 1,
      createdAt: 1,
      updatedAt: 1,
      syncStatus: 'pending',
    });
    const oldPullResult = expect(oldPull).rejects.toThrow('Local data owner changed');
    delayedRange.resolve();

    await oldPullResult;
    expect((await db.wallets.toArray()).map((wallet) => wallet.id)).toEqual(['user-2-wallet']);
    expect(localStorage.getItem(walletReconciledKey)).toBeNull();
  });

  it('does not mark a new owner row synced after an old push response', async () => {
    await db.wallets.add({
      id: 'shared-wallet',
      name: 'User 1 Wallet',
      order: 1,
      createdAt: 1,
      updatedAt: 1,
      syncStatus: 'pending',
    });
    const delayedUpsert = createDeferred();
    supabaseMock.state.upsertWaits.wallets = delayedUpsert.promise;

    const oldPush = syncPush('user-1');
    await Promise.resolve();
    await prepareLocalUser('user-2');
    await db.wallets.add({
      id: 'shared-wallet',
      name: 'User 2 Wallet',
      order: 1,
      createdAt: 2,
      updatedAt: 2,
      syncStatus: 'pending',
    });
    const oldPushResult = expect(oldPush).rejects.toThrow('Local data owner changed');
    delayedUpsert.resolve();

    await oldPushResult;
    expect((await db.wallets.get('shared-wallet'))?.name).toBe('User 2 Wallet');
    expect((await db.wallets.get('shared-wallet'))?.syncStatus).toBe('pending');
  });
});

describe('syncHydrate', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetSupabaseMock();
    await db.open();
    await prepareLocalUser('user-1');
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

  it('retries only the entity whose reconciliation failed', async () => {
    supabaseMock.state.rows.wallets = [createRemoteWallet()];
    supabaseMock.state.unfilteredErrorTables = ['budget_items'];

    await expect(syncPull('user-1')).rejects.toThrow('network');

    expect(localStorage.getItem(walletReconciledKey)).toBe('1');
    expect(localStorage.getItem(budgetItemReconciledKey)).toBeNull();
    expect(localStorage.getItem(walletSyncKey)).toBe('2000');
    expect(localStorage.getItem(budgetItemSyncKey)).toBeNull();

    supabaseMock.state.unfilteredErrorTables = [];
    await syncPull('user-1');

    expect(
      supabaseMock.state.calls.filter((call) => call.table === 'budget_items' && call.gtValue === null)
    ).toHaveLength(2);
  });
});

describe('fullSync', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetSupabaseMock();
    await db.open();
    await prepareLocalUser('user-1');
  });

  afterEach(async () => {
    await db.delete();
  });

  it('reconciles old cloud wallets after local data becomes partial', async () => {
    localStorage.setItem(hydrationKey, 'done');
    localStorage.setItem(syncKey, '2000000000');
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({ id: 'old-wallet-1', updated_at: 1_000_000_000 }),
      createRemoteWallet({ id: 'old-wallet-2', updated_at: 1_000_000_100 }),
      createRemoteWallet({ id: 'old-wallet-3', updated_at: 1_000_000_200 }),
    ];
    await db.wallets.add({
      id: 'old-wallet-1',
      name: 'Remote Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 1_000_000_000,
      syncStatus: 'synced',
      deleted: false,
    });

    const result = await fullSync('user-1');

    expect(await db.wallets.count()).toBe(3);
    expect(result).toBe('converged');
  });

  it('reconciles old remote tombstones without replacing pending local rows', async () => {
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({ id: 'old-deleted-wallet', deleted: true, updated_at: 1_000_000_000 }),
      createRemoteWallet({ id: 'pending-wallet', deleted: true, updated_at: 1_000_000_100 }),
    ];
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({ id: 'old-deleted-item', deleted: true, updated_at: 1_000_000_200 }),
    ];
    await db.wallets.bulkAdd([
      {
        id: 'old-deleted-wallet',
        name: 'Stale Wallet',
        order: 1,
        createdAt: 1_000,
        updatedAt: 1_000,
        syncStatus: 'synced',
        deleted: false,
      },
      {
        id: 'pending-wallet',
        name: 'Pending Wallet',
        order: 2,
        createdAt: 1_000,
        updatedAt: 2_000_000_000,
        syncStatus: 'pending',
        deleted: false,
      },
    ]);
    await db.budgetItems.add({
      id: 'old-deleted-item',
      walletId: 'old-deleted-wallet',
      order: 1,
      name: 'Stale Item',
      type: '+',
      amount: 100,
      createdAt: 1_000,
      updatedAt: 1_000,
      syncStatus: 'synced',
      deleted: false,
    });

    await syncPull('user-1');

    expect((await db.wallets.get('old-deleted-wallet'))?.deleted).toBe(true);
    expect((await db.wallets.get('pending-wallet'))?.deleted).toBe(false);
    expect((await db.wallets.get('pending-wallet'))?.syncStatus).toBe('pending');
    expect((await db.budgetItems.get('old-deleted-item'))?.deleted).toBe(true);
  });

  it('repairs both entity boundaries without clearing pending local rows', async () => {
    await db.wallets.add({
      id: 'pending-wallet',
      name: 'Pending Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 3_000,
      syncStatus: 'pending',
      deleted: false,
    });
    localStorage.setItem(walletSyncKey, '9999');
    localStorage.setItem(budgetItemSyncKey, '9999');
    localStorage.setItem(walletReconciledKey, '1');
    localStorage.setItem(budgetItemReconciledKey, '1');

    await repairSync('user-1');

    expect((await db.wallets.get('pending-wallet'))?.syncStatus).toBe('synced');
    expect(localStorage.getItem(walletReconciledKey)).toBe('1');
    expect(localStorage.getItem(budgetItemReconciledKey)).toBe('1');
  });

  it('clears a previous authenticated user local rows before syncing another user', async () => {
    await prepareLocalUser('user-a');
    await db.wallets.add({
      id: 'user-a-wallet',
      name: 'User A Wallet',
      order: 1,
      createdAt: 1_000,
      updatedAt: 1_000,
      syncStatus: 'pending',
      deleted: false,
    });
    supabaseMock.state.rows.wallets = [createRemoteWallet({ id: 'user-b-wallet', user_id: 'user-b' })];
    await prepareLocalUser('user-b');

    await fullSync('user-b');

    expect(await db.wallets.get('user-a-wallet')).toBeUndefined();
    expect((await db.wallets.get('user-b-wallet'))?.name).toBe('Remote Wallet');
    expect(supabaseMock.state.upserts.wallets).toHaveLength(0);
  });

  it('preserves and pushes guest rows when the first authenticated owner claims them', async () => {
    localStorage.clear();
    await db.wallets.add({
      id: 'guest-wallet',
      name: 'Guest Wallet',
      order: 1,
      createdAt: 1,
      updatedAt: 1,
      syncStatus: 'pending',
    });
    await prepareLocalUser('first-user');

    const result = await fullSync('first-user');

    expect(result).toBe('converged');
    expect((await db.wallets.get('guest-wallet'))?.syncStatus).toBe('synced');
    expect(supabaseMock.state.upserts.wallets[0]?.[0]?.user_id).toBe('first-user');
  });

  it('forces an authoritative pull when a previous owner returns to cleared rows', async () => {
    const firstUserAToken = await prepareLocalUser('user-a');
    const userAWalletMarker = 'cuentica-reconciled-user-a-wallets';
    const userAItemMarker = 'cuentica-reconciled-user-a-budget-items';
    localStorage.setItem(userAWalletMarker, firstUserAToken.generation.toString());
    localStorage.setItem(userAItemMarker, firstUserAToken.generation.toString());
    localStorage.setItem('cuentica-sync-ts-user-a-wallets', '999999999');
    localStorage.setItem('cuentica-sync-ts-user-a-budget-items', '999999999');
    localStorage.setItem('cuentica-initial-cloud-pull-v2-user-a', 'done');

    await prepareLocalUser('user-b');
    const returningUserAToken = await prepareLocalUser('user-a');
    supabaseMock.state.rows.wallets = [
      createRemoteWallet({ id: 'old-user-a-wallet', user_id: 'user-a', updated_at: 1_000 }),
    ];
    supabaseMock.state.rows.budget_items = [
      createRemoteBudgetItem({
        id: 'old-user-a-item',
        user_id: 'user-a',
        wallet_id: 'old-user-a-wallet',
        updated_at: 1_000,
      }),
    ];

    await fullSync('user-a');

    expect(await db.wallets.get('old-user-a-wallet')).toBeDefined();
    expect(await db.budgetItems.get('old-user-a-item')).toBeDefined();
    expect(localStorage.getItem(userAWalletMarker)).toBe(
      returningUserAToken.generation.toString()
    );
    expect(localStorage.getItem(userAItemMarker)).toBe(
      returningUserAToken.generation.toString()
    );
    expect(supabaseMock.state.calls.every((call) => call.gtValue === null)).toBe(true);
  });

  it('returns pending when a local edit appears before the final convergence check', async () => {
    localStorage.setItem(hydrationKey, 'done');
    localStorage.setItem(walletReconciledKey, '1');
    localStorage.setItem(budgetItemReconciledKey, '1');
    const delayedRange = createDeferred();
    supabaseMock.state.rangeWaits.wallets = delayedRange.promise;

    const syncing = fullSync('user-1');
    await vi.waitFor(() =>
      expect(supabaseMock.state.calls.some((call) => call.table === 'wallets')).toBe(true)
    );
    await db.budgetItems.add({
      id: 'late-item',
      walletId: 'wallet-1',
      name: 'Late Pending Item',
      order: 1,
      type: '+',
      amount: 10,
      createdAt: 1,
      updatedAt: 1,
      syncStatus: 'pending',
    });
    delayedRange.resolve();

    await expect(syncing).resolves.toBe('pending');
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

    expect(localStorage.getItem(walletSyncKey)).toBe('7000');
    expect(localStorage.getItem(budgetItemSyncKey)).toBe('5000');
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
