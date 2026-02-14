import { Link } from 'react-router-dom';

import type { Wallet } from '../../types';

interface WalletListProps {
  wallets: Wallet[] | undefined;
  onDeleteWallet: (wallet: Wallet) => void;
}

export function WalletList({ wallets, onDeleteWallet }: WalletListProps): JSX.Element {
  // Ensure wallets is always treated as an array
  const walletsArray = Array.isArray(wallets) ? wallets : [];
  const walletsWithId = walletsArray.filter((wallet: Wallet) => Boolean(wallet.id));

  if (wallets === undefined) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <p>Loading wallets...</p>
      </div>
    );
  }

  if (walletsWithId.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-lg font-medium">No wallets yet</p>
        <p className="mt-1 text-sm">Create your first wallet to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {walletsWithId.map((wallet) => (
        <Link
          key={wallet.id}
          to={`/wallet/${wallet.id}`}
          className="group relative block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200"
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteWallet(wallet);
            }}
            aria-label={`Delete ${wallet.name}`}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {wallet.name}
            </h3>
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
              →
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tap to view transactions
          </p>
        </Link>
      ))}
    </div>
  );
}
