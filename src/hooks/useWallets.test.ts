import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Wallet } from '../types';

import { useWallets } from './useWallets';

const mockToArray = vi.fn();
const mockLast = vi.fn();
const mockAdd = vi.fn();
const mockOrderBy = vi.fn();
const mockTransaction = vi.fn();
const mockGet = vi.fn();
const mockDeleteWallet = vi.fn();
const mockUpdate = vi.fn();
const mockWhere = vi.fn();
const mockDeleteBudgetItems = vi.fn();

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}));

vi.mock('../lib/db', () => ({
  db: {
    wallets: {
      orderBy: (...args: unknown[]) => mockOrderBy(...args),
      add: (...args: unknown[]) => mockAdd(...args),
      get: (...args: unknown[]) => mockGet(...args),
      delete: (...args: unknown[]) => mockDeleteWallet(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    budgetItems: {
      where: (...args: unknown[]) => mockWhere(...args),
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

describe('useWallets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue(1);
    mockOrderBy.mockReturnValue({
      toArray: mockToArray,
      last: mockLast,
    });
    // Mock where().delete() chain
    mockWhere.mockReturnValue({
      delete: mockDeleteBudgetItems,
    });
    mockTransaction.mockImplementation(async (...args) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return await callback();
      }
      return undefined;
    });
  });

  it('reactively updates when a new wallet is added', async () => {
    const wallets: Wallet[] = [
      {
        id: 'w1',
        name: 'Bills',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    mockToArray.mockReturnValue(wallets);

    const { result } = renderHook(() => useWallets());

    expect(result.current.wallets).toEqual(wallets);
  });

  it('returns undefined when wallets are not loaded', () => {
    mockToArray.mockReturnValue(undefined);

    const { result } = renderHook(() => useWallets());

    expect(result.current.wallets).toBeUndefined();
  });

  it('returns an empty array when no wallets exist', () => {
    mockToArray.mockReturnValue([]);

    const { result } = renderHook(() => useWallets());

    expect(result.current.wallets).toEqual([]);
  });

  it('queries wallets ordered by order', () => {
    mockToArray.mockReturnValue([]);

    renderHook(() => useWallets());

    expect(mockOrderBy).toHaveBeenCalledWith('order');
    expect(mockToArray).toHaveBeenCalledTimes(1);
  });

  describe('createWallet', () => {
    it('creates a wallet with correct properties', async () => {
      mockToArray.mockReturnValue([]);
      mockLast.mockResolvedValue({ order: 1 }); // Max order is 1

      const { result } = renderHook(() => useWallets());

      const createResult = await result.current.createWallet('New Wallet');

      expect(createResult).toEqual({ ok: true });
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Wallet',
          order: 2, // 1 + 1
          id: expect.any(String),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        })
      );
    });

    it('handles first wallet creation (order 0)', async () => {
      mockToArray.mockReturnValue([]);
      mockLast.mockResolvedValue(undefined); // No existing wallets

      const { result } = renderHook(() => useWallets());

      await result.current.createWallet('First Wallet');

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 0,
        })
      );
    });

    it('rejects empty name', async () => {
      mockToArray.mockReturnValue([]);

      const { result } = renderHook(() => useWallets());

      const createResult = await result.current.createWallet('   ');

      expect(createResult).toEqual({ ok: false, error: 'empty-name' });
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('returns db-error when dexie operation fails', async () => {
      mockToArray.mockReturnValue([]);
      mockLast.mockRejectedValue(new Error('Dexie error'));

      const { result } = renderHook(() => useWallets());

      const createResult = await result.current.createWallet('Failed Wallet');

      expect(createResult).toEqual({ ok: false, error: 'db-error' });
    });
  });

  describe('deleteWallet', () => {
    it('deletes wallet and associated budget items', async () => {
      mockToArray.mockReturnValue([]);
      mockGet.mockResolvedValue({ id: 'w1' }); // Wallet exists

      const { result } = renderHook(() => useWallets());

      const deleteResult = await result.current.deleteWallet('w1');

      expect(deleteResult).toEqual({ ok: true });
      expect(mockTransaction).toHaveBeenCalledWith(
        'rw',
        expect.anything(), // db.wallets
        expect.anything(), // db.budgetItems
        expect.any(Function)
      );
      expect(mockGet).toHaveBeenCalledWith('w1');
      expect(mockWhere).toHaveBeenCalledWith({ walletId: 'w1' });
      expect(mockDeleteBudgetItems).toHaveBeenCalled();
      expect(mockDeleteWallet).toHaveBeenCalledWith('w1');
    });

    it('returns not-found error if wallet does not exist', async () => {
      mockToArray.mockReturnValue([]);
      mockGet.mockResolvedValue(undefined); // Wallet does not exist

      const { result } = renderHook(() => useWallets());

      const deleteResult = await result.current.deleteWallet('w1');

      expect(deleteResult).toEqual({ ok: false, error: 'not-found' });
      expect(mockGet).toHaveBeenCalledWith('w1');
      expect(mockDeleteWallet).not.toHaveBeenCalled();
      expect(mockDeleteBudgetItems).not.toHaveBeenCalled();
    });

    it('returns db-error when transaction fails', async () => {
      mockToArray.mockReturnValue([]);
      mockTransaction.mockRejectedValue(new Error('Transaction failed'));

      const { result } = renderHook(() => useWallets());

      const deleteResult = await result.current.deleteWallet('w1');

      expect(deleteResult).toEqual({ ok: false, error: 'db-error' });
    });
  });

  describe('renameWallet', () => {
    it('renames wallet successfully', async () => {
      mockUpdate.mockResolvedValue(1); // 1 record updated

      const { result } = renderHook(() => useWallets());
      const res = await result.current.renameWallet('w1', 'New Name');

      expect(res).toEqual({ ok: true });
      expect(mockUpdate).toHaveBeenCalledWith('w1', {
        name: 'New Name',
        updatedAt: expect.any(Number),
      });
    });

    it('rejects empty name', async () => {
      const { result } = renderHook(() => useWallets());
      const res = await result.current.renameWallet('w1', '   ');

      expect(res).toEqual({ ok: false, error: 'empty-name' });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns not-found if wallet does not exist', async () => {
      mockUpdate.mockResolvedValue(0); // 0 records updated

      const { result } = renderHook(() => useWallets());
      const res = await result.current.renameWallet('w1', 'New Name');

      expect(res).toEqual({ ok: false, error: 'not-found' });
    });

    it('returns db-error on failure', async () => {
      mockUpdate.mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useWallets());
      const res = await result.current.renameWallet('w1', 'New Name');

      expect(res).toEqual({ ok: false, error: 'db-error' });
    });
  });

  describe('reorderWallet', () => {
    it('swaps order with previous wallet (up)', async () => {
      const w1 = { id: 'w1', order: 1 };
      const w2 = { id: 'w2', order: 2 };
      mockGet.mockResolvedValue(w2); // Initial get
      mockToArray.mockResolvedValue([w1, w2]); // All wallets

      const { result } = renderHook(() => useWallets());
      const res = await result.current.reorderWallet('w2', 'up');

      expect(res).toEqual({ ok: true });
      // Expect both to be updated
      expect(mockUpdate).toHaveBeenCalledWith('w2', {
        order: 1,
        updatedAt: expect.any(Number),
      });
      expect(mockUpdate).toHaveBeenCalledWith('w1', {
        order: 2,
        updatedAt: expect.any(Number),
      });
    });

    it('swaps order with next wallet (down)', async () => {
      const w1 = { id: 'w1', order: 1 };
      const w2 = { id: 'w2', order: 2 };
      mockGet.mockResolvedValue(w1);
      mockToArray.mockResolvedValue([w1, w2]);

      const { result } = renderHook(() => useWallets());
      const res = await result.current.reorderWallet('w1', 'down');

      expect(res).toEqual({ ok: true });
      expect(mockUpdate).toHaveBeenCalledWith('w1', {
        order: 2,
        updatedAt: expect.any(Number),
      });
      expect(mockUpdate).toHaveBeenCalledWith('w2', {
        order: 1,
        updatedAt: expect.any(Number),
      });
    });

    it('returns already-at-edge if moving first up', async () => {
      const w1 = { id: 'w1', order: 1 };
      mockGet.mockResolvedValue(w1);
      mockToArray.mockResolvedValue([w1]);

      const { result } = renderHook(() => useWallets());
      const res = await result.current.reorderWallet('w1', 'up');

      expect(res).toEqual({ ok: false, error: 'already-at-edge' });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns already-at-edge if moving last down', async () => {
      const w1 = { id: 'w1', order: 1 };
      mockGet.mockResolvedValue(w1);
      mockToArray.mockResolvedValue([w1]);

      const { result } = renderHook(() => useWallets());
      const res = await result.current.reorderWallet('w1', 'down');

      expect(res).toEqual({ ok: false, error: 'already-at-edge' });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns not-found if wallet not found', async () => {
      mockGet.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallets());
      const res = await result.current.reorderWallet('w1', 'up');

      expect(res).toEqual({ ok: false, error: 'not-found' });
    });

    it('returns db-error on failure', async () => {
      mockTransaction.mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useWallets());
      const res = await result.current.reorderWallet('w1', 'up');

      expect(res).toEqual({ ok: false, error: 'db-error' });
    });
  });
});
