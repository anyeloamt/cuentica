import { useMatch, useNavigate, Link } from 'react-router-dom';

import { useWalletName } from '../../hooks/useWalletName';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../Settings/ThemeToggle';

import { SyncIndicator } from './SyncIndicator';

export function Header(): JSX.Element {
  const navigate = useNavigate();
  const walletMatch = useMatch('/wallet/:id');

  const walletId = walletMatch?.params.id;
  const walletName = useWalletName(walletId);
  const isHome = !walletMatch;

  const { user, loading, isConfigured } = useAuth();
  const title = isHome ? 'Cuentica' : (walletName ?? 'Wallet');

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between h-12 px-4 bg-bg-primary text-text-primary border-b border-border w-full"
      data-testid="header"
    >
      <div className="flex items-center w-1/3">
        {!isHome && (
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center -ml-2 rounded-full text-text-primary hover:text-accent hover:bg-bg-secondary transition-all cursor-pointer"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex justify-center w-1/3">
        <h1 className="text-lg font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis text-accent">
          {title}
        </h1>
      </div>

      <div className="flex items-center justify-end w-1/3 gap-2">
        <ThemeToggle />
        {!loading && user && <SyncIndicator />}
        {!loading && user && (
          <Link
            to="/auth"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {user.email?.charAt(0).toUpperCase()}
          </Link>
        )}
        {!loading && !user && isConfigured && (
          <Link to="/auth" className="text-sm font-medium text-accent hover:underline">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
