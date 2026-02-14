import { useParams } from 'react-router-dom';

import { useBudgetItems } from '../../hooks/useBudgetItems';

import { BudgetTable } from './BudgetTable';

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const walletId = id ?? '';

  const { items, addItem, updateItem, deleteItem } = useBudgetItems(walletId);

  return (
    <div className="h-full flex flex-col">
      <BudgetTable
        items={items}
        onAddItem={addItem}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
      />
    </div>
  );
}
