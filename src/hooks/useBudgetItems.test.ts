import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetItems } from './useBudgetItems';

const mockSortBy = vi.fn();
const mockReverse = vi.fn();
const mockEquals = vi.fn();
const mockWhere = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockGet = vi.fn();

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}));

vi.mock('../lib/db', () => ({
  db: {
    budgetItems: {
      where: (...args: unknown[]) => mockWhere(...args),
      add: (...args: unknown[]) => mockAdd(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      get: (...args: unknown[]) => mockGet(...args),
    },
  },
}));

describe('useBudgetItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockWhere.mockReturnValue({
      equals: mockEquals,
    });

    mockEquals.mockReturnValue({
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

  describe('deleteItem', () => {
    it('deletes item successfully', async () => {
      const walletId = 'w1';
      mockGet.mockResolvedValue({ id: 'i1', name: 'Rent' });
      mockDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.deleteItem('i1');

      expect(res).toEqual({ ok: true });
      expect(mockGet).toHaveBeenCalledWith('i1');
      expect(mockDelete).toHaveBeenCalledWith('i1');
    });

    it('returns not-found if item does not exist', async () => {
      const walletId = 'w1';
      mockGet.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBudgetItems(walletId));
      const res = await result.current.deleteItem('i1');

      expect(res).toEqual({ ok: false, error: 'not-found' });
      expect(mockDelete).not.toHaveBeenCalled();
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
