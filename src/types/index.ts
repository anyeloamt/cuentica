export interface SyncableEntity {
  id?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'pending' | 'synced';
  deleted?: boolean;
}

export interface Wallet extends SyncableEntity {
  name: string;
  order: number;
  color?: string;
  categoryId?: string;
}

export interface BudgetItem extends SyncableEntity {
  walletId: string;
  order: number;
  name: string;
  type: '+' | '-';
  // Local app stores decimal currency units; Supabase persists integer cents.
  amount: number;
  date?: string;
  categoryTag?: string;
}

export type {
  AppendBudgetItemsResult,
  CopiedBudgetItem,
  CopiedBudgetItemsPayload,
  ParseBudgetItemsError,
  ParseBudgetItemsResult,
  PasteBudgetItemsResult,
} from './clipboard';
