import { Outlet, useLocation } from 'react-router-dom';

import { Header } from './Header';
import { BottomTotal } from './BottomTotal';

export function AppLayout(): JSX.Element {
  const location = useLocation();
  const showFooter = location.pathname.startsWith('/wallet/');

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-bg-primary text-text-primary">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full pb-20">
        <Outlet />
      </main>
      {showFooter && <BottomTotal />}
    </div>
  );
}
