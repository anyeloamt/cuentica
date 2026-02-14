import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';

import { ThemeProvider, useTheme } from './ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(localStorage.getItem('cuentica-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('loads theme from localStorage', () => {
    localStorage.setItem('cuentica-theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByText('Toggle');

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    act(() => {
      button.click();
    });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('cuentica-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      button.click();
    });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    expect(localStorage.getItem('cuentica-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('updates meta theme-color when theme changes', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByText('Toggle');

    expect(meta.getAttribute('content')).toBe('#ffffff');

    act(() => {
      button.click();
    });
    expect(meta.getAttribute('content')).toBe('#1a1a2e');

    document.head.removeChild(meta);
  });

  it('falls back to light theme for invalid localStorage values', () => {
    localStorage.setItem('cuentica-theme', 'purple');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );

    consoleSpy.mockRestore();
  });
});
