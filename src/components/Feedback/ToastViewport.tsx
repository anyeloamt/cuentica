import { useToast } from '../../context/ToastContext';

const toastStylesByType: Record<'success' | 'error' | 'info', string> = {
  success:
    'border-green-500/40 bg-green-50 text-green-800 dark:bg-green-900/85 dark:text-green-100',
  error: 'border-red-500/40 bg-red-50 text-red-800 dark:bg-red-900/85 dark:text-red-100',
  info: 'border-slate-500/40 bg-slate-50 text-slate-800 dark:bg-slate-900/85 dark:text-slate-100',
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
