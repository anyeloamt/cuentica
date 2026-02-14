import { Link } from 'react-router-dom';

export function HomePage(): JSX.Element {
  return (
    <div>
      <p>Your wallets will appear here.</p>
      <Link to="/wallet/test-id">Test Wallet</Link>
    </div>
  );
}
