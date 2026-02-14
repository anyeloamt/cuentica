import { Link } from 'react-router-dom';

export function HomePage(): JSX.Element {
  return (
    <div>
      <h1>Wallets</h1>
      <p>Your wallets will appear here.</p>
      <Link to="/wallet/test-id">Test Wallet</Link>
    </div>
  );
}
