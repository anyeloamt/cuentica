import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ThemeProvider } from '../../context/ThemeContext';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders correctly', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();

    fireEvent.click(button);
    expect(button.querySelector('svg')).toBeInTheDocument();

    fireEvent.click(button);
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to dark mode'
    );
  });
});
