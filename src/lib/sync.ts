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

const getLastSyncStorageKey = (userId: string): string => `cuentica-sync-ts-${userId}`;

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
      await db.wallets.bulkPut(
        walletsWithId.map((wallet) => ({
          ...wallet,
          syncStatus: 'synced',
        }))
      );
    }

    if (budgetItemsWithId.length > 0) {
      await db.budgetItems.bulkPut(
        budgetItemsWithId.map((item) => ({
          ...item,
          syncStatus: 'synced',
        }))
      );
    }
  });
}

export async function syncPull(userId: string): Promise<void> {
  const client = assertSupabaseConfigured();
  const key = getLastSyncStorageKey(userId);
  const lastSyncTimestampRaw = localStorage.getItem(key);
  const parsed = Number.parseInt(lastSyncTimestampRaw ?? '0', 10);
  const lastSyncTimestamp = Number.isNaN(parsed) ? 0 : parsed;

  const [walletsResponse, budgetItemsResponse] = await Promise.all([
    client
      .from('wallets')
      .select(
        'id,user_id,name,order,color,category_id,created_at,updated_at,sync_status,deleted'
      )
      .eq('user_id', userId)
      .gt('updated_at', lastSyncTimestamp),
    client
      .from('budget_items')
      .select(
        'id,user_id,wallet_id,order,name,type,amount,date,category_tag,created_at,updated_at,sync_status,deleted'
      )
      .eq('user_id', userId)
      .gt('updated_at', lastSyncTimestamp),
  ]);

  if (walletsResponse.error) {
    throw new Error(walletsResponse.error.message);
  }

  if (budgetItemsResponse.error) {
    throw new Error(budgetItemsResponse.error.message);
  }

  const wallets = (walletsResponse.data ?? []).map((wallet) =>
    toLocalWallet(wallet as SupabaseWalletRow)
  );
  const budgetItems = (budgetItemsResponse.data ?? []).map((item) =>
    toLocalBudgetItem(item as SupabaseBudgetItemRow)
  );

  await db.transaction('rw', db.wallets, db.budgetItems, async () => {
    if (wallets.length > 0) {
      await db.wallets.bulkPut(wallets);
    }

    if (budgetItems.length > 0) {
      await db.budgetItems.bulkPut(budgetItems);
    }
  });

  localStorage.setItem(key, Date.now().toString());
}

export async function fullSync(userId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  await syncPush(userId);
  await syncPull(userId);
}
