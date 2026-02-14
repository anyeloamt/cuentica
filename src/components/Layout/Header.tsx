import { useMatch, useNavigate } from 'react-router-dom';

import { useWalletName } from '../../hooks/useWalletName';
import { ThemeToggle } from '../Settings/ThemeToggle';

export function Header(): JSX.Element {
  const navigate = useNavigate();
  const walletMatch = useMatch('/wallet/:id');

  const walletId = walletMatch?.params.id;
  const walletName = useWalletName(walletId);
  const isHome = !walletMatch;

  const title = isHome ? 'Cuentica' : (walletName ?? 'Wallet');

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between h-[56px] px-4 bg-bg-primary text-text-primary border-b border-border w-full"
      data-testid="header"
    >
      <div className="flex items-center w-1/3">
        {!isHome && (
          <button
            onClick={() => navigate('/')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-3xl leading-none text-text-primary hover:text-accent transition-colors cursor-pointer"
            aria-label="Go back"
          >
            ‹
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
        {/* Placeholder for future actions */}
      </div>
    </header>
  );
}
