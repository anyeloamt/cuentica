import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';

const mockUseWallets = vi.fn();

vi.mock('../../hooks/useWallets', () => ({
  useWallets: () => mockUseWallets(),
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    mockUseWallets.mockReset();
    mockUseWallets.mockReturnValue([]);
  });

  it('redirects to home when navigating to nonexistent route', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });
});
