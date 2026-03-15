export interface CopiedBudgetItem {
  name: string;
  type: '+' | '-';
  amount: number;
  date?: string;
  categoryTag?: string;
}

export interface CopiedBudgetItemsPayload {
  copiedAt: number;
  sourceWalletId: string;
  items: CopiedBudgetItem[];
}

export type ParseBudgetItemsError = 'empty-input' | 'no-valid-items';

export type ParseBudgetItemsResult =
  | { ok: true; items: CopiedBudgetItem[] }
  | { ok: false; error: ParseBudgetItemsError };

export type PasteBudgetItemsResult =
  | { ok: true; insertedCount: number }
  | {
      ok: false;
      error:
        | 'no-items'
        | 'clipboard-unavailable'
        | 'clipboard-read-failed'
        | 'parse-failed'
        | 'db-error';
    };
