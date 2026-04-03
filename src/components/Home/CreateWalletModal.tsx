import { type FormEvent, useRef, useState } from 'react';

import type { CreateWalletResult } from '../../hooks/useWallets';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  createWallet: (name: string) => Promise<CreateWalletResult>;
}

export function CreateWalletModal({
  isOpen,
  onClose,
  createWallet,
}: CreateWalletModalProps): JSX.Element | null {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createWallet(name);

      if (result.ok) {
        onClose();
      } else {
        if (result.error === 'empty-name') {
          setError('Wallet name cannot be empty');
        } else if (result.error === 'db-error') {
          setError('Failed to create wallet. Please try again.');
        }
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-bg-primary rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-wallet-title"
      >
        <h2 id="create-wallet-title" className="text-xl font-bold text-text-primary">
          New Wallet
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="wallet-name" className="sr-only">
              Wallet Name
            </label>
            <input
              ref={inputRef}
              id="wallet-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Expenses"
              className="w-full px-4 py-3 rounded-lg border border-border bg-bg-secondary text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-colors"
              autoComplete="off"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
