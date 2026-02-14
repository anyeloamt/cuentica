import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';
import type { Wallet } from '../types';

export type CreateWalletResult =
  | { ok: true }
  | { ok: false; error: 'empty-name' | 'db-error' };

export type DeleteWalletResult =
  | { ok: true }
  | { ok: false; error: 'not-found' | 'db-error' };

export type RenameWalletResult =
  | { ok: true }
  | { ok: false; error: 'empty-name' | 'not-found' | 'db-error' };

export type ReorderWalletResult =
  | { ok: true }
  | { ok: false; error: 'not-found' | 'already-at-edge' | 'db-error' };

export function useWallets(): {
  wallets: Wallet[] | undefined;
  createWallet: (name: string) => Promise<CreateWalletResult>;
  deleteWallet: (id: string) => Promise<DeleteWalletResult>;
  renameWallet: (id: string, name: string) => Promise<RenameWalletResult>;
  reorderWallet: (id: string, direction: 'up' | 'down') => Promise<ReorderWalletResult>;
} {
  const wallets = useLiveQuery(() => db.wallets.orderBy('order').toArray());

  const createWallet = async (name: string): Promise<CreateWalletResult> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { ok: false, error: 'empty-name' };
    }

    try {
      const maxOrderWallet = await db.wallets.orderBy('order').last();
      const newOrder = (maxOrderWallet?.order ?? -1) + 1;

      const newWallet: Wallet = {
        id: crypto.randomUUID(),
        name: trimmedName,
        order: newOrder,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.wallets.add(newWallet);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'db-error' };
    }
  };

  const deleteWallet = async (id: string): Promise<DeleteWalletResult> => {
    try {
      return await db.transaction('rw', db.wallets, db.budgetItems, async () => {
        const wallet = await db.wallets.get(id);
        if (!wallet) return { ok: false, error: 'not-found' };

        await db.budgetItems.where({ walletId: id }).delete();
        await db.wallets.delete(id);
        return { ok: true };
      });
    } catch (error) {
      return { ok: false, error: 'db-error' };
    }
  };

  const renameWallet = async (id: string, name: string): Promise<RenameWalletResult> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { ok: false, error: 'empty-name' };
    }

    try {
      const count = await db.wallets.update(id, {
        name: trimmedName,
        updatedAt: Date.now(),
      });

      if (count === 0) {
        return { ok: false, error: 'not-found' };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'db-error' };
    }
  };

  const reorderWallet = async (
    id: string,
    direction: 'up' | 'down'
  ): Promise<ReorderWalletResult> => {
    try {
      return await db.transaction('rw', db.wallets, async () => {
        const wallet = await db.wallets.get(id);
        if (!wallet) return { ok: false, error: 'not-found' };

        const allWallets = await db.wallets.orderBy('order').toArray();
        const currentIndex = allWallets.findIndex((w) => w.id === id);

        if (currentIndex === -1) return { ok: false, error: 'not-found' };

        const adjacentIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (adjacentIndex < 0 || adjacentIndex >= allWallets.length) {
          return { ok: false, error: 'already-at-edge' };
        }

        const adjacentWallet = allWallets[adjacentIndex];
        if (!adjacentWallet.id) return { ok: false, error: 'not-found' };

        // Swap orders
        await db.wallets.update(id, {
          order: adjacentWallet.order,
          updatedAt: Date.now(),
        });
        await db.wallets.update(adjacentWallet.id, {
          order: wallet.order,
          updatedAt: Date.now(),
        });

        return { ok: true };
      });
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'db-error' };
    }
  };

  return { wallets, createWallet, deleteWallet, renameWallet, reorderWallet };
}
