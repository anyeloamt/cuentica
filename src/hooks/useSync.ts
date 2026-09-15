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
import {
  db,
  getLocalOwnerToken,
  isLocalOwnerTokenCurrent,
  type LocalOwnerToken,
} from '../lib/db';
import {
  fullSync,
  repairSync as runRepairSync,
  syncPush,
  type SyncResult,
} from '../lib/sync';

const FULL_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 500;

export interface UseSyncResult {
  syncState: 'idle' | 'syncing' | 'error';
  lastSyncedAt: number | null;
  pendingCount: number;
  error: string | null;
  hasConverged: boolean;
  repairSync: () => Promise<void>;
}

const SyncContext = createContext<UseSyncResult | undefined>(undefined);

interface InFlightSync {
  key: string;
  operation: object;
  promise: Promise<void>;
}

function useSyncController(): UseSyncResult {
  const { user, isConfigured } = useAuth();
  const [syncState, setSyncState] = useState<UseSyncResult['syncState']>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConverged, setHasConverged] = useState(false);

  const isMountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  const inFlightSyncRef = useRef<InFlightSync | null>(null);
  const pendingDebounceRef = useRef<number | null>(null);
  currentUserIdRef.current = user?.id ?? null;

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
    async (mode: 'full' | 'push' | 'repair'): Promise<void> => {
      if (!user || !isConfigured) {
        return;
      }

      let ownerToken: LocalOwnerToken;
      try {
        ownerToken = getLocalOwnerToken(user.id);
      } catch {
        return;
      }

      const ownerKey = `${ownerToken.userId}:${ownerToken.generation}`;
      const activeSync = inFlightSyncRef.current;

      if (activeSync?.key === ownerKey) {
        await activeSync.promise;

        if (mode !== 'repair') {
          return;
        }

        if (
          currentUserIdRef.current !== ownerToken.userId ||
          !isLocalOwnerTokenCurrent(ownerToken)
        ) {
          return;
        }
      }

      const operation = {};
      const canPublish = (): boolean =>
        isMountedRef.current &&
        currentUserIdRef.current === ownerToken.userId &&
        isLocalOwnerTokenCurrent(ownerToken);

      if (canPublish()) {
        setSyncState('syncing');
        setError(null);
      }

      const promise = (async (): Promise<void> => {
        try {
          let result: SyncResult | null = null;
          if (mode === 'full') {
            result = await fullSync(ownerToken.userId);
          } else if (mode === 'repair') {
            result = await runRepairSync(ownerToken.userId);
          } else {
            await syncPush(ownerToken.userId);
          }

          if (canPublish()) {
            setSyncState('idle');
            if (result !== null) {
              const converged = result === 'converged';
              setHasConverged(converged);
              if (converged) {
                setLastSyncedAt(Date.now());
              }
            }
            setError(null);
          }
        } catch (syncError) {
          const errorMessage =
            syncError instanceof Error ? syncError.message : 'Failed to sync data';

          if (canPublish()) {
            setSyncState('error');
            setError(errorMessage);
            if (mode !== 'push') {
              setHasConverged(false);
            }
          }
        } finally {
          if (inFlightSyncRef.current?.operation === operation) {
            inFlightSyncRef.current = null;
          }
        }
      })();

      inFlightSyncRef.current = { key: ownerKey, operation, promise };
      await promise;
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
      setSyncState('idle');
      setLastSyncedAt(null);
      setError(null);
      setHasConverged(false);
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
      setHasConverged(false);
      clearPendingDebounce();
      pendingDebounceRef.current = window.setTimeout(() => {
        void runSync('push');
      }, PUSH_DEBOUNCE_MS);
    }

    return clearPendingDebounce;
  }, [canSync, clearPendingDebounce, pendingCount, runSync]);

  const repairSync = useCallback(async (): Promise<void> => {
    await runSync('repair');
  }, [runSync]);

  return useMemo(
    () => ({
      syncState,
      lastSyncedAt,
      pendingCount,
      error,
      hasConverged,
      repairSync,
    }),
    [error, hasConverged, lastSyncedAt, pendingCount, repairSync, syncState]
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
