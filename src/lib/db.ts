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

const localOwnerStorageKey = 'cuentica-local-owner';
const localOwnerGenerationStorageKey = 'cuentica-local-owner-generation';

export interface LocalOwnerToken {
  userId: string;
  generation: number;
}

const readLocalOwnerGeneration = (): number => {
  const generation = Number.parseInt(
    localStorage.getItem(localOwnerGenerationStorageKey) ?? '0',
    10
  );
  return Number.isNaN(generation) ? 0 : generation;
};

export function isLocalOwnerTokenCurrent(token: LocalOwnerToken): boolean {
  return (
    localStorage.getItem(localOwnerStorageKey) === token.userId &&
    readLocalOwnerGeneration() === token.generation
  );
}

export function assertLocalOwner(token: LocalOwnerToken): void {
  if (!isLocalOwnerTokenCurrent(token)) {
    throw new Error('Local data owner changed');
  }
}

export function getLocalOwnerToken(userId: string): LocalOwnerToken {
  const token = {
    userId,
    generation: readLocalOwnerGeneration(),
  };
  assertLocalOwner(token);
  return token;
}

export async function prepareLocalUser(userId: string): Promise<LocalOwnerToken> {
  return db.transaction('rw', db.wallets, db.budgetItems, async () => {
    const localOwner = localStorage.getItem(localOwnerStorageKey);
    const generation = readLocalOwnerGeneration();

    if (
      localOwner === userId &&
      localStorage.getItem(localOwnerGenerationStorageKey) !== null
    ) {
      return { userId, generation };
    }

    if (localOwner !== null && localOwner !== userId) {
      await db.wallets.clear();
      await db.budgetItems.clear();
    }

    const nextGeneration = generation + 1;
    localStorage.setItem(localOwnerStorageKey, userId);
    localStorage.setItem(localOwnerGenerationStorageKey, nextGeneration.toString());
    return { userId, generation: nextGeneration };
  });
}
