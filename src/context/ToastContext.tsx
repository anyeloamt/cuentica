import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  durationMs: number;
}

interface ShowToastInput {
  type: ToastType;
  message: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (input: ShowToastInput) => void;
  dismissToast: (id: string) => void;
}

const DEFAULT_TOAST_DURATION_MS = 3000;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Provides global toast queue state and toast actions.
 */
export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string): void => {
    const timerId = timersRef.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, durationMs }: ShowToastInput): void => {
      const id = crypto.randomUUID();
      const resolvedDuration = durationMs ?? DEFAULT_TOAST_DURATION_MS;

      setToasts((prevToasts) => [
        ...prevToasts,
        {
          id,
          type,
          message,
          durationMs: resolvedDuration,
        },
      ]);

      const timerId = window.setTimeout(() => {
        dismissToast(id);
      }, resolvedDuration);

      timersRef.current.set(id, timerId);
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts, showToast, dismissToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * Returns toast state/actions from the nearest provider.
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
