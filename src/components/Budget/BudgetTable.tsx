import { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { useHint } from '../../hooks/useHint';
import { useToast } from '../../context/ToastContext';
import type { BudgetItem } from '../../types';
import { formatAmount } from '../../lib/format';

import { BudgetRow } from './BudgetRow';

type AddItemsResult = { ok: true; ids: string[] } | { ok: false; error: string };
type TrimResult = { ok: true; count: number } | { ok: false; error: string };
type InsertBelowResult = { ok: true; id: string } | { ok: false; error: string };

interface BudgetTableProps {
  items: BudgetItem[] | undefined;
  onAddItems: () => Promise<AddItemsResult>;
  onTrimRows: () => Promise<TrimResult>;
  onUpdateItem: (id: string, changes: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => Promise<{ ok: boolean }>;
  onInsertBelow: (id: string) => Promise<InsertBelowResult>;
  onRestoreItem?: (item: BudgetItem) => Promise<{ ok: boolean }>;
  onReorderItems: (updates: { id: string; order: number }[]) => Promise<{ ok: boolean }>;
}

export function BudgetTable({
  items,
  onAddItems,
  onTrimRows,
  onUpdateItem,
  onDeleteItem,
  onInsertBelow,
  onRestoreItem,
  onReorderItems,
}: BudgetTableProps) {
  const [deletedItems, setDeletedItems] = useState<BudgetItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { visible: typeHintVisible, dismiss: dismissTypeHint } = useHint('type-toggle');

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
    if (deletedItems.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setDeletedItems([]);
    }, 8000);

    return () => clearTimeout(timer);
  }, [deletedItems]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (items && over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          const sortedOrders = items.map((i) => i.order).sort((a, b) => a - b);

          const reorderedUpdates = newItems.map((item, index) => ({
            id: item.id!,
            order: sortedOrders[index],
          }));

          (async () => {
            const result = await onReorderItems(reorderedUpdates);
            if (!result.ok) {
              console.error('Failed to reorder items');
            }
          })();
        }
      }
    },
    [items, onReorderItems]
  );

  const handleAddItems = useCallback(async () => {
    const result = await onAddItems();
    if (result.ok && result.ids && result.ids.length > 0) {
      setLastAddedId(result.ids[0]);
    }
  }, [onAddItems]);

  const handleTrimRows = useCallback(async () => {
    await onTrimRows();
  }, [onTrimRows]);

  const handleDeleteWithUndo = useCallback(
    async (id: string) => {
      const item = items?.find((i) => i.id === id);
      if (!item) {
        return;
      }

      const result = await onDeleteItem(id);
      if (result.ok) {
        setDeletedItems((prev) => [...prev, item]);
      }
    },
    [items, onDeleteItem]
  );

  const handleInsertBelow = useCallback(
    async (id: string) => {
      const result = await onInsertBelow(id);
      if (result.ok) {
        setLastAddedId(result.id);
        return;
      }

      showToast({ type: 'error', message: 'Failed to insert row' });
    },
    [onInsertBelow, showToast]
  );

  const handleUndo = useCallback(async () => {
    if (deletedItems.length === 0 || !onRestoreItem) {
      return;
    }

    const restoreResults = await Promise.all(
      deletedItems.map(async (item) => ({
        item,
        result: await onRestoreItem(item),
      }))
    );

    const failedItems = restoreResults
      .filter(({ result }) => !result.ok)
      .map(({ item }) => item);

    if (failedItems.length === 0) {
      setDeletedItems([]);
      return;
    }

    setDeletedItems(failedItems);
  }, [deletedItems, onRestoreItem]);

  const { income, expenses, balance } = useMemo(() => {
    if (items === undefined) {
      return { income: 0, expenses: 0, balance: 0 };
    }

    return items.reduce(
      (acc, item) => {
        if (item.type === '+') {
          acc.income += item.amount;
        } else {
          acc.expenses += item.amount;
        }
        acc.balance = acc.income - acc.expenses;
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 }
    );
  }, [items]);

  if (items === undefined) {
    return (
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
        <div className="flex-grow overflow-auto pb-20 px-2">
          <div className="flex flex-col">
            <div className="flex px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              <div className="w-8"></div>
              <div className="w-6 text-center flex-shrink-0">#</div>
              <div className="flex-grow pl-2">Name</div>
              <div className="w-8 text-center">Type</div>
              <div className="w-20 sm:w-24 text-right">Amount</div>
              <div className="w-16"></div>
            </div>
            <div className="animate-pulse flex flex-col mt-2">
              <p className="sr-only">Loading budget items...</p>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center px-2 py-3 border-b border-border"
                >
                  <div className="w-8"></div>
                  <div className="w-6"></div>
                  <div className="flex-grow pl-2">
                    <div className="h-5 bg-bg-secondary rounded w-3/4"></div>
                  </div>
                  <div className="w-8 px-1">
                    <div className="h-5 bg-bg-secondary rounded w-full"></div>
                  </div>
                  <div className="w-20 sm:w-24 pl-2">
                    <div className="h-5 bg-bg-secondary rounded w-full"></div>
                  </div>
                  <div className="w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
      <div className="flex-grow overflow-auto pb-20 px-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary bg-bg-secondary rounded-2xl border-2 border-dashed border-border mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-12 w-12 text-text-muted mb-3"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <p className="text-lg font-semibold text-text-primary mb-1">
              Your budget starts here
            </p>
            <p>Add your first item to start tracking</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              <div className="w-8"></div>
              <div className="w-6 text-center flex-shrink-0">#</div>
              <div className="flex-grow pl-2">Name</div>
              <div className="w-8 text-center">Type</div>
              <div className="w-20 sm:w-24 text-right">Amount</div>
              <div className="w-16"></div>
            </div>
            {items.length > 0 && typeHintVisible && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2 mt-2 text-xs text-accent bg-accent/5 rounded-lg mx-2">
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
                <p className="flex-1">
                  Tap the colored +/- circle to switch between income and expense
                </p>
                <button
                  type="button"
                  onClick={dismissTypeHint}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={items.map((item) => item.id!)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item, index) => (
                  <BudgetRow
                    key={item.id}
                    item={item}
                    rowNumber={index + 1}
                    onUpdate={onUpdateItem}
                    onDelete={handleDeleteWithUndo}
                    onInsertBelow={(id) => {
                      void handleInsertBelow(id);
                    }}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={item.id === lastAddedId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleAddItems}
            className="flex-grow flex items-center justify-center py-2 border-2 border-dashed border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add rows
          </button>

          {items.length > 0 &&
            items[items.length - 1].name.trim() === '' &&
            items[items.length - 1].amount === 0 && (
              <button
                type="button"
                onClick={handleTrimRows}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors border border-border rounded-lg"
                title="Remove empty rows from bottom"
              >
                Trim
              </button>
            )}
        </div>
      </div>

      {deletedItems.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-bg-inverse text-text-inverse px-4 py-3 rounded-lg shadow-lg z-20 flex items-center gap-4 transition-opacity duration-300"
        >
          <span>
            {deletedItems.length === 1
              ? 'Item deleted'
              : `${deletedItems.length} items deleted`}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-semibold text-accent hover:text-accent/70"
          >
            Undo
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-border p-3 shadow-lg z-10 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-sm sm:text-base font-bold">
          <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-4">
            <span className="text-success">+{formatAmount(income)}</span>
            <span className="text-error">-{formatAmount(expenses)}</span>
          </div>

          <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-border pt-2 sm:pt-0">
            <span className="text-text-secondary">Total</span>
            <span className={balance >= 0 ? 'text-text-primary' : 'text-error'}>
              {balance >= 0 ? '+' : '-'}
              {formatAmount(Math.abs(balance))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
