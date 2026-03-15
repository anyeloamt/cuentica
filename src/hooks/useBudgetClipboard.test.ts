import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

import { useBudgetClipboard } from './useBudgetClipboard';

const useBudgetClipboardContextMock = vi.fn();
const useToastMock = vi.fn();

const mockWriteText = vi.fn();

vi.mock('../context/BudgetClipboardContext', () => ({
  useBudgetClipboard: () => useBudgetClipboardContextMock(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => useToastMock(),
}));

describe('useBudgetClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const navigatorWithClipboard = Object.assign(Object.create(window.navigator), {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    vi.stubGlobal('navigator', navigatorWithClipboard);
    vi.stubGlobal('ClipboardItem', undefined);

    useBudgetClipboardContextMock.mockReturnValue({
      setCopiedBudgetItems: vi.fn(),
      getCopiedBudgetItems: vi.fn().mockReturnValue(null),
      clearCopiedBudgetItems: vi.fn(),
    });
    useToastMock.mockReturnValue({ showToast: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses writeText fallback when ClipboardItem is unavailable', async () => {
    const showToast = vi.fn();
    useToastMock.mockReturnValue({ showToast });
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useBudgetClipboard({
        walletId: 'wallet-1',
        items: [
          {
            id: 'row-1',
            walletId: 'wallet-1',
            order: 1000,
            name: 'Salary',
            type: '+',
            amount: 1200,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        appendItemsFromPaste: vi.fn(),
      })
    );

    await result.current.handleCopy();

    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      message: '1 rows copied.',
    });
  });

  it('shows error when writeText fallback fails', async () => {
    const showToast = vi.fn();
    useToastMock.mockReturnValue({ showToast });
    mockWriteText.mockRejectedValue(new Error('clipboard write failed'));

    const { result } = renderHook(() =>
      useBudgetClipboard({
        walletId: 'wallet-1',
        items: [
          {
            id: 'row-1',
            walletId: 'wallet-1',
            order: 1000,
            name: 'Salary',
            type: '+',
            amount: 1200,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        appendItemsFromPaste: vi.fn(),
      })
    );

    await result.current.handleCopy();

    expect(mockWriteText).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Unable to copy to clipboard. You can still paste in-app.',
    });
  });

  it('shows db-error toast when paste append fails', async () => {
    const showToast = vi.fn();
    const appendItemsFromPaste = vi
      .fn()
      .mockResolvedValue({ ok: false, error: 'db-error' });
    useToastMock.mockReturnValue({ showToast });
    useBudgetClipboardContextMock.mockReturnValue({
      setCopiedBudgetItems: vi.fn(),
      getCopiedBudgetItems: vi.fn().mockReturnValue({
        copiedAt: Date.now(),
        sourceWalletId: 'wallet-1',
        items: [{ name: 'Rent', type: '-', amount: 800 }],
      }),
      clearCopiedBudgetItems: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBudgetClipboard({
        walletId: 'wallet-2',
        items: [],
        appendItemsFromPaste,
      })
    );

    await result.current.handlePaste();

    expect(appendItemsFromPaste).toHaveBeenCalledWith([
      { name: 'Rent', type: '-', amount: 800 },
    ]);
    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Unable to paste rows into this wallet.',
    });
  });
});
