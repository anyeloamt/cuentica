import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Wallet } from '../types';

import { useWallets } from './useWallets';

const mockToArray = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}));

vi.mock('../lib/db', () => ({
  db: {
    wallets: {
      orderBy: (...args: unknown[]) => mockOrderBy(...args),
    },
  },
}));

describe('useWallets', () => {
  beforeEach(() => {
    mockToArray.mockReset();
    mockOrderBy.mockReset();
    mockOrderBy.mockReturnValue({
      toArray: (...args: unknown[]) => mockToArray(...args),
    });
  });

  it('queries wallets ordered by order', () => {
    mockToArray.mockReturnValue([]);

    renderHook(() => useWallets());

    expect(mockOrderBy).toHaveBeenCalledWith('order');
    expect(mockToArray).toHaveBeenCalledTimes(1);
  });

  it('returns wallets from the live query in order', () => {
    const wallets: Wallet[] = [
      {
        id: 'w1',
        name: 'Bills',
        order: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'w2',
        name: 'Groceries',
        order: 2,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    mockToArray.mockReturnValue(wallets);

    const { result } = renderHook(() => useWallets());

    expect(result.current).toEqual(wallets);
  });
});
