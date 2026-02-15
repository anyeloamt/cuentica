import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BudgetItem } from '../../types';

import { BudgetTable } from './BudgetTable';

describe('BudgetTable', () => {
  const mockAddItems = vi.fn().mockResolvedValue({ ok: true, ids: [] });
  const mockTrimRows = vi.fn();
  const mockUpdateItem = vi.fn();
  const mockDeleteItem = vi.fn().mockResolvedValue({ ok: true });

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
      />
    );

    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();

    // Total should be 5000 - 1500 = 3500
    expect(screen.getByText('+$3,500.00')).toBeInTheDocument();
  });

  it('handles add item click', () => {
    render(
      <BudgetTable
        items={[]}
        onAddItems={mockAddItems}
        onTrimRows={mockTrimRows}
        onUpdateItem={mockUpdateItem}
        onDeleteItem={mockDeleteItem}
      />
    );

    fireEvent.click(screen.getByText('+ Add rows'));
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
      />
    );

    expect(screen.getByText('-$100.00')).toBeInTheDocument();
  });
});
