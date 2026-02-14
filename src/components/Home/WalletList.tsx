import { Link } from 'react-router-dom';

import { useWallets } from '../../hooks/useWallets';
import type { Wallet } from '../../types';

export function WalletList(): JSX.Element {
  const { wallets } = useWallets();

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
