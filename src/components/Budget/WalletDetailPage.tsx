import { useParams } from 'react-router-dom';

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <p>Budget for wallet: {id}</p>
    </div>
  );
}
