import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('redirects to home when navigating to nonexistent route', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /wallets/i })).toBeInTheDocument();
  });
});
