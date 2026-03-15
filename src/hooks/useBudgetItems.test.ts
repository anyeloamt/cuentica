import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetItems } from './useBudgetItems';

const mockSortBy = vi.fn();
const mockReverse = vi.fn();
const mockEquals = vi.fn();
const mockWhere = vi.fn();
const mockAdd = vi.fn();
const mockBulkAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockGet = vi.fn();
const mockTransaction = vi.fn();

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}));

vi.mock('../lib/db', () => ({
  db: {
    transaction: (...args: unknown[]) => mockTransaction(...args),
    budgetItems: {
      where: (...args: unknown[]) => mockWhere(...args),
      add: (...args: unknown[]) => mockAdd(...args),
      bulkAdd: (...args: unknown[]) => mockBulkAdd(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      get: (...args: unknown[]) => mockGet(...args),
    },
  },
}));

describe('useBudgetItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockTransaction.mockImplementation(
      async (_mode: string, _table: unknown, callback: () => Promise<void>) => callback()
    );

    mockWhere.mockReturnValue({
      equals: mockEquals,
    });

    mockEquals.mockReturnValue({
      filter: () => ({
        sortBy: mockSortBy,
        reverse: () => ({
          sortBy: mockSortBy,
        }),
      }),
      sortBy: mockSortBy,
      reverse: mockReverse,
    });

    mockReverse.mockReturnValue({
      sortBy: mockSortBy,
    });
  });

  it('queries budget items for the given wallet', () => {
    const walletId = 'w1';
    mockSortBy.mockReturnValue([]);

    renderHook(() => useBudgetItems(walletId));

    expect(mockWhere).toHaveBeenCalledWith('walletId');
    expect(mockEquals).toHaveBeenCalledWith(walletId);
    expect(mockSortBy).toHaveBeenCalledWith('order');
  });

  describe('addItem', () => {
    it('adds a new item with correct order', async () => {
      const walletId = 'w1';
      mockSortBy.mockResolvedValue([{ order: 10 }]); // Last item has order 10
      mockAdd.mockResolvedValue('new-id-123');

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.addItem();

      expect(res).toEqual({ ok: true, id: expect.any(String) });
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId,
          order: 1010, // 10 + 1000
          name: '',
          type: '-',
          amount: 0,
        })
      );
    });

    it('handles first item creation (order 1000)', async () => {
      const walletId = 'w1';
      mockSortBy.mockResolvedValue([]); // No existing items
      mockAdd.mockResolvedValue('new-id-123');

      const { result } = renderHook(() => useBudgetItems(walletId));
      await result.current.addItem();

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 1000,
        })
      );
    });

    it('returns db-error on failure', async () => {
      const walletId = 'w1';
      mockSortBy.mockResolvedValue([]);
      mockAdd.mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.addItem();

      expect(res).toEqual({ ok: false, error: 'db-error' });
    });
  });

  describe('updateItem', () => {
    it('updates item successfully', async () => {
      const walletId = 'w1';
      mockUpdate.mockResolvedValue(1); // 1 record updated

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.updateItem('i1', { name: 'Rent' });

      expect(res).toEqual({ ok: true });
      expect(mockUpdate).toHaveBeenCalledWith('i1', {
        name: 'Rent',
        updatedAt: expect.any(Number),
        syncStatus: 'pending',
      });
    });

    it('returns not-found if item does not exist', async () => {
      const walletId = 'w1';
      mockUpdate.mockResolvedValue(0);

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.updateItem('i1', { name: 'Rent' });

      expect(res).toEqual({ ok: false, error: 'not-found' });
    });

    it('returns db-error on failure', async () => {
      const walletId = 'w1';
      mockUpdate.mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.updateItem('i1', { name: 'Rent' });

      expect(res).toEqual({ ok: false, error: 'db-error' });
    });
  });

  describe('appendItemsFromPaste', () => {
    it('appends pasted items preserving values and 1000 spacing', async () => {
      const walletId = 'w1';
      mockSortBy.mockResolvedValue([{ order: 3000 }]);
      mockBulkAdd.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBudgetItems(walletId));
      const appendResult = await result.current.appendItemsFromPaste([
        {
          name: 'Salary',
          type: '+',
          amount: 1500,
          categoryTag: 'Income',
          date: '2026-03-15',
        },
        {
          name: 'Rent',
          type: '-',
          amount: 700,
        },
      ]);

      expect(appendResult).toEqual({ ok: true, insertedCount: 2 });
      expect(mockBulkAdd).toHaveBeenCalledWith([
        expect.objectContaining({
          walletId,
          order: 4000,
          name: 'Salary',
          type: '+',
          amount: 1500,
          categoryTag: 'Income',
          date: '2026-03-15',
          syncStatus: 'pending',
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
          id: expect.any(String),
        }),
        expect.objectContaining({
          walletId,
          order: 5000,
          name: 'Rent',
          type: '-',
          amount: 700,
          syncStatus: 'pending',
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
          id: expect.any(String),
        }),
      ]);
    });

    it('returns no-items when the pasted payload is empty', async () => {
      const { result } = renderHook(() => useBudgetItems('wallet-id'));

      const appendResult = await result.current.appendItemsFromPaste([]);

      expect(appendResult).toEqual({ ok: false, error: 'no-items' });
      expect(mockBulkAdd).not.toHaveBeenCalled();
    });
  });

  describe('insertItemBelow', () => {
    it('inserts between two rows using midpoint order', async () => {
      const walletId = 'w1';
      mockGet.mockResolvedValue({
        id: 'i1',
        walletId,
        order: 1000,
        deleted: false,
      });
      mockSortBy.mockResolvedValue([{ id: 'i2', walletId, order: 3000, deleted: false }]);
      mockAdd.mockResolvedValue('new-id-123');

      const { result } = renderHook(() => useBudgetItems(walletId));
      const insertResult = await result.current.insertItemBelow('i1');

      expect(insertResult).toEqual({ ok: true, id: expect.any(String) });
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId,
          order: 2000,
          name: '',
          type: '-',
          amount: 0,
          syncStatus: 'pending',
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
          id: expect.any(String),
        })
      );
    });

    it('inserts after last row with +1000 order spacing', async () => {
      const walletId = 'w1';
      mockGet.mockResolvedValue({
        id: 'i2',
        walletId,
        order: 5000,
        deleted: false,
      });
      mockSortBy.mockResolvedValue([]);
      mockAdd.mockResolvedValue('new-id-456');

      const { result } = renderHook(() => useBudgetItems(walletId));
      const insertResult = await result.current.insertItemBelow('i2');

      expect(insertResult).toEqual({ ok: true, id: expect.any(String) });
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId,
          order: 6000,
          name: '',
          type: '-',
          amount: 0,
        })
      );
    });

    it('returns not-found for non-existent item id', async () => {
      const { result } = renderHook(() => useBudgetItems('w1'));
      mockGet.mockResolvedValue(undefined);

      const insertResult = await result.current.insertItemBelow('missing-id');

      expect(insertResult).toEqual({ ok: false, error: 'not-found' });
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('returns not-found for item from another wallet', async () => {
      mockGet.mockResolvedValue({
        id: 'i1',
        walletId: 'other-wallet',
        order: 1000,
        deleted: false,
      });

      const { result } = renderHook(() => useBudgetItems('w1'));
      const insertResult = await result.current.insertItemBelow('i1');

      expect(insertResult).toEqual({ ok: false, error: 'not-found' });
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('returns not-found when source item is deleted', async () => {
      mockGet.mockResolvedValue({
        id: 'i1',
        walletId: 'w1',
        order: 1000,
        deleted: true,
      });

      const { result } = renderHook(() => useBudgetItems('w1'));
      const insertResult = await result.current.insertItemBelow('i1');

      expect(insertResult).toEqual({ ok: false, error: 'not-found' });
      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('soft-deletes item successfully', async () => {
      const walletId = 'w1';
      mockGet.mockResolvedValue({ id: 'i1', name: 'Rent' });
      mockUpdate.mockResolvedValue(1);

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.deleteItem('i1');

      expect(res).toEqual({ ok: true });
      expect(mockGet).toHaveBeenCalledWith('i1');
      expect(mockUpdate).toHaveBeenCalledWith('i1', {
        deleted: true,
        syncStatus: 'pending',
        updatedAt: expect.any(Number),
      });
    });

    it('returns not-found if item does not exist', async () => {
      const walletId = 'w1';
      mockGet.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.deleteItem('i1');

      expect(res).toEqual({ ok: false, error: 'not-found' });
    });

    it('returns db-error on failure', async () => {
      const walletId = 'w1';
      mockGet.mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.deleteItem('i1');

      expect(res).toEqual({ ok: false, error: 'db-error' });
    });
  });
});
