import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Cuentica')).toBeInTheDocument();
  });

  it('renders HomePage at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /wallets/i })).toBeInTheDocument();
  });

  it('renders WalletDetailPage at /wallet/:id', () => {
    render(
      <MemoryRouter initialEntries={['/wallet/abc']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/budget for wallet: abc/i)).toBeInTheDocument();
  });

  it('redirects /nonexistent to home', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );
    // NotFoundPage redirects to /, so HomePage should render
    expect(screen.getByRole('heading', { name: /wallets/i })).toBeInTheDocument();
  });
});
