import { describe, expect, it } from 'vitest';

import {
  toLocalAmountFromCents,
  toLocalAmountDuringTransition,
  toLocalBudgetItem,
  toSupabaseAmountCents,
  toSupabaseBudgetItem,
  type SupabaseBudgetItemRow,
} from './migration';

describe('migration amount conversion', () => {
  const createLocalBudgetItem = (amount: number) => ({
    id: 'item-1',
    walletId: 'wallet-1',
    order: 1,
    name: 'Salary',
    type: '+' as const,
    amount,
    createdAt: 1,
    updatedAt: 2,
    syncStatus: 'pending' as const,
    deleted: false,
  });

  const createSupabaseBudgetItem = (
    amount: number | string,
    id = 'item-1'
  ): SupabaseBudgetItemRow => ({
    id,
    user_id: 'user-1',
    wallet_id: 'wallet-1',
    order: 1,
    name: 'Salary',
    type: '+',
    amount,
    date: null,
    category_tag: null,
    created_at: 1,
    updated_at: 2,
    sync_status: 'synced',
    deleted: false,
  });

  it('round-trips decimal amounts through Supabase cents', () => {
    const localBudgetItem = createLocalBudgetItem(4812.5);

    const supabaseBudgetItem = toSupabaseBudgetItem(localBudgetItem, 'user-1');
    const restoredBudgetItem = toLocalBudgetItem(supabaseBudgetItem);

    expect(supabaseBudgetItem.amount).toBe(481250);
    expect(restoredBudgetItem.amount).toBe(4812.5);
  });

  it.each([
    { local: 0, remote: 0 },
    { local: 0.01, remote: 1 },
    { local: 999999.99, remote: 99999999 },
    { local: -12.34, remote: -1234 },
  ])('converts edge case amount $local to cents and back', ({ local, remote }) => {
    expect(toSupabaseAmountCents(local)).toBe(remote);
    expect(toLocalAmountFromCents(remote)).toBe(local);
  });

  it('parses string remote amounts as cents', () => {
    const restoredBudgetItem = toLocalBudgetItem(createSupabaseBudgetItem('481250'));

    expect(restoredBudgetItem.amount).toBe(4812.5);
  });

  it('preserves legacy decimal string amounts during the migration window', () => {
    const restoredBudgetItem = toLocalBudgetItem(createSupabaseBudgetItem('4812.50'));

    expect(restoredBudgetItem.amount).toBe(4812.5);
  });

  it('detects legacy large remote amounts and keeps them as-is', () => {
    expect(toLocalAmountDuringTransition(1000001)).toBe(1000001);
    expect(toLocalBudgetItem(createSupabaseBudgetItem(1000001)).amount).toBe(1000001);
  });

  it('rejects invalid local amount values', () => {
    expect(() => toSupabaseAmountCents(Number.NaN)).toThrow('Invalid local amount value');
    expect(() => toSupabaseAmountCents(Number.POSITIVE_INFINITY)).toThrow(
      'Invalid local amount value'
    );
  });

  it('rejects invalid remote amount values', () => {
    expect(() => toLocalAmountFromCents(Number.NaN)).toThrow('Invalid remote amount value');
    expect(() => toLocalAmountFromCents(Number.POSITIVE_INFINITY)).toThrow(
      'Invalid remote amount value'
    );
    expect(() => toLocalBudgetItem(createSupabaseBudgetItem('abc', 'item-invalid'))).toThrow(
      'Invalid amount value for budget item item-invalid'
    );
  });
});
