import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { migrateLocalDataForUser } from '../lib/migration';

interface UseMigrationResult {
  migrating: boolean;
  error: string | null;
  retry: () => void;
}

const migrationFlagKey = (userId: string): string => `cuentica-migration-${userId}`;

const isMigrationDone = (userId: string): boolean =>
  localStorage.getItem(migrationFlagKey(userId)) === 'done';

const setMigrationDone = (userId: string): void => {
  localStorage.setItem(migrationFlagKey(userId), 'done');
};

export function useMigration(): UseMigrationResult {
  const { user, loading, isConfigured } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const runningRef = useRef(false);

  const retry = useCallback((): void => {
    setAttempt((previousAttempt) => previousAttempt + 1);
  }, []);

  useEffect(() => {
    if (loading || !isConfigured || !user) {
      return;
    }

    if (isMigrationDone(user.id)) {
      return;
    }

    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    setMigrating(true);
    setError(null);

    let isMounted = true;

    migrateLocalDataForUser(user.id)
      .then(() => {
        if (!isMounted) {
          return;
        }

        setMigrationDone(user.id);
      })
      .catch((migrationError: unknown) => {
        if (!isMounted) {
          return;
        }

        const message =
          migrationError instanceof Error
            ? migrationError.message
            : 'Data migration failed';
        setError(message);
      })
      .finally(() => {
        runningRef.current = false;

        if (!isMounted) {
          return;
        }

        setMigrating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [attempt, isConfigured, loading, user]);

  return {
    migrating,
    error,
    retry,
  };
}
