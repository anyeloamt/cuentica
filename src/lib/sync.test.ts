import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from './db';
import type { SupabaseBudgetItemRow, SupabaseWalletRow } from './migration';

type TableName = 'wallets' | 'budget_items';

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
}

interface QueryBuilder {
  select: () => {
    eq: () => {
      gt: (
        column: 'updated_at',
        value: number
      ) => Promise<{
        data: (SupabaseWalletRow | SupabaseBudgetItemRow)[];
        error: null;
      }>;
    };
  };
}

const supabaseMock = vi.hoisted(
  (): { state: MockState; supabase: { from: (table: TableName) => QueryBuilder } } => {
    const state: MockState = {
      rows: {
        wallets: [],
        budget_items: [],
      },
      calls: [],
    };

    return {
      state,
      supabase: {
        from: (table: TableName): QueryBuilder => ({
          select: () => ({
            eq: () => ({
              gt: async (column: 'updated_at', value: number) => {
                const call: QueryCall = { table, gtValue: value };
                state.calls.push(call);

                return {
                  data: state.rows[table].filter((row) => row[column] > value),
                  error: null,
                };
              },
            }),
          }),
        }),
      },
    };
  }
);

vi.mock('./supabase', () => ({
  supabase: supabaseMock.supabase,
}));

const { syncPull } = await import('./sync');

const syncKey = 'cuentica-sync-ts-user-1';

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
