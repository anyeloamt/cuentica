import type { BudgetItem, Wallet } from '../types';

import { db } from './db';
import {
  toLocalBudgetItem,
  toLocalWallet,
  toSupabaseBudgetItem,
  toSupabaseWallet,
  type SupabaseBudgetItemRow,
  type SupabaseWalletRow,
} from './migration';
import { supabase } from './supabase';

const SYNC_BATCH_SIZE = 100;
const PULL_CHECKPOINT_OVERLAP_MS = 24 * 60 * 60 * 1000;

const getLastSyncStorageKey = (userId: string): string => `cuentica-sync-ts-${userId}`;
const getInitialCloudPullStorageKey = (userId: string): string =>
  `cuentica-initial-cloud-pull-v2-${userId}`;

const walletColumns =
  'id,user_id,name,order,color,category_id,created_at,updated_at,sync_status,deleted';
const budgetItemColumns =
  'id,user_id,wallet_id,order,name,type,amount,date,category_tag,created_at,updated_at,sync_status,deleted';

const assertSupabaseConfigured = (): NonNullable<typeof supabase> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  return supabase;
};

const hasId = <T extends { id?: string }>(entity: T): entity is T & { id: string } =>
  typeof entity.id === 'string' && entity.id.length > 0;

const chunk = <T>(input: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < input.length; index += size) {
    chunks.push(input.slice(index, index + size));
  }
  return chunks;
};

const maxLocalUpdatedAt = (
  wallets: (Wallet & { id: string })[],
  budgetItems: (BudgetItem & { id: string })[]
): number | null => {
  const timestamps = [
    ...wallets.map((wallet) => wallet.updatedAt),
    ...budgetItems.map((item) => item.updatedAt),
  ];

  if (timestamps.length === 0) {
    return null;
  }

  return Math.max(...timestamps);
};

const withoutPendingLocalWallets = async (
  wallets: (Wallet & { id: string })[]
): Promise<(Wallet & { id: string })[]> => {
  if (wallets.length === 0) {
    return wallets;
  }

  const localWallets = await db.wallets
    .where('id')
    .anyOf(wallets.map((wallet) => wallet.id))
    .toArray();
  const pendingLocalIds = new Set(
    localWallets
      .filter((wallet) => wallet.syncStatus === 'pending' && hasId(wallet))
      .map((wallet) => wallet.id)
  );

  return wallets.filter((wallet) => !pendingLocalIds.has(wallet.id));
};

const withoutPendingLocalBudgetItems = async (
  budgetItems: (BudgetItem & { id: string })[]
): Promise<(BudgetItem & { id: string })[]> => {
  if (budgetItems.length === 0) {
    return budgetItems;
  }

  const localBudgetItems = await db.budgetItems
    .where('id')
    .anyOf(budgetItems.map((item) => item.id))
    .toArray();
  const pendingLocalIds = new Set(
    localBudgetItems
      .filter((item) => item.syncStatus === 'pending' && hasId(item))
      .map((item) => item.id)
  );

  return budgetItems.filter((item) => !pendingLocalIds.has(item.id));
};

const pullRemoteRows = async (
  userId: string,
  pullSinceTimestamp: number | null
): Promise<{
  wallets: SupabaseWalletRow[];
  budgetItems: SupabaseBudgetItemRow[];
}> => {
  const client = assertSupabaseConfigured();
  const walletsQuery = client
    .from('wallets')
    .select(walletColumns)
    .eq('user_id', userId);
  const budgetItemsQuery = client
    .from('budget_items')
    .select(budgetItemColumns)
    .eq('user_id', userId);

  const [walletsResponse, budgetItemsResponse] = await Promise.all([
    pullSinceTimestamp === null
      ? walletsQuery
      : walletsQuery.gt('updated_at', pullSinceTimestamp),
    pullSinceTimestamp === null
      ? budgetItemsQuery
      : budgetItemsQuery.gt('updated_at', pullSinceTimestamp),
  ]);

  if (walletsResponse.error) {
    throw new Error(walletsResponse.error.message);
  }

  if (budgetItemsResponse.error) {
    throw new Error(budgetItemsResponse.error.message);
  }

  return {
    wallets: (walletsResponse.data ?? []) as SupabaseWalletRow[],
    budgetItems: (budgetItemsResponse.data ?? []) as SupabaseBudgetItemRow[],
  };
};

