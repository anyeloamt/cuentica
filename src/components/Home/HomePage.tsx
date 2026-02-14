import { useState } from 'react';

import { useWallets } from '../../hooks/useWallets';

import { CreateWalletModal } from './CreateWalletModal';
import { FloatingActionButton } from './FloatingActionButton';
import { WalletList } from './WalletList';

export function HomePage(): JSX.Element {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { createWallet } = useWallets();

  return (
    <>
      <WalletList />
      <FloatingActionButton
        onClick={() => setIsCreateModalOpen(true)}
        label="Add Wallet"
      />
      {isCreateModalOpen && (
        <CreateWalletModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          createWallet={createWallet}
        />
      )}
    </>
  );
}
