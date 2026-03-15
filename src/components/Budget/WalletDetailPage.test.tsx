import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { WalletDetailPage } from './WalletDetailPage';

const useBudgetItemsMock = vi.fn();
const useBudgetClipboardMock = vi.fn();
const useToastMock = vi.fn();

const mockWrite = vi.fn();
const mockWriteText = vi.fn();
const mockReadText = vi.fn();

const createBudgetItemsHookValue = () => ({
  items: [
    {
      id: 'i1',
      walletId: 'abc123',
      order: 1000,
      name: 'Salary',
      type: '+',
      amount: 1200,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  addItems: vi.fn().mockResolvedValue({ ok: true, ids: ['row-1'] }),
  appendItemsFromPaste: vi.fn().mockResolvedValue({ ok: true, insertedCount: 1 }),
  trimEmptyRows: vi.fn().mockResolvedValue({ ok: true, count: 0 }),
  updateItem: vi.fn(),
  deleteItem: vi.fn().mockResolvedValue({ ok: true }),
  restoreItem: vi.fn().mockResolvedValue({ ok: true }),
  reorderBudgetItems: vi.fn().mockResolvedValue({ ok: true }),
});

vi.mock('../../hooks/useBudgetItems', () => ({
  useBudgetItems: (...args: unknown[]) => useBudgetItemsMock(...args),
}));

vi.mock('../../hooks/useWalletName', () => ({
  useWalletName: () => 'Budget',
}));

vi.mock('../../context/BudgetClipboardContext', () => ({
  useBudgetClipboard: () => useBudgetClipboardMock(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => useToastMock(),
}));

function renderWalletPage(): void {
  render(
    <MemoryRouter initialEntries={['/wallet/abc123']}>
      <Routes>
        <Route path="/wallet/:id" element={<WalletDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('WalletDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal(
      'ClipboardItem',
      class ClipboardItem {
        constructor(data: Record<string, Blob>) {
          void data;
        }
      }
    );

    const navigatorWithClipboard = Object.assign(Object.create(window.navigator), {
      clipboard: {
        write: mockWrite,
        writeText: mockWriteText,
        readText: mockReadText,
      },
    });

    vi.stubGlobal('navigator', navigatorWithClipboard);

    useBudgetItemsMock.mockReturnValue(createBudgetItemsHookValue());

    useBudgetClipboardMock.mockReturnValue({
      setCopiedBudgetItems: vi.fn(),
      getCopiedBudgetItems: vi.fn().mockReturnValue(null),
      clearCopiedBudgetItems: vi.fn(),
    });

    useToastMock.mockReturnValue({
      showToast: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('copies current wallet rows and shows success toast', async () => {
    const user = userEvent.setup();
    const setCopiedBudgetItems = vi.fn();
    const showToast = vi.fn();
    useBudgetClipboardMock.mockReturnValue({
      setCopiedBudgetItems,
      getCopiedBudgetItems: vi.fn().mockReturnValue(null),
      clearCopiedBudgetItems: vi.fn(),
    });
    useToastMock.mockReturnValue({ showToast });

    renderWalletPage();

    await user.click(screen.getByRole('button', { name: /copy items/i }));

    expect(setCopiedBudgetItems).toHaveBeenCalledWith({
      sourceWalletId: 'abc123',
      items: [
        {
          name: 'Salary',
          type: '+',
          amount: 1200,
          categoryTag: undefined,
          date: undefined,
        },
      ],
    });
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('1 rows copied'),
        })
      );
    });
  });

  it('pastes from in-app clipboard before reading browser clipboard', async () => {
    const user = userEvent.setup();
    const appendItemsFromPaste = vi
      .fn()
      .mockResolvedValue({ ok: true as const, insertedCount: 2 });
    const getCopiedBudgetItems = vi.fn().mockReturnValue({
      copiedAt: Date.now(),
      sourceWalletId: 'source-wallet',
      items: [
        { name: 'Groceries', type: '-', amount: 55 },
        { name: 'Salary', type: '+', amount: 1500 },
      ],
    });
    const showToast = vi.fn();
    const budgetItemsValue = createBudgetItemsHookValue();

    useBudgetItemsMock.mockReturnValue({
      ...budgetItemsValue,
      appendItemsFromPaste,
    });
    useBudgetClipboardMock.mockReturnValue({
      setCopiedBudgetItems: vi.fn(),
      getCopiedBudgetItems,
      clearCopiedBudgetItems: vi.fn(),
    });
    useToastMock.mockReturnValue({ showToast });

    renderWalletPage();

    await user.click(screen.getByRole('button', { name: /paste items/i }));

    expect(getCopiedBudgetItems).toHaveBeenCalledTimes(1);
    expect(mockReadText).not.toHaveBeenCalled();
    expect(appendItemsFromPaste).toHaveBeenCalledWith([
      { name: 'Groceries', type: '-', amount: 55 },
      { name: 'Salary', type: '+', amount: 1500 },
    ]);
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      message: '2 rows pasted.',
    });
  });

  it('shows actionable error when in-app clipboard is empty and browser read is unavailable', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    const budgetItemsValue = createBudgetItemsHookValue();

    vi.stubGlobal('navigator', Object.assign(Object.create(window.navigator), {}));
    useToastMock.mockReturnValue({ showToast });
    useBudgetItemsMock.mockReturnValue({
      ...budgetItemsValue,
    });

    renderWalletPage();

    await user.click(screen.getByRole('button', { name: /paste items/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Clipboard content has no valid budget rows.',
      });
    });
  });
});
