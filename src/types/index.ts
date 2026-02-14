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
  amount: number;
  date?: string;
  categoryTag?: string;
}
