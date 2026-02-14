import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';
import type { Wallet } from '../types';

export function useWallets(): Wallet[] | undefined {
  return useLiveQuery(() => db.wallets.orderBy('order').toArray(), []);
}
