import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';
import type { BudgetItem } from '../types';

export function useBudgetItems(walletId: string) {
  const items = useLiveQuery(
    () => db.budgetItems.where('walletId').equals(walletId).sortBy('order'),
    [walletId]
  );

  const addItem = async () => {
    try {
      const lastItem = await db.budgetItems
        .where('walletId')
        .equals(walletId)
        .reverse()
        .sortBy('order')
        .then((items) => items[0]);

      const newOrder = (lastItem?.order ?? 0) + 1000;

      const newItem: BudgetItem = {
        id: crypto.randomUUID(),
        walletId,
        order: newOrder,
        name: '',
        type: '-',
        amount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending',
      };

      const id = await db.budgetItems.add(newItem);
      return { ok: true, id };
    } catch (error) {
      console.error('Failed to add budget item:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  const updateItem = async (id: string, changes: Partial<BudgetItem>) => {
    try {
      const count = await db.budgetItems.update(id, {
        ...changes,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      });
      if (count === 0) return { ok: false, error: 'not-found' };
      return { ok: true };
    } catch (error) {
      console.error('Failed to update budget item:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await db.budgetItems.delete(id);
      return { ok: true };
    } catch (error) {
      console.error('Failed to delete budget item:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  return { items, addItem, updateItem, deleteItem };
}
