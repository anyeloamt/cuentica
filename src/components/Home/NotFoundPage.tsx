import { Navigate } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  return <Navigate to="/" replace />;
}
