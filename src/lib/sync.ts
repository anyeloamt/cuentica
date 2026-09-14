import type { BudgetItem, Wallet } from '../types';

import { db, prepareLocalUser } from './db';
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

type SyncEntity = 'wallets' | 'budget-items';

const getEntityCheckpointStorageKey = (userId: string, entity: SyncEntity): string =>
  `cuentica-sync-ts-${userId}-${entity}`;
const getReconciledStorageKey = (userId: string, entity: SyncEntity): string =>
  `cuentica-reconciled-${userId}-${entity}`;
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

const maxUpdatedAt = <T extends { updatedAt: number }>(rows: T[]): number | null => {
  if (rows.length === 0) {
    return null;
  }

  return Math.max(...rows.map((row) => row.updatedAt));
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

const pullRemoteWallets = async (
  userId: string,
  pullSinceTimestamp: number | null
): Promise<SupabaseWalletRow[]> => {
  const client = assertSupabaseConfigured();
  const walletsQuery = client
    .from('wallets')
    .select(walletColumns)
    .eq('user_id', userId);
  const walletsResponse = await (pullSinceTimestamp === null
    ? walletsQuery
    : walletsQuery.gt('updated_at', pullSinceTimestamp));

  if (walletsResponse.error) {
    throw new Error(walletsResponse.error.message);
  }

  return (walletsResponse.data ?? []) as SupabaseWalletRow[];
};

const pullRemoteBudgetItems = async (
  userId: string,
  pullSinceTimestamp: number | null
): Promise<SupabaseBudgetItemRow[]> => {
  const client = assertSupabaseConfigured();
  const budgetItemsQuery = client
    .from('budget_items')
    .select(budgetItemColumns)
    .eq('user_id', userId);
  const budgetItemsResponse = await (pullSinceTimestamp === null
    ? budgetItemsQuery
    : budgetItemsQuery.gt('updated_at', pullSinceTimestamp));

  if (budgetItemsResponse.error) {
    throw new Error(budgetItemsResponse.error.message);
  }

  return (budgetItemsResponse.data ?? []) as SupabaseBudgetItemRow[];
};

const applyRemoteWallets = async (remoteWallets: SupabaseWalletRow[]): Promise<number | null> => {
  const wallets = remoteWallets.map((wallet) => ({
    ...toLocalWallet(wallet),
    syncStatus: 'synced' as const,
  }));
  const walletsToStore = await withoutPendingLocalWallets(wallets);
  await db.wallets.bulkPut(walletsToStore);
  return maxUpdatedAt(walletsToStore);
};

const applyRemoteBudgetItems = async (
  remoteBudgetItems: SupabaseBudgetItemRow[]
): Promise<number | null> => {
  const budgetItems = remoteBudgetItems.map((item) => ({
    ...toLocalBudgetItem(item),
    syncStatus: 'synced' as const,
  }));
  const budgetItemsToStore = await withoutPendingLocalBudgetItems(budgetItems);
  await db.budgetItems.bulkPut(budgetItemsToStore);
  return maxUpdatedAt(budgetItemsToStore);
};

const getPullSinceTimestamp = (userId: string, entity: SyncEntity): number | null => {
  if (localStorage.getItem(getReconciledStorageKey(userId, entity)) !== 'done') {
    return null;
  }

  const parsed = Number.parseInt(
    localStorage.getItem(getEntityCheckpointStorageKey(userId, entity)) ?? '0',
    10
  );
  const checkpoint = Number.isNaN(parsed) ? 0 : parsed;
  return Math.max(0, checkpoint - PULL_CHECKPOINT_OVERLAP_MS);
};

const syncEntityPull = async (userId: string, entity: SyncEntity): Promise<void> => {
  const pullSinceTimestamp = getPullSinceTimestamp(userId, entity);
  const nextCheckpoint =
    entity === 'wallets'
      ? await applyRemoteWallets(await pullRemoteWallets(userId, pullSinceTimestamp))
      : await applyRemoteBudgetItems(await pullRemoteBudgetItems(userId, pullSinceTimestamp));

  if (nextCheckpoint !== null) {
    localStorage.setItem(
      getEntityCheckpointStorageKey(userId, entity),
      nextCheckpoint.toString()
    );
  }

  localStorage.setItem(getReconciledStorageKey(userId, entity), 'done');
};

export async function syncHydrate(userId: string): Promise<void> {
  const hydrationKey = getInitialCloudPullStorageKey(userId);

  if (localStorage.getItem(hydrationKey) === 'done') {
    return;
  }

  await syncPull(userId);
  localStorage.setItem(hydrationKey, 'done');
}

export async function syncPush(userId: string): Promise<void> {
  await prepareLocalUser(userId);
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
  await syncEntityPull(userId, 'wallets');
  await syncEntityPull(userId, 'budget-items');
}

export async function repairSync(userId: string): Promise<void> {
  (['wallets', 'budget-items'] as const).forEach((entity) => {
    localStorage.removeItem(getEntityCheckpointStorageKey(userId, entity));
    localStorage.removeItem(getReconciledStorageKey(userId, entity));
  });

  await fullSync(userId);
}

export async function fullSync(userId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  await prepareLocalUser(userId);
  await syncHydrate(userId);
  await syncPush(userId);
  await syncPull(userId);
}
