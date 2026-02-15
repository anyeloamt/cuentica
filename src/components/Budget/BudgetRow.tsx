import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { BudgetItem } from '../../types';

interface BudgetRowProps {
  item: BudgetItem;
  rowNumber: number;
  onUpdate: (id: string, changes: Partial<BudgetItem>) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

function BudgetRowComponent({
  item,
  rowNumber,
  onUpdate,
  onDelete,
  autoFocus,
}: BudgetRowProps) {
  // Local state for immediate feedback
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(item.amount === 0 ? '' : item.amount.toString());

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSentRef = useRef({ name: item.name, amount: item.amount });
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  // Sync local state when props change (e.g. from DB reload)
  // We check if values are different to avoid cursor jumping if possible,
  // though typically this runs when the DB actually updates.
  useEffect(() => {
    if (item.name !== name) {
      setName(item.name);
    }
    if (item.amount !== (amount === '' ? 0 : parseFloat(amount))) {
      setAmount(item.amount === 0 ? '' : item.amount.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.name, item.amount]); // Intentionally omitting name/amount from deps to avoid loops

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    lastSentRef.current = { name: item.name, amount: item.amount };
  }, [item.name, item.amount]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  if (!item.id) {
    return null;
  }

  const itemId = item.id;

  const triggerUpdate = (newName: string, newAmountStr: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const numAmount = newAmountStr === '' ? 0 : parseFloat(newAmountStr);
      lastSentRef.current = { name: newName, amount: numAmount };
      onUpdate(itemId, { name: newName, amount: numAmount });
    }, 500);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    triggerUpdate(val, amount);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string or valid numbers
    if (val === '' || !isNaN(parseFloat(val))) {
      setAmount(val);
      triggerUpdate(name, val);
    }
  };

  const handleBlur = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = undefined;
    }
    const numAmount = amount === '' ? 0 : parseFloat(amount);
    if (name !== lastSentRef.current.name || numAmount !== lastSentRef.current.amount) {
      lastSentRef.current = { name, amount: numAmount };
      onUpdate(itemId, { name, amount: numAmount });
    }
  };

  const toggleType = () => {
    const newType = item.type === '+' ? '-' : '+';
    onUpdate(itemId, { type: newType });
  };

  const handleDelete = () => {
    onDelete(itemId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 py-1.5 border-b border-border bg-bg-primary ${
        item.type === '+'
          ? 'border-l-4 border-l-green-500'
          : 'border-l-4 border-l-red-500'
      } ${isDragging ? 'shadow-lg' : ''}`}
      role="row"
    >
      <div
        {...attributes}
        {...listeners}
        className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-text-primary touch-none"
        aria-label="Drag to reorder"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </div>

      <div className="text-xs text-text-secondary w-6 text-center flex-shrink-0 font-mono">
        {rowNumber}
      </div>
      <div className="flex-grow min-w-0">
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleBlur}
          placeholder="Item name"
          className="w-full bg-transparent border-none outline-none text-text-primary placeholder-gray-400"
          aria-label="Item name"
        />
      </div>

      <button
        type="button"
        onClick={toggleType}
        className={`h-7 w-7 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
          item.type === '+'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}
        aria-label={`Toggle type, currently ${item.type}`}
      >
        {item.type}
      </button>

      <div className="w-20 sm:w-24">
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={handleAmountChange}
          onBlur={handleBlur}
          placeholder="0"
          className="w-full bg-transparent border-none outline-none text-right text-text-primary placeholder-gray-400 font-mono"
          aria-label="Amount"
        />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
        aria-label="Delete item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-[18px] h-[18px]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </div>
  );
}

export const BudgetRow = React.memo(
  BudgetRowComponent,
  (prevProps, nextProps) =>
    prevProps.rowNumber === nextProps.rowNumber &&
    prevProps.autoFocus === nextProps.autoFocus &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.amount === nextProps.item.amount
);
