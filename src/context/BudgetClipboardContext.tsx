import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { CopiedBudgetItem, CopiedBudgetItemsPayload } from '../types';

interface SetCopiedBudgetItemsInput {
  sourceWalletId: string;
  items: CopiedBudgetItem[];
}

interface BudgetClipboardContextType {
  setCopiedBudgetItems: (input: SetCopiedBudgetItemsInput) => void;
  getCopiedBudgetItems: () => CopiedBudgetItemsPayload | null;
  clearCopiedBudgetItems: () => void;
}

const BudgetClipboardContext = createContext<BudgetClipboardContextType | undefined>(
  undefined
);

export function BudgetClipboardProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [payload, setPayload] = useState<CopiedBudgetItemsPayload | null>(null);

  const setCopiedBudgetItems = useCallback((input: SetCopiedBudgetItemsInput): void => {
    setPayload({
      copiedAt: Date.now(),
      sourceWalletId: input.sourceWalletId,
      items: input.items,
    });
  }, []);

  const getCopiedBudgetItems = useCallback(
    (): CopiedBudgetItemsPayload | null => payload,
    [payload]
  );

  const clearCopiedBudgetItems = useCallback((): void => {
    setPayload(null);
  }, []);

  const value = useMemo(
    () => ({
      setCopiedBudgetItems,
      getCopiedBudgetItems,
      clearCopiedBudgetItems,
    }),
    [setCopiedBudgetItems, getCopiedBudgetItems, clearCopiedBudgetItems]
  );

  return (
    <BudgetClipboardContext.Provider value={value}>
      {children}
    </BudgetClipboardContext.Provider>
  );
}

export function useBudgetClipboard(): BudgetClipboardContextType {
  const context = useContext(BudgetClipboardContext);

  if (context === undefined) {
    throw new Error('useBudgetClipboard must be used within a BudgetClipboardProvider');
  }

  return context;
}
