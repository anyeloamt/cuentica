import { Outlet } from 'react-router-dom';

import { Header } from './Header';

export function AppLayout(): JSX.Element {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-bg-primary text-text-primary">
      <Header />
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 max-w-5xl mx-auto w-full pb-16">
        <Outlet />
      </main>
    </div>
  );
}
