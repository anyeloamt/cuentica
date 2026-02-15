import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { AppLayout } from './AppLayout';

vi.mock('./Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

describe('AppLayout', () => {
  it('renders Header and child content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders Outlet for wallet detail route', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/123']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/wallet/:id"
              element={<div data-testid="wallet-page">Wallet</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-page')).toBeInTheDocument();
  });
});
