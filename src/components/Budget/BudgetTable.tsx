import { useState, useEffect } from 'react';

import type { BudgetItem } from '../../types';

import { BudgetRow } from './BudgetRow';

interface BudgetTableProps {
  items: BudgetItem[] | undefined;
  onAddItem: () => Promise<string | undefined>;
  onUpdateItem: (id: string, changes: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => Promise<{ ok: boolean }>;
  onRestoreItem?: (item: BudgetItem) => Promise<{ ok: boolean }>;
}

export function BudgetTable({
  items,
  onAddItem,
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

  const handleAddItem = async () => {
    const id = await onAddItem();
    if (id) {
      setLastAddedId(id);
    }
  };

  const handleDeleteWithUndo = async (id: string) => {
    const item = items?.find((i) => i.id === id);
    if (!item) {
      return;
    }

    const result = await onDeleteItem(id);
    if (result.ok) {
      setDeletedItems((prev) => [...prev, item]);
    }
  };

  const handleUndo = async () => {
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
  };

  if (items === undefined) {
    return <div className="p-4 text-center text-text-secondary">Loading...</div>;
  }

  const total = items.reduce((acc, item) => {
    return acc + (item.type === '+' ? item.amount : -item.amount);
  }, 0);

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
      <div className="flex-grow overflow-auto pb-24 px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <p>No items yet.</p>
            <p>Tap &quot;Add item&quot; to start.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex px-2 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              <div className="flex-grow pl-2">Name</div>
              <div className="w-8 text-center">Type</div>
              <div className="w-20 sm:w-24 text-right">Amount</div>
              <div className="w-9"></div>
            </div>
            {items.map((item) => (
              <BudgetRow
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={handleDeleteWithUndo}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={item.id === lastAddedId}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddItem}
          className="mt-6 flex items-center justify-center w-full py-3 border-2 border-dashed border-border rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add item
        </button>
      </div>

      {deletedItems.length > 0 && (
        <div
          role="status"
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

      <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-border p-4 shadow-lg z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center text-xl font-bold">
          <span className="text-text-secondary">Total</span>
          <span
            className={
              total >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {total >= 0 ? '+' : '-'}${Math.abs(total).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
