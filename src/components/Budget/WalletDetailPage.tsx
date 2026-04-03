import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useBudgetClipboard } from '../../hooks/useBudgetClipboard';
import { useBudgetItems } from '../../hooks/useBudgetItems';
import { useWalletName } from '../../hooks/useWalletName';
import { generatePdf } from '../../lib/pdf';
import { sharePdf } from '../../lib/share';

import { BudgetTable } from './BudgetTable';

const baseActionButtonClassName =
  'flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

const secondaryActionButtonClassName = `${baseActionButtonClassName} border border-border bg-bg-secondary text-text-secondary hover:border-accent hover:text-accent`;

const primaryActionButtonClassName = `${baseActionButtonClassName} bg-accent text-white hover:bg-accent/90`;

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const walletId = id ?? '';

  const walletName = useWalletName(walletId) ?? 'Budget';
  const {
    items,
    addItems,
    insertItemBelow,
    appendItemsFromPaste,
    trimEmptyRows,
    updateItem,
    deleteItem,
    restoreItem,
    reorderBudgetItems,
  } = useBudgetItems(walletId);
  const { canCopy, handleCopy, handlePaste } = useBudgetClipboard({
    walletId,
    items,
    appendItemsFromPaste,
  });

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
      <div className="flex justify-end gap-2 px-2 pt-1">
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          disabled={!canCopy}
          className={secondaryActionButtonClassName}
          aria-label="Copy items"
          title="Copy items"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625V8.625c0-.621.504-1.125 1.125-1.125H7.5m8.25 9.75h4.125c.621 0 1.125-.504 1.125-1.125V4.125A1.125 1.125 0 0 0 19.875 3H9.375C8.754 3 8.25 3.504 8.25 4.125V7.5"
            />
          </svg>
          <span>Copy</span>
        </button>
        <button
          type="button"
          onClick={() => {
            void handlePaste();
          }}
          className={secondaryActionButtonClassName}
          aria-label="Paste items"
          title="Paste items"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5.25h6m-6 3h6m-9 9h12a2.25 2.25 0 0 0 2.25-2.25V5.625A2.625 2.625 0 0 0 17.625 3H15A2.25 2.25 0 0 0 12.75.75h-1.5A2.25 2.25 0 0 0 9 3H6.375A2.625 2.625 0 0 0 3.75 5.625V15A2.25 2.25 0 0 0 6 17.25Z"
            />
          </svg>
          <span>Paste</span>
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !hasExportableItems}
          className={primaryActionButtonClassName}
          aria-label="Export PDF"
          aria-busy={exporting}
          title="Export PDF"
        >
          {exporting ? (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
          <span>Export PDF</span>
        </button>
      </div>
      <BudgetTable
        items={items}
        onAddItems={addItems}
        onTrimRows={trimEmptyRows}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onInsertBelow={insertItemBelow}
        onRestoreItem={restoreItem}
        onReorderItems={reorderBudgetItems}
      />
    </div>
  );
}
