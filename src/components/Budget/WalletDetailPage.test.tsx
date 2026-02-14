import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { WalletDetailPage } from './WalletDetailPage';

// Mock the hook
vi.mock('../../hooks/useBudgetItems', () => ({
  useBudgetItems: () => ({
    items: [],
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  }),
}));

describe('WalletDetailPage', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/abc123']}>
        <Routes>
          <Route path="/wallet/:id" element={<WalletDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // It should render "No items yet" since items is []
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });
});
