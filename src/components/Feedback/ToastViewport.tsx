import { useToast } from '../../context/ToastContext';

const toastStylesByType: Record<'success' | 'error' | 'info', string> = {
  success:
    'border-success/40 bg-success/10 text-success dark:bg-success/15 dark:text-success',
  error: 'border-error/40 bg-error/10 text-error dark:bg-error/15 dark:text-error',
  info: 'border-text-muted/40 bg-bg-secondary text-text-primary dark:bg-bg-secondary dark:text-text-primary',
};

/**
 * Renders the global toast stack in a fixed bottom viewport.
 */
export function ToastViewport(): JSX.Element | null {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed left-0 right-0 z-40 flex justify-center px-3"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
    >
      <div className="flex w-full max-w-xl flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${toastStylesByType[toast.type]}`}
          >
            <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
              aria-label="Dismiss toast"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
