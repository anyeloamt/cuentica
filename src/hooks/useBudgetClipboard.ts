import { useCallback } from 'react';

import { useBudgetClipboard as useBudgetClipboardContext } from '../context/BudgetClipboardContext';
import { useToast } from '../context/ToastContext';
import {
  parseItemsFromPlainText,
  serializeItemsToHtmlTable,
  serializeItemsToTsv,
} from '../lib/budgetClipboard';
import type { BudgetItem, CopiedBudgetItem, PasteBudgetItemsResult } from '../types';

interface UseBudgetClipboardParams {
  walletId: string;
  items: BudgetItem[] | undefined;
  appendItemsFromPaste: (
    itemsToAppend: CopiedBudgetItem[]
  ) => Promise<PasteBudgetItemsResult>;
}

interface UseBudgetClipboardResult {
  canCopy: boolean;
  handleCopy: () => Promise<void>;
  handlePaste: () => Promise<void>;
}

const normalizeItemsForCopy = (sourceItems: BudgetItem[]): CopiedBudgetItem[] =>
  sourceItems.map((item) => ({
    name: item.name,
    type: item.type,
    amount: item.amount,
    categoryTag: item.categoryTag,
    date: item.date,
  }));

/**
 * Encapsulates wallet budget-item copy/paste flows and user feedback.
 */
export function useBudgetClipboard({
  walletId,
  items,
  appendItemsFromPaste,
}: UseBudgetClipboardParams): UseBudgetClipboardResult {
  const { setCopiedBudgetItems, getCopiedBudgetItems } = useBudgetClipboardContext();
  const { showToast } = useToast();

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!items || items.length === 0) {
      showToast({ type: 'error', message: 'No rows available to copy.' });
      return;
    }

    const normalizedItems = normalizeItemsForCopy(items);
    setCopiedBudgetItems({ sourceWalletId: walletId, items: normalizedItems });

    const tsv = serializeItemsToTsv(normalizedItems);
    const htmlTable = serializeItemsToHtmlTable(normalizedItems);
    const plainBlob = new Blob([tsv], { type: 'text/plain' });
    const htmlBlob = new Blob([htmlTable], { type: 'text/html' });

    if (!navigator.clipboard) {
      showToast({
        type: 'info',
        message: `${normalizedItems.length} rows copied in-app. Browser clipboard is unavailable.`,
      });
      return;
    }

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'text/plain': plainBlob,
          'text/html': htmlBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else if (navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tsv);
      } else {
        showToast({
          type: 'info',
          message: `${normalizedItems.length} rows copied in-app. Browser clipboard is unavailable.`,
        });
        return;
      }

      showToast({ type: 'success', message: `${normalizedItems.length} rows copied.` });
    } catch (error) {
      console.error('Failed to copy budget items to clipboard:', error);

      if (navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(tsv);
          showToast({
            type: 'success',
            message: `${normalizedItems.length} rows copied (text fallback).`,
          });
          return;
        } catch (fallbackError) {
          console.error(
            'Failed to copy budget items with writeText fallback:',
            fallbackError
          );
        }
      }

      showToast({
        type: 'error',
        message: 'Unable to copy to clipboard. You can still paste in-app.',
      });
    }
  }, [items, setCopiedBudgetItems, showToast, walletId]);

  const handlePaste = useCallback(async (): Promise<void> => {
    const inAppPayload = getCopiedBudgetItems();

    if (inAppPayload && inAppPayload.items.length > 0) {
      const result = await appendItemsFromPaste(inAppPayload.items);
      if (result.ok) {
        showToast({ type: 'success', message: `${result.insertedCount} rows pasted.` });
      } else {
        showToast({ type: 'error', message: 'Unable to paste rows into this wallet.' });
      }
      return;
    }

    if (!navigator.clipboard || !navigator.clipboard.readText) {
      showToast({
        type: 'error',
        message: 'Clipboard read is not supported in this browser.',
      });
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsed = parseItemsFromPlainText(clipboardText);

      if (!parsed.ok) {
        showToast({
          type: 'error',
          message: 'Clipboard content has no valid budget rows.',
        });
        return;
      }

      const result = await appendItemsFromPaste(parsed.items);
      if (result.ok) {
        showToast({ type: 'success', message: `${result.insertedCount} rows pasted.` });
      } else {
        showToast({ type: 'error', message: 'Unable to paste rows into this wallet.' });
      }
    } catch (error) {
      console.error('Failed to paste budget items from clipboard:', error);
      showToast({
        type: 'error',
        message: 'Unable to read clipboard. Try copy first and then paste.',
      });
    }
  }, [appendItemsFromPaste, getCopiedBudgetItems, showToast]);

  return {
    canCopy: !!items && items.length > 0,
    handleCopy,
    handlePaste,
  };
}
