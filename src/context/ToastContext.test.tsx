import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { ToastProvider, useToast } from './ToastContext';

function ToastHarness(): JSX.Element {
  const { toasts, showToast } = useToast();

  return (
    <div>
      <button
        type="button"
        onClick={() => showToast({ type: 'success', message: 'Saved', durationMs: 500 })}
      >
        Show toast
      </button>
      <span data-testid="toast-count">{toasts.length}</span>
      {toasts.map((toast) => (
        <p key={toast.id}>{toast.message}</p>
      ))}
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows toast and auto-dismisses after duration', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Show toast' }).click();
    });

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });
});
