import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders main text', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/your wallets will appear here/i)).toBeInTheDocument();
  });

  it('renders sample link to test wallet', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /test wallet/i })).toBeInTheDocument();
  });
});
