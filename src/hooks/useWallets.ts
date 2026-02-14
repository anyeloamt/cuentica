import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';
import type { Wallet } from '../types';

export type CreateWalletResult = { ok: true } | { ok: false; error: 'empty-name' };

export function useWallets(): {
  wallets: Wallet[] | undefined;
  createWallet: (name: string) => Promise<CreateWalletResult>;
} {
  const wallets = useLiveQuery(() => db.wallets.orderBy('order').toArray());

  const createWallet = async (name: string): Promise<CreateWalletResult> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { ok: false, error: 'empty-name' };
    }

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
  };

  return { wallets, createWallet };
}
