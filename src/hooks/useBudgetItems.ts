import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';
import type { AppendBudgetItemsResult, BudgetItem, CopiedBudgetItem } from '../types';

export function useBudgetItems(walletId: string) {
  const items = useLiveQuery(
    () =>
      db.budgetItems
        .where('walletId')
        .equals(walletId)
        .filter((item) => !item.deleted)
        .sortBy('order'),
    [walletId]
  );

  const addItem = async () => {
    try {
      const lastItem = await db.budgetItems
        .where('walletId')
        .equals(walletId)
        .filter((item) => !item.deleted)
        .reverse()
        .sortBy('order')
        .then((items) => items[0]);

      const newOrder = (lastItem?.order ?? 0) + 1000;

      const newItemId = crypto.randomUUID();
      const newItem: BudgetItem = {
        id: newItemId,
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

  const addItems = async () => {
    try {
      const lastItem = await db.budgetItems
        .where('walletId')
        .equals(walletId)
        .filter((item) => !item.deleted)
        .reverse()
        .sortBy('order')
        .then((items) => items[0]);

      let nextOrder = (lastItem?.order ?? 0) + 1000;
      const newItems: BudgetItem[] = [];
      const ids: string[] = [];

      for (let i = 0; i < 5; i++) {
        const id = crypto.randomUUID();
        ids.push(id);
        newItems.push({
          id,
          walletId,
          order: nextOrder,
          name: '',
          type: '-',
          amount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncStatus: 'pending',
        });
        nextOrder += 1000;
      }

      await db.budgetItems.bulkAdd(newItems);
      return { ok: true as const, ids };
    } catch (error) {
      console.error('Failed to add budget items:', error);
      return { ok: false as const, error: 'db-error' };
    }
  };

  const insertItemBelow = async (
    currentItemId: string
  ): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
    try {
      let result: { ok: true; id: string } | { ok: false; error: string } = {
        ok: false,
        error: 'not-found',
      };

      await db.transaction('rw', db.budgetItems, async () => {
        const currentItem = await db.budgetItems.get(currentItemId);

        if (!currentItem || currentItem.walletId !== walletId || currentItem.deleted) {
          return;
        }

        const nextItem = await db.budgetItems
          .where('walletId')
          .equals(walletId)
          .filter((item) => !item.deleted && item.order > currentItem.order)
          .sortBy('order')
          .then((walletItems) => walletItems[0]);

        const newOrder = nextItem
          ? (currentItem.order + nextItem.order) / 2
          : currentItem.order + 1000;

        const newItemId = crypto.randomUUID();
        const newItem: BudgetItem = {
          id: newItemId,
          walletId,
          order: newOrder,
          name: '',
          type: '-',
          amount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncStatus: 'pending',
        };

        await db.budgetItems.add(newItem);
        result = { ok: true, id: newItemId };
      });

      return result;
    } catch (error) {
      console.error('Failed to insert budget item below:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  const appendItemsFromPaste = async (
    itemsToAppend: CopiedBudgetItem[]
  ): Promise<AppendBudgetItemsResult> => {
    if (itemsToAppend.length === 0) {
      return { ok: false, error: 'no-items' };
    }

    try {
      let insertedCount = 0;

      await db.transaction('rw', db.budgetItems, async () => {
        const lastItem = await db.budgetItems
          .where('walletId')
          .equals(walletId)
          .filter((item) => !item.deleted)
          .reverse()
          .sortBy('order')
          .then((items) => items[0]);

        let nextOrder = (lastItem?.order ?? 0) + 1000;
        const timestamp = Date.now();

        const newItems: BudgetItem[] = itemsToAppend.map((item) => {
          const newItem: BudgetItem = {
            id: crypto.randomUUID(),
            walletId,
            order: nextOrder,
            name: item.name,
            type: item.type,
            amount: item.amount,
            categoryTag: item.categoryTag,
            date: item.date,
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'pending',
          };
          nextOrder += 1000;
          return newItem;
        });

        await db.budgetItems.bulkAdd(newItems);
        insertedCount = newItems.length;
      });

      return { ok: true, insertedCount };
    } catch (error) {
      console.error('Failed to append pasted budget items:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  const trimEmptyRows = async () => {
    try {
      const allItems = await db.budgetItems
        .where('walletId')
        .equals(walletId)
        .filter((item) => !item.deleted)
        .sortBy('order');

      const idsToDelete: string[] = [];

      for (let i = allItems.length - 1; i >= 0; i--) {
        const item = allItems[i];
        if (item.name.trim() === '' && item.amount === 0 && item.id) {
          idsToDelete.push(item.id);
        } else {
          break;
        }
      }

      if (idsToDelete.length > 0) {
        await db.budgetItems
          .where('id')
          .anyOf(idsToDelete)
          .modify({ deleted: true, syncStatus: 'pending', updatedAt: Date.now() });
        return { ok: true as const, count: idsToDelete.length };
      }

      return { ok: true as const, count: 0 };
    } catch (error) {
      console.error('Failed to trim budget items:', error);
      return { ok: false as const, error: 'db-error' };
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
      const exists = await db.budgetItems.get(id);
      if (!exists) {
        return { ok: false, error: 'not-found' };
      }
      await db.budgetItems.update(id, {
        deleted: true,
        syncStatus: 'pending',
        updatedAt: Date.now(),
      });
      return { ok: true };
    } catch (error) {
      console.error('Failed to delete budget item:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  const restoreItem = async (item: BudgetItem) => {
    try {
      if (item.id) {
        await db.budgetItems.update(item.id, {
          deleted: false,
          syncStatus: 'pending',
          updatedAt: Date.now(),
        });
      }
      return { ok: true };
    } catch (error) {
      console.error('Failed to restore budget item:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  const reorderBudgetItems = async (updates: { id: string; order: number }[]) => {
    try {
      await db.transaction('rw', db.budgetItems, async () => {
        const timestamp = Date.now();
        await Promise.all(
          updates.map(({ id, order }) =>
            db.budgetItems.update(id, {
              order,
              updatedAt: timestamp,
              syncStatus: 'pending',
            })
          )
        );
      });
      return { ok: true };
    } catch (error) {
      console.error('Failed to reorder budget items:', error);
      return { ok: false, error: 'db-error' };
    }
  };

  return {
    items,
    addItem,
    addItems,
    insertItemBelow,
    appendItemsFromPaste,
    trimEmptyRows,
    updateItem,
    deleteItem,
    restoreItem,
    reorderBudgetItems,
  };
}
