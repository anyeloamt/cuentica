import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('redirects to home', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
  });
});
