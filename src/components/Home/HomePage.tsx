import { useCallback, useEffect, useState } from 'react';

import { useWallets } from '../../hooks/useWallets';
import { useToast } from '../../context/ToastContext';
import type { Wallet } from '../../types';

import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CreateWalletModal } from './CreateWalletModal';
import { FloatingActionButton } from './FloatingActionButton';
import { WalletList } from './WalletList';

export function HomePage(): JSX.Element {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedWallet, setDeletedWallet] = useState<Wallet | null>(null);
  const {
    wallets,
    createWallet,
    deleteWallet,
    restoreWallet,
    renameWallet,
    reorderWallets,
  } = useWallets();
  const [cachedWallets, setCachedWallets] = useState<Wallet[] | undefined>(undefined);
  const { showToast } = useToast();

  useEffect(() => {
    if (wallets !== undefined) {
      setCachedWallets(wallets);
    }
  }, [wallets]);

  useEffect(() => {
    if (!deletedWallet) return;
    const timer = setTimeout(() => {
      setDeletedWallet(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [deletedWallet]);

  const handleCreateWallet = useCallback(
    async (name: string) => {
      const result = await createWallet(name);
      if (result.ok) {
        showToast({ type: 'success', message: 'Wallet created!' });
      }
      return result;
    },
    [createWallet, showToast]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!walletToDelete || !walletToDelete.id) return;

    setIsDeleting(true);
    const result = await deleteWallet(walletToDelete.id);
    setIsDeleting(false);
    if (result.ok) {
      setDeletedWallet(walletToDelete);
    }
    setWalletToDelete(null);
  }, [deleteWallet, walletToDelete]);

  const handleUndoDelete = useCallback(async () => {
    if (!deletedWallet?.id) return;
    const result = await restoreWallet(deletedWallet.id);
    if (result.ok) {
      showToast({ type: 'success', message: `"${deletedWallet.name}" restored` });
    } else {
      showToast({ type: 'error', message: 'Failed to restore wallet' });
    }
    setDeletedWallet(null);
  }, [deletedWallet, restoreWallet, showToast]);

  const handleRename = useCallback(
    async (id: string, name: string) => {
      await renameWallet(id, name);
    },
    [renameWallet]
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
        onReorderWallets={reorderWallets}
      />
      <FloatingActionButton onClick={handleOpenCreateModal} label="Add Wallet" />
      {isCreateModalOpen && (
        <CreateWalletModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          createWallet={handleCreateWallet}
        />
      )}
      <ConfirmDeleteModal
        isOpen={walletToDelete !== null}
        walletName={walletToDelete?.name ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
      {deletedWallet && (
        <div
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-bg-inverse text-text-inverse px-4 py-3 rounded-lg shadow-lg z-20 flex items-center gap-4"
        >
          <span>&ldquo;{deletedWallet.name}&rdquo; deleted</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="font-semibold text-accent hover:text-accent/70 cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </>
  );
}
