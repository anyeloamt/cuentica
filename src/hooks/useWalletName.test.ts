import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useWalletName } from './useWalletName';

const mockGet = vi.fn();

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}));

vi.mock('../lib/db', () => ({
  db: {
    wallets: {
      get: (...args: unknown[]) => mockGet(...args),
    },
  },
}));

describe('useWalletName', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('returns undefined when id is undefined', () => {
    const { result } = renderHook(() => useWalletName(undefined));
    expect(result.current).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('calls db.wallets.get with the provided id', () => {
    mockGet.mockReturnValue({ id: 'w1', name: 'Groceries' });
    const { result } = renderHook(() => useWalletName('w1'));
    expect(mockGet).toHaveBeenCalledWith('w1');
    expect(result.current).toBe('Groceries');
  });

  it('returns undefined when wallet is not found', () => {
    mockGet.mockReturnValue(undefined);
    const { result } = renderHook(() => useWalletName('nonexistent'));
    expect(result.current).toBeUndefined();
  });
});
