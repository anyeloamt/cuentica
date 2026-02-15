import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useBudgetItems } from '../../hooks/useBudgetItems';
import { useWalletName } from '../../hooks/useWalletName';
import { generatePdf } from '../../lib/pdf';
import { sharePdf } from '../../lib/share';

import { BudgetTable } from './BudgetTable';

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const walletId = id ?? '';

  const walletName = useWalletName(walletId) ?? 'Budget';
  const { items, addItems, trimEmptyRows, updateItem, deleteItem, restoreItem } =
    useBudgetItems(walletId);

  const [exporting, setExporting] = useState(false);

  const hasExportableItems =
    items !== undefined && items.some((i) => i.name.trim() !== '' || i.amount !== 0);

  const handleExport = async () => {
    if (!items || !hasExportableItems) return;
    setExporting(true);
    try {
      const blob = generatePdf(walletName, items);
      await sharePdf(blob, walletName);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end px-2 pt-1">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !hasExportableItems}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-secondary text-text-secondary transition-all hover:border-accent hover:text-accent disabled:opacity-50 cursor-pointer"
          aria-label="Export PDF"
          aria-busy={exporting}
        >
          {exporting ? (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </button>
      </div>
      <BudgetTable
        items={items}
        onAddItems={addItems}
        onTrimRows={trimEmptyRows}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onRestoreItem={restoreItem}
      />
    </div>
  );
}
