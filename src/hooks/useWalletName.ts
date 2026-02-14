import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../lib/db';

export function useWalletName(id: string | undefined): string | undefined {
  const wallet = useLiveQuery(() => {
    if (!id) return undefined;
    return db.wallets.get(id);
  }, [id]);

  return wallet?.name;
}
