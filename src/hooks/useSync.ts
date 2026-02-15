import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { fullSync, syncPush } from '../lib/sync';

const FULL_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 500;

export interface UseSyncResult {
  syncState: 'idle' | 'syncing' | 'error';
  lastSyncedAt: number | null;
  pendingCount: number;
  error: string | null;
}

const SyncContext = createContext<UseSyncResult | undefined>(undefined);

function useSyncController(): UseSyncResult {
  const { user, isConfigured } = useAuth();
  const [syncState, setSyncState] = useState<UseSyncResult['syncState']>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isSyncingRef = useRef(false);
  const pendingDebounceRef = useRef<number | null>(null);
  const previousPendingCountRef = useRef(0);

  const pendingCountQuery = useLiveQuery(async () => {
    const [pendingWalletsCount, pendingBudgetItemsCount] = await Promise.all([
      db.wallets.where('syncStatus').equals('pending').count(),
      db.budgetItems.where('syncStatus').equals('pending').count(),
    ]);

    return pendingWalletsCount + pendingBudgetItemsCount;
  });

  const pendingCount = pendingCountQuery ?? 0;
  const canSync = Boolean(user && isConfigured);

  const clearPendingDebounce = useCallback((): void => {
    if (pendingDebounceRef.current !== null) {
      window.clearTimeout(pendingDebounceRef.current);
      pendingDebounceRef.current = null;
    }
  }, []);

  const runSync = useCallback(
    async (mode: 'full' | 'push'): Promise<void> => {
      if (!user || !isConfigured || isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;

      if (isMountedRef.current) {
        setSyncState('syncing');
        setError(null);
      }

      try {
        if (mode === 'full') {
          await fullSync(user.id);
        } else {
          await syncPush(user.id);
        }

        if (isMountedRef.current) {
          setSyncState('idle');
          setLastSyncedAt(Date.now());
          setError(null);
        }
      } catch (syncError) {
        const errorMessage =
          syncError instanceof Error ? syncError.message : 'Failed to sync data';

        if (isMountedRef.current) {
          setSyncState('error');
          setError(errorMessage);
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    [isConfigured, user]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearPendingDebounce();
    };
  }, [clearPendingDebounce]);

  useEffect(() => {
    if (!canSync) {
      clearPendingDebounce();
      previousPendingCountRef.current = 0;
      setSyncState('idle');
      setLastSyncedAt(null);
      setError(null);
      return;
    }

    void runSync('full');

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        void runSync('full');
      }
    };

    const handleReconnect = (): void => {
      void runSync('full');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleReconnect);

    const intervalId = window.setInterval(() => {
      void runSync('full');
    }, FULL_SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleReconnect);
    };
  }, [canSync, clearPendingDebounce, runSync]);

  useEffect(() => {
    if (!canSync) {
      return;
    }

    if (pendingCount > 0) {
      clearPendingDebounce();
      pendingDebounceRef.current = window.setTimeout(() => {
        void runSync('push');
      }, PUSH_DEBOUNCE_MS);
    }

    return clearPendingDebounce;
  }, [canSync, clearPendingDebounce, pendingCount, runSync]);

  return useMemo(
    () => ({
      syncState,
      lastSyncedAt,
      pendingCount,
      error,
    }),
    [error, lastSyncedAt, pendingCount, syncState]
  );
}

export function SyncProvider({ children }: { children: ReactNode }): JSX.Element {
  const syncState = useSyncController();

  return createElement(SyncContext.Provider, { value: syncState }, children);
}

export function useSync(): UseSyncResult {
  const context = useContext(SyncContext);

  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }

  return context;
}
