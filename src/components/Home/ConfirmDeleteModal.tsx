import { useRef, useEffect } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  walletName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  walletName,
  onConfirm,
  onCancel,
  isDeleting,
}: ConfirmDeleteModalProps): JSX.Element | null {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-wallet-title"
      >
        <h2
          id="delete-wallet-title"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          Delete {walletName}?
        </h2>

        <p className="text-gray-500 dark:text-gray-400">
          All budget items in this wallet will be lost. This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end pt-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