const applyRemoteRows = async (
  remoteWallets: SupabaseWalletRow[],
  remoteBudgetItems: SupabaseBudgetItemRow[]
): Promise<number | null> => {
  const wallets = remoteWallets.map((wallet) => ({
    ...toLocalWallet(wallet),
    syncStatus: 'synced' as const,
  }));
  const budgetItems = remoteBudgetItems.map((item) => ({
    ...toLocalBudgetItem(item),
    syncStatus: 'synced' as const,
  }));
  const walletsToStore = await withoutPendingLocalWallets(wallets);
  const budgetItemsToStore = await withoutPendingLocalBudgetItems(budgetItems);
  const nextCheckpoint = maxLocalUpdatedAt(walletsToStore, budgetItemsToStore);

  await db.transaction('rw', db.wallets, db.budgetItems, async () => {
    if (walletsToStore.length > 0) {
      await db.wallets.bulkPut(walletsToStore);
    }

    if (budgetItemsToStore.length > 0) {
      await db.budgetItems.bulkPut(budgetItemsToStore);
    }
  });

  return nextCheckpoint;
};

export async function syncHydrate(userId: string): Promise<void> {
  const hydrationKey = getInitialCloudPullStorageKey(userId);

  if (localStorage.getItem(hydrationKey) === 'done') {
    return;
  }

  const remoteRows = await pullRemoteRows(userId, null);
  const nextCheckpoint = await applyRemoteRows(
    remoteRows.wallets,
    remoteRows.budgetItems
  );

  if (nextCheckpoint !== null) {
    localStorage.setItem(getLastSyncStorageKey(userId), nextCheckpoint.toString());
  }

  localStorage.setItem(hydrationKey, 'done');
}

export async function syncPush(userId: string): Promise<void> {
  const client = assertSupabaseConfigured();
  const [pendingWallets, pendingBudgetItems] = await Promise.all([
    db.wallets.where('syncStatus').equals('pending').toArray(),
    db.budgetItems.where('syncStatus').equals('pending').toArray(),
  ]);

  const walletsWithId = pendingWallets.filter(hasId);
  const budgetItemsWithId = pendingBudgetItems.filter(hasId);

  const walletsPayload = walletsWithId.map((wallet) => toSupabaseWallet(wallet, userId));
  const budgetItemsPayload = budgetItemsWithId.map((item) =>
    toSupabaseBudgetItem(item, userId)
  );

  for (const walletBatch of chunk(walletsPayload, SYNC_BATCH_SIZE)) {
    const { error } = await client
      .from('wallets')
      .upsert(walletBatch, { onConflict: 'id' });
    if (error) {
      throw new Error(error.message);
    }
  }

  for (const budgetItemBatch of chunk(budgetItemsPayload, SYNC_BATCH_SIZE)) {
    const { error } = await client
      .from('budget_items')
      .upsert(budgetItemBatch, { onConflict: 'id' });
    if (error) {
      throw new Error(error.message);
    }
  }

  if (walletsWithId.length === 0 && budgetItemsWithId.length === 0) {
    return;
  }

  await db.transaction('rw', db.wallets, db.budgetItems, async () => {
    if (walletsWithId.length > 0) {
      const walletTimestamps = new Map(
        walletsWithId.map((wallet) => [wallet.id, wallet.updatedAt])
      );
      const walletIds = walletsWithId.map((wallet) => wallet.id);
      await db.wallets
        .where('id')
        .anyOf(walletIds)
        .modify((wallet, ref) => {
          if (wallet.updatedAt === walletTimestamps.get(wallet.id!)) {
            ref.value.syncStatus = 'synced';
          }
        });
    }

    if (budgetItemsWithId.length > 0) {
      const itemTimestamps = new Map(
        budgetItemsWithId.map((item) => [item.id, item.updatedAt])
      );
      const budgetItemIds = budgetItemsWithId.map((item) => item.id);
      await db.budgetItems
        .where('id')
        .anyOf(budgetItemIds)
        .modify((item, ref) => {
          if (item.updatedAt === itemTimestamps.get(item.id!)) {
            ref.value.syncStatus = 'synced';
          }
        });
    }
  });
}

export async function syncPull(userId: string): Promise<void> {
  const key = getLastSyncStorageKey(userId);
  const lastSyncTimestampRaw = localStorage.getItem(key);
  const parsed = Number.parseInt(lastSyncTimestampRaw ?? '0', 10);
  const lastSyncTimestamp = Number.isNaN(parsed) ? 0 : parsed;
  const pullSinceTimestamp = Math.max(0, lastSyncTimestamp - PULL_CHECKPOINT_OVERLAP_MS);
  const remoteRows = await pullRemoteRows(userId, pullSinceTimestamp);
  const nextCheckpoint = await applyRemoteRows(
    remoteRows.wallets,
    remoteRows.budgetItems
  );

  if (nextCheckpoint !== null) {
    localStorage.setItem(key, nextCheckpoint.toString());
  }
}

export async function fullSync(userId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  await syncHydrate(userId);
  await syncPush(userId);
  await syncPull(userId);
}
