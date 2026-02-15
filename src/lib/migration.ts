import type { BudgetItem, Wallet } from '../types';

import { db } from './db';
import { supabase } from './supabase';

type SyncStatus = 'pending' | 'synced';

type WalletWithId = Wallet & { id: string };
type BudgetItemWithId = BudgetItem & { id: string };

interface LocalMigrationData {
  wallets: WalletWithId[];
  budgetItems: BudgetItemWithId[];
}

export interface SupabaseWalletRow {
  id: string;
  user_id: string;
  name: string;
  order: number;
  color: string | null;
  category_id: string | null;
  created_at: number;
  updated_at: number;
  sync_status: SyncStatus;
  deleted: boolean;
}

export interface SupabaseBudgetItemRow {
  id: string;
  user_id: string;
  wallet_id: string;
  order: number;
  name: string;
  type: '+' | '-';
  amount: number | string;
  date: string | null;
  category_tag: string | null;
  created_at: number;
  updated_at: number;
  sync_status: SyncStatus;
  deleted: boolean;
}

export type MigrationMode = 'skipped-empty' | 'pushed' | 'pulled';

export const toSupabaseWallet = (
  wallet: WalletWithId,
  userId: string
): SupabaseWalletRow => ({
  id: wallet.id,
  user_id: userId,
  name: wallet.name,
  order: wallet.order,
  color: wallet.color ?? null,
  category_id: wallet.categoryId ?? null,
  created_at: wallet.createdAt,
  updated_at: wallet.updatedAt,
  sync_status: wallet.syncStatus ?? 'pending',
  deleted: wallet.deleted ?? false,
});

export const toSupabaseBudgetItem = (
  budgetItem: BudgetItemWithId,
  userId: string
): SupabaseBudgetItemRow => ({
  id: budgetItem.id,
  user_id: userId,
  wallet_id: budgetItem.walletId,
  order: budgetItem.order,
  name: budgetItem.name,
  type: budgetItem.type,
  amount: budgetItem.amount,
  date: budgetItem.date ?? null,
  category_tag: budgetItem.categoryTag ?? null,
  created_at: budgetItem.createdAt,
  updated_at: budgetItem.updatedAt,
  sync_status: budgetItem.syncStatus ?? 'pending',
  deleted: budgetItem.deleted ?? false,
});

export const toLocalWallet = (wallet: SupabaseWalletRow): WalletWithId => ({
  id: wallet.id,
  name: wallet.name,
  order: wallet.order,
  color: wallet.color ?? undefined,
  categoryId: wallet.category_id ?? undefined,
  createdAt: wallet.created_at,
  updatedAt: wallet.updated_at,
  syncStatus: wallet.sync_status,
  deleted: wallet.deleted,
});

export const toLocalBudgetItem = (
  budgetItem: SupabaseBudgetItemRow
): BudgetItemWithId => ({
  id: budgetItem.id,
  walletId: budgetItem.wallet_id,
  order: budgetItem.order,
  name: budgetItem.name,
  type: budgetItem.type,
  amount: (() => {
    const parsed =
      typeof budgetItem.amount === 'number'
        ? budgetItem.amount
        : Number.parseFloat(budgetItem.amount);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid amount value for budget item ${budgetItem.id}`);
    }
    return parsed;
  })(),
  date: budgetItem.date ?? undefined,
  categoryTag: budgetItem.category_tag ?? undefined,
  createdAt: budgetItem.created_at,
  updatedAt: budgetItem.updated_at,
  syncStatus: budgetItem.sync_status,
  deleted: budgetItem.deleted,
});

const hasId = <T extends { id?: string }>(entity: T): entity is T & { id: string } =>
  typeof entity.id === 'string' && entity.id.length > 0;

const assertSupabaseConfigured = (): NonNullable<typeof supabase> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  return supabase;
};

export async function readLocalMigrationData(): Promise<LocalMigrationData> {
  const [wallets, budgetItems] = await Promise.all([
    db.wallets.filter((wallet) => !wallet.deleted).toArray(),
    db.budgetItems.filter((item) => !item.deleted).toArray(),
  ]);

  return {
    wallets: wallets.filter(hasId),
    budgetItems: budgetItems.filter(hasId),
  };
}

export async function upsertLocalDataToSupabase(userId: string): Promise<void> {
  const client = assertSupabaseConfigured();
  const localData = await readLocalMigrationData();

  const walletsPayload = localData.wallets.map((wallet) =>
    toSupabaseWallet(wallet, userId)
  );
  const budgetItemsPayload = localData.budgetItems.map((item) =>
    toSupabaseBudgetItem(item, userId)
  );

  if (walletsPayload.length > 0) {
    const { error } = await client
      .from('wallets')
      .upsert(walletsPayload, { onConflict: 'id' });

    if (error) {
      throw new Error(error.message);
    }
  }

  if (budgetItemsPayload.length > 0) {
    const { error } = await client
      .from('budget_items')
      .upsert(budgetItemsPayload, { onConflict: 'id' });

    if (error) {
      throw new Error(error.message);
    }
  }

  if (localData.wallets.length > 0 || localData.budgetItems.length > 0) {
    await db.transaction('rw', db.wallets, db.budgetItems, async () => {
      if (localData.wallets.length > 0) {
        await db.wallets.bulkPut(
          localData.wallets.map((wallet) => ({ ...wallet, syncStatus: 'synced' }))
        );
      }

      if (localData.budgetItems.length > 0) {
        await db.budgetItems.bulkPut(
          localData.budgetItems.map((item) => ({ ...item, syncStatus: 'synced' }))
        );
      }
    });
  }
}

export async function cloudHasDataForUser(userId: string): Promise<boolean> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .eq('deleted', false)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

export async function pullSupabaseDataToLocal(userId: string): Promise<void> {
  const client = assertSupabaseConfigured();
  const [walletsResponse, budgetItemsResponse] = await Promise.all([
    client
      .from('wallets')
      .select(
        'id,user_id,name,order,color,category_id,created_at,updated_at,sync_status,deleted'
      )
      .eq('user_id', userId)
      .eq('deleted', false),
    client
      .from('budget_items')
      .select(
        'id,user_id,wallet_id,order,name,type,amount,date,category_tag,created_at,updated_at,sync_status,deleted'
      )
      .eq('user_id', userId)
      .eq('deleted', false),
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
}

export async function migrateLocalDataForUser(userId: string): Promise<MigrationMode> {
  const localData = await readLocalMigrationData();

  if (localData.wallets.length === 0 && localData.budgetItems.length === 0) {
    const hasCloudData = await cloudHasDataForUser(userId);

    if (hasCloudData) {
      await pullSupabaseDataToLocal(userId);
      return 'pulled';
    }

    return 'skipped-empty';
  }

  await upsertLocalDataToSupabase(userId);
  return 'pushed';
}
