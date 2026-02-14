import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';
import type { Wallet } from '../types';

export type CreateWalletResult =
  | { ok: true }
  | { ok: false; error: 'empty-name' | 'db-error' };

export type DeleteWalletResult =
  | { ok: true }
  | { ok: false; error: 'not-found' | 'db-error' };

export function useWallets(): {
  wallets: Wallet[] | undefined;
  createWallet: (name: string) => Promise<CreateWalletResult>;
  deleteWallet: (id: string) => Promise<DeleteWalletResult>;
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

  return { wallets, createWallet, deleteWallet };
}
