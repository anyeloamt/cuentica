import { useParams } from 'react-router-dom';

import { useBudgetItems } from '../../hooks/useBudgetItems';

import { BudgetTable } from './BudgetTable';

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const walletId = id ?? '';

  const { items, addItem, updateItem, deleteItem, restoreItem } =
    useBudgetItems(walletId);

  const handleAddItem = async () => {
    const result = await addItem();
    return result.ok ? result.id : undefined;
  };

  return (
    <div className="h-full flex flex-col">
      <BudgetTable
        items={items}
        onAddItem={handleAddItem}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onRestoreItem={restoreItem}
      />
    </div>
  );
}
