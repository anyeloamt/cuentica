import Dexie, { type Table } from 'dexie';

import type { Wallet, BudgetItem } from '../types';

export class CuenticaDB extends Dexie {
  wallets!: Table<Wallet, string>;
  budgetItems!: Table<BudgetItem, string>;

  constructor() {
    super('cuentica');
    this.version(1).stores({
      wallets: 'id, name, order, categoryId, syncStatus, deleted',
      budgetItems: 'id, walletId, order, type, date, categoryTag, syncStatus, deleted',
    });
  }
}

export const db = new CuenticaDB();
