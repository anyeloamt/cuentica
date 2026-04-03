import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BudgetItem } from '../../types';

import { BudgetTable } from './BudgetTable';

const showToast = vi.fn();

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast,
  }),
}));

describe('BudgetTable', () => {
  const mockAddItems = vi.fn().mockResolvedValue({ ok: true, ids: [] });
  const mockTrimRows = vi.fn();
  const mockUpdateItem = vi.fn();
  const mockDeleteItem = vi.fn().mockResolvedValue({ ok: true });
  const mockInsertBelow = vi.fn().mockResolvedValue({ ok: true, id: 'inserted-id' });
  const mockReorderItems = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    showToast.mockReset();
    mockInsertBelow.mockReset();
    mockInsertBelow.mockResolvedValue({ ok: true, id: 'inserted-id' });
  });

  const items: BudgetItem[] = [
    {
      id: 'i1',
      walletId: 'w1',
      order: 1,
      name: 'Salary',
      type: '+',
      amount: 5000,
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'i2',
      walletId: 'w1',
      order: 2,
      name: 'Rent',
      type: '-',
      amount: 1500,
      createdAt: 2,
      updatedAt: 2,
    },
  ];

  it('renders loading state when items are undefined', () => {
    render(
      <BudgetTable
        items={undefined}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state when items are empty', () => {
    render(
      <BudgetTable
        items={[]}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );
    expect(screen.getByText('No items yet.')).toBeInTheDocument();
  });

  it('renders items and calculates total correctly', () => {
    render(
      <BudgetTable
        items={items}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );

    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();

    // Income: +5000
    expect(screen.getByText('+5,000.00')).toBeInTheDocument();
    // Expenses: -1500
    expect(screen.getByText('-1,500.00')).toBeInTheDocument();
    // Total: +3500
    expect(screen.getByText('+3,500.00')).toBeInTheDocument();
  });

  it('handles add item click', () => {
    render(
      <BudgetTable
        items={[]}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );

    fireEvent.click(screen.getByText('Add rows'));
    expect(mockAddItems).toHaveBeenCalled();
  });

  it('handles negative total', () => {
    const negativeItems: BudgetItem[] = [
      {
        id: 'i1',
        walletId: 'w1',
        order: 1,
        name: 'Debt',
        type: '-',
        amount: 100,
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    render(
      <BudgetTable
        items={negativeItems}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );

    expect(screen.getByText('+0.00')).toBeInTheDocument(); // Income
    // Use getAllByText because "-100.00" appears twice (Expenses and Total)
    const negativeValues = screen.getAllByText('-100.00');
    expect(negativeValues).toHaveLength(2);
  });

  it('autofocuses the row matching inserted id after insert-below succeeds', async () => {
    const focusedInsertId = 'inserted-row-id';
    mockInsertBelow.mockResolvedValueOnce({ ok: true, id: focusedInsertId });

    const itemsWithInsertedTarget: BudgetItem[] = [
      {
        id: 'source-row-id',
        walletId: 'w1',
        order: 1000,
        name: 'Source row',
        type: '-',
        amount: 100,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: focusedInsertId,
        walletId: 'w1',
        order: 2000,
        name: 'Inserted target',
        type: '-',
        amount: 0,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    render(
      <BudgetTable
        items={itemsWithInsertedTarget}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );

    const insertButtons = screen.getAllByLabelText('Insert item below');
    fireEvent.click(insertButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Inserted target')).toHaveFocus();
    });
  });

  it('shows error toast when insert-below fails', async () => {
    mockInsertBelow.mockResolvedValueOnce({ ok: false, error: 'db-error' });

    render(
      <BudgetTable
        items={items}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
        onInsertBelow={mockInsertBelow}
        onReorderItems={mockReorderItems}
      />
    );

    fireEvent.click(screen.getAllByLabelText('Insert item below')[0]);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to insert row',
      });
    });
  });
});
