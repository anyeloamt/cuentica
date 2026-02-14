import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { BottomTotal } from './BottomTotal';

describe('BottomTotal', () => {
  it('renders with placeholder total', () => {
    render(<BottomTotal />);
    expect(screen.getByTestId('bottom-total')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
