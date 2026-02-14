import { Link } from 'react-router-dom';

import { useWallets } from '../../hooks/useWallets';

export function WalletList(): JSX.Element {
  const wallets = useWallets();

  if (!wallets) {
    return <p>Loading wallets...</p>;
  }

  const walletsWithId = wallets.filter((wallet) => Boolean(wallet.id));

  if (walletsWithId.length === 0) {
    return <p>No wallets yet.</p>;
  }

  return (
    <ul>
      {walletsWithId.map((wallet) => (
        <li key={wallet.id}>
          <Link to={`/wallet/${wallet.id}`}>{wallet.name}</Link>
        </li>
      ))}
    </ul>
  );
}
