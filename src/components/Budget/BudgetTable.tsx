import { useState, useEffect, useMemo, useCallback } from 'react';

import type { BudgetItem } from '../../types';
import { formatAmount } from '../../lib/format';

import { BudgetRow } from './BudgetRow';

type AddItemsResult = { ok: true; ids: string[] } | { ok: false; error: string };
type TrimResult = { ok: true; count: number } | { ok: false; error: string };

interface BudgetTableProps {
  items: BudgetItem[] | undefined;
  onAddItems: () => Promise<AddItemsResult>;
  onTrimRows: () => Promise<TrimResult>;
  onUpdateItem: (id: string, changes: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => Promise<{ ok: boolean }>;
  onRestoreItem?: (item: BudgetItem) => Promise<{ ok: boolean }>;
}

export function BudgetTable({
  items,
  onAddItems,
  onTrimRows,
  onUpdateItem,
  onDeleteItem,
  onRestoreItem,
}: BudgetTableProps) {
  const [deletedItems, setDeletedItems] = useState<BudgetItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (deletedItems.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setDeletedItems([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, [deletedItems]);

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
    return <div className="p-4 text-center text-text-secondary">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
      <div className="flex-grow overflow-auto pb-20 px-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
            <p>No items yet.</p>
            <p>Tap &quot;Add item&quot; to start.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              <div className="w-6 text-center flex-shrink-0">#</div>
              <div className="flex-grow pl-2">Name</div>
              <div className="w-8 text-center">Type</div>
              <div className="w-20 sm:w-24 text-right">Amount</div>
              <div className="w-8"></div>
            </div>
            {items.map((item, index) => (
              <BudgetRow
                key={item.id}
                item={item}
                rowNumber={index + 1}
                onUpdate={onUpdateItem}
                onDelete={handleDeleteWithUndo}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={item.id === lastAddedId}
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleAddItems}
            className="flex-grow flex items-center justify-center py-2 border-2 border-dashed border-border rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
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
            + Add rows
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
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-3 rounded-lg shadow-lg z-20 flex items-center gap-4 transition-opacity duration-300"
        >
          <span>
            {deletedItems.length === 1
              ? 'Item deleted'
              : `${deletedItems.length} items deleted`}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-semibold text-accent hover:text-blue-300"
          >
            Undo
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-border p-3 shadow-lg z-10 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-sm sm:text-base font-bold">
          <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-4">
            <span className="text-green-600 dark:text-green-400">
              +{formatAmount(income)}
            </span>
            <span className="text-red-600 dark:text-red-400">
              -{formatAmount(expenses)}
            </span>
          </div>

          <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-border pt-2 sm:pt-0">
            <span className="text-text-secondary">Total</span>
            <span
              className={
                balance >= 0 ? 'text-text-primary' : 'text-red-600 dark:text-red-400'
              }
            >
              {balance >= 0 ? '+' : '-'}
              {formatAmount(Math.abs(balance))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
