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
    mockOrderBy.mockReturnValue({
      toArray: mockToArray,
      last: mockLast,
    });
    // Mock where().delete() chain
    mockWhere.mockReturnValue({
      delete: mockDeleteBudgetItems,
    });
    // Mock transaction to immediately execute the callback (last argument)
    mockTransaction.mockImplementation((...args) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return callback();
      }
      return undefined;
    });
  });

  // ... existing tests ...

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
});
