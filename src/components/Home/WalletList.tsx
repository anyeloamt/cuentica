import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import type { Wallet } from '../../types';

interface WalletListProps {
  wallets: Wallet[] | undefined;
  onDeleteWallet: (wallet: Wallet) => void;
  onRenameWallet: (id: string, newName: string) => Promise<void>;
  onReorderWallets: (
    updates: { id: string; order: number }[]
  ) => Promise<{ ok: boolean; error?: string }>;
}

interface SortableWalletCardProps {
  wallet: Wallet;
  editingWalletId: string | null;
  editName: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onStartEdit: (e: React.SyntheticEvent, wallet: Wallet) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteWallet: (wallet: Wallet) => void;
  setEditName: (name: string) => void;
}

function SortableWalletCard({
  wallet,
  editingWalletId,
  editName,
  inputRef,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteWallet,
  setEditName,
}: SortableWalletCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: wallet.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancelEdit();
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <Link
        to={`/wallet/${wallet.id}`}
        className="group relative flex p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 items-stretch h-full"
      >
        <div
          {...attributes}
          {...listeners}
          className="flex flex-col justify-center mr-3 space-y-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-text-primary touch-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none rounded"
          aria-label="Drag to reorder"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </div>

        <div className="flex-1 flex flex-col justify-center min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteWallet(wallet);
            }}
            aria-label={`Delete ${wallet.name}`}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>

          <div className="flex items-center justify-between pr-8">
            {editingWalletId === wallet.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => onStartEdit(e, wallet)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStartEdit(e, wallet);
                  }
                }}
                className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-text hover:underline decoration-dashed underline-offset-4 decoration-gray-300 dark:decoration-gray-600"
                title="Click to rename"
              >
                {wallet.name}
              </div>
            )}
            {editingWalletId !== wallet.id && (
              <span className="text-gray-400 group-hover:text-blue-500 transition-colors ml-2">
                →
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tap to view transactions
          </p>
        </div>
      </Link>
    </div>
  );
}

function WalletListComponent({
  wallets,
  onDeleteWallet,
  onRenameWallet,
  onReorderWallets,
}: WalletListProps): JSX.Element {
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (editingWalletId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingWalletId]);

  const walletsWithId = useMemo(() => {
    if (!wallets) {
      return [];
    }

    return wallets.filter((wallet: Wallet) => Boolean(wallet.id));
  }, [wallets]);

  const handleStartEdit = (e: React.SyntheticEvent, wallet: Wallet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingWalletId(wallet.id!);
    setEditName(wallet.name);
  };

  const handleSaveEdit = async () => {
    if (!editingWalletId) return;

    const trimmed = editName.trim();
    if (
      trimmed &&
      trimmed !== walletsWithId.find((w) => w.id === editingWalletId)?.name
    ) {
      await onRenameWallet(editingWalletId, trimmed);
    }
    setEditingWalletId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingWalletId(null);
    setEditName('');
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (walletsWithId && over && active.id !== over.id) {
        const oldIndex = walletsWithId.findIndex((w) => w.id === active.id);
        const newIndex = walletsWithId.findIndex((w) => w.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(walletsWithId, oldIndex, newIndex);
          const sortedOrders = walletsWithId.map((w) => w.order).sort((a, b) => a - b);

          const reorderedUpdates = newItems.map((w, index) => ({
            id: w.id!,
            order: sortedOrders[index],
          }));

          (async () => {
            const result = await onReorderWallets(reorderedUpdates);
            if (!result.ok) {
              console.error('Failed to reorder wallets');
            }
          })();
        }
      }
    },
    [walletsWithId, onReorderWallets]
  );

  if (wallets === undefined) {
    return (
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-live="polite"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[92px] rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
            aria-hidden="true"
          />
        ))}
        <p className="sr-only">Loading wallets...</p>
      </div>
    );
  }

  if (walletsWithId.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-lg font-medium">No wallets yet</p>
        <p className="mt-1 text-sm">Tap + to create your first wallet</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={walletsWithId.map((w) => w.id!)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {walletsWithId.map((wallet) => (
            <SortableWalletCard
              key={wallet.id}
              wallet={wallet}
              editingWalletId={editingWalletId}
              editName={editName}
              inputRef={inputRef}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDeleteWallet={onDeleteWallet}
              setEditName={setEditName}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export const WalletList = memo(WalletListComponent);
