import {
  assertLocalOwner,
  db,
  getLocalOwnerToken,
  type LocalOwnerToken,
} from './db';
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
interface PullCursor {
  updatedAt: number;
  id: string;
}

export type SyncResult = 'converged' | 'pending';

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

const pullRemoteWalletPage = async (
  token: LocalOwnerToken,
  pullSinceTimestamp: number | null,
  cursor: PullCursor | null
): Promise<SupabaseWalletRow[]> => {
  assertLocalOwner(token);
  const client = assertSupabaseConfigured();
  const walletsQuery = client
    .from('wallets')
    .select(walletColumns)
    .eq('user_id', token.userId);
  const filteredQuery =
    pullSinceTimestamp === null
      ? walletsQuery
      : walletsQuery.gt('updated_at', pullSinceTimestamp);
  const pageQuery = cursor
    ? filteredQuery.or(
        `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`
      )
    : filteredQuery;
  const walletsResponse = await pageQuery
    .order('updated_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(SYNC_BATCH_SIZE);

  assertLocalOwner(token);
  if (walletsResponse.error) {
    throw new Error(walletsResponse.error.message);
  }

  return (walletsResponse.data ?? []) as SupabaseWalletRow[];
};

const pullRemoteBudgetItemPage = async (
  token: LocalOwnerToken,
  pullSinceTimestamp: number | null,
  cursor: PullCursor | null
): Promise<SupabaseBudgetItemRow[]> => {
  assertLocalOwner(token);
  const client = assertSupabaseConfigured();
  const budgetItemsQuery = client
    .from('budget_items')
    .select(budgetItemColumns)
    .eq('user_id', token.userId);
  const filteredQuery =
    pullSinceTimestamp === null
      ? budgetItemsQuery
      : budgetItemsQuery.gt('updated_at', pullSinceTimestamp);
  const pageQuery = cursor
    ? filteredQuery.or(
        `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`
      )
    : filteredQuery;
  const budgetItemsResponse = await pageQuery
    .order('updated_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(SYNC_BATCH_SIZE);

  assertLocalOwner(token);
  if (budgetItemsResponse.error) {
    throw new Error(budgetItemsResponse.error.message);
  }

  return (budgetItemsResponse.data ?? []) as SupabaseBudgetItemRow[];
};

const applyRemoteWallets = async (
  token: LocalOwnerToken,
  remoteWallets: SupabaseWalletRow[]
): Promise<number | null> => {
  const wallets = remoteWallets.map((wallet) => ({
    ...toLocalWallet(wallet),
    syncStatus: 'synced' as const,
  }));

  return db.transaction('rw', db.wallets, async () => {
    assertLocalOwner(token);
    const localWallets = await db.wallets
      .where('id')
      .anyOf(wallets.map((wallet) => wallet.id))
      .toArray();
    const pendingLocalIds = new Set(
      localWallets
        .filter((wallet) => wallet.syncStatus === 'pending' && hasId(wallet))
        .map((wallet) => wallet.id)
    );
    const walletsToStore = wallets.filter((wallet) => !pendingLocalIds.has(wallet.id));

    if (walletsToStore.length > 0) {
      await db.wallets.bulkPut(walletsToStore);
    }

    assertLocalOwner(token);
    return maxUpdatedAt(walletsToStore);
  });
};

const applyRemoteBudgetItems = async (
  token: LocalOwnerToken,
  remoteBudgetItems: SupabaseBudgetItemRow[]
): Promise<number | null> => {
  const budgetItems = remoteBudgetItems.map((item) => ({
    ...toLocalBudgetItem(item),
    syncStatus: 'synced' as const,
  }));

  return db.transaction('rw', db.budgetItems, async () => {
    assertLocalOwner(token);
    const localBudgetItems = await db.budgetItems
      .where('id')
      .anyOf(budgetItems.map((item) => item.id))
      .toArray();
    const pendingLocalIds = new Set(
      localBudgetItems
        .filter((item) => item.syncStatus === 'pending' && hasId(item))
        .map((item) => item.id)
    );
    const budgetItemsToStore = budgetItems.filter(
      (item) => !pendingLocalIds.has(item.id)
    );

    if (budgetItemsToStore.length > 0) {
      await db.budgetItems.bulkPut(budgetItemsToStore);
    }

    assertLocalOwner(token);
    return maxUpdatedAt(budgetItemsToStore);
  });
};

const getPullSinceTimestamp = (token: LocalOwnerToken, entity: SyncEntity): number | null => {
  assertLocalOwner(token);
  if (
    localStorage.getItem(getReconciledStorageKey(token.userId, entity)) !==
    token.generation.toString()
  ) {
    return null;
  }

  const parsed = Number.parseInt(
    localStorage.getItem(getEntityCheckpointStorageKey(token.userId, entity)) ?? '0',
    10
  );
  const checkpoint = Number.isNaN(parsed) ? 0 : parsed;
  return Math.max(0, checkpoint - PULL_CHECKPOINT_OVERLAP_MS);
};

const syncEntityPull = async <TRow extends { id: string; updated_at: number }>(
  token: LocalOwnerToken,
  entity: SyncEntity,
  pullRemotePage: (
    token: LocalOwnerToken,
    pullSinceTimestamp: number | null,
    cursor: PullCursor | null
  ) => Promise<TRow[]>,
  applyRemoteRows: (token: LocalOwnerToken, rows: TRow[]) => Promise<number | null>,
  authoritative: boolean
): Promise<void> => {
  const pullSinceTimestamp = authoritative ? null : getPullSinceTimestamp(token, entity);
  let nextCheckpoint: number | null = null;
  let cursor: PullCursor | null = null;
  let hasMore = true;

  while (hasMore) {
    const remoteRows = await pullRemotePage(token, pullSinceTimestamp, cursor);
    const pageCheckpoint = await applyRemoteRows(token, remoteRows);

    if (pageCheckpoint !== null) {
      nextCheckpoint = Math.max(nextCheckpoint ?? pageCheckpoint, pageCheckpoint);
    }

    hasMore = remoteRows.length === SYNC_BATCH_SIZE;
    if (hasMore) {
      const lastRemoteRow = remoteRows[remoteRows.length - 1];
      cursor = { updatedAt: lastRemoteRow.updated_at, id: lastRemoteRow.id };
    }
  }

  assertLocalOwner(token);
  if (nextCheckpoint !== null) {
    localStorage.setItem(
      getEntityCheckpointStorageKey(token.userId, entity),
      nextCheckpoint.toString()
    );
  } else if (pullSinceTimestamp === null) {
    localStorage.removeItem(getEntityCheckpointStorageKey(token.userId, entity));
  }

  assertLocalOwner(token);
  localStorage.setItem(
    getReconciledStorageKey(token.userId, entity),
    token.generation.toString()
  );
};

const syncPullForOwner = async (
  token: LocalOwnerToken,
  authoritative = false
): Promise<void> => {
  await syncEntityPull(
    token,
    'wallets',
    pullRemoteWalletPage,
    applyRemoteWallets,
    authoritative
  );
  await syncEntityPull(
    token,
    'budget-items',
    pullRemoteBudgetItemPage,
    applyRemoteBudgetItems,
    authoritative
  );
};

const syncHydrateForOwner = async (token: LocalOwnerToken): Promise<void> => {
  const hydrationKey = getInitialCloudPullStorageKey(token.userId);

  assertLocalOwner(token);
  if (localStorage.getItem(hydrationKey) === 'done') {
    return;
  }

  await syncPullForOwner(token);
  assertLocalOwner(token);
  localStorage.setItem(hydrationKey, 'done');
};

const syncPushForOwner = async (token: LocalOwnerToken): Promise<void> => {
  const client = assertSupabaseConfigured();
  const { pendingWallets, pendingBudgetItems } = await db.transaction(
    'r',
    db.wallets,
    db.budgetItems,
    async () => {
      assertLocalOwner(token);
      return {
        pendingWallets: await db.wallets.where('syncStatus').equals('pending').toArray(),
        pendingBudgetItems: await db.budgetItems
          .where('syncStatus')
          .equals('pending')
          .toArray(),
      };
    }
  );

  const walletsWithId = pendingWallets.filter(hasId);
  const budgetItemsWithId = pendingBudgetItems.filter(hasId);

  const walletsPayload = walletsWithId.map((wallet) =>
    toSupabaseWallet(wallet, token.userId)
  );
  const budgetItemsPayload = budgetItemsWithId.map((item) =>
    toSupabaseBudgetItem(item, token.userId)
  );

  for (const walletBatch of chunk(walletsPayload, SYNC_BATCH_SIZE)) {
    assertLocalOwner(token);
    const { error } = await client
      .from('wallets')
      .upsert(walletBatch, { onConflict: 'id' });
    assertLocalOwner(token);
    if (error) {
      throw new Error(error.message);
    }
  }

  for (const budgetItemBatch of chunk(budgetItemsPayload, SYNC_BATCH_SIZE)) {
    assertLocalOwner(token);
    const { error } = await client
      .from('budget_items')
      .upsert(budgetItemBatch, { onConflict: 'id' });
    assertLocalOwner(token);
    if (error) {
      throw new Error(error.message);
    }
  }

  if (walletsWithId.length === 0 && budgetItemsWithId.length === 0) {
    return;
  }

  await db.transaction('rw', db.wallets, db.budgetItems, async () => {
    assertLocalOwner(token);
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

    assertLocalOwner(token);
  });
};

const countPendingForOwner = async (token: LocalOwnerToken): Promise<number> =>
  db.transaction('r', db.wallets, db.budgetItems, async () => {
    assertLocalOwner(token);
    const pendingWallets = await db.wallets.where('syncStatus').equals('pending').count();
    const pendingBudgetItems = await db.budgetItems
      .where('syncStatus')
      .equals('pending')
      .count();
    assertLocalOwner(token);
    return pendingWallets + pendingBudgetItems;
  });

const fullSyncForOwner = async (token: LocalOwnerToken): Promise<SyncResult> => {
  assertSupabaseConfigured();
  assertLocalOwner(token);
  await syncHydrateForOwner(token);
  await syncPushForOwner(token);
  await syncPullForOwner(token, true);
  return (await countPendingForOwner(token)) === 0 ? 'converged' : 'pending';
};

export async function syncHydrate(userId: string): Promise<void> {
  await syncHydrateForOwner(getLocalOwnerToken(userId));
}

export async function syncPush(userId: string): Promise<void> {
  await syncPushForOwner(getLocalOwnerToken(userId));
}

export async function syncPull(userId: string): Promise<void> {
  await syncPullForOwner(getLocalOwnerToken(userId));
}

export async function repairSync(userId: string): Promise<SyncResult> {
  assertSupabaseConfigured();
  const token = getLocalOwnerToken(userId);

  (['wallets', 'budget-items'] as const).forEach((entity) => {
    assertLocalOwner(token);
    localStorage.removeItem(getEntityCheckpointStorageKey(userId, entity));
    localStorage.removeItem(getReconciledStorageKey(userId, entity));
  });

  return fullSyncForOwner(token);
}

export async function fullSync(userId: string): Promise<SyncResult> {
  assertSupabaseConfigured();
  return fullSyncForOwner(getLocalOwnerToken(userId));
}
