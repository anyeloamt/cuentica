import { useState } from 'react';

import { CreateWalletModal } from './CreateWalletModal';
import { FloatingActionButton } from './FloatingActionButton';
import { WalletList } from './WalletList';

export function HomePage(): JSX.Element {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <WalletList />
      <FloatingActionButton
        onClick={() => setIsCreateModalOpen(true)}
        label="Add Wallet"
      />
      <CreateWalletModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
