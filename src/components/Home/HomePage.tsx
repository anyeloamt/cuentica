import { useState } from 'react';

import { useWallets } from '../../hooks/useWallets';
import type { Wallet } from '../../types';

import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CreateWalletModal } from './CreateWalletModal';
import { FloatingActionButton } from './FloatingActionButton';
import { WalletList } from './WalletList';

export function HomePage(): JSX.Element {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { wallets, createWallet, deleteWallet, renameWallet, reorderWallet } =
    useWallets();

  const handleConfirmDelete = async () => {
    if (!walletToDelete || !walletToDelete.id) return;

    setIsDeleting(true);
    await deleteWallet(walletToDelete.id);
    setIsDeleting(false);
    setWalletToDelete(null);
  };

  const handleRename = async (id: string, name: string) => {
    await renameWallet(id, name);
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    await reorderWallet(id, direction);
  };

  return (
    <>
      <WalletList
        wallets={wallets}
        onDeleteWallet={setWalletToDelete}
        onRenameWallet={handleRename}
        onReorderWallet={handleReorder}
      />
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
      <ConfirmDeleteModal
        isOpen={walletToDelete !== null}
        walletName={walletToDelete?.name ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setWalletToDelete(null)}
        isDeleting={isDeleting}
      />
    </>
  );
}
