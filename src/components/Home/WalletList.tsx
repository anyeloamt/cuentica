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

import { useHint } from '../../hooks/useHint';
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
        className="group relative flex p-3 bg-bg-primary rounded-xl shadow-sm border border-border hover:shadow-md hover:border-accent/40 transition-all duration-200 items-stretch h-full"
      >
        <div
          {...attributes}
          {...listeners}
          className="flex flex-col justify-center mr-3 space-y-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary touch-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none rounded"
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
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
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
            className="absolute top-2 right-2 p-2 text-text-muted hover:text-error hover:bg-bg-hover rounded-full transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 z-10"
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
                className="w-full text-lg font-semibold text-text-primary bg-transparent border-b-2 border-accent focus:outline-none"
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
                className="text-lg font-semibold text-text-primary truncate group-hover:text-accent transition-colors hover:underline decoration-dashed underline-offset-4 decoration-border flex items-center"
                title="Tap to rename"
              >
                {wallet.name}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-3.5 w-3.5 flex-shrink-0 ml-1.5 text-text-muted"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </div>
            )}
            {editingWalletId !== wallet.id && (
              <span className="text-text-muted group-hover:text-accent transition-colors ml-2">
                →
              </span>
            )}
          </div>
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
  const { visible: renameHintVisible, dismiss: dismissRenameHint } =
    useHint('rename-wallet');
  const { visible: reorderHintVisible, dismiss: dismissReorderHint } =
    useHint('reorder-wallets');

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
            className="h-[92px] rounded-xl border border-border bg-bg-primary"
            aria-hidden="true"
          />
        ))}
        <p className="sr-only">Loading wallets...</p>
      </div>
    );
  }

  if (walletsWithId.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary bg-bg-secondary rounded-2xl border-2 border-dashed border-border gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-12 w-12 text-text-muted"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
          />
        </svg>
        <div>
          <p className="text-lg font-semibold text-text-primary mb-1">
            Ready to start budgeting?
          </p>
          <p>Create your first wallet with the + button below</p>
        </div>
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
      {walletsWithId.length >= 1 && renameHintVisible && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 text-xs text-accent bg-accent/5 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
          <p className="flex-1">Tap the pencil icon on any wallet to rename it</p>
          <button
            type="button"
            onClick={dismissRenameHint}
            className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Dismiss tip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {walletsWithId.length >= 2 && reorderHintVisible && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 text-xs text-accent bg-accent/5 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
          <p className="flex-1">Drag the grip dots to reorder your wallets</p>
          <button
            type="button"
            onClick={dismissReorderHint}
            className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Dismiss tip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
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
