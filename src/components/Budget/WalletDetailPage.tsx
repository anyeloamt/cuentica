import { Link, useParams } from 'react-router-dom';

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h1>Wallet Detail</h1>
      <p>Budget for wallet: {id}</p>
      <Link to="/">← Back to Wallets</Link>
    </div>
  );
}
