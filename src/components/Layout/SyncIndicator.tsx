import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../hooks/useSync';

function formatRelativeSyncTime(timestamp: number | null): string {
  if (timestamp === null) {
    return 'Never synced';
  }

  const diffMs = Date.now() - timestamp;

  if (diffMs < 5_000) {
    return 'Synced just now';
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `Synced ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Synced ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `Synced ${days}d ago`;
}

export function SyncIndicator(): JSX.Element | null {
  const { user } = useAuth();
  const { syncState, pendingCount, lastSyncedAt, error } = useSync();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const statusLabel = useMemo(() => {
    if (syncState === 'syncing') {
      return 'Syncing changes';
    }

    if (syncState === 'error') {
      return 'Sync error';
    }

    if (pendingCount > 0) {
      return `${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`;
    }

    return 'All changes synced';
  }, [pendingCount, syncState]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const isVisible = syncState === 'syncing' || syncState === 'error' || pendingCount > 0;

  if (!isVisible && !isOpen) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary hover:text-accent cursor-pointer"
        aria-label={statusLabel}
        aria-expanded={isOpen}
      >
        {syncState === 'syncing' && (
          <div
            className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-accent border-t-transparent"
            aria-hidden="true"
          />
        )}

        {syncState === 'error' && (
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        )}

        {syncState === 'idle' && pendingCount > 0 && (
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-lg border border-border bg-bg-primary p-3 shadow-lg">
          <p className="text-xs font-medium text-text-primary">{statusLabel}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatRelativeSyncTime(lastSyncedAt)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">Pending: {pendingCount}</p>
          {error && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
