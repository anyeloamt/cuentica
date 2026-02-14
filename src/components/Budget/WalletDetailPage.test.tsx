import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { WalletDetailPage } from './WalletDetailPage';

describe('WalletDetailPage', () => {
  it('renders wallet ID from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/abc123']}>
        <Routes>
          <Route path="/wallet/:id" element={<WalletDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/budget for wallet: abc123/i)).toBeInTheDocument();
  });
});
