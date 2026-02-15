import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

import type { BudgetItem } from '../../types';

import { BudgetRow } from './BudgetRow';

describe('BudgetRow', () => {
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const item: BudgetItem = {
    id: 'i1',
    walletId: 'w1',
    order: 1,
    name: 'Rent',
    type: '-',
    amount: 1000,
    createdAt: 1,
    updatedAt: 1,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdate.mockClear();
    mockDelete.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly', () => {
    render(
      <BudgetRow item={item} rowNumber={1} onUpdate={mockUpdate} onDelete={mockDelete} />
    );
    expect(screen.getByLabelText('Item name')).toHaveValue('Rent');
    expect(screen.getByLabelText('Amount')).toHaveValue(1000);
    expect(screen.getByLabelText('Toggle type, currently -')).toBeInTheDocument();
  });

  it('toggles type immediately', () => {
    render(
      <BudgetRow item={item} rowNumber={1} onUpdate={mockUpdate} onDelete={mockDelete} />
    );
    const toggleBtn = screen.getByLabelText('Toggle type, currently -');
    fireEvent.click(toggleBtn);
    expect(mockUpdate).toHaveBeenCalledWith('i1', { type: '+' });
  });

  it('updates name after debounce', () => {
    render(
      <BudgetRow item={item} rowNumber={1} onUpdate={mockUpdate} onDelete={mockDelete} />
    );
    const input = screen.getByLabelText('Item name');
    fireEvent.change(input, { target: { value: 'New Rent' } });

    expect(mockUpdate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(mockUpdate).toHaveBeenCalledWith('i1', {
      name: 'New Rent',
      amount: 1000,
    });
  });

  it('updates amount after debounce', () => {
    render(
      <BudgetRow item={item} rowNumber={1} onUpdate={mockUpdate} onDelete={mockDelete} />
    );
    const input = screen.getByLabelText('Amount');
    fireEvent.change(input, { target: { value: '2000' } });

    expect(mockUpdate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(mockUpdate).toHaveBeenCalledWith('i1', {
      name: 'Rent',
      amount: 2000,
    });
  });

  it('saves immediately on blur', () => {
    render(
      <BudgetRow item={item} rowNumber={1} onUpdate={mockUpdate} onDelete={mockDelete} />
    );
    const input = screen.getByLabelText('Item name');
    fireEvent.change(input, { target: { value: 'Blur Rent' } });
    fireEvent.blur(input);

    expect(mockUpdate).toHaveBeenCalledWith('i1', {
      name: 'Blur Rent',
      amount: 1000,
    });
  });

  it('deletes immediately without confirmation', () => {
    render(
      <BudgetRow item={item} rowNumber={1} onUpdate={mockUpdate} onDelete={mockDelete} />
    );
    const deleteBtn = screen.getByLabelText('Delete item');
    fireEvent.click(deleteBtn);

    expect(mockDelete).toHaveBeenCalledWith('i1');
  });
});
