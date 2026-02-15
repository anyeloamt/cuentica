import { useCallback, useEffect, useState } from 'react';

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
  const [cachedWallets, setCachedWallets] = useState<Wallet[] | undefined>(undefined);

  useEffect(() => {
    if (wallets !== undefined) {
      setCachedWallets(wallets);
    }
  }, [wallets]);

  const handleConfirmDelete = useCallback(async () => {
    if (!walletToDelete || !walletToDelete.id) return;

    setIsDeleting(true);
    await deleteWallet(walletToDelete.id);
    setIsDeleting(false);
    setWalletToDelete(null);
  }, [deleteWallet, walletToDelete]);

  const handleRename = useCallback(
    async (id: string, name: string) => {
      await renameWallet(id, name);
    },
    [renameWallet]
  );

  const handleReorder = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      await reorderWallet(id, direction);
    },
    [reorderWallet]
  );

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setWalletToDelete(null);
  }, []);

  return (
    <>
      <WalletList
        wallets={wallets ?? cachedWallets}
        onDeleteWallet={setWalletToDelete}
        onRenameWallet={handleRename}
        onReorderWallet={handleReorder}
      />
      <FloatingActionButton onClick={handleOpenCreateModal} label="Add Wallet" />
      {isCreateModalOpen && (
        <CreateWalletModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          createWallet={createWallet}
        />
      )}
      <ConfirmDeleteModal
        isOpen={walletToDelete !== null}
        walletName={walletToDelete?.name ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
